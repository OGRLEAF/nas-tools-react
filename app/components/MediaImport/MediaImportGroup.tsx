import { TMDB } from "@/app/utils/api/media/tmdb";
import { MediaWork, MediaWorkType, SeriesKey, SeriesKeyType } from "@/app/utils/api/types";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CloseOutlined } from "@ant-design/icons"
import { MediaDetailCard } from "../TMDBSearch/TinyTMDBSearch";
import { Button, Flex, Form, Popover, Radio, Space, Tag, Tooltip } from "antd";
import { MediaImportAction, MediaImportFile, MediaImportFileKey, useMediaImportDispatch } from "./mediaImportContext";
import Table, { ColumnsType } from "antd/es/table";
import { SearchContext } from "../TMDBSearch/SearchContext";
import { IconEllipsisLoading } from "../icons";
import _ from "lodash";
import { ImportMode } from "@/app/utils/api/api";
import { EmptyPathSelect, LibraryPathSelect, PathTreeSelect, UnionPathsSelectGroup } from "../LibraryPathSelector";
// import { useImportListContext } from "./mediaImportList";
import { ImportTask } from "@/app/utils/api/import";
import { useMediaWork } from "@/app/utils/api/media/media_work";
import { useTaskflow } from "../taskflow/TaskflowContext";

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
    render: (value, record) => {
        // const [changed, finalValue] = isOverriden(value, record.overridenIdentify?.season);
        return <TableIdentifyColumn file={record} displayKey={SeriesKeyType.SEASON} />
    },
    // width: 250,
    shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord)  //checkIdentityChange(record, prevRecord, "season")
},
{
    title: "集",
    render: (value, record) => {
        return <TableIdentifyColumn file={record} displayKey={SeriesKeyType.EPISODE} />
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
    const mediaImportDispatch = useMediaImportDispatch();
    const mediaWorkKey = useMemo(() => new SeriesKey(props.seriesKey).slice(SeriesKeyType.TMDBID), [props.seriesKey])
    const [work] = useMediaWork(mediaWorkKey);

    const { setSeries, setKeyword } = useContext(SearchContext);
    const cardTitle = useMemo(() => {
        if (work) {
            const selectButton = <Button type="primary" size="small" onClick={() => { if (work.metadata?.title) setKeyword(work.metadata?.title) }}>搜索</Button>
            const searchButton = <Button size="small" onClick={() => { if (work) setSeries(new SeriesKey(work.series)) }}>选择</Button>

            return <div style={{ width: "100%", position: "relative", boxSizing: "border-box" }}>
                <MediaDetailCard
                    postImageStyle={{ width: 100 }}
                    mediaDetail={work} size="small"
                    onTitleClick={(mediaWork) => { setSeries(mediaWork.series) }}
                    action={<Space>{selectButton}{searchButton}</Space>}
                />
            </div>
        }
    }, [work, props.seriesKey.t, setSeries, setKeyword])


    return <Table
        title={() => cardTitle}
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
        onRow={(record) => {

            return {
                onDragOver: (e) => {
                    e.preventDefault()
                },
                onDrop: (e) => {
                    e.preventDefault()
                    const data = e.dataTransfer.getData('text/json');
                    const seriesKey = SeriesKey.load(JSON.parse(data))
                    mediaImportDispatch({
                        type: MediaImportAction.SetSeries,
                        fileKeys: [record.name], 
                        series: [seriesKey] 
                    })
                },
            }
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
    const mediaWorkKey = useMemo(() => new SeriesKey(props.seriesKey).slice(SeriesKeyType.TMDBID), [props.seriesKey])
    const [work] = useMediaWork(mediaWorkKey);

    const { setSeries, setKeyword } = useContext(SearchContext);
    const cardTitle = useMemo(() => {
        if (work) {
            const selectButton = <Button type="primary" size="small" onClick={() => { if (work.metadata?.title) setKeyword(work.metadata?.title) }}>搜索</Button>
            const searchButton = <Button size="small" onClick={() => { if (work) setSeries(new SeriesKey(work.series)) }}>选择</Button>

            return <div style={{ width: "100%", position: "relative", boxSizing: "border-box" }}>
                <MediaDetailCard
                    postImageStyle={{ width: 100 }}
                    mediaDetail={work} size="small"
                    onTitleClick={(mediaWork) => { setSeries(mediaWork.series) }}
                    action={<Space>{selectButton}{searchButton}</Space>}
                />
            </div>
        }
    }, [work, props.seriesKey.t, setSeries, setKeyword])
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
    const mergedSeriesKey = useMemo(() => {
        return files.length > 0 ? files.map(file => file.indentifyHistory.last())?.reduce((prev, curr) => prev.merge(curr)) : new SeriesKey();
    }, [files])
    const [mediaWork, setMediaWork] = useState<MediaWork>();
    useEffect(() => {
        new TMDB().fromSeries(mergedSeriesKey.slice(SeriesKeyType.TMDBID))?.get()
            .then((mediaWork) => setMediaWork(mediaWork))
    }, [mergedSeriesKey])
    const metadata = mediaWork?.metadata;

    const disableImport = mergedSeriesKey.end < SeriesKeyType.SEASON;

    const [taskflowId, setTaskflowId] = useState<string>();
    const [taskflow] = useTaskflow(taskflowId)
    const [submitting, setSubmitting] = useState(false);
    const submitLoading = useMemo(() => submitting || (taskflow && taskflow?.status !== "finished") || false, [taskflow, taskflowId]);

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
            setSubmitting(true);
            new ImportTask().import({
                target_path: value.target_path,
                path: completedFiles[0][1].path,
                rmt_mode: value.type,
                files: completedFiles.map(([ep, file]) => [ep, file.name]),
                season: mergedSeriesKey.s,
                tmdbid: String(mergedSeriesKey.i),
                mediaType: mergedSeriesKey.t
            }).then((result) => {
                console.log("Import Task Result:", result.taskflow_id);
                setTaskflowId(result.taskflow_id);
            })
                .finally(() => { setSubmitting(false); })
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
                <UnionPathsSelectGroup fallback="customize" width={400}>
                    <EmptyPathSelect key="auto" label="自动" />
                    <LibraryPathSelect key="library" label="媒体库目录" width={400} />
                    <PathTreeSelect key="customize" label="自定义目录" width={400} />
                </UnionPathsSelectGroup>
            </Form.Item>
            <Form.Item name="type">
                <Radio.Group>
                    <Radio.Button value={ImportMode.COPY}>复制</Radio.Button>
                    <Radio.Button value={ImportMode.MOVE}>移动</Radio.Button>
                    <Radio.Button value={ImportMode.LINK}>硬链接</Radio.Button>
                </Radio.Group>
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitLoading}>
                    {submitting ? "提交中" : (taskflow?.status == "finished" ? "导入完成" : "导入")}
                </Button>
            </Form.Item>
        </Form>
    </Flex>
}

function MovieImportSubmit({ seriesKey, files }: { seriesKey: SeriesKey, files: MediaImportFile[], }) {
    const mergedSeriesKey = useMemo(() => {
        return files.length > 0 ? files.map(file => file.indentifyHistory.last())?.reduce((prev, curr) => prev.merge(curr)) : new SeriesKey();
    }, [files])
    const [mediaWork, setMediaWork] = useState<MediaWork>();
    useEffect(() => {
        new TMDB().fromSeries(mergedSeriesKey.slice(SeriesKeyType.TMDBID))?.get()
            .then((mediaWork) => setMediaWork(mediaWork))
    }, [mergedSeriesKey])
    const metadata = mediaWork?.metadata;

    const disableImport = mergedSeriesKey.end < SeriesKeyType.TMDBID;

    const [taskflowId, setTaskflowId] = useState<string>();
    const [taskflow] = useTaskflow(taskflowId)
    const taskflowLoading = useMemo(() => (taskflow && taskflow?.status !== "finished") || false, [taskflow, taskflowId]);

    const onFinish = useCallback((value: any) => {
        if (mergedSeriesKey.t == MediaWorkType.MOVIE) {
            new ImportTask().import({
                target_path: value.target_path,
                path: files[0].path,
                rmt_mode: value.type,
                files: files.map((file) => [0, file.name]),
                season: mergedSeriesKey.s != null ? mergedSeriesKey.s : undefined,
                tmdbid: String(mergedSeriesKey.i),
                mediaType: mergedSeriesKey.t
            })
                .then((result) => {
                    setTaskflowId(result.taskflow_id);
                })
        }
    }, [files, mergedSeriesKey])

    return <Flex style={{ width: "100%" }} justify="flex-end" align="center" gap="middle">
        <Space size={16}>
            <span>{mergedSeriesKey.t}#{mergedSeriesKey.i} {metadata?.title}</span>
            <span>共 {files.length} 个文件</span>
        </Space>
        <Form layout="inline" initialValues={{ type: ImportMode.LINK }} disabled={disableImport}
            onFinish={onFinish}
        >
            <Form.Item name="target_path" >
                <UnionPathsSelectGroup fallback="customize" width={400}>
                    <EmptyPathSelect key="auto" label="自动" />
                    <LibraryPathSelect key="library" label="媒体库目录" width={400} />
                    <PathTreeSelect key="customize" label="自定义目录" width={400} />
                </UnionPathsSelectGroup>
            </Form.Item>
            <Form.Item name="type">
                <Radio.Group>
                    <Radio.Button value={ImportMode.COPY}>复制</Radio.Button>
                    <Radio.Button value={ImportMode.MOVE}>移动</Radio.Button>
                    <Radio.Button value={ImportMode.LINK}>硬链接</Radio.Button>
                </Radio.Group>
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" loading={taskflowLoading}>
                    {taskflow?.status == "finished" ? "导入完成" : "导入"}
                </Button>
            </Form.Item>
        </Form>
        {/* {taskflow && <span>{taskflow.id} - {taskflow.status}</span>} */}
    </Flex>
}

function ImportListItemAction({ fileKey }: { fileKey: MediaImportFileKey }) {
    const mediaImportDispatch = useMediaImportDispatch();
    const onClick = () => {
        mediaImportDispatch({ type: MediaImportAction.CleanSeries, fileKeys: [fileKey] })
    }
    return <Button key="delete_button" size="small" style={{ padding: 0 }} danger icon={<CloseOutlined />} onClick={onClick} type="text"></Button>
}

function TableIdentifyColumn(options: { file: MediaImportFile, displayKey: SeriesKeyType }) {
    const { file, displayKey: key } = options;
    const [lastest, old] = file.indentifyHistory.lastDiffs();
    const changed = (lastest != undefined && old != undefined) ? lastest.compare(old) < key : false
    const finalValue = lastest?.get(key);

    const mediaWorkKey = useMemo(() => {
        const seriesKey = file.indentifyHistory.last();

        if (seriesKey !== undefined) {
            const sliced = seriesKey.slice(key)

            return sliced.end == key ? sliced : undefined;
        }
        return undefined;
    }, [file.indentifyHistory, key]);


    const [work] = useMediaWork(mediaWorkKey ?? new SeriesKey());

    useEffect(() => {
        console.log("TableIdentifyColumn MediaWorkKey Changed:", mediaWorkKey?.dump(), key, work);
    }, [mediaWorkKey, key, work]);


    const { setKeyword, setSeries } = useContext(SearchContext);
    const onTitleTagClick = (value: string) => {
        setKeyword(value);
    }

    const onSelect = () => {
        if (work) {
            setSeries(new SeriesKey(work.series))
        }
    }
    const popCard = <Space orientation="vertical">
        {work ? <MediaDetailCard mediaDetail={work} size="card"
            action={work.series.end == SeriesKeyType.TMDBID ?
                <Space>
                    <Button type="primary" size="small" onClick={() => { if (work?.metadata?.title) onTitleTagClick(work?.metadata?.title) }}
                    >搜索</Button>
                    <Button size="small" onClick={onSelect}
                    >选择</Button>
                </Space>
                : null
            }
        /> : null}
    </Space>
    return <Tag color={changed ? 'pink' : 'cyan'} style={{ display: "flex", alignItems: "center" }}>
        <Tooltip title={JSON.stringify([mediaWorkKey, key, lastest?.t, old?.t, old ? lastest?.compare(old) : "", changed])}>
            {work ? <span style={{
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block"
            }}>{work?.series.get(key) ?? finalValue ?? "N/A"}</span> : null
            }
        </Tooltip>
        {work ?
            <div style={{ width: "1px", height: "1rem", display: "inline-block", margin: "0px 8px 0 8px", backgroundColor: changed ? 'pink' : 'rgba(5, 5, 5, 0.06)' }} />
            : <></>}
        <Popover content={popCard} placement="topRight">
            {
                <span style={{
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-block"
                }}>{work ? work.metadata?.title : <IconEllipsisLoading />}</span>
            }
        </Popover>

    </Tag >

}
