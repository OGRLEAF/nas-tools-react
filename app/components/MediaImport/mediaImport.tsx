import { Button, Col, Divider, Drawer, Form, Input, InputNumber, Row, Select, SelectProps, Space, Table, Tabs, TabsProps } from "antd"
import React, { CSSProperties, memo, useEffect, useMemo, useState } from "react"
import { HolderOutlined } from "@ant-design/icons"
import { MediaImportFileKey, useMediaImport, useMediaImportDispatch } from "./mediaImportContext"
import { NastoolMediaType } from "../../utils/api/api";
import { useWatch } from "antd/es/form/Form";
import { MediaImportAction } from "./mediaImportContext";
import { MediaWorkType, SeriesKey, SeriesKeyType } from "@/app/utils/api/types";
import { number_string_to_list } from "@/app/utils"
import { MediaSearchGroup, MediaSearchSeason, MediaSearchWork } from "../TMDBSearch/TinyTMDBSearch";
import { ImportList } from "./mediaImportList";
import { SearchContext, useSearch } from "../TMDBSearch/SearchContext";
import TaskBar from "@/app/components/taskflow/Taskbar"
import _ from "lodash";
import { MediaWork, MediaWorkMetadata, useMediaWorks } from "@/app/utils/api/media/mediaWork";
import { ColumnsType } from "antd/lib/table";
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


    return (<Drawer placement="top"
        getContainer={false}
        title={<TaskBar />}
        open={mediaImportContext.isImportWorkspaceOpen}
        onClose={() => { mediaImportDispatch({ type: "close_workspace" }) }}
        size={850}
    >
        <MediaImport />
    </Drawer>)
}

enum EpisodeMethod {
    NumberString = 'n',
    EpisodeFormat = 'e'
}

function MediaImport() {
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
    useEffect(() => {
        console.log('outter', search.series)
        form.setFieldValue('series', new SeriesKey(search.series))

    }, [form, search.series])

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
                <Space orientation="vertical" style={{ width: "100%" }}>
                    <SearchContext.Provider value={search}>
                        <Form.Item name="series" noStyle>
                            <MediaSearchGroup>
                                <MediaSearchWork />
                                <br />
                                <MediaSearchSeason />
                                <br />
                            </MediaSearchGroup>
                        </Form.Item>
                    </SearchContext.Provider>
                    {series?.t == MediaWorkType.TV || series?.t == MediaWorkType.ANI ? <>
                        <span>{series.t} {series.i} {series.s}</span>
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

const EpisodeInput = memo((options: { value?: number[], onChange?: (value: (number)[]) => void, fileNames: MediaImportFileKey[] },) => {

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
})

const EpisodeInputFromTMDB = (options: { onChange: (value: number[]) => void }) => {
    const [episodeOptions, setEpisodeOptions] = useState<SelectProps['options']>([]);
    // const selectContext = useContext(SearchContext);
    // const { series } = selectContext;
    const [value, setValue] = useState<number[]>([])

    const form = Form.useFormInstance();
    const series: SeriesKey | undefined = Form.useWatch('series', form)

    const seriesKeyValidated = useMemo(() => {
        console.log("SeriesUpdated: ", series);
        if (series) {
            if (series.end == SeriesKeyType.SEASON) {
                return new SeriesKey(series); // .episode(ANY)
            }
        }
    }, [series])

    const [episodes, loading] = useMediaWorks(seriesKeyValidated)


    useEffect(() => {
        console.log("Episodes Updated: ", episodes);
        if (episodes) {
            setEpisodeOptions(episodes.sort((a, b) => (a.series.e && b.series.e) ? a.series.e - b.series.e : 0).map((ep) => ({
                value: ep.series.e,
                label: <span>{ep.series.e}<Divider orientation="vertical" />{ep.metadata?.title}</span>
            })))

            setValue([])
        }
    }, [episodes])

    const onChange = (values: number[]) => {
        setValue(values)
        options.onChange(values);
    }
    
    const columns: ColumnsType<MediaWork> = [
        {
            title: '集数',
            dataIndex: 'series',
            key: 'series',
            render: (series: SeriesKey) => series.e,
            width: 80,
        },
        {
            title: '标题',
            dataIndex: 'metadata',
            key: 'metadata',
            render: (metadata: MediaWorkMetadata) => metadata?.title
        },
        {
            title: '操作',
            render: (record:MediaWork) => {
                return <div onDragStart={
                    (e) => {
                         e.dataTransfer.setData('text/json', JSON.stringify(record.series.dump()));
                    }
                } draggable><HolderOutlined /></div>
            },
            width: 60
        }
    ]

    return <Table
        size="small"
        columns={columns}
        loading={loading}
        dataSource={episodes}
        scroll={{y: 280}}
        pagination={false}
        rowKey={(row) => row.series.e as React.Key}
        rowSelection={{
            type: 'checkbox',
            selectedRowKeys: value,
            onChange: (selectedRowKeys) => {
                const eps = selectedRowKeys as number[];
                onChange(eps);
            },
        }}
    />
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
    return <Space orientation="vertical" style={{ width: "100%" }}>
        <Input placeholder="E{ep}" onChange={(value) => setFormatPat(value.currentTarget.value)} />
        <InputNumber value={offset} onChange={(value) => { if (value != null) { setOffset(value) } }} precision={0} placeholder="集数偏移" />
    </Space>
}


export const MediaSeasonInput = ({ series, value, onChange, style }: { series: SeriesKey, value?: number, onChange?: (value: number) => void, style?: CSSProperties }) => {
    const [seasonOptions, setSeasonOptions] = useState<SelectProps['options']>([])
    const [loading, setLoading] = useState(false)

    const validatedSeriesKey = useMemo(() => {
        if (series.i) {
            return new SeriesKey(series).slice(SeriesKeyType.TMDBID)
        }
    }, [series]);

    const [seasons] = useMediaWorks(validatedSeriesKey);

    useEffect(() => {
        console.log("MediaSeasonInput", seasons)
        if (seasons) {
            if (seasons?.length) {
                const options = seasons.map((item) => ({
                    value: item.series.s,
                    label: `季 ${item.series.s} - ${item.metadata?.title}`,
                }))
                setSeasonOptions(options);
            } else {
                setSeasonOptions([])
            }
        }
    }, [seasons])

    return <Select value={value} disabled={loading || (series.i == undefined)} loading={loading} style={style}
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
