"use client"
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Form, List, Space, theme, Divider, InputNumber, Select, Flex, Input, Tooltip, Row, Col } from "antd";
import { SeriesKeyType } from "@/app/utils/api/types";
import { RetweetOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from "@ant-design/icons"
import Image from "next/image";
import { CardsForm, useCardsFormContext } from "@/app/components/CardsForm";
import _, { create } from "lodash";
import "./styles.scss"

import { TVSubsProfile, TVSubscribe, TVSubsResource, SubsStatus, TVSubsConfig, SubsFilter, FetchSourceConfig, SourceType } from "@/app/utils/api/subscription/subscribe_beta";
import { useMediaWork, useMediaWorks } from "@/app/utils/api/media/media_work";
import { SeriesKey } from "@/app/utils/api/media/SeriesKey";
import { MediaSearchGroup, MediaSearchSeason, MediaSearchWork } from "@/app/components/TMDBSearch/TinyTMDBSearch";

export default function SubscribeTV() {
    return <CardsForm<TVSubsResource> title="电视剧订阅" resource={TVSubscribe}
        formComponent={SubscribeTVForm}
    >
        <CardsList />
    </CardsForm>
}

function CardsList() {
    const ctx = useCardsFormContext<TVSubsResource>();
    const { resource } = ctx;
    const { useList } = resource;
    const { list } = useList();

    return <List
        itemLayout="vertical"

        dataSource={list}
        renderItem={(item) => {
            // return <>{item.series_key}</>
            return <SubsItemCard record={item} />
        }}
    />
}

function SubsItemCard({ record }: { record: TVSubsProfile }) {
    const ctx = useCardsFormContext<TVSubsResource>();
    const seriesKey = useMemo(() => SeriesKey.load(record.series_key), [record]);
    const topSeriesKey = useMemo(() => seriesKey.slice(SeriesKeyType.TMDBID), [seriesKey])
    const [season] = useMediaWork(seriesKey)
    const [topMediaWork] = useMediaWork(topSeriesKey)
    const [episodes] = useMediaWorks(seriesKey)

    const metadata = useMemo(() => topMediaWork?.metadata, [topMediaWork])

    const { token } = theme.useToken();

    const editButton = <Button type="text" icon={<EditOutlined />} size="small"
        onClick={(evt) => {
            evt.stopPropagation();
            ctx.openEditor(record, { title: <>{ctx.options.title} / {metadata?.title} / {season?.metadata?.title}</> });
        }}
    >编辑</Button>
    const refreshButton = <Button type="text" icon={<RetweetOutlined />} size="small">刷新</Button>
    const deleteButton = <Button type="text" icon={<DeleteOutlined />} danger
        onClick={() => { ctx.resource.del && ctx.resource.del(record) }}
        size="small">删除</Button>

    const episodesList = <Space wrap>
        {episodes?.toSorted((a, b) => (a.series.e || 0) - (b.series.e || 0))
            .map((ep, idx) => {
                return <Button type='primary' className="episode-tag" key={ep.series.e} >
                    <div>{ep.series.e}</div>
                </Button>
            })}
    </Space>
    return <List.Item
        key={metadata?.title}
        actions={[editButton, refreshButton, deleteButton]}
        extra={metadata?.images?.poster && <Image src={metadata.images.poster} alt={metadata?.title || "empty"} width={275} height={175} style={{ objectFit: "cover" }} />}
    >
        <div style={{ minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <List.Item.Meta
                // avatar={<Image src={record.image} alt={record.name} width={250} height={150} style={{ objectFit: "cover" }} />}
                title={<Space >
                    <span>{metadata?.title}<Divider type="vertical" />{season?.metadata?.title}</span>
                    {/* <a href={record.mediaid}>{record.name}</a> */}
                    <Space style={{ fontSize: token.fontSizeSM, color: token.colorTextDescription }}>
                        <div>季{season?.series.s}</div>
                        <div>共{episodes?.length}集</div>
                    </Space>
                </Space>
                }
                description={<div style={{ overflow: "auto", height: 55, }}>{metadata?.description}</div>}
            ></List.Item.Meta>
            <div style={{}}>
                {episodesList}
            </div>
        </div>
    </List.Item>
}

import { SeriesKey as SeriesKeyLegacy } from "@/app/utils/api/types";
import { SelectProps } from "antd/lib";
import { useForm } from "antd/es/form/Form";
import { number_string_to_list } from "@/app/utils";
import { DownloadSettingSelect, FilterRuleSelect, PixSelect, ResTypeSelect, SiteSelect } from "@/app/components/NTSelects";

const FormSection = ({ title, tooltip }: { title: string, tooltip?: string }) => {
    return <Divider orientation="left" orientationMargin={0} style={{ marginTop: 0 }}>
        <Space style={{ width: "100%" }}>
            <span>{title}</span>
            {tooltip && <Tooltip title={tooltip}><QuestionCircleOutlined size={4} style={{ color: "#00000073" }} /></Tooltip>}
        </Space>
    </Divider>
}

const SubscribeTVForm = ({ record: profile }: { record?: TVSubsProfile }) => {
    const seriesKey = profile?.series_key && SeriesKey.load(profile?.series_key)
    const legacySeriesKey = useMemo(() => new SeriesKeyLegacy().type(seriesKey?.t).tmdbId(seriesKey?.i)
        .season(Number(seriesKey?.s)), [seriesKey])

    return <Space direction="vertical" style={{ width: "100%" }}>
        <Form style={{ width: "100%" }} initialValues={{
            ...profile,
            episodes: profile && Object.values(profile?.state.episodes),
            series: legacySeriesKey
        }}
            onFinish={(values) => {
                const seriesKeyLagcy: SeriesKeyLegacy = values.series
                const seriesKey = new SeriesKey().type(seriesKeyLagcy.t).tmdbId(seriesKeyLagcy.i).season(seriesKeyLagcy.s || null)
                    .episode(-1)

                console.log(profile)
                console.log(values, seriesKey.dump())
            }}

            layout="vertical">
            <Space direction="vertical" style={{ width: "100%" }}>
                <Form.Item name="series" noStyle>
                    <MediaSearchGroup>
                        <Space direction="vertical">
                            <MediaSearchWork />
                            <MediaSearchSeason />
                        </Space>
                    </MediaSearchGroup>
                </Form.Item>
                <FormSection title="分集设置" />
                <Form.Item name={["state", "episodes"]}>
                    <EpisodesConfig />
                </Form.Item>
            </Space>
            <FormSection title="过滤设置" />

            <Row gutter={8}>
                <Col span={8}>
                    <Form.Item name={["config", "filter", "res_type"]} label="质量">
                        <ResTypeSelect unsetOption={{ value: undefined, label: "全部" }} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name={["config", "filter", "resolution"]} label="分辨率">
                        <PixSelect unsetOption={{ value: undefined, label: "全部" }} />
                    </Form.Item>
                </Col>

                <Col span={8}>
                    <Form.Item label="过滤规则" name={["config", "filter", "rule_id"]}>
                        <FilterRuleSelect />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={8}>
                <Col span={12}>
                    <Form.Item name={["config", "filter", "include"]} label="包含">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name={["config", "filter", "exclude"]} label="排除">
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item name={["config", "filter", "release_team"]} label="发布组">
                <Input />
            </Form.Item>
            <FormSection title="资源设置" />
            <Form.Item name={["config", "sources"]} style={{ width: "100%" }}>
                <SourceConfig />
            </Form.Item>
            <FormSection title="下载设置" />
            <Form.Item label="Preset" name={["config", "download_setting", "preset"]}>
                <DownloadSettingSelect />
            </Form.Item>
            <Form.Item>
                <Button htmlType="submit" type="primary">保存</Button>
            </Form.Item>

        </Form >


    </Space >
}


function SourceConfig({ value, onChange }: { value?: FetchSourceConfig[], onChange?: (value: FetchSourceConfig[]) => void }) {
    const initValue = useMemo(() => {
        const rssSites = value?.filter(value => value.type == SourceType.rss).map((item) => item.src_id) || []
        const searchSites = value?.filter(value => value.type == SourceType.search).map((item) => item.src_id) || []
        return [rssSites, searchSites]
    }, [value])
    const [sites, setSites] = useState({ rss: initValue[0], search: initValue[1] })
    const submiteData = useMemo(() => {
        return [
            ...sites.rss.map((id) => ({ type: SourceType.rss, src_id: id })),
            ...sites.search.map((id) => ({ type: SourceType.search, src_id: id }))
        ]
    }, [sites])
    useEffect(() => {
        onChange?.(submiteData)
    }, [onChange, submiteData])
    return <>
        <Form.Item label="订阅站点">
            <SiteSelect mode="multiple" value={sites.rss}
                onChange={(values) => { setSites((sites) => ({ ...sites, rss: values })) }} />
        </Form.Item>
        <Form.Item label="搜索站点">
            <SiteSelect mode="multiple" value={sites.search}
                onChange={(values) => { setSites((sites) => ({ ...sites, search: values })) }} />
        </Form.Item>
    </>
}


type EpisodesConfig = TVSubsProfile['state']['episodes']

function EpisodesConfig({ value, onChange }: { value?: EpisodesConfig, onChange?: (value: EpisodesConfig) => void }) {
    const [configs, setConfigs] = useState(value);
    const episodesList = useMemo(() => Object.values(configs || {}), [configs])

    const [createConfig, setCreateConfig] = useState({ episodesString: '', status: SubsStatus.scheduled })
    useEffect(() => {
        if (configs) onChange?.(configs)
    }, [configs, onChange])
    return <Space direction="vertical" style={{ width: "100%" }}>
        <List
            bordered
            size="small"
            dataSource={episodesList}
            renderItem={(item) => <List.Item>
                <Flex style={{ width: "100%" }} justify="space-between">
                    {item.num}
                    <Space>
                        <SubsStatusSelect size="small" value={item.status} onChange={(value) => {
                            setConfigs((list) => ({
                                ...list, [item.num]: {
                                    num: item.num,
                                    status: value
                                }
                            }))
                        }} />
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => {
                            setConfigs((list) => {
                                list && delete list[item.num]
                                return { ...list }
                            })
                        }} />
                    </Space>
                </Flex>
            </List.Item>
            }
        />
        <Space style={{ width: "100%" }}>
            <Space.Compact>
                <Input value={createConfig.episodesString} onChange={(value) => setCreateConfig((conf) => ({ ...conf, episodesString: value.currentTarget.value }))} ></Input>
                <SubsStatusSelect value={createConfig.status} onChange={(value) => setCreateConfig((conf) => ({ ...conf, status: value }))} />
            </Space.Compact>
            <Button onClick={() => {
                const episodes = number_string_to_list(createConfig.episodesString);
                setConfigs(confs => ({
                    ...confs,
                    ...Object.fromEntries(episodes.map((e) => ([e, { num: e, status: createConfig.status }])))
                }))
            }} >添加</Button>
        </Space >
    </Space >
}


function SubsStatusSelect({ value, onChange, ...selectProps }: { value: SubsStatus, onChange: (value: SubsStatus) => void } & SelectProps) {

    const options: SelectProps['options'] = [
        {
            value: SubsStatus.scheduled,
            label: "订阅"
        },
        {
            value: SubsStatus.fetching,
            label: "运行"
        },
        {
            value: SubsStatus.finished,
            label: "完成"
        },
        {
            value: SubsStatus.stalled,
            label: "暂停"
        },
        {
            value: SubsStatus.disabled,
            label: "停止"
        },
    ]
    return <Select {...selectProps} options={options} value={value} onChange={(value) => onChange(value)} style={{ width: 100 }} />
}