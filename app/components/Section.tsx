import { Button, Space } from 'antd'
import React from 'react'
import { RedoOutlined } from "@ant-design/icons"

export const Section = ({ children, title, extra, onRefresh }: {
    children?: React.ReactNode,
    title: React.ReactNode,
    onRefresh?: () => void,
    extra?: React.ReactNode
}) => {
    return (
        <Space style={{ width: "100%", height: "100%" }} direction='vertical'>
            <div style={{ margin: "8px 0", width: "100%" }}>
                <span style={{ fontSize: "1.4em", margin: 0, padding: "16px 0 16px 0", fontWeight: "bold" }}>{title}</span>
                <div style={{ float: "right" }}>
                    <Space>
                        {onRefresh ? <Button type="primary" onClick={() => onRefresh()} icon={<RedoOutlined />} /> : <></>}
                        {extra ? extra : <></>}
                    </Space>
                </div>
            </div>
            {children}
        </Space>
    )
}