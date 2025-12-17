import { TMDB } from "@/app/utils/api/media/tmdb";
import { MediaWorkType, SeriesKey, SeriesKeyType } from "@/app/utils/api/types";
import React, { Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CloseOutlined } from "@ant-design/icons"
import { MediaDetailCard, MediaDetailCardProps } from "../TMDBSearch/TinyTMDBSearch";
import { Button, Divider, Flex, Form, Popover, Radio, Select, Space, Tag, theme, Tooltip } from "antd";
import { MediaImportAction, MediaImportFile, MediaImportFileKey, useMediaImportDispatch } from "./mediaImportContext";
import Table, { ColumnsType } from "antd/es/table";
import { SearchContext } from "../TMDBSearch/SearchContext";
import { IconEllipsisLoading } from "../icons";
import _, { slice } from "lodash";
import { ImportMode } from "@/app/utils/api/api";
import { EmptyPathSelect, LibraryPathSelect, PathTreeSelect, UnionPathsSelectGroup } from "../LibraryPathSelector";
// import { useImportListContext } from "./mediaImportList";
import { ImportTask } from "@/app/utils/api/import";
import { useMediaWork, MediaWork, useMediaWorks, useSuspenseMediaWork } from "@/app/utils/api/media/mediaWork";
import { useTaskflow } from "../taskflow/TaskflowContext";
import { magenta, cyan, Palette } from "@ant-design/colors"

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
    width: 250,
    shouldCellUpdate: (record, prevRecord) => !_.isEqual(record.currentIdentity, prevRecord.currentIdentity)  //checkIdentityChange(record, prevRecord, "season")

},
{
    title: "集",
    render: (value, record) => {
        console.debug("Render Episode Column:", value, record);
        return <TableIdentifyColumn file={record} displayKey={SeriesKeyType.EPISODE} />
    },
    width: 250,
    dataIndex: ["IdentifyHistory"],
    shouldCellUpdate: (record, prevRecord) => {
        console.debug("Should Update Episode Column:", record.currentIdentity, prevRecord.currentIdentity, !_.isEqual(record.currentIdentity, prevRecord.currentIdentity));
        console.debug("Record compare", !_.isEqual(record, prevRecord));

        return !_.isEqual(record.currentIdentity, prevRecord.currentIdentity)
    } // checkIdentityChange(record, prevRecord, "episode")
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
    return <GroupImportTable {...props} columns={tvImportColumns} footer={() => <TvImportSubmit
        seriesKey={props.seriesKey}
        files={props.files.filter(v => v.selected)}
    />
    } />
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
    return <GroupImportTable {...props} columns={movieImportColumns}
        footer={() => <MovieImportSubmit
            seriesKey={props.seriesKey}
            files={props.files.filter(v => v.selected)}
        />}
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

    const disableImport = useMemo(() => mergedSeriesKey.end < SeriesKeyType.SEASON, [mergedSeriesKey]);

    const [taskflowId, setTaskflowId] = useState<string>();
    const [taskflow] = useTaskflow(taskflowId)
    const [submitting, setSubmitting] = useState(false);
    const submitLoading = useMemo(() => submitting || (taskflow && taskflow?.status !== "finished") || false, [taskflow, taskflowId]);

    const submitImport = useCallback((value: ImportFormValues) => {
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
    }, [files, mergedSeriesKey]);

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

    const disableImport = useMemo(() => mergedSeriesKey.end < SeriesKeyType.TMDBID, [mergedSeriesKey]);

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
            <span>{mergedSeriesKey.t}#{mergedSeriesKey.i} {mediaWork?.metadata?.title}</span>
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

const MediaWorkPopCard = React.memo(({ mediaWork, action }: { mediaWork: MediaWork, action?: React.ReactNode }) => {
    const { setKeyword, setSeries } = useContext(SearchContext);

    const onSelect = useCallback(() => {
        if (mediaWork) {
            setSeries(new SeriesKey(mediaWork.series))
        }
    }, [mediaWork, setSeries]);
    return <MediaDetailCard mediaDetail={mediaWork} size="card"
        action={
            <Space align="start">
                {action}
                {mediaWork.series.end == SeriesKeyType.TMDBID ?
                    <Button type="primary" size="small" onClick={() => { if (mediaWork?.metadata?.title) setKeyword(mediaWork?.metadata?.title) }}
                    >搜索</Button> : null
                }
                {mediaWork.series.end <= SeriesKeyType.SEASON ?
                    <Button size="small" onClick={onSelect} type={mediaWork.series.end <= SeriesKeyType.SEASON ? "primary" : "default"}
                    >选择</Button> : null
                }
            </Space>} />
})


const MediaSeasonInput = React.memo(({ assumeKey, mediaWork, onChange, color
}: { assumeKey: SeriesKey, mediaWork?: MediaWork, onChange: (value: SeriesKey) => void, color: Palette }) => {
    const [visited, setVisited] = useState(false);
    const slicedKey = useMemo(() => { if (visited) return assumeKey.stepUpper() }, [visited, assumeKey]);
    const [mediaWorks, loading, refresh, flush] = useMediaWorks(slicedKey);
    const preloadOptions = useMemo(() => [{
        value: assumeKey.key,
        label: <>{assumeKey.key}<Divider orientation="vertical" />{mediaWork ? mediaWork.metadata?.title : <IconEllipsisLoading />}</>
    }], [mediaWork, assumeKey]);

    const seasonOptions = useMemo(() => {
        if (visited)
            return mediaWorks.sort((a, b) => Number(a.series.key) - Number(b.series.key))
                .map((mw) => ({ value: mw.series.key!, label: <>{mw.series.key!}<Divider orientation="vertical" />{mw.metadata?.title}</> }))
        else
            return preloadOptions
    }, [visited, mediaWorks, preloadOptions])

    return <Select size="small" variant="filled" popupMatchSelectWidth={false} loading={loading}
        popupRender={(menu) => (
            <>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                <Button type="default" size="small" style={{ display: 'block', textAlign: 'center', width: '100%' }} onClick={() => flush()}>刷新</Button>
            </>
        )}

        styles={{ root: { maxWidth: 200, fontSize: 12, backgroundColor: color[0], color: color[7] } }}
        value={assumeKey.key}
        onOpenChange={(visible) => { if (visible) setVisited(visible) }}
        options={seasonOptions} onChange={(v) => { if (slicedKey && (v != null)) onChange(slicedKey.append(slicedKey.end + 1, v)) }}>
    </Select>
})

function TableIdentifyColumn({ file, displayKey: key }: { file: MediaImportFile, displayKey: SeriesKeyType }) {
    const mediaImportDispatch = useMediaImportDispatch();
    const [lastest, old] = useMemo(() => file.indentifyHistory.lastDiffs(), [file.indentifyHistory]);
    const changed = useMemo(() => (lastest != undefined && old != undefined) ? lastest.compare(old) < key : false, [lastest, old, key]);

    const slicedKey = useMemo(() => {
        const seriesKey = file.currentIdentity; // file.indentifyHistory.last();
        console.debug("TableIdentifyColumn MediaWorkKey Calc:", seriesKey, key);
        if (seriesKey !== undefined) {
            const sliced = seriesKey.slice(key)
            console.debug("TableIdentifyColumn MediaWorkKey Calc sliced:", sliced, key);
            return sliced.end == key ? sliced : null;
        }
        return null;
    }, [file.currentIdentity, key]);

    const [work] = useMediaWork(slicedKey ?? new SeriesKey());
    const color = useMemo(() => changed ? magenta : cyan, [changed]);
    return <Space><Popover arrow={false}
        content={
            <Space orientation="horizontal">
                {work && <MediaWorkPopCard mediaWork={work} />}
            </Space>
        } placement="topRight">
        <div style={{ width: "100%", position: "relative" }}>
            {
                slicedKey && <MediaSeasonInput assumeKey={slicedKey} mediaWork={work}
                    color={color}
                    onChange={(selected) => {
                        mediaImportDispatch({
                            type: MediaImportAction.SetSeries,
                            fileKeys: [file.name],
                            series: [selected]
                        })
                    }} />
            }</div>
    </Popover>
    </Space>
}


const CardTitleFilled = React.memo(({ seriesKey }: { seriesKey: SeriesKey } & Omit<MediaDetailCardProps, 'mediaDetail'>) => {
    const work = useSuspenseMediaWork(seriesKey);
    const { setSeries, setKeyword } = useContext(SearchContext);

    return <MediaDetailCard
        postImageStyle={{ width: 100 }}
        mediaDetail={work} size="small"
        onTitleClick={(mediaWork) => { setSeries(mediaWork.series) }}
        action={<Space>
            <Button type="primary" size="small" onClick={() => { if (work.metadata?.title) setKeyword(work.metadata?.title) }}>搜索</Button>
            <Button size="small" onClick={() => { if (work) setSeries(new SeriesKey(work.series)) }}>选择</Button>
        </Space>}
    />
})

const CardTitle = React.memo(({ seriesKey }: { seriesKey: SeriesKey }) => {
    // const [work] = useMediaWork(seriesKey);

    return <div style={{ width: "100%", position: "relative", boxSizing: "border-box" }}>
        <Suspense fallback={<IconEllipsisLoading />}>
            <CardTitleFilled seriesKey={seriesKey} />
        </Suspense>
    </div>
})

function GroupImportTable({ files, ...props }: MediaImportGroupProps & { columns: ColumnsType<MediaImportFile>, footer: (data: readonly MediaImportFile[]) => React.ReactNode; }) {
    const mediaImportDispatch = useMediaImportDispatch();
    return <Table
        title={() => <CardTitle seriesKey={props.seriesKey} />}
        bordered
        rowSelection={{
            type: "checkbox",
            selectedRowKeys: files.filter(v => v.selected).map((v) => v.name),
            onChange: (selectedRowKeys: React.Key[], selectedRows: MediaImportFile[]) => {
                mediaImportDispatch({ type: MediaImportAction.SetSelected, fileKeys: selectedRowKeys as MediaImportFileKey[] })
            },
            columnWidth: 20
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
                    console.debug("Drop SeriesKey:", seriesKey);
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
        dataSource={files}
        columns={props.columns}
        footer={props.footer}
    />
}