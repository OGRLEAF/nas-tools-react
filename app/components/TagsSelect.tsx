import React, { useEffect, useState } from "react";
import { Select } from "antd";

export default function TagsSelect({
    value = "",
    onChange,
    sep = ";"
}: {
    value?: string,
    onChange?: (value: string) => void,
    sep: string
}) {
    const [tags, setTags] = useState<string[]>([]);
    const onSelectChange = (value: string[]) => {
        // console.log(value)
        setTags(value)
    }
    useEffect(() => {
        if (onChange) onChange((tags || []).join(sep));
    }, [tags])
    useEffect(() => {
        // console.log('value=', value, value?.split(sep))
        if (value && (value.length > 0)) {
            setTags(value?.split(sep) || [])
        }
    }, [value])
    return <>
        <Select mode="tags" value={tags} tokenSeparators={[sep]} onChange={onSelectChange} />
    </>
}