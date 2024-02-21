import { Button, Drawer, Form, Input, Popconfirm, theme } from "antd";
import React, { useState } from "react";
import { IconCronExpr } from "./icons";

interface CronInputProps {
    value?: string,
    onChange?: (value?: string) => void
}



export function CronInput(props: CronInputProps) {
    const { token } = theme.useToken();
    const [openEditor, setOpenEditor] = useState(false)
    return <><Input suffix={
        <div onClick={() => setOpenEditor(true)}>
            <IconCronExpr style={{ color: token.colorTextDescription }} />
        </div>

    } />
        <Drawer size="large" open={openEditor} >
            <CronEditor />
        </Drawer>
    </>
}


function CronEditor() {
    return <>
        <Form layout="vertical">
            <Form.Item label="分钟">
                <Input />
            </Form.Item>
            <Form.Item label="小时">
                <Input />
            </Form.Item>
        </Form>
    </>
}

function CronValueInput() {
    return <></>
}