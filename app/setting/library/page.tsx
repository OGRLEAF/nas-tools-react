"use client"
import { App, Button, Card, Form, Input, List, Modal, Space, Table } from "antd";
import React, { ForwardedRef, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import { PlusOutlined, CloseOutlined, RedoOutlined } from "@ant-design/icons"
import { ServerConfig } from "@/app/utils/api/serverConfig";
import { ColumnsType } from "antd/es/table";
import { Section } from "@/app/components/Section";
import { PathSelector } from "@/app/components/PathSelector";
import { NastoolServerConfig, NastoolServerConfigUpdate } from "@/app/utils/api/api";
import { useAPIContext, useDataResource } from "@/app/utils/api/api_base";
import path from "path";

type LibraryPathType = "movie_path" | "tv_path" | "anime_path"

interface LibraryPathConfig {
    title: string,
    key: LibraryPathType,
    paths: string[]
}


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

type LibraryPathCardAction = { getPaths: () => string[] };
const LibraryPathCard = forwardRef(
    function _LibraryPathCard(options: { title: string, paths: string[], }, ref: ForwardedRef<LibraryPathCardAction>) {
        const [paths, setPaths] = useState<string[]>([]);
        const { API } = useAPIContext()
        const TableHeader = () => {
            return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "1.15em", fontWeight: "bold" }}>{options.title}</div>
                <LibraryPathForm onCreate={(value) => {
                    setPaths([...paths, value])
                    // const mediaPath = { media: { [options.value.key]: [...paths, value] } }
                    // new ServerConfig(API).update(mediaPath as unknown as NastoolServerConfig)
                }} />
            </div>
        }
        useEffect(() => {
            setPaths(options.paths)
        }, [options])

        const { confirm } = Modal;

        useImperativeHandle(ref, () => {
            return {
                getPaths: () => paths
            }
        })

        const tableData = paths.map((value) => ({
            title: value,
            value: value,
            onDelete: (value: string) => {
                confirm({
                    title: "确认删除?",
                    content: <>{options.title}目录{value}</>,
                    onOk: () => {
                        const deletedList = paths.filter((item) => item !== value);
                        if (deletedList.length < paths.length) {
                            setPaths(deletedList);
                        }
                    }
                })

            }
        }))
        return <List size="small" dataSource={tableData} bordered header={<TableHeader />}
            renderItem={(item) => <List.Item
                actions={[
                    <Button key="delete_btn" type="text" danger icon={<CloseOutlined />} onClick={() => item.onDelete(item.value)} />
                ]}
            >
                {item.title}
            </List.Item>}>
        </List>
    })

export default function LibraryPage() {
    const { API } = useAPIContext()
    const serverConfig = useDataResource<NastoolServerConfig>(ServerConfig)
    const { useData, update } = serverConfig;
    const { data, refresh } = useData();
    const moviePathsRef = useRef<LibraryPathCardAction>(null);
    const tvPathsRef = useRef<LibraryPathCardAction>(null);
    const animiePathsRef = useRef<LibraryPathCardAction>(null);

    return <Section title="媒体库" extra={
        <>
            <Button type="primary" onClick={() => refresh()} icon={<RedoOutlined />} />
            {/* {library[2].paths} */}
        </>}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {data &&
                <>
                    <LibraryPathCard ref={moviePathsRef} key="movie_path" title="电影" paths={data.media.movie_path} />
                    <LibraryPathCard ref={tvPathsRef} key="tv_path" title="电视剧" paths={data.media.tv_path} />
                    <LibraryPathCard ref={animiePathsRef} key="anime_path" title="动漫" paths={data.media.anime_path} />
                </>
            }

            <Button type="primary" onClick={() => {
                const newPathConfig: NastoolServerConfigUpdate = {
                    media: {
                        anime_path: animiePathsRef.current?.getPaths(),
                        tv_path: tvPathsRef.current?.getPaths(),
                        movie_path: moviePathsRef.current?.getPaths()
                    }
                }
                update(newPathConfig as NastoolServerConfig)
            }}>保存</Button>
        </Space>
    </Section>
}