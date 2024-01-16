"use client"
import CardnForm from "@/app/components/CardnForm";
import { ListItemCardList } from "@/app/components/CardnForm/ListItemCard";
import { CardsForm, CardProps, Cards, TestButton } from "@/app/components/CardsForm";
import { NastoolServerConfig } from "@/app/utils/api/api";
import { APIArrayResourceBase } from "@/app/utils/api/api_base";
import { MediaServer, MediaServerConfig, MediaServerResource } from "@/app/utils/api/mediaserver";
import { Button, Divider, Form, Input, Space, Tag } from "antd";
import React, { useMemo } from "react";

export interface MediaServerProps {
    cover: React.ReactNode,
    title: string,
    icon: React.ReactNode,
    configForm: () => React.JSX.Element,
}

const mediaserverConfigs: Record<MediaServerConfig['options']['type'], MediaServerProps> = {
    "jellyfin": {
        cover: <div style={{ height: 100, borderRadius: "8px 8px 0px 0px", width: "100%", backgroundColor: "#3872C2" }}>
            <img style={{ height: 80, borderRadius: 40, margin: "10px 0 0 10px", objectFit: "contain" }} src={`/static/img/mediaserver/jellyfin.jpg`} />
        </div>,
        title: "Jellyfin",
        icon: <img style={{ height: 15, width: 15, objectFit: "contain" }} src={`/static/img/mediaserver/jellyfin.png`} />,
        configForm: JellyfinConfig
    },
    "emby": {
        cover: <div style={{ height: 100, borderRadius: "8px 8px 0px 0px", width: "100%", backgroundColor: "#3872C2" }}>
            <img style={{ height: 80, borderRadius: 40, margin: "10px 0 0 10px", objectFit: "contain" }} src={`/static/img/mediaserver/emby.png`} />
        </div>,
        title: "Emby",
        icon: <img style={{ height: 15, width: 15, objectFit: "contain" }} src={`/static/img/mediaserver/emby.png`} />,
        configForm: JellyfinConfig
    },
    "plex": {
        cover: <div style={{ height: 100, borderRadius: "8px 8px 0px 0px", width: "100%", backgroundColor: "#3872C2" }}>
            <img style={{ height: 80, borderRadius: 40, margin: "10px 0 0 10px", objectFit: "contain" }} src={`/static/img/mediaserver/plex.png`} />
        </div>,
        title: "Plex",
        icon: <img style={{ height: 15, width: 15, objectFit: "contain" }} src={`/static/img/mediaserver/plex.png`} />,
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
    const ConfigForm = useMemo(() => {
        if (clientType) {
            const selectedForm = mediaserverConfigs[clientType];
            return selectedForm ? selectedForm.configForm : () => <>表单未加载</>
        } else return () => <>表单未加载</>

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