import React, { useEffect, useState } from "react";
import { API, NastoolFileListItem, NastoolNameTestResultData } from "../utils/api/api";
import { Button, Descriptions, Divider, Drawer, List, Modal, Space, Spin, Table } from "antd";
import { EditOutlined, SwapOutlined } from '@ant-design/icons';
import TMDBSearch from "@/app/components/TMDBSearch"
import MediaImportEntry from "@/app/components/mediaImport/mediaImportEntry"
import { usePathManager } from "./pathManager";
import path from "path";
import { ColumnsType } from "antd/es/table";
import { MediaIdentifyContext, MediaWorkType } from "../utils/api/types";
import { MediaIdentify } from "../utils/api/mediaIdentify";

const tmdbSearchModalConfig = {
    title: "搜索",
    content: (<><TMDBSearch initialSearchValue={"0"} /></>)
}


const TMDBSearchEntry = ({ onApply, initialSearchValue }: { onApply: (tmdbid: string) => void, initialSearchValue: string }) => {

    const [open, setOpen] = useState(false);
    const onOpenTMDBSearch = async () => { setOpen(true) }
    return (<>
        <Button size="small" type="text" onClick={onOpenTMDBSearch} icon={<SwapOutlined />} />
        <Drawer title="搜索" placement="right"
            size="large"
            open={open}
            onClose={() => setOpen(false)}
        >
            <TMDBSearch initialSearchValue={initialSearchValue} onSelected={(id: string) => {
                onApply(id);
                setOpen(false)
            }} />
        </Drawer>
    </>
    )
}


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
    const [mediaWorkInfo, setMediaWorkInfo] = useState<MediaIdentifyContext>();
    const pathManagerState = usePathManager();
    useEffect(() => {
        setLoadingState(true)

        new MediaIdentify().identify(file.name)
            .then(async (result) => {
                setMediaWorkInfo(result)

            })
            .finally(() => {
                setLoadingState(false);
            })
    }, [file])


    const onApplyTMDBId = async (tmdbid: string) => {
        const nastool = API.getNastoolInstance()

        console.log(tmdbid);
    }

    const filePrefix = path.parse(file.name).name

    const relFilesByPrefix = relFiles?.filter((file) => file.name.startsWith(filePrefix)) || [];
    const title = <Space>
        <Space >
            {mediaWorkInfo?.title}
            <Button size="small" type="link" >#{mediaWorkInfo?.tmdbId}</Button>
        </Space>
        <TMDBSearchEntry onApply={onApplyTMDBId} initialSearchValue={file.name} />
    </Space>

    const TvExtraInfo = <>
        <Descriptions.Item label="季">{mediaWorkInfo?.season}</Descriptions.Item>
        <Descriptions.Item label="集">{mediaWorkInfo?.episode}</Descriptions.Item>
    </>
    const MovieExtraInfo = <></>
    const ExtraInfo = (mediaWorkInfo?.type || MediaWorkType.UNKNOWN in [MediaWorkType.ANI, MediaWorkType.TV])? TvExtraInfo : MovieExtraInfo;
    return <>
        <Spin spinning={loadingState} >
            <Descriptions title={title}>
                <Descriptions.Item label="类型">{mediaWorkInfo?.type}</Descriptions.Item>
                <Descriptions.Item label="TMDBID">{mediaWorkInfo?.tmdbId}</Descriptions.Item>
                <Descriptions.Item label="年份">{mediaWorkInfo?.year}</Descriptions.Item>
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
                    identifyContext: mediaWorkInfo,
                    rel: relFiles?.map(file => file.name) || []
                }]} />
        </Space>
    </>
}