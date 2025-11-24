"use client"
import { CronInput } from "@/app/components/CronInput";
import { Col, Form, Input, InputNumber, Row, Switch } from "antd";
import React from "react";

export default function SettingService() {
    return <>
        <Row gutter={24}>
            <Col span={6}>
                <Form.Item label="订阅RSS周期" name={["pt", "pt_check_interval"]}>
                    <InputNumber style={{ width: "100%" }} suffix="秒" />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="订阅搜索周期" name={["pt", "search_rss_interval"]}>
                    <InputNumber style={{ width: "100%" }} suffix="小时" />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="媒体库同步周期" name={["media", "mediasync_interval"]}>
                    <InputNumber style={{ width: "100%" }} suffix="小时" />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="站点数据刷新时间" name={["pt", "ptrefresh_date_cron"]}>
                    {/* <InputNumber style={{ width: "100%" }} addonAfter="小时" /> */}
                    <Input />
                    {/* <CronInput /> */}
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={24}>
            <Col span={6}>
                <Form.Item label="远程搜索自动择优下载" name={["pt", "search_auto"]} valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="远程下载不完整自动订阅" name={["pt", "search_no_result_rss"]} valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
    </>
}