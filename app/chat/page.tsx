"use client"

import { useState } from "react";
import MessagePanel, { MessageInputForm, MessageList } from "../components/MessageCenter/MessageCenter";
import { Section } from "../components/Section";
import { useEventDataPatch } from "../utils/api/api_base";
import { ChatMessage, useSessionList } from "../utils/api/message/ServerMessage";
import { theme } from "antd";

import "../components/MessageCenter/override.css"

export default function ChatPage() {
    const [sessionId, setSessionId] = useState<number>(-1);
    const { token } = theme.useToken();
    return <Section title="Console Space">
        <MessageList sessionId={sessionId} />
        <div className="message-chat-inner" style={{ bottom: 10, position: "sticky", }}>
            <div style={{
                padding: "10px",
                backgroundColor: "white",
                borderRadius: token.borderRadius,
                borderStyle: "solid",
                borderWidth: token.lineWidth,
                borderColor: token.colorBorder,
            }} className="message-chat-inner">
                <MessageInputForm onSessionChange={setSessionId} />
            </div>
        </div>
    </Section>
}