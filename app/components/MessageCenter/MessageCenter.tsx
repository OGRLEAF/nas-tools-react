import { API } from "@/app/utils/api/api";
// import { Message, NastoolMessage } from "@/app/utils/api/message";
import { Avatar, Button, Card, Collapse, ConfigProvider, Divider, Flex, Form, Input, List, Space, Spin, Switch } from "antd";
import { LoadingOutlined, UserOutlined } from "@ant-design/icons"
import React, { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "marked-react";
import { useForm } from "antd/es/form/Form";
import { ServerMessage, Message, ChatMessage } from "@/app/utils/api/message/ServerMessage";
import { ServerConfig } from "@/app/utils/api/serverConfig";
import { useAPIContext, useEventDataPatch } from "@/app/utils/api/api_base";
import { ServerEventMsg, useServerEvent, useServerMessage, useServerStreamMessage, useSocketio } from "@/app/utils/api/message/ServerEvent";

import "./override.css";


type MessageIndex = [number, number]



const MessageCard = React.memo(({ msg, isLasted }: { msg: ChatMessage, isLasted: boolean, }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    return <div>
        <Space orientation="vertical" styles={{ root: { marginTop: "20px" } }}>
            <Space orientation="horizontal"><Avatar icon={<UserOutlined />} /> {msg.title}</Space>
            <div style={{ marginLeft: "32px" }}>{
                msg.title == "LLM" ? <MessageLLMContent msg={msg} /> :
                    <MessagePlainContent msg={msg} />
            }</div>
        </Space>
    </div>
})

const MessagePlainContent = React.memo(({ msg }: { msg: ChatMessage }) => {
    if (msg.typ === "text") {
        return <Markdown value={msg.content} />
    } else {
        return <div>
            {msg.content.map((item, index) => <Markdown key={index} value={item.slice(1).join("")} />)}
        </div>
    }
})

function LLMThinkingSection({ content, loading }: { content: string[], loading?: boolean }) {
    return <Collapse
        collapsible="header"
        defaultActiveKey={[]}
        items={[
            {
                key: '1',
                label: <Space><span>思考中...</span><Spin indicator={<LoadingOutlined spin />} spinning={loading} size="small" /></Space>,
                children: content.join("")
            },
        ]}
    />
}
const MessageLLMContent = React.memo(({ msg }: { msg: ChatMessage }) => {
    return <div>
        {(msg.typ === "layer") ? (
            msg.content.map((item, index) => {
                if (item[0] == "thinking") {
                    return <LLMThinkingSection key={index} content={item.slice(1)} loading={msg.content.length == 1} />
                } else {
                    return <Markdown key={index} value={item.slice(1).join("")} />
                }
            })
        ) : <Markdown value={msg.content as string} />}
    </div>
})


function MessageList({ msgs }: { msgs: ChatMessage[] }) {
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
        {
            msgs.map?.((msg, index) => (<div key={`${index}-${msg.timestamp}`}>
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

    const [list, setList] = useState<ChatMessage[]>([]);

    useEventDataPatch(setList, "message_event", { sync: true });

    return <div className="message-panel-container">
        <MessageList msgs={list} />
        <div style={{ flexShrink: 0 }}>
            <MessageInputForm />
        </div>
    </div>
}