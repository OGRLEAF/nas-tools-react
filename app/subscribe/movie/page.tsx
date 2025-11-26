"use client"
import { useContext, useEffect, useMemo, useState } from "react";

import CardnForm, { CardnFormContext } from "@/app/components/CardnForm";
import { MediaSearchGroup, MediaSearchWork } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { ResTypeSelect, PixSelect, FilterRuleSelect, DownloadSettingSelect, SiteSelect, IndexerSelect } from "@/app/components/NTSelects";
import { DownloadPathSelect, EmptyPathSelect, StringPathInput, UnionPathsSelectGroup } from "@/app/components/LibraryPathSelector";
import { DBMediaType } from "@/app/utils/api/api";
import { MovieRssInfo, MovieSubscription, RssState } from "@/app/utils/api/subscription/subscribe";
import { MediaWork, SeriesKey, MediaWorkType } from "@/app/utils/api/types";
import { Button, Col, Form, Input, Row, Space, Switch, Tag, theme } from "antd";
import { RetweetOutlined } from "@ant-design/icons"
import { useForm } from "antd/es/form/Form";
import { ListItemCardList } from "@/app/components/CardnForm/ListItemCard";
import { TMDB } from "@/app/utils/api/media/tmdb";
import Image from "next/image";

const defaultConfig: MovieRssInfo = {
    image: "",
    poster: "",
    overview: "",
    release_date: "",
    state: RssState.QUEUING,
    type: DBMediaType.MOVIE,
    name: "",
    rssid: undefined,
    in_form: "",
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
    year: ""
}


export default function SubscribeMovie() {
    const { token } = theme.useToken();

    const StatusTag = ({
        [RssState.QUEUING]: <Tag color={token.colorInfoActive}>队列中</Tag>,
        [RssState.RUNNING]: <Tag color={token.colorSuccess}>运行中</Tag>,
        [RssState.SEARCHING]: <Tag color={token.colorSuccessActive}>搜索中</Tag>,
        [RssState.FINISH]: <Tag>已完成</Tag>,
    })

    return <CardnForm<MovieRssInfo> title="电影订阅"
        onFetch={() => new MovieSubscription().list()}
        onDelete={async (record) => {
            if (record.rssid != undefined) new MovieSubscription().delete(record.rssid);
            return true;
        }}
        extraActions={[{
            icon: <RetweetOutlined />,
            key: "refresh",
            async onClick(record) {
                if (record.rssid != undefined) new MovieSubscription().refresh(record.rssid);
            },
        }
        ]}
        defaultRecord={defaultConfig}
        formRender={SubscribeMovieForm}
        layout="horizontal"
    >
        <ListItemCardList cardProps={(record: MovieRssInfo) => ({
            cover: <Image alt={record.name} width={320} height={175} style={{ maxHeight: 175, objectFit: "cover" }} src={record.image} />,
            title: record.name,
            description: StatusTag[record.state]
        })}
        />
    </CardnForm>
}



const SubscribeMovieForm = ({ record: config }: { record?: MovieRssInfo }) => {
    const [detail, setDetail] = useState<MediaWork>();
    const initialConfig = config || defaultConfig;
    const [series, setSeries] = useState(new SeriesKey().type(MediaWorkType.MOVIE).tmdbId(initialConfig.mediaid))
    const detailFromConfig = {
        series: new SeriesKey().type(MediaWorkType.MOVIE).tmdbId(initialConfig.mediaid),
        type: MediaWorkType.MOVIE,
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
    const onSelect = useMemo(() => ((value: MediaWork) => {
        setDetail(value)
        form.setFieldsValue({
            name: value.title,
            year: value.metadata?.date?.release,
        })
    }), [form])

    useEffect(() => {
        const mediaWork = new TMDB().fromSeries(series);
        mediaWork?.get().then((work) => { if (work) onSelect(work) })
    }, [series, onSelect])

    const ctx = useContext(CardnFormContext);

    const onFinish = async (value: MovieRssInfo) => {
        console.log(value, initialConfig)
        ctx.loading(String(config?.name) || "+");
        new MovieSubscription().update({
            ...initialConfig,
            ...value,
            type: DBMediaType.MOVIE,
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
    }
    return <Space orientation="vertical" style={{ width: "100%" }}>
        <MediaSearchGroup value={series} onChange={(series) => setSeries(series)}
            filter={{ type: [MediaWorkType.MOVIE] }}
        >
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