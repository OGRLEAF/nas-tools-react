import React, { useEffect, useState } from 'react';
import { Space, Tag, Checkbox } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { CheckboxGroupProps, CheckboxOptionType, CheckboxValueType, } from 'antd/es/checkbox/Group';


const { CheckableTag } = Tag;


export interface TagCheckboxGroupProps {
    options: Array<CheckboxOptionType>;
    value?: Array<CheckboxValueType>;
    onChange?: (checkedValue: Array<CheckboxValueType>) => void;
}

export function TagCheckboxGroup(props: TagCheckboxGroupProps) {
    const { onChange } = props;
    const [selectedTags, setSelectedTags] = useState<CheckboxValueType[]>(props.value || []);
    const handleChange = (tag: CheckboxValueType, checked: boolean) => {
        const nextSelectedTags = checked
            ? [...selectedTags, tag]
            : selectedTags.filter((t) => t !== tag);
        setSelectedTags(nextSelectedTags);
    };

    useEffect(() => {
        onChange?.(selectedTags)
    }, [selectedTags])

    return (
        <>
            <Space size={[0, 8]} wrap>
                {props.options?.map((option) => {
                    return (
                        <CheckableTag
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
