"use client"
import { Section } from "@/app/components/Section";
import { MediaDetailCard } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { IconDownloader } from "@/app/components/icons";
import { DownloadOutlined, ArrowUpOutlined, CaretUpOutlined, CaretDownOutlined } from "@ant-design/icons"
import { TorrentSearchResult, SearchResult, TorrentGroup, Torrent } from "@/app/utils/api/search/torrentSearch";
import { MediaWork, MediaWorkType, SeriesKey } from "@/app/utils/api/types";
import { Button, Col, Collapse, ConfigProvider, Divider, Form, Input, List, Modal, Row, Space, Tag as AntdTag, TagProps } from "antd";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "antd/es/form/Form";
import { DownloadSettingSelect } from "@/app/components/NTSelects";
import { PathSelector } from "@/app/components/PathSelector";
import { UnionPathsSelect } from "@/app/components/LibraryPathSelector";
import { useSubmitMessage } from "@/app/utils";
import { TagCheckboxGroup } from "@/app/components/TagCheckbox";
import { CollapseProps } from "antd/lib";

const Tag = (props: TagProps) => {
    return props.children ? React.createElement(AntdTag, (props)) : <></>;
}

const DualArrowTag = (props:
    { up?: number, down?: number, show?: (value?: number) => boolean, render?: (value: number) => string, bordered?: boolean }) => {
    const show = props.show ?? ((value?: number) => (value != undefined))
    const render = props.render ?? ((value) => value)
    const { bordered } = props;
    const up = props.up ?? 0;
    const down = props.down ?? 0;
    const showUp = show(up);
    const showDown = show(down);
    return showUp || showDown ? <Tag bordered={bordered} color="blue">
        {showUp ? <><CaretUpOutlined /><span>{render(up)}</span></> : <></>}
        {showUp && showDown ? <Divider type="vertical" /> : <></>}
        {showDown ? <><CaretDownOutlined /><span>{render(down)}</span></> : <></>}
    </Tag> : <></>
}


type FilterType = {
    site?: Set<string>,
    releasegroup?: Set<string>,
    codec?: Set<string>,
    keyword?: string,
    series?: Set<string>
}

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
    const { filter: avaliableFilter } = result;
    const [filter, setFilter] = useState<FilterType>()

    const groupedTorernts = useMemo(() => result.torrent_dict
        .filter(([k]) => filter?.series ? filter.series.size > 0 ? filter.series.has(k) : true : true)
        .map(([key, data]) => {
            const torrentList = Object.entries(data ?? {}).map(([k, v]) => {
                const lists = Object.entries(v.group_torrents)
                    .map(([key, value]): [string, Torrent[]] => [key, value.torrent_list.filter((torrent) => {
                        if (filter?.keyword) {
                            if (!torrent.torrent_name.includes(filter.keyword)) return false;
                        }

                        if (filter?.codec?.size) {
                            if (!filter.codec.has(torrent.video_encode)) return false;
                        }
                        if (filter?.releasegroup?.size && torrent.releasegroup) {
                            if (!filter.releasegroup.has(torrent.releasegroup)) return false;
                        }
                        if (filter?.site?.size) {
                            if (!filter.site.has(torrent.site)) return false;
                        }
                        return true;
                    })]
                    )
                    .filter((list) => list[1].length);
                return {
                    key: k,
                    label: `${k}`,
                    children: lists
                }
            });
            const itemsWithContent = torrentList.filter(({ children }) => children.length);
            if (itemsWithContent.length > 0)
                return <Section key={key} title={key}>
                    <Collapse defaultActiveKey={itemsWithContent[0].key} items={
                        itemsWithContent.map(({ key, label, children }) => ({
                            key, label,
                            children: children.map(([key, list]) => <div key={key}>
                                <TorrentsList list={list} />
                                <Divider style={{ margin: 0 }} />
                            </div>)
                        }))
                    } />
                </Section >
        }), [filter])

    const filterFormItems: CollapseProps['items'] = [
        {
            key: "0",
            label: "关键词",
            children: <Form.Item label="关键词" noStyle name="keyword">
                <Input />
            </Form.Item>
        },
        {
            key: "1",
            label: "站点",
            children: <Form.Item noStyle name="site">
                <TagCheckboxGroup options={avaliableFilter.site.map(site => ({ value: site, label: site }))} />
            </Form.Item>
        },
        {
            key: "2",
            label: "编码",
            children:
                <Form.Item noStyle name="codec">
                    <TagCheckboxGroup options={avaliableFilter.video.map(v => ({ value: v, label: v }))} />
                </Form.Item>
        },
        {
            key: "3",
            label: "发布组",
            children: <Form.Item noStyle name="releasegroup">
                <TagCheckboxGroup options={avaliableFilter.releasegroup.map(v => ({ value: v, label: v }))} />
            </Form.Item>
        },
        {
            key: "4",
            label: "季/集",
            children: <Form.Item noStyle name="series">
                <TagCheckboxGroup options={result.torrent_dict.map(([v]) => ({ value: v, label: v }))} />
            </Form.Item>
        }
    ]
    return <Space direction="vertical" style={{ width: "100%" }}>
        <Row >
            <Col span={24}></Col>
        </Row >
        <Row gutter={20}>
            <Col span={5}>
                <MediaDetailCard layout="vertical" size="tiny" mediaDetail={mediaWork} />
                <br />
                <Divider orientation="left" orientationMargin={0}>过滤</Divider>
                <Form layout="vertical"
                    onValuesChange={((values: [keyof FilterType, FilterType[keyof FilterType]], allValues) => {
                        const [[key, value]] = Object.entries(values) as [keyof FilterType, FilterType[keyof FilterType]][];
                        const newFilter = { ...filter };
                        if (key == "keyword") newFilter[key] = value as string;
                        else newFilter[key] = new Set<string>(value);
                        setFilter(newFilter);
                    })}>

                    <ConfigProvider theme={{ components: { Collapse: { headerPadding: 0 } } }}>
                        <Collapse defaultActiveKey={"0"} items={filterFormItems} size="small" ghost />
                    </ConfigProvider>
                </Form>
            </Col>
            <Col span={19}>
                <ConfigProvider theme={{
                    components: {
                        Collapse: {
                            headerPadding: 10,
                            contentPadding: "4px 0 0 0"
                        }
                    }
                }}>
                    {groupedTorernts}
                </ConfigProvider>
            </Col>
        </Row>
    </Space>
}


export function TorrentsList({ list: group }: { list: Torrent[] }) {
    const list = group;
    return <List
        size="small"
        dataSource={list}
        itemLayout="horizontal"
        renderItem={(record) => {
            return <List.Item
                extra={<DownloadModalEntry result={record} />}
            >
                <List.Item.Meta
                    title={<Space>
                        <Link style={{ padding: 0 }} target="_blank" href={record.pageurl}>{record.torrent_name}</Link>
                        <Tag style={{ fontWeight: "normal" }} color="blue">{record.site}</Tag>
                    </Space>}
                    description={<>
                        {record.description}
                    </>} />
                <Space>
                    <Tag color="orange">{record.video_encode}</Tag>
                    <Tag color="green">{record.size}</Tag>
                    <Tag icon={<ArrowUpOutlined />} color="pink">{record.seeders ?? "N/A"}</Tag>
                    <DualArrowTag show={(value) => value != 0} up={record.uploadvalue} down={record.downloadvalue}
                        render={(value) => `${value}X`}
                    />
                </Space>
                <Divider type="vertical" />
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
    const { bundle, contextHolder: messageContextHolder } = useSubmitMessage("下载");
    const submit = bundle("下载提交")
    const downloadForm = <Form form={form} initialValues={{ setting: 0, path: undefined }} layout="vertical">
        <Form.Item name="setting" label="下载设置" >
            <DownloadSettingSelect style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="path" label="下载路径" >
            <UnionPathsSelect style={{ width: "100%" }} library={false} />
        </Form.Item>

    </Form>

    return <>{contextHolder}{messageContextHolder}<Button type="link" icon={<DownloadOutlined />}
        onClick={() => {
            modal.confirm({
                title: `下载选项`,
                content: downloadForm,
                width: 500,
                onOk: () => {
                    const values = form.getFieldsValue();
                    submit.loading();
                    new TorrentSearchResult().download(options.result.id, values.path, values.setting)
                        .then((msg) => {
                            submit.success()
                        })
                        .catch((e) => {
                            submit.error(e)
                        })
                }
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