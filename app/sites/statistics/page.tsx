"use client"
import React, { useEffect, useState } from "react";
import { Row, Col, Statistic, Card, Table, Space } from 'antd'
import { API, NastoolSiteInfo } from "@/app/utils/api/api";
import { bytes_to_human } from "@/app/utils/"

// function bytes_to_human(value: number) {
//     const units = ["B", "KB", "MB", "GB", "TB", "PB"]
//     const level = Math.min(Math.floor(Math.log2(value + 1e-6) / 10), 5);
//     return [value / ((2 ** 10) ** (level)), units[level]]
// }

export default function StatisticPage() {
    const [sitesStat, setSitesStat] = useState<NastoolSiteInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [sitesStatSum, setSitesStatSum] = useState({
        uploaded: 0,
        downloaded: 0,
        seeding: 0,
        seeding_size: 0
    })
    useEffect(() => {
        setLoading(true)
        API.getNastoolInstance()
            .then(async (nt) => {
                const sitesStatistics = await nt.getSitesStatistics()
                setSitesStat(sitesStatistics);
                const siteStatisSum = {
                    uploaded: 0,
                    downloaded: 0,
                    seeding: 0,
                    seeding_size: 0
                }
                sitesStatistics.forEach((site) => {
                    siteStatisSum.uploaded += site.upload;
                    siteStatisSum.downloaded += site.download;
                    siteStatisSum.seeding += site.seeding;
                    siteStatisSum.seeding_size += site.seeding_size;
                })
                setSitesStatSum(siteStatisSum)
                setLoading(false)
            })
    }, [])
    const SizeStatistic = ({ title, value, loading }: { title: string, value: number, loading: boolean }) => {
        const [num, unit] = bytes_to_human(value);
        return <Statistic loading={loading} title={title} precision={2} suffix={unit} value={num} />
    }
    const bytes_to_human_string = (value: number, fixed: number = 2): string => {
        const [num, unit] = bytes_to_human(value);
        return `${num.toFixed(fixed)} ${unit}`
    }
    return <>

        <Row gutter={16}>
            <Col span={6}>
                <Card bordered={true}>
                    <SizeStatistic loading={loading} title="总上传" value={sitesStatSum.uploaded} />
                </Card>
            </Col>
            <Col span={6}>
                <Card bordered={true}>
                    <SizeStatistic loading={loading} title="总下载" value={sitesStatSum.downloaded} />
                </Card>
            </Col>
            <Col span={6}>
                <Card bordered={true}>
                    <Statistic loading={loading} title="总做种量" value={sitesStatSum.seeding} />
                </Card>
            </Col>
            <Col span={6}>
                <Card bordered={true}>
                    <SizeStatistic loading={loading} title="总做种体积" value={sitesStatSum.seeding_size} />
                </Card>
            </Col>
        </Row>
        <br />
        <Table
            loading={loading}
            dataSource={sitesStat}
            rowKey="site"
        >
            <Table.Column title="站点" dataIndex="site" key="site" />
            <Table.Column title="等级" dataIndex="user_level" />
            <Table.ColumnGroup title="数据量">
                <Table.Column title="上传量" sorter={(a: NastoolSiteInfo, b: NastoolSiteInfo) => a.upload - b.upload}
                    dataIndex="upload" render={(value) => (bytes_to_human_string(value))} />
                <Table.Column title="下载量"
                    sorter={(a: NastoolSiteInfo, b: NastoolSiteInfo) => a.download - b.download}
                    dataIndex="download" render={(value) => (bytes_to_human_string(value))} />
            </Table.ColumnGroup>
            <Table.Column title="分享率" dataIndex="ratio" sorter={(a: NastoolSiteInfo, b: NastoolSiteInfo) => a.ratio - b.ratio} />
            <Table.Column title="做种体积" dataIndex="seeding_size"
                sorter={(a: NastoolSiteInfo, b: NastoolSiteInfo) => a.seeding_size - b.seeding_size}
                render={(value) => (bytes_to_human_string(value))} />
            <Table.Column title="积分" dataIndex="bonus" />
            <Table.Column title="加入时间" dataIndex="join_at" />
            <Table.Column title="更新时间" dataIndex="update_at" />
        </Table>
    </>
}
