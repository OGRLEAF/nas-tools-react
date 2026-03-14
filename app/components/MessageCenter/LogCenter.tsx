// import { Message, NastoolMessage } from "@/app/utils/api/message";
import { ConfigProvider, Space, Tag } from "antd";
import { useEffect, useRef, useState } from "react";
import { Log } from "@/app/utils/api/message/ServerLog";
import { StateMap, StateTag } from "../StateTag";
import { ListRef } from "rc-virtual-list"
import _ from "lodash";
import { useServerMessage, useSocketio } from "@/app/utils/api/message/ServerEvent";
import { Virtuoso } from "react-virtuoso";

const LogLevelStateTag: StateMap<Log['level']> = {
    INFO: {
        key: "INFO",
        color: "blue",
    },
    DEBUG: {
        key: "DEBUG",
        color: "geekblue"
    },
    WARN: {
        key: "WARN",
        color: "warning"
    },
    ERROR: {
        key: "ERROR",
        color: "error"
    },
}

const MessageCard = ({ msg }: { msg: Log, }) => {
    return <div style={{ wordBreak: "break-word" }}>
        <Space>
            <Tag color="cyan">{msg.time}</Tag>
            <StateTag key={msg.source} stateMap={LogLevelStateTag} value={msg.level} >{msg.source}</StateTag>
        </Space>
        <p style={{ margin: 0, padding: "4px 0 0 0" }}>{_.unescape(msg.text)}</p>
    </div>
}

export default function LogPanel() {
    const socketio = useSocketio('/log')
    const { msg, msgs, emit } = useServerMessage<Log>(socketio, 'log')
    useEffect(() => {
        emit({ size: 20 }, 'pull_log')
    }, [emit])

    const logContent = useRef<HTMLDivElement>(null);
    const list = useRef<ListRef>(null);
    const [listHeight, setListHeight] = useState(0);

    useEffect(() => {
        list.current?.scrollTo({ index: msgs.length - 1 })
    }, [msgs.length])
    useEffect(() => {
        if (logContent.current) {
            if (logContent.current?.clientHeight > 0) {
                setListHeight(logContent.current.clientHeight)
            }
        }
    }, [])
    return <div ref={logContent} style={{ height: "100%", overflowY: "scroll" }} >

        <ConfigProvider theme={{
            token: {
                borderRadiusLG: 0,
                boxShadowTertiary: "none"
            }
        }}>
            <Virtuoso height={listHeight} data={msgs} computeItemKey={(index, msg) => {
                return msg.timestamp
            }}
                itemContent={(index, msg) => (<div 
                style={{
                    padding: "var(--ant-padding-sm) 0",
                    borderBottom: "1px solid var(--ant-color-border-secondary)"}}>
                    <MessageCard msg={msg} />
                </div>)} />

        </ConfigProvider>
    </div>
}