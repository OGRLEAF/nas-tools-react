import TagsSelect from "@/app/components/tagsSelect";
import { Col, Form, Input, Row, Switch } from "antd";
import React from "react";

export default function SettingSLaboratory() {

    return <>
        <Row gutter={24}>
            <Col span={6}>
                <Form.Item label="辅助识别" name={["laboratory", "search_keyword"]} valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="WEB增强识别" name={["laboratory", "search_tmdbweb"]} valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="ChatGPT增强识别" name={["laboratory", "chatgpt_enable"]} valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="TMDB过期策略" name={["laboratory", "tmdb_cache_expire"]} valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={24}>
            <Col span={6}>
                <Form.Item label="默认搜索豆瓣资源" name={["laboratory", "use_douban_titles"]} valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="搜索优先使用英文名" name={["laboratory", "search_en_title"]} valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
    </>
}