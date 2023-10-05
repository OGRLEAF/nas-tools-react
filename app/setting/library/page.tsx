"use client"
import { App, Button, Card, Form, Input, List, Modal, Space, Table } from "antd";
import React, { useEffect, useState } from "react";

import { PlusOutlined, CloseOutlined, RedoOutlined } from "@ant-design/icons"
import { ServerConfig } from "@/app/utils/api/serverConfig";
import { ColumnsType } from "antd/es/table";
import { Section } from "@/app/components/Section";
import { PathSelector } from "@/app/components/PathSelector";

type LibraryPathType = "movie_path" | "tv_path" | "anime_path"

interface LibraryPathConfig {
    title: string,
    key: LibraryPathType,
    paths: string[]
}


const columns: ColumnsType<{ title: string, value: string }[]> = [{
    title: "目录",
    dataIndex: "title",
    width: 750,
    render: (name: string, item) => <>{name}</>,
    defaultSortOrder: "descend",
}]

const LibraryPathForm = (options: { onCreate: (value: string) => void }) => {
    return <Form initialValues={{ path: undefined }}
        onFinish={((value) => {
            if (value.path) {
                if (options.onCreate) options.onCreate(value.path)
            }
        })}
        layout="inline"
        size="middle">
        <Space.Compact>
            <Form.Item name="path" noStyle>
                <PathSelector style={{ width: 400 }}></PathSelector>
            </Form.Item>
            <Form.Item noStyle>
                <Button type="primary" htmlType="submit">添加</Button>
            </Form.Item>
        </Space.Compact>
    </Form>
}

const LibraryPathCard = (options: { value: LibraryPathConfig, }) => {
    const [paths, setPaths] = useState<string[]>([]);
    const TableHeader = () => {
        return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "1.15em", fontWeight: "bold" }}>{options.value.title}</div>
            <LibraryPathForm onCreate={(value) => setPaths([...paths, value])} />
            {/* <div><Button type="primary" size="small" icon={<PlusOutlined />} /></div> */}
        </div>
    }
    useEffect(() => {
        setPaths(options.value.paths)
    }, [options])

    const { confirm } = Modal;

    const tableData = paths.map((value) => ({
        title: value,
        value: value,
        onDelete: (value: string) => {
            confirm({
                title: "确认删除?",
                content: <>{options.value.title}目录{value}</>,
                onOk: () => {
                    const deletedList = paths.filter((item) => item !== value);
                    if (deletedList.length < paths.length) {
                        setPaths(deletedList);
                    }
                    console.log(deletedList)
                }
            })

        }
    }))
    return <List size="small" dataSource={tableData} bordered header={<TableHeader />}
        renderItem={(item) => <List.Item
            actions={[
                <Button type="text" danger icon={<CloseOutlined />} onClick={() => item.onDelete(item.value)} />
            ]}
        >
            {item.title}
        </List.Item>}>
    </List>
}

export default () => {
    const [library, setLibrary] = useState<LibraryPathConfig[]>([])
    const loadLibrary = async () => {
        const libraryPathConfig = await new ServerConfig().get()
        setLibrary([
            {
                title: "电影",
                key: "movie_path",
                paths: libraryPathConfig.media.movie_path
            },
            {
                title: "电视剧",
                key: "tv_path",
                paths: libraryPathConfig.media.tv_path
            },
            {
                title: "动漫",
                key: "anime_path",
                paths: libraryPathConfig.media.anime_path
            },
        ])
    }
    useEffect(() => {
        loadLibrary();
    }, [])
    // const cards = library.map((lib) => <LibraryPathCard key={lib.key} value={lib} />)
    return <Section title="媒体库" extra={
        <>
            <Button type="primary" size="small" onClick={() => loadLibrary()} icon={<RedoOutlined />} />
            {/* {library[2].paths} */}
        </>}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {library.map((lib) => <LibraryPathCard key={lib.key} value={lib} />)}
        </Space>
    </Section>
}