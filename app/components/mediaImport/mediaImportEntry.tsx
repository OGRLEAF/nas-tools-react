import React, { useContext, useReducer } from 'react'
import { MediaImportFile, MediaImportContext, MediaImportManager, MediaImportDispatchContext, useMediaImportDispatch } from './mediaImportContext'
import { Button } from "antd"
import { VerticalAlignBottomOutlined } from '@ant-design/icons';

export enum MediaImportAction {
    OpenWorkspace = "open_workspace",
    CloseWorkspace = "close_workspace",
    AppendFiles = "append_files",
    Flush = "flush_files"
}


export default function MediaImportEntry({ appendFiles, flush }: { appendFiles?: MediaImportFile[], flush?: boolean }) {
    const _flush = flush || false;
    const mediaImportDispatch = useMediaImportDispatch();
    const onStartImport = () => {
        // mediaImportContextImportContext.openImportWorkspace();
        if(_flush) mediaImportDispatch({ type: MediaImportAction.Flush })
        mediaImportDispatch({ type: MediaImportAction.AppendFiles, appendFiles: appendFiles })
        mediaImportDispatch({ type: MediaImportAction.OpenWorkspace })

    }
    return (<>
        <Button type="primary" onClick={onStartImport} icon={<VerticalAlignBottomOutlined />}>导入</Button>
    </>)
}


const reducer = (state: MediaImportManager, action: { type: MediaImportAction, appendFiles?: MediaImportFile[] }): MediaImportManager => {
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
            return {
                ...state,
                penddingFiles: [...state.penddingFiles, ...(action.appendFiles || [])]
            }
        }
        case MediaImportAction.Flush: {
            return {
                ...state,
                penddingFiles: []
            }
        }
    }
    throw Error("Unknown action,");
}

const mediaImportManager = new MediaImportManager();
export const MediaImportProvider = ({ children }: { children: React.ReactNode }) => {
    const [mediaImportData, dispath] = useReducer(reducer, mediaImportManager);
    return (
        <MediaImportContext.Provider value={mediaImportData}>
            <MediaImportDispatchContext.Provider value={dispath}>
                {children}
            </MediaImportDispatchContext.Provider>
        </MediaImportContext.Provider>
    )
}