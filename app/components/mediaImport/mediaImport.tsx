import { Button, Col, Divider, Drawer, Empty, Form, Input, InputNumber, List, Radio, Row, Select, Space, Spin, Tabs } from "antd"
import { RedoOutlined, InfoCircleOutlined } from "@ant-design/icons"
import React, { useContext, useEffect, useState } from "react"
import { MediaImportFile, MediaImportFileKey, useMediaImport, useMediaImportDispatch } from "./mediaImportContext"
import { NastoolMediaType } from "../../utils/api/api";
import { useWatch } from "antd/es/form/Form";
import { MediaImportAction } from "./mediaImportContext";
import { MediaIdentifyMerged, MediaWork, MediaWorkSeason, MediaWorkType, mergeObjects } from "@/app/utils/api/types";
import { number_string_to_list } from "@/app/utils"
import TinyTMDBSearch, { MediaDetailCard } from "../TMDBSearch/TinyTMDBSearch";
import { TMDB } from "@/app/utils/api/tmdb";
import { ImportList, ImportSubmit } from "./mediaImportList";
import { IconExternalLink } from "../icons";
import { SearchContext, SearchContextProvider } from "../TMDBSearch/SearchContext";
import useFormInstance from "antd/es/form/hooks/useFormInstance";
import _, { valuesIn } from "lodash";
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
            size="large"
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
    const [episodeMethod, setEpisodeMethod] = useState<EpisodeMethod>(EpisodeMethod.NumberString)
    const onFinish = async (values: any) => {
        let episodes: number[] = [];
        if (episodeMethod == EpisodeMethod.NumberString) {
            episodes = number_string_to_list(values.episode_string);
        } else {
            const formatString = values.episode_format as string;
            const escapedFormString = _.escapeRegExp(formatString);
            const regexp = escapedFormString.replace(_.escapeRegExp("{ep}"), "(?<ep>\\d+)")
            const re = new RegExp(regexp)
            episodes = selectedFiles.map(({ name }) => {
                const result = re.exec(name);
                return Number(result?.groups?.ep)
            })
        }
        episodes.reverse()

        const episode_offset: number = values.episode_offset || 0;
        console.log(values.episode_format, values.episode_string, episodeMethod, episodes)

        const identify = selectedFiles.map(() => {
            const episode = episodes?.pop();
            return ({
                tmdbId: mediaWork?.key ? String(mediaWork?.key) : values.tmdbId,
                season: values.season,
                episode: Number.isNaN(episode) ? undefined : episode ? (episode + episode_offset) : undefined,
                year: values.year,
                title: mediaWork?.title || values.title,
                type: mediaWork?.type || values.type
            })
        })

        mediaImportDispatch({
            type: MediaImportAction.OverrideIdentify,
            fileKeys: selectedFiles.map(({ name }) => name),
            identify: identify
        })
    }
    return <Row gutter={32} style={{ height: "100%" }}>
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
                <MediaSearch />
                <><Tabs
                    style={{ maxWidth: "100%" }}
                    defaultActiveKey={EpisodeMethod.NumberString}
                    onChange={(value) => setEpisodeMethod(value as EpisodeMethod)}
                    items={[
                        {
                            label: "手动指定",
                            key: EpisodeMethod.NumberString,
                            children: <Form.Item name="episode_string">
                                <Input placeholder="1-3,4,5..."></Input>
                            </Form.Item>
                        },
                        {
                            label: "文件名提取",
                            key: EpisodeMethod.EpisodeFormat,
                            children: <Form.Item name="episode_format">
                                <Input placeholder="{ep}"></Input>
                            </Form.Item>
                        },
                    ]}
                />
                </>
                {/* <Form.Item name="episodes">
                    <EpisodeInput fileNames={selectedFiles.map((file) => file.name)} />
                </Form.Item> */}
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
        <Col span={17} style={{ height: "100%", overflowY: "auto" }}>
            <Space direction="vertical" size="large">
                <ImportList onSelect={(files) => { setSelectedFiles(files) }} />
                <ImportSubmit files={selectedFiles} />
            </Space>
        </Col>
    </Row>
}

const EpisodeInput = (options: { value?: number[], onChange?: (value: (number)[]) => void, fileNames: MediaImportFileKey[] },) => {

    const [episodes, setEpisodes] = useState<number[]>(options.value || []);
    useEffect(() => {
        console.log(episodes)
        if (options.onChange) options.onChange(episodes);
    }, [episodes])

    return <><Tabs
        style={{ maxWidth: "100%" }}
        defaultActiveKey="手动指定"
        tabBarExtraContent={<span>{options.fileNames.length}</span>}
        onChange={() => setEpisodes([...episodes])}
        items={[
            {
                label: "手动指定",
                key: "手动指定",
                children: <><EpisodeInputFromString onChange={(values) => setEpisodes(values)} /></>
            },
            {
                label: "文件名提取",
                key: "文件名提取",
                children: <EpisodeInputFromFormat fileNames={options.fileNames} onChange={(values) => setEpisodes(values)} />
            },
        ]}
    />
    </>
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

const MediaSearch = () => {
    const searchContext = useContext(SearchContext);
    const { setSelected, selected } = searchContext;
    const [seasons, setSeasons] = useState<MediaWorkSeason[]>([])
    const [loading, setLoading] = useState(false)

    const form = useFormInstance()
    const selectedSeason = Form.useWatch('season', form);

    const onTMDBSelected = async (value: MediaWork) => {
        setSeasons([])
        setLoading(true)
        new TMDB().detail(String(value.key), value.type)
            .then(([result, seasons]) => {
                setSelected(result)
                if (seasons) setSeasons(seasons)
                else setSeasons([])
            })
            .finally(() => {
                setLoading(false)
            })
    }

    const season = TMDB.findShare(`${selected?.key}-${selectedSeason}`) as MediaWorkSeason | undefined
    const seasonOptions = seasons.map((item) => ({
        value: item.key,
        label: `季 ${item.key} - ${item.title}`,
    }))

    return <Space direction="vertical" style={{ width: "100%" }}>
        <TinyTMDBSearch onSelected={onTMDBSelected} />
        <MediaDetailCardFromSearch loading={loading} />
        <Space>
            <Form.Item label="季" wrapperCol={{ span: 8 }} name="season" style={{ marginBottom: 0 }}>
                <Select disabled={loading} loading={loading} style={{ width: "250px" }} options={seasonOptions} />
            </Form.Item>
            {season?.metadata?.links.tmdb ? <Button size="small" type="link" target="_blank" href={season?.metadata?.links.tmdb} icon={<IconExternalLink />}>TMDB</Button> : <></>}
        </Space></Space>
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
