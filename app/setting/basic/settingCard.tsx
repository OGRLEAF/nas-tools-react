"use client"
import React from 'react'
import { Button, Card, Col, Form, Row, Space } from "antd"
import { NastoolServerConfig } from '@/app/utils/api';

export default function SettingCard(
    { settingForm, name, config }:
        {
            settingForm: (options: { config?: NastoolServerConfig }) => React.JSX.Element,
            name: string,
            config?: NastoolServerConfig
        }) {
    const SettingForm = settingForm;
    const [form] = Form.useForm();

    const ChildrenWrapper = () => {
        if (config) {
            return <>
                <Form form={form}
                    initialValues={config}
                    layout='vertical'>
                    <SettingForm config={config} />
                </Form>
            </>
        } else {
            return <></>
        }
    };
    const SubmitButton = () => {
        return (
            <Button type='primary'>保存</Button>)
    }
    return <Card title={name}
        extra={<Button type='primary'>保存</Button>}>
        <ChildrenWrapper />
        {/* <Row>
            <Col span={21}></Col>
            <Col span={3}>
                <Button type='primary'>保存</Button>
            </Col>
        </Row> */}
    </Card>
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