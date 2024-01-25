import { asyncEffect } from "@/app/utils";
import { TMDB } from "@/app/utils/api/media/tmdb";
import { MediaWork, MediaWorkType, SeriesKey, SeriesKeyType } from "@/app/utils/api/types";
import React, { useContext, useEffect, useState } from "react";
import { CloseOutlined } from "@ant-design/icons"
import { MediaDetailCard } from "../TMDBSearch/TinyTMDBSearch";
import { Button, Card, Checkbox, Divider, Flex, Form, Popover, Radio, Space, Tag, Tooltip, theme } from "antd";
import { MediaImportAction, MediaImportFile, MediaImportFileKey, useMediaImportDispatch } from "./mediaImportContext";
import Table, { ColumnsType } from "antd/es/table";
import { SearchContext } from "../TMDBSearch/SearchContext";
import { IconEllipsisLoading } from "../icons";
import _, { values } from "lodash";
import { ImportMode } from "@/app/utils/api/api";
import { UnionPathsSelect } from "../LibraryPathSelector";
// import { useImportListContext } from "./mediaImportList";
import { StateMap, StateTag } from "../StateTag";
import { ImportTask, ImportTaskConfig } from "@/app/utils/api/import";

export interface MediaImportGroupProps {
    seriesKey: SeriesKey,
    files: MediaImportFile[],
}



const tvImportColumns: ColumnsType<MediaImportFile> = [{
    title: "文件名",
    dataIndex: "name",
    width: 750,
    render: (name: string, item) => name, //<TableFileName name={name} item={item} />,
    defaultSortOrder: "descend",
    shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
    sorter: (a: MediaImportFile, b: MediaImportFile) => ((a.name > b.name) ? -1 : 1),

},
{
    title: "季",
    dataIndex: ["identifyContext", "season"],
    // width: 50,
    render: (value, record) => {
        // const [changed, finalValue] = isOverriden(value, record.overridenIdentify?.season);
        return <TableIdentifyColumn value={value} file={record} displayKey={SeriesKeyType.SEASON} />
    },
    // width: 250,
    shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord)  //checkIdentityChange(record, prevRecord, "season")
},
{
    title: "集",
    dataIndex: ["identifyContext", "episode"],
    // width: 50
    render: (value, record) => {
        return <TableIdentifyColumn value={value} file={record} displayKey={SeriesKeyType.EPISODE} />
    },
    // width: 250,
    shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord) // checkIdentityChange(record, prevRecord, "episode")
},
{
    title: "操作",
    dataIndex: "name",
    render(value, record) {
        return <ImportListItemAction fileKey={value} />
    },
    width: 50,
    align: "center",
    shouldCellUpdate: () => false
}
]

export function TvMediaImportGroup(props: MediaImportGroupProps) {
    const [work, setWork] = useState<MediaWork>();
    const mediaImportDispatch = useMediaImportDispatch();
    useEffect(asyncEffect(async () => {
        const series = new SeriesKey(props.seriesKey).slice(SeriesKeyType.TMDBID)
        const target = new TMDB().fromSeries(series);
        setWork(await target?.get())
    }), [])
    const [localSelectedFile, setLocalSelectedFile] = useState<Set<MediaImportFileKey>>(new Set());

    const { setSeries, setKeyword } = useContext(SearchContext);
    const selectButton = <Button type="primary" size="small" onClick={() => { if (work?.title) setKeyword(work?.title) }}>搜索</Button>
    const searchButton = <Button size="small" onClick={() => { if (work) setSeries(work.series) }}>选择</Button>
    return <Table
        title={() => {
            return <div style={{ width: "100%", position: "relative", boxSizing: "border-box" }}>
                {work ? <MediaDetailCard
                    postImageStyle={{ width: 100 }}
                    mediaDetail={work} size="small"
                    onTitleClick={(mediaWork) => { setSeries(mediaWork.series) }}
                    action={<Space>{selectButton}{searchButton}</Space>}
                /> : <>{props.seriesKey.t}</>}
            </div>
        }}
        bordered
        rowSelection={{
            type: "checkbox",
            selectedRowKeys: props.files.filter(v => v.selected).map((v) => v.name),
            onChange: (selectedRowKeys: React.Key[], selectedRows: MediaImportFile[]) => {
                // selectedFileKeys.setSelectedFileKeys(selectedRowKeys as MediaImportFileKey[])
                // setLocalSelectedFile(new Set(...selectedRowKeys as MediaImportFileKey[]));
                mediaImportDispatch({ type: MediaImportAction.SetSelected, fileKeys: selectedRowKeys as MediaImportFileKey[] })
            },
        }}
        pagination={false}
        size="small"
        rowKey="name"
        dataSource={props.files}
        columns={tvImportColumns}
        footer={() => <TvImportSubmit
            seriesKey={props.seriesKey}
            files={props.files.filter(v => v.selected)}
        />
        }
    />
}

const movieImportColumns: ColumnsType<MediaImportFile> = [
    {
        title: "文件名",
        dataIndex: "name",
        render: (name: string, item) => name, //<TableFileName name={name} item={item} />,
        defaultSortOrder: "descend",
        shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
        sorter: (a: MediaImportFile, b: MediaImportFile) => ((a.name > b.name) ? -1 : 1),

    },
    {
        title: "操作",
        dataIndex: "name",
        render(value, record) {
            return <ImportListItemAction fileKey={value} />
        },
        width: 50,
        align: "center",
        shouldCellUpdate: () => false
    }
]


export function MovieMediaImportGroup(props: MediaImportGroupProps) {
    const [work, setWork] = useState<MediaWork>();
    useEffect(asyncEffect(async () => {
        const series = new SeriesKey(props.seriesKey).slice(SeriesKeyType.TMDBID)
        const target = new TMDB().fromSeries(series);
        setWork(await target?.get())
    }), [])
    const { setSeries, setKeyword } = useContext(SearchContext);
    const selectButton = <Button type="primary" size="small" onClick={() => { if (work?.title) setKeyword(work?.title) }}>搜索</Button>
    const searchButton = <Button size="small" onClick={() => { if (work) setSeries(work.series) }}>选择</Button>
    const cardTitle = <div style={{ width: "100%", position: "relative", boxSizing: "border-box" }}>
        {work ? <MediaDetailCard
            postImageStyle={{ width: 100 }}
            mediaDetail={work} size="small"
            onTitleClick={(mediaWork) => { setSeries(mediaWork.series) }}
            action={<Space>{selectButton}{searchButton}</Space>}
        /> : <>{props.seriesKey.t}</>}
    </div>
    const mediaImportDispatch = useMediaImportDispatch();
    return <Table
        title={() => cardTitle}
        bordered
        rowSelection={{
            type: "checkbox",
            selectedRowKeys: props.files.filter(v => v.selected).map((v) => v.name),
            onChange: (selectedRowKeys: React.Key[], selectedRows: MediaImportFile[]) => {
                mediaImportDispatch({ type: MediaImportAction.SetSelected, fileKeys: selectedRowKeys as MediaImportFileKey[] })
            },
            columnWidth: 20
        }}
        pagination={false}
        size="small"
        rowKey="name"
        dataSource={props.files}
        columns={movieImportColumns}
        footer={() => <MovieImportSubmit
            seriesKey={props.seriesKey}
            files={props.files.filter(v => v.selected)}
        />
        }
    />
}

interface ImportFormValues {
    type: ImportMode,
    target_path?: string,
}

function TvImportSubmit({ seriesKey, files }: { seriesKey: SeriesKey, files: MediaImportFile[], }) {
    const mergedSeriesKey = files.length > 0 ? files.map(file => file.indentifyHistory.last())?.reduce((prev, curr) => prev.merge(curr)) : new SeriesKey();
    const [mediaWork, setMediaWork] = useState<MediaWork>();
    useEffect(() => {
        new TMDB().fromSeries(mergedSeriesKey.slice(SeriesKeyType.TMDBID))?.get()
            .then((mediaWork) => setMediaWork(mediaWork))
    }, [mergedSeriesKey])
    const metadata = mediaWork?.metadata;

    const disableImport = mergedSeriesKey.end < SeriesKeyType.SEASON;

    const submitImport = (value: ImportFormValues) => {
        const completedFiles: [number, MediaImportFile][] = []
        files.forEach((file) => {
            const episode = file.indentifyHistory.last().e;
            if (episode != undefined) {
                completedFiles.push([episode, file])
            }
        });
        const commonPath = files.map(value => value.path).every(v => v === completedFiles[0][1].path);
        if (commonPath && (mergedSeriesKey.t == MediaWorkType.ANI || mergedSeriesKey.t == MediaWorkType.TV)
            && (mergedSeriesKey.i != undefined)
            && (mergedSeriesKey.s != undefined)
        ) {
            new ImportTask().import({
                target_path: value.target_path,
                path: completedFiles[0][1].path,
                rmt_mode: value.type,
                files: completedFiles.map(([ep, file]) => [ep, file.name]),
                season: mergedSeriesKey.s,
                tmdbid: String(mergedSeriesKey.i),
                mediaType: mergedSeriesKey.t
            })
        }
    }

    return <Flex style={{ width: "100%" }} justify="flex-end" align="center" gap="middle">
        <Space size={16}>
            <span>{metadata?.title} #{mergedSeriesKey.i}</span>
            <span>季 {mergedSeriesKey.s}</span>
            <span>共 {files.length} 个文件</span>
        </Space>
        <Form<ImportFormValues> layout="inline" initialValues={{ type: ImportMode.LINK }} disabled={disableImport}
            onFinish={submitImport}
        >
            <Form.Item name="target_path" >
                <UnionPathsSelect width={400} />
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
    </Flex>
}

function MovieImportSubmit({ seriesKey, files }: { seriesKey: SeriesKey, files: MediaImportFile[], }) {
    const mergedSeriesKey = files.length > 0 ? files.map(file => file.indentifyHistory.last())?.reduce((prev, curr) => prev.merge(curr)) : new SeriesKey();
    const [mediaWork, setMediaWork] = useState<MediaWork>();
    useEffect(() => {
        new TMDB().fromSeries(mergedSeriesKey.slice(SeriesKeyType.TMDBID))?.get()
            .then((mediaWork) => setMediaWork(mediaWork))
    }, [mergedSeriesKey])
    const metadata = mediaWork?.metadata;

    const disableImport = mergedSeriesKey.end < SeriesKeyType.TMDBID;

    return <Flex style={{ width: "100%" }} justify="flex-end" align="center" gap="middle">
        <Space size={16}>
            <span>{mergedSeriesKey.t}#{mergedSeriesKey.i} {metadata?.title}</span>
            <span>共 {files.length} 个文件</span>
        </Space>
        <Form layout="inline" initialValues={{ type: ImportMode.LINK }} disabled={disableImport}
            onFinish={(value: any) => {
                console.log(mergedSeriesKey, value)
                if (mergedSeriesKey.t == MediaWorkType.MOVIE) {
                    const path = files[0].path;
                    new ImportTask().import({
                        target_path: value.target_path,
                        path: files[0].path,
                        rmt_mode: value.type,
                        files: files.map((file) => [0, file.name]),
                        season: mergedSeriesKey.s,
                        tmdbid: String(mergedSeriesKey.i),
                        mediaType: mergedSeriesKey.t
                    })
                }
            }}
        >
            <Form.Item name="target_path" >
                <UnionPathsSelect width={400} />
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
    </Flex>
}

function ImportListItemAction({ fileKey }: { fileKey: MediaImportFileKey }) {
    const mediaImportDispatch = useMediaImportDispatch();
    const onClick = () => {
        mediaImportDispatch({ type: MediaImportAction.CleanSeries, fileKeys: [fileKey] })
    }
    return <Button key="delete_button" size="small" style={{ padding: 0 }} danger icon={<CloseOutlined />} onClick={onClick} type="text"></Button>
}

function TableIdentifyColumn(options: { value: number | string | undefined, file: MediaImportFile, displayKey: SeriesKeyType }) {
    const [work, setWork] = useState<MediaWork>();
    const { value, file, displayKey: key } = options;
    const [lastest, old] = file.indentifyHistory.lastDiffs();
    const changed = (lastest != undefined && old != undefined) ? lastest.compare(old) < key : false
    const finalValue = lastest?.get(key);
    const [loading, setLoading] = useState(false);
    const [localSeries, setLocalSeries] = useState<SeriesKey>();
    useEffect(asyncEffect(async () => {
        setLoading(true)
        const seriesKey = file.indentifyHistory.last();
        if (seriesKey !== undefined) {
            const sliced = seriesKey.slice(key)
            setLocalSeries(sliced)
            if (sliced.end == key) {
                const target = new TMDB().fromSeries(sliced);
                setWork(await target?.get())
            }

        }
        setLoading(false)
    }), [file, file.indentifyHistory, lastest])

    const { setKeyword, setSeries, series } = useContext(SearchContext);
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
            action={work.series.end == SeriesKeyType.TMDBID ?
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
        <Tooltip title={JSON.stringify([localSeries, key, lastest?.t, old?.t, old ? lastest?.compare(old) : "", changed])}>
            {work?.key ?? finalValue ?? <>N/A</>}
        </Tooltip>
        {loading || work ?
            <Divider type="vertical" style={{ borderInlineColor: changed ? 'pink' : 'rgba(5, 5, 5, 0.06)' }} />
            : <></>}
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

