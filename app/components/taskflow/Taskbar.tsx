import React, { useMemo, useState } from 'react'
import { Flex, Popover, Progress, Tag, theme } from 'antd'
import { TaskflowCard, TaskflowCardContent, TaskflowCardTitle, useTaskflowStatus } from './TaskflowCard'
import { TaskflowInfo } from '../../utils/api/taskflow'
import { useTaskflowList } from './TaskflowContext'
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

    const [open, setOpen] = useState(false);
    const { token } = theme.useToken();

    const status = useMemo(() => taskflowStatus[taskflow.status], [taskflow]);

    const statusIcon = useMemo(()=>{ 
        if(taskflow.progress >=0 && taskflow.status === "running"){
            return <Progress type="dashboard" percent={taskflow.progress * 100} size={20} />
        } else {
            return status.icon
        }
    }, [taskflow, status]);

    return <Popover
        title={
            <div style={{
                padding: "0px 12px",
                paddingTop: token.paddingXS,
                height: "100%", boxSizing: "border-box"
            }}>
                <TaskflowCardTitle taskflow={taskflow} />
            </div>
        }
        content={
            <div style={{ maxHeight: "50vh", overflow: "auto" }}>
                <TaskflowCardContent taskflow={taskflow} />
            </div>
        }
        placement="bottomLeft"
        styles={{ container: { padding: 0 },  root: { width: "50%", backgroundColor: "unset", } }}
        >
        <Tag style={{ marginRight: 0 }}
            onClick={() => { setOpen(true) }}
            color={status.type}
            key={taskflow.id} icon={statusIcon}>
            <span style={{ cursor: "pointer" }}>{taskflow.name}</span>
        </Tag>
    </Popover>
    {/* <Drawer open={open} onClose={() => { setOpen(false) }} title={taskflow.name} >
           
        </Drawer> */}
}