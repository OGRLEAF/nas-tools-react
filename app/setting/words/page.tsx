"use client"
import { CardProps, CardsForm, CollapsableList, useCardsFormContext } from "@/app/components/CardsForm";
import { Cards } from "@/app/components/CardsForm/Cards";
import TinyTMDBSearch, { MediaSearchGroup, MediaSearchWork } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { useSubmitMessage } from "@/app/utils";
import { ResourceType } from "@/app/utils/api/api_base";
import { SeriesKey, SeriesKeyType } from "@/app/utils/api/types";
import { WordConfig, WordConfigGroup, Words, WordsResource } from "@/app/utils/api/words";
import { Button, Checkbox, Divider, Drawer, Flex, Form, Input, Modal, Radio, Space, Table, TableProps, Tabs, Tag, theme } from "antd";
import { CloseOutlined } from "@ant-design/icons"
import useFormInstance from "antd/es/form/hooks/useFormInstance";
import CheckableTag from "antd/es/tag/CheckableTag";
import { TabsProps } from "antd/lib";
import { group } from "console";
import React, { createContext, useEffect, useMemo, useState } from "react";

export default function WordsGroupPage() {
    const { token } = theme.useToken();
    return <CardsForm<WordsResource> title="识别词" resource={Words} formComponent={WordsGroupForm}>
        <WordsGroupTable />
        {/* <CollapsableList<WordsResource>
            panelStyle={{
                marginBottom: 24,
                background: token.colorFillAlter,
                borderRadius: token.borderRadiusLG,
                border: 'none',
            }}
            bordered={false}
            contentPadding={0}
            style={{ background: token.colorBgContainer }}
            cardProps={(record) => {
                return {
                    title: record.name,
                    description: <WordsTable group={record} />
                }
            }}
        /> */}

    </CardsForm>
}

function WordsGroupForm(options: { record?: WordConfigGroup, onChange?: (record: { seriesKey: SeriesKey }) => void }) {
    return <Form<{ series: SeriesKey }> onFinish={({ series }) => {
        if (series) {
            if (series.end >= SeriesKeyType.TMDBID) {
                console.log(series, series.i)
                options.onChange?.({ seriesKey: series })
            }
        }
    }}>
        <Form.Item name="series">

            <MediaSearchGroup>
                <MediaSearchWork />
            </MediaSearchGroup>
        </Form.Item>
        <Form.Item>
            <Button htmlType="submit" type="primary">确定</Button>
        </Form.Item>
    </Form>
}

function WordsGroupTable() {
    const ctx = useCardsFormContext<WordsResource>();
    const { useList, del, confirm } = ctx.resource;
    const { list } = useList();
    // return <Space direction="vertical" style={{ width: "100%" }} size="large">
    //     {list?.map(group => <WordsTable key={group.id} group={group} />)}
    // </Space>
    const confirmDelete = confirm(del)
    return <Table<WordConfigGroup>
        dataSource={list}
        rowKey="id"
        size="middle"
        columns={[
            {
                title: "名称",
                dataIndex: "name"
            },
            {
                title: "类型",
                dataIndex: "type"
            },
            {
                title: "操作",
                render: (record: WordConfigGroup) => <Space>
                    {record.id > 0 ? <Button type="link" size="small" icon={<CloseOutlined />} danger
                        onClick={() => {
                            confirmDelete?.(record, "删除识别词组？", record.name)
                        }} /> : <></>}
                </Space>,
                align: "center",
                width: 100
            }
        ]}
        pagination={false}
        expandable={{
            expandedRowRender: (value) => {
                return <WordsTable group={value} />
            },
            defaultExpandAllRows: true
        }}
    />
}



function WordsTable(options: { group: WordConfigGroup }) {
    const { group } = options;
    const wordsTable: TableProps<WordConfig>['columns'] = [
        {
            title: "状态",
            dataIndex: "enabled",
            render: (value) => {
                return value ? <Tag color="green">启用</Tag> : <Tag color="blue">停用</Tag>
            },
            width: 100
        },
        {
            title: "被替换词",
            dataIndex: "replaced",
        },
        {
            title: "替换词",
            dataIndex: "replace",
        },
        {
            title: "偏移集数",
            dataIndex: "offset"
        },
        {
            title: "前定位词",
            dataIndex: "front"
        },
        {
            title: "后定位词",
            dataIndex: "back"
        },
        {
            title: "使用RegEx",
            dataIndex: "regex",
            render: (value) => value ? "RegEx" : "",
        },
        {
            title: "备注",
            dataIndex: "help"
        },
        {
            title: "操作",
            render(value) {
                return <WordConfigForm group={group} record={value} />
            },
            align: "center"
        }
    ]


    return <Table<WordConfig>
        rowKey="id"
        pagination={false}
        size="small"
        tableLayout="auto"
        dataSource={options.group.words}
        columns={wordsTable}
        footer={() => {
            return <WordConfigForm group={group} />
        }}
    />
}


const WordConfigTabs = [
    {
        label: "屏蔽",
        key: 1,
        children: <>
            <Form.Item name="replaced" label="被替换词">
                <Input />
            </Form.Item>
        </>
    },
    {
        label: "替换",
        key: 2,
        children: <>
            <Form.Item name="replaced" label="被替换词">
                <Input />
            </Form.Item>
            <Form.Item name="replace" label="替换词">
                <Input />
            </Form.Item>
        </>
    },
    {
        label: "替换+集偏移",
        key: 2,
        children: <>
            <Form.Item name="replaced" label="被替换词">
                <Input />
            </Form.Item>
            <Form.Item name="replace" label="替换词">
                <Input />
            </Form.Item>
        </>
    },

]

const ForItemDivider = ({ children }: { children: React.ReactNode }) => <Divider orientation="left" orientationMargin={0}>{children}</Divider>

const FormSection = ({ title, content, enable, onEnableChange }:
    {
        title: React.ReactNode, content: (enable: boolean, ctx: React.ReactNode) => React.ReactNode,
        enable: boolean, onEnableChange: (value: boolean,) => void
    }) => {
    const [en, setEnable] = useState(enable);
    useEffect(() => onEnableChange(en), [en])
    const checkContext = <Checkbox checked={en} onChange={(value) => setEnable(value.target.checked)}>{title}</Checkbox>;
    return <>
        <Divider orientation="left" orientationMargin={0}>
            <Space>

            </Space>
        </Divider>
        {content(en, checkContext)}
    </>
}


interface WordConfigFormData {
    replace: {
        enable: boolean,
        replaced: string,
        replace: string,
    },
    episodeOffset: {
        enable: boolean
        front: string,
        back: string,
        offset: string,
    }
    enabled: boolean,
    regex: number,
    help: string
}

const UseRegexCheckbox = (options: { value?: number, onChange?: (value: number) => void }) => {
    const [checked, setChecked] = useState(Boolean(options.value));
    const form = Form.useFormInstance<WordConfigFormData>()
    const episodeOffset = Form.useWatch('episodeOffset', form)
    const enable = useMemo(() => episodeOffset?.enable, [episodeOffset])
    useEffect(() => { if (enable) setChecked(true), [enable] });
    useEffect(() => {
        options.onChange?.(Number(checked));
    }, [checked])
    return <Checkbox checked={checked} disabled={enable}>正则表达式</Checkbox>
}

const ReplaceWordForm = () => {
    const form = Form.useFormInstance<WordConfigFormData>();
    const replace = Form.useWatch('replace', form)
    const enable = useMemo(() => replace?.enable, [replace])
    return <FormSection title="替换"
        enable={enable}
        onEnableChange={(value) => form.setFieldValue(['replace'], { ...replace, enable: value })}
        content={(enabled) => {
            return enabled ? <>
                < Form.Item name={["replace", "replaced"]} label="被替换词" >
                    <Input allowClear />
                </Form.Item>
                <Form.Item name={["replace", "replace"]} label="替换词">
                    <Input allowClear />
                </Form.Item> </> : <></>
        }}
    />
}


const EpisodeOffsetForm = () => {
    const form = Form.useFormInstance<WordConfigFormData>();
    const episodeOffset = Form.useWatch('episodeOffset', form)
    const enable = useMemo(() => episodeOffset?.enable, [episodeOffset])
    return <FormSection title="集偏移"
        enable={enable}
        onEnableChange={(value) => { console.log(value), form.setFieldValue(['episodeOffset'], { ...episodeOffset, enable: value }) }}
        content={(enabled) => {
            return enabled ? <>
                <Form.Item name={['episodeOffset', "front"]} label="前定位词">
                    <Input />
                </Form.Item>
                <Form.Item name={['episodeOffset', "back"]} label="后定位词">
                    <Input />
                </Form.Item>
                <Form.Item name={['episodeOffset', "offset"]} label="偏移集数">
                    <Input />
                </Form.Item>
            </> : <></>
        }}
    />
}

const WordConfigTab: TabsProps['items'] = [
    {
        key: '1',
        label: "屏蔽",
        children: <>
            <Form.Item name={"replaced"} label="被替换词" >
                <Input allowClear />
            </Form.Item>
        </>
    },
    {
        key: '2',
        label: "替换",
        children: <>
            <Form.Item name={"replaced"} label="被替换词" >
                <Input allowClear />
            </Form.Item>
            <Form.Item name={["replace"]} label="替换词">
                <Input allowClear />
            </Form.Item>
        </>
    },
    {
        key: '3',
        label: "替换及集偏移",
        children: <>
            <Form.Item name={"replaced"} label="被替换词" >
                <Input allowClear />
            </Form.Item>
            <Form.Item name={["replace"]} label="替换词">
                <Input allowClear />
            </Form.Item>
            <Form.Item name={["front"]} label="前定位词">
                <Input />
            </Form.Item>
            <Form.Item name={["back"]} label="后定位词">
                <Input />
            </Form.Item>
            <Form.Item name={["offset"]} label="偏移集数">
                <Input />
            </Form.Item>
        </>
    },
    {
        key: '4',
        label: "集偏移",
        children: <>
            <Form.Item name={["front"]} label="前定位词">
                <Input />
            </Form.Item>
            <Form.Item name={["back"]} label="后定位词">
                <Input />
            </Form.Item>
            <Form.Item name={["offset"]} label="偏移集数">
                <Input />
            </Form.Item>
        </>
    }
]

function WordConfigForm({ record, group }: { record?: WordConfig, group: WordConfigGroup }) {
    const [open, setOpen] = useState<boolean>(false)
    const [form] = Form.useForm<WordConfig>();

    const [type, setType] = useState(record?.type ?? 1);
    const { contextHolder, success, error, loading } = useSubmitMessage('识别词');
    const ctx = useCardsFormContext();
    const { refresh } = ctx.resource.useList();
    return <>{contextHolder}
        <Button size="small" type="link" onClick={() => setOpen(true)}>{record ? "编辑" : "添加"}</Button >
        <Drawer open={open} size="large" onClose={() => setOpen(false)}>
            <Form<WordConfig>
                form={form} initialValues={{ season: -1, enabled: true, regex: false, ...record }} layout="vertical" onFinish={(value) => {
                    const config = { ...record, ...value, type: type }
                    console.log(config)
                    loading();
                    new Words().updateWord(group, config)
                        .then(() => {
                            success();
                            refresh();
                        })
                        .catch(e => {
                            error(e);
                        })
                }}>

                <Form.Item name="enabled" valuePropName="checked">
                    <Checkbox>启用</Checkbox>
                </Form.Item>
                {group.type == 2 ?
                    <Form.Item name="season" label="季" style={{ width: 100 }}>
                        <Input />
                    </Form.Item>
                    :
                    <></>}
                <Form.Item name="help" label="备注">
                    <Input />
                </Form.Item>

                <Tabs items={WordConfigTab} defaultActiveKey={String(type)}
                    onChange={(key) => {
                        const type = Number(key)
                        setType(type);
                        if (type >= 3) {
                            form.setFieldValue('regex', 1);
                        }
                    }}></Tabs>
                <Form.Item name="regex" valuePropName="checked" >
                    <Checkbox disabled={type >= 3}>使用正则表达式</Checkbox>
                </Form.Item>
            </Form >
            <Button type="primary" onClick={() => form.submit()}>保存</Button>
        </Drawer >
    </>
}