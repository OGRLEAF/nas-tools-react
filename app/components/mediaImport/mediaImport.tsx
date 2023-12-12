import { Breadcrumb, Button, Col, Divider, Drawer, Empty, Form, Input, InputNumber, List, Radio, Row, Select, SelectProps, Space, Spin, Tabs, TabsProps } from "antd"
import { RedoOutlined, InfoCircleOutlined } from "@ant-design/icons"
import React, { CSSProperties, useContext, useEffect, useMemo, useState } from "react"
import { MediaImportFile, MediaImportFileKey, useMediaImport, useMediaImportDispatch } from "./mediaImportContext"
import { NastoolMediaType } from "../../utils/api/api";
import { useWatch } from "antd/es/form/Form";
import { MediaImportAction } from "./mediaImportContext";
import { MediaIdentifyMerged, MediaWork, MediaWorkSeason, MediaWorkType, SeriesKey, SeriesKeyType, mergeObjects } from "@/app/utils/api/types";
import { asyncEffect, number_string_to_list } from "@/app/utils"
import TinyTMDBSearch, { MediaDetailCard } from "../TMDBSearch/TinyTMDBSearch";
import { TMDB, TMDBMedia, TMDBMediaWork } from "@/app/utils/api/tmdb";
import { ImportList } from "./mediaImportList";
import { IconExternalLink } from "../icons";
import { SearchContext, SearchContextProvider } from "../TMDBSearch/SearchContext";
import useFormInstance from "antd/es/form/hooks/useFormInstance";
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
            <Form.Item>

            </Form.Item>
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
            <SearchContextProvider>
                <MediaImport />
            </SearchContextProvider>
        </Drawer>
    </div>)
}

enum EpisodeMethod {
    NumberString = 'n',
    EpisodeFormat = 'e'
}

const MediaImport = () => {
    const mediaImportDispatch = useMediaImportDispatch();
    const [form] = Form.useForm();

    const searchContext = useContext(SearchContext);
    const { selected: mediaWork } = searchContext;
    const [selectedFiles, setSelectedFiles] = useState<MediaImportFile[]>([])
    // const [episodeMethod, setEpisodeMethod] = useState<EpisodeMethod>(EpisodeMethod.NumberString)
    const onFinish = async (values: any) => {
        const series: SeriesKey = values.series;
        const episodes = [...values.episodes];

        const episode_offset: number = values.episode_offset || 0;
        // console.log(values.episode_format, values.episode_string, episodeMethod, episodes)
        const tmdbId = series.i;
        if (tmdbId != undefined) {

            const season = Number(series.s);
            const identify = selectedFiles.map(() => {
                const episode = episodes?.shift();
                // return ({
                //     tmdbId: String(tmdbId), // mediaWork?.key ? String(mediaWork?.key) : values.tmdbId,
                //     season: Number.isNaN(season) ? undefined : season,// values.season,
                //     episode: Number.isNaN(episode) ? undefined : episode ? (episode + episode_offset) : undefined,
                //     year: values.year,
                //     title: mediaWork?.title || values.title,
                //     type: mediaWork?.type || values.type
                // })
                return new SeriesKey(series).type(mediaWork?.type || values.type)
                    .tmdbId(tmdbId)
                    .season(Number.isNaN(season) ? undefined : season)
                    .episode(Number.isNaN(episode) ? undefined : episode ? (episode + episode_offset) : undefined)
            })
            mediaImportDispatch({
                type: MediaImportAction.SetSeries,
                fileKeys: selectedFiles.map(({ name }) => name),
                series: identify
            })
        }
    }
    // const onFinish = async (value: any) => {
    //     console.log(value)
    // }

    return <Row gutter={32} style={{ height: "100%" }}>
        <Col span={6}>
            <Form form={form}
                // layout="vertical"
                initialValues={{
                    type: NastoolMediaType.MOVIE,
                    // episodes: [],
                    series: [],
                    episode_string: "",
                    episode_format: "{ep}",
                    tmdbid: undefined,
                    episode_offset: 0
                }}
                onFinish={onFinish}>
                <Form.Item name="series" noStyle>
                    <MediaSearch />
                </Form.Item>

                <Form.Item name="episodes">
                    <EpisodeInput fileNames={selectedFiles.map((file) => file.name)} />
                </Form.Item>
                <Space>
                    <Form.Item label="集数偏移" name="episode_offset">
                        <InputNumber placeholder="集数偏移" />
                    </Form.Item>
                </Space>

                <Form.Item>
                    <Button type="primary" htmlType="submit">应用</Button>
                </Form.Item>
            </Form>
        </Col>
        <Col span={18} style={{ height: "100%", overflowY: "auto" }}>
            <Space direction="vertical" size="large">
                <ImportList onSelect={(files) => { setSelectedFiles(files) }} />
                {/* <ImportSubmit files={selectedFiles} /> */}
            </Space>
        </Col>
    </Row>
}

const EpisodeInput = (options: { value?: number[], onChange?: (value: (number)[]) => void, fileNames: MediaImportFileKey[] },) => {

    enum TabKey {
        TMDB = "tmdb",
        NUMBERS = "number",
        FORMAT = "format"
    }
    const [currentTab, setCurrentTab] = useState<TabKey>(TabKey.NUMBERS)
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
            if (options.onChange) options.onChange(eps);
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
        defaultActiveKey={TabKey.NUMBERS}
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
        tokenSeparators={[',']}
        disabled={loading}
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
    return <Input onChange={fromString} />
}

const EpisodeInputFromFormat = (options: { onChange: (value: number[]) => void, fileNames: MediaImportFileKey[] }) => {
    const fromFormat = (value: any) => {
        const formatString = value.target.value as string;
        const escapedFormString = _.escapeRegExp(formatString);
        const regexp = escapedFormString.replace(_.escapeRegExp("{ep}"), "(?<ep>\\d+)")
        const re = new RegExp(regexp)
        const eps: number[] = [];
        options.fileNames.forEach((filename) => {
            const result = re.exec(filename);
            eps.push(Number(result?.groups?.ep))
        })
        console.log(eps)
        if (options.onChange) options.onChange(eps);
    }
    return <>
        <Input onChange={fromFormat} />
    </>
}

const MediaSearch = ({ value, onChange }: { value?: string[], onChange?: (value: SeriesKey) => void }) => {
    const searchContext = useContext(SearchContext);
    const { setSelected, selected, series, setSeries } = searchContext;
    const [seasons, setSeasons] = useState<MediaWorkSeason[]>([])
    const [loading, setLoading] = useState(false)

    const [selectedSeason, setSelectedSeason] = useState<number>(); //Form.useWatch('season', form);

    const onTMDBSelected = async (value: MediaWork) => {
        setSeasons([])
        setLoading(true)
        const work = new TMDB().work(String(value.key), value.type)
        const mediaWork = await work.get();
        if (mediaWork) setSeries(new SeriesKey(mediaWork.series).tmdbId(mediaWork.key))
        setLoading(false)
    }

    const [seasonOptions, setSeasonOptions] = useState<SelectProps['options']>([])
    const isTvSeries = useMemo(() => {
        return (series.t == MediaWorkType.TV || series.t == MediaWorkType.ANI)
    }, [series])
    useEffect(asyncEffect(async () => {
        console.log("On Series[0] updated")
        if (series.i != undefined) {
            const media = new TMDB().fromSeries(series.slice(SeriesKeyType.TMDBID));
            const mediaWork = await media?.get();
            if (mediaWork && media) {
                setSelected(mediaWork);
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
                    setSelectedSeason(undefined)
                }
            }
        }
    }), [series.i])


    useEffect(() => {
        if (series.has("season")) {
            setSelectedSeason(series.s);
        }

    }, [series.s])
    useEffect(() => {
        if (onChange) onChange(new SeriesKey(series))
    }, [series])

    return <Space direction="vertical" style={{ width: "100%" }}>
        <TinyTMDBSearch onSelected={onTMDBSelected} />
        <MediaDetailCardFromSearch loading={loading} />
        {isTvSeries ?
            <Space>
                <MediaSeasonInput style={{ width: 250 }}
                    series={series}
                    onChange={(value) => {
                        if (value !== undefined) setSelectedSeason(value);
                        if (series.has("tmdbId")) {
                            setSeries(new SeriesKey(series).season(value))
                        }
                    }} />
                {/* <Select value={selectedSeason} disabled={loading} loading={loading} style={{ width: "250px" }}
                    options={seasonOptions}
                    onSelect={(value: number) => {
                        // console.log(value)
                        if (value !== undefined) setSelectedSeason(value);
                        if (series.has("tmdbId")) {
                            setSeries(new SeriesKey(series).season(value))
                        }
                    }}
                /> */}
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

const MediaDetailCardFromSearch = ({ loading }: { loading?: boolean }) => {
    const searchContext = useContext(SearchContext);
    const { selected } = searchContext;
    if (loading) return <Spin style={{ height: "150px", }}></Spin>
    if (selected)
        return <MediaDetailCard mediaDetail={selected} size="small" />
    else
        return <Empty />
}
