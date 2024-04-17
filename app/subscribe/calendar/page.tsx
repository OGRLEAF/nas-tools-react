"use client"
import { Section } from "@/app/components/Section";
import { MediaDetailCard } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { Subscription, TVSubscription } from "@/app/utils/api/subscription/subscribe";
import { TMDB } from "@/app/utils/api/media/tmdb";
import { MediaWork, MediaWorkEpisode, MediaWorkType, SeriesKey, SeriesKeyType } from "@/app/utils/api/types";
import { Calendar, CalendarProps, Card, Popover, Space, Spin, theme } from "antd";
import { Dayjs } from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAPIContext } from "@/app/utils/api/api_base";

export default function SubscribeCalendar() {
    const [tvEpisodes, setTvEpisodes] = useState<MediaWorkEpisode[]>([]);
    const { API } = useAPIContext();
    const [loading, setLoading] = useState(false)
    const fetchEpisodes = useCallback(async () => {
        if (API) {
            setLoading(true)
            const subscribe = new TVSubscription(API);
            const tvSubs = await subscribe.list();
            const subsSeries = Object.values(tvSubs).map((sub) => {
                return new SeriesKey().type(MediaWorkType.TV).tmdbId(sub.mediaid).season(sub.season);
            })
            const tmdb = new TMDB();

            const fetchedEpisodes = subsSeries.map(async (key) => {
                if (key.end == SeriesKeyType.SEASON) {
                    const mediaWork = tmdb.fromSeries(key)
                    if (mediaWork) {
                        const episodes = await mediaWork.get_children();
                        return episodes
                    } else {
                        return []
                    }
                }
            });
            Promise.all(fetchedEpisodes)
                .then((episodes) => {
                    const tvEpisodes: MediaWorkEpisode[] = [];
                    episodes.forEach((episodes) => {
                        if (episodes) tvEpisodes.push(...episodes)
                    })
                    setTvEpisodes(tvEpisodes)
                    setLoading(false)
                })
        }

    }, [API])
    const episodesGroupByDate = useMemo(() => {
        const dateMap = new Map<string, MediaWork[]>()
        tvEpisodes.forEach((tv) => {
            const releaseDate = tv.metadata?.date?.release
            if (releaseDate != undefined) {
                const episodesInDay = dateMap.get(releaseDate);
                if (episodesInDay) episodesInDay.push(tv);
                else dateMap.set(releaseDate, [tv])
            }

        })
        return dateMap;
    }, [tvEpisodes])
    const dateCellRender = useCallback((current: Dayjs) => {
        const dateFormat = current.format("YYYY-MM-DD");
        const episodes = episodesGroupByDate.get(dateFormat);
        if (episodes) return <>
            {
                episodes.map((ep, idx) => <CalendarCard key={idx} mediaWork={ep} />)
            }
        </>
    }, [episodesGroupByDate])

    const cellRender = useCallback((current: Dayjs, info: { type: string; originNode: any; }) => {
        if (info.type === 'date') return dateCellRender(current);
        return info.originNode;
    }, [dateCellRender])

    useEffect(() => {
        fetchEpisodes()
    }, [fetchEpisodes])

    return <Section title="订阅日历" onRefresh={fetchEpisodes}>
        <Spin spinning={loading}>
            <Calendar cellRender={cellRender} />
        </Spin>
    </Section>
}

const CalendarCard = (options: { mediaWork: MediaWork }) => {
    const { series } = options.mediaWork;
    const { metadata } = options.mediaWork;
    const [topMediaWork, setTopMediaWork] = useState<MediaWork>();
    useEffect(() => {
        new TMDB().fromSeries(new SeriesKey().type(series.t).tmdbId(series.i))
            ?.get()
            .then((topMediaWork) => {
                setTopMediaWork(topMediaWork)
            })
    })
    const { token } = theme.useToken();
    return <>

        <div
            style={{
                padding: "0px 8px 0px 8px",
                marginBottom: 2,
                borderLeft: `solid 4px ${token.colorPrimaryBorder}`,
                backgroundColor: token.colorPrimaryBg,
                display: "inline-flex",
                justifyContent: "space-between",
                width: "100%",

            }}
        >
            <span>
                <Popover content={
                    <MediaDetailCard size="card" mediaDetail={options.mediaWork} />
                } >
                    {topMediaWork?.metadata?.title}
                </Popover >
            </span>
            <span>S{series.s}E{series.e}  {metadata?.title}</span>
        </div>

    </>
}