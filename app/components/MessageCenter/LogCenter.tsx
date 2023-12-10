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
import _ from "lodash";

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


export default function LogPanel() {
    const [msgs, setMsgs] = useState<Log[]>([]);
    const [msgApi, setMsgApi] = useState<ServerLog>();
    const [autoRefresh, setAutoRefresh] = useState(false);

    const onMessage = (msgs: Log[]) => {
        setMsgs(msgs);
    }
    const connectMessage = async () => {
        const nt = await API.getNastoolInstance()
        const serverEvent = await nt.getServerEvent()
        if (serverEvent) {
            const socket = new ServerLog(serverEvent);
            setMsgApi(socket)
        }

    }
    useEffect(() => {
        connectMessage();
    }, [])

    useEffect(() => {
        if (msgApi) {
            msgApi.onMessage = onMessage;
            msgApi.refresh();
        }
    }, [msgApi])

    useEffect(() => {
        if (autoRefresh) {
            const timer = setInterval(() => {
                if (msgApi) {
                    msgApi.refresh();
                }
            }, 5000)
            return () => {
                console.log("Timer cleared")
                clearInterval(timer);
            }
        }
    }, [autoRefresh, msgApi])

    useEffect(() => {
        setAutoRefresh(false)
    }, [])


    const [form] = useForm();

    const MessageCard = ({ msg, isLasted }: { msg: Log, isLasted: boolean, }) => {
        const messagesEndRef = useRef<HTMLDivElement>(null);
        if (isLasted)
            useEffect(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
            })
        return <Card
            size="small"
            ref={messagesEndRef}
            bordered={false} bodyStyle={{ paddingBottom: 0, padding: 12, borderRadius: "none" }} >
            <div style={{ wordBreak: "break-word" }}>
                <Tag color="cyan">{msg.time}</Tag>
                <StateTag stateMap={LogLevelStateTag} value={msg.level} >{msg.source}</StateTag>
                <p style={{ margin: 0, padding: "8px 0 0 0"}}>{_.unescape(msg.text)}</p>
            </div>
        </Card>
    }
    const LogContent = useRef<HTMLDivElement>(null);
    return <Flex vertical gap={24} style={{ height: "100%" }}>
        <ConfigProvider theme={{
            token: {
                borderRadiusLG: 0,
                boxShadowTertiary: "none"
            }
        }}>
            <Space ref={LogContent} style={{ height: "100%", overflowY: "auto" }} direction="vertical" size={0} >
                {
                    msgs.map((msg, index) => (<div key={`${index}-${msg.timestamp}`}>
                        {index > 0 ? <Divider style={{ margin: 0 }} /> : <></>}
                        <MessageCard msg={msg} isLasted={index == msgs.length - 1} />

                    </div>))
                }
                {/* <FloatButton /> */}
            </Space>
        </ConfigProvider>
    </Flex>
}