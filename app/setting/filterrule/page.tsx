"use client"
import CardnForm, { CardnFormContext } from "@/app/components/CardnForm";
import { IconAdd, IconDelete, IconEdit } from "@/app/components/icons";
import { FilterRuleGroup, FilterRuleGroupConfig, FilterRuleConfig } from "@/app/utils/api/filterrule";
import { Button, Checkbox, Col, ConfigProvider, Drawer, Form, Input, InputNumber, List, Modal, Row, Space, Tag, Flex } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons"
import { useForm } from "antd/es/form/Form";
import React, { useContext, useEffect, useState } from "react";
import { TabCards } from "@/app/components/CardnForm/TabCards";
import { useAPIContext } from "@/app/utils/api/api_base";


function useFilterRule() {
    const { API } = useAPIContext()
    if (API.loginState) {
        return new FilterRuleGroup(API)
    }
}

const IconText = ({ icon, text }: { icon: React.FC; text: string }) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);


const FilterRuleCard = ({ config }: { config: FilterRuleConfig }) => {
    const [openDrawer, setOpenDrawer] = useState(false);
    const cardnFormContext = useContext(CardnFormContext)
    const filterRule = useFilterRule()
    const deleteRule = () => {
        Modal.confirm({
            title: `确认删除规则${config.name}?`,
            content: <Space size="small" direction="vertical">
                <span>包含：{config.include}</span>
                <span>排除：{config.exclude}</span>
            </Space>,
            onOk: async () => {
                await filterRule?.rule.delete(config.id);
                cardnFormContext.success("删除成功");
                cardnFormContext.refresh();
            }
        })

    }
    return <List.Item
        style={{ width: "100%" }}
        actions={[
            <Button key="edit_btn" icon={<IconEdit />} type="link" size="small" onClick={() => setOpenDrawer(true)} style={{ padding: 0 }}>编辑</Button>,
            <Button key="delete_btn" icon={<IconDelete />} type="link" danger size="small" onClick={() => deleteRule()} style={{ padding: 0 }}>删除</Button >,
        ]}
    >
        <List.Item.Meta title={config.name} />
        <Space size="small" direction="vertical">
            <span>包含：{config.include}</span>
            <span>排除：{config.exclude}</span>
        </Space>
        <Drawer size="large" open={openDrawer} onClose={() => setOpenDrawer(false)}>
            <FilterRuleEditForm initialValue={config} />
        </Drawer>
    </List.Item>
}


export default function FilterRulePage() {
    const filterRule = useFilterRule()
    return <CardnForm<FilterRuleGroupConfig>
        title="过滤规则"
        onFetch={async (): Promise<FilterRuleGroupConfig[]> => await (filterRule?.list() ?? [])}
        onDelete={async (record) => { (await filterRule?.delete(record.id)); return true }}
        layout="vertical"
        formRender={
            function ({ record }: { record?: FilterRuleGroupConfig | undefined; }): React.JSX.Element {
                return <FilterRuleGroupEditForm initialValue={record} />
            }
        }
    >
        <TabCards
            tabsProps={{
                tabPosition: "left",
                type: "editable-card",
                removeIcon: <></>
            }}
            cardProps={(record: FilterRuleGroupConfig) => {
                return ({
                    title: <Space>{record.name}{record.default ? <Tag bordered={false} color="blue">默认</Tag> : <></>}</Space>,
                    description: <Space direction="vertical" size="small" style={{ alignItems: "stretch", width: "100%", }}>
                        <FilterRuleList filterRuleGroup={record} />
                    </Space>
                });
            }}
        />
    </CardnForm>
}

const defaultRuleConfig: FilterRuleConfig = {
    group: 0,
    name: "",
    pri: "",
    include: [],
    exclude: [],
    size: "",
    free: ""
}

function FilterRuleList({ filterRuleGroup }: { filterRuleGroup: FilterRuleGroupConfig }) {
    const [isDefault, setDefault] = useState(filterRuleGroup.default)
    const ctx = useContext(CardnFormContext);
    const filterRule = useFilterRule()
    const execDefault = async () => {
        ctx.loading("默认")
        const msg = await filterRule?.setDfault(filterRuleGroup.id)
        ctx.success(JSON.stringify(msg));
        ctx.refresh();
    }
    useEffect(() => {
        if (!filterRuleGroup.default) {
            setDefault(false)
        }
    }, [filterRuleGroup.default])
    const [openDrawer, setOpenDrawer] = useState(false)
    return <>
        <Flex style={{ width: "100%", justifyContent: 'space-between' }} >
            <Space>
                <Checkbox checked={isDefault}
                    onChange={(value) => {
                        if (value) {
                            setDefault(true);
                            execDefault();
                        }
                    }}>设为默认</Checkbox>

                <Button onClick={() => ctx.performDelete(filterRuleGroup, {title: filterRuleGroup.name, description: filterRuleGroup.name})} icon={<IconDelete />} type="text" danger>删除规则组</Button>
            </Space>
            <Button onClick={() => setOpenDrawer(true)} icon={<IconAdd />} type="primary">新增规则</Button>
            <Drawer size="large" open={openDrawer} onClose={() => setOpenDrawer(false)}>
                <FilterRuleEditForm initialValue={{ ...defaultRuleConfig, group: filterRuleGroup.id }} />
            </Drawer>
        </Flex>
        <ConfigProvider
            theme={{
                components: {
                    List: {
                        titleMarginBottom: 0
                    }
                }
            }}
        >
            <List style={{ width: "100%" }}
                itemLayout="vertical"
                dataSource={filterRuleGroup.rules}
                renderItem={(item, index) => {
                    return <FilterRuleCard config={item} />
                }}
            >

            </List>
        </ConfigProvider>
    </>
}
interface FilterRuleGroupFormData {
    name: string,
    default: boolean
}

function FilterRuleGroupEditForm(options: { initialValue?: FilterRuleGroupFormData }) {
    const ctx = useContext(CardnFormContext);
    const filterRule = useFilterRule()
    const onUpdate = async (values: FilterRuleGroupFormData) => {
        console.log(values)
        ctx.loading(values.name)
        await filterRule?.add({ name: values.name, default: values.default })
            .then((res) => {
                ctx.success(JSON.stringify(res))
                ctx.refresh();
                ctx.exit();
            })
            .catch((e) => {
                ctx.error(e);
            })
    }
    return <Form initialValues={{ name: options.initialValue?.name, default: options.initialValue?.default ?? false }} layout="vertical" onFinish={onUpdate}>
        <Form.Item name="name" label="规则组名称">
            <Input />
        </Form.Item>
        <Form.Item name="default" valuePropName="checked">
            <Checkbox>设为默认</Checkbox>
        </Form.Item>
        <Form.Item>
            <Button htmlType="submit" type='primary'>保存</Button>
        </Form.Item>
    </Form>
}

interface FilterRuleFormData {
    name: string,
    pri: number,
    include: string[],
    exclude: string[],
    size: [number, number],
    free: [number, number] | undefined
}

function FilterRuleEditForm(options: { initialValue: FilterRuleConfig }) {
    const { initialValue } = options;
    const formData: FilterRuleFormData = {
        name: initialValue.name,
        pri: Number(initialValue.pri),
        include: initialValue.include,
        exclude: initialValue.exclude,
        size: (() => {
            const values = initialValue.size.split(",")
            if (values.length == 0) return [0, 0];
            else if (values.length == 1) return [0, Number(values[0])]
            else return [Number(values[0]), Number(values[1])]
        })(),
        free: (() => {
            const [n1, n2] = initialValue.free?.split(" ").map(Number) ?? [-1, -1]
            return [n1, n2]
        })()
    }

    const [form] = useForm();
    useEffect(() => form.setFieldsValue(formData), [formData]);
    const ruleFormList = (name: string) => <Form.List name={[name]}>
        {(fields, { add, remove }) => <>
            {fields.map((field) => (
                <Row gutter={16} key={field.key}>
                    <Col span={22}>
                        <Form.Item name={[field.name]} required>
                            <Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} />
                        </Form.Item>
                    </Col>
                    <Col span={2}>
                        <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                    </Col>
                </Row>))}
            <Row>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add field
                </Button>
            </Row>
        </>}
    </Form.List>
    const ctx = useContext(CardnFormContext)

    const filterRule = useFilterRule()
    return <Form form={form} initialValues={formData} layout="vertical"
        onFinish={async (values: FilterRuleFormData) => {
            ctx.loading("更新")
            const result = await filterRule?.rule.update({
                id: initialValue.id,
                group: initialValue.group,
                name: values.name,
                pri: String(values.pri),
                include: values.include,
                exclude: values.exclude,
                size: (() => {
                    if (values.size[0] == 0) {
                        if (values.size[1] == 0) {
                            return ""
                        }
                        return String(values.size[1])
                    }
                    else return `${values.size[0]},${values.size[1]}`
                })(),
                free: (() => {
                    if (values.free)
                        return `${values.free?.[0] <= 0 ? values.free[0] : 0} ${values.free[1] <= 0 ? values.free[1] : 0}`
                    else
                        return ""
                })()
            })
            ctx.success(JSON.stringify(result))
            ctx.refresh();
        }}>
        <Form.Item label="名称" name="name">
            <Input />
        </Form.Item>
        <Form.Item label="优先级" name="pri">
            <InputNumber inputMode="decimal" />
        </Form.Item>
        <Form.Item label="包含规则" name="include">
            {ruleFormList("include")}
        </Form.Item>
        <Form.Item label="排除规则" name="exclude">
            {ruleFormList("exclude")}
        </Form.Item>
        <Form.Item label="体积限制（GB）" name="size">
            <InfiniteSlider />
        </Form.Item>
        <Form.Item label="促销">
            <Space>
                <Form.Item label="下载倍率" name={["free", 0]}>
                    <InputNumber addonBefore="<" suffix="x" />
                </Form.Item>
                <Form.Item label="上传倍率" name={["free", 1]}>
                    <InputNumber addonBefore=">" suffix="x" />
                </Form.Item>
            </Space>
        </Form.Item>
        <Form.Item>
            <Button htmlType="submit" type='primary'>保存</Button>
        </Form.Item>
    </Form>
}

function InfiniteSlider({ value, onChange, }: { value?: [number, number], onChange?: (value: [number, number]) => void }) {
    const [topValue, setTopValue] = useState(value?.[1] ?? 0)
    const [botValue, setBotValue] = useState(value?.[0] ?? 0)
    useEffect(() => {
        if (onChange) onChange([botValue, topValue])
    }, [topValue, botValue])
    return <Space size="large">
        <Form.Item label={<Checkbox disabled={topValue <= 0} checked={botValue > 0} onChange={((value) => { if (!value.target.checked) setBotValue(0); else setBotValue(1) })}>下限</Checkbox >}>
            <InputNumber disabled={botValue <= 0 || topValue <= 0} value={botValue} onChange={(value) => { if (value != null) setBotValue(value) }} addonBefore=">" addonAfter="GB" />
        </Form.Item>
        <Form.Item label={<Checkbox checked={topValue > 0} onChange={((value) => { if (!value.target.checked) { setTopValue(0); setBotValue(0) } else setTopValue(1) })}>上限</Checkbox >}>
            <InputNumber disabled={topValue <= 0} value={topValue} onChange={(value) => { if (value != null) setTopValue(value) }} addonBefore="<" addonAfter="GB" />
        </Form.Item>
    </Space>
}
