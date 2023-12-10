import axios from "axios";
import ClientStorage from "../storage"
import { objectToFormData } from "./api_utils"
import { NastoolMessage } from "../api/message";
import { MediaWorkType } from "./types";
import { ServerEvent } from "./message/ServerEvent";
type NastoolApi =
    "user/login" |
    "config/info" |
    "config/update" |
    "media/search" |
    "media/detail" |
    "media/tv/seasons" |
    "media/tv/episodes" |
    "media/cache" |
    "service/name/test" |
    "page/brief" |
    "page/listdir" |
    "organization/import/tv" |
    "organization/import/dryrun" |
    "organization/import/group" |
    "organization/history/list" |
    "/unknown/renameudf" |
    "site/list" |
    "site/statistics" |
    "site/indexers" |
    "site/resources" |
    "site/update" |
    "download/config/list" |
    "download/list" |
    "download/client/list" |
    "download/start" |
    "download/stop" |
    "download/remove" |
    "library/mediaserver/library" |
    "library/mediaserver/library/item" |
    "filterrule/list/basic" |
    "filterrule/list" |
    "task/list" |
    "task/create" |
    "sync/directory/list" |
    "sync/directory/update" |
    "sync/directory/delete" |
    "subscribe/movie/list" |
    "subscribe/tv/list" |
    "subscribe/add" |
    "subscribe/update" |
    "subscribe/delete" |
    "subscribe/search" |
    "rss/list" |
    "rss/update" |
    "message/client/list" |
    "message/client/update" |
    "message/client/test" |
    "message/client/delete"
export interface NastoolResponse<T> {
    code: number,
    success: boolean,
    message: string,
    data?: T
}

export type NastoolLoginResData = {
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
    openai: {
        api_url?: string,
        api_key: string,
        deployment_id: string,
        provider: "azure" | "openai"
    },
    security: {
        api_key: string
    },
    media: {
        anime_path: string[],
        movie_path: string[],
        tv_path: string[],
        media_default_path: string,
    },
    laboratory: {
        use_douban_titles: boolean
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
    seasons?: {
        air_date: string,
        episode_counts: number,
        id: number,
        name: string,
        overview: string,
        poster_path: string,
        season_number: number
    }[],
    actors: [];
    link: string;
    douban_link: string;
}

export enum NastoolMediaType {
    TV = "电视剧",
    MOVIE = "电影",
    ANI = "动漫",
    UNKNOWN = '未知',
}
type NastoolMediaLibraryType =  NastoolMediaType.TV | NastoolMediaType.MOVIE | NastoolMediaType.ANI;


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
    is_empty?: boolean,
    size: number
}
export type NastoolFileList = {
    is_root: boolean,
    files: NastoolFileListItem[],
    directories: NastoolFileListItem[],
    fallback_to?: string
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

export type SearchTaskConfig = {
    keyword: string,
    identify: boolean,
    filter: Record<string, string>
    tmdbid: string,
    media_type: NastoolMediaType
}

export enum TaskType {
    SEARCH = "search",
    DOWNLOAD = "download",
    IMPORT = "import",
}

export enum TaskStatus {
    WAIT = "wait",
    RUN = "running",
    EXITED = "exited",
    TIMEOUT = "timeout",
    FINISHED = "finished"
}

export interface Subtask {
    status: TaskStatus,
    type: TaskType,
    log: string[]
}

export interface SearchTask extends Subtask {
    config: SearchTaskConfig
}

export interface Task {
    subtasks: Subtask[]
    start_time: number
}
export interface TaskListResult {
    tasks: Task[]
}
export enum ImportMode {
    LINK = "硬链接",
    SOFTLINK = "软链接",
    COPY = "复制",
    MOVE = "移动",
    RCLONECOPY = "Rclone复制",
    RCLONE = "Rclone移动",
    MINIOCOPY = "Minio复制",
    MINIO = "Minio移动",
}



interface NastoolListResult<T> {
    total: number,
    result: T[]
}

export interface OrganizationHistory {
    ID: number,
    MODE: ImportMode,
    CATEGORY: NastoolMediaType,
    TMDBID: number,
    TITLE: string,
    YEAR: string,
    SEASON_EPISODE: string,
    SOURCE: string,
    SOURCE_PATH: string,
    SOURCE_FILENAME: string,
    DEST: string,
    DEST_FILENAME: string,
    DEST_PATH: string,
    DATE: string,
    SYNC_MOD: ImportMode,
    RMT_MOD: string
}

type OrganizationHistoryResult = NastoolListResult<OrganizationHistory>
// interface OrganizationHistoryResult {
//     total: number,
//     result: OrganizationHistory[]
// }

export interface TMDBCacheItem {
    id: number,
    title: string,
    year: string,
    media_type: NastoolMediaType,
    poster_path: string,
    backdrop_path: string
}

export type TMDBCacheList = [string, TMDBCacheItem, string][];
type TMDBCacheListResult = NastoolListResult<[string, TMDBCacheItem, string]>

// type NastoolResponse = {
//     code: number,
//     success: boolean,
//     message: string,
//     data?: NastoolLoginResData |
//     NastoolServerConfig |
//     NastoolMediaSearchResult |
//     NastoolMediaDetailResult |
//     NastoolTVSeasonsResult |
//     NastoolFileList |
//     NastoolNameTestResult |
//     NastoolImportGroupResult |
//     NastoolDownloadConfigListResultData |
//     NastoolMediaServerLibrary |
//     NastoolLibrarySeries |
//     NastoolSiteStatisticsResult |
//     NastoolIndexerList |
//     OrganizationHistoryResult |
//     TMDBCacheListResult
// }

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
    public message: ServerEvent | null = null;
    public hook: {
        onLoginRequired?: () => (Promise<NastoolLoginConfig>)
    } = {};
    constructor(config: NastoolConfig, apiBasePath = "/api/v1") {
        this.config = config;
        this.baseUrl = `http${this.config.https ? 's' : ''}://${this.config.host}:${this.config.port}`
        this.apiBaseUrl = `${this.baseUrl}${apiBasePath}/`
        this.storage = new ClientStorage('nastool');
    }

    public async getMediaDetail(id: string, type?: DBMediaType): Promise<NastoolMediaDetail> {
        const detailResult: NastoolMediaDetailResult = await this.post<NastoolMediaDetailResult>("media/detail", { data: { tmdbid: id, type }, auth: true });
        return detailResult.data;
    }

    public async searchMedia(keyword: string): Promise<NastoolMediaSearchResult> {
        return await this.post<NastoolMediaSearchResult>("media/search", { data: { keyword }, auth: true });
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

    public async init() {
        // this.message = new NastoolMessage(`ws${this.config.https ? 's' : ''}://${this.config.host}:${this.config.port}/message?apikey=${this.serverConfig?.security.api_key}`);

    }

    public getServerEvent() {
        if (this.message == undefined) {
            if (this.token) {
                this.message = new ServerEvent(this.token)
                
            }

        }
        return this.message
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
            console.log("Login ok", this.token)
            return true
        } catch (e) {
            console.log(e);
            this.token = null;

            await useStorage().removeItem("db:nastool-login-cache");
        }
        return false;
    }


    public async getServerConfig() {
        const config = await this.post<NastoolServerConfig>("config/info", { auth: true });
        this.serverConfig = config;
        return config;
    }

    public async updateServerConfig(config: NastoolServerConfig) {
        const flatten = (obj: any, roots: any = [], sep = '.'): Record<string, any> => Object.keys(obj).reduce((memo, prop) => Object.assign({}, memo, Object.prototype.toString.call(obj[prop]) === '[object Object]' ? flatten(obj[prop], roots.concat([prop]), sep) : { [roots.concat([prop]).join(sep)]: obj[prop] }), {})
        const flattenConfig = flatten(config);
        console.log(flattenConfig)
        const result = await this.post<{ code: number }>("config/update", {
            auth: true, data: {
                items: flattenConfig
            },
            json: true
        })
        return result.code == 0
    }

    public async mediaSearch(keyword: string) {
        const result = await this.post<NastoolMediaSearchResult>("media/search", {
            auth: true,
            data: {
                keyword: keyword
            }
        })
        result.result.forEach(item => {
            item.image = this._get_image_proxy_url(item.image)
        })
        return result.result
    }

    public async getMediaBrief(): Promise<NastoolMediaBrief> {
        const brief = await this.get<NastoolMediaBrief>("page/brief", { auth: true });
        const imageUrlReplace = (item: NastoolMediaLibrary | NastoolMediaLibraryItem) => [
            item.image = (item.image.replace("img", "imgx")) + `&apikey=${this.serverConfig?.security.api_key}`
        ]
        brief.libraries.forEach(imageUrlReplace)
        brief.latest.forEach(imageUrlReplace)
        brief.resumes.forEach(imageUrlReplace)
        return brief;
    }

    public async getFileList(startPath: string, basePath: string): Promise<NastoolFileList> {
        const fileList = await this.post<NastoolFileList>("page/listdir", { auth: true, data: { start_path: startPath, list_path: basePath } })
        return fileList
    }

    public async nameTest(fileName: string): Promise<NastoolNameTestResultData> {
        const result = await this.post<NastoolNameTestResult>("service/name/test", { auth: true, data: { name: fileName } })
        return result.data;
    }

    public get apiToken() {
        return this.token;
    }

    public async getSiteList(
        {
            rss,
            brush,
            statistic,
        }: {
            rss?: boolean,
            brush?: boolean,
            statistic?: boolean,
        } = {}
    ): Promise<NastoolSiteProfile[]> {
        const result = await this.post<NastoolSiteProfileResult>("site/list",
            {
                data: {
                    rss: rss == undefined ? undefined : Number(rss),
                    brush: brush == undefined ? undefined : Number(brush),
                    statistic: statistic == undefined ? undefined : Number(statistic),
                },
                auth: true
            }
        )
        return result.sites
    }

    public async getRecommandList() {

    }

    public async getDownloadConfigList(): Promise<NastoolDownloadConfig[]> {
        const result = await this.post<NastoolDownloadConfigListResultData>("download/config/list",
            { auth: true }
        )
        return result.data
    }

    public async getMediaServerLibrary(id: string): Promise<NastoolMediaServerLibraryItem[]> {
        const result = await this.post<NastoolMediaServerLibrary>("library/mediaserver/library", { auth: true, data: { id } })
        return result.items
            .filter((item) => item.cover)
            .map(item => {
                item.cover = this._get_image_proxy_url(item.cover)
                return item
            })
    }

    public async getLibrarySeriesItem(id: string): Promise<NastoolLibrarySeries> {
        const result = await this.post<NastoolLibrarySeries>("library/mediaserver/library/item", { auth: true, data: { id } })
        result.series_info.cover = this._get_image_proxy_url(result.series_info.cover)
        return result
    }

    public async getMediaServerItem(id: string): Promise<NastoolLibrarySeries> {
        const result = await this.post<NastoolLibrarySeries>("library/mediaserver/library/item", { auth: true, data: { id } })
        // console.log(result)
        return result
    }

    public async getSitesStatistics(): Promise<NastoolSiteInfo[]> {
        if (this.serverConfig?.security.api_key) {

            const result = await this.get<NastoolSiteStatisticsResult>("site/statistics",
                {
                    auth: true,
                    params: {
                        apikey: this.serverConfig?.security.api_key
                    }
                })
            return result.user_statistics
        } else {
            throw new NTAuthFailError("Api key not exists.")
        }
    }

    public async getIndexers(): Promise<NastoolIndexer[]> {
        const result = await this.post<NastoolIndexerList>("site/indexers", { auth: true });
        return result.indexers
    }

    public async getSiteResource(site_domain: string, page: number): Promise<NastoolSiteResourceItem[]> {
        const result = await this.post<NastoolSiteResourceList>("site/resources",
            {
                auth: true,
                data: {
                    site: site_domain,
                    page: page
                }
            })
        return result.data
    }

    public async getFilterRules(): Promise<NastoolFilterruleBasic[]> {
        const result = await this.post<{
            RuleGroups: NastoolFilterruleBasic[]
        }>("filterrule/list/basic", { auth: true });
        // console.log(result)
        return result.RuleGroups
    }


    public async updateSiteSetting(siteProfile: NastoolSiteProfile) {
        const updateNote: NastoolSiteUpdateNote = {
            chrome: siteProfile.chrome ? "Y" : "N",
            download_setting: siteProfile.download_setting,
            limit_count: siteProfile.limit_count,
            limit_interval: siteProfile.limit_interval,
            limit_seconds: siteProfile.limit_seconds,
            message: siteProfile.unread_msg_notify ? "Y" : "N",
            parse: siteProfile.parse ? "Y" : "N",
            proxy: siteProfile.proxy ? "Y" : "N",
            rule: siteProfile.rule,
            subtitle: siteProfile.subtitle ? "Y" : "N",
            ua: siteProfile.ua
        }
        const updateProfile: NastoolSiteUpdateProfile = {
            site_cookie: siteProfile.cookie,
            site_id: String(siteProfile.id),
            site_include: siteProfile.uses.join(""),
            site_name: siteProfile.name,
            site_note: JSON.stringify(updateNote),
            site_pri: siteProfile.pri,
            site_rssurl: siteProfile.rssurl,
            site_signurl: siteProfile.signurl
        }
        // console.log(updateProfile)
        await this.post<void>("site/update", {
            auth: true,
            data: {
                ...updateProfile
            }
        })
        return true;
    }

    public async import(path: string,
        files: string[],
        dryrun = true): Promise<void> {
        return await this.post<void>("organization/import/dryrun",
            {
                auth: true,
                json: true,
                data: { inpath: path, files: files }
            })
    }

    public async groupImport(files: string[]): Promise<NastoolImportGroup> {
        return (await this.post<NastoolImportGroupResult>("organization/import/group",
            {
                auth: true,
                json: true,
                data: {
                    files: files
                }
            })).result
    }

    public async getTaskList() {
        const result = await this.get<TaskListResult>("task/list", {
            auth: true,
        })
        return result.tasks
    }

    public async createTask(taskType: TaskType, taskConfig: string) {
        return await this.post<any>("task/create", {
            auth: true, data: {
                task_type: taskType,
                task_config: taskConfig
            }
        })
    }

    public async mediaFileImport(params: {
        path: string,
        target_path?: string,
        files: string[],
        importMode: ImportMode,
        episodes?: (number | undefined)[],
        season?: number,
        tmdbid?: string,
        type?: NastoolMediaType,
    }) {
        const { tmdbid, type, path, target_path, files, season, importMode, episodes } = params;
        return await this.post<any>("organization/import/tv", {
            data: {
                tmdbid: tmdbid,
                type: type,
                inpath: path,
                outpath: target_path,
                files: files,
                season: season,
                syncmod: importMode,
                episodes: episodes
            },
            auth: true,
            json: true
        })
    }

    public async getOrganizationHistoryList({ page, length, keyword }: { page: number, length: number, keyword?: string }) {
        const result = await this.post<OrganizationHistoryResult>("organization/history/list", {
            data: {
                page: page,
                pagenum: length,
                keyword: keyword
            },
            auth: true
        });
        return result;
    }

    public async getTMDBCache({ page, length, keyword }: { page: number, length: number, keyword?: string }) {
        const result = await this.post<TMDBCacheListResult>("media/cache", {
            data: {
                page: page,
                pagenum: length,
                keyword: keyword
            },
            auth: true
        });
        return result;
    }

    public _get_image_proxy_url(server_url: string, legacy = false) {
        if (legacy) {
            return `img?url=${server_url}`
        } else {
            return `${this.baseUrl}/imgx?url=${server_url}&apikey=${this.serverConfig?.security.api_key}`
        }
    }

    protected async get<T>(api: NastoolApi, options: { auth?: boolean, params?: Record<string, string> } = {}): Promise<T> {
        return await this.request<T>(api, "get", {
            params: {
                ...options.params,
                // apikey: options.auth ? this.serverConfig?.security.api_key : undefined
            },
            auth: options.auth
        })
    }

    public async post<T>(api: NastoolApi, options: { auth?: boolean, json?: boolean, data?: Record<string, string> | any, params?: Record<string, string> } = {}): Promise<T> {
        // const formData =//new FormData();
        // Object.entries<string>(options.data || {}).forEach(([k, v]) => formData.append(k, v));

        return await this.request<T>(api, "post", {
            params: options.params,
            data: options.json ? options.data : objectToFormData(options.data || {}),
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
            const data: NastoolResponse<T> = req.data;
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
    private static lock?: Promise<NASTOOL>;
    public static getNastoolInstance(): Promise<NASTOOL> {
        const nastool_instance = this.lock;
        if (nastool_instance != undefined) {
            return nastool_instance;
        }

        this.lock = this._getNastoolInstance();
        return this.lock;
    }
    private static async _getNastoolInstance(): Promise<NASTOOL> {
        if (this.nastool_instance == null) {
            if (this.onNastoolConfigRequired) {
                // console.log("call nastool config required");
                const nastoolConfig = await this.onNastoolConfigRequired();
                // console.log("Fetched ok,", nastoolConfig)
                const nastool_instance = new NASTOOL(nastoolConfig);
                if (await nastool_instance.restoreLogin()) {
                    this.nastool_instance = nastool_instance;
                } else {
                    if (this.onNastoolLoginRequired) {
                        const { username, password } = await this.onNastoolLoginRequired();
                        const loginOk = await nastool_instance.login({ username: username, password: password })
                        if (loginOk) {
                            this.nastool_instance = nastool_instance;
                        } else {
                            throw new Error("Nastool login failed.");
                        }
                    } else {
                        throw new Error("Nastool login failed: cannot get login info.");
                    }
                }
                this.nastool_instance.init();
                return this.nastool_instance
            }
            throw new Error("Unable to get nastool");
        } else {
            return this.nastool_instance
        }
    }

}