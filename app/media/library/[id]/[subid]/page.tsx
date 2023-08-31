"use client"
import React, { useEffect, useState } from "react";
import { Section } from "@/app/components/Section"
import {
    API, NastoolLibrarySeries, NastoolLibrarySeriesSeason, NastoolLibrarySeriesEpisode,
    NastoolLibraryMediaSource
} from "@/app/utils/api";
import { Space, Image, Typography, Card, List, Tag, Divider, Button, Collapse, theme } from "antd";
import Icon, { ToTopOutlined, ExportOutlined } from "@ant-design/icons"
import Link from "next/link";
const { Title, Paragraph } = Typography

const SteamTag = ({
    children,
    type
}: {
    children: React.ReactNode,
    type: NastoolLibraryMediaSource["streams"][0]["type"]
}) => {
    const tagStyle = {
        "Subtitle": {
            color: "cyan"
        },
        "Audio": {
            color: "orange"
        },
        "Video": {
            color: "blue"
        }
    }[type] || {
        color: "default"
    }
    return <Tag color={tagStyle.color}>{children}</Tag>
}

const MediaEpisodeView = ({
    data
}: { data: NastoolLibrarySeriesEpisode }) => {
    const MediaSource = ({ source }: { source: NastoolLibraryMediaSource }) => {
        const VideoStream = () => { }
        return <>
            <List dataSource={source.streams.filter(item => !item.is_external)}
                header={<><span>{source.path.local.split("/").pop()}</span></>}
                // grid={{ gutter: 16 }}
                rowKey="display_name"
                renderItem={(item) => (
                    <List.Item
                        title={item.path}
                    // extra={<Button type="link"></Button>}
                    >
                        <Space>
                            <span>{item.display_name}</span>
                            <SteamTag type={item.type}>{item.type}</SteamTag>
                        </Space>
                    </List.Item>
                )}
            />
            <List dataSource={source.streams.filter(item => item.is_external)}
                // size="small"
                rowKey="display_name"
                header={
                    <Space>
                        <span>外挂文件</span>
                        <Button type="text" icon={<ToTopOutlined />} />
                    </Space>
                }
                renderItem={(item) => (
                    <List.Item
                        title={item.path}
                        extra={<Button type="link">编辑</Button>}
                    >
                        <Space>
                            {item.display_name}
                            <Tag>{item.path.split("/").pop()}</Tag>
                            <SteamTag type={item.type}>{item.type}</SteamTag>
                        </Space>
                    </List.Item>
                )}
            />
        </>
    }
    return <Space direction="vertical" style={{ width: "100%" }}>
        {
            data.source.map((src) => (
                <MediaSource key={src.path.local} source={src} />
            ))
        }
    </Space>
}

const MediaSeasonView = ({
    data: data
}: { data: NastoolLibrarySeriesSeason }) => {

    return <>
        <List
            itemLayout="vertical"
            dataSource={data.episodes}
            rowKey="episode"
            renderItem={(item) => (
                <List.Item>
                    <List.Item.Meta title={`集 ${item.episode} ` + item.title}></List.Item.Meta>
                    <MediaEpisodeView data={item} />
                </List.Item>
            )}
        />
    </>
}

export default function MediaView({
    params
}: { params: { id: string, subid: string } }) {
    const [series, setSeries] = useState<NastoolLibrarySeries>()
    useEffect(() => {
        if (params.subid)
            API.getNastoolInstance()
                .then(async (nt) => {
                    const series = await nt.getLibrarySeriesItem(params.subid)
                    setSeries(series)
                })
    }, [params.subid])
    const { token } = theme.useToken();
    const panelStyle: React.CSSProperties = {
        marginBottom: 24,
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        border: "solid #ccc 1px"
    }
    return <Section title={`媒体 - ${series?.series_info.title}`}>
        <Space direction="vertical" size={24}>
            <Space size={46} wrap style={{ width: "100%" }}>
                <Image style={{ width: 200 }} src={series?.series_info.cover} />
                <Typography style={{ maxWidth: 1000 }}>
                    <Title>{series?.series_info.title}</Title>
                    <Link passHref href={"/media/file" + series?.series_info.path.local} >
                        <Button type="link" size="small" icon={<ExportOutlined />} disabled={!series}>媒体目录</Button>
                    </Link>
                    {/* <Title level={3}>{series?.series_info.originalTitle}</Title> */}
                    <Paragraph>{JSON.stringify(series?.series_info)}</Paragraph>
                </Typography>
            </Space>
            <Collapse
                bordered={false}
                style={{ background: token.colorBgContainer }}
                items={Object.entries(series?.season_group || {})
                    .map(([num, data]) => ({
                        key: num,
                        label: data.title || `季 ${data.season}`,
                        children: <MediaSeasonView data={data} />,
                        style: panelStyle
                    }))}
            />
            <br />
        </Space>
    </Section>
}