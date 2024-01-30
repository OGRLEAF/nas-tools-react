
import React, { CSSProperties, useEffect, useMemo, useState } from "react"
import { API, NastoolFilterruleBasic, NastoolIndexer, NastoolServerConfig, NastoolSiteInfo, NastoolSiteProfile } from "../utils/api/api"
import { Select, Space } from "antd"
import { Sites } from "../utils/api/sites"
import { syncModeMap } from "../utils/api/sync"
import { MediaWorkType } from "../utils/api/types"
import { MediaWorkCategory, MediaWorkCategoryType } from "../utils/api/media/category"
import { DownloadClient, DownloadClientConfig, DownloadClientResource, DownloadConfigResource, DownloadConfigs } from "../utils/api/download"
import { Organize } from "../utils/api/import"
import { normalize } from "path"
import { useAPIContext, useDataResource, useResource } from "../utils/api/api_base"

interface FormItemProp<T> {
    value?: T,
    onChange?: (value: T) => void,
    style?: CSSProperties
}

export const DownloadSettingSelect = (options: { default?: { label: string, value: any } } & FormItemProp<string>) => {
    const { useList } = useResource<DownloadConfigResource>(DownloadConfigs)
    const { list } = useList();
    const selectOptions = useMemo(() => [
        (options.default ?? {
            label: "站点设置",
            value: 0
        }),
        ...list?.map((config) => ({ label: config.name, value: config.id })) ?? []
    ], [list])
    return <Select style={{ ...options.style }} options={selectOptions} value={options.value} onChange={options.onChange} />
}

export const DownloadClientSelect = (options: & FormItemProp<string>) => {

    const { useList } = useResource<DownloadClientResource>(DownloadClient);
    const { list } = useList();
    const downloadClientOptions = list?.map((client) => ({
        label: client.name,
        value: client.id
    }))
    return <Select options={downloadClientOptions} value={options.value} onChange={options.onChange} />
}

export const FilterRuleSelect = (options: FormItemProp<string>) => {
    const [filterRules, setFilterRules] = useState<NastoolFilterruleBasic[]>([]);
    const { API } = useAPIContext()
    useEffect(() => {
        (async () => {
            await API.getFilterRules()
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
    const { API } = useAPIContext()
    const [selectOptions, setSelectOptions] = useState<{ value: NastoolSiteProfile['name'], label: NastoolSiteProfile['name'] }[]>([]);
    useEffect(() => {
        (async () => {
            const sites = await new Sites(API).list();
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
    const { API } = useAPIContext()
    useEffect(() => {
        (async () => {
            const sites = await new Sites(API).indexers();
            setSelectOptions(
                [
                    ...sites.map((item) => ({ label: item.name, value: item.name }))
                ])
        })()
    }, []);
    return <Select mode="multiple" options={selectOptions} value={options.value} onChange={options.onChange} />
}

const syncModeOptions = Object.entries(syncModeMap).map(([k, v]) => ({
    value: k,
    label: v
}))
export const SyncModeSelect = (options: FormItemProp<string[]>) => {
    return <Select style={{ width: "100%" }} options={syncModeOptions} value={options.value} onChange={options.onChange} />

}

export const PromotionSelect = (options: FormItemProp<string[]>) => {

}

const mediaWorkTypeOption = [
    {
        value: "",
        label: "全部"
    },
    {
        value: MediaWorkType.ANI,
        label: "动漫"
    },
    {
        value: MediaWorkType.TV,
        label: "电视剧"
    },
    {
        value: MediaWorkType.MOVIE,
        label: "电影"
    }
]
export const MediaWorkTypeSelect = (options: FormItemProp<MediaWorkType | "">) => {
    return <Select options={mediaWorkTypeOption} value={options.value} onChange={options.onChange} ></Select>
}

interface MediaWorkCategorySelectProp extends FormItemProp<MediaWorkCategoryType> {
    type: MediaWorkType
}
export const MediaWorkCategorySelect = (options: MediaWorkCategorySelectProp) => {
    const { useData, } = useDataResource(MediaWorkCategory, { initialOptions: { type: options.type } });
    const { refresh, data } = useData();
    useEffect(() => {
        refresh();
    }, [options.type])
    const categoryOptions = [{ value: "", label: "全部" }, ...(data?.map((v) => ({ value: v, label: v })) ?? [])];
    return <Select options={categoryOptions} value={options.value} onChange={options.onChange} ></Select>
}

export const MediaWorkCategoryUnionSelect = (options: FormItemProp<[MediaWorkType | "", MediaWorkCategoryType]>) => {
    const [type, category] = options.value ?? ["", ""];
    const [selectedType, setSelectedType] = useState<MediaWorkType | "">(type)
    const [selectedCat, setSelectedCat] = useState<MediaWorkCategoryType>(category)
    useEffect(() => {
        options.onChange?.([selectedType, selectedCat])
    }, [selectedCat, selectedType])
    useEffect(() => {
        setSelectedCat("")
    }, [selectedType])
    return <Space.Compact style={{ width: "100%" }}>
        {type != undefined ? <MediaWorkTypeSelect value={selectedType} onChange={(value) => setSelectedType(value)} /> : <></>}
        {(selectedType != "") && (category != undefined) ? <MediaWorkCategorySelect type={selectedType} value={selectedCat} onChange={(value) => { setSelectedCat(value) }} /> : <></>}
    </Space.Compact>
}

