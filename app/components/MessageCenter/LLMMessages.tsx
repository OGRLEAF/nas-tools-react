import React, { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "marked-react";
import { LLMChatMessage, LLMThinkingSection } from "@/app/utils/api/message/LLMChatMessage";
import { CheckboxOptionType, Collapse, Flex, Space, Spin, theme } from "antd";
import { LoadingOutlined } from "@ant-design/icons"
import { TagCheckboxGroup, TagCheckboxGroupProps } from "../TagCheckbox";
import { LLMClient, LLMTool } from "@/app/utils/api/llmClient";

export function LLMThinkingSectionCollapse({ content }: { content: LLMThinkingSection }) {
    return <Collapse
        collapsible="header"
        size="small"
        defaultActiveKey={[]}
        items={[
            {
                key: '1',
                label: <Space><span>{content.thinking ? "思考中..." : "思考完成"}</span><Spin indicator={<LoadingOutlined spin />} spinning={content.thinking} size="small" /></Space>,
                children: content.chunks.join("")
            },
        ]}
    />
}

export const MessageLLMContent = React.memo(({ msg }: { msg: LLMChatMessage }) => {
    const sections = msg.content.sections;
    const { token } = theme.useToken();
    return <Flex orientation="vertical" gap={12}>
        {/* {JSON.stringify(sections)} */}
        {sections.map((item, index) => {
            if (item.name == "thinking") {
                return <LLMThinkingSectionCollapse key={index} content={item as LLMThinkingSection} />
            } else if (item.name == "content") {
                return <div key={index} className="message-markdown-content">
                    <Markdown key={index} value={item.chunks.join("")} />
                </div>
            } else {
                return <div key={index} style={{ color: token.colorTextTertiary }}>{item.name}: {item.chunks.join("")}</div>
            }
        })
        }
    </Flex>
})

export function ToolSelection({onChange}: { onChange?: (values: string[]) => void }) {
    const [options, setOptions] = useState<CheckboxOptionType<string>[]>([]);
    const [values, setValues] = useState<string[]>([]);
    useEffect(()=> {
        LLMClient.tools()
        .then((tools: LLMTool[]) => {
            setOptions(tools.map(tool => ({ label: tool.display_name, value: tool.name })));  
        })
    }, [])
    return <TagCheckboxGroup<string> options={options} onChange={(values) => {onChange?.(values)}} />
}