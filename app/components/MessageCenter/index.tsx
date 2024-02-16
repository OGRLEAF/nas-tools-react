import { Badge, Button, Drawer, Tabs, TabsProps, theme } from "antd";
import React, { useState } from "react";
import LogPanel from "./LogCenter";
import MessagePanel from "./MessageCenter";
import { ControlOutlined, UserOutlined } from "@ant-design/icons"
import StickyBox from 'react-sticky-box';

export default function MessageCenter() {
    // return <MessagePanel />
    const {
        token: { colorBgContainer },
    } = theme.useToken();
    return <Tabs
        // renderTabBar={renderTabBar}
        style={{ height: "100%", overflowY: "auto", position: "relative" }}

        defaultActiveKey="2"
        items={[
            {
                key: "1",
                label: "日志",
                style: { height: "100%" },
                children: <LogPanel />
            },
            {
                key: "2",
                label: "消息中心",
                style: { height: "100%", overflowY: "auto", position: "relative" },
                children: <MessagePanel />
            }
        ]}
    // onChange={onChange}
    />


}

import "./override.css"
export function MessageCenterEntry() {
    const [open, setOpen] = useState(false)
    return <>
        <Button type="default"
            style={{ margin: "0 15px" }}
            shape="circle"
            icon={
                <Badge count={0} size="small">
                    <UserOutlined />
                </Badge>
            }
            onClick={() => setOpen(true)}
        >

        </Button>
        <Drawer
            className="message-entry"
            open={open} size="large" onClose={() => setOpen(false)} styles={{ body: { padding: "0 15px 15px 15px" } }}>
            <MessageCenter />
        </Drawer >
    </>
} 