import { Card } from "antd"

export default function PostCard({
    cover
}: {
    cover: React.ReactNode
}) {
    return (
        <>
            <Card
                hoverable
                style={{
                    width: "220px"
                }}
                cover={cover}>
                <Card.Meta title="Europe Street beat" description="www.instagram.com" />
            </Card>
        </>
    )
}