"use client"
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { Section } from "../components/Section";
import { Collapse, Timeline, Space, Typography, Tag, theme, List, Alert, AlertProps, Button, Empty, Card, Flex } from "antd";
import { useAPIContext, useEventDataPatch, useResource } from "../utils/api/api_base";
import { Taskflow, TaskflowResource, TaskflowInfo, Task, TaskState } from "../utils/api/taskflow";
import { useServerEvent } from "../utils/api/message/ServerEvent";
import { useTaskflow, useTaskflowList } from "../components/taskflow/TaskflowContext";
import { TaskflowCard } from "../components/taskflow/TaskflowCard";

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
            content: <Space orientation="vertical" style={{ width: "100%" }}>
                <Space>
                    <span>
                        {taskMeta.type}
                    </span>
                    {taskState ? <TaskCardStatus state={taskState}></TaskCardStatus> : <>未运行</>}
                </Space>
                {
                    taskState && <List dataSource={taskState.logs} renderItem={(item) => (
                        item ? <div>{item.msg}</div> : "error"
                    )} />
                }
            </Space>,
            color: timeLineStateColor[taskState?.status ?? "unknown"]
        }
    })
    return <Space orientation="vertical">
        <span>{new Date(taskflow.start_time * 1000).toLocaleString()} {taskflow.status}</span>
        <Timeline items={subtasks} />
    </Space>
}

export default function TaskflowPage() {
    const taskflowList = useTaskflowList();
    const { API } = useAPIContext();
    const { list, refresh } = taskflowList;
    // const [currentId, setCurrentId] = useState<string | null>(null)
    const sortedTasks = useMemo(() => {
        if (list) {
            return [...list].sort((a, b) => b.start_time - a.start_time)
        }
        return []
    }, [list])
    const currentId = useMemo(() => sortedTasks[0]?.id, [sortedTasks]);
    return <Section title="任务" onRefresh={() => { refresh() }} >
        <Space orientation="vertical" style={{ width: "100%" }}>
            <Button onClick={async () => {
                const { taskflow_id } = await API.launchTaskflow("example_flow", { count: 1 })
                console.log(taskflow_id)
                // setCurrentId(taskflow_id)
            }}>运行测试 {sortedTasks.length}</Button>
            {currentId && <TaskflowCard id={currentId} />}
            <Flex vertical gap={16}>
                {
                    sortedTasks ? sortedTasks.map((taskflow) => <Card key={taskflow.id} title={taskflow.id}>
                        <TaskCard taskflow={taskflow} />
                    </Card>)
                        : <Empty description="暂无任务" />
                }

            </Flex>
        </Space>
    </Section>
}