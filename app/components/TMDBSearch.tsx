import { Input, Space, List, theme, Button, Image, Select, Row, Col } from "antd";
import React, { useEffect, useState } from "react";
import { API, NastoolMediaSearchResult, NastoolMediaSearchResultItem } from "../utils/api/api";
import { VerticalAlignBottomOutlined, SearchOutlined } from '@ant-design/icons';
const { Search } = Input;

const SelectAction = ({ children, item, onSelected }: { children?: React.ReactNode, item: NastoolMediaSearchResultItem, onSelected: (value: string) => void }) => {
    const onSelectClick = (value: string) => {
        if (onSelected) onSelected(value)
    }
    // return <VerticalAlignBottomOutlined onClick={() => onSelectClick(item.id)} />
    return <Button type="link" onClick={() => onSelectClick(item.id)} icon={<VerticalAlignBottomOutlined />}>
        {children}</Button>
}

export function TMDBSearchList({ keyword, onSelected }:
    {
        keyword: string,
        onSelected: (value: string, info?: NastoolMediaSearchResultItem) => void
    }) {
    const [loadingState, setLoadingState] = useState(false);
    const [searchValue, setSearchValue] = useState(keyword)
    const [mediaSearchResult, setMediaSearchResult] = useState<NastoolMediaSearchResult>({ result: [] })
    useEffect(() => {
        API.getNastoolInstance()
            .then(async (nt) => {
                setLoadingState(true);
                if (searchValue) {
                    const result = await nt.mediaSearch(searchValue);
                    console.log(result);
                    setMediaSearchResult({
                        result: result
                    })
                }
                setLoadingState(false);
            })
    }, [searchValue])


    return <List
        dataSource={mediaSearchResult.result}
        itemLayout="vertical"
        loading={loadingState}
        renderItem={(item) => (
            <List.Item key={item.id}
                extra={<Image width={100} src={item.image} />}
                actions={[
                    <Button type="link" onClick={() => onSelected(item.id, item)} icon={<VerticalAlignBottomOutlined />}></Button>
                ]}
            >
                <List.Item.Meta
                    title={item.title}
                    description={item.tmdb_id}
                />
                {item.overview}
            </List.Item>
        )}>

    </List>
}

export default function TMDBSearch(
    {
        initialSearchValue,
        onSelected,
    }:
        {
            initialSearchValue?: string,
            onSelected?: (tmdbid: string) => void
        }) {
    const [loadingState, setLoadingState] = useState(false);
    const [searchValue, setSearchValue] = useState(initialSearchValue)

    const [selectOptions, setSelectOption] = useState<{ label?: string, value: string }[]>([])
    useEffect(() => {
        const tags: string[] = []
        const quotedPat = /\[(?<tag>.*?)\]/g;
        const p = initialSearchValue;
        if (p) {
            let quotedMatch;
            while (quotedMatch = quotedPat.exec(p)) {
                const tag = quotedMatch?.groups?.tag
                if (tag) {
                    tag.split(/[\s\.\_]/).filter(value => value.length)
                        .forEach(value => tags.push(value))
                }
            }
            const remain = p.replaceAll(quotedPat, '');
            const remainSplited = remain.split(/[\s\.\_]/).filter(value => value.length);
            remainSplited.forEach((value) => tags.push(value))
            setSelectOption(tags.map((tag) => ({ value: tag })))
        }
    }, [])
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const onSearch = () => {
        const combined = selectedTags.map((tag) => tag).join(" ")
        console.log(combined)
        setSearchValue(combined);
    }
    return <>
        {/* <Search
            style={{ position: "sticky", zIndex: 2, top: 0, marginBottom: 15, backgroundColor: colorBgContainer }}
            placeholder={initialSearchValue}
            enterButton
            loading={loadingState}
            onSearch={onSearch} /> */}
        <Space direction="vertical" style={{ width: "100%" }} >
            <div style={{ width: "100%" }} >
                <Row justify="space-around" align="middle" gutter={8}>
                    <Col span={22}>
                        <Select mode="tags"
                            bordered
                            allowClear={true}
                            loading={loadingState}
                            value={selectedTags}
                            style={{ width: "100%" }}
                            onBlur={onSearch}
                            onChange={(value) => { setSelectedTags(value) }}
                            options={selectOptions}>
                        </Select>
                    </Col>
                    <Col span={2}>
                        <Button loading={loadingState} type="primary" onClick={onSearch} style={{ width: "100%" }} icon={<SearchOutlined />} />
                    </Col>
                </Row>
            </div>
            {/* <List
                dataSource={mediaSearchResult.result}
                itemLayout="vertical"
                loading={loadingState}
                renderItem={(item) => (
                    <List.Item key={item.id}
                        extra={<img width={100} src={item.image} />}
                        actions={[<SelectAction item={item} />,]}
                    >
                        <List.Item.Meta
                            title={item.title}
                            description={item.tmdb_id}
                        />
                        {item.overview}
                    </List.Item>
                )}>

            </List> */}
        </Space>
    </>
}