import React, { useState } from 'react'
import { Flex, Popover, Tag } from 'antd'
import { TaskflowCard, TaskflowCardContent, TaskflowCardTitle, useTaskflowStatus } from './taskflow/TaskflowCard'
import { TaskflowInfo } from '../utils/api/taskflow'
import { useTaskflowList } from './taskflow/TaskflowContext'
import "@/app/globals.scss"



export default function Taskbar() {
    const { list } = useTaskflowList();
    return <Flex className='small-scroll' style={{ overflowY: "auto", width: "100%", padding: 5 }} gap={6} >
        {list.toReversed().map((taskflow) => {
            return <TaskbarItem key={taskflow.id} taskflow={taskflow} />
        })}
    </Flex>
}

function TaskbarItem({ taskflow }: { taskflow: TaskflowInfo }) {
    const taskflowStatus = useTaskflowStatus()
    const status = taskflowStatus[taskflow.status];
    const [open, setOpen] = useState(false);
    return <Popover
        title={
            <div style={{ padding: "6px 12px" }}>
                <TaskflowCardTitle taskflow={taskflow} />
            </div>
        }
        content={
            <div style={{ maxHeight: "50vh", overflow: "auto" }}>
                <TaskflowCardContent taskflow={taskflow} />
            </div>
        }
        placement="bottomLeft"
        overlayInnerStyle={{ padding: 0 }}
        overlayStyle={{ width: "50%", backgroundColor: "unset", }}>
        <Tag style={{ marginRight: 0 }}
            onClick={() => { setOpen(true) }}
            color={status.type}
            key={taskflow.id} icon={status.icon}>
            <span style={{ cursor: "pointer" }}>{taskflow.name}</span>
        </Tag>
    </Popover>
    {/* <Drawer open={open} onClose={() => { setOpen(false) }} title={taskflow.name} >
           
        </Drawer> */}
}