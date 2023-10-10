import React, { useContext, useReducer, useState } from 'react'
import { MediaImportFile, MediaImportContext, MediaImportDispathPayload, MediaImportAction, MediaImportState, MediaImportDispatchContext, useMediaImportDispatch, MediaImportMergedContext } from './mediaImportContext'
import { Button } from "antd"
import { VerticalAlignBottomOutlined } from '@ant-design/icons';
import { MediaIdentifyContext } from '@/app/utils/api/types';
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
        case MediaImportAction.SetIdentity: {
            if (action.fileKeys && action.identify) {
                const penddingFiles = state.penddingFiles;
                const identify = action.identify as MediaIdentifyContext[];
                action.fileKeys.forEach((fileKey, index) => {
                    const id = globalKeyMap.get(fileKey);
                    if (id !== undefined) {
                        const file = penddingFiles[id];

                        if (file) {
                            const identifyOfFile = identify[index];
                            penddingFiles[id] = { ...file };
                            penddingFiles[id].identifyContext = { ...identifyOfFile };
                            penddingFiles[id].overridenIdentify = undefined;
                            // console.log(fileKey, JSON.stringify(penddingFiles[id]))
                        }
                    }

                })
                // console.log(JSON.stringify(penddingFiles))
                return {
                    onImportFileKeys: state.onImportFileKeys,
                    regexFilter: state.regexFilter,
                    isImportWorkspaceOpen: state.isImportWorkspaceOpen,
                    penddingFiles: penddingFiles
                }
            }
            return state
        }
        case MediaImportAction.OverrideIdentify: {
            if (action.fileKeys && action.identify) {
                const penddingFiles = state.penddingFiles;
                const identify = action.identify as MediaIdentifyContext[];
                // console.log(action.fileKeys, action.identify)
                action.fileKeys.forEach((fileKey, index) => {
                    const id = globalKeyMap.get(fileKey);
                    // console.log(fileKey, id);
                    if ((id != undefined) && penddingFiles[id]) {
                        const identifyOfFile = identify[index];
                        // console.log(fileKey, JSON.stringify(identifyOfFile))
                        penddingFiles[id] = { ...penddingFiles[id] }
                        if (penddingFiles[id].identifyContext !== undefined || _.isEqual(penddingFiles[id], {})) {
                            penddingFiles[id].overridenIdentify = { ...identifyOfFile };
                        }
                        else {
                            penddingFiles[id].identifyContext = { ...identifyOfFile }
                        }
                        // console.log(fileKey, JSON.stringify(penddingFiles[id]))
                    }
                })
                // console.log(JSON.stringify(penddingFiles))
                return {
                    onImportFileKeys: state.onImportFileKeys,
                    regexFilter: state.regexFilter,
                    isImportWorkspaceOpen: state.isImportWorkspaceOpen,
                    penddingFiles: penddingFiles
                }
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
        <Button type="primary" onClick={onStartImport} icon={<VerticalAlignBottomOutlined />}>导入</Button>
    </>)
}
