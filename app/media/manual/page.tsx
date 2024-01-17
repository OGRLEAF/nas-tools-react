"use client"
import { CardsForm, useCardsFormContext } from "@/app/components/CardsForm";
import MediaImportWrapper from "@/app/components/mediaImport/mediaImport";
import { IdentifyHistory } from "@/app/components/mediaImport/mediaImportContext";
import MediaImportEntry, { MediaImportProvider } from "@/app/components/mediaImport/mediaImportEntry";
import { OrganizeRecord, OrganizeUnknown, OrganizeUnkownResouce, UnknownRecord } from "@/app/utils/api/import";
import { Button, Flex, theme } from "antd";
import Table, { ColumnsType, TableProps } from "antd/es/table";
import Link from "next/link";
import React, { useState } from "react";

export default function ManualImportPage() {
    const [selected, setSelectd] = useState<UnknownRecord[]>([]);
    return <CardsForm<OrganizeUnkownResouce>
        resource={OrganizeUnknown}
        title="未导入记录"
    >
        <ManualImportTable />
    </CardsForm>
}

function ManualImportTable() {
    const ctx = useCardsFormContext<OrganizeUnkownResouce>();
    const { useList, messageContext, delMany } = ctx.resource;
    const { list, total, options, setOptions } = useList();
    const [loading, setLoading] = useState(false);
    const { token } = theme.useToken();
    const columns: ColumnsType<UnknownRecord> = [
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
            title: ({ filters }) => (<span style={{
                display: "inline-flex",
                justifyContent: "space-between",
                whiteSpace: "nowrap",
                width: "100%",
            }}>
                <span>文件名</span>
                <span style={{ color: token.colorTextDescription }}>{options?.keyword}</span>
            </span>),
            dataIndex: "name",
            render: (name, record) => {
                return <Link href={`/media/file${encodeURI(record.path)}`}>{name}</Link>
            },
        },
        {
            title: "转移方式",
            dataIndex: "sync_mode",
            width: 100
        },
    ]

    const onTableChange: TableProps<UnknownRecord>['onChange'] = (pagination, filters, sorter, extra) => {
        console.log("table changed")
        if (extra.action == "filter") {
            console.log("table filter change", filters);
        }
    }

    return <>{messageContext}
        <Table
            rowSelection={{
                type: "checkbox",

            }}
            loading={loading}
            rowKey="id"
            size="small"
            dataSource={list}
            columns={columns}
            pagination={{
                defaultPageSize: 20,
                total,
            }}
            onChange={onTableChange}
        />
    </>
}
