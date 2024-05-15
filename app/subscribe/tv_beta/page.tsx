"use client"
import React, { useMemo, useState } from "react";
import { Button, Form, List, Space, theme, Divider, InputNumber, Select, Flex, Input } from "antd";
import { SeriesKeyType } from "@/app/utils/api/types";
import { RetweetOutlined, EditOutlined } from "@ant-design/icons"
import Image from "next/image";
import { CardsForm, useCardsFormContext } from "@/app/components/CardsForm";
import _, { create } from "lodash";
import "./styles.scss"

import { TVSubsProfile, TVSubscribe, TVSubsResource, SubsStatus } from "@/app/utils/api/subscription/subscribe_beta";
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
        actions={[editButton, refreshButton]}
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

const SubscribeTVForm = ({ record: profile }: { record?: TVSubsProfile }) => {
    const seriesKey = profile?.series_key && SeriesKey.load(profile?.series_key)
    const legacySeriesKey = useMemo(() => new SeriesKeyLegacy().type(seriesKey?.t).tmdbId(seriesKey?.i)
        .season(Number(seriesKey?.s)), [seriesKey])


    return <Space direction="vertical">
        <Form initialValues={{
            ...profile,
            episodes: profile && Object.values(profile?.state.episodes),
            series: legacySeriesKey
        }}>
            <Form.Item name="series" noStyle>
                <MediaSearchGroup >
                    <Space direction="vertical">
                        <MediaSearchWork />
                        <MediaSearchSeason />
                    </Space>
                </MediaSearchGroup>
            </Form.Item>
            <Form.Item name={["state", "episodes"]}>
                <EpisodesConfig />
            </Form.Item>
        </Form>
    </Space >
}

type EpisodesConfig = TVSubsProfile['state']['episodes']

function EpisodesConfig({ value }: { value?: EpisodesConfig }) {
    const [configs, setConfigs] = useState(value);
    const episodesList = useMemo(() => Object.values(configs || {}), [configs])

    const [createConfig, setCreateConfig] = useState({ episodesString: '', status: SubsStatus.scheduled })
    return <><List
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
                    <Button size="small" onClick={() => {
                        setConfigs((list) => {
                            list && delete list[item.num]
                            return { ...list }
                        })
                    }}>删除</Button>
                </Space>
            </Flex>
        </List.Item>}
    />
        <Space style={{ width: "100%" }}>
            <Input value={createConfig.episodesString} onChange={(value) => setCreateConfig((conf) => ({ ...conf, episodesString: value.currentTarget.value }))} ></Input>
            <SubsStatusSelect value={createConfig.status} onChange={(value) => setCreateConfig((conf) => ({ ...conf, status: value }))} />
            <Button onClick={() => {
                const episodes = number_string_to_list(createConfig.episodesString);
                setConfigs(confs => ({
                    ...confs,
                    ...Object.fromEntries(episodes.map((e) => ([e, { num: e, status: createConfig.status }])))
                }))
            }} >添加</Button>
        </Space>
    </>
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