import _, { extend } from "lodash";
import { APIArrayResourceBase, APIBase, ResourceType } from "../api_base";
import { RssDownloadProps } from "./subscribe";


/**
 *   {
        "id": 1,
        "name": "test",
        "address": [
          "https://mikanani.me/RSS/MyBangumi?token=SersdW2SLlT8xV8yN8%2fhOqdKji3YJnMt%2b9afSjpn%2bNk%3d"
        ],
        "proxy": false,
        "parser": [
          "2"
        ],
        "interval": "30",
        "uses": "D",
        "uses_text": "下载",
        "include": "",
        "exclude": "",
        "filter": "",
        "filter_name": "",
        "update_time": "2023-08-27 20:07:57",
        "counter": "396",
        "state": false,
        "save_path": "",
        "download_setting": "",
        "recognization": "Y",
        "over_edition": 0,
        "sites": null,
        "filter_args": null
      }
      {
        "id": 1,
        "name": "通用",
        "type": "XML",
        "format": "{\n    \"list\": \"//channel/item\",\n    \"item\": {\n        \"title\": {\n            \"path\": \".//title/text()\"\n        },\n        \"enclosure\": {\n            \"path\": \".//enclosure[@type='application/x-bittorrent']/@url\"\n        },\n        \"link\": {\n            \"path\": \".//link/text()\"\n        },\n        \"date\": {\n            \"path\": \".//pubDate/text()\"\n        },\n        \"description\": {\n            \"path\": \".//description/text()\"\n        },\n        \"size\": {\n            \"path\": \".//link/@length\"\n        }\n    }\n}",
        "params": "",
        "note": ""
      },
 */

export interface RssParserConfig {
    id: number,
    name: string,
    type: "XML" | "JSON",
    format: string,
    params: string,
    note: string
}

export enum RssUse {
    DOWNLOAD = "D",
    SUBSCRIBE = "R"
}

interface NTRssTaskFetchInfo {
    id: number,
    name: string,
    address: string[],
    proxy: boolean,
    parser: string[],
    interval: string,
    uses: RssUse,
    uses_text: string,
    include: string,
    exclude: string,
    state: boolean,
    sites: { rss_sites: string[], search_sites: string[] },
    update_time: string,
    counter: number,
    filter: string
}

export interface RssTaskConfig {
    id: number,
    name: string,
    rss: {
        parser: string,
        url: string
    }[],
    proxy: boolean,
    interval: string,
    uses: RssUse,
    uses_text: string,
    include: string,
    exclude: string,
    state: boolean,
    sites: { rss: string[], search: string[] },
    update_time: string,
    counter: number,
    filter: string,
}

export interface RssDownloadTaskConfig extends RssTaskConfig, RssDownloadProps {
    uses: RssUse.DOWNLOAD,
    filter: string,
    // filter_name: string
    recognization: string,
    over_edition: number,
}
interface RssFilterProps {
    filter: string,
    filter_args: {
        restype: string,
        pix: string,
        team: string
    }
}
export interface RssSubscribeTaskConfig extends RssTaskConfig, RssFilterProps, RssDownloadProps {
    use: RssUse.SUBSCRIBE
}

export interface RssResource extends ResourceType {
    ItemType: RssTaskConfig
}

export class Rss extends APIArrayResourceBase<RssResource> {
    public async list(): Promise<{ tasks: RssTaskConfig[], parsers: RssParserConfig[] }> {
        const list = await (await this.API).post<{ tasks: NTRssTaskFetchInfo[], parsers: RssParserConfig[] }>("rss/list", { auth: true })
        const { tasks, parsers } = list;
        tasks.map((item: any) => {
            if ((item.download_setting as unknown as string) == "") item.download_setting = 0;
            if (item.recognization != undefined) item.recognization = (item.recognization == "Y") ? true : false;
            if (item.save_path == null) item.save_path = undefined
            if (item.sites) {
                item.sites.rss_sites = item.sites.rss_sites || [];
                item.sites.search_sites = item.sites.search_sites || [];
            }
        })
        return {
            parsers,
            tasks: tasks.map((item) => {
                const { address, parser, sites, ...rest } = item;
                return ({
                    ...rest,
                    rss: _.zip(address, parser).map(([url, par]) => ({
                        url: url as string,
                        parser: par as string
                    })),
                    sites: {
                        rss: sites?.rss_sites,
                        search: sites?.search_sites
                    },
                })
            })
        };
    }

    public async _update(taskConfig: RssTaskConfig) {
        const postData: NTRssTaskFetchInfo = {
            ...taskConfig,
            address: taskConfig.rss.map(rss => rss.url),
            parser: taskConfig.rss.map(rss => rss.parser),
            sites: {
                rss_sites: taskConfig.sites?.rss || [],
                search_sites: taskConfig.sites?.search || []
            }
        }
        const update = await (await this.API).post<any>("rss/update", {
            data: {
                ...postData
            },
            auth: true,
            json: true
        })
    }

    protected async listHook(options?: any): Promise<RssTaskConfig[]> {
        return (await this.list()).tasks
    }
    protected async addHook(value: RssTaskConfig): Promise<boolean> {
        await this._update(value);
        return true
    }

    protected async updateHook(value: RssTaskConfig): Promise<boolean> {
        await this._update(value);
        return true
    }

    protected async updateManyHook(value: RssTaskConfig[]): Promise<void> {
        await Promise.all(value.map((value) => this._update(value)))
    }
}

export interface RssParserResource extends ResourceType {
    ItemType: RssParserConfig,
}

export class RssParsers extends APIArrayResourceBase<RssParserResource> {
    public async list() {
        const result = await (await this.API).post<{ parsers: RssParserConfig[] }>("rss/parser/list", { auth: true });
        return result.parsers
    }

    public async update(value: RssParserConfig) {
        const result = await (await this.API).post("rss/parser/update", {
            auth: true,
            data: {
                ...value
            }
        });
        return result;
    }

    public async delete(id: RssParserConfig['id']) {
        return await (await this.API).post("rss/parser/delete", {
            auth: true,
            data: { id }
        })
    }

    protected async deleteHook(value: RssParserConfig, options?: any): Promise<boolean> {
        await this.delete(value.id);
        return true;
    }

    protected async addHook(value: RssParserConfig): Promise<boolean> {
        await this.update(value);
        return true;
    }

    protected async updateHook(value: RssParserConfig): Promise<boolean> {
        await this.update(value);
        return true
    }

    protected listHook(options?: any): Promise<RssParserConfig[]> {
        return this.list();
    }
}