import { io, Socket } from "socket.io-client"
import { ServerEvent } from "./ServerEvent"
import { API } from "../api"

enum MessageType {
    SEND = 0,
    RECV = 1
}

export interface Log {
    level: "INFO" | "DEBUG" | "WARN" | "ERROR",
    source: string,
    text: string
    time: string
    timestamp: number
}

export class ServerLog {
    private serverEvent: ServerEvent
    private logs: Log[] = []
    public onMessage: (msgs: Log[]) => void = () => { };
    constructor(serverEvent: ServerEvent) {
        this.serverEvent = serverEvent;
        this.connect();
    }

    public connect() {
        // client-side
        this.serverEvent.listen<{ logs: Log[] }>("log", (data) => {
            this.handle_message(data.logs)
        })
    }

    private handle_message(messageRaw: Log[]) {

        this.logs.push(...messageRaw)
        if (this.onMessage) this.onMessage([...this.logs])

    }

    public async refresh() {
        this.serverEvent.emit("refresh-log", {
            "size": 20
        })
    }

}