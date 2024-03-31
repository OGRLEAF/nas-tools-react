"use client"
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Button, Col, Form, Input, InputNumber, Row, Space, Switch, Tag, theme } from "antd";
import { TVRssInfo, RssState, TVSubscription } from "@/app/utils/api/subscription/subscribe";
import { MediaSearchGroup, MediaSearchWork } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { MediaWork, MediaWorkType, SeriesKey, SeriesKeyType } from "@/app/utils/api/types";
import { DBMediaType } from "@/app/utils/api/api";
import { DownloadPathSelect, EmptyPathSelect, StringPathInput, UnionPathsSelectGroup } from "@/app/components/LibraryPathSelector";
import { DownloadSettingSelect, FilterRuleSelect, IndexerSelect, PixSelect, ResTypeSelect, SiteSelect } from "@/app/components/NTSelects";
import { useForm } from "antd/es/form/Form";
import { MediaSeasonInput } from "@/app/components/mediaImport/mediaImport";
import { RetweetOutlined } from "@ant-design/icons"
import CardnForm, { CardnFormContext } from "@/app/components/CardnForm";
import { TMDB } from "@/app/utils/api/media/tmdb";
import { ListItemCardList } from "@/app/components/CardnForm/ListItemCard";
import Image from "next/image";
import { useAPIContext } from "@/app/utils/api/api_base";


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


export default function SubscribeTV() {
    const { token } = theme.useToken();
    const StatusTag = ({
        [RssState.QUEUING]: <Tag color={token.colorInfoActive}>队列中</Tag>,
        [RssState.RUNNING]: <Tag color={token.colorSuccess}>运行中</Tag>,
        [RssState.SEARCHING]: <Tag color={token.colorSuccessActive}>搜索中</Tag>,
        [RssState.FINISH]: <Tag>已完成</Tag>,
    })
    const { API } = useAPIContext();
    return <CardnForm title="电视剧订阅"
        onFetch={() => new TVSubscription(API).list()}
        onDelete={async (record) => {
            if (record.rssid != undefined) new TVSubscription(API).delete(record.rssid);
            return true;
        }}
        extraActions={[{
            icon: <RetweetOutlined />,
            key: "refresh",
            async onClick(record) {
                if (record.rssid != undefined) new TVSubscription(API).refresh(record.rssid);
            },
        }
        ]}
        defaultRecord={defaultConfig}

        formRender={SubscribeTVForm} layout={"horizontal"}    >
        <ListItemCardList
            cardProps={(record: TVRssInfo) => ({
                cover: <div style={{ position: "relative", width: "100%", height: 175, }}>
                    <Image alt={`${record.name}`} fill style={{ objectFit: "cover", overflow: "hidden" }} sizes={"100vw"} priority={false} src={record.image} />
                </div>,
                title: <Space>
                    {record.name}
                    <Tag color="green" bordered={false}>季{record.season}</Tag>
                </Space>,
                description: StatusTag[record.state]
            })}
        />
    </CardnForm>
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
        new TVSubscription(API).update({
            ...initialConfig,
            ...value,
            type: DBMediaType.TV,
            rssid: initialConfig.rssid,
            mediaid: (detail?.key != undefined) ? String(detail?.key) : initialConfig.mediaid
        })
            .then((res) => {
                ctx.success(JSON.stringify(res))
                ctx.refresh();
                ctx.exit();
            })
            .catch((e) => {
                ctx.error(e);
            })
            .finally(() => {
                setLoading(false)
            })
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
