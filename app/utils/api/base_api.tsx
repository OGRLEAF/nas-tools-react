import axios from "axios";
import ClientStorage from "../storage"

type NastoolApi =
    "user/login" |
    "config/info" |
    "media/search" |
    "media/detail" |
    "media/tv/seasons" |
    "service/name/test" |
    "page/brief" |
    "page/listdir" |
    "organization/import/dryrun" |
    "organization/import/group" |
    "site/list" |
    "site/statistics" |
    "site/indexers" |
    "site/resources" |
    "site/update" |
    "download/config/list" |
    "library/mediaserver/library" |
    "library/mediaserver/library/item" |
    "filterrule/list/basic"

type NastoolLoginResData = {
    token: string;
    apikey: string;
    userinfo: {
        userid: number;
        username: string;
        userpris: string[]
    }
}

export interface NastoolConfig {
    https: boolean;
    host: string;
    port: number;
}

export interface NastoolLoginConfig {
    username: string,
    password: string
}

interface NastoolPersistedConfig {
    https: boolean,
    host: string,
    port: number,
    api_key: string,
}
export type NastoolServerAppConfig = {
    debug: boolean,
    logtype: "file" | "console" | "server",
    logpath: string,
    logserver: string,
    loglevel: "debug" | "info" | "error",
    web_host: string,
    web_port: string,
    login_user: string,
    login_password: string,
    ssl_cert: string,
    ssl_key: string,
    rmt_tmdbkey: string,
    rmt_match_mode: "normal",
    proxies: {
        https: string,
        http: string,
    },
    domain: string,
    user_agent: string,
    wallpaper: "bing" | "themoviedb",
    tmdb_domain: string,
    releases_update_only: boolean,
    tmdb_image_url: string
}

export type NastoolServerConfig = {
    app: NastoolServerAppConfig,
    media: any,
    security: {
        api_key: string
    }
}

export interface NastoolResponse {
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
    private serverConfig: NastoolServerConfig | null = null;
    private storage: ClientStorage<NastoolLoginResData>;
    public hook: {
        onLoginRequired?: () => (Promise<NastoolLoginConfig>)
    } = {};
    constructor(config: NastoolConfig, apiBasePath = "/api/v1") {
        this.config = config;
        this.baseUrl = `http${this.config.https ? 's' : ''}://${this.config.host}:${this.config.port}`
        this.apiBaseUrl = `${this.baseUrl}${apiBasePath}/`
        this.storage = new ClientStorage('nastool');
    }

    public async restoreLogin() {
        console.log("Restore login.")
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


    public async login({ username, password }: NastoolLoginConfig): Promise<boolean> {
        const loginResp: NastoolLoginResData | undefined = await this.post<NastoolLoginResData>("user/login", { data: { username, password } });
        if (loginResp) {
            this.storage.setItem('db:nastool-login-cache', loginResp);
            this.token = loginResp.token;
        }

        try {
            const configInfo: NastoolServerConfig | undefined = await this.getServerConfig();
            this.serverConfig = configInfo;
            console.log("Login ok ", this.token)
            return true
        } catch (e) {
            console.log(e);
            this.token = null;

            await useStorage().removeItem("db:nastool-login-cache");
        }
        return false;
    }


    public async getServerConfig() {
        return await this.post<NastoolServerConfig>("config/info", { auth: true });
    }


    public _get_image_proxy_url(server_url: string) {
        return `${this.baseUrl}/imgx?url=${server_url}&apikey=${this.serverConfig?.security.api_key}`
    }

    private async get<T>(api: NastoolApi, options: { auth?: boolean, params?: Record<string, string> } = {}): Promise<T> {
        return await this.request<T>(api, "get", {
            params: options.params,
            auth: options.auth
        })
    }

    private async post<T>(api: NastoolApi, options: { auth?: boolean, json?: boolean, data?: Record<string, string> | any, params?: Record<string, string> } = {}): Promise<T> {
        const formData = new FormData();
        Object.entries<string>(options.data || {}).forEach(([k, v]) => formData.append(k, v));
        return await this.request<T>(api, "post", {
            params: options.params,
            data: options.json ? options.data : formData,
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
    public static async getNastoolInstance(): Promise<NASTOOL> {
        if (this.nastool_instance == null) {
            if (this.onNastoolConfigRequired) {
                // console.log("call nastool config required");
                const nastoolConfig = await this.onNastoolConfigRequired();
                // console.log("Fetched ok,", nastoolConfig)
                const nastool_instance = new NASTOOL(nastoolConfig);
                // nastool_instance.hook.onLoginRequired = async ()=>{
                //     if(this.onNastoolLoginRequired)
                //         return await this.onNastoolLoginRequired();
                //     else {
                //         throw Error("No login entry");
                //     }
                // }

                if (await nastool_instance.restoreLogin()) {
                    this.nastool_instance = nastool_instance;
                    return this.nastool_instance;
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
                    }
                }
            }
            throw new Error("Unable to get nastool");
        } else {
            return this.nastool_instance
        }
    }

}