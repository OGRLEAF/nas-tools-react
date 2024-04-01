import { io, Socket } from "socket.io-client"
import { useAPIContext } from "../api_base"
import { useCallback, useEffect, useMemo, useState } from "react"

enum MessageType {
    SEND = 0,
    RECV = 1
}

export interface Message {
}

export interface MessageGroup<MsgType> {
    lst_time: string,
    messages: MsgType[]
}

export class ServerEvent {
    private sock: Socket
    private msgs: Message[] = []
    public onMessage: (msgs: Message[]) => void = () => { };
    constructor(token: string, namespace: string = "/test") {
        this.sock = io(namespace, {
            // path: "/ui/proxy/socket.io/",
            extraHeaders: {
                Authorization: token
            }
        })
        this.sock.on("connect", () => {
            console.log("connected", this.sock.id);
        });
    }

    public listen<T>(event: string, callback: (data: T) => void) {
        this.sock.on(event, callback);
    }

    public emit(event: string, data?: any) {
        if (data == undefined) this.sock.emit(event)
        else this.sock.emit(event, data)
    }
}



export class ServerSocket {
    constructor() {

    }
}


export function useSocketio(namespace = "/test") {
    const { API } = useAPIContext()
    const [sockio, setSockio] = useState<Socket>();
    useEffect(() => {
        if (API.apiToken) {
            const socket = io(namespace, {
                extraHeaders: {
                    Authorization: API.apiToken
                }
            })
            setSockio(socket);
            return () => {
                socket.close();
                setSockio(undefined);
            }
        }
    }, [API, namespace])


    return sockio;
}


export function useServerEvent<DataType extends Message>(sockio: Socket | undefined, eventName: string) {
    const [msgs, setMsgs] = useState<DataType[]>([]);
    const msg = useMemo(() => msgs[0], [msgs])
    useEffect(() => {
        if (sockio) {
            const eventCallback = (data: DataType) => {
                setMsgs((msgs) => [...msgs, data])
            }
            sockio.on(eventName, eventCallback);
            return () => {
                setMsgs([]);
                sockio.removeListener(eventName, eventCallback)
            }
        }
    }, [eventName, sockio])

    const emit = useCallback((data: any, emitEventName?: string) => {
        if (sockio) {
            sockio.emit(emitEventName ?? eventName, data)
        }
    }, [eventName, sockio]);

    return {
        msg,
        msgs,
        emit
    }
}