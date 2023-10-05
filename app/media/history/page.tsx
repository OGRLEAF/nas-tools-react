"use client"
import { OrganizationHistory } from "@/app/utils/api/api";
import { Organize } from "@/app/utils/api/import";
import { Button, Form, Input, Space, Table, theme } from "antd";
import { SearchOutlined } from "@ant-design/icons"
import { ColumnType, ColumnsType, TableProps } from "antd/es/table";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useForm } from "antd/es/form/Form";

const MediaInfoColumn = ({ title, record, onTitleClick }: { title: string, record: OrganizationHistory, onTitleClick?: (value: string) => void }) => {
    const { token } = theme.useToken();
    return <Space direction="vertical" size={0}>

        <Space style={{ color: token.colorTextHeading }}>
            <Button
                style={{ color: token.colorTextBase, padding: 0 }}
                type="text"
                size="small"
                onClick={() => { if (onTitleClick) onTitleClick(record.TITLE) }}
            >
                {record.TITLE}
            </Button>
        </Space>
        <span style={{ color: token.colorInfoTextHover }}>{record.SEASON_EPISODE}</span>
        <span style={{ color: token.colorTextDescription }}>{record.CATEGORY}</span>

    </Space>
}

const MediaFileInfoColumn = ({ record }: { record: OrganizationHistory }) => {
    const { token } = theme.useToken();
    return <Space direction="vertical" size={0}>
        <span style={{ color: token.colorInfoText }}>
            <Link href={'/media/file' + encodeURI(record.SOURCE_PATH)}>{record.SOURCE_FILENAME}</Link>
            {/* <span style={{color: token.colorTextDescription}}>{record.SOURCE_PATH}</span> */}
        </span>
        <span style={{ color: token.colorInfoText }}>
            <Link href={'/media/file' + encodeURI(record.DEST_PATH)}>{record.DEST_FILENAME}</Link>
            {/* <span style={{color: token.colorTextDescription}}>{record.DEST_PATH}</span> */}
        </span>
    </Space>
}

const MediaFileImportInfoColumn = ({ record }: { record: OrganizationHistory }) => {
    const { token } = theme.useToken();
    return <Space direction="vertical" size={0}>
        <span style={{ color: token.colorTextLabel }}>
            {record.DATE}
        </span>
        <span style={{ color: token.colorTextLabel }}>
            {record.SOURCE}
        </span>
        <span style={{ color: token.colorTextLabel }}>
            {record.MODE}
        </span>
    </Space>
}

type DataIndex = keyof OrganizationHistory;

const getColumnSearchProps = ({ keyword, onFinish }: { keyword?: string, onFinish: (keyword: string) => void }): ColumnType<OrganizationHistory> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => {
        const onFinishFilterForm = (value: { keyword: string }) => {
            console.log("onFinishFilterForm", value.keyword);
            onFinish(value.keyword)
            confirm({ closeDropdown: false });
        }
        const [form] = useForm();
        useEffect(() => {
            console.log("Set->", keyword)
            form.setFieldValue("keyword", keyword)
        }, [keyword])
        return <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Form initialValues={{
                keyword: ""
            }}
                onFinish={onFinishFilterForm}
                form={form}
            >
                <Space direction="vertical">
                    <Form.Item name="keyword" noStyle>
                        <Input allowClear />
                    </Form.Item>

                    <Space>
                        <Form.Item noStyle>
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                size="small"
                                htmlType="submit"
                                style={{ width: 90 }}
                            >
                                Search
                            </Button>
                        </Form.Item>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                close();
                            }}
                        >
                            close
                        </Button>
                    </Space>
                </Space>
            </Form>
        </div>
    },
    filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
});




export default function ImportHistory() {
    const [historyList, setHistoryList] = useState<OrganizationHistory[]>();
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<{
        current: number,
        pageSize: number,
        keyword?: string
    }>({
        current: 1,
        pageSize: 10,
        keyword: undefined
    });
    useEffect(() => {
        setLoading(true)
        new Organize().getHistory({ page: pagination.current, length: pagination.pageSize, keyword: pagination.keyword })
            .then(result => {
                setHistoryList(result.result);
                setTotal(result.total);
            })
            .finally(() => {
                setLoading(false)
            })
    }, [pagination])


    const { token } = theme.useToken();
    const columns: ColumnsType<OrganizationHistory> = [
        {
            title: ({ filters }) => (<Space>
                <span>媒体信息</span>
                <span style={{ color: token.colorTextDescription }}>{pagination.keyword}</span>
            </Space>),
            dataIndex: "TITLE",
            key: "ID",
            width: 300,
            render: (title, record) => {
                return <MediaInfoColumn title={title} record={record} onTitleClick={(title: string) => {
                    setPagination({ ...pagination, current: 1, keyword: title })
                }
                } />
            },
            ...getColumnSearchProps({
                keyword: pagination.keyword,
                onFinish: (value) => {
                    setPagination({ ...pagination, current: 1, keyword: value })
                }
            })
        },
        {
            title: "文件信息",
            render: (_, record) => {
                return <MediaFileInfoColumn record={record} />
            }
        },
        {
            title: "转移信息",
            render: (_, record) => {
                return <MediaFileImportInfoColumn record={record} />
            }
        }
    ]

    const onTableChange: TableProps<OrganizationHistory>['onChange'] = (pagination, filters, sorter, extra) => {
        console.log("table changed")
        if (extra.action == "filter") {
            console.log("table filter change", filters);
        }
    }

    return <Table
        rowSelection={{
            type: "checkbox",
        }}
        loading={loading}
        rowKey="ID"
        size="small"
        dataSource={historyList}

        columns={columns}
        pagination={{
            ...pagination,
            total: total,
            onChange: (page, pageSize) => {
                setPagination({ ...pagination, current: page, pageSize })
            }

        }}
        onChange={onTableChange}
    />
}