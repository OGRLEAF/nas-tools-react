"use client"
import React from 'react'
import { Button, Card, Col, Form, Row, Space } from "antd"
import { API, NastoolServerConfig } from '@/app/utils/api';
import type { FormInstance } from 'antd/es/form';


const SubmitButton = () => {
    return (
        <Form.Item noStyle>
            <Button htmlType="submit" type='primary'>保存</Button>
        </Form.Item>)
}

export default function SettingCard(
    { settingForm, name, config }:
        {
            settingForm: (options: { config?: NastoolServerConfig }) => React.JSX.Element,
            name: string,
            config?: NastoolServerConfig
        }) {
    const SettingForm = settingForm;
    const [form] = Form.useForm();


    const onFinished = async (value: NastoolServerConfig) => {
        console.log(value)
        const nt = await API.getNastoolInstance()

        nt.updateServerConfig(value)
    }
    if (config) {
        return <Form form={form}
            initialValues={config}
            layout='vertical'
            onFinish={onFinished} >
            <Card title={name}
                extra={<SubmitButton />}>
                <SettingForm config={config} />
            </Card>
        </Form>
    } else {
        return <Card loading={true} />
    }
}


// export default function SettingCard(
//     { children, name }:
//         {
//             children: React.ReactNode,
//             name: string
//         }) {
//     // const ChildrenWrapper = ()=> <>{children}</>;
//     return <Card title={name}>
//         {children}
//     </Card>
// }