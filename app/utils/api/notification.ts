import { APIBase } from "./api_base";

type NotificationSource = "download_start" |
    "download_fail" |
    "transfer_finished" |
    "transfer_fail" |
    "rss_added" |
    "rss_finished" |
    "site_signin" |
    "site_message" |
    "brushtask_added" |
    "brushtask_remove" |
    "auto_remove_torrents" |
    "ptrefresh_date_message" |
    "mediaserver_message" |
    "custom_message"

export interface WechatConfig {
    adminUser: string,
    agentid: string,
    corpid: string,
    corpsecret: string,
    default_proxy: string,
    encodingAESKey: string,
    interactivte: boolean,
    token: string
}

export interface NotifiClientConfig {
    id: number,
    name: string,
    type: string,
    config: WechatConfig,
    switchs: NotificationSource[],
    interactive: boolean,
    enabled: boolean
}


export class Notification extends APIBase {
    public async list() {
        const result = await (await this.API).post<{ detail: Record<string, NotifiClientConfig> }>("message/client/list", { auth: true });
        return Object.values(result.detail).map((conf: any) => {
            conf.enabled = conf.enabled == 1;
            conf.interactive = conf.interactive == 1;
            return conf;
        }) as NotifiClientConfig[];
    }

    public async test(type: NotifiClientConfig["type"], config: NotifiClientConfig['config']) {
        const result = await (await this.API).post<{ detail: Record<string, NotifiClientConfig> }>("message/client/test",
            {
                auth: true,
                data: {
                    type,
                    config: JSON.stringify(config)
                }
            }
        );
        return result;
    }

    public async delete(id: number) {
        const result = await (await this.API).post("message/client/delete",
            {
                auth: true,
                data: {
                    cid: id
                }
            }
        );
        return result;
    }

    public async update(config: NotifiClientConfig) {
        console.log(config)
        const result = await (await this.API).post<{ detail: Record<string, NotifiClientConfig> }>("message/client/update",
            {
                auth: true,
                data: {
                    ...config,
                    config: JSON.stringify(config.config)
                },
                json: true
            }
        );
        return result;
    }
}