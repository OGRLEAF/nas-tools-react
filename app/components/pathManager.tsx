import React, { useReducer, useContext, createContext, useEffect, useMemo, useState, useCallback } from "react"
import PathManager from "../utils/pathManager"
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

export function usePathManager2(initialPath: string = '/', mode: "pathname" | "searchparam" = 'searchparam') {
    const searchParams = useSearchParams();
    // const pathName = usePathname();
    const [pathName] = useState<string>();
    // const router = useRouter();

    
    const [historyPath, setHistoryPath] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string>();

    const path = useMemo(()=>{
        return mode == "searchparam" ? searchParams.get("path") : pathName;
    }, [searchParams, pathName])

    useEffect(() => {
        const path = searchParams.get("path");
        if (path) {
            setCurrentPath(path);
            setHistoryPath((preHistory) => {
                return [...preHistory, path];
            })
        }
    }, [searchParams])

    const pushHistoryPath = useCallback((newPath: string) => {
        setHistoryPath((preHistory) => {
            if (newPath) return [...preHistory, newPath];
            else return preHistory
        })
    }, [])

    const pathPartedArray = useMemo(() => {
        const deepestPath = currentPath;
        if (deepestPath) {
            return deepestPath.split('/').filter((item) => item.length > 0);
        } else {
            return [];
        }
    }, [currentPath])

    const pathArray = useMemo(() => {
        const loaded: string[] = []
        return [
            {
                full: initialPath,
                name: initialPath,
                relative: ""
            },
            ...(pathPartedArray
                .map((item) => {
                    loaded.push(item);
                    return {
                        full: `${initialPath}${loaded.join("/")}`,
                        relative: loaded.join("/"),
                        name: item
                    }
                }))
        ]
    }, [pathPartedArray])

    // const push = useCallback((newPath:string)=>{
    //     console.log(newPath)
    //     // router.push(newUrl, {scroll: false})
    // }, [router]);

    return { historyPath, pathArray, pushHistoryPath }
}

export function PathSearchManagerProvider({ children }: { children: React.ReactNode, startPath?: string }) {
    const searchParams = useSearchParams();

    const pathManager = new PathManager('/');

    const [pathManagerData, dispath] = useReducer(reducer, pathManager);

    useEffect(() => {
        const path = searchParams.get("path");
        dispath({ type: 'set_path', path: path || "/" })
        if (path) pathManager.appendPath(path)
    }, [searchParams])

    return (
        <PathManagerContext.Provider value={pathManagerData}>
            <PathManagerDispatchContext.Provider value={dispath}>
                {children}
            </PathManagerDispatchContext.Provider>
        </PathManagerContext.Provider>
    )
}
