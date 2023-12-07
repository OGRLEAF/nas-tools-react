import { io, Socket } from "socket.io-client"

enum MessageType {
    SEND = 0,
    RECV = 1
}

export interface Message {
    level: string,
    title: string,
    content: string,
    time: number,
    type: MessageType
}

export interface MessageGroup<MsgType> {
    lst_time: string,
    messages: MsgType[]
}

export class ServerEvent {
    private sock: Socket
    private msgs: Message[] = []
    public onMessage: (msgs: Message[]) => void = () => { };
    constructor(token: string) {
        this.sock = io("wss://nastool-dev.service.home/test", {
            extraHeaders: {
                Authorization: token
            }
        })
    }

    public listen<T>(event: string, callback: (data: T) => void) {
        this.sock.on(event, () => {
            console.log("connected " + event, this.sock.id); // x8WIv7-mJelg7on_ALbx
        });
        this.sock.on(event, callback);
    }
}

