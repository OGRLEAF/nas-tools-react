import React, { useReducer, useContext, createContext, useEffect, useMemo } from "react"
import { Button, Segmented, Space, theme } from "antd"
import PathManager from "../utils/pathManager"
import CopyToClipboard from "@/app/components/copyToClipboard"
import { CopyOutlined } from "@ant-design/icons"
import { useParams, useSearchParams, } from "next/navigation"
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


export const PathManagerProvider = ({ children }: { children: React.ReactNode, startPath?: string }) => {
    const pathParams = useParams();
    const path: string[] = pathParams.path as string[];
    const pathManager = new PathManager('/');

    if (path) {
        const nextPath = path ? `/${path.map(decodeURIComponent).join("/")}` : "/";
        pathManager.setPath(nextPath)
    }

    const [pathManagerData, dispath] = useReducer(reducer, pathManager);
    return (
        <PathManagerContext.Provider value={pathManagerData}>
            <PathManagerDispatchContext.Provider value={dispath}>
                {children}
            </PathManagerDispatchContext.Provider>
        </PathManagerContext.Provider>
    )
}

export const PathSearchManagerProvider = ({ children }: { children: React.ReactNode, startPath?: string }) => {
    const searchParams = useSearchParams();
    const path = searchParams.get("path");

    const pathManager = new PathManager('/');

    if (path) {
        // console.log(path)
        pathManager.setPath(path)
    }

    const [pathManagerData, dispath] = useReducer(reducer, pathManager);
    return (
        <PathManagerContext.Provider value={pathManagerData}>
            <PathManagerDispatchContext.Provider value={dispath}>
                {children}
            </PathManagerDispatchContext.Provider>
        </PathManagerContext.Provider>
    )
}
