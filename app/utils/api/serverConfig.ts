import { NastoolServerConfig, NastoolServerConfigUpdate } from "./api";
import { APIDataResourceBase } from "./api_base";



export class ServerConfig extends APIDataResourceBase<NastoolServerConfig> {
    private _serverConfig: NastoolServerConfig | undefined = undefined

    public async get(refresh = false) {
        if (this._serverConfig == undefined || refresh) this._serverConfig = await (await this.API).getServerConfig();
        return this._serverConfig
    }

    public dataHook(options?: undefined): Promise<NastoolServerConfig> {
        return this.get(true);
    }

    public async update(config: NastoolServerConfigUpdate) {
        if (await this.API.updateServerConfig(config)) {
            return this.get(true);
        }
    }


    public async updateHook(value: NastoolServerConfigUpdate): Promise<boolean> {
        this.update(value);
        return true
    }
}