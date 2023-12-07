import { io, Socket } from "socket.io-client"

enum MessageType {
    SEND = 0,
    RECV = 1
}

export interface Message {
    level: string,
    title: string,
    content: string,
    // time: number,
    index: number,
    timestamp: number,
    type: MessageType
}

export interface MessageGroup<MsgType> {
    lst_time: string,
    messages: MsgType[]
}

export class MessageCenter {
    private sock: Socket
    private msgs: Message[] = []
    public onMessage: (msgs: Message[]) => void = () => { };
    constructor(token: string) {
        this.sock = io("wss://nastool-dev.service.home/test", {
            extraHeaders: {
                Authorization: token
            }
        })
        this.connect();
    }

    public connect() {
        // client-side
        this.sock.on("connect", () => {
            console.log("connected", this.sock.id); // x8WIv7-mJelg7on_ALbx
        });

        this.sock.on("message", (data) => {
            this.handle_message(data)
        })

        this.sock.on("log", (data) => {
            console.log(data)
        })
    }

    private handle_message(messageRaw: MessageGroup<Message>) {
        console.log(messageRaw)
        const lastMsg = this.msgs[this.msgs.length - 1];
        const lastTime = lastMsg ? lastMsg.index : 0;
        if (messageRaw.messages.length) {
            const newItems = messageRaw.messages
                .filter((msg) => {
                    const msgTime = msg.index
                    console.log(msgTime, lastTime)
                    return (msgTime > lastTime)
                })

            if (newItems.length) {
                newItems.forEach((msg) => {
                    const msgTime = msg.index
                    this.msgs.push({
                        ...msg,
                        timestamp: msgTime,
                        type: MessageType.RECV
                    })

                })
                if (this.onMessage) this.onMessage([...this.msgs])
            }
            //

        }
    }

    public async refresh() {
        this.sock.emit("refresh")
    }

    public sendText(text: string) {
        this.sock.emit("message", {
            text: text
        })
        // this.msgs.push({
        //     level: "",
        //     content: text,
        //     title: "用户",
        //     type: MessageType.SEND,
        //     timestamp: new Date().getTime()
        // })
        // if (this.onMessage) this.onMessage([...this.msgs])
    }
}