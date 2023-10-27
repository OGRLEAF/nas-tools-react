"use client"
import React, { useEffect, useState } from "react";
import { Section } from "../../components/Section";
import { Button, Card, Col, Drawer, Form, Input, InputNumber, Row, Select, Space, Spin, Switch, Tag, theme } from "antd";
import { PlusOutlined } from "@ant-design/icons"
import { IconDatabase } from "@/app/components/icons";
import { TVRssInfo, MovieRssList, RssState, Subscription, TvRssList } from "@/app/utils/api/subscribe";
import TinyTMDBSearch, { MediaDetailCard } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { MediaWork, MediaWorkType, SeriesKey } from "@/app/utils/api/types";
import { PathSelector } from "@/app/components/PathSelector";
import { DBMediaType, NastoolFilterruleBasic } from "@/app/utils/api/api";
import { MediaLibrarySelect } from "@/app/components/mediaImport/mediaImportList";
import { DownloadSettingSelect, FilterRuleSelect, IndexerSelect, PixSelect, ResTypeSelect, SiteSelect } from "@/app/components/NTSelects";
import { useForm } from "antd/es/form/Form";
import { MediaSeasonInput } from "@/app/components/mediaImport/mediaImport";
import DrawerPanel from "antd/es/drawer/DrawerPanel";


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

const SubscribeTVForm = ({ config }: { config?: TVRssInfo }) => {
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


    const [loading, setLoading] = useState(false);
    const onFinish = (value: TVRssInfo) => {
        console.log(value, initialConfig)
        setLoading(true)
        new Subscription().updateSubscribe({
            ...initialConfig,
            ...value,
            type: DBMediaType.TV,
            rssid: initialConfig.rssid,
            mediaid: (detail?.key != undefined) ? String(detail?.key) : initialConfig.mediaid
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

const SubscribeTVCard = ({ movieRssCard }: { movieRssCard: TvRssList[string] }) => {
    const { token } = theme.useToken();
    const StatusTag = ({
        [RssState.QUEUING]: <Tag color={token.colorInfoActive}>队列中</Tag>,
        [RssState.RUNNING]: <Tag color={token.colorSuccess}>运行中</Tag>,
        [RssState.SEARCHING]: <Tag color={token.colorSuccessActive}>搜索中</Tag>,
        [RssState.FINISH]: <Tag>已完成</Tag>,
    })[movieRssCard.state]

    const [open, setOpen] = useState(false);
    const onClose = () => { setOpen(false) }
    return <>
        <Card
            hoverable
            cover={<img src={movieRssCard.image} style={{ width: 300 }} />}
            onClick={() => setOpen(true)}
        >
            <Card.Meta title={
                <Space>
                    <span>{movieRssCard.name}</span>
                    <Tag>季{movieRssCard.season}</Tag>
                </Space>}
                description={
                    <>{StatusTag}</>
                }
            ></Card.Meta>
        </Card>
        <Drawer open={open} size="large" onClose={onClose} >
            {open ? <SubscribeTVForm config={movieRssCard} /> : <></>}
        </Drawer>
    </>
}

export default function SubscribeTV() {
    const [movieList, setMovieList] = useState<TvRssList>({});
    const updateTvList = () => new Subscription().getTvList().then((result) => { setMovieList(result) })
    useEffect(() => {
        updateTvList();
    }, [])
    const cards = Object.entries(movieList).map(([key, config]) => <SubscribeTVCard key={key} movieRssCard={config} />)

    const [openCreate, setOpenCreate] = useState(false)
    return <Section title="电影订阅"
        onRefresh={updateTvList}
        extra={
            <Space>
                <Button icon={<PlusOutlined />} onClick={() => setOpenCreate(true)} type="primary">添加订阅</Button>
                <Button icon={<IconDatabase />} >默认设置</Button>
            </Space>
        }>
        <Space wrap>
            {cards}
        </Space>
        <Drawer size="large" open={openCreate} onClose={() => setOpenCreate(false)}>
            <SubscribeTVForm />
        </Drawer>
    </Section>
}