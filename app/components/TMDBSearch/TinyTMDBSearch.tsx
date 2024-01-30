import React, { CSSProperties, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { NastoolServerConfig } from "../../utils/api/api";
import { AutoComplete, Input, Space, theme, Typography, Empty, Select, Flex, Spin, SelectProps } from "antd";
import { TMDB } from "../../utils/api/media/tmdb";
import { MediaWork, MediaWorkSeason, MediaWorkType, SeriesKey, SeriesKeyType } from "../../utils/api/types";
import { SearchContext, SearchContextType, useSearch } from "./SearchContext";
import { ServerConfig } from "@/app/utils/api/serverConfig";
import { StateMap, StateTag } from "../StateTag";
import Image from "next/image"
import { asyncEffect } from "@/app/utils";
import { useAPIContext } from "@/app/utils/api/api_base";

type CardSize = "normal" | "small" | "tiny";
interface DetailCardStyle {
    image?: CSSProperties,
    title?: CSSProperties,
    typography?: CSSProperties,
    textLimit?: number,
    maxWidth?: number,
    height?: number
}

const cardStyleMap: Record<CardSize, DetailCardStyle> = {
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
    }
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


function CoverImage(options: { alt: string, src: string, maxHeight?: number }) {
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

export function MediaDetailCard({
    mediaDetail,
    size,
    action,
    layout,
    loading,
    postImageStyle
}: { mediaDetail?: MediaWork, size?: CardSize, action?: React.JSX.Element, loading?: boolean, layout?: "vertical" | "horizonal", onTitleClick?: (mediaDetail: MediaWork) => void, postImageStyle?: CSSProperties }) {
    const { token } = theme.useToken()
    const _size = size ? size : "normal";
    const style = cardStyleMap[_size];

    const content = useMemo(() => {
        if (mediaDetail) {
            const metadata = mediaDetail.metadata
            const coverImage = metadata?.image?.cover && <CoverImage maxHeight={style.height} alt={metadata.title} src={metadata?.image?.cover} />
            return <Flex
                align="start"
                vertical={(layout ?? "horizontal") == "vertical"}
                gap={12}
                style={{
                    marginBottom: 0,
                    position: "relative",
                    // maxWidth: style.maxWidth
                    width: "100%",
                }}>
                {coverImage}
                <div style={{ height: style.height, width: "100%", maxWidth: style.maxWidth }}>
                    <div style={{ paddingTop: 0, width: "100%", height: "100%", display: "flex", overflowY: "auto", alignItems: "start", flexDirection: "column" }}>
                        <div style={{ position: "sticky", top: 0, backgroundColor: "#ffffffa1", color: token.colorTextBase, fontSize: "1.6rem", margin: 0, padding: "0px 0px 4px 0px", ...style.title }}>
                            <Space>
                                <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{mediaDetail.title}</span>
                                <span style={{ fontSize: "1rem" }}> {metadata?.date?.release}</span>
                                <StateTag stateMap={stateTagMap} value={mediaDetail.series.t ?? MediaWorkType.UNKNOWN} />
                            </Space>
                        </div>
                        <div style={{ padding: "0px 4px" }}>
                            <Typography.Link style={{ color: token.colorTextDescription }} href={metadata?.links?.tmdb} target="_blank">
                                {metadata?.links?.tmdb}
                            </Typography.Link>
                            <span style={{ color: token.colorTextDescription, display: "block", wordWrap: "break-word", whiteSpace: "pre-wrap" }}>
                                {metadata?.description.replaceAll("\n\n", "\n").replaceAll("\n\n", "\n")}
                            </span>
                        </div>

                        <div style={{ alignSelf: "end", position: "sticky", bottom: 0, right: 4 }}>{action}</div>
                    </div>
                </div>
            </Flex >

        } else {
            return <Empty />
        }
    }, [mediaDetail])
    return content;
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

    const onSearch = (value: string) => {
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
    }

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
        <Space style={{ width: "100%" }} direction="vertical" size={16}>
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

export function MediaSearchGroup({ value, onChange, children, ctx, filter }: MediaSearchProps) {
    const [searchContext] = useSearch(value);
    const { setSelected, selected, series, setSeries } = searchContext;
    const [seasons, setSeasons] = useState<MediaWorkSeason[]>([])
    const [loading, setLoading] = useState(false)

    const onTMDBSelected = useCallback(async (value: MediaWork) => {
        setSeasons([])
        setLoading(true)
        const work = new TMDB().work(String(value.key), value.type)
        const mediaWork = await work.get();
        if (mediaWork) setSeries(new SeriesKey(mediaWork.series).tmdbId(mediaWork.key))
        setLoading(false)
    }, [value])

    const fetchMediaWork = useCallback(async () => {
        if (series.i != undefined) {
            setLoading(true)
            const media = new TMDB().fromSeries(series.slice(SeriesKeyType.TMDBID));
            const mediaWork = await media?.get();
            if (mediaWork && media) {
                setSelected(mediaWork);
            }
            setLoading(false)
        }
    }, [series])
    useEffect(()=>{
        fetchMediaWork()
    }, [fetchMediaWork])


    useEffect(() => {
        if (onChange) onChange(new SeriesKey(series))
    }, [series])

    return <Space direction="vertical" style={{ width: "100%" }}>
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
    return <MediaDetailCard mediaDetail={selected} size="small" />
}

export function MediaSearchSeason() {
    const { series, setSeries } = useContext(SearchContext);
    const isTvSeries = useMemo(() => {
        return (series.t == MediaWorkType.TV || series.t == MediaWorkType.ANI)
    }, [series])
    if (isTvSeries) {
        return <Space>
            季：<MediaSeasonInput style={{ width: 250 }
            }
                series={series}
                onChange={(value) => {
                    if (series.has("tmdbId")) {
                        setSeries(new SeriesKey(series).season(value))
                    }
                }} />
        </Space >
    }
}

export const MediaSeasonInput = ({ series, value, onChange, style }: { series: SeriesKey, value?: number, onChange?: (value: number) => void, style?: CSSProperties }) => {
    const [seasonOptions, setSeasonOptions] = useState<SelectProps['options']>([])
    const [loading, setLoading] = useState(false)
    useEffect(asyncEffect(async () => {
        setLoading(true)
        if (series.i) {
            const media = new TMDB().fromSeries(series.slice(SeriesKeyType.TMDBID));
            const mediaWork = await media?.get();
            if (mediaWork && media) {
                if (mediaWork.series.t == MediaWorkType.TV || mediaWork.series.t == MediaWorkType.ANI) {
                    const seasons = await media.get_children()
                    if (seasons?.length) {
                        const options = seasons.map((item) => ({
                            value: item.key,
                            label: `季 ${item.key} - ${item.title}`,
                        }))
                        setSeasonOptions(options);
                    } else {
                        setSeasonOptions([])
                    }
                }
            }
            setLoading(false)
        }
    }), [series.i])

    return <Select value={value} disabled={loading} loading={loading} style={style}
        options={seasonOptions}
        onSelect={(value: number) => {
            if (onChange) onChange(value)
        }}
    />
}
