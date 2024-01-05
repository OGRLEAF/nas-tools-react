import { Button, Dropdown, InputNumber, Space, Typography, } from 'antd'
import React, { useEffect, useState, createContext, useContext } from 'react'
import { RedoOutlined } from "@ant-design/icons"
import { TitleProps } from 'antd/es/typography/Title'



interface SectionContext {
    level: number
}

const SectionContext = createContext<SectionContext>({ level: 0 })

const sectionLevels: TitleProps['level'][] = [1, 2, 3, 4, 5]
export const Section = ({ children, title, extra, onRefresh, interval: _interval }: {
    children?: React.ReactNode,
    title: React.ReactNode,
    onRefresh?: () => void,
    interval?: number,
    extra?: React.ReactNode
}) => {
    const [refreshInterval, setRefreshInterval] = useState(_interval || 0);
    useEffect(() => {
        if (refreshInterval > 0) {
            const timer = setInterval(() => {
                if (onRefresh) {
                    onRefresh();
                }
            }, refreshInterval)
            return () => {
                console.log("refreshInterval Timer cleared")
                clearInterval(timer);
            }
        }
    }, [refreshInterval])


    const sectionContext = useContext(SectionContext);
    const titleLevel: TitleProps['level'] = sectionLevels[sectionContext.level] ?? 5
    return (
        <Space style={{ width: "100%", height: "100%" }} direction='vertical'>
            <div style={{ margin: "8px 0", width: "100%" }}>
                {/* <span style={{ fontSize: "1.4em", margin: 0, padding: "16px 0 16px 0", fontWeight: "bold" }}>{title}</span> */}
                <Typography.Title style={{ fontSize: `${1.9 - titleLevel * 0.25}em` }} level={titleLevel}>{title}</Typography.Title>
                <div style={{ float: "right" }}>
                    <Space>

                        {onRefresh ? <Space.Compact>
                            <Button type="primary" onClick={() => onRefresh?.()} icon={<RedoOutlined />} />
                            {refreshInterval > 0 ? <Dropdown placement="bottomRight" menu={{
                                items: [{
                                    label: <Space><span>刷新间隔</span><InputNumber value={refreshInterval} addonAfter={"s"} /></Space>,
                                    key: 0
                                }]
                            }}
                            >
                                <Button icon={<span>{refreshInterval}s</span>}></Button>
                            </Dropdown> : <></>
                            }
                        </Space.Compact>
                            : <></>}
                        {extra ? extra : <></>}
                    </Space>
                </div>
            </div>
            <SectionContext.Provider value={{
                level: sectionContext.level + 1
            }}>
                {children}
            </SectionContext.Provider>
        </Space >
    )
}