"use client"
import React, { useContext, useEffect, useState } from "react";
import { Button, Card, Col, Drawer, Form, Input, InputNumber, Row, Select, Space, Spin, Switch, Tag, theme } from "antd";
import { TVRssInfo, MovieRssList, RssState, Subscription, TvRssList, TVSubscription } from "@/app/utils/api/subscription/subscribe";
import TinyTMDBSearch, { MediaDetailCard } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { MediaWork, MediaWorkType, SeriesKey } from "@/app/utils/api/types";
import { DBMediaType, NastoolFilterruleBasic } from "@/app/utils/api/api";
import { MediaLibrarySelect } from "@/app/components/LibraryPathSelector";
import { DownloadSettingSelect, FilterRuleSelect, IndexerSelect, PixSelect, ResTypeSelect, SiteSelect } from "@/app/components/NTSelects";
import { useForm } from "antd/es/form/Form";
import { MediaSeasonInput } from "@/app/components/mediaImport/mediaImport";
import { RetweetOutlined } from "@ant-design/icons"
import CardnForm, { CardnFormContext } from "@/app/components/CardnForm";
import { TMDB } from "@/app/utils/api/tmdb";
import { ListItemCardList } from "@/app/components/CardnForm/ListItemCard";


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

    return <CardnForm title="电影订阅"
        onFetch={() => new TVSubscription().list()}
        onDelete={async (record) => {
            if (record.rssid != undefined) new TVSubscription().delete(record.rssid);
            return true;
        }}
        extraActions={[{
            icon: <RetweetOutlined />,
            key: "refresh",
            async onClick(record) {
                if (record.rssid != undefined) new TVSubscription().refresh(record.rssid);
            },
        }
        ]}
        defaultRecord={defaultConfig}

        formRender={SubscribeTVForm} layout={"horizontal"}    >
        <ListItemCardList
            cardProps={(record: TVRssInfo) => ({
                cover: <img src={record.image} />,
                title: record.name,
                description: StatusTag[record.state]
            })}
        />
    </CardnForm>
}


const SubscribeTVForm = ({ record: config }: { record?: TVRssInfo }) => {
    const initialConfig = config || defaultConfig;
    const [detail, setDetail] = useState<MediaWork>();
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
    const onSelect = (value: MediaWork) => {
        setDetail(value)
        setSeries(value.series)
        form.setFieldsValue({
            name: value.title,
            year: value.metadata?.date.release,
        })
    }

    const season = Form.useWatch("season", form);
    useEffect(() => {
        if (season != undefined) {
            console.log(season, initialConfig.season, season != initialConfig.season)
            if (season != initialConfig.season) {
                const seasonKey = series.season(season);
                const media = new TMDB().fromSeries(seasonKey);
                media?.get_children()
                    .then((list) => {
                        console.log("season changed", season, list)
                    })

            }
        }

    }, [season])

    const ctx = useContext(CardnFormContext);
    const [loading, setLoading] = useState(false);
    const onFinish = (value: TVRssInfo) => {
        setLoading(true)
        ctx.loading(value.name);
        new TVSubscription().update({
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
        <TinyTMDBSearch filter={{ type: [MediaWorkType.TV, MediaWorkType.ANI] }} onSelected={onSelect} />
        {/* <Spin spinning> */}
        <MediaDetailCard size="small" mediaDetail={detail || detailFromConfig} />
        {/* </Spin> */}
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
                        <InputNumber style={{ width: "100%" }} />
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
                        <MediaLibrarySelect />
                    </Form.Item>
                </Col>
            </Row>
            <Row>
                <Col span={24}>
                    <Form.Item label="订阅站点" name="rss_sites">
                        <SiteSelect />
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
