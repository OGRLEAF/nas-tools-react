import React, { useReducer, useContext, createContext } from "react"
import { Button, Segmented, Space } from "antd"
import PathManager from "../utils/pathManager"
import CopyToClipboard from "@/app/components/copyToClipboard"
import { CopyOutlined } from "@ant-design/icons"
export const PathManagerContext = createContext<PathManager>(new PathManager("/"));
export const PathManagerDispatchContext = createContext(({ type }: { type: any, path: string }) => { });


const reducer = (state: PathManager, action: { type: any; path: string }) => {
    if (action.type === "set_path") {
        state.setPath(action.path);
        return new PathManager("/", state);
    } else if (action.type === "append_path") {
        return state.appendPath(action.path);
    }
    throw Error("Unknown action,");
}

export function usePathManager() {
    return useContext(PathManagerContext)
}

export function usePathManagerDispatch() {
    return useContext(PathManagerDispatchContext)
}

export function PathManagerBar() {
    const pathManagerState = usePathManager();
    const dispath = usePathManagerDispatch();
    const segmentedPathTag = pathManagerState.getPathArray().map(({ full, name }) => {
        return {
            label: (
                <span key={full}>
                    {/* <CopyToClipboard content={name}> */}
                    {name}
                    {/* </CopyToClipboard> */}
                </span>
            ),
            value: full
        }
    })
    const onPathChange = (evt: any) => {
        console.log('onPathChange', evt)
        // setLoadingState(true);
        dispath({ type: "set_path", path: evt })

    }
    const enterDir = (dirName: string) => {
        // setLoadingState(true);
        dispath({ type: "append_path", path: dirName })
    }

    return <>
        <Space>
            <Segmented
                options={segmentedPathTag}
                value={pathManagerState.deepestPath}
                onChange={onPathChange}
            />
            <CopyToClipboard content={pathManagerState.deepestPath}>
                <Button icon={<CopyOutlined />} />
            </CopyToClipboard>
        </Space>
    </>
}

export const PathManagerProvider = ({ children, startPath }:
    { children: React.ReactNode, startPath?: string }) => {

    const pathManager = new PathManager("/");
    if(startPath) pathManager.setPath(startPath)
    // pathManager.setPath("mnt/S1/MainStorage/Media/Downloads/animations")
    // pathManager.appendPath("[Airota&Nekomoe kissaten&VCB-Studio] Yuru Camp Season 2 [Ma10p_1080p]")
    const [pathManagerData, dispath] = useReducer(reducer, pathManager);

    return (
        <PathManagerContext.Provider value={pathManagerData}>
            <PathManagerDispatchContext.Provider value={dispath}>
                {children}
            </PathManagerDispatchContext.Provider>
        </PathManagerContext.Provider>
    )
}