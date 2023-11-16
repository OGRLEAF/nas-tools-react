import React, { useEffect, useState } from "react";
import { NastoolServerConfig } from "../utils/api/api";
import { Organize } from "../utils/api/import";
import { Select, Space } from "antd";
import { PathSelector } from "./PathSelector";
// import { normalize } from "path";

const normalize = (p:string) => p += p.endsWith("/") ? "" : "/"

export const MediaLibrarySelect = (options: {
    value?: string,
    onChange?: (value: string | undefined) => void,
    style?: React.CSSProperties,
    leftEmpty?: string,
    allowLeftEmpty?: boolean,
    width?: number
}) => {
    type OutputPathType = "auto" | "library" | "customize"
    const [librariesPath, setLibrariesPath] = useState<NastoolServerConfig['media']>();
    const [pathType, setPathType] = useState<OutputPathType>("auto");
    const [path, setPath] = useState<string>()
    useEffect(() => {

        const orgn = new Organize();
        orgn.getLibrariesPath()
            .then(libraries => {
                setLibrariesPath(libraries)
                console.log("MediaLibrarySelect", options.value)
                if (options.value == undefined) {
                    setPathType("auto")
                } else {
                    const { anime_path, tv_path, movie_path } = libraries
                    const allPaths = [...anime_path, ...tv_path, ...movie_path].map(p => normalize(p))
                    // console.log(allPaths, options.value)
                    // console.log(allPaths.map(p => normalize(p)), normalize(options.value))
                    if (allPaths.indexOf( normalize(options.value)) > -1) {
                        setPathType("library")
                    } else {
                        setPathType("customize")
                    }
                    setPath(options.value)
                }
            })

    }, [options.value])

    const outputPathTypeOptions = [

        {
            label: "媒体库",
            value: "library"
        },
        {
            label: "自定义目录",
            value: "customize"
        }

    ]
    if (options.allowLeftEmpty === false) {
    } else {
        outputPathTypeOptions.push({
            label: options.leftEmpty || "自动",
            value: "auto"
        },)
    }
    const handlePathTypeChange = (value: OutputPathType) => {
        setPathType(value);
        if (value == "auto") {
            if (options.onChange) options.onChange(undefined)
        }
    };
    const handlePathChange = (value: string) => {
        if (value != "auto") {
            if (options.onChange) options.onChange(value)
        }
    }
    const libraryPathOptions = [{
        label: '动漫',
        options: librariesPath?.anime_path?.map((path) => ({ label: path, value: path })),
    },
    {
        label: '电视剧',
        options: librariesPath?.tv_path?.map((path) => ({ label: path, value: path })),
    },
    {
        label: '电影',
        options: librariesPath?.movie_path?.map((path) => ({ label: path, value: path })),
    },]
    return <Space.Compact style={{ width: "100%", ...options.style }}>
        <Select
            value={pathType}
            defaultValue="auto"
            style={{ width: 150 }}
            onChange={handlePathTypeChange}
            options={outputPathTypeOptions}
        />
        {
            pathType == "customize" ? <PathSelector value={path} onChange={handlePathChange}
                style={{
                    width: options.width ? options.width - 150 : undefined
                }} /> :
                pathType == "library" ? <Select value={path} onChange={handlePathChange} options={libraryPathOptions}
                    style={{
                        width: options.width ? options.width - 150 : undefined
                    }}
                /> :
                    <Select disabled
                        style={{
                            width: options.width ? options.width - 150 : undefined
                        }}
                    />
        }
    </Space.Compact>
}