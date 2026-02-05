import { API } from "@/app/utils/api/api";
// import { Message, NastoolMessage } from "@/app/utils/api/message";
import { Avatar, Button, Card, ConfigProvider, Divider, Flex, Form, Input, List, Space, Switch } from "antd";
import { UserOutlined } from "@ant-design/icons"
import React, { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "marked-react";
import { useForm } from "antd/es/form/Form";
import { ServerMessage, Message } from "@/app/utils/api/message/ServerMessage";
import { ServerConfig } from "@/app/utils/api/serverConfig";
import { useAPIContext, useEventDataPatch } from "@/app/utils/api/api_base";
import { ServerEventMsg, useServerEvent, useServerMessage, useSocketio } from "@/app/utils/api/message/ServerEvent";

import "./override.css";

const MessageCard = React.memo(({ msg, isLasted }: { msg: Message, isLasted: boolean, }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
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
        <Divider style={{ margin: "0" }} />

    </Card>
})

function MessageList({ msgs }: { msgs: Message[] }) {
    const lastAnchorRef = useRef<HTMLDivElement>(null);
    const lastMsg = msgs[msgs.length - 1];

    useEffect(() => {
        if (lastAnchorRef.current) {
            lastAnchorRef.current.scrollIntoView({ behavior: 'instant' });
            console.debug("scroll to bottom", msgs.length);
            // lastAnchorRef.current.scrollTop = 0;
        }
    }, [lastMsg]);
    return <div className="message-chat-history" >

        {msgs.map((msg, index) => (<div key={`${index}-${msg.timestamp}`}>
            <MessageCard msg={msg} isLasted={index == msgs.length - 1} />
        </div>))
        }
        <div ref={lastAnchorRef} style={{ display: "block", height: "10px", width: "10px" }}></div>
    </div>
}

const MessageInputForm = React.memo(() => {
    const [form] = useForm();
    const socketio = useSocketio('/message')
    const { emit } = useServerMessage<Message>(socketio, 'message')
    const onSendText = useCallback((value: { text: string }) => {
        if (socketio) {
            emit({ text: value.text })
            form.resetFields(["text"])
        }
    }, [emit, form, socketio])

    return <Form form={form} layout="inline" initialValues={{ text: "" }} onFinish={onSendText}>
        <Space.Compact style={{ width: "100%" }}>
            <Form.Item noStyle name="text">
                <Input></Input>
            </Form.Item>
            <Form.Item noStyle>
                <Button htmlType="submit" type="primary">发送</Button>
            </Form.Item>
        </Space.Compact>
    </Form>
})


export default function MessagePanel() {

    const [list, setList] = useState<Message[]>([]);

    useEventDataPatch(setList, "message_event", { sync: true });

    return <div className="message-panel-container">
        <MessageList msgs={list} />
        <div style={{ flexShrink: 0 }}>
            <MessageInputForm />
        </div>
    </div>
}