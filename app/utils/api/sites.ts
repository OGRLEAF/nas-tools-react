import { APIBase } from "./api_base";


export class Sites extends APIBase {
    constructor() {
        super();
    }

    public async sites({ rss, brush, statistic, }: {
        rss?: boolean,
        brush?: boolean,
        statistic?: boolean,
    } = {}) {
        return (await this.API).getSiteList({
            rss,
            brush,
            statistic
        });
    }

    public async indexers() {
        return (await this.API).getIndexers();
    }
}