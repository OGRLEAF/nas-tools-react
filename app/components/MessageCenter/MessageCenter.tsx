import { API } from "@/app/utils/api/api";
// import { Message, NastoolMessage } from "@/app/utils/api/message";
import { Avatar, Button, Card, ConfigProvider, Divider, Flex, Form, Input, List, Space, Switch } from "antd";
import { UserOutlined } from "@ant-design/icons"
import React, { useEffect, useRef, useState } from "react";
import Markdown from "marked-react";
import { useForm } from "antd/es/form/Form";
import { MessageCenter,Message } from "@/app/utils/api/message/socketioMessage";
import { ServerConfig } from "@/app/utils/api/serverConfig";

export default function MessagePanel() {
    const [msgs, setMsgs] = useState<Message[]>([]);
    const [msgApi, setMsgApi] = useState<MessageCenter>();
    const [autoRefresh, setAutoRefresh] = useState(false);

    const onMessage = (msgs: Message[]) => {
        setMsgs(msgs);
        console.log("onMessage", msgApi)
    }
    const connectMessage = async () => {
        const nt = await API.getNastoolInstance()
        if (nt.apiToken) {
            const socket = new MessageCenter(nt.apiToken);
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

    useEffect(()=>{
        setAutoRefresh(false)
    }, [])


    const onRefresh = () => {
        if (msgApi) {
            msgApi.refresh();
        }
    }
    const [form] = useForm();
    const onSendText = (value: { text: string }) => {
        // console.log(value.text)
        if (msgApi) {
            msgApi.sendText(value.text)
            form.resetFields(["text"])
        }
    }

    const MessageCard = ({ msg, isLasted }: { msg: Message, isLasted: boolean, }) => {
        const messagesEndRef = useRef<HTMLDivElement>(null);
        if (isLasted)
            useEffect(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
            })
        return <Card
            ref={messagesEndRef}
            bordered={false} bodyStyle={{ paddingBottom: 0, padding: 24, borderRadius: "none" }} >
            <Card.Meta
                style={{ width: "100%", overflowX: "auto" }}
                avatar={<Avatar icon={<UserOutlined />} />}
                title={<>{msg.title || "系统"}</>}
                description={<Markdown value={msg.content.replaceAll("<br>", "\n")} ></Markdown>}
            />
        </Card>
    }
    // return <div style={{ height: "100%", display: "flex", flexFlow: "column" }}>
    return <Flex vertical gap={24} style={{ height: "100%" }}>
        <Space>
            <Switch onChange={(value) => setAutoRefresh(value)} checked={autoRefresh} />
            <Button onClick={onRefresh}>刷新</Button>
        </Space>
        <ConfigProvider theme={{
            token: {
                borderRadiusLG: 0,
                boxShadowTertiary: "none"
            }
        }}>
            <Space style={{ height: "100%", overflowY: "auto" }} direction="vertical" size={0} >
                {msgs.length}
                {
                    msgs.map((msg, index) => (<div key={`${index}-${msg.timestamp}`}>
                        {index > 0 ? <Divider style={{ margin: 0 }} /> : <></>}
                        <MessageCard msg={msg} isLasted={index == msgs.length - 1} />

                    </div>))
                }
            </Space>
        </ConfigProvider>
        <Form form={form} layout="inline" initialValues={{ text: "" }} onFinish={onSendText}>
            <Space.Compact style={{ width: "100%" }} >
                <Form.Item noStyle name="text">
                    <Input></Input>
                </Form.Item>
                <Form.Item noStyle>
                    <Button htmlType="submit" type="primary">发送</Button>
                </Form.Item>
            </Space.Compact>
        </Form>
    </Flex>
}