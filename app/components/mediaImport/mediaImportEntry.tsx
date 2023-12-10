import React, { useContext, useReducer, useState } from 'react'
import { MediaImportFile, MediaImportContext, MediaImportDispathPayload, MediaImportAction, MediaImportState, MediaImportDispatchContext, useMediaImportDispatch, MediaImportMergedContext, IdentifyHistory } from './mediaImportContext'
import { Button } from "antd"
import { VerticalAlignBottomOutlined } from '@ant-design/icons';
import { MediaIdentifyContext, SeriesKey } from '@/app/utils/api/types';
import _ from 'lodash';

const globalKeyMap = new Map<string, number>();
const reducer = (state: MediaImportState, action: MediaImportDispathPayload): MediaImportState => {
    switch (action.type) {
        case MediaImportAction.OpenWorkspace: {
            return {
                ...state,
                isImportWorkspaceOpen: true
            }
        }
        case MediaImportAction.CloseWorkspace: {
            return {
                ...state,
                isImportWorkspaceOpen: false
            }
        }
        case MediaImportAction.AppendFiles: {
            if (action.appendFiles?.length) {
                const penddingFiles: MediaImportFile[] = state.penddingFiles; // [];
                (action.appendFiles).forEach((file) => {
                    if (globalKeyMap.has(file.name)) {
                        const id = globalKeyMap.get(file.name);
                        if (id !== undefined) {
                            penddingFiles[id] = file;
                        }
                    } else {
                        penddingFiles.push(file);
                        globalKeyMap.set(file.name, penddingFiles.length - 1)
                    }
                })
                return {
                    onImportFileKeys: state.onImportFileKeys,
                    regexFilter: state.regexFilter,
                    isImportWorkspaceOpen: state.isImportWorkspaceOpen,
                    penddingFiles: penddingFiles
                }
            }
            return state;
        }
        case MediaImportAction.Flush: {
            return {
                ...state,
                penddingFiles: []
            }
        }
        case MediaImportAction.UpdateFilter: {
            return {
                ...state,
                regexFilter: action.filter || state.regexFilter
            }
        }
        case MediaImportAction.setOnImportFileKeys: {
            return {
                ...state,
                onImportFileKeys: action.fileKeys || []
            }
        }
        case MediaImportAction.SetSeries: {
            const { fileKeys, series } = action;
            if (fileKeys != undefined && series != undefined) {
                fileKeys.forEach((fileKey, index) => {
                    const id = globalKeyMap.get(fileKey);
                    if ((id != undefined) && state.penddingFiles[id]) {
                        const seriesOfFile = series[index];
                        state.penddingFiles[id].indentifyHistory = new IdentifyHistory(state.penddingFiles[id].indentifyHistory)
                        state.penddingFiles[id].indentifyHistory.push(seriesOfFile)
                    }
                })
                return { ...state }
            }

            return state
        }
        case MediaImportAction.CleanSeries: {
            const { fileKeys, series } = action;
            if (fileKeys != undefined) {
                fileKeys.forEach((fileKey, index) => {
                    const id = globalKeyMap.get(fileKey);
                    if ((id != undefined) && state.penddingFiles[id]) {
                        state.penddingFiles[id].indentifyHistory = new IdentifyHistory();
                    }
                })
                return { ...state }
            }

            return state
        }
    }
    throw Error("Unknown action,");
}


export const MediaImportProvider = ({ children }: { children: React.ReactNode }) => {
    const mediaImportManager = new MediaImportState();
    const [mediaImportData, dispath] = useReducer(reducer, mediaImportManager);
    const [merged, setMerged] = useState<MediaIdentifyContext>();
    const value = { merged, setMerged }
    return (
        <MediaImportContext.Provider value={mediaImportData}>
            <MediaImportDispatchContext.Provider value={dispath}>
                <MediaImportMergedContext.Provider value={value}>
                    {children}
                </MediaImportMergedContext.Provider>
            </MediaImportDispatchContext.Provider>
        </MediaImportContext.Provider>
    )
}


export default function MediaImportEntry({ appendFiles, flush }: { appendFiles?: MediaImportFile[], flush?: boolean }) {
    const _flush = flush || false;
    const mediaImportDispatch = useMediaImportDispatch();
    const onStartImport = () => {
        if (_flush) mediaImportDispatch({ type: MediaImportAction.Flush })
        mediaImportDispatch({ type: MediaImportAction.OpenWorkspace })
        mediaImportDispatch({ type: MediaImportAction.AppendFiles, appendFiles: appendFiles })
    }
    return (<>
        <Button disabled={appendFiles?.length == 0} type="primary" onClick={onStartImport} icon={<VerticalAlignBottomOutlined />}>导入</Button>
    </>)
}
