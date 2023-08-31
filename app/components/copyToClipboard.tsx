import { Tooltip } from "antd"
import React, { useState } from "react"


interface Props {
    children: React.ReactNode,
    content: string
}
export default function CopyToClipboard({ children, content }: Props) {
    const [openTooltip, setOpenTooltip] = useState(false)
    const [tooltipText, setTooltipText] = useState("已复制")
    const copy = () => {
        navigator.clipboard.writeText(content)
        .then(()=>{
            setTooltipText("已复制")
            setOpenTooltip(true)
        })
        .catch(()=>{
            setTooltipText("复制失败")
            setOpenTooltip(true)
        })
        .then(()=>{setTimeout(()=>setOpenTooltip(false), 1000)})
    }
    
    return <>
        <span onClick={copy} onBlur={()=>setOpenTooltip(true)}>
            <Tooltip title={tooltipText} open={openTooltip}>
                {children}
            </Tooltip>
        </span>
    </>
}