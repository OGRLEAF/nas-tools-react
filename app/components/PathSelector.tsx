import React, { useState, useEffect, createContext, useContext, useReducer } from "react";
import { Space, TreeSelect, TreeSelectProps, theme } from "antd"
import { API, NastoolFileListItem } from "@/app/utils/api/api";
import PathManager from "../utils/pathManager";
import { DefaultOptionType } from "antd/es/select";

export interface PathSelectorProps {
    value?: string,
    onChange?: (value: string) => void,
    style?: React.CSSProperties
}

export const PathManagerContext = createContext<PathManager>(new PathManager("/"));
export const PathManagerDispatchContext = createContext(({ type }: { type: any, path: string }) => { });


export function PathSelector({ value: string = "/", onChange, style }: PathSelectorProps) {
    const [loadingState, setLoadingState] = useState(true)
    const [treeData, setTreeData] = useState<Omit<DefaultOptionType, 'label'>[]>([]);

    const pathManagerContext = useContext(PathManagerContext);

    useEffect(() => {
        setLoadingState(true);
        const nastool = API.getNastoolInstance();
        nastool.then(async (nastool) => {
            const basePath = pathManagerContext.getDeepestRelativePath();
            const fileList = await nastool.getFileList(pathManagerContext.getBasePath, pathManagerContext.getDeepestRelativePath());
            setTreeData(fileList.directories.map(dir => ({
                id: basePath + "/" + dir.name,
                pId: basePath,
                title: dir.name,
                isLeaf: !dir.is_empty,
                label: dir.name,
                value: dir.name,
                key: dir.name
            })))
            setLoadingState(false);
        })
    }, []);

    const { token } = theme.useToken();
    const onLoadData: TreeSelectProps['loadData'] = async ({ id }) => {

        pathManagerContext.setPath(id);
        console.log(id, pathManagerContext.deepestPath)
        const nastool = API.getNastoolInstance();
        await nastool.then(async (nastool) => {
            const basePath = pathManagerContext.getDeepestRelativePath();
            const fileList = await nastool.getFileList(pathManagerContext.getBasePath, pathManagerContext.getDeepestRelativePath());

            const treedata = [
                ...treeData,
                ...fileList.directories.map(dir => {
                    const parent = '/' + basePath
                    const key = `${parent}/${dir.name}`;
                    return {
                        id: key,
                        pId: parent,
                        title: <Space>{dir.name}<span style={{ color: token.colorTextDescription }}>{parent}</span></Space>,
                        isLeaf: !dir.is_empty,
                        value: key,
                        label: <>{key}-</>,
                        key: key,
                    }
                })]
            setTreeData(treedata)
            setLoadingState(false);
        })
        // console.log(pathManagerContext.getDeepestRelativePath())
    }

    return <>
        <TreeSelect
            loading={loadingState}
            treeDataSimpleMode
            style={style}
            treeData={treeData}
            loadData={(onLoadData)}
            treeLine
            labelInValue
            onSelect={(value) => onChange ? onChange(value) : undefined}
        />
    </>
}
