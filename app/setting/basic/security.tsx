import TagsSelect from "@/app/components/TagsSelect";
import { Col, Form, Input, Row, Switch } from "antd";
import React from "react";

export default function SettingSecurity() {

    return <>
        <Row gutter={24}>
            <Col span={6}>
                <Form.Item label="媒体服务器Webhook源地址" name={["security", "media_server_webhook_allow_ip", "ipv4"]}>
                    <TagsSelect sep="," />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="Telegram源地址" name={["security", "telegram_webhook_allow_ip", "ipv4"]}>
                    <TagsSelect sep="," />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="Synology Chat源地址" name={["security", "synology_webhook_allow_ip", "ipv4"]}>
                    <TagsSelect sep="," />
                </Form.Item>
            </Col>
            {/* <Col span={6}>
                <Form.Item label="API密钥" name={["security", "api_key"]}>
                    <Input />
                </Form.Item>
            </Col> */}
        </Row>
        <Row gutter={24}>
            <Col span={6}>
                <Form.Item name={["security", "media_server_webhook_allow_ip", "ipv6"]}>
                    <TagsSelect sep="," />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item name={["security", "telegram_webhook_allow_ip", "ipv6"]}>
                    <TagsSelect sep="," />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item name={["security", "synology_webhook_allow_ip", "ipv6"]}>
                    <TagsSelect sep="," />
                </Form.Item>
            </Col>

        </Row>
        <Row gutter={24}>
            <Col span={6}>
                <Form.Item label="API密钥" name={["security", "api_key"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="验证外部请求的API密钥" name={["security", "check_apikey"]} valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
    </>
}