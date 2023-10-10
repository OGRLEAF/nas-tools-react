"use client"
import React, { useEffect, useState } from "react";
import { Section } from "../../components/Section";
import { Button, Card, Drawer, Form, Space, Tag, theme } from "antd";
import { PlusOutlined } from "@ant-design/icons"
import { IconDatabase } from "@/app/components/icons";
import { MovieRssConfig, MovieRssList, RssState, Subscribe } from "@/app/utils/api/subscribe";

export default function SubscribeMovie() {
    const [movieList, setMovieList] = useState<MovieRssList>({});
    const updateMovieList = () => new Subscribe().getMovieList().then((result) => { setMovieList(result) })
    useEffect(() => {
        updateMovieList();
    }, [])
    // const cards = Object.entries(movieList).map(([key, config]) => <SubscribeMovieCard key={key} movieRssCard={config} />)
    return <Section title="电视剧订阅"
        onRefresh={updateMovieList}
        extra={
            <Space>
                <Button icon={<PlusOutlined />} type="primary">添加订阅</Button>
                <Button icon={<IconDatabase />} >默认设置</Button>
            </Space>
        }>
        <Space wrap>
            {/* {cards} */}
        </Space>
    </Section>
}