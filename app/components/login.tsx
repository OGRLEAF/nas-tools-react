"use client"
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Button, Modal, Form, Input, Checkbox } from 'antd';
import { NASTOOL, NastoolConfig, API, NastoolLoginConfig } from '../utils/api/api';
import { resolve } from 'path';
import { APIContext } from '../utils/api/api_base';
type FieldType = {
    username: string,
    password: string,
    remember: boolean
}

class Deferred<T> {
    public promise: Promise<T>;
    public reject: (reason: any) => void = () => { };
    public resolve: (values: T) => void = (values) => { };
    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.reject = reject
            this.resolve = resolve
        })

    }
}

const deferred = new Deferred<NastoolLoginConfig>();

const LoginModal = () => {
    const [nastoolConfig, setNastoolConfig] = useState<NastoolConfig>();
    const [loginConfig, setLoginConfig] = useState<NastoolLoginConfig>();
    const apiContext = useContext(APIContext);
    const [modal, contextHolder] = Modal.useModal();
    useEffect(() => {
        const https = window.location.protocol == "https:"
        setNastoolConfig(
            {
                https,
                host: window.location.hostname,
                port: Number(window.location.port) || (https ? 443 : 80),
            })
    }, [])

    useEffect(() => {
        if (nastoolConfig && loginConfig) {
            console.log("Login", nastoolConfig, loginConfig)
            const nastool = new NASTOOL(nastoolConfig);
            nastool.login(loginConfig)
                .then((value) => {
                    if (value) {
                        apiContext.setAPI(nastool)
                    }
                })
        }
    }, [nastoolConfig, loginConfig])
    let t = { v: 1 };
    let onFinish: ((values: any) => void) = (values) => { console.log("unregistried.", values, t.v) };
    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };

    const [form] = Form.useForm();

    const LoginForm = <Form
        form={form}
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
    >
        <Form.Item<FieldType>
            label="用户名"
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
        >
            <Input />
        </Form.Item>

        <Form.Item<FieldType>
            label="密码"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
        >
            <Input.Password />
        </Form.Item>

        <Form.Item<FieldType>
            name="remember"
            valuePropName="checked"
            wrapperCol={{ offset: 8, span: 16 }}
        >
            <Checkbox>Remember me</Checkbox>
        </Form.Item>
    </Form>

    useEffect(() => {
        if (apiContext.API.loginState == false) {
            const { destroy } = modal.confirm({
                content: LoginForm,
                onOk: () => {
                    return form.validateFields()
                        .then((values) => {
                            const loginConfig = {
                                username: values.username,
                                password: values.password
                            }
                            setLoginConfig(loginConfig)
                            return true
                        })
                }
            })
            return () => destroy()
        }
    }, [apiContext.API, form])

    return <div>
        {contextHolder}
        {/* <Modal title="登录" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}
            zIndex={2000}>
           
        </Modal> */}
    </div>
};

export default LoginModal;