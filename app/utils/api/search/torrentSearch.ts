import { APIBase, APIDataResourceBase } from "../api_base";
import { MediaWorkType } from "../types";


// export interface TorrentMediaFileSpec {
//     video_encode: string,
//     size: string,
//     reseffect: string,
//     releasegroup?: string
// }
export interface Torrent {
    id: number,
    seeders: number,
    enclosure: string,
    site: string,
    torrent_name: string,
    description: string,
    pageurl: string,
    uploadvalue: number,
    downloadvalue: number,
    size: string,
    respix: string,
    restype: string,
    reseffect: string,
    releasegroup?: string,
    video_encode: string,
    labels: string[]
}

export interface TorrentGroup {
    group_info: {
        respix: string,
        restype: string
    },
    group_total: number,
    group_torrents: Record<string, { torrent_list: Torrent[] }>
}

export interface SearchResult {
    key: number,
    title: string,
    type_key: string,
    image: string,
    type: MediaWorkType,
    vote: string,
    tmdbid: string,
    backdrop: string,
    poster: string,
    overview: string,
    fav: string,
    rssid: string,
    torrent_dict: [string, Record<string, TorrentGroup>][]
}

export interface SearchResultResponse {
    total: number,
    result: Record<string, SearchResult>
}


export class TorrentSearchResult extends APIDataResourceBase<SearchResult> {

    public async get() {
        const result = await (await this.API).post<SearchResultResponse>("search/result", { auth: true });
        return Object.values(result.result)[0];
    }
    protected dataHook(options?: undefined): Promise<SearchResult> {
        return this.get();
    }

    public async download(searchId: number, downloadPath?: string, downloadSetting?: number) {
        const result = await (await this.API).post("download/search", {
            auth: true,
            data: {
                id: String(searchId),
                dir: downloadPath,
                setting: downloadSetting == 0 ? undefined : downloadSetting
            }
        })
    }
}