import React, { CSSProperties, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { API, NastoolMediaSearchResult, NastoolMediaSearchResultItem, NastoolMediaType, NastoolServerConfig } from "../../utils/api/api";
import { AutoComplete, Form, Input, Radio, Space, theme, Image, Typography, Empty, Row, Col, Select, Skeleton, Button, Flex } from "antd";
import { TMDB } from "../../utils/api/media/tmdb";
import { MediaIdentifyContext, MediaWork, MediaWorkType, SeriesKey } from "../../utils/api/types";
import { SearchContext } from "./SearchContext";
import { ServerConfig } from "@/app/utils/api/serverConfig";
import { StateMap, StateTag } from "../StateTag";
import Link from "next/link";

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
            marginTop: 4,
            marginBottom: 8
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

export function MediaDetailCard({
    mediaDetail,
    size,
    action,
    layout,
    postImageStyle
}: { mediaDetail?: MediaWork, size?: CardSize, action?: React.JSX.Element, layout?: "vertical" | "horizonal", onTitleClick?: (mediaDetail: MediaWork) => void, postImageStyle?: CSSProperties }) {
    const { token } = theme.useToken()
    const _size = size ? size : "normal";
    const style = cardStyleMap[_size];
    if (mediaDetail) {
        const metadata = mediaDetail.metadata
        const coverImage = metadata?.image?.cover ? <img height={style.height} src={metadata.image.cover} style={{ aspectRatio: "auto" }} /> : <></>
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
                <Typography style={{ paddingTop: 4, width: "100%", height: "100%", display: "flex", alignItems: "start", flexDirection: "column", justifyContent: "space-between" }}>
                    <Typography.Title level={2} style={{ position: "sticky", top: 0, backgroundColor: "white", color: token.colorTextBase, fontSize: "1.6rem", margin: 0, padding: "4px 0px 4px 0px", ...style.title }}>
                        <Space>
                            <span>{mediaDetail.title}</span>
                            <span style={{ fontSize: "1rem" }}> {metadata?.date?.release}</span>
                            <StateTag stateMap={stateTagMap} value={mediaDetail.series.t ?? MediaWorkType.UNKNOWN} />
                        </Space>
                    </Typography.Title>
                    <Typography.Text style={{ height: "100%", overflowY: "auto", padding: "0px 4px" }}>
                        <Typography.Link style={{ color: token.colorTextDescription }} href={metadata?.links?.tmdb} target="_blank">
                            {metadata?.links?.tmdb}
                        </Typography.Link>
                        <span style={{ color: token.colorTextDescription, display: "block", wordWrap: "break-word", whiteSpace: "pre-wrap" }}>
                            {metadata?.description}
                        </span>
                    </Typography.Text>

                    <div style={{ alignSelf: "end", paddingTop: 4 }}>{action}</div>
                </Typography>
            </div>
        </Flex >

    } else {
        return <Empty />
    }
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
    useEffect(() => {
        new ServerConfig().get()
            .then(config => {
                setSearchSource(config.laboratory.use_douban_titles)
            })
    }, [])
    const updateSearchSource = (value: boolean) => {
        setSearchSource(value)
        new ServerConfig().update({
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