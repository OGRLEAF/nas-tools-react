import React, { useState } from 'react';
import { Button, Modal, Form, Input, Checkbox } from 'antd';
import { NASTOOL, NastoolConfig, API, NastoolLoginConfig } from '../utils/api/api';
import { resolve } from 'path';
type FieldType = {
    username: string,
    password: string
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

const App: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const nastoolConfig = {
        https: true,
        host: "nastool-dev.service.home",
        port: 443,
    }

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    let t = { v: 1 };
    let onFinish: ((values: any) => void) = (values) => { console.log("unregistried.", values, t.v) };

    API.onNastoolConfigRequired = (): Promise<NastoolConfig> => {
        return new Promise((resolve) => resolve(nastoolConfig));
    }

    API.onNastoolLoginRequired = (): Promise<NastoolLoginConfig> => {
        showModal()
        return deferred.promise;
    }

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };

    const [form] = Form.useForm();

    const handleOk = () => {
        form.validateFields()
            .then((values) => {
                const loginConfig = {
                    username: values.username,
                    password: values.password
                }
                console.log("resolve!", values)
                deferred.resolve(loginConfig);
            })
        setIsModalOpen(false);
    };

    return (
        <>
            {/* <Button type="primary" onClick={showModal}>
                Login
            </Button> */}
            <Modal title="登录" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}
            zIndex={2000}>
                <Form
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

                    {/* <Form.Item<FieldType>
                        name="remember"
                        valuePropName="checked"
                        wrapperCol={{ offset: 8, span: 16 }}
                    >
                        <Checkbox>Remember me</Checkbox>
                    </Form.Item> */}
                </Form>
            </Modal>
        </>
    );
};

export default App;