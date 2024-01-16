"use client"
import { OrganizationHistory } from "@/app/utils/api/api";
import { HistoryListOption, Organize, OrganizeHistory, OrganizeRecord } from "@/app/utils/api/import";
import { Button, Dropdown, Flex, Form, Input, Modal, Space, Table, theme } from "antd";
import { SearchOutlined } from "@ant-design/icons"
import { ColumnType, ColumnsType, TableProps } from "antd/es/table";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { CardsForm, useCardsFormContext } from "@/app/components/CardsForm";
import { useSubmitMessage } from "@/app/utils";

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
        </span>
        <span style={{ color: token.colorInfoText }}>
            <Link href={'/media/file' + encodeURI(record.DEST_PATH)}>{record.DEST_FILENAME}</Link>
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

const getColumnSearchProps = ({ keyword, onFinish }: { keyword?: string, onFinish: (keyword: string | undefined) => void }): ColumnType<OrganizationHistory> => ({
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
    return <CardsForm<OrganizeRecord, OrganizeHistory, HistoryListOption>
        resource={OrganizeHistory}
        title="历史记录"
        initialOptions={{ page: 1, pageSize: 20, }}
        extra={(res) => {
            return <Flex justify="end" gap={12} style={{ width: "100%" }}>
                <Button disabled={selected.length == 0} type="primary">重新识别</Button>
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
                    }
                }} disabled={selected.length == 0} onClick={(evt) => { console.log(evt.currentTarget) }} danger>
                    批量删除({selected.length})
                </Dropdown.Button>
            </Flex >
        }}
    >
        <ImportHistoryTable onSelected={(records) => setSelectd(records)} />
    </CardsForm>
}

function ImportHistoryTable({ onSelected }: { onSelected: (records: OrganizeRecord[]) => void }) {
    const ctx = useCardsFormContext<OrganizeRecord, OrganizeHistory>();
    const { useList, messageContext, delMany } = ctx.resource;
    const { list, total, options, setOptions } = useList();
    const [loading, setLoading] = useState(false);
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

    const onTableChange: TableProps<OrganizationHistory>['onChange'] = (pagination, filters, sorter, extra) => {
        console.log("table changed")
        if (extra.action == "filter") {
            console.log("table filter change", filters);
        }
    }

    const TableTitle = <Flex justify="end" gap={12} style={{ width: "100%" }}>
        <Button type="primary">重新识别</Button>
        <Button danger >批量删除</Button>
    </Flex>

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
            onChange={onTableChange}
        />
    </>
}

// interface DeleteModalProps {
//     records: OrganizeRecord[],
//     onFinish: ()=>{}
// }


// const [form] = Form.useForm();
//     const [modal, contextHolder] = Modal.useModal();
//     const { bundle, contextHolder: messageContextHolder } = useSubmitMessage("删除");
//     const submit = bundle("下载提交")
//     const downloadForm = <Form form={form} initialValues={{ setting: 0, path: undefined }} layout="horizontal">
//         <Form.Item name="setting" label="删除设置" style={{ marginTop: 12, marginBottom: 16 }}>
//             <
//         </Form.Item>
//     </Form>

//     return <>{contextHolder}{messageContextHolder}<Button type="link" icon={<DownloadOutlined />}
//         onClick={() => {
//             modal.confirm({
//                 title: `下载选项`,
//                 content: downloadForm,
//                 width: 500,
//                 styles: {
//                     "footer": {
//                         marginTop: 0
//                     }
//                 },
//                 onOk: () => {
//                     const values = form.getFieldsValue();
//                     submit.loading();
//                     new TorrentSearchResult().download(options.records.id, values.path, values.setting)
//                         .then((msg) => {
//                             submit.success()
//                         })
//                         .catch((e) => {
//                             submit.error(e)
//                         })
//                 }
//             })
//         }} />
//     </>
// }