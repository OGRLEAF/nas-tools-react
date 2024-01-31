"use client"
import React, { ReactNode, useEffect, useState } from "react";
import { API, Task, Subtask, TaskStatus } from "../utils/api/api";
import { Section } from "../components/Section";
import { Collapse, Timeline, Space, Typography, Tag, theme, List, Alert, AlertProps } from "antd";
import { useAPIContext } from "../utils/api/api_base";

const SearchTaskBrief = ({ task }: { task: Subtask }) => {

}

const TaskCardStatus = ({ status, children: children }: { status: TaskStatus, children?: ReactNode }) => {
    const defaultAlterts: Record<string, { message: string, type: AlertProps["type"] }> = ({
        wait: {
            message: "等待中",
            type: "info"
        },
        finished: {
            message: "已完成",
            type: "success",
        },
        exited: {
            message: "已退出",
            type: "error"
        },
        timeout: {
            message: "超时",
            type: "error"
        },
        running: {
            message: "正在运行",
            type: "info"
        }
    })
    const altert = defaultAlterts[status]
    return <>
        <Alert message={altert.message} description={children} type={altert.type} showIcon />
    </>
}
const TaskCard = ({ task }: { task: Task }) => {
    const subtasks = task.subtasks.map((item) => {
        return {
            // label: item.type,
            children: <Space direction="vertical" style={{ width: "100%" }}>
                <Space> {item.type} </Space>
                <TaskCardStatus status={item.status}>
                    <List dataSource={item.log} renderItem={(item) => (<div>{item}</div>)} />
                </TaskCardStatus>
            </Space>,
            color: "green"
        }
    })
    return <>
        <Timeline items={subtasks} />
    </>
}

export default function TaskPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const { token } = theme.useToken();
    const panelStyle: React.CSSProperties = {
        marginBottom: 24,
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        border: "solid #ccc 1px"
    }

    const { API } = useAPIContext();
    useEffect(() => {
        (async nt => {
            const list = await nt.getTaskList()
            console.log(list)
            setTasks(list)
        })(API)
    }, [API])
    return <Section title="任务">
        <Collapse
            bordered={false}
            style={{ background: token.colorBgContainer }}
            defaultActiveKey={[tasks[0]?.start_time]}
            items={tasks.map((task) => ({
                key: task.start_time,
                label: "任务",
                children: <div style={{ margin: "16px 0 0 16px" }}><TaskCard task={task} /></div>,
                style: panelStyle
            }))}
        />
    </Section>
}