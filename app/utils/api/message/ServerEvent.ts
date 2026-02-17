import { io, Socket } from "socket.io-client"
import { useAPIContext } from "../api_base"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Message } from "./ServerMessage"


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
            console.log("connecting socketio", namespace);
            setSockio(socket);
            return () => {
                console.debug("closing socketio", namespace);
                socket.close();
                setSockio(undefined);
            }
        }
    }, [API, namespace])


    return sockio;
}


export function useServerMessage<DataType extends Message>(sockio: Socket | undefined, eventName: string) {
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

export function useServerStreamMessage(messageKey: number) {
    const { API } = useAPIContext();
    const [message, setMessage] = useState<Message>();

    const updateMessage = useCallback(async () => {
        const reader = await API.requestStream(`llm_chat/chat/0/stream/${messageKey}`,
            "get", { auth: true }
        )
        let { value, done } = await reader.read();
        console.log(value)
        setMessage(JSON.parse(value));

        while (!done) {
            ({ value, done } = await reader.read());
            if (value) {
                setMessage(prev => {
                    if (prev)
                        return { ...prev, content: prev?.content + value };
                });
            }
        }
    }, [API, setMessage])
    useEffect(() => {
        updateMessage();
    }, []);
    return message
}

export interface ServerEventMsg<Payload = any> {
    keys: (string | number)[],
    data: Payload,
    timestamp: number,
    type: string
}


export function useServerEvent2<DataType extends ServerEventMsg>(eventName: string) {
    const sockio = useSocketio('/server_event')
    const [msgs, setMsgs] = useState<DataType[]>([]);
    const msg = useMemo(() => msgs[msgs.length - 1], [msgs])
    const eventCallback = useCallback((data: DataType) => {
        console.debug('received event', data)
        // setMsgs((msgs) => [...msgs, data])
    }, [setMsgs])

    useEffect(() => {
        if (sockio) {
            console.debug('register socketio', `event.${eventName}`)

            sockio.on(`event.${eventName}`, eventCallback);

            return () => {
                setMsgs([]);
                sockio.removeListener(eventName, eventCallback)
            }
        }
    }, [eventName, sockio, eventCallback])

    const emit = useCallback((data: any, emitEventName?: string) => {
        console.debug('emit socketio', sockio, emitEventName ?? eventName, data)
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

export function useServerEvent<DataType extends ServerEventMsg>(eventName: string) {
    const sockio = useSocketio('/server_event');
    const [msgs, setMsgs] = useState<DataType[]>([]);
    // const [msg, setMsg] = useState<DataType | undefined>(undefined);
    const msg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
    const bufferRef = useRef<DataType[]>([]);

    useEffect(() => {
        if (!sockio) return;

        // 统一提取完整的事件名，防止手误
        const fullEventName = `event.${eventName}`;
        const handleData = (data: DataType) => {
            bufferRef.current.push(data);
        };
        console.debug('register socketio', fullEventName);
        sockio.on(fullEventName, handleData);

        const flushInterval = setInterval(() => {
            if (bufferRef.current.length > 0) {
                // 拷贝当前缓冲区数据
                const newMessages = [...bufferRef.current];
                // 清空缓冲区
                bufferRef.current = [];

                // 批量更新 State
                setMsgs((prev) => {
                    // 性能保护：如果数据量太大（如超过5000条），切掉旧的，防止内存溢出和渲染卡顿
                    const nextState = [...prev, ...newMessages];
                    if (nextState.length > 2000) {
                        return nextState.slice(nextState.length - 2000);
                    }
                    return nextState;
                });
            }
        }, 100);
        return () => {
            console.debug('remove socketio', fullEventName);
            sockio.off(fullEventName, handleData);
            clearInterval(flushInterval);
        };
    }, [eventName, sockio]);

    const emit = useCallback((data: any, emitEventName?: string) => {
        if (sockio) {
            sockio.emit(emitEventName ?? eventName, data);
        }
    }, [eventName, sockio]);

    return {
        msg,
        msgs,
        emit
    };
}