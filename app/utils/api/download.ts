import { APIBase } from "./api_base";
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
    ALL = "all",
    DOWNLOADING = "downloading",
    SEEDING = "seeding",
    CHECKING = "checking",
    PAUSED = "paused",
    UNKNOWN = "unknown"
}
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
    is_private: boolean
}

export class Download extends APIBase {
    constructor() {
        super();
    }

    public async list(page?: number, size?: number) {
        const result = await (await this.API).post<{ list: TorrentInfo[], total: number }>("download/list", {
            data: {
                page: page,
                size: size
            },
            auth: true
        });
        return result
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

export type DownloadClientConfig = {
    name: string,
    type: "qbittorrent",
    enabled: boolean,
    transfer: boolean,
    only_nastool: boolean,
    match_path: boolean,
    rmt_mode: SyncMode,
    rmt_mode_name: RmtMode,
    config: {
        name: string
        host: string,
        port: number,
        username: string,
        password: string,
        torrent_management: string,
        download_dir: DownloadDirConfig[]
    },
    download_dir: DownloadDirConfig[]
}

type DownloadClientConfigListResult = {
    detail: DownloadClientConfig[]
}

export class DownloadClient extends APIBase {
    public async list() {
        const result = await (await this.API).post<DownloadClientConfigListResult>("download/client/list",
            { auth: true }
        )
        return Object.values(result.detail)
    }
}