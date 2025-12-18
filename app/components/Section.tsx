"use client"
import { Button, Divider, Flex, Space, Typography, theme, } from 'antd'
import React, { createContext, useContext, CSSProperties, useRef, useMemo } from 'react'
import { RedoOutlined } from "@ant-design/icons"
import { TitleProps } from 'antd/es/typography/Title'



export interface SectionContext {
    level: number,
    contentHeight: number
}

export const SectionContext = createContext<SectionContext>({ level: 0, contentHeight: -1 })


const SectionAction = React.memo((props: { extra?: React.ReactNode, onRefresh?: () => void }) => {
    const { extra, onRefresh } = props;
    const showRefresh = useMemo(() => onRefresh != undefined, [onRefresh]);
    const displayRefresh = useMemo(() => ({display: showRefresh ? "inline-flex" : "none"}), [showRefresh]);
    return <Space>
            <Space.Compact style={displayRefresh}>
                <Button type="primary" onClick={onRefresh} icon={<RedoOutlined />} />
            </Space.Compact>
        {extra}
    </Space>
})

const SectionTitle = React.memo((props: { title: React.ReactNode, level: number }) => {
    const { title, level } = props;
    const titleStyle = useMemo<CSSProperties>(() => ({ fontSize: `${1.9 - level * 0.25}em` }), [level]);
    return <>{
        level == 1 ? <Typography.Title style={titleStyle} level={level}>{title}</Typography.Title>
            :
            <Divider style={{ margin: 0, fontSize: `${1.9 - level * 0.25}em` }} styles={{ content: { margin: '10rpx' } }} orientation="horizontal" titlePlacement="start">{title}</Divider>
    }
    </>
})

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
    const titleLevel = useMemo(() => {
        const levelIndex = Math.min(sectionContext.level, sectionLevels.length - 1)
        return sectionLevels[levelIndex] as number;
    }, [sectionContext.level])
    const outRef = useRef<HTMLDivElement>(null)
    const headRef = useRef<HTMLDivElement>(null)
    const { token } = theme.useToken()
    const contentHeight = useMemo(() => window.innerHeight + (headRef.current?.scrollHeight ?? 0) - 8, [token.Layout?.headerHeight])

    const sectionWrapperStyle: CSSProperties = useMemo(() => ({
        width: "100%",
        maxHeight: titleLevel == 1 ? "100%" : undefined,
        marginBottom: 0,
        ...style
    }), [titleLevel, style])

    const sectionTiyleWrapperStyle: CSSProperties = useMemo(() => ({
        marginBottom: 4,
        width: "100%",
        height: token.Layout?.headerHeight
    }), [token.Layout?.headerHeight])


    return (
        <Flex ref={outRef} style={sectionWrapperStyle} vertical gap={4}>
            <Flex ref={headRef} style={sectionTiyleWrapperStyle} align="end" justify="space-between">
                <SectionTitle title={title} level={titleLevel} />
                <div>
                    <SectionAction extra={extra} onRefresh={onRefresh} />
                </div>
            </Flex>
            <SectionContext.Provider value={{
                level: sectionContext.level + 1,
                contentHeight: contentHeight
            }}>
                {children}
            </SectionContext.Provider>
        </Flex>
    )
}
