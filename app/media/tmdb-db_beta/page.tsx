'use client'
import { MediaDetailCard } from "@/app/components/TMDBSearch/TinyTMDBSearch";
import { Section } from "@/app/components/Section";
import { MediaWork, MediaWorkMetadata, MetadataDate, toDayjs, useMediaWork, useMediaWorkAction, useMediaWorks, useMediaWorksPaginated } from "@/app/utils/api/media/mediaWork"
import { SeriesKey } from "@/app/utils/api/media/SeriesKey"
import { MediaWorkType, SeriesKeyType } from "@/app/utils/api/types"
import { Button, DatePicker, Drawer, Form, Input, Segmented, Space, Table, TableColumnsType } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageQuery } from "@/app/utils/api/api";

const defaultSeriesKey = new SeriesKey().type(MediaWorkType.TV);


function TitleLabel({ seriesKey }: { seriesKey: SeriesKey }) {
  const [mediaWork] = useMediaWork(seriesKey)
  return <>{seriesKey.end > SeriesKeyType.TYPE ? mediaWork?.metadata?.title : seriesKey.t}</>
}


export default function TMDBBeta({ params }: { params: { series_key?: string[] } }) {

  const [seriesKey, setSeriesKey] = useState<SeriesKey>(defaultSeriesKey)
  const [sliceKey, setSliceKey] = useState<SeriesKeyType>(SeriesKeyType.TYPE)
  const slicedSeriesKey = useMemo(() => seriesKey.slice(sliceKey), [sliceKey, seriesKey])

  const { mediaWorks, loading, total, refresh, flush, pagination, setPagination } = useMediaWorksPaginated(slicedSeriesKey);
  const [mediaWork, mediaWorkAction] = useMediaWork(slicedSeriesKey);

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
          value: seriesKey.end,
        }]
      else {
        return [...pathSegments.slice(0, seriesKey.end),
        {
          label: <TitleLabel seriesKey={seriesKey} />,
          value: seriesKey.end
        }
        ]
      }
    })
  }, [seriesKey, setPathSegements])

  const titleRender = useCallback(() => mediaWork && <MediaDetailCard
    key={mediaWork.series.dump().join('_')}
    action={<MetadataEditorDrawer seriesKey={mediaWork.series}>
      <Button type="link" size="small" onClick={() => flush()}>刷新</Button>
    </MetadataEditorDrawer>}
    mediaDetail={mediaWork} size="poster" />,
    [mediaWork, flush])

  // Extracted render function for the "名称" column
  const nameColumnRender = useCallback(
    (value: any, record: MediaWork, index: number) => {
      const seriesKey = record.series;
      const nextKey = seriesKey.end;
      if (nextKey >= SeriesKeyType.TMDBID)
        return (
          <Button
            type="link"
            onClick={() => {
              setSeriesKey(seriesKey);
              setSliceKey(seriesKey.end);
            }}
          >
            {value}
          </Button>
        );
      return value;
    },
    [setSeriesKey, setSliceKey]
  );

  // Extracted render function for the "操作" column
  const operationColumnRender = useCallback(
    (value: SeriesKey, record: MediaWork, index: number) => {
      return <MetadataEditorDrawer seriesKey={value} onRefreshList={() => refresh({ cached: true })} />;
    },
    [refresh]
  );

  const columns: TableColumnsType<MediaWork> = useMemo(
    () => [
      {
        title: '#',
        width: 100,
        dataIndex: ['series'],
        sorter: (a, b) => ((Number(a.series.key) || -1) - (Number(b.series.key) || -1)),
        defaultSortOrder: "descend",
        render(value: SeriesKey) {
          return value.get(value.end);
        },
      },
      {
        title: '名称',
        dataIndex: ['metadata', 'title'],
        render: nameColumnRender,
      },
      {
        title: '发行日期/播出日期',
        width: 300,
        dataIndex: ['metadata'],
        render(value: MediaWork['metadata'], record, index) {
          return value?.date.airing || value?.date.release || '-';
        },
      },
      {
        title: '操作',
        width: 200,
        dataIndex: ['series'],
        render: operationColumnRender,
      },
    ],
    [nameColumnRender, operationColumnRender]
  );

  return <Section title={`TMDB缓存`} onRefresh={() => refresh()}>
    <Segmented options={[MediaWorkType.TV, MediaWorkType.MOVIE]} value={seriesKey.t}
      onChange={(value) => {
        setSeriesKey(new SeriesKey().type(value as MediaWorkType));
        setSliceKey(SeriesKeyType.TYPE);
      }} />
    <Segmented options={pathSegments} value={sliceKey}
      onChange={(value) => {
        setSliceKey(value)
      }} />
    <Table
      size="small"
      title={slicedSeriesKey.end > SeriesKeyType.TYPE ? titleRender : undefined}
      columns={columns}
      dataSource={mediaWorks} loading={loading}
      pagination={{
        pageSize: pagination.size,
        total: total,
        onChange(page, pageSize) {
          setPagination({ page: page, size: pageSize })
        }
      }}
      rowKey={
        (record) => record.series.uniqueKey()
      }
      footer={() => <TMDBAdd></TMDBAdd>}
    />
  </Section>
}

function TMDBAdd() {
  return <Space>
    <Input placeholder="TMDB ID" />
    <Button type="primary">添加</Button>
  </Space>
}

function MetadataEditorDrawer({ seriesKey, children, onRefreshList }: { seriesKey: SeriesKey, children?: React.ReactNode, onRefreshList?: () => void }) {
  const [open, setOpen] = useState(false)
  const { drop } = useMediaWorkAction(seriesKey);
  return <Space>
    {children}
    <Button type="link" size="small" onClick={() => setOpen(true)}>编辑</Button>
    <Button type="link" size="small" danger onClick={() => drop().then(() => onRefreshList?.())}>删除</Button>
    <Drawer open={open} onClose={() => setOpen(false)} size="large">
      {open && <MetadataEditor seriesKey={seriesKey} />}
    </Drawer>
  </Space>
}


function MetadataEditor({ seriesKey }: { seriesKey: SeriesKey }) {
  const [form] = Form.useForm();
  const [mediaWork, action] = useMediaWork(seriesKey)

  const initialValues = useMemo(() => mediaWork?.metadata, [mediaWork])

  useEffect(() => {
    form.setFieldsValue(initialValues)
  }, [initialValues])

  return <>
    <MediaDetailCard mediaDetail={{
      series: seriesKey,
      metadata: initialValues
    }} />
    <br />
    <Form<MediaWorkMetadata> form={form} initialValues={initialValues}
      onFinish={(values) => {
        if (values && mediaWork)
          action.update({
            series: mediaWork.series,
            metadata: values
          }).then(() => {
            action.refresh();
          })
      }} layout="vertical">
      <Form.Item label="标题" name="title" >
        <Input></Input>
      </Form.Item>
      <Form.Item<MediaWorkMetadata> label="描述" name="description" >
        <Input.TextArea></Input.TextArea>
      </Form.Item>
      <Space>
        <Form.Item<MediaWorkMetadata> label="发行日期" name={["date", "release"]} >
          <MetadataDatePicker />
        </Form.Item>
        <Form.Item<MediaWorkMetadata> label="播出日期" name={["date", "airing"]} >
          <MetadataDatePicker />
        </Form.Item>
      </Space>
      <Form.Item<MediaWorkMetadata> label="TMDB链接" name={["links", "tmdb"]}>
        <Input />
      </Form.Item>
      <Form.Item<MediaWorkMetadata> label="海报图片" name={["images", "poster"]}>
        <Input />
      </Form.Item>
      <Form.Item<MediaWorkMetadata> label="封面图片" name={["images", "cover"]}>
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">保存</Button>
      </Form.Item>
    </Form>
  </>
}

function MetadataDatePicker({ value, onChange }: { value?: MetadataDate, onChange?: (value: MetadataDate) => void }) {
  const formValue = useMemo(() => value && toDayjs(value), [value])
  return <DatePicker value={formValue}
    onChange={(value) => {
      value && onChange?.(
        [
          value.year(),
          value.month() + 1,
          value.date(),
          null,
          null
        ]
      )
    }} />

}
