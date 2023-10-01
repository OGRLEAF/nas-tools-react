"use client"
import { Button, Card, Space, Table } from "antd";
import React from "react";

import { PlusOutlined } from "@ant-design/icons"

const LibraryPathCard = (options: { title: string, }) => {
    const TableHeader = () => {
        return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "1.1em" }}>{options.title}</div>
            <div><Button type="primary" size="small" icon={<PlusOutlined />} /></div>
        </div>
    }
    return <Table bordered title={TableHeader}>
        123

    </Table>
}

export default () => {
    return <Space direction="vertical" style={{ width: "100%" }}>
        <LibraryPathCard title={"电影"} />
        <LibraryPathCard title={"电视剧"} />
        <LibraryPathCard title={"动漫"} />
    </Space>
}