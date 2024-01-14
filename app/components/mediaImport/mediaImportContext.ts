import { MediaIdentifyContext, MediaWorkSeason, MediaWorkType, SeriesKey, mergeObjects } from "@/app/utils/api/types";
import { createContext, useContext } from "react"

export class IdentifyHistory {
    private history: SeriesKey[]
    constructor(initial?: IdentifyHistory) {
        this.history = initial?.history ?? [];
    }
    public push(series?: SeriesKey) {
        if (series == undefined) return this
        if (!this.last()?.equal(series)) {
            if (this.last()) {

                this.history.push(this.last().merge(series))
            } else {
                this.history.push(series)
            }
        }
        return this
    }
    public last() {
        return this.history[this.history.length - 1]
    }

    public lastDiffs(): [SeriesKey | undefined, SeriesKey | undefined] {
        return [this.history[this.history.length - 1], this.history[this.history.length - 2]]
    }
}

export interface MediaImportFile {
    path: string,
    name: string,
    // identifyContext?: MediaIdentifyContext,
    rel: string[],
    // overridenIdentify?: MediaIdentifyContext
    selected: boolean,
    indentifyHistory: IdentifyHistory,
}

export type MediaImportFileKey = MediaImportFile['name'];

export enum MediaImportAction {
    OpenWorkspace = "open_workspace",
    CloseWorkspace = "close_workspace",
    AppendFiles = "append_files",
    Flush = "flush_files",
    UpdateFilter = "update_filter",
    setOnImportFileKeys = "set_on_import_file_keys",
    // SetIdentity = "set_identity",
    SetSeries = "set_series",
    CleanSeries = "clean_series",
    SetSelected = "set_enabled"
    // OverrideSeries = "override_series",
    // OverrideIdentify = "override_identify"
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

export interface MediaImportDispathPayload {
    type: any,
    // fileKey?: MediaImportFile['name'],
    fileKeys?: MediaImportFile['name'][],
    appendFiles?: MediaImportFile[],
    identify?: MediaIdentifyContext | MediaIdentifyContext[],
    filter?: string,
    series?: SeriesKey[]
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