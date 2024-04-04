"use client"
import React, { ReactNode, useEffect, useState } from "react";
import { Section } from "../components/Section";
import { Collapse, Timeline, Space, Typography, Tag, theme, List, Alert, AlertProps, Button } from "antd";
import { useAPIContext, useResource } from "../utils/api/api_base";
import { Taskflow, TaskflowResource, TaskflowInfo, Task, TaskState } from "../utils/api/taskflow";

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
    "running": "green",
    "unknown": "grey"
}
const TaskCard = ({ taskflow }: { taskflow: TaskflowInfo }) => {
    const subtasks = taskflow.tasks.map((item) => {
        const [taskMeta, taskState] = item;
        console.log(taskMeta, taskState)

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
    return <>
        <Timeline items={subtasks} />
    </>
}

export default function TaskflowPage() {
    const { useList } = useResource<TaskflowResource>(Taskflow);
    const { list: tasks } = useList();
    const { token } = theme.useToken();
    const panelStyle: React.CSSProperties = {
        marginBottom: 24,
        borderRadius: token.borderRadiusLG,
        border: "solid #ccc 1px"
    }

    const { API } = useAPIContext();
    return <Section title="任务">
        <Button onClick={() => {
            API.launchTaskflow("example_flow", { count: 1 })
        }}>运行测试</Button>
        {tasks?.length}
        <br />
        <Collapse
            bordered={false}
            style={{ background: token.colorBgContainer }}
            defaultActiveKey={[tasks?.[0]?.start_time ?? "0"]}
            items={tasks?.map((taskflow) => ({
                key: taskflow.start_time,
                label: "任务",
                children: <div style={{ margin: "16px 0 0 16px" }}>
                    <TaskCard taskflow={taskflow} />
                </div>,
                style: panelStyle
            }))}
        />
    </Section>
}