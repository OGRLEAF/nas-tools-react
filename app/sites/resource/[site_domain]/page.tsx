"use client"
import { API, NastoolIndexer, NastoolSiteResourceItem, } from "@/app/utils/api";
import React, { useEffect, useState } from "react";
import { Button, Space, Table, theme } from "antd"
import { DownloadOutlined } from "@ant-design/icons"
import { bytes_to_human } from "@/app/utils/"
import { Section } from "@/app/components/Section";

export default function SiteResource({
    params
}: { params: { site_domain: string } }) {
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [resourceList, setResourceList] = useState<NastoolSiteResourceItem[]>([])
    useEffect(() => {
        setLoading(true)
        API.getNastoolInstance()
            .then(async nt => {
                const resources = await nt.getSiteResource(params.site_domain, page)
                setResourceList(resources)
                setLoading(false)
            })
    }, [page])
    const { token } = theme.useToken()
    return <Section title={"资源 - " + params.site_domain}>
        <Table dataSource={resourceList}
            rowKey="page_url"
            size="small"
            loading={loading}
            sortDirections={["ascend", "descend"]}
            pagination={
                {
                    position: ["topRight", "bottomRight"],
                    pageSize: 100,
                    showSizeChanger: false,
                    total: 100 * 10,
                    onChange: (page) => { setPage(page) }
                }
            }
        >

            <Table.Column title="标题" dataIndex="title"
                render={(title, record: NastoolSiteResourceItem) => (<>
                    <Space direction="vertical" size={4}>
                        <span>{title}</span>
                        <span style={{ color: token.colorTextDescription }}>{record.description}</span>
                    </Space>
                </>)} />
            <Table.Column title="发布时间" dataIndex="date_elapsed" />
            <Table.Column title="体积" dataIndex="size" render={(value) => {
                const [v, u] = bytes_to_human(value);
                return <>{v.toFixed(2)} {u}</>
            }} />
            <Table.Column title="做种数" dataIndex="seeders" />
            <Table.Column title="下载数" dataIndex="peers" />
            <Table.Column title="完成数" dataIndex="grabs" />
            <Table.Column title="操作" render={(value, record) => {
                return <Button type="link" icon={<DownloadOutlined />} />
            }} />
        </Table>
    </Section>
}