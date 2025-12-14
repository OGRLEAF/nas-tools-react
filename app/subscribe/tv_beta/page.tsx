"use client"
import { useEffect, useMemo, useState } from "react";
import { Button, Form, List, Space, theme, Divider, Select, Flex, Input, Tooltip, Row, Col, Radio, Tag, Table, TableColumnsType, Checkbox, Spin } from "antd";
import { MediaWork, SeriesKeyType } from "@/app/utils/api/types";
import { RetweetOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, LoadingOutlined } from "@ant-design/icons"
import Image from "next/image";
import { CardsForm, useCardsFormContext } from "@/app/components/CardsForm";
import _ from "lodash";
import "./styles.scss"

import { TVSubsProfile, TVSubscribe, TVSubsResource, SubsStatus, FetchSourceConfig, SourceType } from "@/app/utils/api/subscription/subscribe_beta";
import { useMediaWork, useMediaWorks } from "@/app/utils/api/media/media_work";
import { SeriesKey } from "@/app/utils/api/media/SeriesKey";
import { MediaSearchGroup, MediaSearchSeason, MediaSearchWork } from "@/app/components/TMDBSearch/TinyTMDBSearch";


export default function SubscribeTV() {
    return <CardsForm<TVSubsResource> title="电视剧订阅" resource={TVSubscribe}
        extra={()=><Button>刷新</Button>}
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

const episodeStateColor: Record<SubsStatus, string> = {
    [SubsStatus.scheduled]: "blue",
    [SubsStatus.fetching]: "green",
    [SubsStatus.finished]: "purple",
    [SubsStatus.stalled]: "red",
    [SubsStatus.disabled]: "default"
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
        }} >编辑</Button>
    const refreshButton = <Button type="text" icon={<RetweetOutlined />}
        onClick={() => ctx.resource.action && ctx.resource.action('refresh', record)}
        size="small">刷新</Button>
    const deleteButton = <Button type="text" icon={<DeleteOutlined />} danger
        onClick={() => { ctx.resource.del && ctx.resource.del(record) }}
        size="small">删除</Button>

    const episodesList = <Space wrap>
        {episodes?.toSorted((a, b) => (a.series.e || 0) - (b.series.e || 0))
            .map((ep, idx) => {
                const episodeState = ep.series.e && record.state.episodes[ep.series.e]?.status || SubsStatus.disabled;
                return <Tag color={episodeStateColor[episodeState]} className="episode-tag" key={ep.series.e} >
                    <div>{ep.series.e}</div>
                </Tag>
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
                    <span>{metadata?.title}<Divider orientation="vertical" />{season?.metadata?.title}</span>
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
import { number_string_to_list } from "@/app/utils";
import { DownloadSettingSelect, FilterRuleSelect, PixSelect, ResTypeSelect, SiteSelect } from "@/app/components/NTSelects";
import { useForm } from "antd/es/form/Form";

const FormSection = ({ title, tooltip }: { title: string, tooltip?: string }) => {
    return <Divider titlePlacement="left" orientation="horizontal" style={{ marginTop: 0 }}>
        <Space style={{ width: "100%" }}>
            <span>{title}</span>
            {tooltip && <Tooltip title={tooltip}><QuestionCircleOutlined size={4} style={{ color: "#00000073" }} /></Tooltip>}
        </Space>
    </Divider>
}

const SubscribeTVForm = ({ record: profile, onChange }: { record?: TVSubsProfile, onChange?: (value: TVSubsProfile) => void }) => {
    const seriesKey = profile?.series_key && SeriesKey.load(profile?.series_key)
    const legacySeriesKey = useMemo(() => new SeriesKeyLegacy().type(seriesKey?.t).tmdbId(seriesKey?.i)
        .season(Number(seriesKey?.s)), [seriesKey])

    const [form] = useForm();
    const seriesKeyLegacy: SeriesKeyLegacy | undefined = Form.useWatch('_series', form)
    const [selectedSeries, setSelectedSeries] = useState<SeriesKey>();
    useEffect(() => {
        if (seriesKeyLegacy?.end == SeriesKeyType.SEASON) {
            setSelectedSeries(new SeriesKey().type(seriesKeyLegacy.t).tmdbId(String(seriesKeyLegacy.i)).season(seriesKeyLegacy.s || null)
                .episode())
        }
    }, [seriesKeyLegacy])

    return <Space orientation="vertical" style={{ width: "100%" }}>
        <Form form={form} style={{ width: "100%" }} initialValues={{
            ...profile,
            episodes: profile && Object.values(profile?.state.episodes),
            _series: legacySeriesKey
        }}
            onFinish={(values) => {
                const seriesKeyLagcy: SeriesKeyLegacy = values._series
                const seriesKey = new SeriesKey().type(seriesKeyLagcy.t).tmdbId(String(seriesKeyLagcy.i)).season(seriesKeyLagcy.s || null)
                    .episode()

                const mergedProfile = _.merge(profile, values, { series_key: seriesKey.dump(), _series: undefined })
                onChange?.({
                    id: mergedProfile.id,
                    series_key: mergedProfile.series_key,
                    state: values.state,
                    config: mergedProfile.config
                })
            }}

            layout="vertical">
            <Space orientation="vertical" style={{ width: "100%" }}>
                <Form.Item name="_series" noStyle>
                    <MediaSearchGroup>
                        <Space orientation="vertical">
                            <MediaSearchWork />
                            <MediaSearchSeason />
                        </Space>
                    </MediaSearchGroup>
                </Form.Item>
                <Form.Item name={["state", "episodes"]}>
                    <EpisodesConfig selectedSeries={selectedSeries} />
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

function EpisodesConfig({ value, onChange, selectedSeries }:
    { value?: EpisodesConfig, onChange?: (value: EpisodesConfig) => void, selectedSeries?: SeriesKey }) {
    const [configs, setConfigs] = useState(value);

    const [createConfig, setCreateConfig] = useState({ episodesString: '', status: SubsStatus.scheduled })
    const [enableOnlineEpisodes, setEnableOnlineEpisodes] = useState(false);
    const [onlineEpisodes, loading] = useMediaWorks(enableOnlineEpisodes ? selectedSeries : undefined);

    const episodesList = useMemo(() => {
        const onlineEpisodesMap = (onlineEpisodes && !loading) && _.fromPairs(onlineEpisodes?.map((ep) => [ep.series.e,
        {
            metadata: ep.metadata,
            num: ep.series.e
        }
        ]))
        return Object.values(_.merge(onlineEpisodesMap, configs) || {})
    }, [configs, onlineEpisodes, loading])

    useEffect(() => {
        if (configs) onChange?.(configs)
    }, [configs, onChange])

    useEffect(() => {
        console.log(episodesList)
    }, [episodesList])

    const ListItem = ({ item }: { item: EpisodesConfig[number] }) =>
        <Space>
            <SubsStatusRadioGroup value={item.status} onChange={(value) => {
                setConfigs((list) => ({
                    ...list, [item.num]: {
                        num: item.num,
                        status: value
                    }
                }))
            }} />
            <Button danger icon={<DeleteOutlined />} onClick={() => {
                setConfigs((list) => {
                    list && delete list[item.num]
                    return { ...list }
                })
            }}></Button>
        </Space>

    const episodesConfigColumns: TableColumnsType<EpisodesConfig[number]> = [
        {
            title: '序号',
            dataIndex: 'num',
        },
        {
            title: '标题',
            dataIndex: 'metadata',
            render: (value?: MediaWork['metadata']) => {
                return value?.title
            }
        },
        {
            title: '状态',
            render: (_, record) => <ListItem item={record} />,
            align: "right"
        },
    ];
    return <Space orientation="vertical" style={{ width: "100%" }}>
        <Table size="small" columns={episodesConfigColumns} dataSource={episodesList} rowKey={'num'}
            title={() => <Flex style={{ width: "100%" }} align="center" justify="space-between" gap={20}>
                <span>分集设置</span>
                <Spin indicator={<LoadingOutlined spin />} spinning={loading} size="small" >
                    <Checkbox checked={enableOnlineEpisodes} onChange={(evt) => setEnableOnlineEpisodes(evt.target.checked)}>
                        在线数据
                    </Checkbox>
                </Spin>
            </Flex>
            }
            footer={() => <Flex style={{ width: "100%" }} align="center" justify="end" gap={20}>
                <Input
                    style={{ width: 200 }}
                    value={createConfig.episodesString} onChange={(value) => setCreateConfig((conf) => ({ ...conf, episodesString: value.currentTarget.value }))} ></Input>
                <Space>
                    <SubsStatusSelect value={createConfig.status} onChange={(value) => setCreateConfig((conf) => ({ ...conf, status: value }))} />
                    <Button onClick={() => {
                        const episodes = number_string_to_list(createConfig.episodesString);
                        setConfigs(confs => ({
                            ...confs,
                            ...Object.fromEntries(episodes
                                .map((e) => ([e, { num: e, status: createConfig.status }])))
                        }))
                    }} >添加</Button>
                </Space>
            </Flex>}
        />
    </Space >
}

const options = [
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


function SubsStatusRadioGroup({ value, onChange, ...selectProps }: { value: SubsStatus, onChange: (value: SubsStatus) => void } & SelectProps) {


    // return <Select {...selectProps} options={options} value={value} onChange={(value) => onChange(value)} style={{ width: 100 }} />
    return <Radio.Group optionType="button" buttonStyle="solid" options={options} value={value} onChange={(e) => onChange(e.target.value)} />
}

function SubsStatusSelect({ value, onChange, ...selectProps }: { value: SubsStatus, onChange: (value: SubsStatus) => void } & SelectProps) {


    return <Select {...selectProps} options={options} value={value} onChange={(value) => onChange(value)} style={{ width: 100 }} />
    // return <Radio.Group optionType="button" buttonStyle="solid" options={options} value={value} onChange={(e) => onChange(e.target.value)} />
}
