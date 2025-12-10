import React, { useEffect, useMemo, useState } from 'react'
import { useTaskflow, useTaskflowList } from './TaskflowContext';
import { Button, Card, Collapse, Divider, List, Progress, Space, Tag, theme } from 'antd';
import { TaskState, TaskflowInfo } from '@/app/utils/api/taskflow';
import { SyncOutlined, LoadingOutlined, CheckOutlined, RedoOutlined, ExclamationOutlined, CloseOutlined, ClockCircleOutlined } from "@ant-design/icons"
import dayjs, { Dayjs } from 'dayjs';
import _ from 'lodash';

interface StatusProps {
    message: string,
    type: "success" | "processing" | "error" | "default" | "warning",
    icon?: React.ReactNode,
}

export function useTaskflowStatus() {
    const { token } = theme.useToken();

    const taskflowStatusDefine: Record<TaskflowInfo['status'], StatusProps> = {
        ready: {
            message: "等待中",
            type: "default",
            icon: <SyncOutlined spin style={{ color: token.colorInfo }} />,
        },
        finished: {
            message: "已完成",
            type: "success",
            icon: <CheckOutlined style={{ color: token.colorSuccess }} />
        },
        exited: {
            message: "已退出",
            type: "error",
            icon: <CloseOutlined style={{ color: token.colorError }} />
        },
        running: {
            message: "正在运行",
            type: "processing",
            icon: <LoadingOutlined style={{ color: token.colorInfo }} />
        }
    }
    return taskflowStatusDefine
}


export function useTaskStatus() {
    const { token } = theme.useToken();

    const taskStatusDefine: Record<TaskState['status'], StatusProps> = ({
        wait: {
            message: "等待中",
            type: "default",
            icon: <SyncOutlined spin style={{ color: token.colorInfo }} />
        },
        finished: {
            message: "已完成",
            type: "success",
            icon: <CheckOutlined style={{ color: token.colorSuccess }} />
        },
        exited: {
            message: "已退出",
            type: "error",
            icon: <ExclamationOutlined style={{ color: token.colorError }} />
        },
        timeout: {
            message: "超时",
            type: "error"
        },
        running: {
            message: "正在运行",
            type: "processing",
            icon: <LoadingOutlined style={{ color: token.colorInfo }} />
        }
    })
    return taskStatusDefine;
}

export function TaskflowCard({ id }: { id: string }) {
    const { refresh } = useTaskflowList();
    const [taskflow] = useTaskflow(id);
    const { token } = theme.useToken()


    return <Card title={<TaskflowCardTitle taskflow={taskflow} />}
        extra={
            <Button type="text"
                size="small"
                onClick={() => { refresh() }}
                icon={<RedoOutlined style={{ color: token.colorPrimary }} />}></Button>
        }
        styles={{ title: { fontSize: 12 }, header: { padding: "10px 12px", minHeight: 0 }, body: { padding: 0 } }}>
        {taskflow && <TaskflowCardContent taskflow={taskflow} />}
    </Card>

}

export function TaskflowCardTitle({ taskflow }: { taskflow: TaskflowInfo | null }) {
    const taskflowStatus = useTaskflowStatus();
    if (taskflow) {
        const currentTaskflowStatus = taskflowStatus[taskflow.status];
        const dateStr = dayjs(taskflow.start_time * 1000).format("YYYY.MM.DD HH:mm:ss")
        return <Space><span>{currentTaskflowStatus.icon}</span>
            <span>{dateStr}</span>
            <span>{currentTaskflowStatus.message}</span>
        </Space>;
    } else {
        return <>等待任务</>
    }
}

export function TaskflowCardContent({ taskflow }: { taskflow: TaskflowInfo }) {
    const status = useTaskStatus()
    const [activeKeys, setActiveKeys] = useState<string[]>([])
    const runningTasks = useMemo(() => taskflow.tasks.find((item) => item.instance?.status === "running"), [taskflow]);
    useEffect(() => {
        setActiveKeys((oldKeys) => {
            const key = taskflow.tasks.findLastIndex((item, idx) => item.instance?.status === "running" || item.instance?.status === "exited")
            if (key >= 0) return [...oldKeys, String(key)];
            else return oldKeys
        })
    }, [runningTasks, taskflow.tasks])
    return <Collapse
        size="small"
        bordered={false}
        activeKey={activeKeys}
        onChange={(keys) => {
            if (typeof keys == "string") setActiveKeys([keys])
            else setActiveKeys(keys)
        }}
        items={taskflow.tasks.map((item, idx) => {
            const draft = item.draft
            if (item.instance != null) {
                const props = status[item.instance.status]
                return {
                    key: idx,
                    label: <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {item.instance.status == "running" ?
                            <Progress style={{ display: "inline-block" }} type="circle" percent={item.instance.progress * 100} size={15} /> : props.icon
                        }
                        <span style={{ display: "inline-block" }}>{draft.type}</span>

                    </div>,
                    children: <TaskLog logs={item.instance.logs}></TaskLog>
                }
            } else {
                return {
                    key: idx,
                    label: <Space>
                        <span><ClockCircleOutlined /></span>
                        <span>{draft.type}</span>
                    </Space>,
                    collapsible: "disabled"
                }
            }
        })}
    />
}

const LogLevelStateTag: Record<string, any> = {
    INFO: ["INFO", "blue"],
    DEBUG: ["DEBUG", "geekblue"],
    WARNING: ["WARN", "warning"],
    ERROR: ["ERROR", "error"]
}


export function TaskLog({ logs }: { logs: TaskState['logs'] }) {
    const { token } = theme.useToken();
    return <List
        split={false}
        size="small"
        dataSource={logs}
        renderItem={(item) => {
            const [levelText, color] = LogLevelStateTag[item.level];
            const dateStr = dayjs(item.create_time * 1000).format("YYYY.MM.DD HH:mm:ss")
            const label = <Tag variant="filled" color={color} style={{ marginRight: "8px" }}>{dateStr}<Divider orientation="vertical" />
                <div style={{ display: "inline-block", minWidth: "4em", }}>{levelText}</div>
            </Tag>
            return <List.Item style={{ fontSize: token.fontSizeSM, padding: "4px 0" }}>
                {label}{item.msg}
            </List.Item>
        }}
    />
}