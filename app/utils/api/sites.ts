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

    public async deleteHook(value: SiteProfile, options?: any): Promise<boolean> {
        await this.delete(value.id);
        return true;
    }

    public async updateHook(value: SiteProfile): Promise<boolean> {
        await this.update(value)
        return true
    }

    public async val(value: SiteProfile): Promise<[boolean, string]> {
        const result = await (await this.API).post<{ time: number }>("site/test", {
            auth: true, json: true,
            data: {
                id: value.id,
                config: value
            }
        })
        console.log(result)
        return [true, `连接成功 用时${result.time}ms`]
    }

    public validateHook(value: SiteProfile): Promise<[boolean, string]> {
        return this.val(value);
    }

    public async listHook(options?: SiteListOptions | undefined): Promise<SiteProfile[]> {
        return await this.list(options);
    }

    public async addHook(value: SiteProfile): Promise<boolean> {
        await this.update(value);
        return true;
    }

    public async indexers() {
        return (await this.API).getIndexers();
    }
}