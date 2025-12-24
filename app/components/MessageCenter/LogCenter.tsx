import { API } from "@/app/utils/api/api";
// import { Message, NastoolMessage } from "@/app/utils/api/message";
import { Avatar, Button, Card, ConfigProvider, Divider, Flex, FloatButton, Form, Input, List, Space, Switch, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons"
import React, { useEffect, useRef, useState } from "react";
import Markdown from "marked-react";
import { useForm } from "antd/es/form/Form";
import { ServerLog, Log } from "@/app/utils/api/message/ServerLog";
import { ServerConfig } from "@/app/utils/api/serverConfig";
import { StateMap, StateTag } from "../StateTag";
import VirtualList, { ListRef } from "rc-virtual-list"
import _ from "lodash";
import { useAPIContext } from "@/app/utils/api/api_base";
import { useServerMessage, useSocketio } from "@/app/utils/api/message/ServerEvent";

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
            <List>
                <VirtualList
                    ref={list}
                    data={msgs}
                    height={listHeight}
                    itemHeight={20}
                    itemKey="timestamp"
                >
                    {(msg, index) => {
                        return <List.Item key={msg.time} style={{ padding: "12px 4px 12px 4px" }}>
                            <MessageCard msg={msg} />
                        </List.Item>
                    }}
                </VirtualList>
            </List>
        </ConfigProvider>
    </div>
}