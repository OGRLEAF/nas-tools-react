import { APIArrayResourceBase, ResourceType } from "./api_base"

export enum TaskState {
    RUNNING = "Y",
    STAGING = "S",
    STOPPED = "N"
}

export enum FreeType {
    ALL = "",
    FREE = "FREE",
    FREE2X = "2XFREE"
}

export interface RssRule {
    free: FreeType,
    hr: string,
    size: string,
    include: string,
    exclude: string,
    dlcount?: number,
    peercount: number,
    pubdate: string,
    upspeed?: string,
    downspeed?: string
}

export interface RemoveRule {
    time: string,
    ratio: string,
    uploadsize: string,
    dltime: string,
    avg_upspeed: string,
    iatime?: string
}

export interface BrushTaskConfig {
    name: string,
    site_id: string,
    interval: number,
    label?: string,
    up_limit?: number,
    dl_limit?: number,
    savepath?: string,
    state: TaskState,
    transfer: boolean,
    sendmessage: boolean,
    rss_rule: RssRule,
    remove_rule: RemoveRule,
    seed_size: string,
    rss_url?: string,
}

export interface BrushTaskStatus {
    site: string,
    total_size: number,
    download_count: number,
    remove_count: number,
    upload_size: number,
    download_size: number,
    last_update: string,
    site_url: string
}

export interface BrushTaskProfile {
    id: number,
    status: BrushTaskStatus,
    config: BrushTaskConfig
}


export interface BrushTaskResourceType extends ResourceType {
    ItemType: BrushTaskProfile,
    UpdateItemType: { id?: BrushTaskProfile['id'], config: BrushTaskConfig }
}

export class BrushTask extends APIArrayResourceBase<BrushTaskResourceType> {

    public async list() {
        const result = await this.API.post<{ tasks: BrushTaskProfile[] }>("brushtask/list", { auth: true });
        return result.tasks
    }

    public async update(id: BrushTaskProfile['id'] | null, config: BrushTaskConfig) {
        const result = await this.API.post<{ tasks: BrushTaskProfile[] }>("brushtask/update",
            {
                auth: true,
                json: true,
                data: {
                    id,
                    config,
                }
            });
    }

    public listHook(options?: any): Promise<BrushTaskProfile[]> {
        return this.list();
    }

    public async updateHook(value: { id: number; config: BrushTaskConfig }, options?: any): Promise<boolean> {
        await this.update(value.id, value.config)
        return true;
    }
}

export interface BrushTaskTorrent {
    id: number,
    task_id: number,
    torrent_name: string,
    size: number,
    enclosure: string,
    downloader: number,
    torrent_hash: string,
    last_update_date: string
}


export interface BrushTaskTorrentType extends ResourceType {
    ItemType: BrushTaskTorrent,
    ListOptionType: { id: number }
}


export class BrushTaskTorrents extends APIArrayResourceBase<BrushTaskTorrentType> {
    public async list(id: BrushTaskTorrent['id']) {
        const result = await this.API.post<{ torrents: BrushTaskTorrent[] }>("brushtask/torrents", {
            auth: true,
            data: {
                id: id
            }
        })
        return result.torrents
    }

    public async listHook(options?: { id: number } | undefined): Promise<BrushTaskTorrent[]> {
        if (options) {
            return await this.list(options?.id)
        } else {
            return []
        }

    }
}