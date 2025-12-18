"use client"
import { CardsForm, useCardsFormContext } from "@/app/components/CardsForm";
import { FileLink } from "@/app/components/FileLink";
import MediaImportWrapper from "@/app/components/MediaImport/mediaImport";
import { IdentifyHistory } from "@/app/components/MediaImport/mediaImportContext";
import MediaImportEntry, { MediaImportProvider } from "@/app/components/MediaImport/mediaImportEntry";
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
    const { list, loading, actions } = ctx.resource;
    const { options} =  actions;
    // const {  total, options, loading } = useList();
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
                return <FileLink targetPath={record.path}>{name}</FileLink>
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

    return <>
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
            }}
            onChange={onTableChange}
        />
    </>
}
