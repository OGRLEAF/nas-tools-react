import _ from "lodash";
import { DBMediaType, NASTOOL } from "../api";
import { APIBase } from "../api_base";
import { MediaIdentifyContext, MediaWork, MediaWorkEpisode, MediaWorkSeason, MediaWorkType, SeriesKey, SeriesKeyType } from "../types"


interface TMDBEpisode {
    air_date: string,
    episode_number: number,
    id: number,
    name: string,
    overview: string,
    production_code: string,
    runtime: number,
    season_number: number,
    show_id: number,
    still_path: string,
    vote_average: number,
    state: boolean
}

export class MediaWorkService extends APIBase {

    static share: Record<string, MediaWork> = {}
    protected static instance: MediaWorkService;
    private static _cache: Record<string, TMDBMediaWork> = {};
    constructor(API?:NASTOOL) {
        super(API);
        if (MediaWorkService.instance) {
            return MediaWorkService.instance;
        }
        MediaWorkService.instance = this;
    }

    public async getMediaWork(identify: MediaIdentifyContext): Promise<MediaWork | undefined> {
        const media = TMDBMedia.fromIdentify(identify);
        return await media.tmdbid(identify.tmdbId).get();
    }
}

export class TMDBMedia {
    public type: MediaWorkType
    private static _cache: Record<string, TMDBMediaWork> = {};
    constructor(mediaType: MediaWorkType) {
        this.type = mediaType;
    }
    public tmdbid(tmdbid: string) {
        if (TMDBMedia._cache[tmdbid]) {
            return TMDBMedia._cache[tmdbid]
        } else {
            const mediaWork = new TMDBMediaWork(tmdbid, this.type);
            TMDBMedia._cache[tmdbid] = mediaWork;
            return mediaWork;
        }
    }

    public static fromIdentify(identify: MediaIdentifyContext) {
        let target;
        if (identify.type && identify.tmdbId) {
            target = new TMDBMedia(identify.type)
            target = target.tmdbid(identify.tmdbId);
            if (identify.season != undefined) {
                target = target?.season(identify.season);
                if (identify.episode != undefined) {
                    target = target?.episode(identify.episode)
                }
            }
        }

        return target;
    }

}



export class TMDBMediaWork {
    public tmdbId: string;
    protected mediaType: MediaWorkType
    public seasons: Record<number, MediaWorkSeason> = {};
    private mediaWork?: MediaWork;
    private _cache: Record<number, TMDBMediaWorkSeason> = {};
    private _globalwait?: ReturnType<TMDB['detail']>;
    constructor(tmdbId: string, mediaType: MediaWorkType) {
        this.tmdbId = tmdbId;
        this.mediaType = mediaType;

    }

    public async get(): Promise<MediaWork | undefined> {
        if (this._globalwait == undefined) {
            this._globalwait = new TMDB().detail(this.tmdbId, this.mediaType);
        }
        const [mediaWork, seasons] = await this._globalwait;
        this.mediaWork = mediaWork;
        if (seasons?.length) {
            seasons.forEach(season => {
                this.seasons[season.key] = season
            })
        }
        return this.mediaWork;
        // if (this.mediaWork == undefined) {
        //     const [mediaWork, seasons] = await new TMDB().detail(this.tmdbId, this.mediaType);
        //     if (seasons?.length) {
        //         seasons.forEach(season => {
        //             this.seasons[season.key] = season
        //         })
        //     }
        //     this.mediaWork = mediaWork;
        //     return mediaWork
        // }

        // return this.mediaWork
    }

    public async get_children() {
        if (_.isEmpty(this.seasons)) {
            await this.get();
            // const [mediaWork, seasons] = await new TMDB().detail(this.tmdbId, this.mediaType);
            // if (seasons?.length) {
            //     seasons.forEach(season => {
            //         this.seasons[season.key] = season
            //     })
            // }
            // return seasons
        }
        // debugger;
        return Object.values(this.seasons);
    }

    public season(season: number) {
        const cacheKey = season
        if (this._cache[cacheKey])
            return this._cache[cacheKey];
        else {
            const mediaWork = new TMDBMediaWorkSeason(this, season);
            this._cache[cacheKey] = mediaWork;
            return mediaWork;
        }
    }
}

export class TMDBMediaWorkSeason {
    protected seasonKey: number;
    public episodes: Record<number, MediaWorkEpisode> = {};
    private parent: TMDBMediaWork;
    private _cache: Record<number, TMDBMediaWorkEpisode> = {};
    private _globalwait?: Promise<MediaWorkEpisode[]>;
    static identifiler = 0;
    public id;
    constructor(mediaWork: TMDBMediaWork, key: number) {
        this.parent = mediaWork;
        this.seasonKey = key;

        this.id = TMDBMediaWorkSeason.identifiler;
        TMDBMediaWorkSeason.identifiler += 1;
    }

    public async get() {
        if (!_.isEmpty(this.parent.seasons)) {
            return this.parent.seasons[this.seasonKey];
        } else {
            await this.parent.get_children();
            if (this.parent.seasons) {
                return this.parent.seasons[this.seasonKey];
            }
            return undefined
        }
    }

    public async get_children() {
        if (this._globalwait == undefined) {
            this._globalwait = new TMDB().episodes({ tmdbId: this.parent.tmdbId, season: this.seasonKey });
        }
        const episodes = await this._globalwait;
        episodes.forEach(ep => {
            this.episodes[ep.key] = ep
        })
        return episodes
    }

    public episode(ep: number) {
        const cacheKey = ep;
        if (this._cache[cacheKey])
            return this._cache[cacheKey];
        else {
            const mediaWork = new TMDBMediaWorkEpisode(this, ep);
            this._cache[cacheKey] = mediaWork;
            return mediaWork;
        }
    }
}

export class TMDBMediaWorkEpisode {
    protected episodeKey: number;
    public parent: TMDBMediaWorkSeason;
    private _globalwait?: Promise<any>;
    static identifiler = 0;
    private id;
    constructor(season: TMDBMediaWorkSeason, key: number) {
        this.parent = season;
        this.episodeKey = key;
        this.id = TMDBMediaWorkEpisode.identifiler;
        TMDBMediaWorkEpisode.identifiler += 1;
    }
    public async get() {
        if (!_.isEmpty(this.parent.episodes)) {
            return this.parent.episodes[this.episodeKey]
        } else {
            if (this._globalwait == undefined) {
                this._globalwait = this.parent.get_children();
            }
            await this._globalwait;
            return this.parent.episodes[this.episodeKey]
        }
        return undefined
    }

    public async get_children() {
        return []
    }
}