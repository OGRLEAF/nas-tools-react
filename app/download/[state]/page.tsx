"use client"
import { Section } from "@/app/components/Section";
import { Button, Input, Popconfirm, Progress, Space, Table, Tag, Tooltip, message } from "antd";
import { PlusOutlined } from "@ant-design/icons"
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, DownloadClient, TorrentInfo, TorrentState } from "@/app/utils/api/download";
import { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { FolderOpenOutlined, CloseOutlined } from "@ant-design/icons"
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
        value: "P"
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
    const [categories, setCategories] = useState<string[]>([]);
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
            const categories = new Set<string>();
            torrents.list.forEach(t => categories.add(t.category || ""))
            categories.delete("")
            setCategories(Array.from(categories))
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

    const [namePattern, setNamePattern] = useState<string>("");
    const filterdList = useMemo(() => {
        return namePattern.length ? torrents.filter((value) => value.name.indexOf(namePattern) > 0) : torrents;
    }, [torrents, namePattern])
    const [messageApi, contextHolder] = message.useMessage();
    const columns: ColumnsType<TorrentInfo> = [
        {
            title: <Space size="large">
                <span>名称</span>
                <Input size="small" placeholder="搜索" onChange={(evt) => { setNamePattern(evt.currentTarget.value) }} allowClear />
            </Space>,
            dataIndex: "name",
            key: "name",
            render: (value: string, record) => {
                const containerPath = downloaderPathMap[record.save_path]
                const fileLink = containerPath == undefined ? undefined
                    : record.content_path.replace(record.save_path, containerPath)

                return <Space align="center">
                    {value}
                    <FileButton path={fileLink} />
                </Space>
            },
        },
        {
            title: "分类",
            dataIndex: "category",
            render(value: string, record) {
                if (value.length)
                    return <Tag color="cyan" bordered={false}>{value}</Tag>
                else
                    return <></>
            },
            width: 100,
            filters: categories.map((v) => ({ text: v, value: v })),
            onFilter: (value, record) => (record.category === value),
        },
        {
            title: "进度",
            dataIndex: "progress",
            key: "progress",
            render: (value) => {
                return <div style={{ paddingRight: 10 }}><Progress percent={Math.round(value * 1000) / 10} /></div>
            },
            width: 250,
            // defaultSortOrder: "ascend",
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
            // defaultSortOrder: "ascend",
            width: 100,
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
            sorter: (a, b) => a.added_date - b.added_date
        },
        {
            title: "状态",
            dataIndex: "state",
            key: "state",
            render: (value: TorrentState) => <StateTag stateMap={torrentStateMap} value={value} />,
            align: "center",
            filters: Object.entries(torrentStateMap).map(([k, v]) => ({ text: v.value, value: k })),
            onFilter: (value, record) => (record.state === value),
            width: 100,
        },
        {
            title: "操作",
            render: (_, record) => {
                return <Space>
                    {
                        record.state == TorrentState.PAUSED ?
                            <ActionButton actionOptions={{ title: "开始", apiAction: "resume", icon: <IconPlay />, confirm: false }} record={record} />
                            :
                            <ActionButton actionOptions={{ title: "暂停", apiAction: "pause", icon: <IconPause />, confirm: false }} record={record} />
                    }
                    <ActionButton actionOptions={{ title: "删除", apiAction: "remove", icon: <CloseOutlined />, danger: true }} record={record} />
                </Space>
            },
            width: 100,
        }
    ]

    return <Section title="下载任务"
        onRefresh={() => { getDownloadClinets(); getTorrents(false) }}
        extra={
            <Space>
                <Button icon={<PlusOutlined />}
                    onClick={() => setState(state + 1)}
                    type="primary">添加下载任务</Button>
            </Space>
        }>
        {contextHolder}
        <Table dataSource={filterdList}
            size="small"
            rowKey="hash"
            columns={columns}
            loading={loading}
            pagination={
                {
                    position: ["bottomRight"],
                    showSizeChanger: true,
                    // total: totalTorrents
                    pageSize: pageSize,
                    onChange: (page, pageSize) => {
                        setPage(page);
                        setPageSize(pageSize)
                    },
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

interface ActionOptions {
    title: string,
    apiAction: "resume" | "pause" | "remove",
    icon: React.ReactNode,
    confirm?: boolean,
    danger?: boolean
}


function ActionButton({ record, actionOptions }: { actionOptions: ActionOptions, record: TorrentInfo }) {
    const { title, apiAction, icon, danger, confirm } = actionOptions;
    const [messageApi, contextHolder] = message.useMessage();
    const doAction = () => {
        messageApi.open({ type: "loading", content: `${title} ${record.name}`, duration: 0, key: `${record.hash}-action` });
        new Download().action(apiAction, record.hash)
            .then(() => {
                messageApi.open({ type: "success", content: '完成', duration: 3, key: `${record.hash}-action` });
            })
    }
    const onConfirm = () => {
        setOpen(false);
        doAction()
    };

    const [open, setOpen] = useState(false);
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setOpen(newOpen);
            return;
        }

        if (confirm != undefined && confirm === false) {
            onConfirm();
        } else {
            setOpen(newOpen);
        }
    };
    return <>
        <Popconfirm open={open} onOpenChange={handleOpenChange} onConfirm={onConfirm} title={`${title} ${record.name} ?`}>
            <Button type="link" danger={danger || false} icon={icon} />
        </Popconfirm >
        {contextHolder}
    </>
}