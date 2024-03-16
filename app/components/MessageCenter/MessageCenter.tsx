import { API } from "@/app/utils/api/api";
// import { Message, NastoolMessage } from "@/app/utils/api/message";
import { Avatar, Button, Card, ConfigProvider, Divider, Flex, Form, Input, List, Space, Switch } from "antd";
import { UserOutlined } from "@ant-design/icons"
import React, { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "marked-react";
import { useForm } from "antd/es/form/Form";
import { ServerMessage, Message } from "@/app/utils/api/message/ServerMessage";
import { ServerConfig } from "@/app/utils/api/serverConfig";
import { useAPIContext } from "@/app/utils/api/api_base";
import { useServerEvent, useSocketio } from "@/app/utils/api/message/ServerEvent";

export default function MessagePanel() {
    const socketio = useSocketio('/message')
    const { msg, msgs, emit } = useServerEvent<Message>(socketio, 'message')
    const [form] = useForm();
    useEffect(() => {
        emit(null, 'pull_messages');
    }, [emit])

    const onSendText = useCallback((value: { text: string }) => {
        if (socketio) {
            emit({ text: value.text })
            form.resetFields(["text"])
        }
    }, [emit, form, socketio])
    const MessageCard = ({ msg, isLasted }: { msg: Message, isLasted: boolean, }) => {
        const messagesEndRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (messagesEndRef.current && isLasted) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }, [isLasted])
        return <Card
            ref={messagesEndRef}
            bordered={false} styles={{ body: { paddingBottom: 0, padding: "24px 16px 8px 16px", borderRadius: "none" } }}
        >
            <Card.Meta
                style={{ width: "100%", overflowX: "auto" }}
                avatar={<Avatar icon={<UserOutlined />} />}
                title={<>{msg.title || "系统"}</>}
                description={
                    <Markdown value={msg.content.replaceAll("<br>", "\n")} />
                }
            />

        </Card>
    }
    return <Flex vertical gap={24} style={{ height: "100%" }}>
        <ConfigProvider theme={{
            token: {
                borderRadiusLG: 0,
                boxShadowTertiary: "none"
            }
        }}>
            <Space style={{ height: "100%", overflowY: "auto" }} direction="vertical" size={0} >
                {
                    msgs.map((msg, index) => (<div key={`${index}-${msg.timestamp}`}>
                        {index > 0 ? <Divider style={{ margin: 0 }} /> : <></>}
                        <MessageCard msg={msg} isLasted={index == msgs.length - 1} />

                    </div>))
                }
            </Space>
        </ConfigProvider>
        <Form form={form} layout="inline" initialValues={{ text: "" }} onFinish={onSendText}>
            <Space.Compact style={{ width: "100%" }} >
                <Form.Item noStyle name="text">
                    <Input></Input>
                </Form.Item>
                <Form.Item noStyle>
                    <Button htmlType="submit" type="primary">发送</Button>
                </Form.Item>
            </Space.Compact>
        </Form>
    </Flex>
}