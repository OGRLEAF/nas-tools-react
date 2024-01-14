import React from 'react'
import { Form, Input, Row, Col, Select, InputNumber, Switch } from 'antd'
import TagsSelect from "@/app/components/TagsSelect"
import { PathSelector } from '@/app/components/PathSelector';
import { DownloadPathSelect, LibraryPathSelect, UnionPathsSelectGroup } from '@/app/components/LibraryPathSelector';

const tmdbMatchModeOption = [
    {
        label: "严格模式",
        value: "strict"
    },
    {
        label: "普通模式",
        value: "normal"
    }
]
const tmdbLangOption = [
    {
        label: "中文",
        value: "zh"
    },
    {
        label: "英语",
        value: "en"
    }
]
const donwloadOrderOption = [
    {
        label: "默认",
        value: ""
    },
    {
        label: "站点优先",
        value: "site"
    },
    {
        label: "做种数有限",
        value: "seeder"
    },
]
const openAiProviderSelection = [
    {
        label: "Azure",
        value: "azure"
    }, {
        label: "OpenAI",
        value: "openai"
    }
]
const defaultTransferMode = [
    {
        label: "复制",
        value: "copy"
    },
    {
        label: "硬链接",
        value: "link"
    },
    {
        label: "软链接",
        value: "softlink"
    },
    {
        label: "移动",
        value: "move"
    },
    {
        label: "Rclone移动",
        value: "rclone"
    },
    {
        label: "Rclone复制",
        value: "rclonecopy"
    },
    {
        label: "Minio移动",
        value: "minio"
    },
    {
        label: "Minio复制",
        value: "miniocopy"
    },

]

export default function SettingMedia() {
    const form = Form.useFormInstance();
    const provider = Form.useWatch(["openai", "provider"], form);
    const OpenAISetting = ({ provider }: { provider: string }) => {
        if (provider == "azure") {
            return <>
                <Col span={4}>
                    <Form.Item label="OpenAI API URL" name={["openai", "api_url"]}>
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={2}>
                    <Form.Item label="Deployment" name={["openai", "deployment_id"]}>
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={4}>
                    <Form.Item label="OpenAI API Key" name={["openai", "api_key"]}>
                        <Input />
                    </Form.Item>
                </Col>
            </>
        } else {
            return <>
                <Col span={4}>
                    <Form.Item label="OpenAI API URL" name={["openai", "api_url"]}>
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="OpenAI API Key" name={["openai", "api_key"]}>
                        <Input />
                    </Form.Item>
                </Col>
            </>
        }
    }
    return <>
        <Row gutter={[24, 0]}>
            <Col span={6}>
                <Form.Item label="TMDB API Key" name={["app", "rmt_tmdbkey"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="TMDB API" name={["app", "tmdb_domain"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="TMDB 匹配模式" name={["app", "rmt_match_mode"]}>
                    <Select options={tmdbMatchModeOption} />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="二级分类策略" name={["media", "category"]}>
                    <Input />
                </Form.Item>
            </Col>

        </Row>
        <Row gutter={[24, 0]}>
            <Col span={6}>
                <Form.Item label="TMDB语言" name={["media", "tmdb_language"]}>
                    <Select options={tmdbLangOption} />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="TMDB 图片代理" name={["app", "tmdb_image_url"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={2}>
                <Form.Item label="OpenAI服务" name={["openai", "provider"]}>
                    <Select options={openAiProviderSelection} />
                </Form.Item>
            </Col>
            <OpenAISetting provider={provider} />
            {/* <Col span={4}>
                <Form.Item label="OpenAI API URL" name={["openai", "api_url"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="OpenAI API Key" name={["openai", "api_key"]}>
                    <Input />
                </Form.Item>
            </Col> */}
        </Row>
        <Row gutter={[24, 0]}>
            <Col span={6}>
                <Form.Item label="下载优先规则" name={["pt", "download_order"]}>
                    <Select options={donwloadOrderOption} />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="默认文件转移方式" name={["media", "default_rmt_mode"]}>
                    <Select options={defaultTransferMode} />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="转移最小文件大小" name={["media", "min_filesize"]}>
                    <InputNumber style={{ width: "100%" }} addonAfter="MB" />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="文件管理默认路径" name={["media", "media_default_path"]}>
                    <UnionPathsSelectGroup
                        children={[{
                            type: "library",
                            label: "媒体库",
                            render: (props) => <LibraryPathSelect key="library" value={props.value} onChange={props.onChange} />
                        },
                        {
                            type: "download",
                            label: "下载目录",
                            render: (props) => <DownloadPathSelect key="download" remote={false} value={props.value} onChange={props.onChange} />
                        },
                        {
                            type: "customize",
                            label: "自定义目录",
                            render: (props) => <PathSelector key="customize" value={props.value} onChange={props.onChange} />
                        }
                        ]}
                    />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={[24, 0]}>
            <Col span={6}>
                <Form.Item label="文件路径转移忽略词" name={["media", "ignored_paths"]}>
                    <TagsSelect sep=";" />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label="文件名转移忽略词" name={["media", "ignored_files"]}>
                    <TagsSelect sep=";" />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item label="高质量文件覆盖" name={["media", "filesize_cover"]} valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={[24, 0]}>
            <Col span={12}>
                <Form.Item label="电影重命名格式" name={["media", "movie_name_format"]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item label="电视剧重命名格式" name={["media", "tv_name_format"]}>
                    <Input />
                </Form.Item>
            </Col>
        </Row>
    </>
}