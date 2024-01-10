'use client'
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  BarChartOutlined,
  FileDoneOutlined,
  ClusterOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  SearchOutlined,
  CompassOutlined,
  HomeOutlined,
  SettingOutlined,
  ToolOutlined,
  BuildOutlined,
  VerticalAlignBottomOutlined,
  BellOutlined
} from '@ant-design/icons';
import { IconBookBookMark, IconCalendarDaysSolid, IconCustomSolid, IconDatabase, IconDownloader, IconFilmSolid, IconFilter, IconFolderTreeSolid, IconHistory, IconIndexer, IconLink, IconLoading, IconMediaServer, IconMediaSolid, IconRefresh, IconRssSolid, IconTvSolid } from '../icons';
import type { MenuProps } from 'antd';
import { Breadcrumb, Divider, Layout, Menu, theme } from 'antd';

import LoginModal from '../login';
import HeaderSearch from '../headerSearch';
import { ServerConfig } from '@/app/utils/api/serverConfig';
import Link from 'next/link';


const { Header, Content, Footer, Sider } = Layout;
type MenuItem = Required<MenuProps>['items'][number];


function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  url?: string,
): MenuItem {
  return {
    key,
    icon,
    children,
    label: children == undefined ? <Link href={url || (key as string)}>{label}</Link> : label,
  } as MenuItem;
}

const mediaFileMenuItem = getItem("文件管理", '/media/file', <IconFolderTreeSolid />);
const getMenuItems = async () => {
  const mediaPageDefaultUrl = await new ServerConfig().get()
    .then(res => {
      const default_path = res.media.media_default_path;
      return "/media/file" + default_path;
      // if (mediaFileMenuItem?.key) 
      // setMenuKeyMap({ [mediaFileMenuItem.key as string]: mediaFileMenuItem.key + default_path })
    })
    .catch(() => "/media/file")
  const items: MenuItem[] = [
    getItem('首页', '/', <HomeOutlined />),
    getItem('探索', '/discover', <CompassOutlined />, [
      getItem('榜单推荐', '/discover/recommand', <BarChartOutlined />),
      getItem('豆瓣电影', '/discover/douban-movie', <IconFilmSolid />),
      getItem('TMDB电影', '/discover/tmdb-movie', <IconFilmSolid />),
    ]),
    getItem('资源搜索', '/search', <SearchOutlined />),
    getItem('站点管理', '/sites', <UserOutlined />, [
      getItem('站点维护', '/sites/maintain', <ClusterOutlined />),
      getItem('数据统计', '/sites/statistics', <PieChartOutlined />),
      getItem('刷流任务', '/sites/tasks', <FileDoneOutlined />),
      getItem('站点资源', '/sites/resource', <ClusterOutlined />),
    ]),
    getItem('下载管理', '/download', <IconDownloader />, [
      getItem('正在下载', '/download/ing', <IconLoading />),
      getItem('下载完成', '/download/ed', <VerticalAlignBottomOutlined />),
      // getItem('下载器管理', '/download/manage', <IconLoading />),
    ]),
    getItem('订阅管理', '/subscribe', <IconRssSolid />, [
      getItem('电影订阅', '/subscribe/movie', <IconFilmSolid />),
      getItem('电视剧订阅', '/subscribe/tv', <IconTvSolid />),
      getItem('自定义订阅', '/subscribe/custom', <IconCustomSolid />),
      getItem('订阅日历', '/subscribe/calendar', <IconCalendarDaysSolid />),
    ]),
    getItem("任务", "/task", <BuildOutlined />),
    getItem("媒体整理", '/media', <IconMediaSolid />, [
      getItem("文件管理", '/media/file', <IconFolderTreeSolid />, undefined, mediaPageDefaultUrl),
      getItem("手动识别", '/media/manual', <IconLink />),
      getItem("历史记录", '/media/history', <IconHistory />),
      getItem("TMDB缓存", '/media/tmdb-db', <IconDatabase />),
    ]),
    getItem("设置", "/setting", <SettingOutlined />, [
      getItem("基础设置", "/setting/basic", <ToolOutlined />),
      getItem("刮削设置", "/setting/scraper", <SearchOutlined />),
      getItem("媒体库", "/setting/library", <IconBookBookMark />),
      getItem("目录同步", "/setting/directorysync", <IconRefresh />),
      getItem("消息通知", "/setting/notification", <BellOutlined />),
      getItem("过滤规则", "/setting/filterrule", <IconFilter />),
      getItem("索引器", "/setting/indexers", <IconIndexer />),
      getItem("下载器", "/setting/downloader", <IconDownloader />),
      getItem("媒体服务器", "/setting/mediaserver", <IconMediaServer />)
    ]),
  ];
  return items;
}
const DefaultLayout = ({ children }: { children: React.ReactNode }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const pathName = usePathname();
  const updateMenuKey = () => {
    const pathKeys = pathName.split("/")
    const subKey = pathKeys.slice(0, 3).join("/");
    const mainKey = pathKeys.slice(0, 2).join("/")
    setSelectedPath({
      selectedKey: [subKey],
      openKey: [mainKey]
    });
  }

  useEffect(() => {
    getMenuItems().then((menu) => {
      setMenu(menu);
      updateMenuKey();
    })
  }, [])


  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer }, } = theme.useToken();

  const [selectedPath, setSelectedPath] = useState<{ selectedKey: string[], openKey: string[] }>();

  useEffect(() => {
    updateMenuKey();
  }, [pathName])

  const [pageScale, setPageScale] = useState(1);
  useEffect(() => {
    const scale = window.devicePixelRatio;
  }, [])

  return (
    <Layout hasSider style={{ zoom: pageScale }}>
      <Sider
        style={{
          overflow: 'auto',
          height: '100vh',
          position: "sticky",
          left: 0,
          top: 0,
          bottom: 0,
        }}
        collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="demo-logo-vertical" style={{ height: 40 }} >
          <LoginModal></LoginModal>
        </div>
        {selectedPath ?
          <Menu theme="dark" mode="inline" items={menu}
            selectedKeys={selectedPath?.selectedKey} defaultOpenKeys={selectedPath?.openKey}
          />
          : <></>
        }

        <span style={{ color: "white" }}>
          openKey:{selectedPath?.openKey}<br />
          selectedKey:{selectedPath?.selectedKey}<br />
          {pathName}
        </span>
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '16px 0px',
            background: colorBgContainer,
            position: 'sticky',
            top: 0,
            zIndex: 1
          }} >
          <HeaderSearch />
        </Header>
        <Content style={{ margin: '0px 0px', overflow: 'initial' }}>
          <div style={{ padding: "0px 16px 16px 16px", minHeight: "50vh", background: colorBgContainer }}>
            {children}
          </div>
        </Content>
        {/* <Footer style={{ textAlign: 'center', background: colorBgContainer, }}>Ant Design ©2023 Created by Ant UED</Footer> */}
      </Layout>
    </Layout>
  );
};

export default DefaultLayout;