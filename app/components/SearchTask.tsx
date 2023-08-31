import React, { useState, useEffect, CSSProperties } from "react";
import { Form, Input, Switch, Radio, Button, Empty, Space, Spin } from "antd"
import { API, DBMediaType, NastoolMediaDetail, NastoolMediaType, SearchTaskConfig, TaskType } from "../utils/api";
import { MediaDetailCard } from "./MediaDetailCard"
export interface SearchProps {
    keyword?: string,
    mediaId?: string,
    mediaType?: NastoolMediaType
}

export default function SearchTask({
    search,
    style
}: {
    search?: SearchProps,
    style?: CSSProperties
}) {
    const [mediaDetail, setMediaDetail] = useState<NastoolMediaDetail>();

    useEffect(() => {
        API.getNastoolInstance()
            .then(async nt => {
                if (search?.mediaId && search?.mediaType) {
                    const searchMediaType = ({
                        [NastoolMediaType.ANI]: DBMediaType.TV,
                        [NastoolMediaType.TV]: DBMediaType.TV,
                        [NastoolMediaType.MOVIE]: DBMediaType.MOVIE,
                        [NastoolMediaType.UNKNOWN]: undefined,
                    })[search.mediaType]
                    console.log(search.mediaId)
                    const mediaDetail = await nt.getMediaDetail(search.mediaId, searchMediaType)

                    setMediaDetail(mediaDetail)
                }
            })
    }, [search?.mediaId])

    const [searchTaskConfig, setSearchConfig] = useState<SearchTaskConfig>({
        keyword: search?.keyword || mediaDetail?.title || "",
        identify: true,
        media_type: search?.mediaType || NastoolMediaType.UNKNOWN,
        tmdbid: search?.mediaId || "",
        filter: {}
    })

    const onFinish = (value: SearchTaskConfig) => {
        console.log(value)
        setSearchConfig(value)
        API.getNastoolInstance()
            .then((nt) => nt.createTask(TaskType.SEARCH, JSON.stringify(value)))
    }

    return <Space direction="vertical" size={32} style={{ width: "100%", ...style }}>
        {/* {search ? (
            <>{search.keyword} {search.mediaId} {search.mediaType}</>
        ) : ""} */}
        {mediaDetail ? <MediaDetailCard mediaDetail={mediaDetail} /> : <Spin />}
        <Form initialValues={searchTaskConfig}
            onFinish={onFinish}
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 14 }}
            style={{ margin: 16 }}
        >
            <Form.Item label="搜索关键词" name="keyword">
                <Input />
            </Form.Item>
            <Form.Item label="启用媒体识别" name="identify" valuePropName="checked">
                <Switch />
            </Form.Item>
            <Form.Item label="TMDB ID" name="tmdbid">
                <Input />
            </Form.Item>
            <Form.Item label="类型" name="media_type">
                <Radio.Group>
                    <Radio.Button value={NastoolMediaType.MOVIE}>电影</Radio.Button>
                    <Radio.Button value={NastoolMediaType.TV}>电视剧</Radio.Button>
                    <Radio.Button value={NastoolMediaType.ANI}>动漫</Radio.Button>
                    <Radio.Button value={NastoolMediaType.UNKNOWN}>未知</Radio.Button>
                </Radio.Group>
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
                <Button htmlType="submit" type="primary">提交搜索</Button>
            </Form.Item>
        </Form>
    </Space>
}