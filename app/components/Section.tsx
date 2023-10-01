import { Space } from 'antd'
export const Section = ({ children, title }: {
    children?: React.ReactNode,
    title: React.ReactNode
}) => {
    return (
        <Space style={{ width: "100%", height: "100%" }} direction='vertical'>
            <h1 style={{ fontSize: "1.1rem", margin: 0, padding: "10px 0 16px 0" }}>{title}</h1>
            {children}
        </Space>
    )
}