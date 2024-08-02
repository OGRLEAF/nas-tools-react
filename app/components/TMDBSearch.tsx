import { Input, Space, List, theme, Button, Image, Select, Row, Col } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { API, NastoolMediaSearchResult, NastoolMediaSearchResultItem } from "../utils/api/api";
import { VerticalAlignBottomOutlined, SearchOutlined } from '@ant-design/icons';
import { useAPIContext } from "../utils/api/api_base";
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
    const {API} = useAPIContext();

    const search = useCallback(async ()=> {
            setLoadingState(true);
            if (searchValue) {
                const result = await API.mediaSearch(searchValue);
                console.log(result);
                setMediaSearchResult({
                    result: result
                })
            }
            setLoadingState(false);

    }, [API, searchValue])
    useEffect(() => {
        search()
    }, [search])

    return <List
        dataSource={mediaSearchResult.result}
        itemLayout="vertical"
        loading={loadingState}
        renderItem={(item) => (
            <List.Item key={item.id}
                extra={<Image width={100} src={item.image} />}
                actions={[
                    <Button key="download_btn" type="link" onClick={() => onSelected(item.id, item)} icon={<VerticalAlignBottomOutlined />}></Button>
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
