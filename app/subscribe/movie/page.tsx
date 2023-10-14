"use client"
import React, { useEffect, useState } from "react";
import { Section } from "../../components/Section";
import { Button, Card, Col, Drawer, Form, Input, Row, Select, Space, Spin, Switch, Tag, theme } from "antd";
import { PlusOutlined } from "@ant-design/icons"
import { IconDatabase } from "@/app/components/icons";
import { MovieRssConfig, MovieRssInfo, MovieRssList, RssState, Subscribe } from "@/app/utils/api/subscribe";
import TinyTMDBSearch, { MediaDetailCard } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { MediaWork, MediaWorkType, SeriesKey } from "@/app/utils/api/types";
import { PathSelector } from "@/app/components/PathSelector";
import { DBMediaType, NastoolFilterruleBasic } from "@/app/utils/api/api";
import { MediaLibrarySelect } from "@/app/components/mediaImport/mediaImportList";
import { DownloadSettingSelect, FilterRuleSelect, IndexerSelect, PixSelect, ResTypeSelect, SiteSelect } from "@/app/components/NTSelects";
import { useForm } from "antd/es/form/Form";


const pixOptions = [
    {
        value: "",
        label: "全部"
    },
    ...["8k", "4k", "1080p", "720p"]
        .map((value) => ({ value: value, label: value }))
]

const SubscribeMovieForm = ({ config }: { config: MovieRssInfo }) => {
    const [detail, setDetail] = useState<MediaWork>();
    const detailFromConfig = {
        series: new SeriesKey().type(MediaWorkType.MOVIE).tmdbId(config.mediaid),
        type: MediaWorkType.MOVIE,
        key: config.mediaid,
        title: config.name,
        metadata: {
            title: config.name,
            description: config.overview,
            date: {
                release: config.year,
            },
            links: {},
            image: {
                cover: config.poster
            }
        }
    }
    const [form] = useForm();
    const onSelect = (value: MediaWork) => {
        setDetail(value)
        form.setFieldsValue({
            name: value.title,
            year: value.metadata?.date.release,
        })
    }

    const Predefined = {
        type: MediaWorkType.MOVIE,
    }

    const onFinish = (value: MovieRssInfo) => {
        console.log(value, config)
        new Subscribe().updateSubscribe({
            ...config,
            ...value,
            type: DBMediaType.MOVIE,
            rssid: config.rssid,
            mediaid: (detail?.key != undefined) ? String(detail?.key) : config.mediaid
        })
    }

    return <Space direction="vertical" style={{ width: "100%" }}>
        <TinyTMDBSearch filter={{ type: [MediaWorkType.MOVIE] }} onSelected={onSelect} />
        {/* <Spin spinning> */}
        <MediaDetailCard size="small" mediaDetail={detail || detailFromConfig} />
        {/* </Spin> */}
        <Form
            form={form}
            layout="vertical"
            initialValues={config}
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
                        <Button type="primary" htmlType="submit">保存</Button>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    </Space>
}

const SubscribeMovieCard = ({ movieRssCard }: { movieRssCard: MovieRssList[string] }) => {
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
            <Card.Meta title={movieRssCard.name}
                description={
                    <>{StatusTag}</>
                }
            ></Card.Meta>
        </Card>
        <Drawer open={open} size="large" onClose={onClose} >
            {open ? <SubscribeMovieForm config={movieRssCard} /> : <></>}
        </Drawer>
    </>
}

export default function SubscribeMovie() {
    const [movieList, setMovieList] = useState<MovieRssList>({});
    const updateMovieList = () => new Subscribe().getMovieList().then((result) => { setMovieList(result) })
    useEffect(() => {
        updateMovieList();
    }, [])
    const cards = Object.entries(movieList).map(([key, config]) => <SubscribeMovieCard key={key} movieRssCard={config} />)
    return <Section title="电影订阅"
        onRefresh={updateMovieList}
        extra={
            <Space>
                <Button icon={<PlusOutlined />} type="primary">添加订阅</Button>
                <Button icon={<IconDatabase />} >默认设置</Button>
            </Space>
        }>
        <Space wrap>
            {cards}
        </Space>
    </Section>
}