// import { Message, NastoolMessage } from "@/app/utils/api/message";
import { Avatar, Button, Card, Collapse, Flex, Form, Input, Select, Space, Spin, theme } from "antd";
import { LoadingOutlined, UserOutlined } from "@ant-design/icons"
import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Markdown from "marked-react";
import { useForm } from "antd/es/form/Form";
import { Message, ChatMessage, MessageType, TextChatMessage, useSessionList } from "@/app/utils/api/message/ServerMessage";
import { useEventDataPatch } from "@/app/utils/api/api_base";
import { useServerMessage, useSocketio } from "@/app/utils/api/message/ServerEvent";

import "./override.css";
import { LLMChatMessage, LLMThinkingSection, } from "@/app/utils/api/message/LLMChatMessage";
import { MessageLLMContent, ToolSelection } from "./LLMMessages"
import { values } from "lodash";

type MessageIndex = [number, number]



const MessageCard = React.memo(({ msg, isLasted }: { msg: ChatMessage, isLasted: boolean, }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    return <div>
        <Space orientation="vertical" styles={{ root: { marginTop: "20px", width: "100%" } }}>
            <Space orientation="horizontal"><Avatar icon={<UserOutlined />} /> {msg.title}</Space>
            <div className="message-chat-inner">
                {
                    msg.title == "LLM" ? <MessageLLMContent msg={msg as LLMChatMessage} /> :
                        <MessagePlainContent msg={msg} />
                }
            </div>
        </Space>
    </div>
})

const MessagePlainContent = React.memo(({ msg }: { msg: ChatMessage }) => {
    if (msg.type === "text") {
        return <Markdown value={msg.content} />
    } else {
        return <div>
            {msg.content.sections.map((item, index) => <Markdown key={index} value={item.chunks.join("")} />)}
        </div>
    }
})



export function MessageList({ sessionId }: { sessionId: number }) {
    const [msgs, setList] = useState<ChatMessage[]>([]);

    useEventDataPatch('message', setList, ['$', 'sessions', `${sessionId}`, "messages"], { sync: true });

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

function ChatSessionList({ onChange }: { onChange?: (sessionId: number) => void }) {
    const sessions = useSessionList();

    const sessionOptions = Object.values(sessions).map((session) => ({
        label: session.title,
        value: session.session_id
    }))
    return <Select style={{ width: "300px" }} placeholder="选择会话" options={sessionOptions} onChange={onChange} />
}


export const MessageInputForm = React.memo(({ onSessionChange }: { onSessionChange?: (sessionId: number) => void }) => {
    const [form] = useForm();
    const socketio = useSocketio('/message')
    const { emit } = useServerMessage<Message>(socketio, 'message')
    const onSendText = useCallback((value: { text: string, sessionId: number, tools: string[] }) => {
        if (socketio) {
            const message = {
                title: "User",
                content: value.text,
                type: MessageType.TEXT,
                timestamp: Date.now(),
                extra: {
                    session_id: value.sessionId,
                    tools: value.tools
                }
            } as TextChatMessage;
            emit(message)
            form.resetFields(["text"])
        }
        onSessionChange?.(value.sessionId)
    }, [emit, form, socketio])

    const selectedSessionId = Form.useWatch("sessionId", form);
    useEffect(() => {
        if (selectedSessionId) {
            onSessionChange?.(selectedSessionId)
        }
    }, [selectedSessionId, onSessionChange])

    return <Form form={form} layout="inline" initialValues={{ text: "", sessionId: -1 }} onFinish={onSendText}>
        <Space orientation="vertical" style={{ width: "100%" }}>
            <Flex orientation="horizontal" justify="space-between">
                <Form.Item noStyle name="sessionId">
                    <ChatSessionList />
                </Form.Item>
                <Form.Item noStyle name="tools">
                    <ToolSelection />
                </Form.Item>
            </Flex>
            <Space.Compact style={{ width: "100%" }}>
                <Form.Item noStyle name="text">
                    <Input></Input>
                </Form.Item>
                <Form.Item noStyle>
                    <Button htmlType="submit" type="primary">发送</Button>
                </Form.Item>
            </Space.Compact>
        </Space>
    </Form>
})

export default function MessagePanel() {
    const [sessionId, setSessionId] = useState<number>(-1);

    return <div className="message-panel-container">
        <MessageList sessionId={sessionId} />
        <MessageInputForm onSessionChange={setSessionId} />
    </div>
}