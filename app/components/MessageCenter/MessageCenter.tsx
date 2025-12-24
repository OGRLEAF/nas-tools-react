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
import { useServerMessage, useSocketio } from "@/app/utils/api/message/ServerEvent";

import "./override.css";

const MessageCard = ({ msg, isLasted }: { msg: Message, isLasted: boolean, }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current && isLasted) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isLasted])
    return <Card
        ref={messagesEndRef}
        variant="borderless" styles={{ body: { paddingBottom: 0, } }}
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
export default function MessagePanel() {
    const socketio = useSocketio('/message')
    const { msg, msgs, emit } = useServerMessage<Message>(socketio, 'message')
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
    return <div className="message-panel-container">
        <div className="message-chat-history" >
            {msgs.map((msg, index) => (<div key={`${index}-${msg.timestamp}`}>
                {index > 0 ? <Divider style={{ margin: 0 }} /> : <></>}
                <MessageCard msg={msg} isLasted={index == msgs.length - 1} />

            </div>))
            }
        </div>
        <div style={{ flexShrink: 0 }}>
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
        </div>
    </div>
}