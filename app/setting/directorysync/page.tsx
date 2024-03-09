"use client"
import CardnForm, { CardProps, CardnFormContext } from "@/app/components/CardnForm";
import { SyncModeSelect } from "@/app/components/NTSelects";
import { DownloadPathSelect, EmptyPathSelect, LibraryPathSelect, PathTreeSelect, UnionPathsSelectGroup } from "@/app/components/LibraryPathSelector";
import { DirectorySynResource, DirectorySync, SyncDirectoryConfig, SyncDirectoryUpdateConfig, } from "@/app/utils/api/sync";
import { SyncMode } from "@/app/utils/api/types"
import { Button, Col, Descriptions, Form, Row, Space, Switch, Tag, message, theme } from "antd";
import React, { useContext } from "react";
import { CardsForm, CollapsableList } from "@/app/components/CardsForm";
import { PathSelector } from "@/app/components/PathSelector";

export default function DirectorySyncPage() {
    const { token } = theme.useToken();
    return <CardsForm<DirectorySynResource>
        title="同步目录"
        resource={DirectorySync}
        formComponent={SyncDirectoryForm}
    >
        <CollapsableList cardProps={(record: SyncDirectoryConfig) => ({
            title: <Space>
                <span>
                    {record.enabled ? <Tag color={token.colorSuccess}>启用</Tag> :
                        <Tag color={token.colorInfo}>停用</Tag>}
                </span>
                <span>{record.from}</span>
            </Space>,
            description: <Descriptions size="small" column={5}>
                {/* <Descriptions.Item label="源目录">{record.from}</Descriptions.Item> */}
                <Descriptions.Item label="目标">{record.to}</Descriptions.Item>
                <Descriptions.Item label="未识别目录">{record.unknown}</Descriptions.Item>
                <Descriptions.Item label="同步方式">{record.syncmod_name}</Descriptions.Item>
                <Descriptions.Item label="兼容">{record.compatibility ? "开" : "关"}</Descriptions.Item>
                <Descriptions.Item label="识别重命名">{record.rename ? "开" : "关"}</Descriptions.Item>
                {/* <Descriptions.Item label="">{record ? "开" : "关"}</Descriptions.Item> */}
            </Descriptions>
        })} />
    </CardsForm>
}


interface SyncDirFormType {
    from: string,
    to: string,
    unknown: string | undefined,
    syncmod: SyncDirectoryConfig['syncmod'],
    compatibility: boolean,
    rename: boolean,
    enable: boolean,

}

const SyncDirectoryForm = ({ record, onChange }: { record?: SyncDirectoryConfig, onChange?: (record: SyncDirectoryUpdateConfig) => void }) => {
    const onFinish = async (values: SyncDirFormType) => {
        const updateRecord: SyncDirectoryUpdateConfig = {
            id: record?.id,
            from: values.from,
            to: values.to,
            unknown: values.unknown || "",
            syncmod: values.syncmod,
            compatibility: values.compatibility || false,
            rename: values.rename || false,
            enabled: values.enable || false
        }
        onChange?.(updateRecord)
    }

    const initalValue: SyncDirFormType = {
        from: record?.from || "",
        to: record?.to || "",
        unknown: record?.unknown,
        syncmod: record?.syncmod || SyncMode.COPY,
        compatibility: record?.compatibility || false,
        rename: record?.rename || false,
        enable: record?.enabled || false
    }
    return <Form initialValues={initalValue} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
            <Col span={24}>
                <Form.Item label="源目录" name="from">
                    <UnionPathsSelectGroup fallback="customize">
                        <DownloadPathSelect key="download" label="下载目录" remote/>
                        <PathTreeSelect key="customize" label="自定义目录" />
                    </UnionPathsSelectGroup>
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={24}>
                <Form.Item label="目的目录" name="to" >
                    <UnionPathsSelectGroup fallback="customize">
                        <LibraryPathSelect key="library" label="媒体库目录" />
                        <PathTreeSelect key="customize" label="自定义目录" />
                    </UnionPathsSelectGroup>
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={24}>
                <Form.Item label="未识别目录" name="unknown" >
                    <UnionPathsSelectGroup fallback="customize">
                        <LibraryPathSelect key="library" label="媒体库目录" />
                        <PathTreeSelect key="customize" label="自定义目录" />
                        <EmptyPathSelect key="disable" label="不使用"/>
                    </UnionPathsSelectGroup>
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={24}>
                <Form.Item label="转移方式" name="syncmod" >
                    <SyncModeSelect />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={8}>
                <Form.Item label="兼容" name="compatibility" valuePropName="checked" >
                    <Switch />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item label="识别并重命名" name="rename" valuePropName="checked" >
                    <Switch />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item label="启用" name="enable" valuePropName="checked" >
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col span={24}>
                <Form.Item >
                    <Button type="primary" htmlType="submit">保存</Button>
                </Form.Item>
            </Col>
        </Row>
    </Form>
}
