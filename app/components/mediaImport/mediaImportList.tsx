import { Button, Col, Divider, Drawer, Form, Input, List, Radio, Row, Select, Space, Table, Tag, TagType, Tooltip, theme } from "antd"
import { RedoOutlined, InfoCircleOutlined, LoadingOutlined } from "@ant-design/icons"
import React, { Children, useContext, useEffect, useState } from "react"
import { MediaImportContext, MediaImportFile, MediaImportFileKey, useMediaImport, useMediaImportDispatch } from "./mediaImportContext"
import { API, ImportMode, NastoolServerConfig } from "../../utils/api/api";
import { MediaImportAction } from "./mediaImportContext";
import { ColumnsType } from "antd/es/table";
import { Organize } from "@/app/utils/api/import";

import { MediaIdentify } from "@/app/utils/api/mediaIdentify";
import { PathSelector } from "../PathSelector";
import { SearchContext } from "../TMDBSearch/SearchContext";
import { MediaIdentifyContext, MediaWorkType } from "@/app/utils/api/types";
const _ = require('lodash');

const IdentifyTitleTag = ({ value, children }: { value: string, children: React.JSX.Element }) => {

    const { setKeyword } = useContext(SearchContext);
    const onTitleTagClick = (value: string) => {
        setKeyword(value);
    }

    return <Button
        type="link"
        size="small"
        disabled={!children}
        onClick={() => onTitleTagClick(value)}
    > {children}
    </Button>
}

const columns: ColumnsType<MediaImportFile> = [{
    title: "文件名",
    dataIndex: "name",
    width: 800,
    render: (name: string, item) => <TableFileName name={name} item={item} />,
    defaultSortOrder: "descend",
    shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
    sorter: (a: MediaImportFile, b: MediaImportFile) => ((a.name > b.name) ? -1 : 1),

}, {
    title: "识别",
    shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
    children: [
        {
            title: "名称",
            dataIndex: ["identifyContext", "title"],
            // width: 200,
            render: (value, record) => {
                if (value == undefined) return <></>
                return <><OverridenTag valueOrigin={value} valueOverriden={record.overridenIdentify?.title}
                    render={({ changed, children, value: finalValue }) => (
                        <IdentifyTitleTag value={finalValue}><Tag color={changed ? 'pink' : 'cyan'}>{children}</Tag></IdentifyTitleTag>)}
                />
                    <OverridenTag valueOrigin={record.identifyContext?.tmdbId} valueOverriden={record.overridenIdentify?.tmdbId}
                        render={({ changed, children }) => (
                            <Tag color={changed ? 'pink' : 'cyan'}>
                                {children}
                            </Tag>)}
                    />
                </>
            },
            shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord) // checkIdentityChange(record, prevRecord, 'title') // record.identifyContext?.title != prevRecord.identifyContext?.title || record.overridenIdentify?.title != prevRecord.overridenIdentify?.title
        },
        // {
        //     title: "TMDB",
        //     dataIndex: ["identifyContext", "tmdbId"],
        //     // width: 150,
        //     render: (value, record) => {
        //         if (value == undefined) return <></>
        //         return <OverridenTag valueOrigin={value} valueOverriden={record.overridenIdentify?.tmdbId}
        //             render={({ changed, children }) => (
        //                 <Tag color={changed ? 'pink' : 'cyan'}>
        //                     {children}
        //                 </Tag>)}
        //         />
        //     },
        //     width: 100,
        //     shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord) // checkIdentityChange(record, prevRecord, "tmdbId")
        // },
        {
            title: "季",
            dataIndex: ["identifyContext", "season"],
            // width: 50,
            render: (value, record) => {
                if (value == undefined  && record.overridenIdentify?.season === undefined) return <></>
                return <OverridenTag valueOrigin={value} valueOverriden={record.overridenIdentify?.season}
                    render={({ changed, children }) => (<Tag color={changed ? 'pink' : 'cyan'}>{children}</Tag>)}
                />
            },
            width: 50,
            shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord)  //checkIdentityChange(record, prevRecord, "season")
        },
        {
            title: "集",
            dataIndex: ["identifyContext", "episode"],
            // width: 50,
            render: (value, record) => {
                if (value === undefined && record.overridenIdentify?.episode === undefined) return <></>
                return <OverridenTag valueOrigin={value} valueOverriden={record.overridenIdentify?.episode}
                    render={({ changed, children }) => (<Tag color={changed ? 'pink' : 'cyan'}>{children}</Tag>)}
                />
            },
            width: 50,
            shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord) // checkIdentityChange(record, prevRecord, "episode")
        }
    ],
},]


export const ImportList = (options: { onSelect?: (value: MediaImportFile[]) => void }) => {
    // const mediaImportDispatch = useMediaImportDispatch();
    const mediaImportContext = useMediaImport();
    const [filteredList, setFilteredList] = useState<MediaImportFile[]>()
    const [selectedRows, setSelectedRows] = useState<MediaImportFileKey[]>([])
    const [localKeyMap, setLocalKeyMap] = useState<Map<string, MediaImportFile>>()
    useEffect(() => {
        try {
            const nameFilterRegex = new RegExp(mediaImportContext.regexFilter)
            setFilteredList(mediaImportContext.penddingFiles.filter(item => {
                return nameFilterRegex.test(item.name)
            }))

            if (mediaImportContext.penddingFiles) {
                const keyMap = new Map<string, MediaImportFile>();
                mediaImportContext.penddingFiles.forEach((file) => keyMap.set(file.name, file))
                setLocalKeyMap(keyMap)
                // console.log("keymap refreshed", keyMap)
            }

        } catch {

        }

    }, [mediaImportContext])
    useEffect(() => {
        if (options.onSelect) {
            const selected = selectedRows.map((key) => localKeyMap?.get(key)).filter(file => file !== undefined)
            options.onSelect(selected as MediaImportFile[])
        }
    }, [selectedRows, localKeyMap])
    const files: MediaImportFile[] | undefined = filteredList; //useState(Object.values(mediaImportContext.penddingFiles))

    return <Space direction="vertical" style={{ width: "100%" }} size={10}>
        <Table
            rowSelection={{
                type: "checkbox",
                onChange: (selectedRowKeys: React.Key[], selectedRows: MediaImportFile[]) => {
                    setSelectedRows(selectedRowKeys as MediaImportFileKey[])
                },
            }}
            scroll={{ y: 580, }}
            pagination={false}
            size="small"
            rowKey="name"
            dataSource={files}
            columns={columns}
        // virtual={true}
        />

    </Space>
}



const OverridenTag = (options: { valueOrigin: any, valueOverriden?: any, render: (options: { changed: boolean, children: React.JSX.Element, value: string }) => React.JSX.Element }) => {
    const WrapperRender = options.render;
    const changed = (options.valueOverriden != undefined) && options.valueOverriden != options.valueOrigin
    return <>
        {
            changed ? <Space size="small">
                {/* <WrapperRender changed={false}><del>{options.valueOrigin}</del></WrapperRender> */}
                <WrapperRender changed={true} value={options.valueOverriden}>{options.valueOverriden}</WrapperRender>
            </Space>
                : <WrapperRender value={options.valueOrigin} changed={false}>
                    {options.valueOrigin}
                </WrapperRender>
        }</>
}

export const ImportSubmit = ({ files }: { files: MediaImportFile[] }) => {
    const mergedIdentifyContext = mergeEpisodesFromSelected(files);
    // console.log(files, mergedIdentifyContext)
    const onFinish = async (value: any) => {
        const mediaSeasonSelected = mergedIdentifyContext; //mergeEpisodesFromSelected(files)

        if (!mediaSeasonSelected) return;
        const groupedMap = new Map<string, MediaImportFile[]>();
        for (const e of files) {
            if (!groupedMap.has(e.path)) {
                groupedMap.set(e.path, [e]);
            } else {
                const target = groupedMap.get(e.path);
                if (target) target.push(e);
            }

        }
        // console.log(groupedMap);
        const keys = Array.from(groupedMap.keys())

        const orgn = new Organize();
        if (mediaSeasonSelected.season) {
            for (let key of keys) {
                const target = groupedMap.get(key)
                console.log(target)
                if (target) await orgn.importTV(key, target.map(file => file.name), value.type, {
                    series: [mediaSeasonSelected.tmdbId],
                    type: MediaWorkType.TV,
                    key: mediaSeasonSelected.season,
                    title: mediaSeasonSelected.title
                })
            }
        }

        // (new Import).import()
    }

    return <Space
        style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
        <Space size={16}>
            <span>{mergedIdentifyContext?.title} #{mergedIdentifyContext?.tmdbId}</span>
            <span>季 {mergedIdentifyContext?.season}</span>

        </Space>

        <Space>

            <Form layout="inline" initialValues={{
                type: ImportMode.LINK
            }}
                onFinish={onFinish}
                disabled={!mergedIdentifyContext}
            >
                <Form.Item name="outpath">
                    <MediaLibrarySelect />
                </Form.Item>
                <Form.Item name="type">
                    <Radio.Group>
                        <Radio.Button value={ImportMode.COPY}>复制</Radio.Button>
                        <Radio.Button value={ImportMode.MOVE}>移动</Radio.Button>
                        <Radio.Button value={ImportMode.LINK}>硬链接</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item name="type">
                    <Button type="primary" htmlType="submit">导入</Button>
                </Form.Item>
            </Form>
        </Space>

    </Space>
}

const MediaLibrarySelect = (options: { value?: string, onChange?: (value: string | undefined) => void }) => {
    type OutputPathType = "auto" | "library" | "customize"
    const [librariesPath, setLibrariesPath] = useState<NastoolServerConfig['media']>();
    const [pathType, setPathType] = useState<OutputPathType>("auto");
    useEffect(() => {
        const orgn = new Organize();
        orgn.getLibrariesPath()
            .then(libraries => {
                setLibrariesPath(libraries)
            })
    }, [])

    const outputPathTypeOptions = [
        {
            label: "自动",
            value: "auto"
        },
        {
            label: "媒体库",
            value: "library"
        },
        {
            label: "自定义目录",
            value: "customize"
        }
    ]
    const handlePathTypeChange = (value: OutputPathType) => {
        setPathType(value);
        if (value == "auto") {
            if (options.onChange) options.onChange(undefined)
        }
    };
    const handlePathChange = (value: string) => {
        if (value != "auto") {
            if (options.onChange) options.onChange(value)
        }
    }
    const libraryPathOptions = [{
        label: '动漫',
        options: librariesPath?.anime_path?.map((path) => ({ label: path, value: path })),
    },
    {
        label: '电视剧',
        options: librariesPath?.tv_path?.map((path) => ({ label: path, value: path })),
    },
    {
        label: '电影',
        options: librariesPath?.movie_path?.map((path) => ({ label: path, value: path })),
    },]
    return <Space.Compact>
        <Select
            defaultValue="auto"
            style={{ width: 150 }}
            onChange={handlePathTypeChange}
            options={outputPathTypeOptions}
        />
        {
            pathType == "customize" ? <PathSelector onChange={handlePathChange} style={{ width: "400px" }} /> :
                pathType == "library" ? <Select onChange={handlePathChange} options={libraryPathOptions} style={{ width: "400px" }} /> :
                    <></>
        }
    </Space.Compact>
}

const TableFileName = (options: { name: string, item: MediaImportFile }) => {
    const { token } = theme.useToken()
    const mediaImportDispatch = useMediaImportDispatch();
    const [failed, setFailed] = useState(false);
    const onUpdateIdentfy = (file: MediaImportFile) => {
        // setLoading(true)
        return new MediaIdentify().identify(file.name)
            .then(async (result) => {
                // console.log("CALL MediaImportAction.SetIdentity", result)
                console.log(result)
                if(result.title) {
                    setFailed(false);
                    mediaImportDispatch({ type: MediaImportAction.SetIdentity, fileKeys: [file.name], identify: [result] })
                }else {
                    setFailed(true)
                }
                // console.log(result)
            })
    }
    const [loading, setLoading] = useState(false);
    return <div style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
        {options.name}
        <Space>
            <Tooltip title={JSON.stringify(options.item)}>
                <InfoCircleOutlined  style={{ color: failed? token.colorWarningTextActive:token.colorTextDescription }} />
            </Tooltip>
            <Button size="small" type="link" loading={loading} icon={<RedoOutlined />}
                onClick={() => {
                    setLoading(true)
                    onUpdateIdentfy(options.item)
                        .finally(() => setLoading(false))
                }}
            />
        </Space>
    </div>
}


function mergeEpisodesFromSelected(files: MediaImportFile[]): MediaIdentifyContext | undefined {
    if (!files?.length) {
        return
    }
    const mergedIdentifyContext = files
        .map(v => (v.overridenIdentify ? v.overridenIdentify : v.identifyContext))
        .reduce((previousValue: MediaIdentifyContext | undefined, currentValue: MediaIdentifyContext | undefined) => {
            if (previousValue && currentValue) {
                if (previousValue.tmdbId !== currentValue.tmdbId) return undefined;
                if (previousValue.season != currentValue.season) return undefined;
                if (previousValue.title !== currentValue.title) return undefined;
                return previousValue
            }
            return undefined
        })
    // console.log(mergedIdentifyContext)
    if ((mergedIdentifyContext?.tmdbId != undefined) && (mergedIdentifyContext?.season != undefined)) {
        return {
            tmdbId: mergedIdentifyContext.tmdbId,
            season: mergedIdentifyContext.season,
            type: mergedIdentifyContext.type || MediaWorkType.UNKNOWN,
            title: mergedIdentifyContext.title as string
        }
    }
}

const checkIdentityChange = (record: MediaImportFile, prevRecord: MediaImportFile, key: keyof MediaIdentifyContext): boolean => {
    // return !_.isEqual(record, prevRecord);
    if (record.identifyContext) {
        if (prevRecord.identifyContext === undefined) return true
        if (record.identifyContext[key] !== prevRecord.identifyContext[key]) return true
    }
    if (record.overridenIdentify) {
        if (prevRecord.overridenIdentify === undefined) return true
        if (record.overridenIdentify[key] !== prevRecord.overridenIdentify[key]) return true
    } else if (prevRecord.overridenIdentify) {
        return true;
    }
    return false;
} 