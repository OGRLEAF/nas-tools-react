import { Button, Flex, Space, Table, Tooltip, theme } from "antd"
import { RedoOutlined, InfoCircleOutlined } from "@ant-design/icons"
import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { MediaImportFile, MediaImportFileKey, useMediaImport, useMediaImportDispatch } from "./mediaImportContext"
import { MediaImportAction } from "./mediaImportContext";
import { ColumnsType } from "antd/es/table";

import { MediaIdentify } from "@/app/utils/api/media/mediaIdentify";
import { SearchContext } from "../TMDBSearch/SearchContext";
import { MediaWork, MediaWorkType, SeriesKey, SeriesKeyType } from "@/app/utils/api/types";
import _, { } from "lodash";
import { MovieMediaImportGroup, TvMediaImportGroup } from "./MediaImportGroup";

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
    render: (name: string, item) => <TableFileName name={name} item={item} />,
    defaultSortOrder: "descend",
    // shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
    sorter: (a: MediaImportFile, b: MediaImportFile) => ((a.name > b.name) ? -1 : 1),

},]

export interface ImportListContextType {
    selectedFileKeys: {
        setSelectedFileKeys: (fileKeys: MediaImportFileKey[]) => void;
        selectedFileKeys: MediaImportFileKey[]
    },
    fileMap: {
        setFileMap: (fileMap: Map<string, MediaImportFile>) => void;
        fileMap: Map<string, MediaImportFile>
    }
}

const ImportListContext = createContext<ImportListContextType>({
    selectedFileKeys: {
        setSelectedFileKeys: (fileKeys: MediaImportFileKey[]) => { },
        selectedFileKeys: []
    },
    fileMap: {
        setFileMap: (fileMap: Map<string, MediaImportFile>) => { },
        fileMap: new Map<string, MediaImportFile>()
    }
})

export const useImportListContext = () => useContext(ImportListContext)

export const ImportList = () => {
    // const mediaImportDispatch = useMediaImportDispatch();
    const mediaImportContext = useMediaImport();
    const mediaImportDispatch = useMediaImportDispatch();
    const files: MediaImportFile[] | undefined = Object.values(mediaImportContext.penddingFiles)
    const [identifiedTvGroup, identifiedMovieGroup] = useMemo((): Record<MediaWork['key'], MediaImportFile[]>[] => {
        const tvGroupMap: Record<MediaWork['key'], MediaImportFile[]> = {};
        const movieGroupMap: Record<MediaWork['key'], MediaImportFile[]> = {};
        files?.forEach(file => {
            const seriesKey = file.indentifyHistory.last();
            if (seriesKey) {
                if (seriesKey.end >= SeriesKeyType.TMDBID) {
                    if ((seriesKey.t == MediaWorkType.TV || seriesKey.t == MediaWorkType.ANI) && seriesKey.i != undefined) {
                        tvGroupMap[seriesKey.i] = tvGroupMap[seriesKey.i] ?? [];
                        tvGroupMap[seriesKey.i].push(file)
                    } else if (seriesKey.t == MediaWorkType.MOVIE && seriesKey.i != undefined) {
                        movieGroupMap[seriesKey.i] = tvGroupMap[seriesKey.i] ?? [];
                        movieGroupMap[seriesKey.i].push(file)
                    }
                }

            }
        })
        return [tvGroupMap, movieGroupMap];
    }, [files])
    return <Flex vertical style={{ width: "100%" }} gap={24}>
        {
            Object.entries(identifiedMovieGroup)
                .map(([key, files]) => {
                    return <MovieMediaImportGroup key={key} seriesKey={new SeriesKey().type(MediaWorkType.MOVIE).tmdbId(key)} files={files} />
                })
        }
        {
            Object.entries(identifiedTvGroup)
                .map(([key, files]) => {
                    return <TvMediaImportGroup
                        key={key}
                        seriesKey={new SeriesKey().type(MediaWorkType.TV).tmdbId(key)}
                        files={files}
                    />
                })
        }

        <Table
            rowSelection={{
                type: "checkbox",
                selectedRowKeys: files.filter(v => v.selected).map((v) => v.name),
                onChange: (selectedRowKeys: React.Key[], selectedRows: MediaImportFile[]) => {
                    // setSelectedFileKeys(selectedRowKeys as MediaImportFileKey[])
                    mediaImportDispatch({ type: MediaImportAction.SetSelected, fileKeys: selectedRowKeys as MediaImportFileKey[] })
                },
            }}
            scroll={{ y: 580, }}
            pagination={false}
            size="small"
            rowKey="name"
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
            dataSource={files}
            columns={columns}
            // virtual={true}
            footer={(render) => {
                return <IdentifySelected />
            }}
        />

    </Flex>
}

const IdentifySelected = () => {
    const mediaImportContext = useMediaImport();
    const mediaImportDispatch = useMediaImportDispatch();
    const selected = mediaImportContext.penddingFiles.filter(v => v.selected);
    const [loading, setLoading] = useState(false)
    const identify = new MediaIdentify();
    return <Button type="primary" loading={loading} disabled={selected.length == 0}
        onClick={async () => {
            setLoading(true)
            const promises = selected.map((v) => () => identify.identifySeries(v.name)
                .then((value) => mediaImportDispatch({ type: MediaImportAction.SetSeries, fileKeys: [v.name], series: [value] })))
            for (let p of promises) {
                await p();
            }
            setLoading(false)
        }}
    >识别</Button>
}

const TableFileName = (options: { name: string, item: MediaImportFile }) => {
    const { token } = theme.useToken()
    const mediaImportDispatch = useMediaImportDispatch();
    const [failed, setFailed] = useState(false);
    const onUpdateIdentfy = (file: MediaImportFile) => {
        // setLoading(true)
        return new MediaIdentify().identifySeries(file.name)
            .then(async (result) => {
                if (result.t) {
                    setFailed(false);
                    mediaImportDispatch({ type: MediaImportAction.SetSeries, fileKeys: [file.name], series: [result] })
                } else {
                    setFailed(true)
                }
            })
    }
    const [loading, setLoading] = useState(false);
    return <div style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
        {options.name}
        <Space>
            <Tooltip title={<pre>{JSON.stringify(options.item, null, 2)}</pre>} styles={{ container: { overflow: "auto", maxHeight: 500 } }}>
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


