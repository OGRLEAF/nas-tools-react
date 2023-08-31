import { Button, Col, Divider, Drawer, Form, Input, List, Radio, Row, Space } from "antd"
import React, { useContext } from "react"
import { MediaImportContext, useMediaImport, useMediaImportDispatch } from "./mediaImportContext"
import { API, NastoolMediaType } from "../../utils/api";


export interface MediaImportInitial {
    type: NastoolMediaType,
    tmdbid: string
}

const TvIdentifyConfig = () => {
    return <>
        <Form.Item label="季" wrapperCol={{ span: 8 }} name="season">
            <Input />
        </Form.Item>
        <Space direction="vertical">
            <Space>
                <Form.Item label="集数指定" name="episode">
                    <Input />
                </Form.Item>
                <Form.Item label="指定Part" name="part">
                    <Input placeholder="指定Part" />
                </Form.Item>
            </Space>

            <Space>

                <Form.Item label="高级集数指定" name="adv_episode">
                    <Input />
                </Form.Item>
                <Form.Item label="起始" name="start_episode">
                    <Input placeholder="起始集" />
                </Form.Item>

                <Form.Item label="集数偏移" name="episode_offset">
                    <Input placeholder="集数偏移" />
                </Form.Item>
            </Space>
        </Space>
    </>
}

const ImportList = () => {
    const mediaImportContext = useMediaImport();
    return <>
        
        <List dataSource={mediaImportContext.penddingFiles}
            renderItem={(item) => (
                <List.Item>
                    <List.Item.Meta
                        title={item.name}
                        description={item.path}
                    />
                    {item.name}
                </List.Item>
            )}
        />
    </>
}

export default function MediaImport({ initialValue }: { initialValue?: MediaImportInitial }) {
    const mediaImportDispatch = useMediaImportDispatch();
    const mediaImportContext = useMediaImport();
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        const nastool = await API.getNastoolInstance();
        console.log(values)
    }

    const onGroup = async () => {
        const nastool = await API.getNastoolInstance();
        const files = mediaImportContext.penddingFiles.map((item)=>item.name)
        const groupResult = await nastool.groupImport(files)
        console.log(groupResult)
    }

    return (<div>
        <Drawer placement="top"
            size="large"
            open={mediaImportContext.isImportWorkspaceOpen}
            onClose={() => { mediaImportDispatch({ type: "close_workspace" }) }}
            extra={
                <Button onClick={()=>onGroup()} type="primary">识别归类</Button>
            }
        >
            <Row gutter={16} style={{height: "100%"}}>
                <Col span={8}>
                    <Form form={form}
                        layout="vertical"
                        initialValues={{
                            type: initialValue?.type || NastoolMediaType.MOVIE
                        }}
                        onFinish={onFinish}>
                        <Space>
                            <Form.Item label="类型" name="type">
                                <Radio.Group>
                                    <Radio.Button value={NastoolMediaType.MOVIE}>电影</Radio.Button>
                                    <Radio.Button value={NastoolMediaType.TV}>电视剧</Radio.Button>
                                    <Radio.Button value={NastoolMediaType.ANI}>动漫</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item wrapperCol={{ span: 24 }} label="TMDB ID" name="tmdbid">
                                <Input />
                            </Form.Item>
                        </Space>

                        <TvIdentifyConfig />
                        <Form.Item label="转移方式" name="type">
                            <Radio.Group>
                                <Radio.Button value={NastoolMediaType.MOVIE}>复制</Radio.Button>
                                <Radio.Button value={NastoolMediaType.TV}>移动</Radio.Button>
                                <Radio.Button value={NastoolMediaType.ANI}>硬链接</Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">导入</Button>
                        </Form.Item>
                    </Form>
                </Col>
                <Col span={16}  style={{height: "100%", overflowY: "auto"}}>
                    <ImportList/>
                </Col>
            </Row>
        </Drawer>
    </div>)
}