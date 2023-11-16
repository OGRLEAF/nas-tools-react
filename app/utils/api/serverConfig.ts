import { NastoolServerConfig } from "./api";
import { APIBase } from "./api_base";

export class ServerConfig extends APIBase {
    private _serverConfig: NastoolServerConfig | undefined = undefined
    constructor() {
        super();
    }

    public async get(refresh = false) {
        if (this._serverConfig == undefined || refresh) this._serverConfig = await (await this.API).getServerConfig();
        // this._serverConfig = config;
        return this._serverConfig
    }

    public async update(config: NastoolServerConfig) {
        if (await (await this.API).updateServerConfig(config)) {
            return this.get(true);
        }
    }
}