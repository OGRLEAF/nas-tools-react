"use client"
import React, { useEffect, useState } from 'react'
import { Section } from "@/app/components/Section"
import { API, NastoolMediaLibraryItem, NastoolMediaServerLibraryItem } from '@/app/utils/api'
import { Space, Card, Image } from 'antd';
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
    useEffect(() => {
        API.getNastoolInstance()
            .then(async (nt) => {
                const items = await nt.getMediaServerLibrary(params.id)
                console.log(items)
                setItems(items)
            })
    }, [])

    return <Section title="媒体库">
        <Space wrap>
            {items.map(item => (
                <LibraryMediaCard key={item.id} info={item} />
            ))}
        </Space>
    </Section>
}