import axios from "axios";
import { NastoolConfig, NastoolLoginConfig, NastoolLoginResData, NastoolServerConfig } from "./api";
import { objectToFormData } from "./api_utils";
import ClientStorage from "../storage";

type NastoolApi = string;

interface NastoolResponse {
    code: number,
    success: boolean,
    message: string,
    data?: any
}

function useStorage() {
    return localStorage
}
export enum DBMediaType {
    MOVIE = "MOV",
    TV = "TV"
}

enum NTErrorType {
    AUTH_ERROR,

}

class NTError extends Error {
    public readonly type: NTErrorType;
    constructor(m: string, type: NTErrorType) {
        super(m);
        this.type = type;
    }
}
class NTAuthFailError extends NTError {
    constructor(m: string) {
        super(m, NTErrorType.AUTH_ERROR);
    }
}

export class NASTOOL {
    private config: NastoolConfig;
    private baseUrl: string;
    private apiBaseUrl: string;
    private token: string | null = null;
    private serverConfig: NastoolServerConfig | undefined = undefined;
    private storage: ClientStorage<NastoolLoginResData>;
    // public message: NastoolMessage | null = null;
    public hook: {
        onLoginRequired?: () => (Promise<NastoolLoginConfig>)
    } = {};

    private static instance: NASTOOL;
    constructor(config: NastoolConfig, apiBasePath = "/api/v1") {
        this.config = config;
        this.baseUrl = `http${this.config.https ? 's' : ''}://${this.config.host}:${this.config.port}`
        this.apiBaseUrl = `${this.baseUrl}${apiBasePath}/`
        this.storage = new ClientStorage('nastool');
    }

    public async restoreLogin() {
        const cachedLogin: NastoolLoginResData | undefined = this.storage.getItem('db:nastool-login-cache');
        if (cachedLogin) {
            try {
                this.token = cachedLogin.token;
                const configInfo: NastoolServerConfig | undefined = await this.getServerConfig();
                this.serverConfig = configInfo;
                console.log("Login ok ", this.token)
                return true
            } catch (e) {
                this.token = null;
                await useStorage().removeItem("db:nastool-login-cache");
                return false
            }
        }
        return false;
    }
    public async getServerConfig() {
        const config = await this.post<NastoolServerConfig>("config/info", { auth: true });
        this.serverConfig = config;
        return config;
    }

    public async init() {
        // this.message = new NastoolMessage(`ws${this.config.https ? 's' : ''}://${this.config.host}:${this.config.port}/message`);
    }

    public async login({ username, password }: NastoolLoginConfig): Promise<boolean> {
        const loginResp: NastoolLoginResData | undefined = await this.post<NastoolLoginResData>("user/login", { data: { username, password } });
        if (loginResp) {
            this.storage.setItem('db:nastool-login-cache', loginResp);
            this.token = loginResp.token;
        }

        try {
            const configInfo: NastoolServerConfig | undefined = await this.getServerConfig();
            this.serverConfig = configInfo;
            console.log("Login ok", this.token)
            return true
        } catch (e) {
            console.log(e);
            this.token = null;

            await useStorage().removeItem("db:nastool-login-cache");
        }
        return false;
    }

    public _get_image_proxy_url(server_url: string, legacy = false) {
        if (legacy) {
            return `img?url=${server_url}`
        } else {
            return `${this.baseUrl}/imgx?url=${server_url}&apikey=${this.serverConfig?.security.api_key}`
        }
    }

    protected async get<T>(api: NastoolApi, options: { auth?: boolean, params?: Record<string, string> } = {}): Promise<T> {
        return await this.request<T>(api, "get", {
            params: {
                ...options.params,
                // apikey: options.auth ? this.serverConfig?.security.api_key : undefined
            },
            auth: options.auth
        })
    }

    protected async post<T>(api: NastoolApi, options: { auth?: boolean, json?: boolean, data?: Record<string, string> | any, params?: Record<string, string> } = {}): Promise<T> {
        // const formData =//new FormData();
        // Object.entries<string>(options.data || {}).forEach(([k, v]) => formData.append(k, v));

        return await this.request<T>(api, "post", {
            params: options.params,
            data: options.json ? options.data : objectToFormData(options.data || {}),
            auth: options.auth
        })
    }

    private async request<T>(api: NastoolApi, method: "get" | "post", options: { params?: any, data?: FormData | any, auth?: boolean }): Promise<T> {
        try {
            return await this._request(api, method, options,)
        } catch (e) {
            if (e instanceof NTError) {
                switch (e.type) {
                    case NTErrorType.AUTH_ERROR:
                        if (this.hook.onLoginRequired) {
                            const loginConfig = await this.hook.onLoginRequired()
                            await this.login(loginConfig)
                            return await this.request(api, method, options)
                        }
                        break;
                }
            }
            throw e;
        }
    }

    private async _request<T>(api: NastoolApi, method: "get" | "post", options: { params?: any, data?: FormData | any, auth?: boolean }): Promise<T> {
        const headers = {
            // ...(options.data?options.data.),
            ...(options.auth ? { Authorization: this.token } : {})
        }
        const request = async (retry: boolean = true): Promise<T> => {
            const req = await axios.request({
                baseURL: this.apiBaseUrl,
                method: method,
                url: api,
                data: options.data,
                params: options.params,
                headers: headers
            })
            const data: NastoolResponse = req.data;
            if (data.code == 0 && data.success == true) {
                return data.data as T;
            }
            else {
                if (data.code == 403) {
                    throw new NTAuthFailError(data.message)
                }
                else
                    throw new Error(`Nastool request error code=${data.code} sucess=${data.success} message=${data.message}`);
            }
        }
        return request();
    }
}

export class API {
    private static nastool_instance: NASTOOL | null = null;
    public static onNastoolConfigRequired: (() => Promise<NastoolConfig>) | null = null;
    public static onNastoolLoginRequired: (() => Promise<NastoolLoginConfig>) | null = null;
    private static queue: Promise<void> = Promise.resolve()
    public static async getNastoolInstance(): Promise<NASTOOL> {
        await this.queue;
        const executionPromise = this.queue.then(async () => {
            return await this._getNastoolInstance()
        })
        executionPromise.catch((e) => {
            throw new Error("Get nastool instance failed.", e);
        })
        return executionPromise;
    }
    private static async _getNastoolInstance(): Promise<NASTOOL> {
        if (this.nastool_instance == null) {
            if (this.onNastoolConfigRequired) {
                // console.log("call nastool config required");
                const nastoolConfig = await this.onNastoolConfigRequired();
                // console.log("Fetched ok,", nastoolConfig)
                const nastool_instance = new NASTOOL(nastoolConfig);
                if (await nastool_instance.restoreLogin()) {
                    this.nastool_instance = nastool_instance;
                } else {
                    if (this.onNastoolLoginRequired) {
                        const { username, password } = await this.onNastoolLoginRequired();
                        const loginOk = await nastool_instance.login({ username: username, password: password })
                        if (loginOk) {
                            this.nastool_instance = nastool_instance;
                            return this.nastool_instance
                        } else {
                            throw new Error("Nastool login failed.");
                        }
                    } else {
                        throw new Error("Nastool login failed: cannot get login info.");
                    }
                }
                this.nastool_instance.init();
                return this.nastool_instance
            }
            throw new Error("Unable to get nastool");
        } else {
            return this.nastool_instance
        }
    }

}