import { NastoolServerConfig } from "./api";
import { APIDataResourceBase } from "./api_base";

export class ServerConfig extends APIDataResourceBase<NastoolServerConfig> {
    private _serverConfig: NastoolServerConfig | undefined = undefined

    public async get(refresh = false) {
        if (this._serverConfig == undefined || refresh) this._serverConfig = await (await this.API).getServerConfig();
        // this._serverConfig = config;
        return this._serverConfig
    }

    public dataHook(options?: undefined): Promise<NastoolServerConfig> {
        return this.get();    
    }

    public async update(config: NastoolServerConfig) {
        if (await (await this.API).updateServerConfig(config)) {
            return this.get(true);
        }
    }
}