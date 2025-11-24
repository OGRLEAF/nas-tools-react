import React, { useEffect, useState } from 'react';
import { Space, Tag } from 'antd';
import type { CheckboxOptionType, } from 'antd/es/checkbox/Group';


const { CheckableTag } = Tag;


export interface TagCheckboxGroupProps<T = any> {
    options: Array<CheckboxOptionType>;
    value?: Array<T>;
    onChange?: (checkedValue: Array<T>) => void;
    styles?: {
        tag?: React.CSSProperties
    }
}

export function TagCheckboxGroup<T>(props: TagCheckboxGroupProps<T>) {
    const { onChange } = props;
    const [selectedTags, setSelectedTags] = useState<T[]>(props.value || []);
    const handleChange = (tag: T, checked: boolean) => {
        const nextSelectedTags = checked
            ? [...selectedTags, tag]
            : selectedTags.filter((t) => t !== tag);
        setSelectedTags(nextSelectedTags);
    };
    useEffect(() => {
        if (props.value != undefined) setSelectedTags(props.value)
    }, [])

    useEffect(() => {
        onChange?.(selectedTags)
    }, [selectedTags])

    return (
        <>
            <Space size="small" wrap>
                {props.options?.map((option) => {
                    return (
                        <CheckableTag
                            style={props.styles?.tag}
                            key={option.value.toString()}
                            checked={selectedTags.includes(option.value)}
                            onChange={(checked) => handleChange(option.value, checked)}
                        >
                            {option.label}
                        </CheckableTag>
                    )
                })
                }
            </Space>
        </>
    );
}
