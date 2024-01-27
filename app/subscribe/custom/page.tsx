"use client"

import { Button, Space, Descriptions, Tag, Form, Input, Row, Col, Switch, Select, Radio, Checkbox, Divider, Collapse, Table, Flex, Dropdown } from "antd";
import { useState } from "react";
import { PlusOutlined, DeleteOutlined, DownOutlined, CheckOutlined, CloseOutlined, VerticalAlignBottomOutlined } from "@ant-design/icons"
import { Rss, RssParsers, RssPreview, RssPreviewItem, RssResource, RssTaskConfig, RssUse } from "@/app/utils/api/subscription/rss";
import _ from "lodash";
import { DownloadSettingSelect, FilterRuleSelect, IndexerSelect, PixSelect, ResTypeSelect, SiteSelect } from "@/app/components/NTSelects";
import { useForm } from "antd/es/form/Form";
import { UnionPathsSelect } from "@/app/components/LibraryPathSelector";
import { Cards, CardsForm } from "@/app/components/CardsForm";
import { IconDownloader, IconPause, IconPlay, IconRefresh } from "@/app/components/icons";
import RssParserPage from "./parser/page";
import { RssConfig } from "@/app/utils/api/subscription/subscribe";
import { ColumnProps, ColumnsType } from "antd/lib/table";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";


export default function SubscribeMoviePage() {
    const [selected, setSelected] = useState<RssTaskConfig[]>([]);
    return <>
        <CardsForm<RssResource>
            title="自定义订阅"
            resource={Rss}
            formComponent={CustomRssForm}
            extra={(resource) => {
                const { list, refresh } = resource.useList()
                return [
                    <Divider key="divider" type="vertical" />,
                    <Button key="select_all">
                        <Checkbox
                            indeterminate={selected.length > 0 && (selected.length < (list?.length ?? 0))}
                            checked={selected.length == list?.length}
                            onClick={() => {
                                if (selected.length == 0 && list != undefined) { setSelected([...list]) }
                                else setSelected([])
                            }}
                        >
                            全选 {selected.length}/{list?.length}
                        </Checkbox>
                    </Button>,
                    <Button key="enable_btn" icon={<IconPlay />}
                        onClick={async () => {
                            await resource.updateMany?.(selected.map(v => ({ ...v, state: true })));
                        }}>开启</Button>,
                    <Button key="disable_btn" icon={<IconPause />}
                        onClick={async () => {
                            await resource.updateMany?.(selected.map(v => ({ ...v, state: false })));
                            refresh()
                        }}>停止</Button>
                ]
            }}
        >
            <Cards<RssResource>
                cardSelection={{
                    key: "id",
                    selected: selected.map(v => v.id),
                    onChange: (selectedKeys, selected) => { setSelected(selected) }
                }}
                spaceProps={{ direction: "vertical" }}
                cardProps={(record) => ({
                    title: <Space size="small" align="center">
                        <Tag color="pink" bordered={false}>{record.uses_text}</Tag>
                        <span>{record.name}</span>
                    </Space>,
                    description: <CustomRssCard config={record} />
                })}
            />
        </CardsForm>
        <RssParserPage />
    </>
}

const CustomRssDownloadForm = () => {
    return <>

        <Row gutter={16}>
            <Col span={11}>
                <Form.Item label="过滤规则" name="filter">
                    <FilterRuleSelect />
                </Form.Item>
            </Col>
            <Col span={11}>
                <Form.Item label="下载设置" name="download_setting">
                    <DownloadSettingSelect />
                </Form.Item>
            </Col>
            <Col span={2}>
                <Form.Item label="识别" name="recognization" valuePropName="checked" >
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
        <Row>
            <Col span={24}>
                <Form.Item label="保存路径" name="save_path">
                    <UnionPathsSelect />
                </Form.Item>
            </Col>
        </Row>
    </>
}

const CustomRssSubscribeForm = () => {
    return <>
        <Row gutter={16}>
            <Col span={6}>
                <Form.Item label="质量" name={["filter_args", "restype"]}>
                    <ResTypeSelect />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="分辨率" name={["filter_args", "pix"]}>
                    <PixSelect />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="制作组" name={["filter_args", "team"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="过滤规则" name="filter">
                    <FilterRuleSelect />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={8}>
                <Form.Item label="下载设置" name="download_setting">
                    <DownloadSettingSelect />
                </Form.Item>
            </Col>
            <Col span={14}>
                <Form.Item label="保存路径" name="save_path">
                    <UnionPathsSelect />
                </Form.Item>
            </Col>
            <Col span={2}>
                <Form.Item label="洗版" name="over_edition" valuePropName="checked" >
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
        <Row>
            <Col span={24}>
                <Form.Item label="订阅站点" name={["sites", "rss"]}>
                    <SiteSelect />
                </Form.Item>
            </Col>
        </Row>
        <Row>
            <Col span={24}>
                <Form.Item label="索引站点" name={["sites", "search"]}>
                    <IndexerSelect />
                </Form.Item>
            </Col>
        </Row>
    </>
}

const defaultConfig = {
    name: "",
    rss: [],
    proxy: false,
    interval: "",
    uses: RssUse.DOWNLOAD,
    uses_text: "",
    include: "",
    exclude: "",
    state: false,
    sites: {
        rss: [],
        search: []
    },
    update_time: "",
    counter: 0,
    filter: ""
}

const CustomRssForm = ({ record, onChange }:
    { record?: RssTaskConfig, onChange?: (record: RssTaskConfig) => void }) => {
    const [form] = useForm();
    const rssUseType: RssUse = Form.useWatch("uses", form)
    const onFinish = (values: any) => {
        onChange?.({
            ...values,
            id: record?.id
        })
    }
    return <Form form={form} onFinish={onFinish} initialValues={record} layout="vertical">
        <Row gutter={16}>
            <Col span={18}>
                <Form.Item label="名称" name="name">
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="刷新间隔" name="interval" >
                    <Input />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={6}>
                <Form.Item label="启用" name="state" valuePropName="checked" >
                    <Switch />
                </Form.Item>
            </Col>
            <Col span={18}>
                <Form.Item label="使用代理服务器" name="proxy" valuePropName="checked" >
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
        <Form.List name={["rss"]}>
            {(fields, { add, remove }) => <>
                {fields.map((field) => (
                    <Row gutter={6} key={field.key} >
                        <Col span={18}>
                            <Form.Item name={[field.name, "url"]} required >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={5}>
                            <Form.Item name={[field.name, "parser"]} required>
                                <RssParserSelect />
                            </Form.Item>
                        </Col>
                        <Col span={1}>
                            <Form.Item>
                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                            </Form.Item>
                        </Col>
                    </Row>))}
                <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加</Button>
                </Form.Item>
            </>
            }
        </Form.List>
        <br />
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item label="包含" name="include">
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item label="排除" name="exclude">
                    <Input />
                </Form.Item>
            </Col>
        </Row>
        <Form.Item name="uses" label="动作">
            <Radio.Group>
                <Radio.Button value={RssUse.DOWNLOAD}>下载</Radio.Button>
                <Radio.Button value={RssUse.SUBSCRIBE}>订阅</Radio.Button>
            </Radio.Group>
        </Form.Item>
        {
            rssUseType == RssUse.DOWNLOAD ? <CustomRssDownloadForm /> : <CustomRssSubscribeForm />
        }
        <Row gutter={16}>
            <Col span={24}>
                <Form.Item style={{ float: "right" }}>
                    <Button type="primary" htmlType="submit">保存</Button>
                </Form.Item>
            </Col>
        </Row>
    </Form >
}

const CustomRssCard = ({ config, }: { config: RssTaskConfig }) => {
    return <>
        <Descriptions size="small" column={5}>
            <Descriptions.Item label="刷新周期">{config.interval}分</Descriptions.Item>
            <Descriptions.Item label="动作">{config.uses_text}</Descriptions.Item>
            <Descriptions.Item label="包含">{config.include}</Descriptions.Item>
            <Descriptions.Item label="排除">{config.exclude}</Descriptions.Item>
            <Descriptions.Item label="状态">{config.state ? "正在运行" : "停止"}</Descriptions.Item>
            <Descriptions.Item label="已处理">{config.counter}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{config.update_time}</Descriptions.Item>
        </Descriptions>
        <div onClick={(evt) => evt.stopPropagation()}>
            <RssPreviewList id={config.id} />
        </div>
    </>
}


function RssParserSelect({ value, onChange }: { value?: string, onChange?: (value: string) => void }) {
    const { useList } = new RssParsers().useResource();
    const { list, } = useList();
    const parserOptions = list?.map((parser) => ({
        label: parser.name,
        value: String(parser.id)
    }))

    return <Select value={value} onChange={onChange} options={parserOptions} />
}

function RssPreviewList({ id }: { id: RssTaskConfig['id'] }) {
    const { useList, messageContext, message, updateMany } = new RssPreview().useResource({ initialOptions: { id } })
    const { list, loading, refresh } = useList();
    const [selected, setSelected] = useState<RssPreviewItem[]>([])

    const download = async (records: RssPreviewItem[]) => {
        downloadMessage.loading();
        try {
            await new RssPreview().download(id, records)
            downloadMessage.success();
        } catch (e) {
            downloadMessage.error(String(e));
        }
    }

    const downloadMessage = message.bundle('提交下载任务', 0)
    const columns: ColumnsType<RssPreviewItem> = [
        {
            title: "标题",
            dataIndex: "title"
        },
        {
            title: "体积",
            dataIndex: "size"
        },
        {
            title: "状态",
            dataIndex: "finish_flag",
            render: (value: boolean) => {
                return value ? <Tag color="green">已处理</Tag> : <Tag color="blue">未处理</Tag>
            }
        },
        {
            title: "下载",
            render: (record: RssPreviewItem) => {
                return <Button type="link" size="small" icon={<IconDownloader />}
                    onClick={async () => { download([record]) }}
                />
            }
        }
    ]

    const batchActions = [
        {
            key: '1',
            label: <a onClick={(evt) => {
                evt.stopPropagation();
                updateMany?.(selected, { flag: true, id })
            }}>已处理</a>,
            icon: <CheckOutlined />
        },
        {
            key: '2',
            label: <a onClick={(evt) => {
                evt.stopPropagation();
                updateMany?.(selected, { flag: false, id })
            }}>未处理</a>,
            icon: <CloseOutlined />,
        },
        {
            key: '3',
            label: <a onClick={(evt) => {
                evt.stopPropagation();
                download(selected)
            }}>下载</a>,
            icon: <VerticalAlignBottomOutlined />
        },
    ]

    const table = <>{messageContext}<Table
        rowSelection={{
            type: "checkbox",
            onChange: (keys, rows) => {
                setSelected(rows)
            }
        }}
        rowKey="enclosure"
        loading={loading}
        size="small"
        dataSource={list}
        columns={columns}
        pagination={false}
        footer={() => {
            return <Dropdown disabled={selected.length == 0} menu={{ items: batchActions }}>
                <a onClick={(e) => e.preventDefault()}>
                    <Space>批量操作<DownOutlined /></Space>
                </a>
            </Dropdown>
        }}
    /></>
    return <Collapse size="small" ghost
        items={[{
            label: "下载预览",
            children: table,
            extra: <Button icon={<IconRefresh />}
                onClick={(evt) => {
                    evt.stopPropagation();
                    refresh()
                }}
                type="link" size="small" />
        }]}
    />
}