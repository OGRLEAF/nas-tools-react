import React, { CSSProperties, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { NastoolServerConfig } from "../../utils/api/api";
import { RedoOutlined } from "@ant-design/icons"
import { AutoComplete, Input, Space, theme, Typography, Empty, Select, Flex, Spin, SelectProps, Button, Divider } from "antd";
import { TMDB } from "../../utils/api/media/tmdb";
import { MediaWork as MediaWorkBase, MediaWorkMetadata, useMediaWork, useMediaWorks } from "../../utils/api/media/mediaWork";
import { MediaWork, MediaWorkSeason, MediaWorkType, SeriesKey, SeriesKeyType } from "../../utils/api/types";
import { SearchContext, SearchContextType, useSearch } from "./SearchContext";
import { ServerConfig } from "@/app/utils/api/serverConfig";
import { StateMap, StateTag } from "../StateTag";
import Image from "next/image"
import { useAPIContext } from "@/app/utils/api/api_base";
import _ from "lodash";
import { SeasonKeyType } from "@/app/utils/api/media/SeriesKey";

type CardSize = "poster" | "normal" | "small" | "tiny" | "card";
interface DetailCardStyle {
    image?: CSSProperties,
    title?: CSSProperties,
    typography?: CSSProperties,
    textLimit?: number,
    maxWidth?: number,
    height?: number
}

const cardStyleMap: Record<CardSize, DetailCardStyle> = {
    "poster": {
        image: {
            height: 175
        },
        title: {
            fontSize: "1.4rem",
        },
        typography: {
            width: 350,
            height: 155,
            margin: 0
        },
        textLimit: 75,
        height: 175
    },
    "normal": {
        textLimit: 999,
        height: 250
    },
    "small": {
        image: {
            width: 150,
        },
        typography: {

        },
        textLimit: 150,
        height: 150
    },
    "card": {
        image: {
            height: 175
        },
        title: {
            fontSize: "1.4rem",
        },
        typography: {
            width: 350,
            height: 155,
            margin: 0
        },
        textLimit: 75,
        maxWidth: 700,
        height: 175
    },
    "tiny": {
        image: {
            height: 175
        },
        title: {
            fontSize: "1.4rem",
        },
        typography: {
            width: 350,
            height: 155,
            margin: 0
        },
        textLimit: 75,
        maxWidth: 400,
        height: 175
    },
}
const stateTagMap: StateMap<MediaWorkType> = {
    [MediaWorkType.TV]: {
        key: MediaWorkType.TV,
        color: "volcano",
        value: MediaWorkType.TV
    },
    [MediaWorkType.MOVIE]: {
        key: MediaWorkType.MOVIE,
        color: "volcano",
        value: MediaWorkType.MOVIE
    },
    [MediaWorkType.ANI]: {
        key: MediaWorkType.ANI,
        color: "volcano",
        value: MediaWorkType.ANI
    },
    [MediaWorkType.UNKNOWN]: {
        key: MediaWorkType.UNKNOWN,
        color: "volcano",
        value: MediaWorkType.UNKNOWN
    },
}


export function CoverImage(options: { alt: string, src: string, maxHeight?: number }) {
    const { alt, src } = options;
    const [size, setSize] = useState<{ height: number, width: number }>({ height: 0, width: 0 })
    const maxHeight = options.maxHeight ?? 250;
    return <Image alt={alt} {...size} quality={100} src={src} priority={true} sizes={`${maxHeight * 3}px`}
        style={{ objectFit: "contain", textAlign: "start", objectPosition: "top left", aspectRatio: "auto" }}
        onLoad={(evt) => {
            const { naturalHeight, naturalWidth } = evt.target as any;
            if (naturalHeight > maxHeight) {
                const ratio = naturalWidth / naturalHeight;
                setSize({ height: maxHeight, width: maxHeight * ratio })
            } else {
                setSize({ height: naturalHeight, width: naturalWidth });
            }
        }}

    />
}

export interface MediaDetailCardProps {
    mediaDetail: MediaWorkBase,
    size?: CardSize,
    action?: React.ReactNode,
    layout?: "vertical" | "horizonal",
    onTitleClick?: (mediaDetail: MediaWork) => void,
    loading?: boolean,
    postImageStyle?: CSSProperties
}

const TitleArea = memo(({ mediaDetail, action, styles }: { mediaDetail: MediaWorkBase, action?: React.ReactNode, styles?: CSSProperties }) => {
    const metadata = useMemo(() => mediaDetail.metadata, [mediaDetail])
    const { token } = theme.useToken()

    return <Flex style={{
        position: "sticky", top: 0, color: token.colorTextBase,
        fontSize: "1.6rem", margin: 0, padding: `0px ${token.padding}px 0px 5px`,
        zIndex: 1,
        ...styles
    }}  align="center" gap="small"  wrap>
        {/* <Space wrap> */}
            <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{metadata?.title}</span>
            <span style={{ fontSize: "1rem" }}> {metadata?.date?.release && metadata.date.airing}</span>
            <StateTag stateMap={stateTagMap} value={mediaDetail.series.t ?? MediaWorkType.UNKNOWN} />
            <div style={{ marginLeft: "auto" }}>{action}</div>
        {/* </Space> */}
        
    </Flex>
})

const Links = memo(({ links }: { links: MediaWorkMetadata["links"] }) => {
    return <Space separator={<Divider vertical size="small" />} size={0} wrap={true}>
        {
            Object.entries(links).map(([key, value]) =>
                <Button type="link" size="small" style={{ padding: 0 }} href={value} target="_blank">
                    {value}
                </Button>
            )
        }
    </Space>
})

export function MediaDetailCard({
    mediaDetail,
    size,
    action,
    layout,
}: MediaDetailCardProps) {
    const { token } = theme.useToken()
    const _size = size ? size : "normal";
    const style = cardStyleMap[_size];

    const metadata = useMemo(() => mediaDetail?.metadata, [mediaDetail])
    const coverImage = useMemo(() => (metadata?.images?.poster || metadata?.images?.cover), [metadata])

    const textHeight = useMemo(() => layout == "vertical" ? undefined : style.height, [layout, style.height]);
    return <Flex
        align="start"
        vertical={(layout ?? "horizontal") == "vertical"}
        gap={12}
        style={{
            marginBottom: 0,
            position: "relative",
            maxWidth: style.maxWidth,
            width: "100%",
        }}>
        {coverImage && <CoverImage maxHeight={style.height} alt={metadata?.title ?? ""} src={coverImage} />}
        <div style={{ height: textHeight, width: "100%", overflow: "auto" }}>
            {mediaDetail && <TitleArea mediaDetail={mediaDetail} action={action} styles={style.title} />}
            <div style={{ padding: "0px 4px" }}>
                {metadata && <Links links={metadata.links} />}
                <span style={{ color: token.colorTextDescription, display: "block", wordWrap: "break-word", whiteSpace: "pre-wrap" }}>
                    {metadata?.description.replaceAll("\n\n", "\n").replaceAll("\n\n", "\n")}
                </span>
            </div>
        </div>
    </Flex >
}

export default function TinyTMDBSearch({
    filter,
    onSelected,
    onChange,
    value,
}: {
    filter?: {
        type: MediaWorkType[],
    },
    onSelected?: (value: MediaWork) => void,
    onChange?: (value: string) => void,
    value?: string
}) {
    const { token } = theme.useToken();
    const [options, setOptions] = useState<{ label: React.JSX.Element, value: string }[]>([])
    const [searchResults, setSearchResults] = useState<Record<string, MediaWork>>({})

    const searchContext = useContext(SearchContext);
    const { keyword: contextKeyword, setKeyword: setContextKeyword, setSelected } = searchContext;
    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [openResults, setOpenResults] = useState<boolean>(false)

    const onSearch = useCallback((value: string) => {
        setContextKeyword(value);
        setLoading(true)
        const tmdb = new TMDB()
        tmdb.search(value)
            .then((result) => {

                setOptions(result
                    .filter((item) => {
                        if (filter && item.series?.t != undefined) {
                            return (filter.type.indexOf(item.series?.t) > -1)
                        }
                        return true
                    })
                    .map(resultItem => ({
                        value: `${resultItem.title} (${resultItem.key})`,
                        label: <div
                            key={resultItem.key}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: "center"
                            }}
                        >
                            <span>{resultItem.title} ({resultItem.metadata?.date?.release})</span>
                            <span style={{ display: "block", textAlign: "left", lineHeight: "1em", paddingLeft: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: token.colorTextDescription }}>
                                {resultItem.metadata?.description.trimStart()}
                            </span>

                        </div>,
                    })))

                setSearchResults(result.reduce((a, v) => ({ ...a, [`${v.title} (${v.key})`]: v }), {}))
                setOpenResults(true)

            })
            .finally(() => setLoading(false))
    }, [setLoading, setContextKeyword])

    useEffect(() => {
        setKeyword(contextKeyword)
    }, [contextKeyword])

    const _onSelect = (value: any) => {
        setOpenResults(false)
        const mediaWork = searchResults[value];
        // setKeyword(mediaWork.title)
        // setSelected(mediaWork)
        setKeyword(mediaWork.title)
        if (onSelected) onSelected(mediaWork);
        if (onChange) onChange(String(mediaWork.key))
    }

    const [searchSource, setSearchSource] = useState(false)
    const { API } = useAPIContext();
    useEffect(() => {
        new ServerConfig(API).get()
            .then(config => {
                setSearchSource(config.laboratory.use_douban_titles)
            })
    }, [])
    const updateSearchSource = (value: boolean) => {
        setSearchSource(value)
        new ServerConfig(API).update({
            laboratory: {
                use_douban_titles: value
            }
        } as NastoolServerConfig)
    }
    const searchSourceOption = [
        {
            label: "豆瓣",
            value: true
        },
        {
            label: "TMDB",
            value: false
        }
    ]
    return <>
        <Space style={{ width: "100%" }} orientation="vertical" size={16}>
            {/* <Radio.Group defaultValue={NastoolMediaType.TV}>
                <Radio.Button value={NastoolMediaType.MOVIE}>电影</Radio.Button>
                <Radio.Button value={NastoolMediaType.TV}>电视剧</Radio.Button>
                <Radio.Button value={NastoolMediaType.ANI}>动漫</Radio.Button>
            </Radio.Group> */}
            <Space.Compact style={{ width: "100%" }}>
                <Select onChange={updateSearchSource} value={searchSource} options={searchSourceOption} style={{ width: "100px" }} />
                <AutoComplete
                    style={{ width: "100%" }}
                    options={options}
                    open={openResults}
                    value={keyword}
                    onChange={(value) => setKeyword(value)}
                    onSelect={_onSelect}
                    onBlur={() => setOpenResults(false)}
                >
                    <Input.Search disabled={loading} loading={loading} onSearch={onSearch} value={keyword} placeholder="搜索" />
                </AutoComplete>
            </Space.Compact>
        </Space>

    </>
}


export interface MediaSearchProps {
    filter?: {
        type: MediaWorkType[],
    },
    value?: SeriesKey,
    onChange?: (value: SeriesKey) => void,
    children?: React.ReactNode,
    ctx?: SearchContextType
}

export function MediaSearchGroup({ value, onChange, children, filter }: MediaSearchProps) {
    const [searchContext] = useSearch(value);
    const { setSelected, selected, series, setSeries } = searchContext;
    const [seasons, setSeasons] = useState<MediaWorkSeason[]>([])
    const [loading, setLoading] = useState(false)

    const validatedSeriesKey = useMemo(() => {
        return series.slice(SeriesKeyType.TMDBID)
    }, [series])

    const [mediaWork] = useMediaWork(validatedSeriesKey)

    useEffect(() => {
        if (value) {
            if (!value.equal(series)) setSeries(value)
        }
    }, [value])

    const onTMDBSelected = useCallback(async (value: MediaWork) => {
        console.log("onTMDBSelected", value)
        setSeasons([])
        setLoading(true)
        setSeries(new SeriesKey(value.series))
        setLoading(false)
    }, [])

    useEffect(() => {
        if (mediaWork) {
            setSelected(mediaWork as MediaWork)
        }
    }, [mediaWork])


    useEffect(() => {
        if (onChange && value) {
            if (!value.equal(series)) onChange(new SeriesKey(series))
        }
    }, [series])

    return <Space orientation="vertical" style={{ width: "100%" }}>
        <TinyTMDBSearch onSelected={onTMDBSelected} filter={filter} />
        <SearchContext.Provider value={searchContext}>
            {
                children ?
                    <Spin spinning={loading} style={{ height: "150px", }}>
                        {children}
                    </Spin>
                    : <></>
            }
        </SearchContext.Provider>
    </Space>
}

export function MediaSearchWork() {
    const { selected } = useContext(SearchContext);
    return selected && <MediaDetailCard mediaDetail={selected} size={selected?.series.t == MediaWorkType.MOVIE ? "normal" : "small"} />
}

export function MediaSearchSeason() {
    const { series, setSeries } = useContext(SearchContext);
    const isTvSeries = useMemo(() => {
        return (series.t == MediaWorkType.TV || series.t == MediaWorkType.ANI)
    }, [series])

    return isTvSeries ? <Space>
        季：<MediaSeasonInput style={{ width: 250 }
        }
            series={series}
            value={series.s}
            onChange={(value) => {
                if (series.has("tmdbId")) {
                    setSeries(new SeriesKey(series).season(value))
                }
            }} />
    </Space> : null
}

export function MediaSeasonInput({ series, value, onChange, style }: { series: SeriesKey, value?: SeasonKeyType, onChange?: (value: number) => void, style?: CSSProperties }) {

    const validatedSeriesKey = useMemo(() => {
        if (series.i) {
            return new SeriesKey(series).slice(SeriesKeyType.TMDBID)
        }
    }, [series]);


    const [seasons, loading, flush] = useMediaWorks(validatedSeriesKey);

    const seasonOptions = useMemo(() => seasons ? seasons.map((item) => ({
        value: item.series.s,
        label: `季 ${item.series.s} - ${item.metadata?.title}`,
    })) : [], [seasons])


    const selectedSeason = useMemo(() => {
        if (value !== undefined && value !== null) {
            if (value >= 0) {
                return value;
            }
        }
    }, [value,]);

    return <Space>
        <Select value={selectedSeason} disabled={loading || (series.i == undefined)} loading={loading} style={style}
            placeholder="选择季数"
            options={seasonOptions}
            onSelect={(value: number) => {
                if (onChange) onChange(value)
            }}
        />
        <Button type="primary" onClick={() => flush()} icon={<RedoOutlined />} />
    </Space>
}
