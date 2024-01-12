"use client"
import { Section } from "@/app/components/Section";
import { MediaDetailCard } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { IconDownloader } from "@/app/components/icons";
import { DownloadOutlined, ArrowUpOutlined } from "@ant-design/icons"
import { TorrentSearchResult, SearchResult, TorrentGroup, Torrent } from "@/app/utils/api/search/torrentSearch";
import { MediaWork, MediaWorkType, SeriesKey } from "@/app/utils/api/types";
import { Button, Col, Collapse, ConfigProvider, Form, List, Modal, Row, Space, Tag } from "antd";
import React from "react";
import Link from "next/link";
import { useForm } from "antd/es/form/Form";
import { DownloadSettingSelect } from "@/app/components/NTSelects";
import { PathSelector } from "@/app/components/PathSelector";
import { MediaLibrarySelect } from "@/app/components/LibraryPathSelector";

export function SearchResult({ result }: { result: SearchResult }) {
    const mediaWork: MediaWork = {
        series: new SeriesKey().type(result.type).tmdbId(result.tmdbid),
        type: result.type,
        key: result.tmdbid,
        title: result.title,
        metadata: {
            description: result.overview,
            image: {
                background: result.backdrop,
                cover: result.poster
            },
            title: result.title,
            links: {}
        }
    }
    const groupedTorernts = result.torrent_dict.map(([key, data]) => {
        const torrentList = Object.entries(data ?? {}).map(([k, v]) => {
            return {
                key: k,
                label: k,
                children: <TorrentsList group={v} />
            }
        });
        return <Section key={key} title={key}>
            <ConfigProvider theme={{
                components: {
                    Collapse: {
                        headerPadding: 10,
                        contentPadding: "4px 0 0 0"
                    }
                }
            }}>
                <Collapse defaultActiveKey={torrentList[0].key} items={torrentList} />
            </ConfigProvider>
        </Section>
    })
    return <>
        <Row gutter={16}>
            <Col span={4}>
                <MediaDetailCard layout="vertical" size="small" mediaDetail={mediaWork} />
            </Col>
            <Col span={20}>
                {groupedTorernts}
            </Col>
        </Row>
    </>
}


export function TorrentsList({ group }: { group: TorrentGroup }) {
    const list = Object.values(group.group_torrents).map((value) => value.torrent_list).reduce((prev, curr) => {
        return curr.concat(prev)
    })
    return <List
        size="small"
        dataSource={list}
        itemLayout="horizontal"
        renderItem={(record) => {
            return <List.Item
                extra={<DownloadModalEntry result={record} />}
            >
                <List.Item.Meta
                    title={<Space size={0}>
                        <Tag style={{ fontWeight: "normal" }} color="blue">{record.site}</Tag>
                        <Link style={{ padding: 0 }} target="_blank" href={record.pageurl}>{record.torrent_name}</Link>
                    </Space>}
                    description={<>
                        {record.description}
                    </>} />
                <Space>

                    <Tag color="orange">{record.video_encode}</Tag>
                    <Tag color="green">{record.size}</Tag>
                    <Tag icon={<ArrowUpOutlined />} color="pink">{record.seeders}</Tag>
                </Space>
            </List.Item>
        }}
    />
}



interface DownloadModalProps {
    result: Torrent
}

export function DownloadModalEntry(options: DownloadModalProps) {
    const [form] = useForm();
    const [modal, contextHolder] = Modal.useModal();
    const downloadForm = <Form form={form} initialValues={{ setting: 0, path: "" }} layout="vertical">
        <Space >
            <Form.Item name="setting" label="下载设置" style={{ width: 200 }}>
                <DownloadSettingSelect />
            </Form.Item>
            <Form.Item name="path" label="下载路径" style={{ width: 200 }}>
                <MediaLibrarySelect />
            </Form.Item>
        </Space>

    </Form>

    return <>{contextHolder}<Button type="text" icon={<DownloadOutlined />}
        onClick={() => {
            modal.confirm({
                title: `下载选项`,
                content: downloadForm,
                width: 500
            })
        }} />
    </>
}

export default function SearchResultPage() {
    const { useData } = new TorrentSearchResult().useResource();
    const { data } = useData();

    return <Section title="搜索结果">
        {data != undefined ? <SearchResult result={data} /> : <></>}
    </Section>
}