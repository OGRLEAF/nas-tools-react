import React, { useState, useEffect, createContext, useContext, useReducer, useMemo, useCallback } from "react";
import { Space, TreeSelect, TreeSelectProps, theme } from "antd"
import { FileOutlined, FolderOutlined, FolderOpenOutlined } from "@ant-design/icons"
import { API, NastoolFileList, NastoolFileListItem } from "@/app/utils/api/api";
import PathManager from "../utils/pathManager";
import { DefaultOptionType } from "antd/es/select";
import { useAPIContext } from "../utils/api/api_base";
import path from "path";
import { AntTreeNodeProps } from "antd/es/tree";

export interface PathSelectorProps {
    value?: string,
    onChange?: (value: string) => void,
    style?: React.CSSProperties,
    file?: false
}

export const PathManagerContext = createContext<PathManager>(new PathManager("/"));
export const PathManagerDispatchContext = createContext(({ type }: { type: any, path: string }) => { });


export function PathSelector({ value, onChange, style, file }: PathSelectorProps) {
    const [loadingState, setLoadingState] = useState(true)
    const [treeData, setTreeData] = useState<Omit<DefaultOptionType, 'label'>[]>([]);

    const [pathManagerContext] = useState(new PathManager("/")) // useContext(PathManagerContext);
    const { API } = useAPIContext();
    const { token } = theme.useToken();
    const displayFile = file ?? false;
    const genereateTreeData = useCallback((parentPath: string, fileList: NastoolFileList) => {
        const basePath = pathManagerContext.getBasePath;
        const { directories, files } = fileList
        const pKey = path.join(basePath, parentPath);
        const key = (name: string) => path.join(pKey, name)
        return [...directories.map(dir => ({
            id: key(dir.name),
            pId: pKey,
            title: <Space>{dir.name}<span style={{ color: token.colorTextDescription }}>{pKey}</span></Space>,
            // icon: <FolderOutlined />,
            isLeaf: !dir.is_empty,
            value: key(dir.name),
            key: key(dir.name)
        })),
        ...(displayFile ? files.map(file => ({
            id: key(file.name),
            pId: pKey,
            title: <Space>{file.name}<span style={{ color: token.colorTextDescription }}>{pKey}</span></Space>,
            isLeaf: true,
            icon: <FileOutlined />,
            value: key(file.name),
            key: key(file.name)
        })) : [])
        ]
    }, [displayFile, pathManagerContext.getBasePath, token.colorTextDescription])


    useEffect(() => {
        setLoadingState(true);
        const nastool = API;
        if (nastool.loginState) {
            const parentPath = pathManagerContext.getDeepestRelativePath();
            nastool.getFileList(pathManagerContext.getBasePath, parentPath)
                .then((fileList) => {
                    setTreeData(() => genereateTreeData(parentPath, fileList))
                    setLoadingState(false);
                })
        }
    }, [API, genereateTreeData, pathManagerContext, token.colorTextDescription]);


    const onLoadData: TreeSelectProps['loadData'] = async ({ id }) => {

        pathManagerContext.setPath(id);
        // console.log(id, pathManagerContext.deepestPath)
        if (API.loginState) {
            const basePath = pathManagerContext.getDeepestRelativePath();
            (async () => {
                const fileList = await API.getFileList(pathManagerContext.getBasePath, pathManagerContext.getDeepestRelativePath());
                setTreeData((treeData) => {
                    const ret = [
                        ...treeData,
                        ...genereateTreeData(basePath, fileList)
                    ]
                    return ret;
                })
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
            popupMatchSelectWidth={false}
            treeData={treeData}
            loadData={(onLoadData)}
            treeLine
            treeIcon
            // switcherIcon={(props: AntTreeNodeProps) => props.expanded ? <FolderOpenOutlined rotate={0}/> : <FolderOutlined rotate={270} />}
            // labelInValue
            onSelect={(value) => onChange ? onChange(value) : undefined}
        />
    </>
}
