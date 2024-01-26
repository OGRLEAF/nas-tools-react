"use client"

import { Section } from "@/app/components/Section";
import { Button, Card, Checkbox, Space, Descriptions, Tag, theme, Drawer, Form, Input, Row, Col, Switch, Select, Radio } from "antd";
import { useEffect, useMemo, useState } from "react";
import { PlusOutlined, PlayCircleOutlined, StopOutlined, DeleteOutlined } from "@ant-design/icons"
import { IconDatabase, IconEdit } from "@/app/components/icons";
import { Rss, RssParserConfig, RssTaskConfig, RssUse } from "@/app/utils/api/subscription/rss";
import _ from "lodash";
import { DownloadSettingSelect, FilterRuleSelect, IndexerSelect, PixSelect, ResTypeSelect, SiteSelect } from "@/app/components/NTSelects";
import { useForm } from "antd/es/form/Form";
import { UnionPathsSelect } from "@/app/components/LibraryPathSelector";
import Link from "next/link";

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

const defaultConfig: RssTaskConfig = {
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

const CustomRssForm = ({ config, parsers }: { config: RssTaskConfig, parsers: RssParserConfig[] }) => {
    const parserOptions = parsers.map((parser) => ({
        label: parser.name,
        value: String(parser.id)
    }))
    const [form] = useForm();
    const rssUseType: RssUse = Form.useWatch("uses", form)
    const onFinish = (values: any) => {
        console.log(values)
        new Rss().update({
            ...values,
            id: config.id
        })
    }
    return <Form form={form} onFinish={onFinish} initialValues={config} layout="vertical">
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
                    // <Form.Item name={[field.name, "url"]}>
                    //     <Input />
                    // </Form.Item>
                    <Row gutter={6} >
                        <Col span={18}>
                            <Form.Item name={[field.name, "url"]} required >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={5}>
                            <Form.Item name={[field.name, "parser"]} required>
                                <Select options={parserOptions} />
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
            rssUseType == RssUse.DOWNLOAD ?
                <CustomRssDownloadForm />
                :
                <CustomRssSubscribeForm />
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

const CustomRssCard = ({ config, parsers }: { config: RssTaskConfig, parsers: RssParserConfig[] }) => {
    const { token } = theme.useToken();
    const [openEdit, setOpenEdit] = useState(false);
    const handleOpenEdit = () => {
        setOpenEdit(true)
    }
    return <Card
        hoverable
        headStyle={{ padding: 16 }}
        bodyStyle={{ padding: 16 }}
        title={
            <Space style={{ paddingLeft: 6 }} size="large">
                <Checkbox value={config.id}></Checkbox>
                <Space size="small">
                    <Tag color="pink" bordered={false}>{config.uses_text}</Tag>
                    <span>{config.name}</span>
                </Space>
            </Space>

        }
        extra={<Button type="text" onClick={handleOpenEdit} icon={<IconEdit style={{ color: token.colorTextDescription }} />}></Button>}
    >

        <Drawer open={openEdit} size="large" onClose={() => setOpenEdit(false)}>
            <CustomRssForm config={config} parsers={parsers} />
        </Drawer>
        <Descriptions size="small" column={5}>
            <Descriptions.Item label="刷新周期">{config.interval}分</Descriptions.Item>
            <Descriptions.Item label="动作">{config.uses_text}</Descriptions.Item>
            <Descriptions.Item label="包含">{config.include}</Descriptions.Item>
            <Descriptions.Item label="排除">{config.exclude}</Descriptions.Item>
            <Descriptions.Item label="状态">{config.state ? "正在运行" : "停止"}</Descriptions.Item>
            <Descriptions.Item label="已处理">{config.counter}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{config.update_time}</Descriptions.Item>
        </Descriptions>
    </Card>
}


export default function SubscribeMoviePage() {
    return <SubscribeMovie />
}

export function SubscribeMovie() {
    const [tasks, setTasks] = useState<RssTaskConfig[]>([]);
    const [parsers, setParsers] = useState<RssParserConfig[]>([]);

    const taskCards = useMemo(() => {
        return Object.entries(tasks).map(([key, config]) => <CustomRssCard key={key} config={config} parsers={parsers} />)
    }, [tasks])

    useEffect(() => { update() }, [])
    const update = async () => {
        const { tasks, parsers } = await new Rss().list();
        setTasks(tasks);
        setParsers(parsers)
    }

    const [openCreate, setOpenCreate] = useState(false)
    return <><Section title="自定义订阅"
        onRefresh={update}
        extra={
            <Space>
                <Button icon={<PlusOutlined />} onClick={() => setOpenCreate(true)} type="primary">添加订阅</Button>
                <Button icon={<PlayCircleOutlined />} >启用</Button>
                <Button icon={<StopOutlined />} >停用</Button>
                <Link href="/subscribe/custom/parser">
                    <Button icon={<IconDatabase />} >RSS解析器</Button>
                </Link>
            </Space>
        }>
        <Checkbox.Group onChange={(value) => { console.log(value) }} style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: "100%" }}>
                {taskCards}
            </Space>
        </Checkbox.Group>
        <Drawer size="large" open={openCreate} onClose={() => setOpenCreate(false)}>
            <CustomRssForm parsers={parsers} config={defaultConfig} />
        </Drawer>
    </Section>
    </>
}