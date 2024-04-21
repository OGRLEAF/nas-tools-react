import React, { useEffect, useState } from 'react'
import { useServerEvent } from '../utils/api/message/ServerEvent'
import { Divider, Drawer, Flex, Popover, Space, Tag } from 'antd'
import { TaskflowCard, useTaskflowStatus } from './taskflow/TaskflowCard'
import { Taskflow, TaskflowInfo } from '../utils/api/taskflow'
import { useTaskflowList } from './taskflow/TaskflowContext'




export default function Taskbar() {
    const { list } = useTaskflowList();
    return <Flex style={{ overflow: "auto" }} >
        <Divider type="vertical" />
        <Space style={{ maxWidth: "100%", overflow: "auto", }}>
            {list.toReversed().map((taskflow) => {
                return <TaskbarItem key={taskflow.id} taskflow={taskflow} />
            })}
        </Space>
    </Flex>
}

function TaskbarItem({ taskflow }: { taskflow: TaskflowInfo }) {
    const taskflowStatus = useTaskflowStatus()
    const status = taskflowStatus[taskflow.status];
    const [open, setOpen] = useState(false);
    return <Tag style={{ marginRight: 0 }}
        onClick={() => { setOpen(true) }}
        color={status.type}
        key={taskflow.id} icon={status.icon}>
        <Popover content={<TaskflowCard id={taskflow.id} />}
            overlayInnerStyle={{ padding: 0 }}
            overlayStyle={{ maxWidth: "50%", maxHeight: "50%", overflow: "auto" }}>
            {taskflow.name}
        </Popover>
        {/* <Drawer open={open} onClose={() => { setOpen(false) }} title={taskflow.name} >
           
        </Drawer> */}
    </Tag>
}