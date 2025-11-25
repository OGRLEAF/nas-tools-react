"use client"
import { Section } from "@/app/components/Section";
import { MediaDetailCard } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { DownloadOutlined, ArrowUpOutlined, CaretUpOutlined, CaretDownOutlined } from "@ant-design/icons"
import { TorrentSearchResult, SearchResult, Torrent, TorrentGroup } from "@/app/utils/api/search/torrentSearch";
import { MediaWork, SeriesKey } from "@/app/utils/api/types";
import { Button, Col, Collapse, ConfigProvider, Divider, Form, Input, List, Modal, Row, Space, Tag as AntdTag, TagProps } from "antd";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "antd/es/form/Form";
import { DownloadSettingSelect } from "@/app/components/NTSelects";
import { DownloadPathSelect, EmptyPathSelect, StringPathInput, UnionPathsSelectGroup } from "@/app/components/LibraryPathSelector";
import { useSubmitMessage } from "@/app/utils";
import { TagCheckboxGroup } from "@/app/components/TagCheckbox";
import { CollapseProps } from "antd/lib";
import { DualArrowTag } from "@/app/components/DualArrowTag";
import { useDataResource } from "@/app/utils/api/api_base";

const Tag = (props: TagProps) => {
    return props.children ? React.createElement(AntdTag, (props)) : <></>;
}

type FilterType = {
    site?: Set<string>,
    releasegroup?: Set<string>,
    codec?: Set<string>,
    keyword?: string,
    series?: Set<string>
}

function SearchResultPannel({ result }: { result: SearchResult }) {
    const mediaWork: MediaWork = {
        series: new SeriesKey().type(result.type).tmdbId(result.tmdbid),
        type: result.type,
        key: result.tmdbid,
        title: result.title,
        metadata: {
            description: result.overview,
            images: {
                background: result.backdrop,
                cover: result.poster
            },
            title: result.title,
            links: {}
        }
    }
    const { filter: avaliableFilter } = result;
    const [filter, setFilter] = useState<FilterType>()

    const groupedTorernts = useMemo(() => {
        if (filter) {
            const { series, } = filter;
            return result.torrent_dict
                .filter(([k]) => series ? series.size > 0 ? series.has(k) : true : true)
                .map(([key, data]) => <FilteredTorrentList key={key} resultMap={data} title={key} filter={filter} />)
        } else {
            return result.torrent_dict.map(([key, data]) => <FilteredTorrentList key={key} resultMap={data} title={key} filter={{}} />)
        }
    }, [filter, result.torrent_dict])

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
    return <Space orientation="vertical" style={{ width: "100%" }}>
        <Row gutter={20}>
            <Col span={4}>
                <MediaDetailCard layout="vertical" size="tiny" mediaDetail={mediaWork} />
                <br />
                <Divider titlePlacement="left">过滤</Divider>
                <Form layout="vertical"
                    onValuesChange={((values: Partial<FilterType>, allValues) => {
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
            <Col span={20}>
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


function TorrentsList({ list: group }: { list: Torrent[] }) {
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
                <Divider orientation="vertical" />
            </List.Item>
        }}
    />
}



interface DownloadModalProps {
    result: Torrent
}

function DownloadModalEntry(options: DownloadModalProps) {
    const [form] = useForm();
    const [modal, contextHolder] = Modal.useModal();
    const { bundle, contextHolder: messageContextHolder } = useSubmitMessage("下载");
    const submit = bundle("下载提交")
    const downloadForm = <Form form={form} initialValues={{ setting: 0, path: undefined }} layout="horizontal">
        <Form.Item name="setting" label="下载设置" style={{ marginTop: 12, marginBottom: 16 }}>
            <DownloadSettingSelect style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="path" label="下载路径" style={{ marginBottom: 4 }}>
            <UnionPathsSelectGroup fallback="customize">
                <EmptyPathSelect key="auto" label="自动" />
                <DownloadPathSelect key="download" label="下载器目录" />
                <StringPathInput key="customize" label="自定义目录" />
            </UnionPathsSelectGroup>
        </Form.Item>

    </Form>
    return <>{contextHolder}{messageContextHolder}<Button type="link" icon={<DownloadOutlined />}
        onClick={() => {
            modal.confirm({
                title: `下载选项`,
                content: downloadForm,
                width: 500,
                styles: {
                    "footer": {
                        marginTop: 0
                    }
                },
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
    const { useData } = useDataResource(TorrentSearchResult)
    const { data } = useData();

    return <Section title="搜索结果">
        {data != undefined ? <SearchResultPannel result={data} /> : <></>}
    </Section>
}



function FilteredTorrentList({ title, filter, resultMap }: { title: string, filter: FilterType, resultMap: Record<string, TorrentGroup> }) {
    const data = resultMap;
    const { series, keyword, site, codec, releasegroup } = filter;
    const torrentList = Object.entries(data ?? {}).map(([k, v]) => {
        const lists = Object.entries(v.group_torrents)
            .map(([key, value]): [string, Torrent[]] => [key, value.torrent_list.filter((torrent) => {
                if (keyword) {
                    if (!torrent.torrent_name.includes(keyword)) return false;
                }

                if (codec?.size) {
                    if (!codec?.has(torrent.video_encode)) return false;
                }
                if (releasegroup?.size && torrent.releasegroup) {
                    if (!releasegroup?.has(torrent.releasegroup)) return false;
                }
                if (site?.size) {
                    if (!site?.has(torrent.site)) return false;
                }
                return true;
            })]
            ).filter((list) => list[1].length);
        return {
            key: k,
            label: k,
            children: lists
        }
    });
    const itemsWithContent = torrentList.filter(({ children }) => children.length);
    if (itemsWithContent.length > 0)
        return <Section key={title} title={title}>
            <Collapse defaultActiveKey={itemsWithContent[0].key}
            items={
                itemsWithContent.map(({ key, label, children }) => ({
                    key, label,
                    style: {
                        
                    },
                    children: children.map(([key, list]) => <div key={key}>
                        <TorrentsList list={list} />
                        <Divider style={{ margin: 0 }} />
                    </div>)
                }))
            } />
        </Section >
    return null
}