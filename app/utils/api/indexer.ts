import { NastoolServerConfig } from "./api";
import { APIBase, APIArrayResourceBase, APIDataResourceBase, ResourceType } from "./api_base";
import { ServerConfig } from "./serverConfig";

export interface IndexerSite {
    id: string,
    name: string,
    domain: string,
    public: boolean,
    enabled: boolean,
}

export interface IndexerResource extends ResourceType {
    ItemType: IndexerSite
}

export class Indexers extends APIArrayResourceBase<IndexerResource> {
    constructor() {
        super();
    }

    async list<IndexerSite>() {
        const result = await (await this.API).post<{ indexers: IndexerSite[] }>("site/indexers", { auth: true });
        return result.indexers
    }

    protected async listHook<IndexerSite>(): Promise<IndexerSite[]> {
        return this.list()
    }

    protected async updateManyHook(value: IndexerSite[]): Promise<void> {
        console.log(value)
    }

}

export class IndexerEnabledSites extends APIDataResourceBase<IndexerSite['id'][]>{
    private setting: ServerConfig;
    constructor() {
        super();
        this.setting = new ServerConfig()
    }
    async list() {
        const setting = this.setting.get();
        return (await setting).pt.indexer_sites
    }

    protected async dataHook() {
        return this.list()
    }

    protected async updateHook(value: string[]): Promise<boolean> {
        console.log(value)
        this.setting.update({
            pt: {
                indexer_sites: value
            }
        } as NastoolServerConfig)
        return true
    }
}