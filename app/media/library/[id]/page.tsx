"use client"
import React, { useEffect, useState } from 'react'
import { Section } from "@/app/components/Section"
import { API, NastoolMediaLibraryItem, NastoolMediaServerLibraryItem } from '@/app/utils/api/api'
import { Space, Card, Image, Spin } from 'antd';
import { usePathname, useRouter } from 'next/navigation';



const LibraryMediaCard = ({ info }: {
    info: NastoolMediaServerLibraryItem
}) => {

    const image = <img width={225} height={350} style={{ objectFit: "cover" }} src={info.cover} />;
    const router = useRouter()
    const pathName = usePathname()
    return (<Card
        key={info.id}
        hoverable
        style={{ width: 225, }}
        cover={image}
        onClick={() => router.push(`${pathName}/${info.id}`)}
        actions={[]}
    >
        <Card.Meta title={info.title}
            description={<span>{info.originalTitle}</span>}
        />

    </Card>)
}


export default function LibraryView({
    params
}: { params: { id: string } }) {
    const [items, setItems] = useState<NastoolMediaServerLibraryItem[]>([]);
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        setLoading(true)
        API.getNastoolInstance()
            .then(async (nt) => {
                const items = await nt.getMediaServerLibrary(params.id)
                setItems(items)

            })
            .finally(() => setLoading(false))
    }, [])

    return <Section title="媒体库">
        <Spin spinning={loading}>
            <Space wrap align="start">
                {items.map(item => (
                    <LibraryMediaCard key={item.id} info={item} />
                ))}
            </Space>
        </Spin>
    </Section>
}