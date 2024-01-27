"use client"
import { Section } from "@/app/components/Section";
import { blue, green, cyan, yellow } from '@ant-design/colors';
import { Button, Divider, Input, Popconfirm, Progress, Space, Table, Tag, Tooltip, message } from "antd";
import { PlusOutlined } from "@ant-design/icons"
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, DownloadClient, DownloadClientResource, TorrentInfo, TorrentState, TorrentVagueState } from "@/app/utils/api/download";
import { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { FolderOpenOutlined, CloseOutlined, CaretUpOutlined, CaretDownOutlined } from "@ant-design/icons"
import { IconPause, IconPlay } from "@/app/components/icons";
import { bytes_to_human } from "@/app/utils";
import { StateMap, StateTag } from "@/app/components/StateTag";
import { useResource } from "@/app/utils/api/api_base";

const torrentStateMap: StateMap<TorrentState> = {
    [TorrentState.DOWNLOADING]: {
        key: TorrentState.DOWNLOADING,
        color: "geekblue",
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
    [TorrentState.STALLED]: {
        key: TorrentState.STALLED,
        color: "volcano",
        value: "等待"
    }
}

const torrentStateFilterGroups = [
    {
        text: "活跃",
        value: "active",
        children: [{
            value: TorrentState.DOWNLOADING,
            text: "下载中"
        },
        {
            value: TorrentState.SEEDING,
            text: "做种中"
        },]
    },
    {
        value: TorrentState.CHECKING,
        text: "校验中"
    },
    {
        value: TorrentState.STALLED,
        text: "等待"
    },
    {
        value: TorrentState.PAUSED,
        text: "暂停"
    },
    {
        value: TorrentState.UNKNOWN,
        text: "未知"
    },

]

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

const _EMPTY_LIST = {};

export default function DownloadedPage() {
    const [param, setParam] = useState<string>()
    const [state, setState] = useState(0);
    const pathParam = useParams();
    useEffect(() => {
        setParam(pathParam.state as string)
    }, [pathParam])

    const [torrents, setTorrents] = useState<Record<string, TorrentInfo>>(_EMPTY_LIST);
    const [totalTorrents, setTotalTorrents] = useState(20);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const updateTorrents = (newTorrents: TorrentInfo[]) => {
        newTorrents.forEach((t) => {
            torrents[t.hash] = t;
        })
        setTorrents({ ...torrents })
    }
    const getTorrents = async (pagination = false) => {
        setLoading(true);
        const downloadApi = new Download();
        if (pagination) {
            const partialTorrents = await downloadApi.list({ page: page - 1, size: pageSize });
            updateTorrents(partialTorrents)
        } else {
            const torrents = await new Download().list();
            updateTorrents(torrents)
            setTotalTorrents(torrents.length)
            const categories = new Set<string>();
            torrents.forEach(t => categories.add(t.category || ""))
            categories.delete("")
            setCategories(Array.from(categories))
        }

        setLoading(false)
    }

    useEffect(() => {
        getTorrents();
    }, [])
    const { useList } = useResource<DownloadClientResource>(new DownloadClient());
    const { list: clients, refresh: refreshClients } = useList();
    const downloaderPathMap = useMemo(() => {
        const pathMap: Record<string, string> = {};
        clients?.forEach((value) => {
            value.download_dir.forEach(v => {
                pathMap[v.save_path] = v.container_path
            })
        })
        return pathMap;
    }, [clients])

    const [namePattern, setNamePattern] = useState<string>("");
    const filterdList = useMemo(() => {
        const ts = Object.values(torrents);
        return namePattern.length ? ts.filter((value) => value.name.indexOf(namePattern) > 0) : ts;
    }, [torrents, namePattern])


    const [refreshInterval, setRefreshInterval] = useState(3);
    const intervalRefresh = async () => {
        if (torrents != _EMPTY_LIST) {
            const result = await new Download().list({ state: TorrentVagueState.ACTIVE })
            updateTorrents(result);
        }
    }

    useEffect(() => {
        const timer = setInterval(() => {
            intervalRefresh();
        }, refreshInterval * 1000)
        return () => {
            clearInterval(timer);
        }
    }, [filterdList])


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

                const [downSpeed, downSpeedUnit] = bytes_to_human(record.speed.download)
                const [upSpeed, upSpeedUnit] = bytes_to_human(record.speed.upload)
                return <Space align="center" size="small">

                    <FileButton path={fileLink}>{value}</FileButton>
                    {
                        upSpeed > 0 || downSpeed > 0 ? <Tag bordered={false} color="blue">
                            {upSpeed > 0 ? <><CaretUpOutlined /><span>{upSpeed} {upSpeedUnit}/s</span></> : <></>}
                            {upSpeed > 0 && downSpeed > 0 ? <Divider type="vertical" /> : <></>}
                            {downSpeed > 0 ? <><CaretDownOutlined /><span>{downSpeed} {downSpeedUnit}/s</span></> : <></>}
                        </Tag> : <></>
                    }

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
            width: 200,
            defaultSortOrder: "descend",
            sorter: (a, b) => a.added_date - b.added_date
        },
        {
            title: "状态",
            dataIndex: "state",
            key: "state",
            render: (value: TorrentState) => <StateTag stateMap={torrentStateMap} value={value} />,
            align: "center",
            filters: torrentStateFilterGroups, //Object.entries(torrentStateMap).map(([k, v]) => ({ text: v.value, value: k })),
            filterMode: "tree",
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
        onRefresh={() => { refreshClients(); getTorrents(false) }}
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

function FileButton({ path, children }: { path?: string, children: React.ReactNode }) {
    const router = useRouter();
    return <Tooltip title={path}>
        <Button type="link"
            style={{ padding: 0 }}
            icon={<FolderOpenOutlined />}
            onClick={() => {
                router.push("/media/file" + path)
            }}
            disabled={path == undefined}>{path ? children : <></>}</Button>
        {path ? <></> : children}
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