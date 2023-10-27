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

interface MessageRaw {
    level: string,
    title: string,
    content: string,
    time: string
}

export interface MessageGroup<MsgType> {
    lst_time: string,
    message: MsgType[]
}

export class NastoolMessage {
    ws: WebSocket;
    private msgs: Message[] = []
    public onMessage: (msgs: Message[]) => void = () => { };
    private openAwait?: Promise<void>
    constructor(wsUrl: string, options: any | undefined = undefined) {
        this.ws = new WebSocket(wsUrl)

    }

    public configConnect() {
        this.ws.binaryType = 'blob'
        this.openAwait = new Promise((resolve, reject) => {
            this.ws.onopen = (event) => {
                console.log('on open', event)
                resolve();
                this.refresh();
                // this.ws.send(JSON.stringify({ lst_time: "" }))
            }
        });

        this.ws.onmessage = ((event: MessageEvent<string>) => {
            const message = JSON.parse(event.data);
            // console.log('on message', event)
            if (message.message) {
                this.handle_message(message);
            }

        })

        this.ws.onerror = (event) => {
            console.log('on error', event)
        }
    }

    private handle_message(messageRaw: MessageGroup<MessageRaw>) {
        const lastMsg = this.msgs[this.msgs.length - 1];
        const lastTime = lastMsg ? lastMsg.time : 0;
        if (messageRaw.message.length) {
            const newItems = messageRaw.message
                .filter((msg) => {
                    const msgTime = new Date(msg.time).getTime()
                    if (msgTime > lastTime) {
                        return true;
                    }
                    return false;
                })

            if (newItems.length) {
                newItems.forEach((msg) => {
                    const msgTime = new Date(msg.time).getTime()
                    this.msgs.push({
                        ...msg,
                        time: msgTime,
                        type: MessageType.RECV
                    })

                })
                if (this.onMessage) this.onMessage([...this.msgs])
            }
            //
        }
    }

    public checkConnection() {
        if (this.ws.readyState >= this.ws.CLOSING) {
            console.log("closed")
            this.ws.close();
            this.ws = new WebSocket(this.ws.url);
            this.configConnect();
        }
    }

    public async refresh(flush = false) {
        console.log("Perform Refresh", flush)
        this.checkConnection();
        await this.openAwait;
        if (flush)
            this.ws.send(JSON.stringify({ lst_time: "" }))
        else {
            const lastMsg = this.msgs[this.msgs.length - 1];
            if (lastMsg) {
                const now: Date = new Date(lastMsg.time)
                const year: number = now.getFullYear();
                const month: number = now.getMonth() + 1;
                const day: number = now.getDate();
                const hour: number = now.getHours();
                const minute: number = now.getMinutes();
                const second: number = now.getSeconds();
                const formattedTime: string = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
                this.ws.send(JSON.stringify({ lst_time: formattedTime }))
            } else {
                this.ws.send(JSON.stringify({ lst_time: "" }))
            }
        }
    }

    public sendText(text: string) {
        this.ws.send(JSON.stringify({
            text: text
        }))
        this.msgs.push({
            level: "",
            content: text,
            title: "用户",
            type: MessageType.SEND,
            time: new Date().getTime()
        })
        if (this.onMessage) this.onMessage([...this.msgs])
    }

}