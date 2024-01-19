"use client"
import { Button, Divider, Dropdown, Flex, InputNumber, Space, Typography, } from 'antd'
import React, { useEffect, useState, createContext, useContext, CSSProperties, useRef, useMemo } from 'react'
import { RedoOutlined } from "@ant-design/icons"
import { TitleProps } from 'antd/es/typography/Title'



export interface SectionContext {
    level: number,
    contentHeight: number
}

export const SectionContext = createContext<SectionContext>({ level: 0, contentHeight: -1 })

const sectionLevels: TitleProps['level'][] = [1, 2, 3, 4, 5]
export const Section = ({ children, title, extra, onRefresh, interval: _interval, style }: {
    children?: React.ReactNode,
    title: React.ReactNode,
    onRefresh?: () => void,
    interval?: number,
    extra?: React.ReactNode,
    style?: CSSProperties
}) => {

    const sectionContext = useContext(SectionContext);
    const titleLevel: TitleProps['level'] = sectionLevels[sectionContext.level] ?? 5
    const outRef = useRef<HTMLDivElement>(null)
    const headRef = useRef<HTMLDivElement>(null)
    return (
        <Space ref={outRef} style={{ width: "100%", maxHeight: titleLevel == 1 ? "100%" : undefined, marginBottom: 12, ...style }} direction='vertical'>
            <Flex ref={headRef} style={{ marginBottom: 4, width: "100%" }} align="end" justify="space-between">
                {/* <span style={{ fontSize: "1.4em", margin: 0, padding: "16px 0 16px 0", fontWeight: "bold" }}>{title}</span> */}
                {titleLevel == 1 ? <Typography.Title style={{ fontSize: `${1.9 - titleLevel * 0.25}em` }} level={titleLevel}>{title}</Typography.Title>
                    :
                    <Divider style={{ margin: 0, fontSize: `${1.9 - titleLevel * 0.25}em` }} orientation="left" orientationMargin={0}>{title}</Divider>
                }
                <div>
                    <Space>

                        {onRefresh ? <Space.Compact>
                            <Button type="primary" onClick={() => onRefresh?.()} icon={<RedoOutlined />} />
                        </Space.Compact>
                            : <></>}
                        {extra ? extra : <></>}
                    </Space>
                </div>
            </Flex>
            <SectionContext.Provider value={{
                level: sectionContext.level + 1,
                contentHeight: (outRef.current?.scrollHeight ?? -1) - (headRef.current?.scrollHeight ?? -1) - 16
            }}>
                {children}
            </SectionContext.Provider>
        </Space >
    )
}