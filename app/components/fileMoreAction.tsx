import React, { useEffect, useState } from "react";
import { API, NastoolFileListItem, NastoolNameTestResultData } from "../utils/api";
import { Button, Descriptions, Divider, Drawer, List, Modal, Space, Spin, Table } from "antd";
import { EditOutlined, SwapOutlined } from '@ant-design/icons';
import TMDBSearch from "@/app/components/TMDBSearch"
import MediaImportEntry from "@/app/components/mediaImport/mediaImportEntry"
import { usePathManager } from "./pathManager";
import path from "path";
import { ColumnsType } from "antd/es/table";

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
    const [fileInfo, setFileInfo] = useState<NastoolNameTestResultData>();
    const pathManagerState = usePathManager();
    useEffect(() => {
        setLoadingState(true)
        const nastool = API.getNastoolInstance();

        nastool.then(async (nastool) => {
            const testResult = await nastool.nameTest(file.name);
            console.log(testResult);

            setFileInfo(testResult);
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
            {fileInfo?.title}
            <Button size="small" type="link">#{fileInfo?.tmdbid}</Button>
        </Space>
        <TMDBSearchEntry onApply={onApplyTMDBId} initialSearchValue={file.name} />
    </Space>

    return <>
        <Spin spinning={loadingState} >
            <Descriptions title={title}>
                <Descriptions.Item label="类型">{fileInfo?.type}</Descriptions.Item>
                <Descriptions.Item label="TMDBID">{fileInfo?.tmdbid}</Descriptions.Item>
                <Descriptions.Item label="年份">{fileInfo?.year}</Descriptions.Item>
            </Descriptions>
        </Spin>
        <RelFileTable relFiles={relFilesByPrefix} />
        <br />
        <Space align="end" style={{ width: "100%" }}>
            <MediaImportEntry appendFiles={
                [{
                    name: file.name,
                    path: pathManagerState.deepestPath,
                    rel: []
                }]} />
        </Space>
    </>
}