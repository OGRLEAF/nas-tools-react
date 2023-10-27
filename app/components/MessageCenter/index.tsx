import { Tabs } from "antd";
import React from "react";
import Message from "./MessageCenter";

export default function MessageCenter() {
    return <Message />
    // return <Tabs
    //     style={{ height: "100%" }}
    //     defaultActiveKey="1"
    //     items={[
    //         {
    //             key: "1",
    //             label: "日志",
    //             style: { height: "100%" },
    //             children: 
    //         }
    //     ]}
    // // onChange={onChange}
    // />
}