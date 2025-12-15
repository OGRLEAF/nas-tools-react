import _, { size } from "lodash";
import { NASTOOL, PageQuery } from "../api";
import { APIBase } from "../api_base";
import { MediaWorkType, SeriesKeyType } from "../types"
import { SeriesKey, SeriesKeyTuple } from "./SeriesKey"
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import arraySupport from "dayjs/plugin/arraySupport"
import { TMDBMedia } from "./tmdb";

dayjs.extend(arraySupport)

export enum DatePart {
    year = 0,
    month = 1,
    day = 2,
    hour,
    minute
}

export type MetadataDate = [
    year: number,
    month: number | null,
    day: number | null,
    hour: number | null,
    minute: number | null
]


export const toDayjs = (md: MetadataDate) => {
    const [year, month, date, hour, minute] = md;
    if (year == undefined) return
    let day = dayjs().year(year);

    if (!month || (month == null)) return day; // month = 0 / month = undefined | month = null
    day = day.month(month - 1)
    if (!date || (date == null)) return day;
    day = day.date(date)
    return day;
}

export type LinkType = "tmdb" | "douban" | "official_site"
export type ImageType = "poster" | "cover" | "banner"
export type DateType = "release" | "airing"

export interface MediaWorkMetadata {
    title: string,
    description: string,
    links: Partial<Record<LinkType, string>>,
    images: Partial<Record<ImageType, string>>,
    date: Partial<Record<DateType, MetadataDate>>

}

export interface MediaWork {
    series: SeriesKey,
    // type: MediaWorkType,
    metadata?: MediaWorkMetadata,
}

export interface MediaWorkData {
    series: SeriesKeyTuple,
    // type: MediaWorkType,
    // key: number | string,
    // title: string
    metadata?: MediaWorkMetadata,
}

type ListOptions = { cached: boolean } & Partial<PageQuery>;

export class MediaWorkService extends APIBase {

    static share: Record<string, MediaWork> = {}
    protected static instance: MediaWorkService;
    private typeMap = {
        [MediaWorkType.TV]: "tv",
        [MediaWorkType.MOVIE]: "movie",
        [MediaWorkType.ANI]: "tv",
        [MediaWorkType.UNKNOWN]: null
    }
    private static _cache: Record<string, TMDBMediaWork> = {};
    constructor(API?: NASTOOL) {
        super(API);
        if (MediaWorkService.instance) {
            return MediaWorkService.instance;
        }
        MediaWorkService.instance = this;
    }

    public async getBySeriesKey(series_key: SeriesKey) {
        const [t, ...keys] = series_key.dump().slice(0, series_key.end + 1);
        const queryType = t && this.typeMap[t as MediaWorkType]
        if (t) {
            const query_path = keys.join("/")
            // TODO: Invalid return
            const mediaWorkData = await this.API.get<MediaWorkData>(`media_work/${queryType}/${query_path}`, { auth: true })
            const mediaWork: MediaWork = {
                ...mediaWorkData,
                series: SeriesKey.load(mediaWorkData.series)
            }
            return mediaWork
        }
    }

    public async getEntriesBySeriesKey(series_key: SeriesKey, options: ListOptions = { cached: false }): Promise<[MediaWork[], number]> {
        const [t, ...keys] = series_key.dump().slice(0, series_key.end + 1);
        const queryType = t && this.typeMap[t as MediaWorkType]
        if (t) {
            const queryPath = [queryType, ...keys, 'all',]
            if (options.cached)
                queryPath.push('cached')
            const mediaWorks = await this.API.get<{ list: MediaWorkData[], total: number }>(`media_work/${queryPath.join('/')}`, {
                auth: true,
                params: _.pickBy(options, v => v !== undefined) as any
            })
            return [mediaWorks.list.map((item) => ({
                ...item,
                series: SeriesKey.load(item.series)
            })), mediaWorks.total]
        }
        return [[], 0]
    }

    public async getPack(series_key: SeriesKey) {
        return await this.getEntriesBySeriesKey(series_key, { cached: false, size: -1 })
    }

    public async updateMediaWork(mediaWork: MediaWork) {
        const [t, ...keys] = mediaWork.series.dump().slice(0, mediaWork.series.end + 1);
        const queryType = t && this.typeMap[t as MediaWorkType]
        // TODO: ugly
        if (t && mediaWork.series.t) {
            const query_path = keys.join("/")
            const postData: MediaWorkData = {
                series: mediaWork.series.dump(),
                metadata: mediaWork.metadata,
            }
            const ret = await this.API.post(`media_work/${queryType}/${query_path}`,
                {
                    auth: true,
                    data: postData,
                    json: true
                })
            return ret

        }
    }

    public async dropMediaWork(series_key: SeriesKey) {
        const [t, ...keys] = series_key.dump().slice(0, series_key.end + 1);
        const queryType = t && this.typeMap[t as MediaWorkType]
        if (t) {
            const query_path = keys.join("/")
            const ret = await this.API.del(`media_work/${queryType}/${query_path}`, { auth: true })
            return ret
        }
    }
}


export class TMDBMediaWork {
    private series_key: SeriesKey;
    private mediaWork?: MediaWork;
    private _cache: Record<number, TMDBMediaWork> = {};
    private _get_await?: ReturnType<MediaWorkService['getBySeriesKey']>;
    constructor(series_key: SeriesKey) {
        this.series_key = series_key
    }

    public async get(): Promise<MediaWork | undefined> {
        if (this._get_await == undefined) {
            this._get_await = new MediaWorkService().getBySeriesKey(this.series_key)
        }
        const mediaWork = await this._get_await;
        this.mediaWork = mediaWork;
        return this.mediaWork;
    }

    public async getChildren() {
        const mediaWorks = await new MediaWorkService().getEntriesBySeriesKey(this.series_key)
        return mediaWorks
    }

    public async set(mediaWork: MediaWork) {
        const ret = await new MediaWorkService().updateMediaWork(mediaWork)
        return ret
    }

    public async drop() {
        return await new MediaWorkService().dropMediaWork(this.series_key)
    }
}

export function useMediaWorkAction(serieskey: SeriesKey) {
    const instance = useMemo(() => {
        if (serieskey.end >= SeriesKeyType.TMDBID)
            return new TMDBMediaWork(serieskey)
    }, [serieskey])
    const get = useCallback(async () => {
        return instance?.get()
    }, [instance]);
    const update = useCallback(async (mediaWork: MediaWork) => {
        await instance?.set(mediaWork)
    }, [instance,])

    const drop = useCallback(async () => {
        await instance?.drop()
    }, [instance]);
    return { update, get, drop }
}

export function useMediaWork(seriesKey: SeriesKey): [MediaWork | undefined, {
    update: (m: MediaWork) => Promise<void>,
    refresh: () => Promise<void>,
    drop: () => Promise<void>
}] {

    const { get, update, drop } = useMediaWorkAction(seriesKey);
    const [mediaWork, setMediaWork] = useState<MediaWork>();

    const refresh = useCallback(async () => {
        return get()?.then((mw) => {
            setMediaWork(mw)
        })
    }, [get]);

    useEffect(() => {
        refresh();
    }, [refresh])

    return [mediaWork, { update, refresh, drop }]
}


export function useMediaWorks(seriesKey?: SeriesKey):
    [MediaWork[], boolean, (options?: ListOptions) => void, (options?: ListOptions) => void] {
    const [mediaWorks, setMediaWorks] = useState<MediaWork[]>([]);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback((options?: ListOptions) => {
        if (seriesKey && (seriesKey.t == MediaWorkType.TV ? (seriesKey.end < SeriesKeyType.EPISODE) : (seriesKey.end < SeriesKeyType.TMDBID))
        ) {
            setLoading(true)
            new MediaWorkService().getEntriesBySeriesKey(seriesKey, options)
                .then(([mediaWorks, total]) => {
                    if (mediaWorks !== undefined) setMediaWorks(() => mediaWorks)
                })
                .catch(e => {
                    setMediaWorks([])
                })
                .finally(() => setLoading(false))
        }
    }, [seriesKey])
    useEffect(() => {
        refresh({ cached: true });
    }, [refresh])

    const flush = useCallback(() => {
        refresh({ cached: false })
    }, [refresh])
    return [mediaWorks, loading, refresh, flush]
}

export function useMediaWorksPaginated(seriesKey?: SeriesKey, initialOptions?: PageQuery) {
    const [mediaWorks, setMediaWorks] = useState<MediaWork[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState<number>(0);
    const [pagination, setPagination] = useState<PageQuery>(initialOptions || { page: 1, size: 10 });


    const refresh = useCallback((options?: ListOptions) => {
        if (seriesKey && (seriesKey.t == MediaWorkType.TV ? (seriesKey.end < SeriesKeyType.EPISODE) : (seriesKey.end < SeriesKeyType.TMDBID))
        ) {
            setLoading(true)
            new MediaWorkService().getEntriesBySeriesKey(seriesKey, options)
                .then(([mediaWorks, total]) => {
                    if (total > 0) {
                        setMediaWorks(() => mediaWorks)
                        setTotal(total)
                    }
                })
                .catch(e => {
                    setMediaWorks([])
                    setTotal(0)
                })
                .finally(() => setLoading(false))
        }
    }, [seriesKey])
    useEffect(() => {
        refresh({ ...pagination, cached: true });
    }, [refresh, pagination])

    const flush = useCallback(() => {
        refresh({ ...pagination, cached: false })
    }, [refresh, pagination])
    return { mediaWorks, loading, total, refresh, flush, pagination, setPagination }
}

