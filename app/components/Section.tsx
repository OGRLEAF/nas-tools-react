import { Space } from 'antd'
import React from 'react'
export const Section = ({ children, title, extra }: {
    children?: React.ReactNode,
    title: React.ReactNode,
    extra?: React.ReactNode
}) => {
    return (
        <Space style={{ width: "100%", height: "100%" }} direction='vertical'>
            <div style={{ margin: "8px 0", width: "100%" }}>
                <span style={{ fontSize: "1.4em", margin: 0, padding: "16px 0 16px 0", fontWeight: "bold" }}>{title}
                
                </span>
                <div style={{ float: "right" }}>{extra ? extra : <></>}</div>
            </div>
            {children}
        </Space>
    )
}