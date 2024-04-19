"use client"
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { Section } from "../components/Section";
import { Collapse, Timeline, Space, Typography, Tag, theme, List, Alert, AlertProps, Button, Empty, Card } from "antd";
import { useAPIContext, useEventDataPatch, useResource } from "../utils/api/api_base";
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
        {altert?.message ?? state.status}
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
        const { draft: taskMeta, instance: taskState } = item;
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
                            item ? <div>{item.msg}</div> : "error"
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
    const listResoure = useList()
    const { list: tasks, refresh, setList } = listResoure;
    const { token } = theme.useToken();
    const panelStyle: React.CSSProperties = {
        marginBottom: 24,
        paddingLeft: 12,
        borderRadius: token.borderRadiusLG,
        border: "solid #ccc 1px",
        backgroundColor: token.colorBgContainer,
    }
    useEventDataPatch(listResoure, 'task_event')

    const { API } = useAPIContext();
    const sortedTasks = useMemo(() => tasks ? tasks.sort((a, b) => b.start_time - a.start_time) : [], [tasks])
    return <Section title="任务" onRefresh={() => { refresh() }} >
        <Space direction="vertical" style={{ width: "100%" }}>
            <Button onClick={() => {
                API.launchTaskflow("example_flow", { count: 1 })
            }}>运行测试 {tasks?.length}</Button>
            {
                sortedTasks ? sortedTasks.map((taskflow) => <Card key={taskflow.id} title={taskflow.id}>
                    <TaskCard taskflow={taskflow} /> 
                </Card>)
                    : <Empty description="暂无任务" />
            }
        </Space>
    </Section>
}