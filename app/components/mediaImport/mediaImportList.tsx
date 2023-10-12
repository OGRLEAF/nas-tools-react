import { Button, Col, Divider, Drawer, Form, Input, List, Popover, Radio, Row, Select, Skeleton, Space, Table, Tag, TagType, Tooltip, theme } from "antd"
import { RedoOutlined, InfoCircleOutlined, LoadingOutlined } from "@ant-design/icons"
import React, { Children, useContext, useEffect, useState } from "react"
import { MediaImportContext, MediaImportFile, MediaImportFileKey, useMediaImport, useMediaImportDispatch } from "./mediaImportContext"
import { API, ImportMode, NastoolServerConfig } from "../../utils/api/api";
import { MediaImportAction } from "./mediaImportContext";
import { ColumnsType } from "antd/es/table";
import { Organize } from "@/app/utils/api/import";

import { MediaIdentify } from "@/app/utils/api/mediaIdentify";
import { PathSelector } from "../PathSelector";
import { SearchContext } from "../TMDBSearch/SearchContext";
import { MediaIdentifyContext, MediaIdentifyMerged, MediaWork, MediaWorkEpisode, MediaWorkSeason, MediaWorkType, SeriesKey } from "@/app/utils/api/types";
import { asyncEffect } from "@/app/utils";
import { TMDB, TMDBMedia } from "@/app/utils/api/tmdb";
import _, { set, slice } from "lodash";
import { IconEllipsisLoading } from "../icons";
import { MediaDetailCard } from "../TMDBSearch/TinyTMDBSearch";

function isOverriden<T>(a: T, b: T): [boolean, T] {
    const finalValue = (b !== undefined) ? b : a;
    return [(b !== undefined), finalValue];
}

const IdentifyTitleTag = ({ value, children }: { value: string, children: React.JSX.Element }) => {

    const { setKeyword } = useContext(SearchContext);
    const onTitleTagClick = (value: string) => {
        setKeyword(value);
    }

    return <Button
        type="link"
        size="small"
        disabled={!children}
        onClick={() => onTitleTagClick(value)}
    > {children}
    </Button>
}

const columns: ColumnsType<MediaImportFile> = [{
    title: "文件名",
    dataIndex: "name",
    width: 750,
    render: (name: string, item) => <TableFileName name={name} item={item} />,
    defaultSortOrder: "descend",
    shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
    sorter: (a: MediaImportFile, b: MediaImportFile) => ((a.name > b.name) ? -1 : 1),

}, {
    title: "识别",
    shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
    children: [
        {
            title: "名称",
            dataIndex: ["identifyContext", "tmdbId"],
            render: (value, record) => {
                ``
                return <TableIdentifyColumn value={value} file={record} serieskey="tmdbId" /> //<TableTitle file={record} />
            },
            shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord) // checkIdentityChange(record, prevRecord, 'title') // record.identifyContext?.title != prevRecord.identifyContext?.title || record.overridenIdentify?.title != prevRecord.overridenIdentify?.title
        },
        {
            title: "季",
            dataIndex: ["identifyContext", "season"],
            // width: 50,
            render: (value, record) => {
                // const [changed, finalValue] = isOverriden(value, record.overridenIdentify?.season);
                return <TableIdentifyColumn value={value} file={record} serieskey="season" />
            },
            width: 250,
            shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord)  //checkIdentityChange(record, prevRecord, "season")
        },
        {
            title: "集",
            dataIndex: ["identifyContext", "episode"],
            // width: 50
            render: (value, record) => {
                return <TableIdentifyColumn value={value} file={record} serieskey="episode" />
            },
            // width: 250,
            shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord) // checkIdentityChange(record, prevRecord, "episode")
        }
    ],
},]


export const ImportList = (options: { onSelect?: (value: MediaImportFile[]) => void }) => {
    // const mediaImportDispatch = useMediaImportDispatch();
    const mediaImportContext = useMediaImport();
    const [filteredList, setFilteredList] = useState<MediaImportFile[]>()
    const [selectedRows, setSelectedRows] = useState<MediaImportFileKey[]>([])
    const [localKeyMap, setLocalKeyMap] = useState<Map<string, MediaImportFile>>()
    useEffect(() => {
        try {
            const nameFilterRegex = new RegExp(mediaImportContext.regexFilter)
            setFilteredList(mediaImportContext.penddingFiles.filter(item => {
                return nameFilterRegex.test(item.name)
            }))

            if (mediaImportContext.penddingFiles) {
                const keyMap = new Map<string, MediaImportFile>();
                mediaImportContext.penddingFiles.forEach((file) => keyMap.set(file.name, file))
                setLocalKeyMap(keyMap)
            }

        } catch {

        }

    }, [mediaImportContext])
    useEffect(() => {
        if (options.onSelect) {
            const selected = selectedRows.map((key) => localKeyMap?.get(key)).filter(file => file !== undefined)
            options.onSelect(selected as MediaImportFile[])
        }
    }, [selectedRows, localKeyMap])
    const files: MediaImportFile[] | undefined = filteredList; //useState(Object.values(mediaImportContext.penddingFiles))

    return <Space direction="vertical" style={{ width: "100%" }} size={10}>
        <Table
            rowSelection={{
                type: "checkbox",
                onChange: (selectedRowKeys: React.Key[], selectedRows: MediaImportFile[]) => {
                    setSelectedRows(selectedRowKeys as MediaImportFileKey[])
                },
            }}
            scroll={{ y: 580, }}
            pagination={false}
            size="small"
            rowKey="name"
            dataSource={files}
            columns={columns}
        // virtual={true}
        />

    </Space>
}

export const ImportSubmit = ({ files }: { files: MediaImportFile[] }) => {
    const mergedIdentifyContext = mergeEpisodesFromSelected(files);
    const onFinish = async (value: any) => {
        const mediaSeasonSelected = mergedIdentifyContext; //mergeEpisodesFromSelected(files)

        if (!mediaSeasonSelected) return;
        const groupedMap = new Map<string, MediaImportFile[]>();
        for (const e of files) {
            if (!groupedMap.has(e.path)) {
                groupedMap.set(e.path, [e]);
            } else {
                const target = groupedMap.get(e.path);
                if (target) target.push(e);
            }

        }
        console.log(value)
        console.log(groupedMap);
        const keys = Array.from(groupedMap.keys())

        const orgn = new Organize();
        if (mediaSeasonSelected.season != undefined) {
            for (let key of keys) {
                const target = groupedMap.get(key)
                console.log(target)
                if (target) {
                    const episodes = target.map(file => {
                        const ep = file.overridenIdentify?.episode == undefined ? file.identifyContext?.episode : file.overridenIdentify?.episode
                        if (ep !== undefined) return Number(ep)
                    })
                    const files = target.map(file => file.name);
                    console.log(episodes, files)
                    await orgn.importTV(
                        {
                            path: key, files, importMode: value.type, season: {
                                series: new SeriesKey().tmdbId(mediaSeasonSelected.tmdbId),
                                type: MediaWorkType.TV,
                                key: mediaSeasonSelected.season,
                                title: mediaSeasonSelected.title
                            },
                            episodes: episodes
                        },
                    )
                }
            }
        }

        // (new Import).import()
    }

    return <Space
        style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
        <Space size={16}>
            <span>{mergedIdentifyContext?.title} #{mergedIdentifyContext?.tmdbId}</span>
            <span>季 {mergedIdentifyContext?.season}</span>

        </Space>

        <Space>

            <Form layout="inline" initialValues={{
                type: ImportMode.LINK
            }}
                onFinish={onFinish}
                disabled={!mergedIdentifyContext}
            >
                <Form.Item name="target_path" >
                    <MediaLibrarySelect width={400} />
                </Form.Item>
                <Form.Item name="type">
                    <Radio.Group>
                        <Radio.Button value={ImportMode.COPY}>复制</Radio.Button>
                        <Radio.Button value={ImportMode.MOVE}>移动</Radio.Button>
                        <Radio.Button value={ImportMode.LINK}>硬链接</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">导入</Button>
                </Form.Item>
            </Form>
        </Space>

    </Space>
}

export const MediaLibrarySelect = (options: {
    value?: string,
    onChange?: (value: string | undefined) => void,
    style?: React.CSSProperties,
    width?: number
}) => {
    type OutputPathType = "auto" | "library" | "customize"
    const [librariesPath, setLibrariesPath] = useState<NastoolServerConfig['media']>();
    const [pathType, setPathType] = useState<OutputPathType>("auto");
    useEffect(() => {
        const orgn = new Organize();
        orgn.getLibrariesPath()
            .then(libraries => {
                setLibrariesPath(libraries)
            })
    }, [])

    const outputPathTypeOptions = [
        {
            label: "自动",
            value: "auto"
        },
        {
            label: "媒体库",
            value: "library"
        },
        {
            label: "自定义目录",
            value: "customize"
        }
    ]
    const handlePathTypeChange = (value: OutputPathType) => {
        setPathType(value);
        if (value == "auto") {
            if (options.onChange) options.onChange(undefined)
        }
    };
    const handlePathChange = (value: string) => {
        if (value != "auto") {
            if (options.onChange) options.onChange(value)
        }
    }
    const libraryPathOptions = [{
        label: '动漫',
        options: librariesPath?.anime_path?.map((path) => ({ label: path, value: path })),
    },
    {
        label: '电视剧',
        options: librariesPath?.tv_path?.map((path) => ({ label: path, value: path })),
    },
    {
        label: '电影',
        options: librariesPath?.movie_path?.map((path) => ({ label: path, value: path })),
    },]
    return <Space.Compact style={{ width: "100%", ...options.style }}>
        <Select
            defaultValue="auto"
            style={{ width: 150 }}
            onChange={handlePathTypeChange}
            options={outputPathTypeOptions}
        />
        {
            pathType == "customize" ? <PathSelector onChange={handlePathChange}
                style={{
                    width: options.width ? options.width - 150 : undefined
                }} /> :
                pathType == "library" ? <Select onChange={handlePathChange} options={libraryPathOptions}
                    style={{
                        width: options.width ? options.width - 150 : undefined
                    }}
                /> :
                    <></>
        }
    </Space.Compact>
}

const TableFileName = (options: { name: string, item: MediaImportFile }) => {
    const { token } = theme.useToken()
    const mediaImportDispatch = useMediaImportDispatch();
    const [failed, setFailed] = useState(false);
    const onUpdateIdentfy = (file: MediaImportFile) => {
        // setLoading(true)
        return new MediaIdentify().identify(file.name)
            .then(async (result) => {
                if (result.title) {
                    setFailed(false);
                    mediaImportDispatch({ type: MediaImportAction.SetIdentity, fileKeys: [file.name], identify: [result] })
                } else {
                    setFailed(true)
                }
            })
    }
    const [loading, setLoading] = useState(false);
    return <div style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
        {options.name}
        <Space>
            <Tooltip title={JSON.stringify(options.item)}>
                <InfoCircleOutlined style={{ color: failed ? token.colorWarningTextActive : token.colorTextDescription }} />
            </Tooltip>
            <Button size="small" type="link" loading={loading} icon={<RedoOutlined />}
                onClick={() => {
                    setLoading(true)
                    onUpdateIdentfy(options.item)
                        .finally(() => setLoading(false))
                }}
            />
        </Space>
    </div>
}



type KeyTypes = 'type' | 'tmdbId' | 'season' | 'episode';
function TableIdentifyColumn(options: { value: number | string | undefined, file: MediaImportFile, serieskey: KeyTypes }) {
    const [work, setWork] = useState<MediaWork>();
    const { value, file, serieskey: key } = options;
    const [changed, finalValue] = isOverriden(value, file.overridenIdentify?.[key]);
    const [loading, setLoading] = useState(false);
    useEffect(asyncEffect(async () => {
        setLoading(true)
        const identity = _.merge(options.file.identifyContext, options.file.overridenIdentify);
        if (identity !== undefined) {
            const series = new SeriesKey().type(identity.type).tmdbId(identity.tmdbId).season(identity.season).episode(identity.episode);
            const sliced = series.slice(key)
            const target = new TMDB().fromSeries(sliced);
            setWork(await target?.get())
        }
        setLoading(false)
    }), [file, finalValue])

    const { setKeyword, setSeries } = useContext(SearchContext);
    const onTitleTagClick = (value: string) => {
        setKeyword(value);
    }

    const onSelect = () => {
        if (work) {
            setSeries(new SeriesKey().type(work.type).tmdbId(work.key))
        }
    }
    const popCard = <Space direction="vertical">
        {work ? <MediaDetailCard mediaDetail={work} size="tiny"
            action={work.series.end == "tmdbId" ?
                <Space>
                    <Button type="primary" size="small" onClick={() => { if (work?.title) onTitleTagClick(work?.title) }}
                    >搜索</Button>
                    <Button size="small" onClick={onSelect}
                    >选择</Button>
                </Space>
                :
                <></>
            }
        />
            : <></>}
    </Space>
    return <Tag color={changed ? 'pink' : 'cyan'}>
        {work?.key || finalValue}
        <Divider type="vertical" style={{ borderInlineColor: changed ? 'pink' : 'rgba(5, 5, 5, 0.06)' }} />
        <Popover content={popCard} placement="topRight">
            {
                loading ? <IconEllipsisLoading /> : work ? <>
                    <span style={{
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        maxWidth: 200,
                        lineHeight: "1em",
                        display: "inline-block"
                    }}>{work.metadata?.title}</span>
                </> : <></>
            }
        </Popover>

    </Tag >

}



function mergeEpisodesFromSelected(files: MediaImportFile[]): MediaIdentifyContext | undefined {
    if (!files?.length) {
        return
    }
    const mergedIdentifyContext = files
        .map(v => _.merge(v.identifyContext, v.overridenIdentify))
        .reduce((previousValue: MediaIdentifyContext | undefined, currentValue: MediaIdentifyContext | undefined) => {
            if (previousValue && currentValue) {
                if (previousValue.tmdbId !== currentValue.tmdbId) return undefined;
                if (previousValue.season != currentValue.season) return undefined;
                if (previousValue.title !== currentValue.title) return undefined;
                return previousValue
            }
            return undefined
        })
    // console.log(files, mergedIdentifyContext)
    if ((mergedIdentifyContext?.tmdbId != undefined) && (mergedIdentifyContext?.season != undefined)) {
        return {
            tmdbId: mergedIdentifyContext.tmdbId,
            season: mergedIdentifyContext.season,
            type: mergedIdentifyContext.type || MediaWorkType.UNKNOWN,
            title: mergedIdentifyContext.title as string
        }
    }
}

const checkIdentityChange = (record: MediaImportFile, prevRecord: MediaImportFile, key: keyof MediaIdentifyContext): boolean => {
    // return !_.isEqual(record, prevRecord);
    if (record.identifyContext) {
        if (prevRecord.identifyContext === undefined) return true
        if (record.identifyContext[key] !== prevRecord.identifyContext[key]) return true
    }
    if (record.overridenIdentify) {
        if (prevRecord.overridenIdentify === undefined) return true
        if (record.overridenIdentify[key] !== prevRecord.overridenIdentify[key]) return true
    } else if (prevRecord.overridenIdentify) {
        return true;
    }
    return false;
} 