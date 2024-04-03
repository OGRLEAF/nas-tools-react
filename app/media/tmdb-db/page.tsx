"use client"
import { NastoolMediaType, OrganizationHistory, TMDBCacheItem, TMDBCacheList } from "@/app/utils/api/api";
import { Organize } from "@/app/utils/api/import";
import { Button, Form, Input, Space, Table, theme, Image } from "antd";
import { SearchOutlined } from "@ant-design/icons"
import { ColumnType, ColumnsType, TableProps } from "antd/es/table";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useForm } from "antd/es/form/Form";
import { TMDB } from "@/app/utils/api/media/tmdb";


const TMDBInfo = ({ record }: { record: TMDBCacheItem }) => {
    const { token } = theme.useToken();
    return <Space align="start" size={14}>
        <Image src={`https://image.tmdb.org/t/p/w500${record.poster_path}`} width={80} alt="TMDB Poster"/>
        <Space direction="vertical" style={{ paddingTop: 14 }}>
            <div style={{ color: token.colorTextLabel }}>
                {record.title} ({record.year})

            </div>
            <div>{record.media_type}</div>
            <div>
                <Button
                    type="link"
                    href={`https://www.themoviedb.org/${record.media_type == NastoolMediaType.TV ? "tv" : "movie"}/${record.id}`}
                    target="_blank"
                    style={{ padding: 0 }}
                >
                    #{record.id}
                </Button>
            </div>
        </Space>
    </Space>
}

const FilterForm = ({ keyword, onFinish }: { keyword?: string, onFinish: (value: { keyword: string }) => void }) => {
    const onFinishFilterForm = (value: { keyword: string }) => {
        onFinish({ keyword: value.keyword })
    }
    const [form] = useForm();
    useEffect(() => {
        // console.log("Set->", keyword)
        form.setFieldValue("keyword", keyword)
    }, [form, keyword])
    return <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Form initialValues={{ keyword: "" }}
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
                            style={{ width: 90 }}>Search</Button>
                    </Form.Item>
                    <Button type="link" size="small" onClick={() => { close(); }}> close </Button>
                </Space>
            </Space>
        </Form>
    </div>
}

function getColumnSearchProps<T>({ keyword, onFinish }: { keyword?: string, onFinish: (keyword: string) => void }): ColumnType<T> {
    return {
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => {
            const onFinishFilterForm = (value: { keyword: string }) => {
                console.log("onFinishFilterForm", value.keyword);
                onFinish(value.keyword)
                confirm({ closeDropdown: false });
            }
            return <FilterForm keyword={keyword} onFinish={onFinishFilterForm} />
        },
        filterIcon: (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
        ),
    };
}

export default function TMDBCache() {
    const [list, setList] = useState<TMDBCacheList>();
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
        new TMDB().listCache({ page: pagination.current, length: pagination.pageSize, keyword: pagination.keyword })
            .then(result => {
                setList(result.result);
                setTotal(result.total);
            })
            .finally(() => {
                setLoading(false)
            })
    }, [pagination])


    const { token } = theme.useToken();
    const columns: ColumnsType<TMDBCacheList[number]> = [
        {
            title: "TMDB条目",
            dataIndex: [1],
            render: (value: TMDBCacheItem, record) => {
                return <TMDBInfo record={value} />
            }
        },
        {
            title: "类型",
            render: (value, record) => {
                return record[1].media_type
            }
        },
        {
            title: ({ filters }) => (<Space>
                <span>索引</span>
                <span style={{ color: token.colorTextDescription }}>{pagination.keyword}</span>
            </Space>),
            dataIndex: [2],
            key: "ID",
            width: 300,
            render: (title, record) => {
                return title
            },
            ...getColumnSearchProps({
                keyword: pagination.keyword,
                onFinish: (value) => {
                    setPagination({ ...pagination, current: 1, keyword: value })
                }
            })
        },

    ]

    const onTableChange: TableProps<TMDBCacheList[number]>['onChange'] = (pagination, filters, sorter, extra) => {
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
        rowKey={(record) => record[0]}
        size="small"
        dataSource={list}

        columns={columns}
        pagination={{
            ...pagination,
            total: total,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (page, pageSize) => {
                setPagination({ ...pagination, current: page, pageSize })
            }

        }}
        onChange={onTableChange}
    />
}