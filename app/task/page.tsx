"use client"
import React, { ReactNode, useEffect, useState } from "react";
import { Section } from "../components/Section";
import { Collapse, Timeline, Space, Typography, Tag, theme, List, Alert, AlertProps, Button, Empty } from "antd";
import { useAPIContext, useResource } from "../utils/api/api_base";
import { Taskflow, TaskflowResource, TaskflowInfo, Task, TaskState } from "../utils/api/taskflow";
import { useServerEvent } from "../utils/api/message/ServerEvent";

const TaskCardStatus = ({ state, children: children }: { state: TaskState, children?: ReactNode }) => {
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
    const altert = defaultAlterts[state.status]
    return <>
        {altert.message}
        {/* <Alert message={altert.message} description={children} type={altert.type} showIcon /> */}
    </>
}

const timeLineStateColor: Record<string, string> = {
    "wait": "blue",
    "finished": "green",
    "exited": "red",
    "timeout": "red",
    "running": "blue",
    "unknown": "grey"
}
const TaskCard = ({ taskflow }: { taskflow: TaskflowInfo }) => {
    const subtasks = taskflow.tasks.map((item) => {
        const [taskMeta, taskState] = item;
        return {
            // label: item.type,
            children: <Space direction="vertical" style={{ width: "100%" }}>
                <Space>
                    <span>
                        {taskMeta.type}
                    </span>
                    {taskState ? <TaskCardStatus state={taskState}></TaskCardStatus> : <>未运行</>}
                </Space>
                {
                    taskState && <>
                        <List dataSource={taskState.logs} renderItem={(item) => (
                            <div>{item.msg}</div>
                        )} />
                    </>
                }
            </Space>,
            color: timeLineStateColor[taskState?.status ?? "unknown"]
        }
    })
    return <Space direction="vertical">
        <span>{new Date(taskflow.start_time * 1000).toLocaleString()}</span>
        <Timeline items={subtasks} />
    </Space>
}

export default function TaskflowPage() {
    const { useList } = useResource<TaskflowResource>(Taskflow);
    const { list: tasks, refresh } = useList();
    const { token } = theme.useToken();
    const panelStyle: React.CSSProperties = {
        marginBottom: 24,
        paddingLeft: 12,
        borderRadius: token.borderRadiusLG,
        border: "solid #ccc 1px",
        backgroundColor: token.colorBgContainer,
    }
    const { msg, msgs, } = useServerEvent('task_event')
    useEffect(() => {
        if (msg) {
            if (msg.type === "task_event") {
                refresh();
            }
        }
    }, [msg, refresh])
    const { API } = useAPIContext();
    return <Section title="任务" onRefresh={() => { refresh() }} >
        <Space direction="vertical" style={{ width: "100%" }}>
            <Button onClick={() => {
                API.launchTaskflow("example_flow", { count: 1 })
            }}>运行测试  {tasks?.length}</Button>
            {tasks?.length ?
                <Collapse
                    size="small"
                    bordered={false}
                    defaultActiveKey={[tasks[0].start_time ?? "0"]}
                    items={tasks.map((taskflow) => ({
                        key: taskflow.start_time,
                        label: "任务",
                        children: <TaskCard taskflow={taskflow} />,
                        style: panelStyle
                    }))}
                /> : <Empty description="暂无任务" />
            }
        </Space>
    </Section>
}