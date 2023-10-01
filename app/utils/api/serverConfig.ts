import { NastoolServerConfig } from "./api";
import { APIBase } from "./api_base";

export class ServerConfig extends APIBase {
    private _serverConfig: NastoolServerConfig | undefined = undefined
    constructor() {
        super();
    }

    public async get() {
        const config = await (await this.API).getServerConfig();
        this._serverConfig = config;
        return config
    }

    public async update(config:NastoolServerConfig) {
        if(await (await this.API).updateServerConfig(config)) {
            return this.get();
        }
    }
}