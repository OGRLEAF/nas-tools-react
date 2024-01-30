"use client"
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button, Modal, Form, Input, Checkbox, Alert, Space, FormInstance } from 'antd';
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
    const apiContext = useContext(APIContext);
    const [modal, contextHolder] = Modal.useModal();
    const [tryRestore, setTryRestore] = useState(false)
    useEffect(() => {
        const https = window.location.protocol == "https:"
        const nastoolConfig = {
            https,
            host: window.location.hostname,
            port: Number(window.location.port) || (https ? 443 : 80),
        }
        const nastool = new NASTOOL(nastoolConfig);
        nastool.restoreLogin()
            .then((value) => {
                if (value) apiContext.setAPI(nastool)
                setTryRestore(true)
            })
    }, [])

    const login = useCallback(async (loginConfig: NastoolLoginConfig) => {
        const https = window.location.protocol == "https:"
        const nastoolConfig = {
            https,
            host: window.location.hostname,
            port: Number(window.location.port) || (https ? 443 : 80),
        }
        if (nastoolConfig && loginConfig) {
            console.log("Login", nastoolConfig, loginConfig)
            const nastool = new NASTOOL(nastoolConfig);
            if (await nastool.login(loginConfig)) {
                return nastool
            } else {
                throw new Error("登陆失败")
            }
        }
    }, [nastoolConfig])

    let t = { v: 1 };
    let onFinish: ((values: any) => void) = (values) => { console.log("unregistried.", values, t.v) };
    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };

    const [message, setMessage] = useState<string | undefined>()
    const [form] = Form.useForm();

    const LoginForm = ({ form, message }: { message?: string, form: FormInstance<any> }) => <><Form
        form={form}
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        size="middle"
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
        {message && <Alert banner showIcon onClose={() => setMessage(undefined)} message={message}></Alert>}
    </Form>

    </>

    useEffect(() => {
        if (apiContext.API.loginState == false && tryRestore == true) {
            const { destroy, update } = modal.confirm({
                content: <LoginForm form={form} />,
                title: "登录",
                okText: "登录",
                onOk: (close) => {
                    (async () => {
                        const values = await form.validateFields();
                        const loginConfig = {
                            username: values.username,
                            password: values.password
                        };
                        try {
                            const api = await login(loginConfig)
                            if (api) {
                                apiContext.setAPI(api);
                                close();
                            }
                            console.log(api)
                        } catch (e) {
                            console.log(e)
                            setMessage(String(e))
                            update({ content: <LoginForm form={form} message={String(e)} /> })
                        }
                    })()
                }
            })
            return () => destroy()
        }
    }, [apiContext.API, form, tryRestore])

    return <div>
        {contextHolder}
        {/* <Modal title="登录" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}
            zIndex={2000}>
           
        </Modal> */}
    </div>
};

export default LoginModal;