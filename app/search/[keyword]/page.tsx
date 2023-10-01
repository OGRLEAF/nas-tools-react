"use client"
import React, { useState } from "react";
import TMDBSearch, { TMDBSearchList } from "@/app/components/TMDBSearch"
import SearchTask from "@/app/components/SearchTask"
import { Drawer, Space, Spin } from "antd";
import { NastoolMediaSearchResultItem, NastoolMediaType } from "@/app/utils/api/api";

export default function SearchResultPage({ params }: { params: { keyword: string } }) {
    const [openTaskDrawer, setOpenTaskDrawer] = useState(false)
    const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
    const [mediaInfo, setMediaInfo] = useState<NastoolMediaSearchResultItem>()

    const onSelected = (tmdbid: string, media_info?: NastoolMediaSearchResultItem) => {
        console.log(tmdbid)
        setSelectedMediaId(tmdbid)
        setOpenTaskDrawer(true)
        if (media_info) setMediaInfo(media_info)
        console.log(media_info)
    }
    const onCloseDrawer = () => setOpenTaskDrawer(false)

    return <>Search {decodeURI(params.keyword)}
        <Drawer
            open={openTaskDrawer}
            onClose={onCloseDrawer}
            bodyStyle={{
                padding: 0,
                position: "absolute",
                width: "100%"
            }}
            size="large"
        >
            {selectedMediaId ? <SearchTask
                style={{}}
                search={{ mediaId: selectedMediaId, mediaType: mediaInfo?.media_type }} /> 
                : <Spin />}
        </Drawer>

        <TMDBSearchList keyword={decodeURI(params.keyword)} onSelected={onSelected} />
    </>
}