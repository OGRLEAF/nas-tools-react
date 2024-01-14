'use client'
import { Section } from "@/app/components/Section";
import { API, NastoolFileListItem } from "@/app/utils/api/api";
import { Col, Row, List, Typography, Space, Segmented, Button, theme, Table, Cascader, Input, Form, Select, Tooltip } from "antd";
import { Reducer, memo, useEffect, useMemo, useReducer, useState } from "react";
import { ColumnsType } from "antd/es/table";
import FileMoreAction from "@/app/components/fileMoreAction";
import MediaImportEntry, { MediaImportProvider } from "@/app/components/mediaImport/mediaImportEntry";
import MediaImport from "@/app/components/mediaImport/mediaImport";
import { PathManagerBar, PathManagerProvider, usePathManager, usePathManagerDispatch } from "@/app/components/pathManager"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { bytes_to_human } from "@/app/utils";
import { IdentifyHistory } from "@/app/components/mediaImport/mediaImportContext";

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

const DirectoryList = ({ dirList, loading, }:
    { dirList: NastoolFileListItem[], loading: boolean }) => {
    const { token: { colorTextTertiary }, } = theme.useToken();
    const FileBrowserFooter = () => {
        return (<>
            <span style={{ color: colorTextTertiary }}>共 {dirList.length} 个文件夹</span>
        </>)
    }
    const pathParams = useParams()
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

    return (
        <Space direction="vertical" style={{ width: "100%" }}>
            <Row>
                <Col span={8}>
                    <Cascader style={{ width: 130 }}
                        value={[sortConfig?.key || "name", sortConfig?.dir || "dec"]}
                        onChange={(value) => {
                            setSortConfig({
                                // ...sortConfig,
                                key: value[0] as SortKey || sortConfig?.key || "name",
                                dir: value[1] as SortDirection || sortConfig?.dir || "dec",
                            })
                        }} options={sortOption} placeholder="排序" />
                </Col>
                <Col span={16}>
                    <Input
                        allowClear
                        value={filterConfig}
                        onChange={(evt) => {
                            setFilterConfig(evt.target.value);
                        }}
                        placeholder="搜索" />
                </Col>
            </Row>

            <List
                style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}
                footer={<FileBrowserFooter />}
                size="small"
                bordered
                loading={loading}
                dataSource={sortedDirList}
                renderItem={(item) => {
                    const paths = (pathParams.path as string[])//.map((value)=>value.replaceAll("%5B", "[").replaceAll("%5D", "]"))
                    const cleanName = item.name.replaceAll("#", "＃")
                    const link = `/media/file/${paths ? paths.join("/") : ""}/${encodeURI(cleanName)}`
                    return (
                        <List.Item>
                            <Tooltip title={`${link} ${pathname}`}>
                                <Link href={link}>{item.name}</Link>
                            </Tooltip>
                        </List.Item>
                    )
                }}
            /></Space>)
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



const FileList = ({ fileList, loading }: { fileList: NastoolFileListItem[], loading: boolean }) => {
    const { token: { colorTextTertiary }, } = theme.useToken();
    const pathManagerContext = usePathManager();
    const currentPath = pathManagerContext.deepestPath
    const fileExts = new Set<string>(fileList.map(item => item.name.split(".").pop()).filter((item) => item != undefined) as string[]);
    const [selectedFiles, setSelectedFiles] = useState<NastoolFileListItem[]>([]);
    const columns: ColumnsType<NastoolFileListItem> = [
        {
            title: <Space><span>文件</span><span style={{ color: colorTextTertiary }}>共 {fileList.length} 个文件</span></Space>,
            dataIndex: "name",
            key: "name",
            render: (text, item) => <Button type="link" size="small">{text}</Button>,
            defaultSortOrder: "descend",
            sorter: (a: NastoolFileListItem, b: NastoolFileListItem) => ((a.name > b.name) ? -1 : 1),
            width: 300,
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
            width: 50
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
            width: 25,
        },
        {
            title: <span>类型</span>,
            render: (text, item) => item.name.split(".").pop(),
            defaultSortOrder: "descend",
            filters: Array.from(fileExts.keys()).map((item) => ({ text: item, value: item })),
            onFilter: (value, record) => (record.name.split(".").pop() === value),
            width: 25,
        }
    ]
    return (
        <MediaImportProvider>
            <MediaImport></MediaImport>
            <Space direction="vertical" align="end">
                <Space size={16}>
                    <FileFilter />
                    <MediaImportEntry
                        flush={true}
                        appendFiles={
                            selectedFiles.map((item) => ({ name: item.name, path: currentPath, rel: [], indentifyHistory: new IdentifyHistory(), selected: false }))
                        } />
                </Space>
                <Table
                    rowSelection={{
                        type: "checkbox",
                        columnWidth: 10,
                        onChange: (selectedRowKeys: React.Key[], selectedRows: NastoolFileListItem[]) => {
                            setSelectedFiles(selectedRows)
                        },
                    }}
                    dataSource={fileList}
                    columns={columns}
                    loading={loading}
                    rowKey="name"

                    pagination={
                        {
                            showSizeChanger: true,
                            defaultPageSize: 20,
                        }
                    }
                    style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}
                    bordered size="middle"
                    expandable={{
                        expandedRowRender: (record: NastoolFileListItem) =>
                            <FileMoreAction file={record} relFiles={fileList} />,
                        expandRowByClick: true,
                        fixed: "right",
                        columnWidth: 16,
                        showExpandColumn: false,
                        rowExpandable: () => true
                    }}
                    scroll={{ y: 1000 }}
                >
                </Table>
            </Space>
        </MediaImportProvider>)
}


const MediaFileExplorer = () => {
    const [loadingState, setLoadingState] = useState(true)
    const [dirList, setDirList] = useState<NastoolFileListItem[]>([])
    const [fileList, setFileList] = useState<NastoolFileListItem[]>([])
    const pathManagerContext = usePathManager();
    const router = useRouter()

    const onRefresh = () => {
        setLoadingState(true);
        const nastool = API.getNastoolInstance();
        nastool.then(async (nastool) => {
            try {
                const fileList = await nastool.getFileList(pathManagerContext.getBasePath,
                    pathManagerContext.getDeepestRelativePath().replaceAll("＃", "#"));
                if (fileList.fallback_to != undefined) {
                    router.replace("/media/file" + fileList.fallback_to)
                } else {
                    setDirList(fileList.directories)
                    setFileList(fileList.files)
                    setLoadingState(false);
                }
                // console.log("refresh: ", fileList, pathManagerContext.deepestPath)

            } catch (e) {

            }
        })
    }

    useEffect(() => {
        onRefresh();
    }, []);

    useEffect(() => {
        router.push("/media/file"
            + pathManagerContext.getBasePath
            + pathManagerContext.getDeepestRelativePath())

    }, [pathManagerContext])

    // const enterDir = (dirName: string) => {
    //     pathManagerDispath({ type: "append_path", path: dirName })
    // }

    return <Section title="文件管理" onRefresh={onRefresh}>

        <Space style={{ width: "100%" }} direction="vertical">
            <Row>
                <Col span={24}>
                    {/* <Segmented options={segmentedPathTag} value={pathManagerState.deepestPath} onChange={onPathChange} /> */}
                    <PathManagerBar />
                </Col>
            </Row>

            <Row gutter={16} >
                <Col span={6}>
                    <DirectoryList dirList={dirList} loading={loadingState} />
                </Col>
                <Col span={18}>
                    <FileList fileList={fileList} loading={loadingState} />
                </Col>
            </Row>
        </Space>

    </Section>
}

function MediaFile() {
    // pathManager.setPath("mnt/S1/MainStorage/Media/Downloads/animations")
    return <PathManagerProvider>
        <MediaFileExplorer />
    </PathManagerProvider>
}

export default memo(MediaFile, (prev, next) => {
    console.log('memo', prev, next)
    return false
})