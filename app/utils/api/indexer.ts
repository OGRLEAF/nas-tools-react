import { APIBase, APIResourceBase } from "./api_base";

export interface IndexerSite {
    id: string,
    name: string,
    domain: string,
    public: boolean,
    enabled: boolean,
}


export class Indexers extends APIResourceBase<IndexerSite> {
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
}
