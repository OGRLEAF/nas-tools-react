import { useEffect } from "react";
import { APIArrayResourceBase, ResourceType } from "../api_base";
import React from "react";

export enum MessageType {
    TEXT = "text",
    LAYER = "layer",
    LLMThinking = "llm_thinking",
}

interface MessageMeta {
    // level: string,
    title: string,
    timestamp: number,
    content: any,
    extra?: Record<string, any>,
}

export interface MessageSection {
    name: string,
    chunks: string[]
}

export interface LayerChatMessage extends MessageMeta {
    type: MessageType.LAYER,
    content: {
        sections: MessageSection[]
    },

}

export interface TextChatMessage extends MessageMeta {
    type: MessageType.TEXT,
    content: string
}

export type ChatMessage = LayerChatMessage | TextChatMessage


export type Message = MessageMeta & { content: string };

export interface MessageGroup<MsgType> {
    lst_time: string,
    messages: MsgType[]
}


interface MessageSession {
    session_id: number,
    create_time: Date,
    update_time: Date,
    title: string
}

export interface MessageSessionResource extends ResourceType{
    ItemType: ChatMessage
}


export class MessageSessionResource extends APIArrayResourceBase<MessageSessionResource> {
    public async list() {
        const sessions = await this.API.get<{ list: MessageSession[], total: number }>("messages/sessions", { auth: true });
        return sessions.list
    }
}

export function useSessionList() {
    const [sessionResource, setSessionResource] = React.useState<MessageSessionResource | null>(null);
    const [sessions, setSessions] = React.useState<Record<number, MessageSession>>({});
    useEffect(() => {
    
        setSessionResource(new MessageSessionResource());
    }, [setSessionResource])

    useEffect(()=> {
        if (sessionResource) {
            sessionResource.list().then((sessions) => {
                setSessions(Object.fromEntries(sessions.map((s) => [s.session_id, s])));
            });
        }
    }, [sessionResource])
    return sessions;
}