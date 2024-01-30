'use client';

import React, { useState, useEffect, useContext } from 'react';
import { App, Button, Card, Space, Image, ConfigProvider } from 'antd';
import { EyeOutlined, EllipsisOutlined, LinkOutlined } from '@ant-design/icons';
import { API, NastoolMediaBrief, NastoolMediaLibrary, NastoolMediaLibraryItem } from './utils/api/api';
import { Section } from './components/Section';
import { useRouter } from 'next/navigation';
import zhCN from 'antd/locale/zh_CN';
import { APIContext } from './utils/api/api_base';

const { Meta } = Card;

type CardCoverType = "post" | "still"

const Home = () => {
  const [libraryBrief, setLibraryBrief] = useState<NastoolMediaBrief>({
    libraries: [],
    resumes: [],
    latest: []
  })
  const router = useRouter();

  const apiContext = useContext(APIContext);
  useEffect(() => {
    if (apiContext.API.loginState) {
      const nastool = apiContext.API;
      nastool.getMediaBrief()
        .then(brief => {
          console.log("got", brief)
          setLibraryBrief(brief);
        })
      return () => { console.log("clean", nastool) }
    }
  }, [apiContext.API]);

  const libraryCard = (library: NastoolMediaLibrary | NastoolMediaLibraryItem, coverType: CardCoverType = "post") => {
    const cardStyle = ({
      post: {
        width: 300,
        height: 150
      },
      still: {
        width: 170,
        height: 240
      }
    })[coverType];

    const image = <Image width={cardStyle.width} height={cardStyle.height}
      style={{ objectFit: "cover" }}
      src={library.image} />;

    return (<Card
      key={library.id}
      hoverable
      style={{ width: cardStyle.width, }}
      cover={image}
      onClick={() => { router.push(`/media/library/${library.id}`) }}
    // actions={[
    //   <LinkOutlined key="setting" onClick={() => { router.push(`/media/library/${library.id}`) }} />,
    //   <EyeOutlined key="edit" />,
    //   <EllipsisOutlined key="ellipsis" />,
    // ]}
    >
      <Meta title={library.name} description={library.type} />

    </Card>)
  }


  const mediaItemCardGroup = (items: NastoolMediaLibraryItem[], coverType: CardCoverType) => {
    return (<Space direction='vertical'>
      <Space wrap>
        {items.map((library) => libraryCard(library, coverType))}
      </Space>
    </Space>)
  }

  const libraryCards = (
    <Space direction='vertical'>
      <Space wrap>
        {libraryBrief.libraries.map((library) => libraryCard(library, "post"))}
      </Space>
    </Space>
  )

  const watchingMediaCards = mediaItemCardGroup(libraryBrief.resumes, "post")
  const latestMediaCards = mediaItemCardGroup(libraryBrief.latest, "still")

  return (
    <ConfigProvider locale={zhCN} theme={{ cssVar: true }}>
      <App>
        <div className="App">
          <Space direction='vertical'>
            <Section title="我的媒体库">{libraryCards}</Section>
            <Section title="正在观看">{watchingMediaCards}</Section>
            <Section title="最新添加">{latestMediaCards}</Section>
          </Space>
        </div>
      </App>
    </ConfigProvider>
  )
};

export default Home;