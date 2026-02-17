import { io, Socket } from "socket.io-client"
import { ServerEvent } from "./ServerEvent"
import { API } from "../api"

enum MessageType {
    TEXT = "text",
    LAYER = "layer",
}

interface MessageMeta {
    level: string,
    title: string,
    timestamp: number,
}

export type ChatMessage = MessageMeta &
({ content: string[][], typ: MessageType.LAYER } |
{ content: string, typ: MessageType.TEXT });

export interface Message {
    level: string,
    title: string,
    content: string | string[][],
    timestamp: number,
    time: number,
    index: number,
    typ: MessageType
}

export interface MessageGroup<MsgType> {
    lst_time: string,
    messages: MsgType[]
}

export class ServerMessage {
    private serverEvent: ServerEvent
    private msgs: Message[] = []
    public onMessage: (msgs: Message[]) => void = () => { };
    constructor(serverEvent: ServerEvent) {
        this.serverEvent = serverEvent;
        this.connect();
    }

    public connect() {
        // client-side
        this.serverEvent.listen<MessageGroup<Message>>("message", (data) => {
            this.handle_message(data)
        })
    }

    private handle_message(messageRaw: MessageGroup<Message>) {
        const lastMsg = this.msgs[this.msgs.length - 1];
        const lastTime = lastMsg ? lastMsg.index : -1;
        if (messageRaw.messages.length) {
            const newItems = messageRaw.messages
                .filter((msg) => {
                    const msgTime = msg.index
                    return (msgTime > lastTime)
                })

            if (newItems.length) {
                newItems.forEach((msg) => {
                    const msgTime = msg.index
                    this.msgs.push({
                        ...msg,
                        timestamp: msgTime,
                        typ: MessageType.TEXT
                    })

                })
                if (this.onMessage) this.onMessage([...this.msgs])
            }
            //

        }
    }

    public async refresh() {
        this.serverEvent.emit("refresh")
    }

    public sendText(text: string) {
        this.serverEvent.emit("message", {
            text: text
        })

    }
}