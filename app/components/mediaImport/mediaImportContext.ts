import { MediaIdentifyContext, MediaWorkSeason, MediaWorkType, mergeObjects } from "@/app/utils/api/types";
import { createContext, useContext } from "react"



export interface MediaImportFile {
    path: string,
    name: string,
    identifyContext?: MediaIdentifyContext,
    rel: string[],
    overridenIdentify?: MediaIdentifyContext
}

export type MediaImportFileKey = MediaImportFile['name'];

export enum MediaImportAction {
    OpenWorkspace = "open_workspace",
    CloseWorkspace = "close_workspace",
    AppendFiles = "append_files",
    Flush = "flush_files",
    UpdateFilter = "update_filter",
    setOnImportFileKeys = "set_on_import_file_keys",
    SetIdentity = "set_identity",
    OverrideIdentify = "override_identify"
}


export class MediaImportState {
    public penddingFiles: MediaImportFile[]; // Record<string, MediaImportFile>;
    public onImportFileKeys: MediaImportFile['name'][];
    public isImportWorkspaceOpen: boolean;
    public regexFilter: string;
    constructor() {
        this.penddingFiles = [];
        this.onImportFileKeys = [];
        this.isImportWorkspaceOpen = false
        this.regexFilter = ".*"
    }

}

// export class MediaImportManager {
//     private state: MediaImportState;
//     constructor(state: MediaImportState) {
//         this.state = state;
//     }
//     public getSelectedFiles(): MediaImportFile[] {
//         const files = this.state.onImportFileKeys.map(key => this.state.penddingFiles[key])
//         return files
//     }
//     public mergeEpisodesFromSelected(): MediaIdentifyContext | undefined {
//         const files = this.getSelectedFiles();
//         if (files.length == 0) {
//             return
//         }
//         const mergedIdentifyContext = files
//             .map(v => ({ ...v.identifyContext, ...v.overridenIdentify }))
//             .reduce((a: any, b: any) => {
//                 for (const key in a) {
//                     // console.log(key, a[key], b[key])
//                     if (a[key] !== undefined && a[key] == b[key]) {
//                         return a;
//                     }
//                 }
//             })

//         if ((mergedIdentifyContext?.tmdbId != undefined) && (mergedIdentifyContext?.season != undefined)) {
//             return {
//                 tmdbId: mergedIdentifyContext.tmdbId,
//                 season: mergedIdentifyContext.season,
//                 type: mergedIdentifyContext.type || MediaWorkType.UNKNOWN,
//                 title: mergedIdentifyContext.title as string
//             }
//         }
//         // if (mergedIdentifyContext?.tmdbId && mergedIdentifyContext?.season) {
//         //     return {
//         //         series: [String(mergedIdentifyContext.tmdbId)],
//         //         key: mergedIdentifyContext.season,
//         //         type: mergedIdentifyContext.type || MediaWorkType.UNKNOWN
//         //     }
//         // }
//     }

// }

export interface MediaImportDispathPayload {
    type: any,
    // fileKey?: MediaImportFile['name'],
    fileKeys?: MediaImportFile['name'][],
    appendFiles?: MediaImportFile[],
    identify?: MediaIdentifyContext | MediaIdentifyContext[],
    filter?: string
}
export const MediaImportContext = createContext<MediaImportState>(new MediaImportState);
export const MediaImportMergedContext = createContext<{
    merged?: MediaIdentifyContext,
    setMerged: (value: MediaIdentifyContext) => void
}>({
    merged: undefined,
    setMerged: (value) => { },
});
export const MediaImportDispatchContext = createContext((payload: MediaImportDispathPayload) => { });

export function useMediaImport() {
    return useContext(MediaImportContext)
}

export function useMediaImportDispatch() {
    return useContext(MediaImportDispatchContext)
}