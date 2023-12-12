import { Button, Col, Divider, Drawer, Form, Input, List, Popover, Radio, Row, Select, Skeleton, Space, Table, Tag, TagType, Tooltip, message, theme } from "antd"
import { RedoOutlined, InfoCircleOutlined, LoadingOutlined } from "@ant-design/icons"
import React, { Children, createContext, useContext, useEffect, useMemo, useState } from "react"
import { MediaImportContext, MediaImportFile, MediaImportFileKey, useMediaImport, useMediaImportDispatch } from "./mediaImportContext"
import { API, ImportMode, NastoolServerConfig } from "../../utils/api/api";
import { MediaImportAction } from "./mediaImportContext";
import { ColumnsType } from "antd/es/table";
import { Organize } from "@/app/utils/api/import";

import { MediaIdentify } from "@/app/utils/api/mediaIdentify";
import { PathSelector } from "../PathSelector";
import { SearchContext } from "../TMDBSearch/SearchContext";
import { MediaIdentifyContext, MediaIdentifyMerged, MediaWork, MediaWorkEpisode, MediaWorkSeason, MediaWorkType, SeriesKey, SeriesKeyType } from "@/app/utils/api/types";
import { asyncEffect } from "@/app/utils";
import { TMDB, TMDBMedia } from "@/app/utils/api/tmdb";
import _, { set, slice } from "lodash";
import { IconEllipsisLoading } from "../icons";
import { MediaDetailCard } from "../TMDBSearch/TinyTMDBSearch";
import { MediaLibrarySelect } from "../LibraryPathSelector";
import { TvMediaImportGroup } from "./MediaImportGroup";

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

export const ImportList = (options: { onSelect?: (value: MediaImportFile[]) => void }) => {
    // const mediaImportDispatch = useMediaImportDispatch();
    const mediaImportContext = useMediaImport();
    const [filteredList, setFilteredList] = useState<MediaImportFile[]>()
    const [selectedFileKeys, setSelectedFileKeys] = useState<MediaImportFileKey[]>([])
    const [fileMap, setFileMap] = useState<Map<string, MediaImportFile>>(new Map())

    useEffect(() => {


            if (mediaImportContext.penddingFiles) {
                const keyMap = new Map<string, MediaImportFile>();
                mediaImportContext.penddingFiles.forEach((file) => keyMap.set(file.name, file))
                setFileMap(keyMap)
            }


    }, [mediaImportContext])
    useEffect(() => {
        if (options.onSelect) {
            const selected = selectedFileKeys.map((key) => fileMap?.get(key)).filter(file => file !== undefined)
            options.onSelect(selected as MediaImportFile[])
        }
    }, [selectedFileKeys, fileMap])
    const files: MediaImportFile[] | undefined = Object.values(mediaImportContext.penddingFiles)
    const identifiedGroup = useMemo(() => {
        const groupMap: Record<MediaWork['key'], MediaImportFile[]> = {};
        files?.forEach(file => {
            const seriesKey = file.indentifyHistory.last();
            if (seriesKey) {
                if (seriesKey.end >= SeriesKeyType.TMDBID) {
                    if ((seriesKey.t == MediaWorkType.TV || seriesKey.t == MediaWorkType.ANI) && seriesKey.i != undefined) {
                        groupMap[seriesKey.i] = groupMap[seriesKey.i] ?? [];
                        groupMap[seriesKey.i].push(file)
                    }
                }

            }
        })
        return groupMap;
    }, [files])
    return <ImportListContext.Provider value={{
        selectedFileKeys: { selectedFileKeys, setSelectedFileKeys },
        fileMap: { fileMap, setFileMap }
    }}>
        <Space direction="vertical" style={{ width: "100%" }} size={10}>
        {
            Object.entries(identifiedGroup)
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
                selectedRowKeys: selectedFileKeys,
                onChange: (selectedRowKeys: React.Key[], selectedRows: MediaImportFile[]) => {
                    setSelectedFileKeys(selectedRowKeys as MediaImportFileKey[])
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
            </ImportListContext.Provider >
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
            <Tooltip title={<pre>{JSON.stringify(options.item, null, 2)}</pre>} overlayInnerStyle={{ overflow: "auto", maxHeight: 500 }}>
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


