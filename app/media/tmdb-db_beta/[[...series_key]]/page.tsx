'use client'
import { MediaDetailCard } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { Section } from "@/app/components/Section";
import { useMediaWork, useMediaWorks } from "@/app/utils/api/media/media_work"
import { SeriesKey } from "@/app/utils/api/media/SeriesKey"
import { MediaWorkType, SeriesKeyType } from "@/app/utils/api/types"
import { Button, Segmented, Table } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

const defaultSeriesKey = new SeriesKey().type(MediaWorkType.TV);


function TitleLabel({ seriesKey }: { seriesKey: SeriesKey }) {
  const [mediaWork] = useMediaWork(seriesKey)
  return <>{seriesKey.end > SeriesKeyType.TYPE ? mediaWork?.metadata?.title : seriesKey.t}</>
}


export default function TMDBBeta({ params }: { params: { series_key?: string[] } }) {

  const [seriesKey, setSeriesKey] = useState<SeriesKey>(defaultSeriesKey)
  const [sliceKey, setSliceKey] = useState<SeriesKeyType>(SeriesKeyType.TYPE)
  const slicedSeriesKey = useMemo(() => seriesKey.slice(sliceKey), [sliceKey, seriesKey])

  const [mediaWorks, loading] = useMediaWorks(slicedSeriesKey);
  const [mediaWork,] = useMediaWork(slicedSeriesKey);

  const [pathSegments, setPathSegements] = useState([{
    label: <>{defaultSeriesKey.get(defaultSeriesKey.end)}</>,
    value: defaultSeriesKey.end
  }])
  useEffect(() => {
    setPathSegements((pathSegments) => {
      const farestKey = pathSegments[pathSegments.length - 1];
      if ((farestKey.value < seriesKey.end))
        return [...pathSegments, {
          label: <TitleLabel seriesKey={seriesKey} />,
          // label: seriesKey.get(seriesKey.end),
          value: seriesKey.end,
        }]
      else {
        return [...pathSegments.slice(0, seriesKey.end),
        {
          // label: seriesKey.get(seriesKey.end),
          label: <TitleLabel seriesKey={seriesKey} />,
          value: seriesKey.end
        }
        ]
      }
    })
  }, [seriesKey, setPathSegements])

  const renderTitle = useCallback(() => mediaWork && <MediaDetailCard mediaDetail={mediaWork} size="poster" />, [mediaWork])

  return <Section title={`TMDB缓存`}>
    <Segmented options={pathSegments} value={sliceKey}
      onChange={(value) => {
        setSliceKey(value)
      }} />
    <br />
    <Table
      size="small"
      title={slicedSeriesKey.end > SeriesKeyType.TYPE ? renderTitle: undefined}
      columns={[
        {
          title: '#',
          dataIndex: ['series'],
          render(value: SeriesKey) {
            return value.get(value.end)
          }
        },
        {
          title: '名称',
          dataIndex: ['metadata', 'title'],
          render(value, record, index) {
            const seriesKey = record.series;
            const nextKey = seriesKey.end;
            if (nextKey >= SeriesKeyType.TMDBID)
              return <Button type="link" onClick={() => {
                setSeriesKey(seriesKey)
                setSliceKey(seriesKey.end)
              }}>{value}</Button>
            return value
          },
        },
      ]}
      dataSource={mediaWorks} loading={loading}
      rowKey={
        (record) => record.series.dump().join('_')
      }
    />
  </Section>
}
