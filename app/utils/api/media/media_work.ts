import _ from "lodash";
import { DBMediaType, NASTOOL } from "../api";
import { APIBase } from "../api_base";
import { MediaIdentifyContext, MediaWorkEpisode, MediaWorkMetadata, MediaWorkSeason, MediaWorkType, SeriesKeyType } from "../types"
import { SeriesKey, SeriesKeyTuple } from "./SeriesKey"
import { useCallback, useEffect, useState } from "react";


export interface MediaWork {
    series: SeriesKey,
    type: MediaWorkType,
    metadata?: MediaWorkMetadata,
}

export interface MediaWorkData {
    series: SeriesKeyTuple,
    type: MediaWorkType,
    key: number | string,
    title: string
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
        const [t, ...keys] = series_key.dump();
        const queryType = t && this.typeMap[t as MediaWorkType]
        if (t) {
            const query_path = keys.join("/")
            const mediaWorkData = await this.API.get<MediaWorkData>(`media_work/${queryType}/${query_path}`, { auth: true })
            const mediaWork: MediaWork = {
                ...mediaWorkData,
                series: SeriesKey.load(mediaWorkData.series)
            }
            return mediaWork
        }
    }

    public async getChildrenBySeriesKey(series_key: SeriesKey) {
        const [t, ...keys] = series_key.dump();
        const queryType = t && this.typeMap[t as MediaWorkType]
        if (t) {
            const query_path = keys.join("/")
            const media_work = this.API.get<{ list: MediaWorkData[] }>(`media_work/${queryType}/${query_path}/s`, { auth: true })
            return (await media_work).list.map((item) => ({
                ...item,
                series: SeriesKey.load(item.series)
            }))
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
        const mediaWorks = await new MediaWorkService().getChildrenBySeriesKey(this.series_key)
        return mediaWorks
    }
}


export function useMediaWork(series_key: SeriesKey) {
    const [mediaWork, setMediaWork] = useState<MediaWork>();
    useEffect(() => {
        new TMDBMediaWork(series_key).get()
            .then(mediaWork => {
                setMediaWork(() => mediaWork)
            })
    }, [series_key])
    return [mediaWork]
}

export function useMediaWorks(series_key?: SeriesKey): [MediaWork[] | undefined, boolean] {
    const [mediaWorks, setMediaWorks] = useState<MediaWork[]>();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (series_key) {
            setLoading(true)
            new TMDBMediaWork(series_key).getChildren()
                .then(mediaWorks => {
                    setMediaWorks(() => mediaWorks)
                })
                .finally(() => setLoading(false))
        }
    }, [series_key])
    return [mediaWorks, loading]
}