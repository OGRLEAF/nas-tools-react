import { Space } from 'antd'
import React from 'react'
export const Section = ({ children, title, extra }: {
    children?: React.ReactNode,
    title: React.ReactNode,
    extra?: React.ReactNode
}) => {
    return (
        <Space style={{ width: "100%", height: "100%" }} direction='vertical'>
            <Space style={{margin: "8px 0"}}>
                <span style={{ fontSize: "1.4em", margin: 0, padding: "16px 0 16px 0", fontWeight: "bold" }}>{title}</span>
                {extra ? extra : <></>}
            </Space>
            {children}
        </Space>
    )
}