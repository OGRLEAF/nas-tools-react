import React, { useState, useEffect, createContext, useContext, useReducer, useMemo } from "react";
import { Space, TreeSelect, TreeSelectProps, theme } from "antd"
import { API, NastoolFileListItem } from "@/app/utils/api/api";
import PathManager from "../utils/pathManager";
import { DefaultOptionType } from "antd/es/select";
import { useAPIContext } from "../utils/api/api_base";

export interface PathSelectorProps {
    value?: string,
    onChange?: (value: string) => void,
    style?: React.CSSProperties
}

export const PathManagerContext = createContext<PathManager>(new PathManager("/"));
export const PathManagerDispatchContext = createContext(({ type }: { type: any, path: string }) => { });


export function PathSelector({ value, onChange, style }: PathSelectorProps) {
    const [loadingState, setLoadingState] = useState(true)
    const [treeData, setTreeData] = useState<Omit<DefaultOptionType, 'label'>[]>([]);

    const [pathManagerContext] = useState(new PathManager("/")) // useContext(PathManagerContext);
    const { API } = useAPIContext();
    useEffect(() => {
        setLoadingState(true);
        const nastool = API;
        if (nastool.loginState) {
            const basePath = pathManagerContext.getDeepestRelativePath();
            nastool.getFileList(pathManagerContext.getBasePath, pathManagerContext.getDeepestRelativePath())
                .then(fileList => {
                    setTreeData(fileList.directories.map(dir => ({
                        id: basePath + "/" + dir.name,
                        pId: basePath,
                        title: <Space>{dir.name}<span style={{ color: token.colorTextDescription }}>/</span></Space>,
                        isLeaf: !dir.is_empty,
                        value: "/" + dir.name,
                        key: "/" + dir.name
                    })))
                    setLoadingState(false);
                })
        }
    }, [API]);

    const { token } = theme.useToken();
    const onLoadData: TreeSelectProps['loadData'] = async ({ id }) => {

        pathManagerContext.setPath(id);
        // console.log(id, pathManagerContext.deepestPath)
        if (API.loginState) {
            const basePath = pathManagerContext.getDeepestRelativePath();
            (async () => {
                const fileList = await API.getFileList(pathManagerContext.getBasePath, pathManagerContext.getDeepestRelativePath());
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
                            key: key,
                        }
                    })]
                // console.log(treeData)
                setTreeData(treedata)
                setLoadingState(false);
            })()
        }
        // console.log(pathManagerContext.getDeepestRelativePath())
    }

    return <>
        <TreeSelect
            value={value}
            loading={loadingState}
            treeDataSimpleMode
            style={style}
            treeData={treeData}
            loadData={(onLoadData)}
            treeLine
            // labelInValue
            onSelect={(value) => onChange ? onChange(value) : undefined}
        />
    </>
}
