import axios from "axios";
import ClientStorage from "../storage"

type NastoolApi =
    "user/login" |
    "config/info" |
    "media/search" |
    "media/detail" |
    "media/tv/seasons" |
    "service/name/test" |
    "page/brief" |
    "page/listdir" |
    "organization/import/dryrun" |
    "organization/import/group" |
    "site/list" |
    "site/statistics" |
    "site/indexers" |
    "site/resources" |
    "site/update" |
    "download/config/list" |
    "library/mediaserver/library" |
    "library/mediaserver/library/item" |
    "filterrule/list/basic"

type NastoolLoginResData = {
    token: string;
    apikey: string;
    userinfo: {
        userid: number;
        username: string;
        userpris: string[]
    }
}

export interface NastoolConfig {
    https: boolean;
    host: string;
    port: number;
}

export interface NastoolLoginConfig {
    username: string,
    password: string
}

interface NastoolPersistedConfig {
    https: boolean,
    host: string,
    port: number,
    api_key: string,
}
export type NastoolServerAppConfig = {
    debug: boolean,
    logtype: "file" | "console" | "server",
    logpath: string,
    logserver: string,
    loglevel: "debug" | "info" | "error",
    web_host: string,
    web_port: string,
    login_user: string,
    login_password: string,
    ssl_cert: string,
    ssl_key: string,
    rmt_tmdbkey: string,
    rmt_match_mode: "normal",
    proxies: {
        https: string,
        http: string,
    },
    domain: string,
    user_agent: string,
    wallpaper: "bing" | "themoviedb",
    tmdb_domain: string,
    releases_update_only: boolean,
    tmdb_image_url: string
}

export type NastoolServerConfig = {
    app: NastoolServerAppConfig,
    media: any,
    security: {
        api_key: string
    }
}

export type NastoolMediaSearchResultItem = {
    id: string,
    orgid: string,
    title: string,
    year: string,
    type: NastoolMediaLibraryType,
    media_type: NastoolMediaType,
    vote: number,
    image: string,
    imdb_id: string,
    tmdb_id: string,
    overview: string,
    link: string,
    name: string
}

export type NastoolMediaSearchResult = {
    result: NastoolMediaSearchResultItem[];
}

export type NastoolMediaDetail = {
    tmdbid: number;
    douban_id: string;
    background: string[];
    image: string;
    vote: number;
    year: string;
    title: string;
    genres: string;
    overview: string;
    runtime: string;
    fact: Record<string, string>[];
    crews: Record<string, string>[];
    actors: [];
    link: string;
    douban_link: string;
}

type NastoolMediaLibraryType = "电视剧" | "电影";
export enum NastoolMediaType {
    TV = "电视剧",
    MOVIE = "电影",
    ANI = "动漫"
}

export type NastoolMediaLibrary = {
    id: string,
    image: string,
    link: string,
    name: string,
    path: string,
    type: NastoolMediaLibraryType
}

export type NastoolMediaLibraryItem = {
    id: string,
    image: string,
    link: string,
    name: string,
    type: NastoolMediaLibraryType
}
type NastoolMediaServerLibraryType = "Series" | "Movie";
export type NastoolMediaServerLibraryItem = {
    cover: string,
    id: string,
    json: any,
    tmdbid: string,
    type: NastoolMediaServerLibraryType,
    path: string,
    title: string,
    originalTitle: string
    library: string,
    year: number
}

type NastoolMediaServerLibrary = {
    items: NastoolMediaServerLibraryItem[]
}

export type NastoolMediaBrief = {
    libraries: NastoolMediaLibrary[],
    resumes: NastoolMediaLibraryItem[],
    latest: NastoolMediaLibraryItem[],
}

type NastoolMediaDetailResult = {
    data: NastoolMediaDetail
}

type NastoolTVSeason = {
    text: string;
    num: number;
}

type NastoolTVSeasonsResult = {
    seasons: NastoolTVSeason[];
}

export type NastoolFileListItem = {
    name: string,
    type: boolean,
    mtime: number,
    is_empty?: boolean
}
export type NastoolFileList = {
    is_root: boolean,
    files: NastoolFileListItem[],
    directories: NastoolFileListItem[],
}


export type NastoolNameTestResultData = {
    type: NastoolMediaLibraryType,
    category: string,
    customization: any,
    effect: any,
    ignored_words: any[],
    name: string,
    offset_words: string[],
    org_string: string,
    part: any,
    pix: string,
    replaced_words: string[],
    restype: any,
    rev_string: string,
    season_episode: string,
    team: string,
    title: string,
    tmdb_S_E_link: string,
    tmdbid: number,
    tmdblink: string,
    audio_codec: string,
    video_codec: string,
    year: string
}
type NastoolNameTestResult = {
    data: NastoolNameTestResultData
}

type NastoolImportGroup = Record<string, string>

type NastoolImportGroupResult = {
    result: NastoolImportGroup
}

export type NastoolSiteProfile = {
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

export type NastoolSiteUpdateNote = {
    chrome: string,
    download_setting: string,
    limit_count: string,
    limit_interval: string,
    limit_seconds: string,
    message: string,
    parse: string,
    proxy: string,
    rule: string,
    subtitle: string,
    ua: string
}

export type NastoolSiteUpdateProfile = {
    site_cookie: string,
    site_id: string,
    site_include: string,
    site_name: string,
    site_note: string,
    site_pri: string,
    site_rssurl: string,
    site_signurl: string
}

type NastoolSiteProfileResult = {
    sites: NastoolSiteProfile[]
}

export interface NastoolFilterruleBasic {
    id: string,
    name: string
}

export type NastoolDownloadConfig = {
    id: number,
    name: string,
    category: string,
    tags: string,
    is_paused: number,
    upload_limit: number,
    download_limit: number,
    ratio_limit: number,
    seeding_time_limit: number,
    downloader: string,
    downloader_name: string,
    downloader_type: string
}
type NastoolDownloadConfigListResultData = {
    data: NastoolDownloadConfig[]
}

type NastoolLibraryType = "Series" | "Movie"
export type NastoolPath = {
    mediaserver: string,
    local: string
}

export type NastoolLibraryMediaSource = {
    path: NastoolPath,
    streams: {
        display_name: string,
        path: string,
        is_external: boolean,
        type: "Video" | "Audio" | "Subtitle"
    }[]
}
export type NastoolLibrarySeriesEpisode = {
    episode: number,
    title: string,
    source: NastoolLibraryMediaSource[]
}
export type NastoolLibrarySeriesSeason = {
    title: string | null,
    season: number,
    episodes: NastoolLibrarySeriesEpisode[]
}
export type NastoolLibrarySeriesInfo = {
    cover: string,
    tmdbid: string,
    title: string,
    originalTitle: string,
    path: NastoolPath
}

export type NastoolLibrarySeries = {
    id: string,
    type: "Series",
    season_group: Record<number, NastoolLibrarySeriesSeason>
    series_info: NastoolLibrarySeriesInfo
}

export type NastoolSiteInfo = {
    site: string,
    upload: number,
    username: string,
    user_level: string,
    join_at: string,
    update_at: string,
    download: number,
    ratio: number,
    seeding: number,
    seeding_size: number,
    leeching: number,
    bonus: number,
    url: string,
    err_msg: string,
    message_unread: string
}

export type NastoolSiteStatisticsResult = {
    user_statistics: NastoolSiteInfo[]
}

export type NastoolIndexer = {
    id: string,
    name: string,
    domain: string,
    public: boolean
}

export type NastoolIndexerList = {
    indexers: NastoolIndexer[]
}

export type NastoolSiteResourceItem = {
    indexer: string,
    title: string,
    description: string,
    page_url: string,
    enclosure: string,
    grabs: number,
    peers: number,
    seeders: number,
    size: number,
    downloadvolumefactor: number,
    uploadvolumefactor: number,
    date_elapsed: string
}

export type NastoolSiteResourceList = {
    data: NastoolSiteResourceItem[]
}

export enum SearchMediaType {
    TV = '电视剧',
    MOVIE = '电影',
    ANIME = '动漫',
    UNKNOWN = '未知',
}

export type SearchTaskConfig = {
    keyword: string,
    identify: boolean,
    filter: Record<string, string>
    tmdbid: string,
    media_type: SearchMediaType
}

type NastoolResponse = {
    code: number,
    success: boolean,
    message: string,
    data?: NastoolLoginResData |
    NastoolServerConfig |
    NastoolMediaSearchResult |
    NastoolMediaDetailResult |
    NastoolTVSeasonsResult |
    NastoolFileList |
    NastoolNameTestResult |
    NastoolImportGroupResult |
    NastoolDownloadConfigListResultData |
    NastoolMediaServerLibrary |
    NastoolLibrarySeries |
    NastoolSiteStatisticsResult |
    NastoolIndexerList
}

function useStorage() {
    return localStorage
}
export enum DBMediaType {
    MOVIE = "MOV",
    TV = "TV"
}

enum NTErrorType {
    AUTH_ERROR,

}

class NTError extends Error {
    public readonly type: NTErrorType;
    constructor(m: string, type: NTErrorType) {
        super(m);
        this.type = type;
    }
}
class NTAuthFailError extends NTError {
    constructor(m: string) {
        super(m, NTErrorType.AUTH_ERROR);
    }
}

export class NASTOOL {
    private config: NastoolConfig;
    private baseUrl: string;
    private apiBaseUrl: string;
    private token: string | null = null;
    private serverConfig: NastoolServerConfig | null = null;
    private storage: ClientStorage<NastoolLoginResData>;
    public hook: {
        onLoginRequired?: () => (Promise<NastoolLoginConfig>)
    } = {};
    constructor(config: NastoolConfig, apiBasePath = "/api/v1") {
        this.config = config;
        this.baseUrl = `http${this.config.https ? 's' : ''}://${this.config.host}:${this.config.port}`
        this.apiBaseUrl = `${this.baseUrl}${apiBasePath}/`
        this.storage = new ClientStorage('nastool');
    }

    public async restoreLogin() {
        console.log("Restore login.")
        const cachedLogin: NastoolLoginResData | undefined = this.storage.getItem('db:nastool-login-cache');
        if (cachedLogin) {
            try {
                this.token = cachedLogin.token;
                const configInfo: NastoolServerConfig | undefined = await this.getServerConfig();
                this.serverConfig = configInfo;
                console.log("Login ok ", this.token)
                return true
            } catch (e) {
                this.token = null;
                await useStorage().removeItem("db:nastool-login-cache");
                return false
            }
        }
        return false;
    }


    public async login({ username, password }: NastoolLoginConfig): Promise<boolean> {
        const loginResp: NastoolLoginResData | undefined = await this.post<NastoolLoginResData>("user/login", { data: { username, password } });
        if (loginResp) {
            this.storage.setItem('db:nastool-login-cache', loginResp);
            this.token = loginResp.token;
        }

        try {
            const configInfo: NastoolServerConfig | undefined = await this.getServerConfig();
            this.serverConfig = configInfo;
            console.log("Login ok ", this.token)
            return true
        } catch (e) {
            console.log(e);
            this.token = null;

            await useStorage().removeItem("db:nastool-login-cache");
        }
        return false;
    }


    public async getServerConfig() {
        return await this.post<NastoolServerConfig>("config/info", { auth: true });
    }


    public _get_image_proxy_url(server_url: string) {
        return `${this.baseUrl}/imgx?url=${server_url}&apikey=${this.serverConfig?.security.api_key}`
    }

    private async get<T>(api: NastoolApi, options: { auth?: boolean, params?: Record<string, string> } = {}): Promise<T> {
        return await this.request<T>(api, "get", {
            params: options.params,
            auth: options.auth
        })
    }

    private async post<T>(api: NastoolApi, options: { auth?: boolean, json?: boolean, data?: Record<string, string> | any, params?: Record<string, string> } = {}): Promise<T> {
        const formData = new FormData();
        Object.entries<string>(options.data || {}).forEach(([k, v]) => formData.append(k, v));
        return await this.request<T>(api, "post", {
            params: options.params,
            data: options.json ? options.data : formData,
            auth: options.auth
        })
    }

    private async request<T>(api: NastoolApi, method: "get" | "post", options: { params?: any, data?: FormData | any, auth?: boolean }): Promise<T> {
        try {
            return await this._request(api, method, options,)
        } catch (e) {
            if (e instanceof NTError) {
                switch (e.type) {
                    case NTErrorType.AUTH_ERROR:
                        if (this.hook.onLoginRequired) {
                            const loginConfig = await this.hook.onLoginRequired()
                            await this.login(loginConfig)
                            return await this.request(api, method, options)
                        }
                        break;
                }
            }
            throw e;
        }
    }

    private async _request<T>(api: NastoolApi, method: "get" | "post", options: { params?: any, data?: FormData | any, auth?: boolean }): Promise<T> {
        const headers = {
            // ...(options.data?options.data.),
            ...(options.auth ? { Authorization: this.token } : {})
        }
        const request = async (retry: boolean = true): Promise<T> => {
            const req = await axios.request({
                baseURL: this.apiBaseUrl,
                method: method,
                url: api,
                data: options.data,
                params: options.params,
                headers: headers
            })
            const data: NastoolResponse = req.data;
            if (data.code == 0 && data.success == true) {
                return data.data as T;
            }
            else {
                if (data.code == 403) {
                    throw new NTAuthFailError(data.message)
                }
                else
                    throw new Error(`Nastool request error code=${data.code} sucess=${data.success} message=${data.message}`);
            }
        }
        return request();
    }
}

export class API {
    private static nastool_instance: NASTOOL | null = null;
    public static onNastoolConfigRequired: (() => Promise<NastoolConfig>) | null = null;
    public static onNastoolLoginRequired: (() => Promise<NastoolLoginConfig>) | null = null;
    public static async getNastoolInstance(): Promise<NASTOOL> {
        if (this.nastool_instance == null) {
            if (this.onNastoolConfigRequired) {
                // console.log("call nastool config required");
                const nastoolConfig = await this.onNastoolConfigRequired();
                // console.log("Fetched ok,", nastoolConfig)
                const nastool_instance = new NASTOOL(nastoolConfig);
                // nastool_instance.hook.onLoginRequired = async ()=>{
                //     if(this.onNastoolLoginRequired)
                //         return await this.onNastoolLoginRequired();
                //     else {
                //         throw Error("No login entry");
                //     }
                // }

                if (await nastool_instance.restoreLogin()) {
                    this.nastool_instance = nastool_instance;
                    return this.nastool_instance;
                } else {
                    if (this.onNastoolLoginRequired) {
                        const { username, password } = await this.onNastoolLoginRequired();
                        const loginOk = await nastool_instance.login({ username: username, password: password })
                        if (loginOk) {
                            this.nastool_instance = nastool_instance;
                            return this.nastool_instance
                        } else {
                            throw new Error("Nastool login failed.");
                        }
                    }
                }
            }
            throw new Error("Unable to get nastool");
        } else {
            return this.nastool_instance
        }
    }

}