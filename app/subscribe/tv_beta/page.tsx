"use client"
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button, Col, Flex, Form, Input, InputNumber, List, Row, Space, Switch, theme, Skeleton } from "antd";
import { TVRssInfo, RssState, TVSubscription } from "@/app/utils/api/subscription/subscribe";
import { MediaSearchGroup, MediaSearchWork } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { MediaWork, MediaWorkType, SeriesKeyType } from "@/app/utils/api/types";
import { DBMediaType } from "@/app/utils/api/api";
import { DownloadPathSelect, EmptyPathSelect, StringPathInput, UnionPathsSelectGroup } from "@/app/components/LibraryPathSelector";
import { DownloadSettingSelect, FilterRuleSelect, IndexerSelect, PixSelect, ResTypeSelect, SiteSelect } from "@/app/components/NTSelects";
import { useForm } from "antd/es/form/Form";
import { MediaSeasonInput } from "@/app/components/mediaImport/mediaImport";
import { RetweetOutlined, EditOutlined } from "@ant-design/icons"
import { CardnFormContext } from "@/app/components/CardnForm";
import { TMDB } from "@/app/utils/api/media/tmdb";
import Image from "next/image";
import { useAPIContext } from "@/app/utils/api/api_base";
import { CardsForm, useCardsFormContext } from "@/app/components/CardsForm";
import _ from "lodash";
import "./styles.scss"

import { TVSubsProfile, TVSubscribe, TVSubsResource } from "@/app/utils/api/subscription/subscribe_beta";
import { useMediaWork, useMediaWorks } from "@/app/utils/api/media/media_work";
import { SeriesKey } from "@/app/utils/api/media/SeriesKey";

export default function SubscribeTV() {
    return <CardsForm<TVSubsResource> title="电视剧订阅" resource={TVSubscribe}
    // formComponent={SubscribeTVForm}
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
    // const episodes = _.range(0, record.total_ep);

    const metadata = useMemo(() => topMediaWork?.metadata, [topMediaWork])

    const { token } = theme.useToken();
    const editButton = <Button type="text" icon={<EditOutlined />} size="small"
        onClick={(evt) => {
            evt.stopPropagation();
            if (ctx.resource.update) {
                ctx.openEditor(record, { title: <>{ctx.options.title} / {metadata?.title}</> });
            }
        }}
    >编辑</Button>
    const refreshButton = <Button type="text" icon={<RetweetOutlined />} size="small"
    >刷新</Button>

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
        extra={<Image src={metadata?.images?.cover} alt={metadata?.title || "empty"} width={275} height={175} style={{ objectFit: "cover" }} />}
    >
        <div style={{ height: 150, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <List.Item.Meta
                // avatar={<Image src={record.image} alt={record.name} width={250} height={150} style={{ objectFit: "cover" }} />}
                title={<Space >
                    {metadata?.title}
                    {/* <a href={record.mediaid}>{record.name}</a> */}
                    <Space style={{ fontSize: token.fontSizeSM, color: token.colorTextDescription }}>
                        <div>季{season?.series.s}</div>
                        <div>共{episodes?.length}集</div>
                    </Space>
                </Space>
                }
                description={<div style={{ overflow: "auto", height: 65, }}>{metadata?.description}</div>}
            ></List.Item.Meta>
            <div style={{ height: 32, paddingBottom: 15, }}>
                {episodesList}
            </div>
        </div>
    </List.Item>
}


const defaultConfig: TVRssInfo = {
    image: "",
    poster: "",
    overview: "",
    release_date: "",
    state: RssState.QUEUING,
    type: DBMediaType.TV,
    in_form: "",
    name: "",
    fuzzy_match: false,
    over_edition: false,
    save_path: "",
    download_setting: 0,
    rss_sites: [],
    search_sites: [],
    filter_restype: "",
    filter_pix: "",
    filter_team: "",
    filter_rule: "",
    filter_include: "",
    filter_exclude: "",
    keyword: "",
    mediaid: "",
    year: "",
    current_ep: 0,
    total_ep: 0,
    season: 0
}



const SubscribeTVForm = ({ record: config }: { record?: TVRssInfo }) => {
    const initialConfig = config || defaultConfig;
    const [detail, setDetail] = useState<MediaWork>();
    const [autoFill, setAutoFill] = useState(false);
    const [series, setSeries] = useState(new SeriesKey().type(MediaWorkType.TV).tmdbId(initialConfig.mediaid).season(initialConfig.season))
    const detailFromConfig = {
        series: series,
        type: MediaWorkType.TV,
        key: initialConfig.mediaid,
        title: initialConfig.name,
        metadata: {
            title: initialConfig.name,
            description: initialConfig.overview,
            date: {
                release: initialConfig.year,
            },
            links: {},
            image: {
                cover: initialConfig.poster
            }
        }
    }
    const [form] = useForm();
    const onSelect = useCallback((value: MediaWork) => {
        form.setFieldsValue({
            name: value.title,
            year: value.metadata?.date?.release,
        })
    }, [form])
    useEffect(() => {
        const mediaWork = new TMDB().fromSeries(series.slice(SeriesKeyType.TMDBID));
        mediaWork?.get().then((work) => setDetail(work))
    }, [series, series.t])

    useEffect(() => {
        if (detail) onSelect(detail)
    }, [detail, onSelect])

    const seasonInForm = Form.useWatch("season", form);
    useEffect(() => {
        const newSeries = new SeriesKey(series).season(seasonInForm);
        console.log("seasonInform changed", seasonInForm, newSeries)
        if (!newSeries.equal(series)) {
            setSeries(newSeries);
            setAutoFill(true);
        }
    }, [seasonInForm, series])

    const [fillingTotalEp, setFillingTotalEp] = useState(false);
    useEffect(() => {
        console.log("Try update total ep", autoFill, series.s)
        if (autoFill) {
            if (series.end == SeriesKeyType.SEASON) {
                const media = new TMDB().fromSeries(series.slice(SeriesKeyType.SEASON));
                setFillingTotalEp(true)
                media?.get_children()
                    .then((list) => {

                        form.setFieldValue('total_ep', list.length);
                    })
                    .finally(() => {
                        setFillingTotalEp(false)
                    })
            }
        }
    }, [series, series.s, autoFill, form])

    const ctx = useContext(CardnFormContext);
    const { API } = useAPIContext()
    const [loading, setLoading] = useState(false);
    const onFinish = (value: TVRssInfo) => {
        setLoading(true)
        ctx.loading(value.name);
        // new TVSubscription(API).update({
        //     ...initialConfig,
        //     ...value,
        //     type: DBMediaType.TV,
        //     rssid: initialConfig.rssid,
        //     mediaid: (detail?.key != undefined) ? String(detail?.key) : initialConfig.mediaid
        // })
        //     .then((res) => {
        //         ctx.success(JSON.stringify(res))
        //         ctx.refresh();
        //         ctx.exit();
        //     })
        //     .catch((e) => {
        //         ctx.error(e);
        //     })
        //     .finally(() => {
        //         setLoading(false)
        //     })
    }

    return <Space direction="vertical" style={{ width: "100%" }}>
        <MediaSearchGroup value={series} filter={{ type: [MediaWorkType.TV, MediaWorkType.ANI] }}
            onChange={(series) => {
                console.log("update series")
                setSeries(new SeriesKey(series));
                setAutoFill(true);
            }}>
            <MediaSearchWork />
        </MediaSearchGroup>
        <Form
            form={form}
            layout="vertical"
            initialValues={initialConfig}
            onFinish={onFinish}
        >
            <Row gutter={16}>
                <Col span={20}>
                    <Form.Item label="标题" name="name">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={4}>
                    <Form.Item label="年份" name="year">
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item label="季度" name="season">
                        <MediaSeasonInput series={detailFromConfig.series} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="总集数" name="total_ep">
                        <InputNumber disabled={fillingTotalEp} style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="起始集数" name="current_ep">
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={16}>
                    <Form.Item label="自定义搜索词" name="keyword">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={4}>
                    <Form.Item label="模糊匹配" name="fuzzy_match" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>
                <Col span={4}>
                    <Form.Item label="洗版" name="over_edition" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={6}>
                    <Form.Item label="质量" name="filter_restype">
                        <ResTypeSelect />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="分辨率" name="filter_pix">
                        <PixSelect />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="制作组" name="filter_team">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="过滤规则" name="filter_rule">
                        <FilterRuleSelect />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="包含" name="filter_include">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="排除" name="filter_exclude">
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item label="下载设置" name="download_setting">
                        <DownloadSettingSelect />
                    </Form.Item>
                </Col>
                <Col span={16}>
                    <Form.Item label="保存路径" name="save_path">
                        <UnionPathsSelectGroup fallback="customize">
                            <EmptyPathSelect key="auto" label="自动" />
                            <DownloadPathSelect key="download" label="下载器目录" />
                            <StringPathInput key="customize" label="自定义目录" />
                        </UnionPathsSelectGroup>
                    </Form.Item>
                </Col>
            </Row>
            <Row>
                <Col span={24}>
                    <Form.Item label="订阅站点" name="rss_sites">
                        <SiteSelect mode="multiple" />
                    </Form.Item>
                </Col>
            </Row>
            <Row>
                <Col span={24}>
                    <Form.Item label="索引站点" name="search_sites">
                        <IndexerSelect />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item style={{ float: "right" }}>
                        <Button loading={loading} type="primary" htmlType="submit">保存</Button>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    </Space>
}
