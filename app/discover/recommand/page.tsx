'use client'
import { Space } from "antd"
import { Section } from '../../components/Section';
import PostCard from "@/app/components/postCard";


export default function Page() {

    return (
        <div className="App">
            <Space direction="vertical">
                <Section title="推荐">
                    <Space>
                        <PostCard cover={
                            <img src="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png"></img>} />
                    </Space>
                </Section>
            </Space>
        </div>
    )
}