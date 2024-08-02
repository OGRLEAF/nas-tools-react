import React, { useEffect, useMemo, useState } from "react";
import { NastoolFileListItem } from "../utils/api/api";
import { Button, Descriptions, Space, Spin, Table } from "antd";
import MediaImportEntry from "@/app/components/mediaImport/mediaImportEntry"
import { usePathManager } from "./pathManager";
import path from "path";
import { ColumnsType } from "antd/es/table";
import { MediaWork, MediaWorkType, SeriesKey } from "../utils/api/types";
import { MediaIdentify } from "../utils/api/media/mediaIdentify";
import { asyncEffect } from "../utils";
import { TMDB } from "../utils/api/media/tmdb";
import { IdentifyHistory } from "./mediaImport/mediaImportContext";

const RelFileTable = ({ relFiles }: { relFiles: NastoolFileListItem[] }) => {
    const relFilesTableData = relFiles.map((file) => ({
        name: file.name,
        type: path.parse(file.name).ext
    }))
    const columns: ColumnsType<(typeof relFilesTableData)[0]> = [
        {
            title: <Space><span>文件名</span></Space>,
            dataIndex: "name",
            key: "name",
            render: (text, item) => text
        }, {
            title: <Space><span>类型</span></Space>,
            dataIndex: "type",
            key: "type",
            render: (text, item) => text
        }, {
            title: <span></span>
        }
    ]
    return <Table
        pagination={false}
        rowKey="name"
        dataSource={relFilesTableData}
        columns={columns}

    >

    </Table>
}

export default function FileMoreAction({ file, relFiles }:
    { file: NastoolFileListItem, relFiles?: NastoolFileListItem[] }) {
    const [loadingState, setLoadingState] = useState(true);
    const [mediaWorkInfo, setMediaWorkInfo] = useState<MediaWork>();
    const [seriesKey, setSeriesKey] = useState<SeriesKey>();
    const pathManagerState = usePathManager();
    useEffect(asyncEffect(async () => {
        setLoadingState(true)

        const seriesKey = await new MediaIdentify().identifySeries(file.name)
        setSeriesKey(seriesKey)
        const mediaWork = await new TMDB().fromSeries(seriesKey);
        setMediaWorkInfo(await mediaWork?.get())
        setLoadingState(false);

    }), [file])

    const filePrefix = path.parse(file.name).name

    const relFilesByPrefix = relFiles?.filter((file) => file.name.startsWith(filePrefix)) || [];

    const metadata = useMemo(() => mediaWorkInfo?.metadata, [mediaWorkInfo])
    const title = <Space>
        <Space >
            {metadata?.title}
            <Button size="small" type="link" >#{mediaWorkInfo?.key}</Button>
        </Space>
        {/* <TMDBSearchEntry onApply={onApplyTMDBId} initialSearchValue={file.name} /> */}
    </Space>

    const TvExtraInfo = <>
        <Descriptions.Item label="季">{seriesKey?.s}</Descriptions.Item>
        <Descriptions.Item label="集">{seriesKey?.e}</Descriptions.Item>
    </>
    const MovieExtraInfo = <></>
    const ExtraInfo = (mediaWorkInfo?.type || MediaWorkType.UNKNOWN in [MediaWorkType.ANI, MediaWorkType.TV]) ? TvExtraInfo : MovieExtraInfo;
    return <>
        <Spin spinning={loadingState} >
            <Descriptions title={title}>
                <Descriptions.Item label="类型">{seriesKey?.t}</Descriptions.Item>
                <Descriptions.Item label="TMDBID">{seriesKey?.i}</Descriptions.Item>
                <Descriptions.Item label="年份">{metadata?.date?.release}</Descriptions.Item>
                {ExtraInfo}
            </Descriptions>
        </Spin>
        <RelFileTable relFiles={relFilesByPrefix} />
        <br />
        <Space align="end" style={{ width: "100%" }}>
            <MediaImportEntry appendFiles={
                [{
                    name: file.name,
                    path: pathManagerState.deepestPath,
                    indentifyHistory: new IdentifyHistory().push(seriesKey),
                    rel: relFiles?.map(file => file.name) || [],
                    selected: true
                }]} />
        </Space>
    </>
}