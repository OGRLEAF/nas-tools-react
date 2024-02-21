import React, { useEffect, useState, createContext, useContext, useMemo, useCallback } from "react";
import { NastoolServerConfig } from "../utils/api/api";
import { Organize } from "../utils/api/import";
import { Input, Select, Space } from "antd";
import { PathSelector } from "./PathSelector";
import { DownloadClient, DownloadClientResource } from "../utils/api/download";
import { useAPIContext, useResource } from "../utils/api/api_base";


const normalize = (p: string) => p += p.endsWith("/") ? "" : "/"

export type GroupedSelectType = "auto" | "library" | "download" | "customize"
export type GroupedPathsType = Record<string, string[]>

type UnionPathSelectContextType = {
    pathType?: string,
    value?: string,
    // setGroupedPaths: (key: GroupedSelectType, value: GroupedPathsType[GroupedSelectType]) => void;
}

type UnionPathSelectDispathContextType = {
    // groupedPaths: GroupedPathsType,
    onChange?: (type: GroupedSelectType, value: string) => void;
    registerComponent: (type: GroupedSelectType, predefined: string[], label?: string) => void;
    updateComponent: ((options: { type: GroupedSelectType, predefined?: string[], node?: React.ReactNode, label?: string }) => void);

}

type UnionPathSelectStyleContextType = {
    width?: React.CSSProperties['width']
}

const UnionPathSelectStyleContext = createContext<UnionPathSelectStyleContextType>({})

const UnionPathSelectContext = createContext<UnionPathSelectContextType>({})
const UnionPathSelectDispathContext = createContext<UnionPathSelectDispathContextType>({
    registerComponent: () => { console.log("default") },
    updateComponent: () => { console.log("default") }
})

interface UnionPathSelectProps extends FormItemProp<string> {
    label?: string
}

interface WrapperProps {
    value?: string,
    onChange?: (value: string | undefined) => void,
    style?: React.CSSProperties,
    width?: number,
    fallback?: string,
    children?: React.ReactNode,
}

export const UnionPathsSelectGroup = (options: WrapperProps) => {
    const { children } = options;
    const [components, setComponents] = useState<Record<string, { predefined: string[], label?: string, node: React.ReactNode }>>({})

    const [pathType, setPathType] = useState<string>(options.fallback ?? "auto");
    const [path, setPath] = useState<string | undefined>(options.value)
    const [initalValue,] = useState(options.value)


    const outputPathTypeOptions: { label: string, value: string }[] = useMemo(() => (
        Object.entries(components).map(([type, comp]) => ({ label: comp.label ?? type, value: type })) || []
    ), [components])


    const handlePathTypeChange = useCallback((value: string) => {
        setPathType(value);
    }, []);


    const registerComponent = useCallback((_type: GroupedSelectType, _predefined: string[], label?: string) => {
        console.debug(_type, _predefined)
        setComponents((components) => {
            return ({
                ...components,
                [_type]: {
                    predefined: _predefined,
                    node: null,
                    label: label
                }
            })
        })

        const idx = _predefined.map(normalize).indexOf(normalize(initalValue ?? ""));
        if (idx > -1) {
            setPathType(_type as GroupedSelectType);
        }
    }, [initalValue])

    const updateComponent = useCallback((options: { type: GroupedSelectType, predefined?: string[], node?: React.ReactNode, label?: string }) => {
        const { type: currentType, predefined, node, label } = options;
        if (currentType == pathType) {
            console.debug(currentType, predefined, node)
            setComponents((components) => {
                const comp = components[currentType];
                if (comp)
                    return ({
                        ...components,
                        [currentType]: {
                            predefined: predefined ?? comp.predefined,
                            node: node ?? comp.node,
                            label: label ?? comp.label
                        }
                    })
                else return components
            })
        }

    }, [pathType])

    const ctxOnChange = useCallback((type: GroupedSelectType, value: string) => {
        setPath(value);
    }, [])

    useEffect(() => {
        if (options.onChange) options.onChange(path)
    }, [options, path])

    const fullWidth = useMemo(() => options.width ?? 450, [options.width]);

    return <>
        <UnionPathSelectStyleContext.Provider value={{ width: fullWidth }}>
            <UnionPathSelectContext.Provider value={{ value: path, pathType: pathType }}>
                <UnionPathSelectDispathContext.Provider value={{
                    registerComponent,
                    updateComponent,
                    onChange: ctxOnChange
                }}>
                    <div style={{ display: "none" }} >{children}</div>
                </UnionPathSelectDispathContext.Provider>
            </UnionPathSelectContext.Provider>
        </UnionPathSelectStyleContext.Provider>
        <Space.Compact style={{ width: "100%", ...options.style }}>
            <Select
                value={pathType}
                defaultValue="auto"
                style={{ width: 150 }}
                onChange={handlePathTypeChange}
                options={outputPathTypeOptions}
            />
            {components[pathType]?.node ?? null}
        </Space.Compact>

    </>
}

interface FormItemProp<T> {
    value?: T,
    onChange?: (value: T) => void,
    width?: number,
}

export const EmptyPathSelect = (options: { emptyValue?: string | null } & UnionPathSelectProps) => {
    const { registerComponent, onChange } = useContext(UnionPathSelectDispathContext);
    const { pathType } = useContext(UnionPathSelectContext)
    const node = useMemo(() => <Select disabled
        style={{
            width: options.width ? options.width - 150 : undefined
        }}
    />, [options.width])

    useEffect(() => {
        if (pathType == "auto") onChange?.("auto", "")
    }, [onChange, pathType])
    useEffect(() => {
        if (options.emptyValue === undefined) {
            registerComponent("auto", [""], options.label)
        }
    }, [options.value, options.emptyValue, registerComponent, options.label])
    return node
}

export const LibraryPathSelect = (options: UnionPathSelectProps) => {
    const { registerComponent, updateComponent, onChange } = useContext(UnionPathSelectDispathContext);
    const [librariesPath, setLibrariesPath] = useState<NastoolServerConfig['media']>();
    const { value: ctxValue } = useContext(UnionPathSelectContext);
    const [path, setPath] = useState<string | undefined>(options.value || ctxValue)
    // useEffect(() => {
    //     setPath(options.value || ctxValue)
    // }, [options.value, ctxValue])

    const handlePathChange = useCallback((value: string) => {
        setPath(value);
        options.onChange?.(value);
        onChange?.('library', value)
    }, [options, onChange])

    const { API } = useAPIContext();
    useEffect(() => {
        if (API.loginState) {
            const orgn = new Organize(API);
            orgn.getLibrariesPath()
                .then(libraries => { setLibrariesPath(libraries) })
        }
    }, [API])
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

    const node = useMemo(() => <Select value={path} onChange={handlePathChange} options={libraryPathOptions}
        style={{
            width: options.width && (options.width - 150)
        }}
    />, [handlePathChange, libraryPathOptions, options.width, path])

    const [registered, setRegistered] = useState(false);

    useEffect(() => {
        if (registered) {
            updateComponent({ type: "library", node: node })
        }
    }, [node, registered, updateComponent])

    useEffect(() => {
        if (librariesPath && !registered) {
            const { anime_path, tv_path, movie_path } = librariesPath;
            const allPaths = [...anime_path, ...tv_path, ...movie_path];
            registerComponent("library", allPaths, options.label)
            setRegistered(true)
        }
    }, [registerComponent, registered, librariesPath, options.label])

    return <>{node}</>
}

export const DownloadPathSelect = (options: { remote?: boolean } & UnionPathSelectProps) => {
    const { registerComponent, updateComponent, onChange } = useContext(UnionPathSelectDispathContext);
    const { value: ctxValue } = useContext(UnionPathSelectContext)
    const { useList } = useResource<DownloadClientResource>(DownloadClient)
    const { list: clients, } = useList();

    const [path, setPath] = useState<string | undefined>(options.value || ctxValue);

    // useEffect(() => {
    //     console.log("value update", ctxValue)
    //     setPath(options.value || ctxValue)
    // }, [options.value, ctxValue])

    const remote = options.remote ?? true;
    const downloaderPathMap = useMemo(() => {
        return clients?.filter((cli) => (cli.download_dir.length > 0)).map((cli) => ({
            label: cli.name,
            options: cli.download_dir.map(({ save_path, container_path }) => {
                const path = remote ? save_path : container_path;
                return { label: path, value: path, key: `${cli.name}-${save_path}` }
            }),
        }))
    }, [clients, remote])

    const allPaths = useMemo(() => {
        return clients?.map(cli => cli.download_dir).reduce((prev, curr) => prev.concat(curr)) ?? []
    }, [clients])

    const node = useMemo(() => <Select value={path} options={downloaderPathMap}
        onChange={(value) => {
            setPath(value);
            options.onChange?.(value);
            onChange?.("download", value)
        }}
        style={{
            width: options.width && (options.width - 150)
        }}
    />, [downloaderPathMap, options, onChange, path])

    const [registered, setRegistered] = useState(false);

    useEffect(() => {
        if (registered) {
            updateComponent({ type: "download", node: node })
        }
    }, [node, registered, updateComponent])

    useEffect(() => {
        if (allPaths.length && !registered) {
            registerComponent("download",
                allPaths.map(({ save_path, container_path }) => remote ? save_path : container_path),
                options.label
            );
            setRegistered(true)
        }
    }, [allPaths, registerComponent, registered, remote, options.label])
    return <>{node}</>
}

export function PathTreeSelect(options: UnionPathSelectProps) {
    const { value: ctxValue } = useContext(UnionPathSelectContext)
    const [value, setValue] = useState<string | undefined>(options.value || ctxValue);
    const { registerComponent, updateComponent, onChange } = useContext(UnionPathSelectDispathContext);

    const onPathSelectorUpdate = useCallback((value: string) => {
        setValue(value);
        options.onChange?.(value);
        onChange?.("customize", value);
    }, [onChange, options])

    const node = useMemo(() => <>
        <PathSelector value={value} onChange={onPathSelectorUpdate}
            style={{ width: options.width && (options.width - 150) }} />
    </>, [onPathSelectorUpdate, options.width, value]);
    const [registered, setRegistered] = useState(false);

    useEffect(() => {
        if (registered) updateComponent({ type: "customize", node })
    }, [node, updateComponent, registered])

    useEffect(() => {
        if (!registered) {
            registerComponent("customize", [], options.label || "自定义目录")
            setRegistered(true);
        }
    }, [options.label, registerComponent, registered])

    return <>{node}</>;
}

export const StringPathInput = (options: UnionPathSelectProps) => {
    const { value: ctxValue } = useContext(UnionPathSelectContext)
    const [value, setValue] = useState<string | undefined>(options.value || ctxValue);
    const { registerComponent, updateComponent, onChange } = useContext(UnionPathSelectDispathContext);

    // useEffect(() => {
    //     console.log("value update", ctxValue)
    //     setValue(options.value || ctxValue)
    // }, [options.value, ctxValue])

    useEffect(() => {
        if (value) {
            options.onChange?.(value)
            onChange?.("customize", value)
        }
    }, [value, options, onChange])

    const node = useMemo(() => <Input value={value} onChange={(evt) => setValue(evt.currentTarget.value)}
        style={{ width: options.width && (options.width - 150) }}
    />, [options.width, value])

    const [registered, setRegistered] = useState(false);
    useEffect(() => {
        if (registered) {
            updateComponent({ "type": "customize", node })
        }
    }, [value, node, updateComponent, registered])


    useEffect(() => {
        if (!registered) {
            registerComponent("customize", [], options.label)
            setRegistered(true)
        }
    }, [registerComponent, options.label, registered])

    return node
}