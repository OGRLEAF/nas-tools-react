'use client'
import { MediaDetailCard } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { Section } from "@/app/components/Section";
import { useMediaWork, useMediaWorks } from "@/app/utils/api/media/media_work"
import { SeriesKey } from "@/app/utils/api/media/SeriesKey"
import { MediaWorkType, SeriesKeyType } from "@/app/utils/api/types"
import { Segmented, Table } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

const defaultSeriesKey = new SeriesKey().type(MediaWorkType.TV);

type PathParamsAllowType = MediaWorkType.TV | MediaWorkType.MOVIE;

const pathParamsMap: Record<PathParamsAllowType, string | undefined> = {
  [MediaWorkType.TV]: 'tv',
  [MediaWorkType.MOVIE]: 'movie'
}

const mapPathParams = Object.fromEntries(Object.entries(pathParamsMap).map(([k, v]) => [v, k]))

export default function TMDBBeta({ params }: { params: { series_key?: string[] } }) {

  const pagePath = usePathname()

  const seriesKey = useMemo(() => {
    const seriesKey = new SeriesKey();
    // TODO: use TV as default type
    seriesKey.type(MediaWorkType.TV)

    if (params.series_key) {
      if (params.series_key[0] == 'tv') {
        seriesKey.type(mapPathParams[params.series_key[0]] as MediaWorkType)
      }
      if (params.series_key[1])
        seriesKey.tmdbId(params.series_key[1])
      if (params.series_key[2] && Number.isInteger(Number(params.series_key[2]))) {
        seriesKey.season(Number(params.series_key[2]))
      }
      return seriesKey;
    } else
      return defaultSeriesKey
  }, [params])

  const [mediaWorks, loading] = useMediaWorks(seriesKey);
  const [mediaWork, ] = useMediaWork(seriesKey);
  return <Section title={`TMDB缓存`}>
    <br />
    <Table
      size="small"
      title={() => mediaWork && <MediaDetailCard mediaDetail={mediaWork} size="poster"/>}
      columns={[
        {
          title: '#',
          dataIndex: ['series'],
          render(value:SeriesKey) {
            return  value.get(value.end)
          }
        },
        {
          title: '名称',
          dataIndex: ['metadata', 'title'],
          render(value, record, index) {
            const seriesKey = record.series;
            const nextKey = seriesKey.end;
            if (nextKey >= SeriesKeyType.TMDBID)
                  return <Link href={`${pagePath}/${seriesKey.get(nextKey)}`}>{value}</Link>
            return value
          },
        },
      ]}
      dataSource={mediaWorks} loading={loading}
      rowKey={
        (record) => {
          return record.series.dump().join('_')
        }
      }
    />
  </Section>
}
