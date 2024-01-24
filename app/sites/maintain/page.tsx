"use client"
import React, { useState } from 'react'
import { Section } from "@/app/components/Section";
import { useEffect } from 'react';
import { API, NastoolDownloadConfig, NastoolFilterruleBasic, NastoolSiteProfile } from "@/app/utils/api/api"
import { Button, Card, Checkbox, Descriptions, Switch, Form, Input, InputNumber, Radio, Space, Table, Select, Drawer, theme, Flex, Divider, Modal } from 'antd';
import { EditOutlined, RedoOutlined, CloseOutlined } from '@ant-design/icons';
import Column from 'antd/es/table/Column';
import { CardsForm, TestButton, useCardsFormContext } from '@/app/components/CardsForm';
import { SiteProfile, Sites, SitesResouce } from '@/app/utils/api/sites';
import { ColumnsType, TableProps } from 'antd/es/table';
import { DownloadClientSelect, DownloadSettingSelect, FilterRuleSelect } from '@/app/components/NTSelects';
import Link from 'next/link';

export default function SiteMaintain() {
    return <CardsForm resource={Sites} title="站点维护" formComponent={SiteProfileEditor}>
        <SitesTable />
    </CardsForm>
}

function SitesTable() {
    const ctx = useCardsFormContext<SitesResouce>();
    const { useList, messageContext } = ctx.resource;
    const { list, total, loading } = useList();
    const { confirm } = Modal;
    const columns: ColumnsType<SiteProfile> = [
        {
            title: "ID",
            dataIndex: "id",
            sortDirections: ["descend", "ascend"],
            defaultSortOrder: "descend",
            sorter: {
                compare: (a, b) => a.id - b.id
            }
        },
        {
            title: "站点名称",
            dataIndex: "name",
            render: (text, record: any) => <Link href={record.strict_url} target="_blank">{text}</Link>
        },
        {
            title: "优先级",
            dataIndex: "pri"
        },
        {
            title: "域名",
            dataIndex: "strict_url"
        },
        {
            title: "下载设置",
            dataIndex: "download_setting",
            render: (value) => value || "默认"
        },
        {
            title: "过滤规则",
            dataIndex: "rule",
            render: (value) => value || "默认"
        },
        {
            title: "操作",
            align: "center",
            render: (value, record) => {
                return <Flex>
                    <Button type="link" onClick={() => ctx.openEditor(record)}>编辑</Button>
                    <Button type="link" danger onClick={() => {
                        confirm({
                            title: `确认删除站点?`,
                            content: <>{record.name}</>,
                            onOk: () => { ctx.resource.del?.(record) }
                        })
                    }}>删除</Button>
                    <TestButton btnProps={{ size: "small", type: "text", }} msgType="popover" record={() => record}></TestButton>
                </Flex>
            },
            width: 100
        }
    ]

    return <>{messageContext}
        <Table
            rowSelection={{
                type: "checkbox",

            }}
            loading={loading}
            rowKey="id"
            dataSource={list}
            columns={columns}
            pagination={{
                defaultPageSize: 20,
                total,
            }}
        />
    </>
}

const siteUsageCheckOption = [
    {
        label: "刷流",
        value: "S"
    },
    {
        label: "订阅",
        value: "D"
    },
    {
        label: "数据统计",
        value: "T"
    }
]

const SiteProfileEditor = ({ record: profile, onChange }: { record?: SiteProfile, onChange?: (record: SiteProfile) => void }) => {
    const [form] = Form.useForm()
    return <>
        <Form form={form} initialValues={profile} layout="vertical" onFinish={(values) => {
            onChange?.({ ...profile, ...values })
        }}>

            <Space wrap size="large">
                <Form.Item label="名称" name="name">
                    <Input />
                </Form.Item>
                <Form.Item label="优先级" name="pri">
                    <InputNumber min={1} max={10} ></InputNumber>
                </Form.Item>

            </Space>
            <Form.Item label="站点地址" name="signurl">
                <Input />
            </Form.Item>

            <Form.Item label="站点用途" name="uses">
                <Checkbox.Group options={siteUsageCheckOption} key="value"></Checkbox.Group>
            </Form.Item>
            <Form.Item label="Cookie" name="cookie">
                <Input.TextArea ></Input.TextArea>
            </Form.Item>
            <Form.Item label="User-Agent" name="ua">
                <Input></Input>
            </Form.Item>
            <Form.Item label="RSS订阅地址" name="rssurl">
                <Input />
            </Form.Item>
            <Flex justify="space-between" style={{ width: "100%" }} >
                <Form.Item label="RSS解析种子详情" name="parse" valuePropName="checked">
                    <Switch />
                </Form.Item>
                <Form.Item label="站点消息通知" name="unread_msg_notify" valuePropName="checked">
                    <Switch />
                </Form.Item>
                <Form.Item label="浏览器模拟" name="chrome" valuePropName="checked">
                    <Switch />
                </Form.Item>
                <Form.Item label="代理" name="proxy" valuePropName="checked">
                    <Switch />
                </Form.Item>
                <Form.Item label="自动下载字幕" name="subtitle" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Flex>
            <Space size={18} wrap style={{ width: "100%" }} >
                <Form.Item label="下载设置" style={{ minWidth: 150 }} name="download_setting">
                    <DownloadSettingSelect default={({ label: "默认", value: '' })} />
                </Form.Item>
                <Form.Item label="过滤规则" style={{ minWidth: 150 }} name="rule">
                    <FilterRuleSelect />
                </Form.Item>
            </Space>
            <Divider orientation="left" orientationMargin={0}>流控规则</Divider>
            <Space wrap>
                <Form.Item label="单位时间" name="limit_interval">
                    <InputNumber stringMode style={{ width: 120 }} min={1} placeholder='10'></InputNumber>
                </Form.Item>
                <Form.Item label="访问次数" name="limit_count" >
                    <InputNumber stringMode style={{ width: 120 }} min={1} placeholder='10'></InputNumber>
                </Form.Item>
                <Form.Item label="访问间隔" name="limit_seconds" >
                    <InputNumber stringMode style={{ width: 120 }} min={1} placeholder='5'></InputNumber>
                </Form.Item>
            </Space>
            <br />
            <Space>
                <Form.Item noStyle>
                    <Button type="primary" htmlType='submit'>更新</Button>
                </Form.Item>
                <TestButton record={() => {
                    const values = (form.getFieldsValue());
                    return { ...profile, ...values }
                }} />
            </Space>
        </Form>
    </>
}
