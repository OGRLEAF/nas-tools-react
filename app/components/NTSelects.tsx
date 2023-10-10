
import React, { useEffect, useState } from "react"
import { createContext } from "vm"
import { API, NastoolFilterruleBasic } from "../utils/api/api"
import { Select } from "antd"

interface FormItemProp<T> {
    value?: T,
    onChange?: (value: T) => void
}

// export const DownloadSetting = createContext<{ label: string, value: string }>([
//     {
//         label: "默认",
//         value: ""
//     },
// ])

export const DownloadSettingSelect = (options: FormItemProp<string>) => {

    const downloadConfigSelectOption = [
        {
            label: "默认",
            value: ""
        },

    ]
    const [selectOptions, setSelectOptions] = useState<{ value: string | number, label: string }[]>(downloadConfigSelectOption);
    useEffect(() => {
        (async () => {
            const nastool = await API.getNastoolInstance();
            const downloadConfig = await nastool.getDownloadConfigList();
            setSelectOptions(
                [
                    ...downloadConfigSelectOption,
                    ...downloadConfig.map((item) => ({ label: item.name, value: item.id }))
                ])
        })()
    }, []);
    return <Select options={selectOptions} value={options.value} onChange={options.onChange} />
}

export const FilterRuleSelect = (options: FormItemProp<string>) => {
    const [filterRules, setFilterRules] = useState<NastoolFilterruleBasic[]>([]);
    useEffect(() => {
        (async () => {
            const nastool = API.getNastoolInstance();
            (await nastool).getFilterRules()
                .then(res => {
                    setFilterRules(res)
                })
        })()
    }, [])
    const filterRuleOption = [
        {
            label: "默认",
            value: ""
        },
        ...filterRules.map((item) => ({ label: item.name, value: item.id }))
    ]
    return <Select options={filterRuleOption} value={options.value} onChange={options.onChange} />
}

const resTypeOptions = [
    {
        value: "",
        label: "全部"
    },
    ...["BLURAY", "REMUX", "DOLBY", "WEB", "HDTV", "UHD", "HDR", "3D"]
        .map((value) => ({ value: value, label: value }))
]

export const ResTypeSelect = (options: FormItemProp<string>) => {
    return <Select value={options.value} onChange={options.onChange} options={resTypeOptions} />
}

const pixOptions = [
    {
        value: "",
        label: "全部"
    },
    ...["8k", "4k", "1080p", "720p"]
        .map((value) => ({ value: value, label: value }))
]

export const PixSelect = (options: FormItemProp<string>) => {
    return <Select value={options.value} onChange={options.onChange} options={pixOptions} />
}