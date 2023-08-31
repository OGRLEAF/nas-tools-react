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
    const initialTags = value.split(sep)
    const [tags, setTags] = useState<string[]>([]);
    const onSelectChange = (value: string[]) => {
        console.log(value)
        setTags(value)
    }
    useEffect(() => {
        if (onChange) onChange((tags|| []).join(sep));
    }, [tags])
    useEffect(() => {
        console.log('value=', value)
        setTags(value?.split(sep) || [])
    }, [])
    return <>
        <Select mode="tags" value={initialTags || tags} tokenSeparators={[sep]} onChange={onSelectChange} />
    </>
}