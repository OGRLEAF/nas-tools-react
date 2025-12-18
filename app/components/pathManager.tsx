import React, { useReducer, useContext, createContext, useEffect, useMemo, useState, useCallback } from "react"
import PathManager from "../utils/pathManager"
import { useParams, useSearchParams, } from "next/navigation"


interface PathState {
    syncedWithSearchParam: boolean,
    basePath: string,
    currentPath: {
        full: string,
        parted: string[]
    },
    deepestPath: {
        full: string,
        parted: string[]
    }
}

const initialPathState: PathState = {
    syncedWithSearchParam: false,
    basePath: "",
    currentPath: {
        full: "/",
        parted: []
    },
    deepestPath: {
        full: "/",
        parted: []
    }
}

export const PathManagerContext = createContext<PathState>(initialPathState);
export const PathManagerDispatchContext = createContext(({ type }: { type: any, path: string }) => { });

type PathStateAction = {
    type: "set_path" | "append_path",
    path: string
} | {
    type: "sync_searchparam"
}

const reducer = (state: PathState, action: PathStateAction) => {
    console.debug("PathManagerReducer Action:", action, state);
    switch (action.type) {
        case "sync_searchparam":
            return {
                ...state,
                syncedWithSearchParam: true
            }
        case "set_path":
            const pathArray = action.path.split('/').filter((item) => item.length > 0);
            const currentPath = {
                full: `${pathArray.join("/")}`,
                parted: pathArray
            }
            if (currentPath.parted.length > state.deepestPath.parted.length) {
                return {
                    ...state,
                    currentPath,
                    deepestPath: currentPath
                }
            }

            if (currentPath.parted.length <= state.deepestPath.parted.length) {
                for (let i = 0; i < currentPath.parted.length; i++) {
                    if (currentPath.parted[i] != state.deepestPath.parted[i]) {
                        return {
                            ...state,
                            currentPath,
                            deepestPath: currentPath
                        }
                    }
                }
            } 
            
            const nextState = {
                ...state,
                currentPath,
            }
            console.debug("PathManagerReducer Next State:", nextState);
            return nextState;
        case "append_path":
            const newPathArray = [...state.currentPath.parted, action.path];
            const newPath = {
                full: `/${newPathArray.join("/")}`,
                parted: newPathArray
            }
            if (action.path === state.deepestPath.parted[newPath.parted.length - 1]) {
                return {
                    ...state,
                    currentPath: newPath,
                }
            }
            return {
                ...state,
                currentPath: newPath,
                deepestPath: newPath
            }
        default:
            throw Error("Unknown action,");
    }
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

    const path = useMemo(() => {
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

export function PathSearchManagerProvider({ children, startPath }: { children: React.ReactNode, startPath?: string }) {
    const searchParams = useSearchParams();

    const [pathManagerData, dispath] = useReducer(reducer, {
        ...initialPathState,
        basePath: startPath || initialPathState.basePath,
    });

    useEffect(() => {
        const path = searchParams.get("path");
        dispath({ type: 'set_path', path: path || "/" })
        dispath({ type: 'sync_searchparam' })
    }, [searchParams])

    return (
        <PathManagerContext.Provider value={pathManagerData}>
            <PathManagerDispatchContext.Provider value={dispath}>
                {children}
            </PathManagerDispatchContext.Provider>
        </PathManagerContext.Provider>
    )
}
