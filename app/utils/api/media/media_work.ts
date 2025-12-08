import _ from "lodash";
import { NASTOOL } from "../api";
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

    public async getEntriesBySeriesKey(series_key: SeriesKey) {
        const [t, ...keys] = series_key.dump().slice(0, series_key.end + 1);
        const queryType = t && this.typeMap[t as MediaWorkType]
        if (t) {
            const useCache = keys.length == 0;
            const queryPath = [queryType, ...keys, 'all',]
            if (useCache)
                queryPath.push('cached')
            const media_work = this.API.get<{ list: MediaWorkData[] }>(`media_work/${queryPath.join('/')}`, { auth: true })
            return (await media_work).list.map((item) => ({
                ...item,
                series: SeriesKey.load(item.series)
            }))
        }
    }

    public async getPack(series_key: SeriesKey) {
        return await this.getEntriesBySeriesKey(series_key)
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
}


export function useMediaWork(series_key: SeriesKey): [MediaWork | undefined, {
    update: (m: MediaWork) => void,
    refresh: () => void
}] {
    const instance = useMemo(() => {
        if (series_key.end >= SeriesKeyType.TMDBID)
            return new TMDBMediaWork(series_key)

    }, [series_key])
    const [mediaWork, setMediaWork] = useState<MediaWork>();

    const refresh = useCallback(() => {
        instance?.get()
            .then(mediaWork => {
                setMediaWork(() => mediaWork)
            })
    }, [instance]);
    const update = useCallback((mediaWork: MediaWork) => {
        instance?.set(mediaWork)
    }, [instance,])

    useEffect(() => {
        refresh()
    }, [instance])

    return [mediaWork, { update, refresh }]
}

export function useMediaWorks(seriesKey?: SeriesKey): [MediaWork[] | undefined, boolean, () => void] {
    const [mediaWorks, setMediaWorks] = useState<MediaWork[]>();
    const [loading, setLoading] = useState(false);
    const refresh = useCallback(() => {
        if (seriesKey && (seriesKey.t ==  MediaWorkType.TV ? (seriesKey.end < SeriesKeyType.EPISODE) : (seriesKey.end < SeriesKeyType.TMDBID))
        ) {
            setLoading(true)
            new TMDBMediaWork(seriesKey).getChildren()
                .then(mediaWorks => {
                    setMediaWorks(() => mediaWorks)
                })
                .finally(() => setLoading(false))
        }
    }, [seriesKey])
    useEffect(() => {
        refresh();
    }, [refresh])
    return [mediaWorks, loading, refresh]
}
