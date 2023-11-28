"use client"
import { Section } from "@/app/components/Section";
import { Button, Progress, Space, Table, Tag, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons"
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, DownloadClient, TorrentInfo, TorrentState } from "@/app/utils/api/download";
import { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { FolderOpenOutlined } from "@ant-design/icons"
import { IconPause, IconPlay } from "@/app/components/icons";
import { bytes_to_human } from "@/app/utils";
import { StateMap, StateTag } from "@/app/components/StateTag";
import { LiteralType } from "typescript";

const torrentStateMap: StateMap<TorrentState> = {
    [TorrentState.ALL]: {
        key: TorrentState.ALL,
        value: "未知"
    },
    [TorrentState.DOWNLOADING]: {
        key: TorrentState.DOWNLOADING,
        color: "blue",
        value: "下载中"
    },
    [TorrentState.SEEDING]: {
        key: TorrentState.SEEDING,
        color: "green",
        value: "做种中"
    },
    [TorrentState.CHECKING]: {
        key: TorrentState.CHECKING,
        color: "cyan",
        value: "校验中"
    },
    [TorrentState.PAUSED]: {
        key: TorrentState.PAUSED,
        color: "blue",
        value: "暂停"
    },
    [TorrentState.UNKNOWN]: {
        key: TorrentState.UNKNOWN,
        value: "未知"
    },
}

const torrentPrivateTag: StateMap<number> = {
    0: {
        key: 0,
        color: "blue",
    },
    1: {
        key: 1,
        color: "cyan",
        value: "Private"
    }
}

export default function DownloadedPage() {
    const [param, setParam] = useState<string>()
    const [state, setState] = useState(0);
    const pathParam = useParams();
    useEffect(() => {
        setParam(pathParam.state as string)
    }, [pathParam])

    const [torrents, setTorrents] = useState<TorrentInfo[]>([]);
    const [totalTorrents, setTotalTorrents] = useState(20);
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const getTorrents = async (pagination = false) => {
        setLoading(true);
        if (pagination) {
            const partialTorrents = await new Download().list(page - 1, pageSize);
            const seg1 = (page - 1) * pageSize;
            const seg2 = (page) * pageSize;
            // console.log(seg1, seg2)
            const preSet = seg1 > 0 ? torrents.slice(0, seg1) : [];
            const backSet = torrents.slice(seg2);
            // console.log(totalTorrents, preSet, partialTorrents, backSet)
            setTorrents([
                ...preSet,
                ...partialTorrents.list,
                ...backSet
            ])
        } else {
            const torrents = await new Download().list();
            setTorrents(torrents.list)
            setTotalTorrents(torrents.list.length)
        }

        setLoading(false)
    }

    useEffect(() => {
        getTorrents();
    }, [])

    const [downloaderPathMap, setDownloaderPathMap] = useState<Record<string, string>>({});
    const getDownloadClinets = async () => {
        const clientConfigs = await new DownloadClient().list();
        console.log(clientConfigs)
        const pathMap: Record<string, string> = {};
        clientConfigs.forEach((value) => {
            value.download_dir.forEach(v => {
                pathMap[v.save_path] = v.container_path
            })
        })
        setDownloaderPathMap(pathMap);
    }

    useEffect(() => {
        getDownloadClinets();
    }, [])



    const columns: ColumnsType<TorrentInfo> = [
        {
            title: "名称",
            dataIndex: "name",
            key: "name",
            render: (value: string, record) => {
                const containerPath = downloaderPathMap[record.save_path]
                const fileLink = containerPath == undefined ? undefined
                    : record.content_path.replace(record.save_path, containerPath)

                return <Space align="center">
                    {value}
                    <StateTag stateMap={torrentPrivateTag} value={Number(record.is_private)} />
                    <FileButton path={fileLink} />
                </Space>
            }
        },
        {
            title: "进度",
            dataIndex: "progress",
            key: "progress",
            render: (value) => {
                return <div style={{ paddingRight: 10 }}><Progress percent={Math.round(value * 1000) / 10} /></div>
            },
            width: 250,
            defaultSortOrder: "ascend",
            sorter: (a, b) => a.progress - b.progress
        },
        {
            title: "体积",
            dataIndex: "total_size",
            key: "total_size",
            render: (value, record) => {
                const [num, unit] = bytes_to_human(value, 2)
                return <>{num.toFixed(2)} {unit}</>
            },
            align: "right",
            defaultSortOrder: "ascend",
            sorter: (a, b) => a.total_size - b.total_size
        },
        {
            title: "添加时间",
            dataIndex: "added_date",
            key: "added_date",
            render(value) {
                const dateStr = new Date(value * 1000);
                return <>{dateStr.toLocaleDateString()} {dateStr.toLocaleTimeString()}</>
            },
            align: "right",
            width: 150,
            defaultSortOrder: "descend",
            sorter: (a, b) =>a.added_date - b.added_date
        },
        {
            title: "状态",
            dataIndex: "state",
            key: "state",
            render: (value: TorrentState) => <StateTag stateMap={torrentStateMap} value={value} />,
            align: "center",
            filters: Object.entries(torrentStateMap).map(([k, v]) => ({ text: k, value: k })),
            onFilter: (value, record) => (record.state === value),
        },
        {
            title: "操作",
            render: (_, record) => {
                return <Space>
                    {
                        record.state == TorrentState.PAUSED ? <Button
                            type="link"
                            icon={<IconPlay />}
                            onClick={() => {
                                new Download().resume(record.hash)
                            }} />
                            :
                            <Button
                                type="link"
                                icon={<IconPause />}
                                onClick={() => {
                                    new Download().pause(record.hash)
                                }} />
                    }

                </Space>
            }
        }
    ]

    return <Section title="下载任务"
        onRefresh={() => { getDownloadClinets(); getTorrents(true) }}
        extra={
            <Space>
                <Button icon={<PlusOutlined />}
                    onClick={() => setState(state + 1)}
                    type="primary">添加下载任务</Button>
            </Space>
        }>
        <Table dataSource={torrents}
            size="small"
            rowKey="hash"
            columns={columns}
            loading={loading}
            pagination={
                {
                    position: ["topRight", "bottomRight"],
                    pageSize: pageSize,
                    showSizeChanger: true,
                    total: totalTorrents,
                    onChange: (page, pageSize) => {
                        setPage(page);
                        setPageSize(pageSize)
                    }
                }
            }
        >

        </Table>
    </Section>
}

function FileButton({ path }: { path?: string }) {
    const router = useRouter();
    return <Tooltip title={path}>
        <Button type="link" icon={<FolderOpenOutlined />}
            onClick={() => {
                router.push("/media/file" + path)
            }}
            disabled={path == undefined} />
    </Tooltip>
}