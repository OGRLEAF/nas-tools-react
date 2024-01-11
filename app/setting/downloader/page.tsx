"use client"
import { Cards, CardsForm, TestButton } from "@/app/components/CardsForm"
import { MediaWorkCategoryUnionSelect, SyncModeSelect } from "@/app/components/NTSelects"
import { PathSelector } from "@/app/components/PathSelector"
import { DownloadClient, DownloadClientConfig, DownloadClientType } from "@/app/utils/api/download"
import { MediaWorkCategoryType } from "@/app/utils/api/media/category"
import { MediaWorkType, SyncMode } from "@/app/utils/api/types"
import { PlusOutlined, DeleteOutlined, RetweetOutlined } from "@ant-design/icons"
import { Button, CheckboxOptionType, Col, Divider, Flex, Form, Input, InputNumber, Radio, Row, Select, Space, Switch, Tag, theme } from "antd"
import { useForm } from "antd/es/form/Form"
import React, { useMemo } from "react"

export interface DownloadClientProps {
    cover: React.ReactNode,
    title: string,
    icon: React.ReactNode,
    configForm: () => React.JSX.Element,
}

const downloadClientConfigs: Record<DownloadClientConfig['type'], DownloadClientProps> = {
    "qbittorrent": {
        cover: <div style={{ height: 100, borderRadius: "8px 8px 0px 0px", width: "100%", backgroundColor: "#3872C2" }}>
            <img style={{ height: 90, padding: "10px 0 0 10px", objectFit: "contain" }} src={`/static/img/downloader/qbittorrent.png`} />
        </div>,
        title: "Qbittorrent",
        icon: <img style={{ height: 15, width: 15, objectFit: "contain" }} src={`/static/img/downloader/qbittorrent.png`} />,
        configForm: QbittorentForm
    },
}

export default function DownloaderSetting() {
    const { token } = theme.useToken();
    return <CardsForm<DownloadClientConfig, DownloadClient>
        resource={DownloadClient}
        title={"媒体服务器"}
        formComponent={DownloadClientConfigForm}
    >
        <Cards<DownloadClientConfig, DownloadClient>
            cardProps={(record: DownloadClientConfig) => {
                const config = downloadClientConfigs[record.type];
                return ({
                    title: <span>{record.name}</span>,
                    cover: config.cover,
                    description: <>{record.enabled ? <Tag color={token.colorSuccess} bordered={false}>启用</Tag> : <Tag color={token.colorInfo}>停用</Tag>}</>,
                    extra: (resource) => {
                        return <Button icon={<RetweetOutlined />} type="text"
                            onClick={(evt) => {
                                evt.stopPropagation();
                                resource.val?.(record);
                            }}
                        />
                    }
                })
            }} />
    </CardsForm>
}

const DownloadClientOptions: CheckboxOptionType[] = Object.entries(downloadClientConfigs).map(([type, config]) => ({
    label: <Flex align="center">{config.icon}<span style={{ marginLeft: 8 }}>{config.title}</span></Flex>,
    value: type
}))

export type DownloadDirFormData = {
    save_path: string,
    category: [MediaWorkType, MediaWorkCategoryType]
    container_path: string,
    label: string
}

export type DownloadClientFormData = {
    name: string,
    type: DownloadClientType,
    enabled: boolean,
    transfer: boolean,
    only_nastool: boolean,
    match_path: boolean,
    rmt_mode: SyncMode,
    config: {
        host: string,
        port: number,
        username: string,
        password: string,
        torrent_management: "default" | "manual" | "auto",
        download_dir: DownloadDirFormData[]
    },
}


function DownloadClientConfigForm({ record, onChange }: { record?: DownloadClientConfig, onChange?: (value: DownloadClientConfig) => void }) {

    const [form] = useForm();
    const clientType = Form.useWatch<DownloadClientConfig['type']>('type', form);
    const ConfigForm = useMemo(() => {
        const selectedForm = downloadClientConfigs[clientType];
        return selectedForm ? selectedForm.configForm : () => <></>
    }, [clientType])

    const clientFormData: DownloadClientFormData = {
        name: record?.name ?? "",
        type: record?.type ?? "qbittorrent",
        enabled: record?.enabled ?? false,
        transfer: record?.transfer ?? false,
        only_nastool: record?.only_nastool ?? false,
        match_path: record?.match_path ?? false,
        rmt_mode: record?.rmt_mode ?? SyncMode.COPY,
        config: {
            host: record?.config.host ?? "",
            port: record?.config.port ?? 80,
            username: record?.config.username ?? "",
            password: record?.config.password ?? "",
            torrent_management: record?.config.torrent_management ?? "default",
            download_dir: record?.download_dir?.map(value => ({
                save_path: value.save_path,
                category: [value.type, value.category],
                container_path: value.container_path,
                label: value.label,
            })) ?? []
        },
    }
    const convertToRecord = (value: DownloadClientFormData): DownloadClientConfig => {
        const { name, type, enabled, transfer, only_nastool, match_path, rmt_mode, config } = { ...clientFormData, ...value };
        const { username, password, host, port, torrent_management } = config
        return {
            id: record?.id,
            name,
            type,
            enabled,
            transfer,
            only_nastool,
            match_path,
            rmt_mode,
            config: { username, password, host, port, torrent_management },
            download_dir: config.download_dir?.map(({ save_path, category, container_path, label }) => ({
                save_path, label, container_path,
                type: category[0],
                category: category[1]
            })) ?? []
        }
    }
    const onFinish = (value: DownloadClientFormData) => {
        onChange?.(convertToRecord(value));
    }

    const downloadDirList = (name: string) => <Form.List name={["config", name]}>
        {(fields, { add, remove }) => <>
            <Divider orientation="left" orientationMargin="0">下载目录设置</Divider>
            {
                fields.map((field) => {
                    return (<div key={field.key}>
                        <Row gutter={16}>
                            <Col span={16}>
                                <Form.Item style={{ marginBottom: 5 }} name={[field.name, "category"]} label="媒体类型"     >
                                    <MediaWorkCategoryUnionSelect />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name={[field.name, "label"]} label="分类名">
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16} >

                            <Col span={8}>
                                <Form.Item name={[field.name, "save_path"]} label="下载器内路径" >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={16}>
                                <Form.Item name={[field.name, "container_path"]} label="本地路径" >
                                    <PathSelector />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={2}>
                                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>删除</Button>
                            </Col>
                        </Row>
                        <Divider />
                    </div>)
                }
                )
            }
            <Row>
                <Button type="dashed" block icon={<PlusOutlined />}
                    onClick={() => add({ category: ["", ""], container_path: "/" })}>
                    增加
                </Button>
            </Row>
        </>}
    </Form.List>
    return <Form form={form} layout="vertical"
        onFinish={(value: any) => { onFinish(value); }}
        initialValues={clientFormData}>
        <Row gutter={16}>
            <Col span={20}>
                <Form.Item label="名称" name="name">
                    <Input />
                </Form.Item>
            </Col>
            <Col span={4}>
                <Form.Item label="启用" name="enabled" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
        <Form.Item label="类型" name="type">
            <Radio.Group buttonStyle="solid" options={DownloadClientOptions} optionType="button">
            </Radio.Group>
        </Form.Item>
        <ConfigForm />
        <Row gutter={16}>
            <Col span={8}>
                <Form.Item name="rmt_mode" label="转移方式" >
                    <SyncModeSelect />
                </Form.Item>
            </Col>
            <Col span={4}></Col>
            <Col span={4}>
                <Form.Item name="transfer" label="监控" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
            <Col span={4}>
                <Form.Item name="match_path" label="目录隔离" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
            <Col span={4}>
                <Form.Item name="only_nastool" label="标签隔离" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
        </Row>

        {downloadDirList("download_dir")}
        <br />
        <Space>
            <Form.Item noStyle>
                <Button htmlType="submit" type='primary'>保存</Button>
            </Form.Item>
            <TestButton record={() => convertToRecord(form.getFieldsValue())} />
        </Space>
    </Form>
}

function QbittorentForm() {
    return <>
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item label="地址" name={["config", "host"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item label="端口" name={["config", "port"]}>
                    <InputNumber min={0} max={65535} />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item label="用户名" name={["config", "username"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item label="密码" name={["config", "password"]}>
                    <Input.Password />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={8}>
                <Form.Item label="种子管理模式" name={["config", "torrent_management"]}>
                    <Select options={[
                        {
                            value: "default",
                            label: "默认"
                        },
                        {
                            value: "auto",
                            label: "自动"
                        },
                        {
                            value: "manual",
                            label: "手动"
                        }
                    ]} />
                </Form.Item>
            </Col>
        </Row>

    </>
}