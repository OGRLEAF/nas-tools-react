import { createContext, useContext } from "react"

export interface MediaImportFile {
    path: string,
    name: string,
    tmdbInfo?:  {
        tmdbId: string
    },
    rel: string[]
}

export class MediaImportManager {
    public penddingFiles: MediaImportFile[]
    public isImportWorkspaceOpen: boolean;
    constructor() {
        this.penddingFiles = [];
        this.isImportWorkspaceOpen = false
    }
}

export const MediaImportContext = createContext<MediaImportManager>(new MediaImportManager);
export const MediaImportDispatchContext = createContext(({ type }: { type: any, appendFiles?: MediaImportFile[] }) => { });

export function useMediaImport() {
    return useContext(MediaImportContext)
}

export function useMediaImportDispatch() {
    return useContext(MediaImportDispatchContext)
}