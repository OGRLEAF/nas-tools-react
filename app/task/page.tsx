"use client"
import React, { useEffect, useState } from "react";
import { API, Task, Subtask } from "../utils/api";
import { Section } from "../components/Section";
import { Collapse, Timeline, Space, Typography, Tag, theme } from "antd";

const SearchTaskBrief = ({ task }: { task: Subtask }) => {

}

const TaskCard = ({ task }: { task: Task }) => {
    const subtasks = task.subtasks.map((item) => {
        return {
            // label: item.type,
            children: <Space direction="vertical">
                <span> {item.type} <Tag color="green">{item.status}</Tag></span>
                <span>
                    deaf
                </span>
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

    useEffect(() => {
        API.getNastoolInstance()
            .then(async nt => {
                const list = await nt.getTaskList()
                console.log(list)
                setTasks(list)
            })
    }, [])
    return <Section title="任务">
        <Collapse
            bordered={false}
            style={{ background: token.colorBgContainer }}
            items={tasks.map((task) => ({
                key: task.start_time,
                label: "任务",
                children: <div style={{ margin: "16px 0 0 16px" }}><TaskCard task={task} /></div>,
                style: panelStyle
            }))}
        />
    </Section>
}