"use client"
import { Cards, CardsForm, useCardsFormContext } from "@/app/components/CardsForm";
import { RssParsers, RssParserResource, RssParserConfig } from "@/app/utils/api/subscription/rss";
import { Button, Col, Flex, Form, Input, Modal, Row, Select, theme } from "antd";
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import Table, { ColumnsType } from "antd/es/table";
import React from "react";

export default function RssParserPage() {
    return <CardsForm<RssParserResource>
        title="解析器"
        resource={RssParsers}
        formComponent={RssParserForm}
    >
        <RssParserTable />
    </CardsForm>
}

function RssParserForm({ record, onChange }: { record?: RssParserConfig, onChange?: (value: RssParserConfig) => void }) {
    const { token, } = theme.useToken();
    return <Form initialValues={record} layout="vertical"
        onFinish={(value) => { onChange?.({ ...record, ...value }) }}
    >
        <Row gutter={16}>
            <Col span={20}>
                <Form.Item name="name" label="名称">
                    <Input />
                </Form.Item>
            </Col>
            <Col span={4}>
                <Form.Item name="type" label="类型">
                    <Select options={[{ label: "XML", value: "XML" }, { label: "JSON", value: "JSON" }]} />
                </Form.Item>
            </Col>
        </Row>
        <Form.Item name="format" label="解析格式">
            <CodeMirror
                extensions={[json()]}
                style={{
                    minHeight: 500,
                    maxHeight: 700,
                    overflowY: "auto",
                    borderRadius: token.borderRadius,
                    fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                }} />
        </Form.Item>
        <Form.Item name="params" label="参数">
            <Input />
        </Form.Item>
        <Form.Item>
            <Button htmlType="submit" type="primary">保存</Button>
        </Form.Item>
    </Form>
}

function RssParserTable() {
    const ctx = useCardsFormContext<RssParserResource>();
    const { useList, messageContext } = ctx.resource;
    const { list, total, options, loading } = useList();
    const { confirm } = Modal;
    const columns: ColumnsType<RssParserConfig> = [
        {
            title: "名称",
            dataIndex: "name",
        },
        {
            title: "类型",
            dataIndex: "type",
            width: 100
        },
        {
            title: "附加参数",
            dataIndex: "params",
        },
        {
            title: "操作",
            align: "center",
            render: (value, record) => <Flex>
                <Button type="link" onClick={() => ctx.openEditor(record)}>编辑</Button>
                <Button type="link" danger onClick={() => {
                    confirm({
                        title: `确认删除解析器?`,
                        content: <>{record.name}</>,
                        onOk: () => { ctx.resource.del?.(record) }
                    })
                }}>删除</Button>
            </Flex>,
            width: 100
        }
    ]

    return <>{messageContext}
        <Table
            size="middle"
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
