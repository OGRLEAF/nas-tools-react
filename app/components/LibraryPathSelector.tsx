import React, { useEffect, useState, createContext, useContext, useMemo } from "react";
import { NastoolServerConfig } from "../utils/api/api";
import { Organize } from "../utils/api/import";
import { Select, Space } from "antd";
import { PathSelector } from "./PathSelector";
import { DownloadClient } from "../utils/api/download";


const normalize = (p: string) => p += p.endsWith("/") ? "" : "/"

export type GroupedSelectType = "library" | "download"
export type GroupedPathsType = Record<GroupedSelectType, string[]>
type UnionPathSelectContextType = {
    groupedPaths: GroupedPathsType,
    setGroupedPaths: (key: GroupedSelectType, value: GroupedPathsType[GroupedSelectType]) => void;
}
const UnionPathSelectContext = createContext<UnionPathSelectContextType>({
    groupedPaths: {
        library: [],
        download: []
    },
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

    const libraryPathSelect = useLibrary ? <LibraryPathSelect value={path} onChange={handlePathChange} /> : <></>
    const downlaodPathSelect = useDownload ? <DownloadPathSelect value={path} onChange={handlePathChange} /> : <></>

    return <>
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
    </>
}

interface FormItemProp<T> {
    value?: T,
    onChange?: (value: T) => void,
    width?: number,
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

export const DownloadPathSelect = (options: FormItemProp<string>) => {
    const { useList } = new DownloadClient().useResource();
    const { list: clients, refresh: refreshClients } = useList();
    const [path, setPath] = useState<string | undefined>(options.value)
    const ctx = useContext(UnionPathSelectContext);
    const downloaderPathMap = useMemo(() => {
        return clients?.filter((cli) => (cli.download_dir.length > 0)).map((cli) => ({
            label: cli.name,
            options: cli.download_dir.map(({ save_path }) => ({ label: save_path, value: save_path, key: `${cli.name}-${save_path}` })),
        }))
    }, [clients])

    const allPaths = useMemo(() => {
        return clients?.map(cli => cli.download_dir).reduce((prev, curr) => prev.concat(curr)) ?? []
    }, [downloaderPathMap])

    useEffect(() => {
        ctx.setGroupedPaths("download", allPaths.map(({ save_path }) => save_path));
    }, [allPaths])

    // useEffect(() => {
    //     if (options.value != undefined) {
    //         if (allPaths.map((value) => value.save_path).indexOf(normalize(options.value)) > -1) {
    //             console.log("set to download", options.value)
    //             ctx.setPreGroupedSelect("download")
    //         } else {
    //             ctx.delPreGroupedSelect("download")
    //         }
    //         setPath(options.value)
    //     }
    // }, [options.value])

    return <Select value={path} options={downloaderPathMap} onChange={(value) => { setPath(value); options.onChange?.(value) }}
        style={{
            width: options.width ? options.width - 150 : undefined
        }}
    />
}