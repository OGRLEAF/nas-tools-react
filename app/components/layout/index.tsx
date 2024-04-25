'use client'
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  FileDoneOutlined,
  ClusterOutlined,
  PieChartOutlined,
  UserOutlined,
  SearchOutlined,
  HomeOutlined,
  SettingOutlined,
  ToolOutlined,
  BellOutlined,
  BlockOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { IconBookBookMark, IconCalendarDaysSolid, IconCubes, IconCustomSolid, IconDatabase, IconDownloader, IconFilmSolid, IconFilter, IconFolderTreeSolid, IconFont, IconHistory, IconIndexer, IconLink, IconLoading, IconMediaServer, IconMediaSolid, IconRefresh, IconRssSolid, IconTvSolid } from '../icons';
import type { MenuProps } from 'antd';
import { Button, Divider, Flex, Layout, Menu, theme } from 'antd';

import LoginModal from '../login';
import HeaderSearch from '../HeaderSearch';
import { ServerConfig } from '@/app/utils/api/serverConfig';
import Link from 'next/link';
import { Next13ProgressBar } from 'next13-progressbar';
import { APIContext } from '@/app/utils/api/api_base';
import { NASTOOL } from '@/app/utils/api/api';
import { TaskflowContextProvider } from '../taskflow/TaskflowContext';
import Taskbar from '../Taskbar';


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
const getMenuItems = async (API: NASTOOL) => {
  const mediaPageDefaultUrl = await new ServerConfig(API).get()
    .then(res => {
      const default_path = res.media.media_default_path;
      return "/media/file?path=" + default_path;
    })
    .catch(() => "/media/file")
  const items: MenuItem[] = [
    getItem('首页', '/', <HomeOutlined />),
    // getItem('探索', '/discover', <CompassOutlined />, [
    //   getItem('榜单推荐', '/discover/recommand', <BarChartOutlined />),
    //   getItem('豆瓣电影', '/discover/douban-movie', <IconFilmSolid />),
    //   getItem('TMDB电影', '/discover/tmdb-movie', <IconFilmSolid />),
    // ]),
    getItem('资源搜索', '/search/result', <SearchOutlined />),
    getItem('站点管理', '/sites', <UserOutlined />, [
      getItem('站点维护', '/sites/maintain', <ClusterOutlined />),
      getItem('数据统计', '/sites/statistics', <PieChartOutlined />),
      getItem('刷流任务', '/sites/tasks', <FileDoneOutlined />),
      getItem('站点资源', '/sites/resource', <ClusterOutlined />),
    ]),
    getItem('下载任务', '/download/ing', <IconLoading />),
    // getItem('下载管理', '/download', <IconDownloader />, [
    //   getItem('正在下载', '/download/ing', <IconLoading />),
    //   getItem('下载完成', '/download/ed', <VerticalAlignBottomOutlined />),
    //   // getItem('下载器管理', '/download/manage', <IconLoading />),
    // ]),
    getItem('订阅管理', '/subscribe', <IconRssSolid />, [
      getItem('电影订阅', '/subscribe/movie', <IconFilmSolid />),
      getItem('电视剧订阅', '/subscribe/tv', <IconTvSolid />),
      getItem('电视剧订阅(Beta)', '/subscribe/tv_beta', <IconTvSolid />),
      getItem('自定义订阅', '/subscribe/custom', <IconCustomSolid />),
      getItem('订阅日历', '/subscribe/calendar', <IconCalendarDaysSolid />),
    ]),
    // getItem("任务", "/task", <BuildOutlined />),
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
      getItem("识别词", "/setting/words", <IconFont />),
      getItem("媒体服务器", "/setting/mediaserver", <IconMediaServer />),
      getItem("插件", "/setting/plugin", <IconCubes />)
    ]),
  ];
  return items;
}
const DefaultLayout = ({ children }: { children: React.ReactNode }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const pathName = usePathname();
  const updateMenuKey = useCallback(() => {
    const pathKeys = pathName.split("/")
    const subKey = pathKeys.slice(0, 3).join("/");
    const mainKey = pathKeys.slice(0, 2).join("/")
    setSelectedPath({
      selectedKey: [subKey],
      openKey: [mainKey]
    });
  }, [pathName])

  const apiContext = useContext(APIContext)
  const [API, setAPI] = useState<NASTOOL>(apiContext.API);

  useEffect(() => {
    if (API.loginState)
      getMenuItems(API).then((menu) => {
        setMenu(menu);
        updateMenuKey();
      })
  }, [API, updateMenuKey])


  const [collapsed, setCollapsed] = useState(false);
  const { token, } = theme.useToken();

  const [selectedPath, setSelectedPath] = useState<{ selectedKey: string[], openKey: string[] }>();

  useEffect(() => {
    updateMenuKey();
  }, [updateMenuKey])

  const [pageScale, setPageScale] = useState(1);
  useEffect(() => {
    const scale = window.devicePixelRatio;
  }, [])

  return (
    <Layout hasSider style={{ zoom: pageScale }}>
      <APIContext.Provider value={{ API, setAPI }}>



        <Sider
          theme="light"
          style={{
            overflow: "auto",
            paddingBottom: token.Layout?.headerHeight,
            height: '100vh',
            position: "sticky",
            left: 0,
            top: 0,
            bottom: 0,
          }}
          collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
          <Header style={{
            padding: '0px 0px',
            boxSizing: "border-box",
            backgroundColor: token.colorBgContainer,
            boxShadow: token.boxShadowTertiary,
            top: 0,
            position: 'sticky',
            zIndex: 2
          }}>

            <Flex
              style={{ height: `100%`, width: "100%", padding: "0 25px", }}
              justify="space-around" align="center"
            >
              {collapsed ? <> <BlockOutlined style={{ fontSize: '1.5rem' }} />
              </> : <span style={{ fontSize: token.fontSizeLG, fontWeight: "bold", textWrap: "nowrap" }}>
                <BlockOutlined /> NASTOOL Lite</span>}
            </Flex>

          </Header>
          {selectedPath &&
            <Menu mode="inline"
              style={{ height: "100%", overflow: "auto" }}
              items={menu}
              selectedKeys={selectedPath?.selectedKey} defaultOpenKeys={selectedPath?.openKey}
            />
          }
        </Sider>
        <Layout>
          <APILoadedSpace>
            <TaskflowContextProvider>
              <Header
                style={{
                  padding: '0px 0px',
                  paddingLeft: token.padding,
                  boxSizing: "border-box",
                  backgroundColor: token.colorBgContainer,
                  boxShadow: token.boxShadowTertiary,
                  top: 0,
                  position: 'sticky',
                  zIndex: 1
                }} >
                <Next13ProgressBar height="3px" color={token.colorPrimaryBorder} options={{ showSpinner: true }} showOnShallow />
                <Flex align="center" style={{ height: token.Layout?.headerHeight, }} justify="space-between">
                  <Button icon={<MenuOutlined />} onClick={() => { setCollapsed((collapsed) => !collapsed) }} type="text" />
                  <Divider type="vertical" />
                  <Taskbar />
                  <Divider type="vertical" />
                  <HeaderSearch />
                </Flex>
              </Header>
              <Layout>
                <Content style={{ margin: '0px 0px', overflow: 'initial' }} >
                  <div style={{ padding: "0px 16px 16px 16px", minHeight: "50vh", height: "100%", }}>
                    {API.loginState ? children : <></>}
                  </div>
                </Content>
              </Layout>
            </TaskflowContextProvider>
          </APILoadedSpace>
          {/* <Footer style={{ textAlign: 'center', background: colorBgContainer, }}>Ant Design ©2023 Created by Ant UED</Footer> */}
        </Layout>

      </APIContext.Provider>
    </Layout>
  );
};

function APILoadedSpace({ children }: { children: React.ReactNode }) {
  const apiContext = useContext(APIContext);
  const { API } = apiContext;
  if (API.loginState) {
    return <>{children}</>
  } else {
    return <LoginModal></LoginModal>
  }
}

export default DefaultLayout;