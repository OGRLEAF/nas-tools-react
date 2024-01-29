"use client"
import CardnForm, { CardProps, CardnFormContext } from "@/app/components/CardnForm";
import { NotifiClientConfig, Notification, NotificationResource } from "@/app/utils/api/notification";
import { Button, Checkbox, CheckboxOptionType, Col, Form, Input, Radio, Row, Space, Switch, Tag, notification, theme } from "antd";
import { RetweetOutlined, WechatOutlined, SlackOutlined } from "@ant-design/icons"
import React, { useContext, useMemo } from "react";
import { TagCheckboxGroup } from "@/app/components/TagCheckbox";
import { ListItemCardList } from "@/app/components/CardnForm/ListItemCard";
import { Cards, CardsForm } from "@/app/components/CardsForm";
import { CardIcon } from "@/app/components/CardIcon";

const BASE_PATH = process.env.BASE_PATH

export interface NotifiClientProps {
    cover: React.ReactNode,
    title: string,
    icon: React.ReactNode,
    configForm: () => React.JSX.Element,
}

const notifyClientConfigs: Record<NotifiClientConfig['type'], NotifiClientProps> = {
    "wechat": {
        cover: <CardIcon src={`${BASE_PATH}/static/img/message/wechat.png`} name={"wechat"} />,
        title: "微信",
        icon: <WechatOutlined />,
        configForm: WechatForm
    },
    "slack": {
        cover: <CardIcon src={`${BASE_PATH}/static/img/message/slack.png`} name={"slack"} />,
        title: "Slack",
        icon: <SlackOutlined />,
        configForm: () => <></>
    }
}


export default function NotificationPage() {
    const { token } = theme.useToken();
    return <CardsForm<NotificationResource>
        title="消息通知"
        resource={Notification}
        formComponent={NotifiClientConfigForm}
    >
        <Cards<NotificationResource>
            cardProps={(record: NotifiClientConfig) => {
                const config = notifyClientConfigs[record.type];
                return ({
                    title: record.name,
                    cover: config.cover,
                    description: <>
                        {
                            record.enabled ? <Tag color={token.colorSuccess}>启用</Tag> :
                                <Tag color={token.colorInfo}>停用</Tag>
                        }
                        {
                            record.interactive ? <Tag color={token.colorSuccess}>交互</Tag> :
                                <Tag color={token.colorInfo}>消息</Tag>
                        } </>,
                    extra: (resource) => <Button icon={<RetweetOutlined />} type="text"
                        onClick={(evt) => { evt.stopPropagation(); resource.val?.(record); }}
                    />
                })
            }}
        ></Cards>
    </CardsForm>
    // return <CardnForm<NotifiClientConfig>
    //     title="消息通知"
    //     onFetch={() => new Notification().list()}
    //     onDelete={async (record) => {
    //         const result = new Notification().delete(record.id);
    //         console.log(result)
    //         return true;
    //     }}
    //     extraActions={[{
    //         icon: <RetweetOutlined />,
    //         key: "test",
    //         async onClick(record) {
    //             await new Notification().test(record.type, record.config);
    //         }
    //     }]}
    //     formRender={NotifiClientConfigForm}
    // >
    //     <ListItemCardList cardProps={(record: NotifiClientConfig) => {
    //         const config = notifyClientConfigs[record.type];
    //         return ({
    //             title: record.name,
    //             cover: config.cover,
    //             description: <>
    //                 {
    //                     record.enabled ? <Tag color={token.colorSuccess}>启用</Tag> :
    //                         <Tag color={token.colorInfo}>停用</Tag>
    //                 }
    //                 {
    //                     record.interactive ? <Tag color={token.colorSuccess}>交互</Tag> :
    //                         <Tag color={token.colorInfo}>消息</Tag>
    //                 } </>,
    //         })
    //     }} />
    // </CardnForm>
}


const NotifiClientOptions: CheckboxOptionType[] = Object.entries(notifyClientConfigs).map(([type, config]) => ({
    label: <>{config.icon} {config.title}</>,
    value: type
}))

const NotificationSourceOptions: CheckboxOptionType[] = [
    {
        label: "下载开始",
        value: "download_start",
    },
    {
        label: "下载失败",
        value: "download_fail"
    },
    {
        label: "入库完成",
        value: "transfer_finished"
    },
    {
        label: "入库失败",
        value: "transfer_fail"
    },
    {
        label: "新增订阅",
        value: "rss_added"
    },
    {
        label: "订阅完成",
        value: "rss_finished"
    },
    {
        label: "站点签到",
        value: "site_signin"
    },
    {
        label: "站点消息",
        value: "site_message"
    },
    {
        label: "刷流下载",
        value: "brushtask_added"
    },
    {
        label: "刷流删种",
        value: "brushtask_remove"
    },
    {
        label: "自动删种",
        value: "auto_remove_torrents"
    },
    {
        label: "数据统计",
        value: "ptrefresh_date_message"
    },
    {
        label: "媒体服务",
        value: "mediaserver_message"
    },
    {
        label: "插件消息",
        value: "custom_message"
    },
]

const defaultConfig = {
    name: "",
    type: "wechat",
    switchs: [],
    interactive: false,
    enabled: false
}
const NotifiClientConfigForm = ({ record, onChange }: { record?: NotifiClientConfig, onChange?: (value: NotifiClientConfig) => void }) => {
    const initialConfig = record || defaultConfig;

    const ctx = useContext(CardnFormContext);
    const onFinish = async (value: NotifiClientConfig) => {
        onChange?.({ ...record, ...value })
        // console.log(value, initialConfig)
        // ctx.loading(String(value?.name) || "+");
        // new Notification().update({
        //     ...record,
        //     ...value,
        // })
        //     .then((res) => {
        //         ctx.success(JSON.stringify(res))
        //         ctx.refresh();
        //         ctx.exit();
        //     })
        //     .catch((e) => {
        //         ctx.error(e);
        //     })
    }

    const [form] = Form.useForm();
    const clientType = Form.useWatch<NotifiClientConfig['type']>('type', form);
    const ConfigForm = useMemo(() => {
        const selectedForm = notifyClientConfigs[clientType];
        return selectedForm ? selectedForm.configForm : () => <></>
    }, [clientType])
    return <Form
        layout="vertical"
        form={form}
        initialValues={initialConfig}
        onFinish={onFinish}
    >
        <Row gutter={16}>
            <Col span={16}>
                <Form.Item label="名称" name="name">
                    <Input />
                </Form.Item>
            </Col>
            <Col span={4}>
                <Form.Item label="启用" name="enabled" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
            <Col span={4}>
                <Form.Item label="交互" name="interactive" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
        <Form.Item label="类型" name="type">
            <Radio.Group buttonStyle="solid" options={NotifiClientOptions} optionType="button">
            </Radio.Group>
        </Form.Item>
        <ConfigForm />
        <Form.Item label="推送设置" name="switchs">
            {/* <Checkbox.Group options={NotificationSourceOptions}></Checkbox.Group > */}
            <TagCheckboxGroup options={NotificationSourceOptions} />
        </Form.Item>
        <Row gutter={16}>
            <Col span={24}>
                <Form.Item style={{ float: "right" }}>
                    <Button type="primary" htmlType="submit">保存</Button>
                </Form.Item>
            </Col>
        </Row>
    </Form>
}

function WechatForm() {
    return <>
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item label="企业ID" name={["config", "corpid"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item label="应用secret" name={["config", "corpsecret"]}>
                    <Input />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item label="应用ID" name={["config", "agentid"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item label="消息推送代理" name={["config", "default_proxy"]}>
                    <Input />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item label="Token" name={["config", "token"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item label="EncodingAESKey" name={["config", "encodingAESKey"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item label="Admin User" name={["config", "adminUser"]}>
                    <Input />
                </Form.Item>
            </Col>
        </Row >
    </>
}