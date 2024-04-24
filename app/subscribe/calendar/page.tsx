"use client"
import { Section } from "@/app/components/Section";
import { MediaDetailCard } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { TVSubscription } from "@/app/utils/api/subscription/subscribe";
import { TMDB } from "@/app/utils/api/media/tmdb";
import { MediaWork, MediaWorkEpisode, MediaWorkType, SeriesKey, SeriesKeyType } from "@/app/utils/api/types";
import { Calendar, Col, Popover, Radio, Row, Select, Spin, theme } from "antd";
import dayjs, { Dayjs } from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAPIContext } from "@/app/utils/api/api_base";
import { HeaderRender } from "antd/es/calendar/generateCalendar";

import 'dayjs/locale/zh-cn';
import dayLocaleData from 'dayjs/plugin/localeData';

dayjs.extend(dayLocaleData);

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
            <Calendar cellRender={cellRender} headerRender={CalendarHeader} />
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
        <Popover content={
            <MediaDetailCard size="card" mediaDetail={options.mediaWork} />
        } >
            <div
                style={{
                    padding: "0px 4px 0px 4px",
                    marginBottom: 2,
                    fontSize: token.fontSizeSM,
                    borderLeft: `solid 3px ${token.colorPrimaryBorder}`,
                    backgroundColor: token.colorInfoBgHover,
                    // display: "inline-flex",
                    justifyContent: "space-between",
                    width: "100%",
                }}
            >
                <> {topMediaWork?.metadata?.title}</>
                <div style={{ textAlign: "end" }}>
                    {series.s && `S${series.s}`}{series.e && `E${series.e}`} {metadata?.title}
                </div>
            </div>
        </Popover>
    </>
}


function CalendarHeader({ value, type, onChange, onTypeChange }: Parameters<HeaderRender<Dayjs>>[0]) {
    const start = 0;
    const end = 12;
    const monthOptions = [];

    let current = value.clone();
    const localeData = value.localeData();
    const months = [];
    for (let i = 0; i < 12; i++) {
        current = current.month(i);
        months.push(localeData.monthsShort(current));
    }

    for (let i = start; i < end; i++) {
        monthOptions.push(
            <Select.Option key={i} value={i} className="month-item">
                {months[i]}
            </Select.Option>,
        );
    }

    const year = value.year();
    const month = value.month();
    const options = [];
    for (let i = year - 10; i < year + 10; i += 1) {
        options.push(
            <Select.Option key={i} value={i} className="year-item">
                {i}
            </Select.Option>,
        );
    }
    return (
        <div style={{ padding: 8 }}>
            <Row gutter={8}>
                <Col>
                    <Radio.Group
                        size="small"
                        onChange={(e) => onTypeChange(e.target.value)}
                        value={type}
                    >
                        <Radio.Button value="month">Month</Radio.Button>
                        <Radio.Button value="year">Year</Radio.Button>
                    </Radio.Group>
                </Col>
                <Col>
                    <Select
                        size="small"
                        popupMatchSelectWidth={false}
                        className="my-year-select"
                        value={year}
                        onChange={(newYear) => {
                            const now = value.clone().year(newYear);
                            onChange(now);
                        }}
                    >
                        {options}
                    </Select>
                </Col>
                <Col>
                    <Select
                        size="small"
                        popupMatchSelectWidth={false}
                        value={month}
                        onChange={(newMonth) => {
                            const now = value.clone().month(newMonth);
                            onChange(now);
                        }}
                    >
                        {monthOptions}
                    </Select>
                </Col>
            </Row>
        </div>
    )
}