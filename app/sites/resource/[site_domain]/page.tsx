"use client"
import { API, NastoolIndexer, NastoolSiteResourceItem, } from "@/app/utils/api/api";
import React, { useEffect, useState } from "react";
import { Button, Flex, Form, Modal, Space, Table, theme } from "antd"
import { DownloadOutlined } from "@ant-design/icons"
import { bytes_to_human, useSubmitMessage } from "@/app/utils/"
import { Section } from "@/app/components/Section";
import { DownloadSettingSelect } from "@/app/components/NTSelects";
// import { UnionPathsSelect } from "@/app/components/LibraryPathSelector";
import { Download } from "@/app/utils/api/download";
import { DualArrowTag } from "@/app/components/DualArrowTag";
import Search from "antd/es/input/Search";
import Link from "next/link";
import { useAPIContext } from "@/app/utils/api/api_base";
import { DownloadPathSelect, EmptyPathSelect, LibraryPathSelect, PathTreeSelect, UnionPathsSelectGroup } from "@/app/components/LibraryPathSelector";

export default function SiteResource({
    params
}: { params: { site_domain: string } }) {
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState<string>()
    const [loading, setLoading] = useState(true);
    const [resourceList, setResourceList] = useState<NastoolSiteResourceItem[]>([])
    const { API } = useAPIContext();
    useEffect(() => {
        (async () => {
            setLoading(true)
            const resources = await API.getSiteResource(params.site_domain, page, keyword?.length ? keyword : undefined)
            setResourceList(resources)
            setLoading(false)
        })()
    }, [page, keyword])
    const { token } = theme.useToken()
    return <Section
        title={"资源 - " + params.site_domain}
        extra={<Flex justify="end">
            <Search size="middle" style={{ minWidth: 350 }} onSearch={(value) => { setKeyword(value) }} />
        </Flex>}>
        <Table<NastoolSiteResourceItem> dataSource={resourceList}
            rowKey="page_url"
            // bordered={true}
            size="small"
            loading={loading}
            // title={(data) => {
            //     return <Flex justify="end">
            //         <Search size="middle" style={{ maxWidth: 300 }} onSearch={(value) => { setKeyword(value) }} />
            //     </Flex>
            // }}
            tableLayout="auto"
            sortDirections={["ascend", "descend"]}
            pagination={
                {
                    position: ["bottomRight"],
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
                        <Space>
                            <Link href={record.page_url} target="_blank">{title}</Link>
                            <DualArrowTag show={(value) => value != 0} up={record.uploadvolumefactor} down={record.downloadvolumefactor}
                                render={(value) => `${value}X`} />
                        </Space>
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
            <Table.Column<NastoolSiteResourceItem> title="操作"
                render={(value, record) => {
                    return <DownloadModalEntry item={record} />
                }} />
        </Table>
    </Section>
}


function DownloadModalEntry(options: { item: NastoolSiteResourceItem }) {
    const { item } = options;
    const [form] = Form.useForm<{ setting: number, path?: string }>();
    const [modal, contextHolder] = Modal.useModal();
    const { bundle, contextHolder: messageContextHolder } = useSubmitMessage("下载");
    const submit = bundle("下载提交")
    const downloadForm = <Form<{ setting: number, path?: string }>
        form={form} initialValues={{ setting: 0, path: undefined }} layout="horizontal">
        <Form.Item name="setting" label="下载设置" style={{ marginTop: 12, marginBottom: 16 }}>
            <DownloadSettingSelect style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="path" label="下载路径" style={{ marginBottom: 4 }}>
            <UnionPathsSelectGroup fallback="customize">
                <EmptyPathSelect key="auto" label="自动" />
                <DownloadPathSelect key="download" label="下载目录" />
                <PathTreeSelect key="customize" label="自定义目录" />
            </UnionPathsSelectGroup>
        </Form.Item>

    </Form>
    return <>{contextHolder}{messageContextHolder}<Button type="link" icon={<DownloadOutlined />}
        onClick={() => {
            modal.confirm({
                title: `下载选项`,
                content: downloadForm,
                width: 500,
                styles: {
                    "footer": {
                        marginTop: 0
                    }
                },
                onOk: () => {
                    const values = form.getFieldsValue();
                    submit.loading();
                    new Download().submit({
                        enclosure: item.enclosure,
                        title: item.title,
                        description: item.description,
                        page_url: item.page_url,
                        size: item.size,
                        seeders: item.seeders,
                        uploadvolumefactor: item.uploadvolumefactor,
                        downloadvolumefactor: item.downloadvolumefactor,
                        dl_dir: values.path,
                        dl_setting: values.setting
                    })
                }
            })
        }} />
    </>
}