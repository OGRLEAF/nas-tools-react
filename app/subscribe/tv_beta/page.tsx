"use client"
import React, { useMemo } from "react";
import { Button, Form, List, Space, theme, Divider } from "antd";
import { SeriesKeyType } from "@/app/utils/api/types";
import { RetweetOutlined, EditOutlined } from "@ant-design/icons"
import Image from "next/image";
import { CardsForm, useCardsFormContext } from "@/app/components/CardsForm";
import _ from "lodash";
import "./styles.scss"

import { TVSubsProfile, TVSubscribe, TVSubsResource } from "@/app/utils/api/subscription/subscribe_beta";
import { useMediaWork, useMediaWorks } from "@/app/utils/api/media/media_work";
import { SeriesKey } from "@/app/utils/api/media/SeriesKey";
import { MediaSearchGroup, MediaSearchWork } from "@/app/components/TMDBSearch/TinyTMDBSearch";

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
                description={<div style={{ overflow: "auto", height: 65, }}>{metadata?.description}</div>}
            ></List.Item.Meta>
            <div style={{ paddingBottom: 15, }}>
                {episodesList}
            </div>
        </div>
    </List.Item>
}

import { SeriesKey as SeriesKeyLegacy } from "@/app/utils/api/types";

const SubscribeTVForm = ({ record: profile }: { record?: TVSubsProfile }) => {
    const seriesKey = profile?.series_key && SeriesKey.load(profile?.series_key)
    return <Form initialValues={profile}>
        {JSON.stringify(profile)}
        {
            seriesKey && <MediaSearchGroup value={new SeriesKeyLegacy().type(seriesKey?.t).tmdbId(seriesKey.i)} >
                <MediaSearchWork />
            </MediaSearchGroup>
        }
    </Form>
}
