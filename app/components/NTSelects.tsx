
import React, { useEffect, useState } from "react"
import { createContext } from "vm"
import { API, NastoolFilterruleBasic, NastoolIndexer, NastoolSiteInfo, NastoolSiteProfile } from "../utils/api/api"
import { Select } from "antd"
import { Sites } from "../utils/api/sites"

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
            value: 0
        },

    ]
    const [selectOptions, setSelectOptions] = useState<{ value: undefined | number, label: string }[]>(downloadConfigSelectOption);
    useEffect(() => {
        (async () => {
            const nastool = await API.getNastoolInstance();
            const downloadConfig = await nastool.getDownloadConfigList();
            setSelectOptions(
                [
                    ...downloadConfigSelectOption,
                    ...downloadConfig.map((item) => ({ label: item.name, value: Number(item.id) }))
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
    return <Select options={filterRuleOption} value={String(options.value)} onChange={options.onChange} />
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

export const SiteSelect = (options: FormItemProp<string[]>) => {
    const [selectOptions, setSelectOptions] = useState<{ value: NastoolSiteProfile['name'], label: NastoolSiteProfile['name'] }[]>([]);
    useEffect(() => {
        (async () => {
            const sites = await new Sites().sites();
            setSelectOptions(
                [
                    ...sites.map((item) => ({ label: item.name, value: item.name }))
                ])
        })()
    }, []);
    return <Select mode="multiple" options={selectOptions} value={options.value} onChange={options.onChange} />
}

export const IndexerSelect = (options: FormItemProp<string[]>) => {
    const [selectOptions, setSelectOptions] = useState<{ value: NastoolIndexer['name'], label: NastoolIndexer['name'] }[]>([]);
    useEffect(() => {
        (async () => {
            const sites = await new Sites().indexers();
            setSelectOptions(
                [
                    ...sites.map((item) => ({ label: item.name, value: item.name }))
                ])
        })()
    }, []);
    return <Select mode="multiple" options={selectOptions} value={options.value} onChange={options.onChange} />
}
