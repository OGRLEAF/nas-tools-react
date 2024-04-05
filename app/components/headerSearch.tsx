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
    return (
        <Flex justify="space-between" style={{ width: "100%", boxSizing: "border-box", padding: '0px 0px 0 15px' }}>
            <Taskbar />
            <Flex justify="flex-end" align="center" >
                <Search placeholder="搜索"
                    style={{ width: 500 }}
                    onSearch={onSearch}
                    enterButton
                />
                <MessageCenterEntry />
            </Flex>
        </Flex >
    )
}

export default HeaderSearch 