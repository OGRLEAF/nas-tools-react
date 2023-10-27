"use client"
import { Section } from "@/app/components/Section";
import { Button, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons"
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function DownloadedPage() {
    const [param, setParam] = useState<string>()
    const [state, setState] = useState(0);
    const pathParam = useParams();
    useEffect(() => {
        setParam(pathParam.state as string)
    }, [pathParam])
    return <Section title="下载任务"
        extra={
            <Space>
                <Button icon={<PlusOutlined />}
                    onClick={() => setState(state + 1)}
                    type="primary">添加下载任务</Button>
            </Space>
        }>
        {param} - {state}
    </Section>
}