"use client"
import React, { useEffect } from 'react'
import { Button, Card, Col, Form, Row, Space, Spin } from "antd"
import { API, NastoolServerConfig } from '@/app/utils/api/api';
import type { FormInstance } from 'antd/es/form';
import { useSubmitMessage } from '@/app/utils';
import { ServerConfig } from '@/app/utils/api/serverConfig';


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
        await (new ServerConfig()).update(value)
            .then((res) => {
                success(String(res));
            }).catch(res => error(res))
    }

    // const [form] = Form.useForm();
    // useEffect(() => {
    //     form.setFieldsValue(config)
    // }, [config, form])


    // const SubmitButton = <Button htmlType="submit" type='primary' onClick={() => { form.submit() }}>保存</Button>

    return <Spin spinning={config == undefined}>
        <Card title={name} >
            {
                config && <Form
                    initialValues={config}
                    layout='vertical'
                    onFinish={onFinished} >
                    {contextHolder}
                    <SettingForm config={config} />
                    <Form.Item noStyle>
                        <Button htmlType="submit" type='primary'>保存</Button>
                    </Form.Item>
                </Form>
            }
        </Card>
    </Spin>
}
