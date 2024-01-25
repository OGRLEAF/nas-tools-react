import { Button, Col, Divider, Drawer, Empty, Form, Input, InputNumber, Row, Select, SelectProps, Space, Spin, Tabs, TabsProps } from "antd"
import React, { CSSProperties, useContext, useEffect, useMemo, useState } from "react"
import { MediaImportFile, MediaImportFileKey, useMediaImport, useMediaImportDispatch } from "./mediaImportContext"
import { NastoolMediaType } from "../../utils/api/api";
import { useWatch } from "antd/es/form/Form";
import { MediaImportAction } from "./mediaImportContext";
import { MediaWork, MediaWorkSeason, MediaWorkType, SeriesKey, SeriesKeyType } from "@/app/utils/api/types";
import { asyncEffect, number_string_to_list } from "@/app/utils"
import TinyTMDBSearch, { MediaDetailCard, MediaSearchGroup, MediaSearchSeason, MediaSearchWork } from "../TMDBSearch/TinyTMDBSearch";
import { TMDB } from "@/app/utils/api/media/tmdb";
import { ImportList } from "./mediaImportList";
import { SearchContext, SearchContextProvider, useSearch } from "../TMDBSearch/SearchContext";
import _ from "lodash";
export interface MediaImportInitial {
    type: NastoolMediaType,
    tmdbid: string
}


const MediaImportFilter = () => {
    const mediaImportDispatch = useMediaImportDispatch();
    const mediaImportContext = useMediaImport();

    const [toolsForm] = Form.useForm<{ filter: string }>();
    const filterContent = useWatch('filter', toolsForm);
    useEffect(() => {
        mediaImportDispatch({ type: MediaImportAction.UpdateFilter, filter: filterContent })
    }, [filterContent])
    const filteringOptions = [
        {
            value: "format",
            label: "模板"
        },
        {
            value: "regex",
            label: "正则"
        }
    ]
    return <Form initialValues={{ filter: mediaImportContext.regexFilter, filteringType: "regex" }} form={toolsForm} layout="inline">
        <Space>
            <Form.Item name="filteringType">
                <Select options={filteringOptions} />
            </Form.Item>
            <Form.Item rules={[{
                message: "无效的正则表达式",
                validator: (rule, value) => {
                    try {
                        const regex = new RegExp(value);
                        return Promise.resolve(regex)
                    } catch {
                        return Promise.reject("正则表达式非法。")
                    }
                }
            }]} name="filter">
                <Input style={{ width: 500 }} placeholder="过滤"></Input>
            </Form.Item>
            {/* <Button onClick={() => onGroup()} type="primary">识别归类</Button> */}
        </Space>
    </Form>
}




export default function MediaImportWrapper({ initialValue }: { initialValue?: MediaImportInitial }) {
    const mediaImportDispatch = useMediaImportDispatch();
    const mediaImportContext = useMediaImport();


    return (<div>
        <Drawer placement="top"
            open={mediaImportContext.isImportWorkspaceOpen}
            onClose={() => { mediaImportDispatch({ type: "close_workspace" }) }}
            height={850}
            extra={
                <MediaImportFilter />
            }
        >
            <MediaImport />
        </Drawer>
    </div>)
}

enum EpisodeMethod {
    NumberString = 'n',
    EpisodeFormat = 'e'
}

const MediaImport = () => {
    const mediaImportContext = useMediaImport();
    const mediaImportDispatch = useMediaImportDispatch();
    const [form] = Form.useForm();
    const [search] = useSearch();

    const selectedFiles = useMemo(() => mediaImportContext.penddingFiles.filter(v => v.selected), [mediaImportContext])
    const onFinish = async (values: any) => {
        const series: SeriesKey = values.series;
        const episodes = values.episodes ? [...values.episodes] : [];
        const tmdbId = series.i;
        if (tmdbId != undefined) {

            const season = Number(series.s);

            const identify = selectedFiles.map((v) => {
                const episode = episodes?.shift();
                console.log(v, episode)
                return new SeriesKey(series)
                    // .type(mediaWork?.type || values.type)
                    // .tmdbId(tmdbId)
                    .season(Number.isNaN(season) ? v.indentifyHistory.last().s : season)
                    .episode(Number.isNaN(episode) ? undefined : episode)
            })
            console.log(identify)
            mediaImportDispatch({
                type: MediaImportAction.SetSeries,
                fileKeys: selectedFiles.map(({ name }) => name),
                series: identify
            })
        }
    }


    const series = Form.useWatch("series", form) as SeriesKey;
    return <Row gutter={16} style={{ height: "100%" }}>
        <Col span={7}>
            <Form form={form}
                // layout="vertical"
                initialValues={{
                    type: NastoolMediaType.MOVIE,
                    // episodes: [],
                    episode_string: "",
                    episode_format: "{ep}",
                    tmdbid: undefined,
                    episode_offset: 0
                }}
                onFinish={onFinish}>
                <Space direction="vertical" style={{ width: "100%" }}>
                    <SearchContext.Provider value={search}>
                        <Form.Item name="series" noStyle>
                            {/* <MediaSearch /> */}
                            <MediaSearchGroup ctx={search}>
                                <MediaSearchWork />
                                <br />
                                <MediaSearchSeason />
                                <br />
                            </MediaSearchGroup>
                        </Form.Item>
                    </SearchContext.Provider>
                    {series?.t == MediaWorkType.TV || series?.t == MediaWorkType.ANI ? <>
                        <SearchContext.Provider value={search}>
                            <Form.Item name="episodes">
                                <EpisodeInput fileNames={selectedFiles.map((file) => file.name)} />
                            </Form.Item>
                        </SearchContext.Provider>
                    </> : <></>
                    }
                    <Form.Item>
                        <Button type="primary" htmlType="submit">应用</Button>
                    </Form.Item>
                </Space>
            </Form>
        </Col>
        <Col span={17} style={{ height: "100%", overflowY: "auto" }}>
            <SearchContext.Provider value={search}>
                <ImportList />
            </SearchContext.Provider>
        </Col>
    </Row >
}

const EpisodeInput = (options: { value?: number[], onChange?: (value: (number)[]) => void, fileNames: MediaImportFileKey[] },) => {

    enum TabKey {
        TMDB = "tmdb",
        NUMBERS = "number",
        FORMAT = "format"
    }
    const [currentTab, setCurrentTab] = useState<TabKey>(TabKey.TMDB)
    const [episodes, setEpisodes] = useState<Record<TabKey, number[]>>({
        [TabKey.TMDB]: [],
        [TabKey.NUMBERS]: [],
        [TabKey.FORMAT]: [],
    });
    const SetEpisodes = (key: TabKey, eps: number[]) => {

        setEpisodes({
            ...episodes,
            [key]: eps
        })
    }
    useEffect(() => {
        if (options.onChange) {
            const eps = episodes[currentTab];
            console.log(episodes, currentTab, eps);
            options.onChange(eps);
        }
    }, [currentTab, episodes])


    const TabOptions: TabsProps['items'] = [
        {
            label: "TMDB",
            key: TabKey.TMDB,
            children: <><EpisodeInputFromTMDB onChange={(values) => SetEpisodes(TabKey.TMDB, values)} /></>
        },
        {
            label: "手动指定",
            key: TabKey.NUMBERS,
            children: <><EpisodeInputFromString onChange={(values) => SetEpisodes(TabKey.NUMBERS, values)} /></>
        },
        {
            label: "文件名提取",
            key: TabKey.FORMAT,
            children: <EpisodeInputFromFormat fileNames={options.fileNames} onChange={(values) => SetEpisodes(TabKey.FORMAT, values)} />
        },
    ]
    return <><Tabs
        style={{ maxWidth: "100%" }}
        defaultActiveKey={TabKey.TMDB}
        tabBarExtraContent={<span>{options.fileNames.length}</span>}
        onChange={(activeKey) => setCurrentTab(activeKey as TabKey)}
        items={TabOptions}
    />
    </>
}

const EpisodeInputFromTMDB = (options: { onChange: (value: number[]) => void }) => {
    const [episodeOptions, setEpisodeOptions] = useState<SelectProps['options']>([]);
    const selectContext = useContext(SearchContext);
    const { series } = selectContext;
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState<number[]>([])
    useEffect(asyncEffect(async () => {
        setLoading(true)
        console.log(series)
        if (series.end == SeriesKeyType.SEASON) {
            const season = new TMDB().fromSeries(series.slice(SeriesKeyType.SEASON));
            if (season) {
                const episodes = await season.get_children();
                // console.log("EpisodeInputFromTMDB", episodes)
                setEpisodeOptions(episodes.sort((a, b) => a.key - b.key).map((ep) => ({
                    value: ep.key,
                    label: <span>{ep.key}<Divider type="vertical" />{ep.metadata?.title}</span>
                })))
                setValue([]);
            }
        }
        setLoading(false)
    }), [series])

    const onChange = (values: number[]) => {
        setValue(values)
        options.onChange(values);
    }
    return <Select
        placeholder={episodeOptions?.length ? `从共${episodeOptions?.length}集中选择` : "选择前置信息"}
        tokenSeparators={[',']}
        disabled={loading || (episodeOptions?.length == 0)}
        loading={loading}
        mode="multiple"
        value={value}
        onChange={onChange}
        options={episodeOptions}
        allowClear />
}

const EpisodeInputFromString = (options: { onChange: (value: number[]) => void, }) => {
    const [format, setFormat] = useState<string>("{ep}")
    const fromString = (value: any) => {
        setFormat(value.target.value as string);
    }
    useEffect(() => {
        if (format !== undefined) {
            const episodesString = format as string;
            const episodes = number_string_to_list(episodesString);
            options.onChange(episodes)
        } else {
            options.onChange([])
        }
    }, [format])
    return <Input placeholder="1-3,4,5" onChange={fromString} />
}

const EpisodeInputFromFormat = (options: { onChange: (value: number[]) => void, fileNames: MediaImportFileKey[] }) => {
    const [offset, setOffset] = useState(0)
    const [formatPat, setFormatPat] = useState<string>();
    useEffect(() => {
        const formatString = formatPat;
        const escapedFormString = _.escapeRegExp(formatString);
        const regexp = escapedFormString.replace(_.escapeRegExp("{ep}"), "(?<ep>\\d+)")
        const re = new RegExp(regexp)
        const eps: number[] = [];
        options.fileNames.forEach((filename) => {
            const result = re.exec(filename);
            eps.push(Number(result?.groups?.ep) + offset)
        })
        if (options.onChange) {
            options.onChange(eps);
        }
    }, [offset, formatPat])
    return <Space direction="vertical" style={{ width: "100%" }}>
        <Input placeholder="E{ep}" onChange={(value) => setFormatPat(value.currentTarget.value)} />
        <InputNumber value={offset} onChange={(value) => { if (value != null) { setOffset(value) } }} precision={0} placeholder="集数偏移" />
    </Space>
}

const MediaSearch = ({ value, onChange }: { value?: string[], onChange?: (value: SeriesKey) => void }) => {
    const searchContext = useContext(SearchContext);
    const { setSelected, selected, series, setSeries } = searchContext;
    const [seasons, setSeasons] = useState<MediaWorkSeason[]>([])
    const [loading, setLoading] = useState(false)

    const onTMDBSelected = async (value: MediaWork) => {
        setSeasons([])
        setLoading(true)
        const work = new TMDB().work(String(value.key), value.type)
        const mediaWork = await work.get();
        if (mediaWork) setSeries(new SeriesKey(mediaWork.series).tmdbId(mediaWork.key))
        setLoading(false)
    }
    const isTvSeries = useMemo(() => {
        return (series.t == MediaWorkType.TV || series.t == MediaWorkType.ANI)
    }, [series])
    useEffect(asyncEffect(async () => {
        if (series.i != undefined) {
            const media = new TMDB().fromSeries(series.slice(SeriesKeyType.TMDBID));
            const mediaWork = await media?.get();
            if (mediaWork && media) {
                setSelected(mediaWork);
            }
        }
    }), [series.i])


    useEffect(() => {
        if (onChange) onChange(new SeriesKey(series))
    }, [series])

    return <Space direction="vertical" style={{ width: "100%" }}>
        <TinyTMDBSearch onSelected={onTMDBSelected} />
        {/* <MediaDetailCardFromSearch loading={loading} />
         */}
        <Spin spinning={loading} style={{ height: "150px", }}>
            <MediaDetailCard mediaDetail={selected} size="small" />
        </Spin>
        {isTvSeries ?
            <Space>
                季：<MediaSeasonInput style={{ width: 250 }}
                    series={series}
                    onChange={(value) => {

                        if (series.has("tmdbId")) {
                            setSeries(new SeriesKey(series).season(value))
                        }
                    }} />
            </Space>
            : <></>}
    </Space>
}

export const MediaSeasonInput = ({ series, value, onChange, style }: { series: SeriesKey, value?: number, onChange?: (value: number) => void, style?: CSSProperties }) => {
    const [seasonOptions, setSeasonOptions] = useState<SelectProps['options']>([])
    const [loading, setLoading] = useState(false)
    useEffect(asyncEffect(async () => {
        setLoading(true)
        if (series.i) {
            const media = new TMDB().fromSeries(series.slice(SeriesKeyType.TMDBID));
            const mediaWork = await media?.get();
            if (mediaWork && media) {
                if (mediaWork.series.t == MediaWorkType.TV || mediaWork.series.t == MediaWorkType.ANI) {
                    const seasons = await media.get_children()
                    if (seasons?.length) {
                        const options = seasons.map((item) => ({
                            value: item.key,
                            label: `季 ${item.key} - ${item.title}`,
                        }))
                        setSeasonOptions(options);
                    } else {
                        setSeasonOptions([])
                    }
                }
            }
            setLoading(false)
        }
    }), [series.i])

    return <Select value={value} disabled={loading} loading={loading} style={style}
        options={seasonOptions}
        onSelect={(value: number) => {
            if (onChange) onChange(value)
        }}
    // onSelect={(value: number) => {
    //     // console.log(value)
    //     if (value !== undefined) setSelectedSeason(value);
    //     if (series.has("tmdbId")) {
    //         setSeries(new SeriesKey(series).season(value))
    //     }
    // }}
    />
}
