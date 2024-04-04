import React, { useEffect } from 'react'
import { useServerEvent } from '../utils/api/message/ServerEvent'

export default function Taskbar() {
    const { msg, msgs, } = useServerEvent('task_event')
    useEffect(()=>{
        console.log(msg)
    }, [msg])
    return <>
        Taskbar
    </>
}