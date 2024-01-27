"use client"
import { Cards, CardsForm } from "@/app/components/CardsForm";
import { Plugin, PluginFormFieldDetails, PluginFormFieldSelectGroup, PluginFormFieldSwitch, PluginFormFieldText, PluginFormFieldTextArea, PluginFormItem, PluginFormItemDiv, PluginProfile, PluginResource } from "@/app/utils/api/plugin";
import { Button, Divider, Flex, Form, Input, SelectProps, Space, Switch, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons"
import React from "react";
import { TagCheckboxGroup } from "@/app/components/TagCheckbox";
import { values } from "lodash";
import { IconCubes, IconEdit } from "@/app/components/icons";
import Link from "next/link";
import { PluginIcon } from "./PluginIcon";


export default function PluginPage() {
    return <CardsForm<PluginResource>
        title="插件"
        resource={Plugin}
        extra={() => <Link href="/setting/plugin/repo"><Button icon={<IconCubes />} >插件库</Button></Link>}
        formComponent={PluginConfigForm}
    >
        <Cards<PluginResource>
            spaceProps={{ wrap: true, align: "start" }}
            cardProps={(record) => {
                return {
                    "title": record.name,
                    "description": record.desc,
                    "cover": <PluginIcon src={`/static/img/plugins/${record.icon}`} />
                }
            }}
        />
    </CardsForm>
}

function PluguinConfigFormItem({ item }: { item: PluginFormItem }) {
    switch (item.type) {
        case "div": {
            const divItem: PluginFormItemDiv = item as PluginFormItemDiv;
            const content = divItem.content.map((value, idx) => {
                return <Flex style={{ width: "100%" }} wrap={"wrap"} key={idx}>
                    {value.map((value, idx) => <PluguinConfigFormItem key={idx} item={value} />)}
                </Flex>
            })
            return <Flex style={{ width: "100%" }} wrap={"wrap"}>{content}</Flex>
        }
        case "details": {
            const detail: PluginFormFieldDetails = item as PluginFormFieldDetails;
            return <div style={{ width: "100%" }}>
                <Divider orientation="left" orientationMargin={0} style={{ marginTop: 0 }}>
                    <Space style={{ width: "100%" }}>
                        <span>{detail.summary}</span>
                        <Tooltip title={detail.tooltip}><QuestionCircleOutlined size={4} style={{ color: "#00000073" }} /></Tooltip>
                    </Space>
                </Divider>
                {
                    detail.content.map((value, idx) => {
                        // return value.map((value, idx) => <PluguinConfigFormItem key={idx} item={value} />)
                        return <Flex key={idx} style={{ width: "100%", }}>
                            {value.map((value, idx) => <PluguinConfigFormItem key={idx} item={value} />)}
                        </Flex>
                    })
                }
            </div>
        } case "switch": {
            const field: PluginFormFieldSwitch = item as PluginFormFieldSwitch;
            return <Form.Item required={field.required == "required"} name={field.id} label={field.title} tooltip={field.tooltip} style={{}} valuePropName="checked" >
                <Switch />
            </Form.Item>
        }
        case "textarea":
            const field: PluginFormFieldTextArea = item as PluginFormFieldTextArea;
            const value = field.content
            return <Form.Item
                required={field.required == "required"}
                name={value.id} key={value.id} label={field.title} tooltip={field.tooltip}
                style={{ width: "100%", flexShrink: 0 }}>
                <Input.TextArea placeholder={value.placeholder + field.title} style={{ width: "100%" }} />
            </Form.Item>
        case "text": {
            const field: PluginFormFieldText = item as PluginFormFieldText;
            const InputComp = item.type == "text" ? Input : Input.TextArea;
            if (field.content.length == 1) {
                const value = field.content[0];
                return <Form.Item
                    required={field.required == "required"}
                    name={value.id} key={value.id} label={field.title} tooltip={field.tooltip} style={{ width: "100%" }}>
                    <InputComp placeholder={value.placeholder} />
                </Form.Item>
            }
            else return <Space style={{ width: "100%" }}>{
                field.content.map((value) => <Form.Item
                    required={field.required == "required"}
                    name={value.id} key={value.id} label={field.title} tooltip={field.tooltip} style={{ width: "100%" }}>
                    <Input placeholder={value.placeholder} />
                </Form.Item>)}
            </Space>
            // else if(item.type == )
        } case "form-selectgroup": {
            const field: PluginFormFieldSelectGroup = item as PluginFormFieldSelectGroup;
            const items = Object.entries(field.content).map(([key, value]) => ({
                label: value.name,
                value: String(key)
            }))
            return <Form.Item required={field.required == "required"} name={field.id} >
                <TagCheckboxGroup options={items} />
            </Form.Item>
        }
    }
}

function PluginConfigForm({ record, onChange }: { record?: PluginResource['ItemType'], onChange?: (value: PluginProfile) => void }) {

    if (record) {
        return <>
            {/* {record.name} <br />
            {record.desc} */}
            <Form initialValues={record.config} layout="vertical"
                onFinish={(value) => {
                    console.log(value)
                    const updateRecord = { ...record, config: { ...record?.config, ...value } };
                    onChange?.(updateRecord)
                }}
            >
                {record.fields.map((value, idx) => <PluguinConfigFormItem key={idx} item={value} />)}
                <Form.Item>
                    <Button htmlType="submit" type="primary">保存</Button>
                </Form.Item>
            </Form>
        </>
    }

}