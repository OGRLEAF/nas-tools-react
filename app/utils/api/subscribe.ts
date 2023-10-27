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
    download_setting: number,
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
export interface _RssConfig {
    type: DBMediaType,
    name: string,
    year: string,
    fuzzy_match: boolean,
    over_edition: boolean,
    id: string,
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

export interface RssDownloadProps {
    save_path: string,
    download_setting: number,
}
export interface RssSiteProps {
    rss_sites: string[],
    search_sites: string[],
}

export interface RssFilterProps {
    filter_restype: string,
    filter_pix: string,
    filter_team: string,
    filter_rule: string,
    filter_include: string,
    filter_exclude: string,
}

export interface RssMediaWorkProps {
    keyword: string,
    mediaid: string,
    year: string,
}
export interface RssConfig extends RssDownloadProps, RssSiteProps, RssFilterProps, RssMediaWorkProps {
    rssid?: number,
    type: DBMediaType,
    name: string,
    fuzzy_match: boolean,
    over_edition: boolean,
}

export enum RssState {
    QUEUING = "D",
    SEARCHING = "S",
    RUNNING = "R",
    FINISH = "F"
}

export interface RssMediaWorkMovieProps extends RssMediaWorkProps {

}

export interface MovieRssConfig extends RssConfig, RssMediaWorkMovieProps {
    type: DBMediaType.MOVIE,
    name: string,
    in_form: string,
}

export interface MovieRssInfo extends MovieRssConfig {
    image: string,
    poster: string,
    overview: string,
    release_date: string,
    state: RssState
}

export interface RssMediaWorkTvProps extends RssMediaWorkProps {
    current_ep: number,
    total_ep: number,
    season: number,
}

export interface TVRssConfig extends RssConfig, RssMediaWorkTvProps {
    type: DBMediaType.TV,
    in_form: string,
}

export interface TVRssInfo extends TVRssConfig {
    image: string,
    poster: string,
    overview: string,
    release_date: string,
    state: RssState
}


export type MovieRssList = Record<string, MovieRssInfo>
export type TvRssList = Record<string, TVRssInfo>
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
        Object.values(list.result).forEach((item) => {
            if (item.filter_rule == null) item.filter_rule = ""
        })
        // console.log(list)
        return list.result;
    }

    public async getTvList() {
        const list = await (await this.API).post<{ result: TvRssList }>("subscribe/tv/list", {
            auth: true
        })
        Object.values(list.result).forEach((item: any) => {
            if (item.filter_rule == null) item.filter_rule = ""
            if (item.filter_exclude == null) item.filter_exclude = ""
            if (item.filter_pix == null) item.filter_pix = ""
            if (item.filter_restype == null) item.filter_restype = ""
            if (item.filter_team == null) item.filter_team = ""
            if (item.filter_pix == null) item.filter_pix = ""
            item.mediaid = item.tmdbid
            item.rssid = item.id == null ? undefined : Number(item.id)
            if (item.save_path == null) item.save_path = undefined
            if ((item.download_setting as unknown as string) == "") item.download_setting = 0
            if (item.season) item.season = Number((item.season as unknown as String).substring(1))
        })
        // console.log(list)
        return list.result;
    }

    public async updateSubscribe(rssConfig: RssConfig) {
        const update = await (await this.API).post("subscribe/update", {
            data: {
                ...rssConfig
            },
            auth: true,
            json: true
        })
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