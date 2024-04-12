'use client'
import { Section, SectionContext } from "@/app/components/Section";
import { NastoolFileListItem } from "@/app/utils/api/api";
import { Col, Row, List, Space, Segmented, Button, theme, Table, Cascader, Input, Form, Select, Tooltip, Flex } from "antd";
import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ColumnsType } from "antd/es/table";
import FileMoreAction from "@/app/components/fileMoreAction";
import MediaImportEntry, { MediaImportProvider } from "@/app/components/mediaImport/mediaImportEntry";
import MediaImport from "@/app/components/mediaImport/mediaImport";
import { PathSearchManagerProvider, usePathManager, usePathManagerDispatch } from "@/app/components/pathManager"
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { bytes_to_human } from "@/app/utils";
import { IdentifyHistory } from "@/app/components/mediaImport/mediaImportContext";
import { useAPIContext } from "@/app/utils/api/api_base";
import path from "path";
import { FileLink } from "@/app/components/FileLink";
import { on } from "events";

type SortKey = "name" | "mtime"
type SortDirection = "dec" | "inc"
interface SortDirectionOption {
    value: SortDirection,
    label: string
}
interface SortOption {
    value: SortKey,
    label: string,
    children: SortDirectionOption[]
}

const sortDirection: SortDirectionOption[] = [{ value: "dec", label: "递增" }, { value: "inc", label: "递减" }]
const sortOption: SortOption[] = [{
    value: "name",
    label: "名称",
    children: sortDirection
}, {
    value: "mtime",
    label: "新增",
    children: sortDirection
}]

const DirectoryList = ({ dirList, loading }:
    { dirList: NastoolFileListItem[], loading: boolean }) => {
    const { token: { colorBgBase }, } = theme.useToken();
    const searchParams = useSearchParams();
    const pathParams = searchParams.get('path') ?? "/"
    const pathname = usePathname();
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, dir: SortDirection }>()
    const [filterConfig, setFilterConfig] = useState<string>("");
    const sortedDirList = useMemo(() => (
        (filterConfig ? dirList.filter((item) => item.name.includes(filterConfig)) : dirList)
            .sort((a, b) => {
                if (sortConfig?.key == "name") {
                    return sortConfig?.dir == "dec" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
                } else {
                    return sortConfig?.dir == "dec" ? a.mtime - b.mtime : b.mtime - a.mtime;
                }
            })), [dirList, sortConfig, filterConfig])

    const footer = <Space.Compact>
        <Cascader style={{ width: 130 }}
            value={[sortConfig?.key || "name", sortConfig?.dir || "dec"]}
            onChange={(value) => {
                setSortConfig({
                    // ...sortConfig,
                    key: value[0] as SortKey || sortConfig?.key || "name",
                    dir: value[1] as SortDirection || sortConfig?.dir || "dec",
                })
            }} options={sortOption} placeholder="排序" />
        <Input
            allowClear
            value={filterConfig}
            onChange={(evt) => {
                setFilterConfig(evt.target.value);
            }}
            placeholder="搜索" />
    </Space.Compact>
    const sectionContext = useContext(SectionContext);
    return (
        <Flex vertical gap={8}>
            <List
                style={{ height: sectionContext.contentHeight - 200, overflowY: "auto", backgroundColor: colorBgBase }}
                // footer={footer}
                size="small"
                bordered
                loading={loading}
                dataSource={sortedDirList}
                renderItem={(item) => {
                    // const paths = (pathParams.path as string[])//.map((value)=>value.replaceAll("%5B", "[").replaceAll("%5D", "]"))
                    const cleanName = item.name.replaceAll("#", "＃")
                    // const link = `/media/file/${paths ? paths.join("/") : ""}/${encodeURI(cleanName)}`
                    return (
                        <List.Item>
                            <Tooltip title={`${pathname}`}>
                                <FileLink targetPath={path.join(pathParams, cleanName)}>
                                    {item.name}
                                </FileLink>
                            </Tooltip>
                        </List.Item>
                    )
                }}
            />
            {footer}
        </Flex>)
}

const FileFilter = () => {

    const [toolsForm] = Form.useForm<{ filter: string }>();
    const filteringOptions = [
        {
            value: "format",
            label: "模板"
        },
        {
            value: "regex",
            label: "正则"
        }
    ]
    return <Form initialValues={{ regex_filter: ".*", filteringType: "regex" }} form={toolsForm} layout="inline">
        <Space.Compact>
            <Form.Item name="filteringType" noStyle>
                <Select options={filteringOptions} />
            </Form.Item>
            <Form.Item
                noStyle
                rules={[{
                    message: "无效的正则表达式",
                    validator: (rule, value) => {
                        try {
                            const regex = new RegExp(value);
                            return Promise.resolve(regex)
                        } catch {
                            return Promise.reject("正则表达式非法。")
                        }
                    }
                }]} name="filter">
                <Input style={{ width: 500 }} placeholder="过滤"></Input>
            </Form.Item>
        </Space.Compact>
    </Form>
}



const FileList = ({ fileList, loading, selected: defaultSelected, onSelectedChange, }: {
    fileList: NastoolFileListItem[], loading: boolean,
    selected: NastoolFileListItem[],
    onSelectedChange: (selected: NastoolFileListItem[]) => void
}) => {
    const { token: { colorTextTertiary, colorBgBase }, } = theme.useToken();
    const fileExts = new Set<string>(fileList.map(item => item.name.split(".").pop()).filter((item) => item != undefined) as string[]);

    const columns: ColumnsType<NastoolFileListItem> = [
        {
            title: <Space><span>文件</span><span style={{ color: colorTextTertiary }}>共 {fileList.length} 个文件</span></Space>,
            dataIndex: "name",
            key: "name",
            render: (text, item) => <Button style={{ padding: 0 }} type="link" size="small">{text}</Button>,
            defaultSortOrder: "descend",
            sorter: (a: NastoolFileListItem, b: NastoolFileListItem) => ((a.name > b.name) ? -1 : 1),
        },
        {
            title: "修改时间",
            dataIndex: "mtime",
            render: (mtime, item) => {
                const date = new Date(mtime * 1000);
                return <span>
                    {date.getFullYear()}/{date.getMonth()}/{date.getDate()} {date.getHours()}:{date.getMinutes()}
                </span>
            },
            defaultSortOrder: "descend",
            width: 150
        },
        {
            title: <span>体积</span>,
            render: (text, item) => {
                const [num, unit] = bytes_to_human(item.size);
                return <>{num.toFixed(2)}{unit}</>
            },
            defaultSortOrder: "descend",
            sorter: (a: NastoolFileListItem, b: NastoolFileListItem) => (a.size - b.size),
            // filters: Array.from(fileExts.keys()).map((item) => ({ text: item, value: item })),
            // onFilter: (value, record) => (record.name.split(".").pop() === value),
            width: 100,
        },
        {
            title: <span>类型</span>,
            render: (text, item) => item.name.split(".").pop(),
            defaultSortOrder: "descend",
            filters: Array.from(fileExts.keys()).map((item) => ({ text: item, value: item })),
            onFilter: (value, record) => (record.name.split(".").pop() === value),
            width: 100,
        }
    ]
    const sectionContext = useContext(SectionContext);
    const [selected, setSelected] = useState((defaultSelected || []).map(v => v.name))
    const [selectedFiles, setSelectedFiles] = useState<NastoolFileListItem[]>(defaultSelected)
    const searchParam = useSearchParams();
    useEffect(() => {
        const from = searchParam.get("from")
        if (from) {
            const assumeFile = from.split("/").pop()
            if (assumeFile) {
                const fileItem = fileList.find((item) => item.name == assumeFile);
                if (fileItem) {
                    setSelected((keys) => [...keys, assumeFile]);
                    setSelectedFiles((files) => [...files, fileItem])
                }
            }
        }
    }, [fileList, searchParam])

    useEffect(() => {
        onSelectedChange(selectedFiles)
    }, [onSelectedChange, selectedFiles])

    return <div>
        <Table
            tableLayout="fixed"
            rowSelection={{
                type: "checkbox",
                selectedRowKeys: selected,
                // columnWidth: 50,
                onChange: (selectedRowKeys: React.Key[], selectedRows: NastoolFileListItem[]) => {
                    setSelected(selectedRowKeys as string[])
                    setSelectedFiles(selectedRows)
                },
            }}
            dataSource={fileList}
            columns={columns}
            loading={loading}
            rowKey="name"
            pagination={false}
            bordered size="middle"
            scroll={{ y: sectionContext.contentHeight - 200 }}
            expandable={{
                expandedRowRender: (record: NastoolFileListItem) =>
                    <FileMoreAction file={record} relFiles={fileList} />,
                expandRowByClick: true,
                fixed: "right",
                showExpandColumn: false,
                rowExpandable: () => true
            }}
        // footer={() => <>{sectionContext.contentHeight}</>}
        >
        </Table>
    </div>
}


const MediaFileExplorer = () => {
    const [loadingState, setLoadingState] = useState(true)
    const [dirList, setDirList] = useState<NastoolFileListItem[]>([])
    const [fileList, setFileList] = useState<NastoolFileListItem[]>([])
    const [preSet, setPreSet] = useState<string[]>([])
    const pathManagerContext = usePathManager();
    const pathManagerDispath = usePathManagerDispatch();
    const router = useRouter()
    const { API } = useAPIContext();
    const [selectedFiles, setSelectedFiles] = useState<NastoolFileListItem[]>([]);


    const onRefresh = useCallback(async () => {
        setLoadingState(true);
        try {
            const deepesetPath = pathManagerContext.getDeepestRelativePath();
            const fileList = await API.getFileList(pathManagerContext.getBasePath,
                deepesetPath.replaceAll("＃", "#"));
            if (fileList.fallback_to != undefined) {
                router.replace(`/media/file?path=${fileList.fallback_to}&from=${deepesetPath}`)
            } else {
                setDirList(fileList.directories)
                setFileList(fileList.files)
                setLoadingState(false);
            }
        } catch (e) {

        }
    }, [API, pathManagerContext, router])

    useEffect(() => {
        onRefresh();
    }, [onRefresh]);

    const searchParams = useSearchParams();
    const pathParams = searchParams.get('path') ?? "/"
    useEffect(() => {
        console.log("Router", pathManagerContext.deepestPath, pathParams)
        if (path.normalize(pathParams) != path.normalize(pathManagerContext.deepestPath)) {
            console.log("Redirect")
            pathManagerDispath({ type: "set_path", path: pathParams })
        }
    }, [onRefresh, pathManagerContext, pathManagerDispath, pathParams, router])



    const importFiles = useMemo(() => selectedFiles.map((item) => ({
        name: item.name,
        path: pathManagerContext.deepestPath,
        rel: [],
        indentifyHistory: new IdentifyHistory(),
        selected: false
    })), [pathManagerContext.deepestPath, selectedFiles])

    return <MediaImportProvider>
        <MediaImport />
        <Section title="文件管理" onRefresh={onRefresh} style={{ height: "100%" }}>
            <Flex justify="space-between">
                <PathManagerBar />
                <MediaImportEntry
                    flush={true}
                    appendFiles={importFiles}
                />
                {preSet}
            </Flex>
            <Row gutter={16} >
                <Col span={6}>
                    <DirectoryList dirList={dirList} loading={loadingState} />
                </Col>
                <Col span={18}>
                    <FileList fileList={fileList}
                        loading={loadingState}
                        selected={selectedFiles}
                        onSelectedChange={(files) => setSelectedFiles(files)} />
                </Col>
            </Row>
        </Section>
    </MediaImportProvider>
}

function MediaFile() {
    return <PathSearchManagerProvider>
        <MediaFileExplorer />
    </PathSearchManagerProvider>
}

export default memo(MediaFile, (prev, next) => {
    console.log('memo', prev, next)
    return false
})


function PathManagerBar() {
    const pathManagerState = usePathManager();
    const dispath = usePathManagerDispatch();
    const segmentedPathTag = useMemo(() => pathManagerState.getPathArray().map(({ full, name }) => {
        return {
            label: <span key={full}>{name}</span>,
            value: full
        }
    }), [pathManagerState])
    const router = useRouter()
    const onPathChange = (evt: any) => {
        router.push(`/media/file?path=${evt}`)
    }
    const { token } = theme.useToken()

    return <>
        <Space>
            <Segmented
                options={segmentedPathTag}
                value={pathManagerState.deepestPath}
                onChange={onPathChange}
            />
        </Space>
    </>
}