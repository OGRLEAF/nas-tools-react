"use client"

import { Section } from "@/app/components/Section";
import { MovieRssList, Subscribe } from "@/app/utils/api/subscribe";
import { Button, Space } from "antd";
import { useEffect, useState } from "react";
import { PlusOutlined, PlayCircleOutlined, StopOutlined } from "@ant-design/icons"
import { IconDatabase } from "@/app/components/icons";

export default function SubscribeMovie() {
    const [movieList, setMovieList] = useState<MovieRssList>({});
    const updateMovieList = () => new Subscribe().getMovieList().then((result) => { setMovieList(result) })
    useEffect(() => {
        updateMovieList();
    }, [])

    return <Section title="自定义订阅"
        onRefresh={updateMovieList}
        extra={
            <Space>
                <Button icon={<PlusOutlined />} type="primary">添加订阅</Button>
                <Button icon={<PlayCircleOutlined /> } >启用</Button>
                <Button icon={<StopOutlined />} >停用</Button>
                <Button icon={<IconDatabase />} >RSS解析器</Button>
            </Space>
        }>
        <Space wrap>
            {/* {cards} */}
        </Space>
    </Section>
}