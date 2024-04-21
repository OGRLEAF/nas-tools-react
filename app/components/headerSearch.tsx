import { Input, Space, Button, Row, Col, Flex, Drawer, Badge } from 'antd';
import { ControlOutlined, UserOutlined } from "@ant-design/icons"
import { useRouter } from 'next/navigation';
import MessageCenter, { MessageCenterEntry } from './MessageCenter';
import { useState } from 'react';
import Taskbar from './Taskbar'
const { Search } = Input;

const suffix = (
    <ControlOutlined
        style={{
            fontSize: 16,
        }}
    />
)

const HeaderSearch = () => {
    const router = useRouter()
    const onSearch = (value: string) => {
        router.push("/search/" + value)
    }
    return <Flex align="center" justify="space-between" style={{ width: "100%" }} gap={16}>
        <Taskbar />
        <Flex justify="flex-end" align="center" style={{ paddingRight: 16 }} >
            <Search placeholder="搜索"
                style={{ width: 450 }}
                onSearch={onSearch}
                enterButton
            />
            <MessageCenterEntry />
        </Flex>
    </Flex >
}
// <Flex justify="space-between" align="center" style={{ width: "100%", boxSizing: "border-box", padding: '0px 0px 0 15px' }}>

export default HeaderSearch 