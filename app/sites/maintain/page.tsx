"use client"
import React, { useState } from 'react'
import { Section } from "@/app/components/Section";
import { useEffect } from 'react';
import { API, NastoolDownloadConfig, NastoolFilterruleBasic, NastoolSiteProfile } from "@/app/utils/api"
import { Button, Card, Checkbox, Descriptions, Switch, Form, Input, InputNumber, Radio, Space, Table, Select, Drawer } from 'antd';
import { EditOutlined, RedoOutlined, CloseOutlined } from '@ant-design/icons';
import Column from 'antd/es/table/Column';

const SiteProfileEditor = (options: {
    profile: NastoolSiteProfile, serverConfig: {
        download: NastoolDownloadConfig[],
        filterrules: NastoolFilterruleBasic[]
    }
}) => {
    const { profile } = options;
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
    const downloadConfigSelectOption = [
        {
            label: "默认",
            value: ""
        },
        ...options.serverConfig.download.map((item) => ({ label: item.name, value: item.id }))
    ]

    const filterRuleOption = [
        {
            label: "默认",
            value: ""
        },
        ...options.serverConfig.filterrules.map((item) => ({ label: item.name, value: item.id }))
    ]

    const onFinish = (value: any) => {
        API.getNastoolInstance()
            .then(async nt => {
                nt.updateSiteSetting({ id: profile.id, ...value })
            })
        console.log(value)
    }
    return <>
        <Form initialValues={profile} layout="vertical" onFinish={onFinish}>
            <Space direction='vertical' size={[0, 0]}>
                <Space wrap size="large">
                    <Form.Item label="名称" name="name">
                        <Input />
                    </Form.Item>
                    <Form.Item label="站点地址" name="signurl">
                        <Input />
                    </Form.Item>
                    <Form.Item label="优先级" name="pri">
                        <InputNumber min={1} max={10} ></InputNumber>
                    </Form.Item>
                    <Form.Item label="站点用途" name="uses">
                        <Checkbox.Group options={siteUsageCheckOption} key="value"></Checkbox.Group>
                    </Form.Item>
                </Space>
                <Form.Item label="Cookie" name="cookie">
                    <Input.TextArea ></Input.TextArea>
                </Form.Item>
                <Form.Item label="User-Agent" name="ua">
                    <Input></Input>
                </Form.Item>
                <Form.Item label="RSS订阅地址" name="rssurl">
                    <Input />
                </Form.Item>
                <Space wrap size={100} >
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
                </Space>
                <Space size={18}>
                    <Form.Item label="下载设置" name="download_setting">
                        <Select style={{ width: 100 }} options={downloadConfigSelectOption} />
                    </Form.Item>
                    <Form.Item label="过滤规则" name="rule">
                        <Select style={{ width: 100 }} options={filterRuleOption} />
                    </Form.Item>
                </Space>
                <Space.Compact>
                    <Form.Item label="单位时间" name="limit_interval">
                        <InputNumber stringMode style={{ width: 100 }} min={1} placeholder='10'></InputNumber>
                    </Form.Item>
                    <Form.Item label="访问次数" name="limit_count" >
                        <InputNumber stringMode style={{ width: 100 }} min={1} placeholder='10'></InputNumber>
                    </Form.Item>
                    <Form.Item label="访问间隔" name="limit_seconds" >
                        <InputNumber stringMode style={{ width: 100 }} min={1} placeholder='5'></InputNumber>
                    </Form.Item>
                </Space.Compact>
            </Space>
            <Form.Item>
                <Button type="primary" htmlType='submit'>更新</Button>
            </Form.Item>
        </Form>
    </>
}

export default function SiteMaintain() {
    const [sites, setSites] = useState<NastoolSiteProfile[]>([])
    const [downloadConfig, setDownlaodCOnfig] = useState<NastoolDownloadConfig[]>([])
    const [filterrules, setFilterrules] = useState<NastoolFilterruleBasic[]>([])
    useEffect(() => {
        const nastool = API.getNastoolInstance();
        nastool.then(async (nt) => {
            const sites = await nt.getSiteList();
            // console.log(sites)
            setSites(sites)
            const downloadConfig = await nt.getDownloadConfigList();
            setDownlaodCOnfig(downloadConfig)
            const filterrules = await nt.getFilterRules();
            setFilterrules(filterrules)
        })
    }, [])

    const sitesTable = sites.map((site) => ({
        ...site,
        domain: new URL(site.strict_url).host,
        action: <>delete</>
    }))

    const [openEditor, setOpenEditor] = useState(false);


    return <Section title="站点">
        <Drawer title="编辑站点" placement='right' open={openEditor}>

        </Drawer>
        <Table dataSource={sitesTable}
            rowSelection={{

            }}
            expandable={{
                expandedRowRender: (record) => <SiteProfileEditor profile={record}
                    serverConfig={{ download: downloadConfig, filterrules: filterrules }} />
            }}
            rowKey="domain"
        >
            <Column title="站点名称" dataIndex="name"
                render={(text, record: any) => <a href={record.strict_url}>{text}</a>} />
            <Column title="优先级" dataIndex="pri" />
            <Column title="域名" dataIndex="domain" key="domain" />
            <Column title="下载设置" dataIndex="download_setting" render={(value)=>value || "默认"}/>
            <Column title="过滤规则" dataIndex="rule" render={(value)=>value || "默认"}/>
            <Column title="操作" dataIndex="action"></Column>
        </Table>
    </Section >
}