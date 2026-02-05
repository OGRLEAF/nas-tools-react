'use client'
import { Section, SectionContext } from "@/app/components/Section";
import { NastoolFileListItem } from "@/app/utils/api/api";
import { List, Space, Segmented, theme, Table, Cascader, Input, Form, Select, Flex, Splitter } from "antd";
import { BarsOutlined, BuildOutlined, FontColorsOutlined, SmallDashOutlined } from "@ant-design/icons"
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ColumnsType, TableRef } from "antd/es/table";
import FileMoreAction from "@/app/components/fileMoreAction";
import MediaImportEntry, { MediaImportProvider } from "@/app/components/MediaImport/mediaImportEntry";
import MediaImport from "@/app/components/MediaImport/mediaImport";
import { PathSearchManagerProvider, usePathManager, usePathManagerDispatch } from "@/app/components/pathManager"
import { useRouter, useSearchParams } from "next/navigation";
import { bytes_to_human } from "@/app/utils";
import { IdentifyHistory } from "@/app/components/MediaImport/mediaImportContext";
import { useAPIContext } from "@/app/utils/api/api_base";
import path from "path";
import { FileLink, useFileRouter } from "@/app/components/FileLink";
import dayjs from "dayjs";
import { TagCheckboxGroup } from "@/app/components/TagCheckbox";
import { SeriesKey } from "@/app/utils/api/media/SeriesKey";
import { Virtuoso } from "react-virtuoso";

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

    const [sortConfig, setSortConfig] = useState<{ key: SortKey, dir: SortDirection }>({ key: "name", dir: "dec" })
    const [filterConfig, setFilterConfig] = useState<string>("");
    const [matchOptions, setMatchOptions] = useState({
        matchCase: false,
        matchWholeWord: false
    })

    const filterRegexPattern = useMemo(() => {
        const surround = matchOptions.matchWholeWord ? '\\b' : ''
        const flag = matchOptions.matchCase ? '' : 'i';
        return new RegExp(`${surround}${filterConfig ?? '.*'}${surround}`, 'g' + flag)
    }, [matchOptions, filterConfig]);

    const sortedDirList = useMemo(() => (
        dirList.filter((item) => filterRegexPattern.test(item.name)).sort((a, b) => {
            if (sortConfig?.key == "name") {
                return sortConfig?.dir == "dec" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
            } else {
                return sortConfig?.dir == "dec" ? a.mtime - b.mtime : b.mtime - a.mtime;
            }
        })), [dirList, sortConfig, filterRegexPattern])

    const footer = <Space.Compact>
        <Cascader style={{ width: 130 }}
            allowClear={false}
            onChange={(value) => {
                if (value)
                    setSortConfig({
                        // ...sortConfig,
                        key: value[0] as SortKey || sortConfig?.key || "name",
                        dir: value[1] as SortDirection || sortConfig?.dir || "dec",
                    })
            }} options={sortOption} defaultValue={["name"]} placeholder="排序" />
        <Input
            allowClear

            value={filterConfig}
            suffix={<TagCheckboxGroup styles={{
                tag: {
                    marginRight: 0, marginLeft: 1, padding: '0 4px'
                }
            }}
                options={
                    [{
                        label: <FontColorsOutlined />,
                        value: 'matchCase'
                    }, {
                        label: <SmallDashOutlined />,
                        value: 'matchWholeWord'
                    }]}
                onChange={(tags) => {
                    setMatchOptions({
                        matchCase: tags.includes('matchCase'),
                        matchWholeWord: tags.includes('matchWholeWord')
                    })
                }}
            />}
            onChange={(evt) => {
                setFilterConfig(evt.target.value);
            }}
            placeholder="搜索" />
    </Space.Compact>
    const sectionContext = useContext(SectionContext);
    return (
        <Flex vertical gap={8}>
            <Virtuoso style={{
                height: sectionContext.contentHeight - 200,
                backgroundColor: colorBgBase,
                border: "1px solid var(--ant-color-border)",
                borderRadius: "var(--ant-border-radius)"

            }}
                totalCount={sortedDirList.length} itemContent={
                    (index) => {
                        const item = sortedDirList[index];
                        const cleanName = item.name.replaceAll("#", "＃")
                        return <div
                            key={cleanName}
                            style={{
                                padding: 'var(--ant-padding-xs)',
                                borderBottom: '1px solid var(--ant-color-border-secondary)',
                            }}>
                            <FileLink targetPath={path.join(pathParams, cleanName)}>
                                <span style={{ wordWrap: "break-word" }}>{item.name}</span>
                            </FileLink>
                        </div>
                    }
                } />
            {/* <List
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
                            <FileLink targetPath={path.join(pathParams, cleanName)}>
                                <span style={{ wordWrap: "break-word" }}>{item.name}</span>
                            </FileLink>
                        </List.Item>
                    )
                }}
            /> */}
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

    const columns: ColumnsType<NastoolFileListItem> = useMemo(() => {
        const fileExts = new Set<string>(fileList.map(item => item.name.split(".").pop()).filter((item) => item != undefined) as string[]);
        return [
            {
                title: <Space><span>文件</span><span style={{ color: colorTextTertiary }}>共 {fileList.length} 个文件</span></Space>,
                dataIndex: "name",
                key: "name",
                render: (text, item) => <span style={{ cursor: "pointer" }}>{text}</span>, // <Button style={{ padding: 0, width: "100%", textAlign: "start", textOverflow: "ellipsis" }} type="text" size="small">{text}</Button>,
                defaultSortOrder: "descend",
                sorter: (a: NastoolFileListItem, b: NastoolFileListItem) => ((a.name > b.name) ? -1 : 1),
            },
            {
                title: "修改时间",
                dataIndex: "mtime",
                render: (mtime, item) => {
                    const date = new Date(mtime * 1000);
                    return <span>{dayjs(date).format("YYYY/MM/DD HH:mm")} </span>
                },
                sorter: (a: NastoolFileListItem, b: NastoolFileListItem) => (a.mtime - b.mtime),
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
                shouldCellUpdate: (record, prevRecord) => record.size !== prevRecord.size

            },
            {
                title: <span>类型</span>,
                render: (text, item) => item.name.split(".").pop(),
                defaultSortOrder: "descend",
                filters: Array.from(fileExts.keys()).map((item) => ({ text: item, value: item })),
                onFilter: (value, record) => (record.name.split(".").pop() === value),
                width: 75,
            }
        ]
    }, [fileList, colorTextTertiary]);
    const sectionContext = useContext(SectionContext);
    const [selected, setSelected] = useState((defaultSelected || []).map(v => v.name))
    const [selectedFiles, setSelectedFiles] = useState<NastoolFileListItem[]>(defaultSelected)
    const searchParam = useSearchParams();
    const tableRef = useRef<TableRef>(null)
    useEffect(() => {
        const from = searchParam.get("from")
        if (from) {
            const assumeFile = from.split("/").pop()
            if (assumeFile) {
                const fileItem = fileList.find((item) => item.name == assumeFile);
                if (fileItem) {
                    tableRef.current?.scrollTo({ key: assumeFile, })
                    setSelected((keys) => [assumeFile]);
                    setSelectedFiles((files) => [...files, fileItem])
                }
            }
        }
    }, [fileList, searchParam])

    useEffect(() => {
        onSelectedChange(selectedFiles)
    }, [onSelectedChange, selectedFiles])

    return <Table
        ref={tableRef}
        rowSelection={{
            type: "checkbox",
            selectedRowKeys: selected,
            columnWidth: 50,
            onChange: (selectedRowKeys: React.Key[], selectedRows: NastoolFileListItem[]) => {
                setSelected(selectedRowKeys as string[])
                setSelectedFiles(selectedRows)
            },
        }}
        virtual={false}
        dataSource={fileList}
        columns={columns}
        loading={loading}
        rowKey="name"
        pagination={false}
        bordered size="small"
        scroll={{ y: sectionContext.contentHeight - 195 }}
        expandable={{
            expandedRowRender: (record: NastoolFileListItem) =>
                <FileMoreAction file={record} relFiles={fileList} />,
            expandRowByClick: true,
            fixed: "right",
            showExpandColumn: false,
            rowExpandable: () => true
        }}
    >
    </Table>
}

function AnalyzedFileList() {
    return <></>
}

const sectionStyle = { height: "100%" }
function MediaFileExplorer() {
    const [loadingState, setLoadingState] = useState(true)
    const [dirList, setDirList] = useState<NastoolFileListItem[]>([])
    const [fileList, setFileList] = useState<NastoolFileListItem[]>([])
    const pathState = usePathManager();
    const pathStateDispatch = usePathManagerDispatch();

    const { API } = useAPIContext();
    const [selectedFiles, setSelectedFiles] = useState<NastoolFileListItem[]>([]);
    const [view, setView] = useState<string>('plain')

    const { fallback } = useFileRouter();
    const [pathLoaded, setPathLoaded] = useState(true);
    const onRefresh = useCallback(async () => {
        setLoadingState(true);
        if (pathState.syncedWithSearchParam) {
            try {
                console.debug("Refreshing path:", pathState.currentPath.full);
                const fileList = await API.getFileList(pathState.basePath,
                    pathState.currentPath.full.replaceAll("＃", "#"));

                if (fileList.fallback_to != undefined) {
                    fallback(fileList.fallback_to, pathState.currentPath.full)
                } else {
                    setDirList(fileList.directories)
                    setFileList(fileList.files)
                    setLoadingState(false);
                }
            } catch (e) {

            }
        }

    }, [API, fallback, pathState.currentPath, pathState.basePath, pathState.syncedWithSearchParam]);

    useEffect(() => {
        onRefresh();
    }, [onRefresh]);

    const searchParams = useSearchParams();
    useEffect(() => {
        const pathParams = searchParams.get('path') ?? "/"
        if (path.normalize(pathParams) != path.normalize(pathState.currentPath.full)) {
            console.log("Path changed:", pathParams, pathState.currentPath.full)
            // pathStateDispatch({ type: "set_path", path: pathParams })
            setPathLoaded(true)
        }
    }, [pathState.currentPath, pathStateDispatch, searchParams])
    const importFiles = useMemo(() => selectedFiles.map((item) => ({
        name: item.name,
        path: `${pathState.basePath}${pathState.currentPath.full}`,
        rel: [],
        currentIdentity: new SeriesKey(),
        indentifyHistory: new IdentifyHistory(),
        selected: false
    })), [pathState.basePath, pathState.currentPath.full, selectedFiles])

    return <MediaImportProvider>
        <MediaImport />
        <Section title="文件管理" onRefresh={onRefresh} style={sectionStyle}>
            <Flex justify="space-between">
                <PathManagerBar />
                <Space>
                    <Segmented value={view} block={true} onChange={(value) => setView(value)} options={[{
                        icon: <BuildOutlined title="分析视图" />,
                        value: 'analyzed'
                    }, {
                        icon: <BarsOutlined title="平铺视图" />,
                        value: 'plain',
                    }]} />
                    <MediaImportEntry
                        flush={true}
                        appendFiles={importFiles}
                    />
                </Space>
            </Flex>
            <Splitter>
                <Splitter.Panel defaultSize="30%" min="20%" max="50%" style={{ paddingRight: '8px' }}>
                    <DirectoryList dirList={dirList} loading={loadingState} />
                </Splitter.Panel>
                <Splitter.Panel style={{ paddingLeft: '8px' }}>
                    {view == "plain" ?
                        <FileList fileList={fileList}
                            loading={loadingState}
                            selected={selectedFiles}
                            onSelectedChange={(files) => setSelectedFiles(files)} /> : <AnalyzedFileList />}
                </Splitter.Panel>
            </Splitter>

            {/* <Row gutter={14} >
                <Col span={6}>
                    <DirectoryList dirList={dirList} loading={loadingState} />
                </Col>
                <Col span={18}>
                    {view == "plain" ?
                        <FileList fileList={fileList}
                            loading={loadingState}
                            selected={selectedFiles}
                            onSelectedChange={(files) => setSelectedFiles(files)} /> : <AnalyzedFileList />}
                </Col>
            </Row> */}
        </Section>
    </MediaImportProvider>
}

export default function MediaFile() {
    return <PathSearchManagerProvider startPath="/">
        <MediaFileExplorer />
    </PathSearchManagerProvider>
}


function PathManagerBar() {
    const { deepestPath, basePath, currentPath } = usePathManager();
    const [selectedPart, setSelectedPart] = useState<string>('/');

    useEffect(() => {
        setSelectedPart(basePath + currentPath.full);
    }, [currentPath, basePath])

    const segmentedPathTag = useMemo(() => [{
        label: <span key={basePath}>{basePath}</span>,
        value: basePath
    }, ...deepestPath.parted.map((name, index) => {
        const full = basePath + deepestPath.parted.slice(0, index + 1).join("/");
        console.debug("Segmented Path Tag:", { name, full });
        return {
            label: <span key={full}>{name}</span>,
            value: full
        }
    })], [deepestPath, basePath]);

    const { push } = useFileRouter();
    return <>
        <Segmented
            options={segmentedPathTag}
            // defaultValue={pathManagerState.deepestPath}
            value={selectedPart}
            onChange={push}
        />
    </>
}        
