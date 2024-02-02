"use client"
import React from 'react'
import { Form, Input, Space, Row, Col, Select, InputNumber } from 'antd'
import { API, NastoolServerConfig } from '@/app/utils/api/api'

export default function SettingSystem(options: { config?: NastoolServerConfig }) {
    const logtypeOptions = [
        {
            value: "file",
            label: "文件",
        },
        {
            value: "console",
            label: "控制台",
        },
        {
            value: "server",
            label: "日志中心",
        }
    ]
    const loglevelOptions = [
        {
            value: "debug",
            label: "DEBUG",
        },
        {
            value: "info",
            label: "INFO",
        },
        {
            value: "error",
            label: "ERROR",
        }
    ]
    const wallpaperOption = [
        {
            value: "bing",
            label: "BING"
        },
        {
            value: "themoviedb",
            label: "TMDB"
        }
    ]
    return <>
        {/* <Form initialValues={options.config} layout='vertical'> */}
        <Row gutter={[24, 0]}>
            <Col span={6}>
                <Form.Item label="日志输出类型" name={["app", "logtype"]}>
                    <Select options={logtypeOptions} />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="日志文件路径" name={["app", "logpath"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="日志中心地址" name={["app", "logserver"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="日志级别" name={["app", "loglevel"]}>
                    <Select options={loglevelOptions} />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={24}>
            <Col span={6}>
                <Form.Item label="WEB壁纸来源" name={["app", "wallpaper"]}>
                    <Select options={wallpaperOption} />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="WEB服务端口" name={["app", "web_port"]}>
                    <InputNumber style={{ width: "100%" }} min={1} max={65535} />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="WEB管理用户" name={["app", "login_user"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="WEB管理密码" name={["app", "login_password"]}>
                    <Input type="password" />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={24}>
            <Col span={6}>
                <Form.Item label="HTTPS证书文件路径" name={["app", "ssl_cert"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="HTTPS证书密钥路径" name={["app", "ssl_key"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="外网访问地址" name={["app", "domain"]}>
                    <Input />
                </Form.Item>
            </Col>
        </Row>


        <Row gutter={24}>
            <Col span={6}>
                <Form.Item label="代理服务器(HTTPS)" name={["app", "proxies", "https"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6} >
                <Form.Item label="代理服务器(HTTP)" name={["app", "proxies", "http"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item label="User-Agent" name={["app", "user_agent"]}>
                    <Input />
                </Form.Item>
            </Col>
        </Row>
        {/* </Form> */}
    </>
}
