import { Input, Space, Button, Row, Col, Flex, Drawer, Badge } from 'antd';
import { ControlOutlined, UserOutlined } from "@ant-design/icons"
import { useRouter } from 'next/navigation';
import MessageCenter from './MessageCenter';
import { useState } from 'react';

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
    const [open, setOpen] = useState(false)
    return (
        <div style={{ padding: "0 0px 0 16px", width: "100%", lineHeight: "0px", }}>
            <Flex>
                <Search placeholder="input search text"
                    onSearch={onSearch}
                    suffix={suffix}
                    enterButton
                />

                <Button type="default"
                    style={{ margin: "0 15px" }}
                    shape="circle"
                    icon={
                        <Badge count={1} size="small">
                            <UserOutlined />
                        </Badge>
                    }
                    onClick={() => setOpen(true)}
                >

                </Button>
            </Flex>
            <Drawer open={open} size="large" onClose={() => setOpen(false)}>
                <MessageCenter />
            </Drawer>
            {/* <Row gutter={0}>
                <Col span={23}>
                    <Search placeholder="input search text"
                        onSearch={onSearch}
                        suffix={suffix}
                        enterButton />
                        </Col>
                <Col span={1} style={{display: "flex", "justifyContent": "center"}}>
                    <Button type="text" icon={<UserOutlined />}></Button>
                </Col>
            </Row> */}
        </div >
    )
}

export default HeaderSearch 