import { DBMediaType } from "./api";
import { APIBase } from "./api_base";
import { MediaIdentifyContext, MediaWork, MediaWorkEpisode, MediaWorkSeason, MediaWorkType } from "./types"


export class TMDB extends APIBase {

    static share: Record<string, MediaWork> = {}
    protected static instance: TMDB;
    constructor() {
        super();
        if(TMDB.instance) {
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

        const episodes: MediaWorkSeason[] | undefined = (mediaType != MediaWorkType.MOVIE && mediaType != MediaWorkType.UNKNOWN) ?
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
        episodes?.forEach(ep => TMDB.addShare(ep))
        console.log(TMDB.share)
        return [
            mediaWork,
            (isSeries) ? episodes : undefined,
            undefined
        ]
    }
}