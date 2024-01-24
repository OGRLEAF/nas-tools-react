import { APIBase, APIArrayResourceOption, ResourceType, APIArrayResourceBase } from "./api_base";
import { MediaWorkType, SyncMode } from "./types";
import { ImportMode as RmtMode } from "./api"
/**
 * 
class TorrentState(Enum):
    ALL = "all"
    DOWNLOADING = "downloading"
    SEEDING = "seeding"
    CHECKING = "checking"
    PAUSED = "paused"


class TorrentInfoBase(TypedDict):
    added_date: str
    save_path: str
    tracker: str
    total_size: int
    state: TorrentState
    name: str
    downloaded: int
    uploaded: int
    ratio: float
    progress: float

 */

export enum TorrentState {
    DOWNLOADING = "downloading",
    SEEDING = "seeding",
    CHECKING = "checking",
    PAUSED = "paused",
    UNKNOWN = "unknown",
    STALLED = "stalled"
}

export enum TorrentVagueState {
    ALL = "all",
    ACTIVE = "active",
    INACTIVE = "inactive"
}

export type TorrentFilterState = TorrentState | TorrentVagueState;


export interface TorrentInfo {
    hash: string,
    added_date: number,
    save_path: string,
    content_path: string,
    tracker: string,
    total_size: number,
    state: TorrentState,
    name: string,
    downloaded: number,
    uploaded: number,
    ratio: number,
    progress: number,
    category: string,
    speed: {
        download: number,
        upload: number
    }
}

export interface DownloadTaskProfile {
    enclosure: string,
    title: string,
    site?: string,
    description?: string,
    page_url?: string,
    size?: number,
    seeders?: number,
    uploadvolumefactor?: number,
    downloadvolumefactor?: number,
    dl_dir?: string,
    dl_setting?: number
}

export interface DownloadResource {
    ItemType: TorrentInfo,
    ListOptionType: ListOptions
}

type ListOptions = { page?: number, size?: number, hashs?: string[], state?: TorrentFilterState }
export class Download extends APIArrayResourceBase<DownloadResource> {
    constructor() {
        super();
    }

    public async submit(task: DownloadTaskProfile) {
        const result = await (await this.API).post("download/item", {
            auth: true,
            data: { ...task }
        })
        return result;
    }

    public async list(options: ListOptions = {})
        : Promise<TorrentInfo[]> {
        const { page, size, hashs, state } = options;
        const result = await (await this.API).post<{ list: TorrentInfo[], total: number }>("download/list", {
            data: {
                hashs: hashs,
                page: page,
                size: size,
                state: state
            },
            auth: true,
            json: true
        });
        return result.list
    }

    public listHook(options?: ListOptions): Promise<TorrentInfo[]> {
        return this.list(options);
    }

    public async resume(hash: string) {
        const result = await (await this.API).post<{ result: TorrentInfo[] }>("download/start", {
            data: {
                id: hash
            },
            auth: true
        });
        return result.result
    }

    public async pause(hash: string) {
        const result = await (await this.API).post<{ result: TorrentInfo[] }>("download/stop", {
            data: {
                id: hash
            },
            auth: true
        });
        return result.result
    }

    public async remove(hash: string) {
        const result = await (await this.API).post<{ result: TorrentInfo[] }>("download/remove", {
            data: {
                id: hash
            },
            auth: true
        });
        return result.result
    }

    public async action(api: "resume" | "pause" | "remove", hash: string) {
        return await this[api](hash);
    }
}



/**
 * "id": 1,
        "name": "test",
        "type": "qbittorrent",
        "enabled": 1,
        "transfer": 0,
        "only_nastool": 0,
        "match_path": 0,
        "rmt_mode": "link",
        "rmt_mode_name": "硬链接",
        "config": {
          "host": "https://pt.service.home/",
          "port": "443",
          "username": "admin",
          "password": "adminadmin",
          "torrent_management": "manual",
          "download_dir": [
            {
              "save_path": "/media_downloads/movies",
              "type": "电影",
              "category": "",
              "container_path": "/Media/Downloads/movies/",
              "label": "Movie"
            }
          ],
          "name": "test"
        },
        "download_dir": [
          {
            "save_path": "/media_downloads/movies",
            "type": "电影",
            "category": "",
            "container_path": "/Media/Downloads/movies/",
            "label": "Movie"
          }
        ]
      }
 */

export type DownloadDirConfig = {
    save_path: string,
    type: MediaWorkType,
    category: string,
    container_path: string,
    label: string
}

export type DownloadClientType = "qbittorrent";

export type DownloadClientConfig = {
    id?: number,
    name: string,
    type: DownloadClientType,
    enabled: boolean,
    transfer: boolean,
    only_nastool: boolean,
    match_path: boolean,
    rmt_mode: SyncMode,
    config: {
        host: string,
        port: number,
        username: string,
        password: string,
        torrent_management: "default" | "manual" | "auto",
    },
    download_dir: DownloadDirConfig[]
}

type DownloadClientConfigListResult = {
    detail: DownloadClientConfig[]
}

export interface DownloadClientResource extends ResourceType {
    ItemType: DownloadClientConfig,
}

export class DownloadClient extends APIArrayResourceBase<DownloadClientResource> {
    public async list() {
        const result = await (await this.API).post<DownloadClientConfigListResult>("download/client/list",
            { auth: true }
        )
        return Object.values(result.detail)
    }
    public async update(config: DownloadClientConfig) {
        const result = await (await this.API).post<DownloadClientConfigListResult>("download/client/add",
            {
                auth: true,
                json: true,
                data: {
                    ...config
                }
            }
        )
        return result
    }
    public async delete(config: DownloadClientConfig) {
        if (config.id == undefined) return false;
        const result = await (await this.API).post("download/client/delete", {
            auth: true,
            data: {
                did: config.id
            }
        })
        return true;
    }

    public async test(config: DownloadClientConfig) {
        const result = await (await this.API).post("download/client/test", {
            auth: true,
            data: {
                test: 123,
                type: config.type,
                config: JSON.stringify(config.config)
            }
        })
    }

    protected async listHook() {
        return this.list();
    }

    protected async updateHook(value: DownloadClientConfig): Promise<boolean> {
        await this.update(value)
        return true
    }

    protected async addHook(value: DownloadClientConfig): Promise<boolean> {
        await this.update(value);
        return true;
    }
    protected deleteHook(value: DownloadClientConfig): Promise<boolean> {
        return this.delete(value);
    }

    protected async validateHook(value: DownloadClientConfig): Promise<[boolean, string]> {
        await this.test(value);
        return [true, "配置正确"];
    }
}

export interface DownloadConfig {
    id: number,
    name: string,
    category: string,
    tags: string,
    is_paused: 0 | 1,
    seeding_time_limit: number,
    upload_limit: number,
    download_limit: number,
    ratio_limit: number,
    downloader: number,
    downloader_name: string,
    downloader_type: DownloadClientConfig['type']
}

export interface DownloadConfigResource extends ResourceType {
    ItemType: DownloadConfig,
}


export class DownloadConfigs extends APIArrayResourceBase<DownloadConfigResource> {
    public async list() {
        const result = await (await this.API).post<{ data: DownloadConfig[] }>("download/config/list", { auth: true })
        result.data.forEach(item => { item.downloader = Number(item.downloader) })
        return result.data;
    }
    protected listHook(options?: undefined): Promise<DownloadConfig[]> {
        return this.list();
    }

    public async update(config: DownloadConfig) {
        const result = await (await this.API).post("download/config/update", {
            auth: true,
            data: {
                ...config,
                sid: config.id,
                downloader: String(config.downloader)
            }
        })
        return true;
    }

    protected async updateHook(value: DownloadConfig): Promise<boolean> {
        await this.update(value);
        return true
    }

    protected addHook(value: DownloadConfig): Promise<boolean> {
        return this.update(value);
    }

    public async delete(id: DownloadConfig['id']) {
        await (await this.API).post("download/config/delete", {
            auth: true,
            data: {
                sid: id
            }
        })
        return true;
    }

    protected deleteHook(value: DownloadConfig): Promise<boolean> {
        return this.delete(value.id);
    }
}