"use client"
import { CardIcon } from "@/app/components/CardIcon";
import { CardsForm, Cards, TestButton } from "@/app/components/CardsForm";
import { MediaServer, MediaServerConfig, MediaServerResource } from "@/app/utils/api/mediaserver";
import { Button, Form, Input, Space } from "antd";
import React, { useMemo } from "react";

const BASE_PATH = process.env.BASE_PATH

export interface MediaServerProps {
    cover: React.ReactNode,
    title: string,
    configForm: () => React.JSX.Element,
}

const mediaserverConfigs: Record<MediaServerConfig['options']['type'], MediaServerProps> = {
    "jellyfin": {
        cover: <CardIcon src={`${BASE_PATH}/static/img/mediaserver/jellyfin.png`} name={"jellyfin"} />,
        title: "Jellyfin",
        configForm: JellyfinConfig
    },
    "emby": {
        cover: <CardIcon src={`${BASE_PATH}/static/img/mediaserver/emby.png`} name={"emby"} />,
        title: "Emby",
        configForm: JellyfinConfig
    },
    "plex": {
        cover: <CardIcon src={`${BASE_PATH}/static/img/mediaserver/plex.png`} name={"plex"} />,
        title: "Plex",
        configForm: PlexConfig
    },
}

export default function MediaServerPage() {
    return <CardsForm<MediaServerResource>
        resource={MediaServer}
        title={"媒体服务器"}
        formComponent={MediaServerForm}
    >
        <Cards
            cardProps={(record: MediaServerConfig) => {
                const config = mediaserverConfigs[record.options.type];
                return ({
                    title: config.title,
                    cover: config.cover,
                    description: <></>
                })
            }} />
    </CardsForm>
}

function MediaServerForm({ record, onChange }: { record?: MediaServerConfig, onChange?: (value: MediaServerConfig) => void }) {
    const [form] = Form.useForm();
    const clientType = record?.options.type;

    const EmptyForm = () => <>表单未加载</>;
    const ConfigForm = useMemo(() => {
        if (clientType) {
            const selectedForm = mediaserverConfigs[clientType];
            return selectedForm ? selectedForm.configForm : EmptyForm
        } else return EmptyForm

    }, [clientType])
    return <>
        <Form form={form}
            initialValues={record}
            layout="vertical"
            onFinish={(value: MediaServerConfig) => {
                onChange?.({ ...record, ...value, options: { ...record?.options, ...value.options } })
            }}
        >
            <Form.Item name="host" label="服务器地址">
                <Input />
            </Form.Item>
            <Form.Item name="playhost" label="播放地址">
                <Input />
            </Form.Item>
            <ConfigForm />
            <Space>
                <Form.Item noStyle>
                    <Button htmlType="submit" type='primary'>保存</Button>
                </Form.Item>
                <TestButton record={() => form.getFieldsValue()} />
            </Space>
        </Form >
    </>
}

function JellyfinConfig() {
    return <>
        <Form.Item label="API Key" name={["options", "api_key"]}>
            <Input />
        </Form.Item>
    </>
}

function PlexConfig() {
    return <>
        <Form.Item label="服务器名" name={["options", "servername"]}>
            <Input />
        </Form.Item>
        <Form.Item label="用户名" name={["options", "username"]}>
            <Input />
        </Form.Item>
        <Form.Item label="密码" name={["options", "password"]}>
            <Input />
        </Form.Item>
        <Form.Item label="Token" name={["options", "token"]}>
            <Input />
        </Form.Item>
    </>
}