"use client"
import React, { useEffect } from 'react'
import { Button, Card, Col, Form, Row, Space, Spin } from "antd"
import { API, NastoolServerConfig } from '@/app/utils/api/api';
import type { FormInstance } from 'antd/es/form';
import { useSubmitMessage } from '@/app/utils';


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

    const { contextHolder, success, error, loading } = useSubmitMessage(`settingCard-${name}`);

    const onFinished = async (value: NastoolServerConfig) => {
        loading(name);
        const nt = await API.getNastoolInstance()
        await nt.updateServerConfig(value)
            .then((res) => {
                success(String(res));
            }).catch(res => error(res))
    }

    const [form] = Form.useForm();
    useEffect(() => {
        form.setFieldsValue(config)
    }, [config])

    return <Spin spinning={config == undefined}>
        <Form form={form}
            initialValues={config}
            layout='vertical'
            onFinish={onFinished} >
            {contextHolder}
            <Card title={name}
                extra={<SubmitButton />}>
                <SettingForm config={config} />
            </Card>
        </Form>
    </Spin>
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