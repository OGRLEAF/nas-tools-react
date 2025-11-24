"use client"
import { OrganizeHistory, OrganizeRecord, OrgnizeHistoryResource } from "@/app/utils/api/import";
import { Button, Dropdown, Flex, Form, Input, Space, Table, theme } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { ColumnType, ColumnsType, TableProps } from "antd/es/table";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CardsForm, useCardsFormContext } from "@/app/components/CardsForm";
import MediaImportEntry, { MediaImportProvider } from "@/app/components/mediaImport/mediaImportEntry";
import { IdentifyHistory } from "@/app/components/mediaImport/mediaImportContext";
import MediaImportWrapper from "@/app/components/mediaImport/mediaImport";
import { SeriesKey } from "@/app/utils/api/types";
import { FileLink } from "@/app/components/FileLink";

const MediaInfoColumn = ({ title, record, onTitleClick }: { title: string, record: OrganizeRecord, onTitleClick?: (value: string) => void }) => {
    const { token } = theme.useToken();
    return <Space orientation="vertical" size={0}>

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

const MediaFileInfoColumn = ({ record }: { record: OrganizeRecord }) => {
    const { token } = theme.useToken();
    return <Space orientation="vertical" size={0}>
        <span style={{ color: token.colorInfoText }}>
            <FileLink targetPath={record.SOURCE_PATH + '/' + record.SOURCE_FILENAME}>{record.SOURCE_FILENAME}</FileLink>
        </span>
        <span style={{ color: token.colorInfoText }}>
            <FileLink targetPath={record.DEST_PATH + '/' + record.DEST_FILENAME}>{record.DEST_FILENAME}</FileLink>
        </span>
    </Space>
}

const MediaFileImportInfoColumn = ({ record }: { record: OrganizeRecord }) => {
    const { token } = theme.useToken();
    return <Space orientation="vertical" size={0}>
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

type DataIndex = keyof OrganizeRecord;

const getColumnSearchProps = ({ keyword, onFinish }: { keyword?: string, onFinish: (keyword: string | undefined) => void }): ColumnType<OrganizeRecord> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => {
        return <FilterDropDown value={keyword} onFinish={(value) => {
            console.log(value)
            if (value == '') onFinish(undefined);
            else onFinish(value)
            confirm({ closeDropdown: true })
        }} />
    },
    filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
});


function FilterDropDown({ value: keyword, onFinish }: { value?: string, onFinish?: (value: string) => void }) {
    const [form] = Form.useForm();
    useEffect(() => { form.setFieldValue("keyword", keyword) }, [keyword]);
    return <div style={{ padding: 8 }} onClick={(e) => e.stopPropagation()}>
        <Form form={form} initialValues={{ keyword: keyword }}
            onFinish={(value) => {
                onFinish?.(value.keyword)
            }}>
            <Space.Compact>
                <Form.Item name="keyword" noStyle>
                    <Input allowClear />
                </Form.Item>
                <Form.Item noStyle>
                    <Button htmlType="submit" type="primary">搜索</Button>
                </Form.Item>
            </Space.Compact>
        </Form>
    </div >
}

export default function ImportHistory() {
    const [selected, setSelectd] = useState<OrganizeRecord[]>([]);
    return <MediaImportProvider>
        <MediaImportWrapper />
        <CardsForm<OrgnizeHistoryResource>
            resource={OrganizeHistory}
            title="历史记录"
            initialOptions={{ page: 1, pageSize: 20, }}
            extra={(res) => {
                return <Flex justify="end" gap={12} style={{ width: "100%" }}>
                    {/* <Button disabled={selected.length == 0} type="primary">重新导入</Button> */}
                    <MediaImportEntry appendFiles={selected.map((file) => ({
                        path: file.SOURCE_PATH,
                        name: file.SOURCE_FILENAME,
                        rel: [],
                        selected: true,
                        indentifyHistory: new IdentifyHistory()
                    }))} flush />
                    {/* <Button danger disabled={selected.length == 0} onClick={() => { res.delMany?.(selected) }}>批量删除({selected.length})</Button> */}
                    <Dropdown.Button menu={{
                        items: [{
                            label: "删除源文件",
                            key: "del_source",
                            danger: true
                        }, {
                            label: "删除媒体库文件",
                            key: "del_dest",
                            danger: true
                        }, {
                            label: "删除源文件和媒体库文件",
                            key: "del_all",
                            danger: true
                        }],
                        onClick: (value) => {
                            console.log(value)
                            res.delMany?.(selected, { key: value.key })
                        }
                    }} disabled={selected.length == 0}  danger>
                        批量删除({selected.length})
                    </Dropdown.Button>
                </Flex >
            }}
        >
            <ImportHistoryTable onSelected={(records) => setSelectd(records)} />
        </CardsForm>
    </MediaImportProvider>
}

function ImportHistoryTable({ onSelected }: { onSelected: (records: OrganizeRecord[]) => void }) {
    const ctx = useCardsFormContext<OrgnizeHistoryResource>();
    const { useList, messageContext,  } = ctx.resource;
    const { list, total, options, loading, setOptions } = useList();
    const { token } = theme.useToken();
    const columns: ColumnsType<OrganizeRecord> = [
        {
            title: ({ filters }) => (<span style={{
                display: "inline-flex",
                justifyContent: "space-between",
                whiteSpace: "nowrap",
                width: "100%",
            }}>
                <span>媒体信息</span>
                <span style={{ color: token.colorTextDescription }}>{options?.keyword}</span>
            </span>),
            dataIndex: "TITLE",
            key: "ID",
            width: 300,
            render: (title, record) => {
                return <MediaInfoColumn title={title} record={record} onTitleClick={(title: string) => {
                    setOptions({ ...options, keyword: title })
                }
                } />
            },
            ...getColumnSearchProps({
                keyword: options?.keyword,
                onFinish: (value) => {
                    setOptions({ ...options, page: 1, keyword: value })
                },
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

    return <>{messageContext}
        <Table
            rowSelection={{
                type: "checkbox",
                onChange(selectedRowKeys, selectedRows) {
                    onSelected(selectedRows)
                }
            }}
            loading={loading}
            rowKey="ID"
            size="small"
            dataSource={list}
            columns={columns}
            pagination={{
                current: options?.page,
                pageSize: options?.pageSize,
                total,
                onChange: (page, pageSize) => {
                    setOptions({ page: page, pageSize: pageSize, keyword: options?.keyword })
                }

            }}
        />
    </>
}
