import _ from "lodash";
import { DBMediaType } from "./api";
import { APIBase } from "./api_base";
import { MediaIdentifyContext, MediaWork, MediaWorkEpisode, MediaWorkMetadata, MediaWorkSeason, MediaWorkType } from "./types"

/*
      {
        "air_date": "2023-01-06",
        "episode_number": 1,
        "id": 3961746,
        "name": "虹咲学园学园偶像同好会",
        "overview": "",
        "production_code": "",
        "runtime": 4,
        "season_number": 1,
        "show_id": 210511,
        "still_path": "https://image.tmdb.org/t/p/w500/bHz2A8azAbYy30mIIj5eFTyu27V.jpg",
        "vote_average": 0,
        "state": false
      }
      */
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

export class TMDB extends APIBase {

    static share: Record<string, MediaWork> = {}
    protected static instance: TMDB;
    private static _cache: Record<string, TMDBMediaWork> = {};
    constructor() {
        super();
        if (TMDB.instance) {
            return TMDB.instance;
        }
        TMDB.instance = this;
    }

    private static addShare(mediaWork: MediaWork) {
        const key = `${mediaWork.series.join("-")}-${mediaWork.key}`
        TMDB.share[key] = mediaWork;
    }
    public static findShare(key: string) {
        return TMDB.share[key];
    }

    public async listCache({ page, length, keyword }: { page: number, length: number, keyword?: string }) {
        const result = await (await this.API).getTMDBCache({ page, length, keyword });
        return result;
    }

    public async search(keyword: string): Promise<MediaWork[]> {
        const searchResult = await (await this.API).searchMedia(keyword);
        const mediaWorks = searchResult.result.map((item) => ({
            series: [],
            type: item.media_type as unknown as MediaWorkType,
            title: item.title,
            key: item.tmdb_id,
            metadata: {
                title: item.title,
                description: item.overview,
                image: {
                    cover: item.image
                },
                date: {
                    release: item.year
                },
                links: {
                    tmdb: item.link
                }
            }
        }))
        mediaWorks.forEach((item) => {
            TMDB.addShare(item)
        })

        return mediaWorks
    }

    public async episodes({ tmdbId, season }: { tmdbId: string, season: number }) {
        const { episodes: tmdb_episodes } = await (await this.API).post<{ episodes: TMDBEpisode[] }>("media/tv/episodes",
            {
                data: {
                    tmdbid: tmdbId,
                    season: season
                },
                auth: true
            })

        // console.log(tmdb_episodes)                                                                                                                                                                                                                                                                                                                            
        const episodes: MediaWorkEpisode[] = tmdb_episodes.map((ep) => ({
            key: ep.episode_number,
            series: [tmdbId, String(season)],
            type: MediaWorkType.TV,
            title: ep.name,
            metadata: {
                title: ep.name,
                description: ep.overview,
                image: {
                    cover: ep.still_path
                },
                links: {},
                date: {
                    release: ep.air_date
                }
            }
        }))
        episodes.forEach(ep => TMDB.addShare(ep))
        const seasonWork = TMDB.findShare(`${tmdbId}-${season}`);
        if (seasonWork) {
            seasonWork.children = episodes;
        }
        return episodes
    }

    public async detail(tmdbId: string, mediaType: MediaWorkType): Promise<[MediaWork, MediaWorkSeason[] | undefined, MediaWorkEpisode[] | undefined]> {
        const tmdbType = mediaType == MediaWorkType.MOVIE ? DBMediaType.MOVIE :
            mediaType == MediaWorkType.UNKNOWN ? undefined :
                DBMediaType.TV
        const isSeries = mediaType == MediaWorkType.ANI || mediaType == MediaWorkType.TV
        const detail = await (await this.API).getMediaDetail(tmdbId, tmdbType)
        const mediaWork = {
            series: [],
            type: mediaType,
            key: detail.tmdbid,
            title: detail.title,
            metadata: {
                image: {
                    cover: detail.image,
                    background: detail.background[0]
                },
                description: detail.overview,
                title: detail.title,
                date: {
                    release: detail.year
                },
                links: {
                    tmdb: detail.link
                }
            },
        }
        TMDB.addShare(mediaWork)

        const seasons: MediaWorkSeason[] | undefined = (mediaType != MediaWorkType.MOVIE && mediaType != MediaWorkType.UNKNOWN) ?
            (detail.seasons || []).map((season) => ({
                series: [String(detail.tmdbid)],
                type: mediaType,
                key: season.season_number,
                title: season.name,
                metadata: {
                    title: season.name,
                    description: season.overview,
                    image: {
                        cover: season.poster_path
                    },
                    links: {
                        tmdb: `${detail.link}/season/${season.season_number}`
                    },
                    date: {
                        release: season.air_date
                    }
                }
            })) : undefined;
        seasons?.forEach(ep => TMDB.addShare(ep))
        // console.log(TMDB.share)
        return [
            mediaWork,
            (isSeries) ? seasons : undefined,
            undefined
        ]
    }

    public work(tmdbid: string, mediaType: MediaWorkType) {
        const cacheKey = `${tmdbid}-${mediaType}`
        if (TMDB._cache[cacheKey])
            return TMDB._cache[cacheKey];
        else {
            const mediaWork = new TMDBMediaWork(tmdbid, mediaType);
            TMDB._cache[cacheKey] = mediaWork;
            return mediaWork;
        }
    }

    public fromSeries(series: MediaWork['series']) {
        let target;
        if (series[0] != undefined) {
            target = this.work(String(series[0]), MediaWorkType.TV)

            if (series[1] != undefined) {
                target = target.season(Number(series[1]))
                if (series[2] != undefined) {
                    target = target.episode(Number(series[2]))
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
}