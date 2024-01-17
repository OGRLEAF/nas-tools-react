import { APIArrayResourceBase, APIBase, ResourceType } from "./api_base";

export type SiteProfile = {
    id: number,
    name: string,
    pri: "1",
    rssurl: string,
    signurl: string,
    cookie: string,
    rule: string,
    download_setting: string,
    rss_enable: boolean,
    brush_enable: boolean,
    statistic_enable: boolean,
    uses: string[],
    ua: string,
    parse: boolean,
    unread_msg_notify: boolean,
    chrome: boolean,
    proxy: boolean,
    subtitle: boolean,
    limit_interval: string,
    limit_count: string,
    limit_seconds: string,
    strict_url: string
}

export interface SiteListOptions {
    rss?: boolean,
    brush?: boolean,
    statistic?: boolean,
}

export interface SitesResouce extends ResourceType {
    ItemType: SiteProfile,
    ListOptionType?: SiteListOptions,
}

export class Sites extends APIArrayResourceBase<SitesResouce> {
    constructor() {
        super();
    }

    public async list({ rss, brush, statistic, }: {
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

    public async update(value: SiteProfile) {
        return (await this.API).updateSiteSetting(value)
    }


    public async delete(value: SiteProfile['id']) {
        return (await this.API).post("site/delete", { auth: true, data: { id: value } })
    }

    protected async deleteHook(value: SiteProfile, options?: any): Promise<boolean> {
        await this.delete(value.id);
        return true;
    }

    protected async updateHook(value: SiteProfile): Promise<void> {
        await this.update(value)
    }

    protected async listHook(options?: SiteListOptions | undefined): Promise<SiteProfile[]> {
        return await this.list(options);
    }

    protected async addHook(value: SiteProfile): Promise<boolean> {
        await this.update(value);
        return true;
    }

    public async indexers() {
        return (await this.API).getIndexers();
    }
}