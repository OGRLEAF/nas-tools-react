"use client"
import { API, NastoolIndexer, } from "@/app/utils/api/api";
import React, { useEffect, useState } from "react";
import { Card, Space } from "antd"
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAPIContext } from "@/app/utils/api/api_base";

const IndexerCard = ({ indexer }: { indexer: NastoolIndexer }) => {
    const pathname = usePathname();
    return <Link href={pathname + "/" + indexer.domain}>
        <Card bordered={true}
            hoverable
            onClick={() => { console.log(indexer) }}>
            <Card.Meta title={indexer.name} description={indexer.domain}></Card.Meta>
        </Card>
    </Link>
}

export default function SitesResourceIndexers() {
    const [indexers, setIndexers] = useState<NastoolIndexer[]>([])
    const { API } = useAPIContext();
    useEffect(() => {
        (async () => {
            const indexers = await API.getIndexers();
            setIndexers(indexers)
        })()
    }, [])

    return <Space wrap>
        {
            indexers.map((indexer) => <IndexerCard key={indexer.id} indexer={indexer} />)
        }
    </Space>
}