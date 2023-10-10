import { DBMediaType, NastoolFilterruleBasic, NastoolResponse } from "./api";
import { APIBase } from "./api_base";
/*
{
  "type": "MOV",
  "name": "铃芽户缔",
  "year": "2023",
  "season": "",
  "fuzzy_match": false,
  "mediaid": "",
  "over_edition": false,
  "total_ep": "",
  "current_ep": "",
  "rssid": "",
  "keyword": "",
  "in_form": "manual",
  "filter_restype": "",
  "filter_pix": "",
  "filter_team": "",
  "filter_rule": "",
  "filter_include": "",
  "filter_exclude": "",
  "save_path": "",
  "download_setting": "",
  "rss_sites": [],
  "search_sites": []
}
*/

export interface MovieRssDefaultConfig {
    download_setting: string,
    exclude: string,
    include: string,
    mtype: DBMediaType.MOVIE,
    over_edition: string,
    pix: string,
    restype: string,
    rss_sites: string[],
    rule: string,
    search_sites: string[],
    team: string
}

export interface RssConfig {
    type: DBMediaType,
    name: string,
    year: string,
    fuzzy_match: boolean,
    over_edition: boolean,
    rssid: string,
    keyword: string,
    filter_restype: string,
    filter_pix: string,
    filter_team: string,
    filter_rule: string,
    filter_include: string,
    filter_exclude: string,
    save_path: string,
    download_setting: string,
    rss_sites: string[],
    search_sites: string[]
}

export enum RssState {
    QUEUING = "D",
    SEARCHING = "S",
    RUNNING = "R",
    FINISH = "F"
}

export interface MovieRssConfig extends RssConfig {
    type: DBMediaType.MOVIE,
    name: string,
    year: string,
    // fuzzy_match: string,
    mediaid: string,
    // over_edition: string,
    rssid: string,
    keyword: string,
    in_form: string,
}

export interface MovieRssInfo extends MovieRssConfig {
    image: string,
    poster: string,
    overview: string,
    release_date: string,
    state: RssState
}

export interface TVRssConfig extends RssConfig {
    type: DBMediaType.TV,

    current_ep: string,
    total_ep: string,
    season: string,

    in_form: string,
}

export type MovieRssList = Record<string, MovieRssInfo>

export interface NastoolRespWithData<T> extends NastoolResponse<T> {
    data: T
}

export class Subscribe extends APIBase {
    private filterRules: NastoolFilterruleBasic[] = [];
    constructor() {
        super();
    }
    public async getMovieList() {
        const list = await (await this.API).post<{ result: MovieRssList }>("subscribe/movie/list", {
            auth: true
        })
        // console.log(list)
        return list.result;
    }
    public async getSiteList() {
        const rssSites = (await this.API).getSiteList({ rss: true });
        return rssSites
    }
    public async getFilterRules() {
        const rules = (await this.API).getFilterRules();
        return rules
    }
    public async getDownloadSetting() {
        return (await this.API).getDownloadConfigList();
    }
}