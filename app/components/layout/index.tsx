'use client'
import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
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
  BuildOutlined
} from '@ant-design/icons';
import { IconCalendarDaysSolid, IconCustomSolid, IconDatabase, IconFilmSolid, IconFolderTreeSolid, IconHistory, IconLink, IconMediaSolid, IconRssSolid, IconTvSolid } from '../icons';
import type { MenuProps } from 'antd';
import { Breadcrumb, Divider, Layout, Menu, theme } from 'antd';

import LoginModal from '../login';
import HeaderSearch from '../headerSearch';

const { Header, Content, Footer, Sider } = Layout;
type MenuItem = Required<MenuProps>['items'][number];


function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

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
  getItem('订阅管理', '/subscribe', <IconRssSolid />, [
    getItem('电影订阅', '/subscribe/movie', <IconFilmSolid />),
    getItem('电视剧订阅', '/subscribe/tv', <IconTvSolid />),
    getItem('自定义订阅', '/subscribe/custom', <IconCustomSolid />),
    getItem('订阅日历', '/subscribe/calendar', <IconCalendarDaysSolid />),
  ]),
  getItem("任务", "/task", <BuildOutlined />),
  getItem("媒体整理", '/media', <IconMediaSolid />, [
    getItem("文件管理", '/media/file', <IconFolderTreeSolid />),
    getItem("手动识别", '/media/manual', <IconLink />),
    getItem("历史记录", '/media/history', <IconHistory />),
    getItem("TMDB缓存", '/media/tmdb-db', <IconDatabase />),
  ]),
  getItem("设置", "/setting", <SettingOutlined />, [
    getItem("基础设置", "/setting/basic", <ToolOutlined />)
  ]),
];

const DefaultLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const router = useRouter()
  const pathName = usePathname();
  const [selectedPath, setSelectedPath] = useState({
    selectedKey: pathName,
    openKey: "/" + pathName.split("/")[1]
  });
  useEffect(() => {
    setSelectedPath({
      selectedKey: pathName.split("/").slice(0, 3).join("/"),
      openKey: "/" + pathName.split("/")[1]
    });
  }, [pathName])

  const navigate = ({ key }: { key: string }) => {
    if (key.startsWith("/")) {
      router.push(key)
    } else {
      router.push("/")
    }
  }
  return (
    <Layout hasSider>
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
          <span style={{ color: "white" }}>
            {selectedPath.openKey + " " + selectedPath.selectedKey + " " + pathName }
          </span>
          <LoginModal></LoginModal>
        </div>
        <Menu theme="dark" mode="inline" items={items} onSelect={navigate}
          selectedKeys={[selectedPath.selectedKey]} defaultOpenKeys={[selectedPath.openKey]}
        />

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

          <div style={{ padding: "0px 16px 16px 16px", minHeight: "260px", background: colorBgContainer }}>
            {children}
          </div>

        </Content>
        {/* <Footer style={{ textAlign: 'center', background: colorBgContainer, }}>Ant Design ©2023 Created by Ant UED</Footer> */}
      </Layout>
    </Layout>
  );
};

export default DefaultLayout;