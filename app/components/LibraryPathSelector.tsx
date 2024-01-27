import React, { useEffect, useState, createContext, useContext, useMemo } from "react";
import { NastoolServerConfig } from "../utils/api/api";
import { Organize } from "../utils/api/import";
import { Select, Space } from "antd";
import { PathSelector } from "./PathSelector";
import { DownloadClient, DownloadClientResource } from "../utils/api/download";
import { useResource } from "../utils/api/api_base";


const normalize = (p: string) => p += p.endsWith("/") ? "" : "/"

export type GroupedSelectType = "auto" | "library" | "download"
export type GroupedPathsType = Record<string, string[]>
type UnionPathSelectContextType = {
    groupedPaths: GroupedPathsType,
    setGroupedPaths: (key: GroupedSelectType, value: GroupedPathsType[GroupedSelectType]) => void;
}
const UnionPathSelectContext = createContext<UnionPathSelectContextType>({
    groupedPaths: {},
    setGroupedPaths: () => { },
})

type PathSelectType = "auto" | "library" | "download" | "customize"

interface Props {
    value?: string,
    onChange?: (value: string | undefined) => void,
    style?: React.CSSProperties,
    leftEmpty?: string,
    allowLeftEmpty?: boolean,
    width?: number,
    auto?: boolean,
    library?: boolean,
    download?: boolean,
    customize?: boolean,
}

export const UnionPathsSelect = (options: Props) => {
    const [groupedPaths, setGroupedPaths] = useState<GroupedPathsType>({ "download": [], "library": [] });
    const [pathType, setPathType] = useState<PathSelectType>("auto");
    const [path, setPath] = useState<string | undefined>(options.value)
    useEffect(() => setPath(options.value), [options.value])
    useEffect(() => {
        for (let [k, v] of Object.entries(groupedPaths)) {
            const idx = v.map(normalize).indexOf(normalize(options.value ?? ""));
            if (idx > -1) {
                setPathType(k as GroupedSelectType);
            }
        }
    }, [groupedPaths, options.value])
    const outputPathTypeOptions = []
    if (options.allowLeftEmpty === false) {
    } else {
        outputPathTypeOptions.push({
            label: options.leftEmpty || "自动",
            value: "auto"
        },)
    }
    const useLibrary = options.library ?? true;
    const useDownload = options.download ?? true;
    const useCustomize = options.customize ?? true;
    if (useLibrary) outputPathTypeOptions.push({ label: "媒体库", value: "library" },)
    if (useDownload) outputPathTypeOptions.push({ label: "下载目录", value: "download" },)
    if (useCustomize) outputPathTypeOptions.push({ label: "自定义目录", value: "customize" },)

    const handlePathTypeChange = (value: PathSelectType) => {
        setPathType(value);
        if (value == "auto") {
            if (options.onChange) options.onChange(undefined)
        }
    };
    const handlePathChange = (value: string) => {
        if (value != "auto") {
            setPath(value);
            if (options.onChange) options.onChange(value)
        }
    }

    const unionPathSelectContext = {
        groupedPaths,
        setGroupedPaths: (key: string, value: string[]) => { setGroupedPaths({ ...groupedPaths, ...{ [key]: [...value] } }) },
    }

    const libraryPathSelect = useLibrary ? <LibraryPathSelect width={options.width} value={path} onChange={handlePathChange} /> : <></>
    const downlaodPathSelect = useDownload ? <DownloadPathSelect width={options.width} value={path} onChange={handlePathChange} /> : <></>

    return <div>
        <UnionPathSelectContext.Provider value={unionPathSelectContext}>
            <div style={{ display: "none" }} >{libraryPathSelect}{downlaodPathSelect}</div>
        </UnionPathSelectContext.Provider>
        <Space.Compact style={{ width: "100%", ...options.style }}>
            <Select
                value={pathType}
                defaultValue="auto"
                style={{ width: 150 }}
                onChange={handlePathTypeChange}
                options={outputPathTypeOptions}
            />

            {
                pathType == "customize" ? <PathSelector value={path} onChange={handlePathChange} style={{ width: options.width ? options.width - 150 : undefined }} /> :
                    pathType == "library" ? libraryPathSelect :
                        pathType == "download" ? downlaodPathSelect : <></>

            }

        </Space.Compact >
    </div>
}

interface WrapperProps {
    value?: string,
    onChange?: (value: string | undefined) => void,
    style?: React.CSSProperties,
    leftEmpty?: string,
    allowLeftEmpty?: boolean,
    width?: number,
    auto?: boolean,
    fallback?: string,
    items?: {
        type: string,
        label: string,
        render: (props: FormItemProp<string>) => React.ReactNode
    }[]
}


export const UnionPathsSelectGroup = (options: WrapperProps) => {
    const allowLeftEmpty = options.allowLeftEmpty ?? true;
    const [groupedPaths, setGroupedPaths] = useState<Record<string, string[]>>({});
    const [pathType, setPathType] = useState<string>(options.fallback ?? "auto");
    const [path, setPath] = useState<string | undefined>(options.value)
    useEffect(() => setPath(options.value), [options.value])
    useEffect(() => {
        for (let [k, v] of Object.entries(groupedPaths)) {
            const idx = v.map(normalize).indexOf(normalize(options.value ?? ""));
            if (idx > -1) {
                setPathType(k as GroupedSelectType);
            }
        }
    }, [groupedPaths, options.value])
    const outputPathTypeOptions: { label: string, value: string }[] = []
    options.items?.forEach(({ type, label }) => {
        outputPathTypeOptions.push({ label, value: type })
    })

    const handlePathTypeChange = (value: string) => {
        setPathType(value);
        if (options.onChange) options.onChange(undefined)
    };
    const handlePathChange = (value: string) => {
        setPath(value);
        if (options.onChange) options.onChange(value)
    }

    const unionPathSelectContext = {
        groupedPaths,
        setGroupedPaths: (key: string, value: string[]) => { setGroupedPaths({ ...groupedPaths, ...{ [key]: [...value] } }) },
    }

    const childrenMap = Object.fromEntries(options.items?.map((value) => [value.type, value.render({ value: path, onChange: handlePathChange })]) ?? [])

    const allChildren = Object.values(childrenMap)

    const CompactWrapper = ({ children }: { children: React.ReactNode }) => {
        return childrenMap[pathType] ? <Space.Compact style={{ width: "100%", ...options.style }}>{children}</Space.Compact>
            : <Space style={{ width: "100%", ...options.style }}>{children}</Space>
    }
    return <>
        <UnionPathSelectContext.Provider value={unionPathSelectContext}>
            <div style={{ display: "none" }} >{allChildren}</div>
        </UnionPathSelectContext.Provider>
        <CompactWrapper>
            <Select
                value={pathType}
                defaultValue="auto"
                style={{ width: 150 }}
                onChange={handlePathTypeChange}
                options={outputPathTypeOptions}
            />
            {childrenMap[pathType]}
        </CompactWrapper >
    </>
}

interface FormItemProp<T> {
    value?: T,
    onChange?: (value: T) => void,
    width?: number,
}

export const EmptyPathSelect = (options: FormItemProp<string>) => {
    const ctx = useContext(UnionPathSelectContext);
    useEffect(() => {
        ctx.setGroupedPaths("auto", [""])
    }, [options.value])
    return <Select disabled
        style={{
            width: options.width ? options.width - 150 : undefined
        }}
    />
}

export const LibraryPathSelect = (options: FormItemProp<string>) => {
    const [librariesPath, setLibrariesPath] = useState<NastoolServerConfig['media']>();
    const [path, setPath] = useState<string | undefined>(options.value)
    const handlePathChange = (value: string) => {
        setPath(value);
        options.onChange?.(value);
    }
    const ctx = useContext(UnionPathSelectContext);
    useEffect(() => {
        const orgn = new Organize();
        orgn.getLibrariesPath()
            .then(libraries => { setLibrariesPath(libraries) })
    }, [options.value])
    const libraryPathOptions = useMemo(() => [{
        label: '动漫',
        options: librariesPath?.anime_path?.map((path) => ({ label: path, value: path })) ?? [],
    },
    {
        label: '电视剧',
        options: librariesPath?.tv_path?.map((path) => ({ label: path, value: path })) ?? [],
    },
    {
        label: '电影',
        options: librariesPath?.movie_path?.map((path) => ({ label: path, value: path })) ?? [],
    },], [librariesPath])

    useEffect(() => {
        if (librariesPath) {
            const { anime_path, tv_path, movie_path } = librariesPath;
            const allPaths = [...anime_path, ...tv_path, ...movie_path];
            ctx.setGroupedPaths("library", allPaths)
        }
    }, [librariesPath])

    return <Select value={path} onChange={handlePathChange} options={libraryPathOptions}
        style={{
            width: options.width ? options.width - 150 : undefined
        }}
    />
}

export const DownloadPathSelect = (options: { remote?: boolean } & FormItemProp<string>) => {
    const { useList } = useResource<DownloadClientResource>(new DownloadClient())
    const { list: clients, refresh: refreshClients } = useList();
    const [path, setPath] = useState<string | undefined>(options.value)
    const remote = options.remote ?? true;
    const ctx = useContext(UnionPathSelectContext);
    const downloaderPathMap = useMemo(() => {
        return clients?.filter((cli) => (cli.download_dir.length > 0)).map((cli) => ({
            label: cli.name,
            options: cli.download_dir.map(({ save_path, container_path }) => {
                const path = remote ? save_path : container_path;
                return { label: path, value: path, key: `${cli.name}-${save_path}` }
            }),
        }))
    }, [clients])

    const allPaths = useMemo(() => {
        return clients?.map(cli => cli.download_dir).reduce((prev, curr) => prev.concat(curr)) ?? []
    }, [downloaderPathMap])

    useEffect(() => {
        ctx.setGroupedPaths("download", allPaths.map(({ save_path, container_path }) => remote ? save_path : container_path));
    }, [allPaths])

    return <Select value={path} options={downloaderPathMap} onChange={(value) => { setPath(value); options.onChange?.(value) }}
        style={{
            width: options.width ? options.width - 150 : undefined
        }}
    />
}