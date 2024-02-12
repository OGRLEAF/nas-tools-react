"use client"
import { CardsForm } from "@/app/components/CardsForm";
import { BatchActions, Cards, useSelection } from "@/app/components/CardsForm/Cards";
import { DualArrowTag } from "@/app/components/DualArrowTag";
import { DownloadPathSelect, EmptyPathSelect, LibraryPathSelect, UnionPathsSelectGroup } from "@/app/components/LibraryPathSelector";
import { DownloadClientSelect, SiteSelect } from "@/app/components/NTSelects";
import { PathSelector } from "@/app/components/PathSelector";
import { StateTag } from "@/app/components/StateTag";
import TagsSelect from "@/app/components/TagsSelect";
import { IconDownloader, IconPause, IconPlay, IconRefresh } from "@/app/components/icons";
import { bytes_to_human } from "@/app/utils";
import { useResource } from "@/app/utils/api/api_base";
import { BrushTask, BrushTaskConfig, BrushTaskProfile, BrushTaskResourceType, BrushTaskTorrent, BrushTaskTorrentType, BrushTaskTorrents, FreeType, TaskState } from "@/app/utils/api/brushtask";
import { RssTaskConfig } from "@/app/utils/api/subscription/rss";
import { Button, Collapse, Descriptions, Divider, Flex, Form, Input, InputNumber, Select, Space, Switch, Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import { SelectProps, Table } from "antd/lib";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function SitesTasksPage() {
    const selection = useSelection<BrushTaskResourceType>({ key: "id" });
    const { selected } = selection
    return <>
        <CardsForm<BrushTaskResourceType>
            title="刷流任务"
            resource={BrushTask}
            formComponent={TaskConfigForm}
            extra={(resource) => {
                return [
                    <Divider key="divider" type="vertical" />,
                    <BatchActions key="batch_action" selection={selection} />,
                    <Button key="enable_btn" icon={<IconPlay />}
                        onClick={async () => {
                            selected &&
                                await resource.updateMany?.(selected?.map(v => ({ ...v, state: TaskState.RUNNING })));
                        }}>开启</Button>,
                    <Button key="disable_btn" icon={<IconPause />}
                        onClick={async () => {
                            selected &&
                                await resource.updateMany?.(selected?.map(v => ({ ...v, state: TaskState.STOPPED })));
                        }}>停止</Button>
                ]
            }}
        >
            <Cards<BrushTaskResourceType>
                selection={selection}
                spaceProps={{ direction: "vertical" }}
                cardProps={(record) => ({
                    title: <Space>
                        <span>{record.config.name}</span>
                    </Space>,
                    description: <TaskCard task={record} />
                })}
            />
        </CardsForm>
    </>
}

const TaskCard = ({ task }: { task: BrushTaskProfile }) => {
    return <>
        <Descriptions size="small" column={5}>
            <Descriptions.Item label="站点">{task.status.site}</Descriptions.Item>
            <Descriptions.Item label="促销">{task.config.rss_rule.free}</Descriptions.Item>
            <Descriptions.Item label="包含">{task.config.rss_rule.include}</Descriptions.Item>
            <Descriptions.Item label="排除">{task.config.rss_rule.exclude}</Descriptions.Item>
            <Descriptions.Item label="状态">
                <StateTag<TaskState> value={task.config.state} stateMap={{
                    [TaskState.STOPPED]: { key: TaskState.STOPPED, color: 'blue', value: "停止" },
                    [TaskState.RUNNING]: { key: TaskState.RUNNING, color: 'green', value: "运行" },
                    [TaskState.STAGING]: { key: TaskState.STAGING, color: 'blue', value: "只下载新种" }
                }} />
            </Descriptions.Item>
            <Descriptions.Item label="已下载">{task.status.download_count}</Descriptions.Item>
            <Descriptions.Item label="已删除">{task.status.remove_count}</Descriptions.Item>
            <Descriptions.Item label="上传限速">{task.config.up_limit ?? '不限速'}</Descriptions.Item>
            <Descriptions.Item label="下载限速">{task.config.dl_limit ?? '不限速'}</Descriptions.Item>
            <Descriptions.Item label="最后更新">{task.status.last_update}</Descriptions.Item>
            <Descriptions.Item label="流量">
                <DualArrowTag up={task.status.upload_size} down={task.status.download_size}
                    render={(value) => {
                        const [v, unit] = bytes_to_human(value);
                        return `${v} ${unit}`
                    }} />
            </Descriptions.Item>
        </Descriptions>
        <div onClick={(evt) => evt.stopPropagation()}>
            <TaskTorrentsList id={task.id} />
        </div>
    </>
}


function TaskConfigForm({ record, onChange }: { record?: BrushTaskProfile, onChange?: (value: BrushTaskResourceType['UpdateItemType']) => void }) {
    return <Form<BrushTaskConfig> initialValues={record?.config} layout="vertical"
        onFinish={(values) => {
            console.log(values)
            if (record?.id) {
                onChange?.({ id: record?.id, config: values })
            }
        }}>
        <Flex gap={12}>
            <Form.Item name="name" label="任务名称" style={{ flexGrow: 1 }}>
                <Input />
            </Form.Item>

            <Form.Item name="interval" label="间隔" style={{ flexGrow: 0.5 }}>
                <Input />
            </Form.Item>
            <Form.Item name="state" label="状态" style={{ flexGrow: 1 }}>
                <Select options={[
                    { value: TaskState.STOPPED, label: "停止" },
                    { value: TaskState.RUNNING, label: "运行" },
                    { value: TaskState.STAGING, label: "不新增下载" }
                ]} />
            </Form.Item>
        </Flex>
        <Flex gap={12}>
            <Form.Item name="site_id" label="站点" style={{ flexGrow: 1 }}>
                <SiteSelect mode="single" siteKey="id" />
            </Form.Item>
            <Form.Item name="downloader" style={{ flexGrow: 1 }} label="下载器">
                <DownloadClientSelect />
            </Form.Item>
            <Form.Item name="seed_size" label="保种体积" style={{ flexGrow: 0.5 }}>
                <InputNumber style={{ width: "100%" }} />
            </Form.Item>
        </Flex>

        <Form.Item name="label" label="标签">
            <TagsSelect sep="," />
        </Form.Item>
        <Space size="large">
            <Form.Item name="dl_limit" label="上限下载速度">
                <InputNumber addonAfter="KB/s" />
            </Form.Item>
            <Form.Item name="up_limit" label="上限上传速度">
                <InputNumber addonAfter="KB/s" />
            </Form.Item>
        </Space>
        <Form.Item name="rss_url" label="RSS地址">
            <Input />
        </Form.Item>
        <Form.Item name="savepath" label="保存目录">
            <UnionPathsSelectGroup
                fallback="customize"
                items={[
                    {
                        type: "auto",
                        label: "自动",
                        render: (props) => <EmptyPathSelect key="auto" emptyValue={undefined} />
                    },
                    {
                        type: "download",
                        label: "下载目录",
                        render: (props) => <DownloadPathSelect key="download" remote={false} value={props.value} onChange={props.onChange} />
                    },
                    {
                        type: "customize",
                        label: "自定义目录",
                        render: (props) => <PathSelector key="customize" value={props.value} onChange={props.onChange} />
                    }
                ]}
            />
        </Form.Item>
        <Space>
            <Form.Item name="sendmessage" valuePropName="checked" label="消息推送">
                <Switch />
            </Form.Item>
            <Form.Item name="transfer" valuePropName="checked" label="转移到媒体库">
                <Switch />
            </Form.Item>
        </Space>
        <Divider orientation="left" orientationMargin="0">选种规则（与）</Divider>

        <Flex gap={12} wrap={"wrap"} style={{ width: "100%" }}>
            <Form.Item name={['rss_rule', 'dlcount']} label="同时下载任务数" style={{ width: "calc(25% - 6px)", }}>
                <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name={["rss_rule", "free"]} label="促销" style={{ width: "calc(37.5% - 12px)", boxSizing: "border-box" }}>
                <Select options={[
                    { value: FreeType.ALL, label: "全部" },
                    { value: FreeType.FREE, label: "免费" },
                    { value: FreeType.FREE2X, label: "2X免费" },
                ]} />
            </Form.Item>
            <Form.Item name={["rss_rule", "hr"]} label="Hit&Run" style={{ width: "calc(37.5% - 6px)", boxSizing: "border-box" }}>
                <Select options={[
                    { value: '', label: "全部" },
                    { value: 'HR', label: "排除HR" }
                ]} />
            </Form.Item>
        </Flex>
        <Form.Item name={['rss_rule', 'include']} label="包含">
            <Input />
        </Form.Item>
        <Form.Item name={['rss_rule', 'exclude']} label="排除">
            <Input />
        </Form.Item>
        <Space size="large">
            <Form.Item name={['rss_rule', 'upspeed']} label="上传限速">
                <InputNumber addonAfter="KB/s" />
            </Form.Item>
            <Form.Item name={['rss_rule', 'downspeed']} label="下载限速">
                <InputNumber addonAfter="KB/s" />
            </Form.Item>
        </Space>
        <Space size="large" wrap>
            <Form.Item name={['rss_rule', 'size']} label="做种体积（GB）">
                <NumberRange />
            </Form.Item>
            <Form.Item name={['rss_rule', 'peercount']} label="做种人数">
                <NumberRange />
            </Form.Item>
            <Form.Item name={['rss_rule', 'pubdate']} label="发布时间（小时）">
                <NumberRange />
            </Form.Item>
        </Space>

        <Divider orientation="left" orientationMargin="0">删种规则</Divider>
        <Space size="large" wrap>
            <Form.Item name={['remove_rule', 'time']} label="做种时间（小时）">
                <NumberRange />
            </Form.Item>
            <Form.Item name={['remove_rule', 'ratio']} label="分享率">
                <NumberRange />
            </Form.Item>
            <Form.Item name={['remove_rule', 'uploadsize']} label="上传量（GB）">
                <NumberRange />
            </Form.Item>
            <Form.Item name={['remove_rule', 'dltime']} label="下载耗时（小时）">
                <NumberRange />
            </Form.Item>
            <Form.Item name={['remove_rule', 'avg_upspeed']} label="平均上传速度（KB/S）">
                <NumberRange />
            </Form.Item>
            <Form.Item name={['remove_rule', 'iatime']} label="未活动时间（小时）">
                <NumberRange />
            </Form.Item>
        </Space>
        <Form.Item>
            <Button htmlType="submit" type="primary">保存</Button>
        </Form.Item>
    </Form>
}


const numberRangeType: SelectProps['options'] = [
    {
        value: "gt",
        label: ">"
    },
    {
        value: "lt",
        label: "<"
    },
    {
        value: "bw",
        label: "~"
    },
    {
        value: '',
        label: "忽略"
    }
]

type Cmp = "gt" | "lt" | "bw" | ''
const parse = (value?: string): [Cmp | null, number | null, number | null] => {
    const s = value?.split("#");
    const cmp = s?.[0];
    const values = s?.[1]?.split(",");
    if (cmp == "bw") return [cmp, values?.[0] ? Number(values[0]) : null, values?.[1] ? Number(values[1]) : null];
    else if (cmp == "gt" || cmp == "lt") return [cmp, null, values?.[0] ? Number(values[0]) : null];
    return ['', null, null]
}

const NumberRange = ({ value, onChange, addonAfter }: { value?: string, onChange?: (value: string) => void, addonAfter?: string }) => {
    const [c, p, s] = parse(value)
    const [cmp, setCmp] = useState<Cmp | null>(c)
    const [prefix, setPrefix] = useState<number | null>(p);
    const [suffix, setSuffix] = useState<number | null>(s);
    useEffect(() => {
        const [c, p, s] = parse(value)
        setCmp(c);
        setPrefix(p);
        setSuffix(s);
    }, [value])
    useEffect(() => {
        const rangeStart = cmp == "bw" ? `${prefix ?? ''},` : ''
        onChange?.(`${cmp}#${rangeStart}${suffix ?? ''}`)
    }, [onChange, cmp, prefix, suffix])
    return <><Space.Compact>
        {cmp == "bw" ? <InputNumber value={prefix} onChange={(v) => setPrefix(v)} /> : null}
        <Select style={{ width: 70 }} options={numberRangeType} value={cmp} onChange={(v) => setCmp(v)} />
        <InputNumber disabled={cmp == ''} value={suffix} onChange={(v) => setSuffix(v)} addonAfter={addonAfter} />
    </Space.Compact>
    </>
};

function TaskTorrentsList({ id }: { id: BrushTaskProfile['id'] }) {
    return <Collapse size="small" ghost
        items={[{
            label: "下载预览",
            children: <TaskTorrentsTable id={id} />,
            forceRender: false,
        }]}
    />
}

function TaskTorrentsTable({ id }: { id: BrushTaskProfile['id'] }) {
    const { useList } = useResource<BrushTaskTorrentType>(BrushTaskTorrents, { initialOptions: { id } });
    const { list, loading } = useList();
    useEffect(() => { console.log(list) }, [list])
    return <Table
        rowKey="enclosure"
        loading={loading}
        size="small"
        dataSource={list}
        columns={columns}
    />
}

const columns: ColumnsType<BrushTaskTorrent> = [
    {
        title: "标题",
        dataIndex: "torrent_name",
        render: (value, record) => {
            return record.torrent_name ? <Link href={record.enclosure} target="_blank" >{value}</Link> : value
        }
    },
    {
        title: "体积",
        dataIndex: "size",
        render: (value) => {
            const [num, unit] = bytes_to_human(value);
            return `${num} ${unit}`
        }
    },
    {
        title: "更新时间",
        dataIndex: "last_update_date"
    },
    {
        title: "状态",
        dataIndex: "torrent_hash",
        render: (value: string) => {
            return value == "0" ? <Tag color="yellow">已删除</Tag>:<Tag color="green">正常</Tag>
        }
    },
]