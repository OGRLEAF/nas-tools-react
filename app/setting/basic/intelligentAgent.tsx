import { LLMModelSelect } from "@/app/components/NTSelects";
import { NastoolServerConfig } from "@/app/utils/api/api";
import { Col, Form, Input, Row, Select } from "antd"

const openAiProviderSelection = [
    {
        label: "Azure",
        value: "azure"
    }, {
        label: "OpenAI",
        value: "openai"
    }
]

export function IntelligentAgentSetting(options: { config?: NastoolServerConfig }) {
    const form = Form.useFormInstance();
    const config = Form.useWatch("openai", form);

    const provider = Form.useWatch(["openai", "provider"], form);
    return <Row gutter={[24, 0]}>
        <Col span={2}>
            <Form.Item label="OpenAI服务" name={["openai", "provider"]}>
                <Select options={openAiProviderSelection} />
            </Form.Item>
        </Col>
        {provider === "azure" &&
            <Col span={4}>
                <Form.Item label="Deployment" name={["openai", "deployment_id"]}>
                    <Input />
                </Form.Item>
            </Col>
        }
        <Col span={6}>
            <Form.Item label="OpenAI API URL" name={["openai", "api_url"]}>
                <Input />
            </Form.Item>
        </Col>

        <Col span={8}>
            <Form.Item label="OpenAI API Key" name={["openai", "api_key"]}>
                <Input />
            </Form.Item>
        </Col>
        <Col span={6}>
            <Form.Item label="Model" name={["openai", "model"]}>
                <LLMModelSelect  llmClientConfig={config}/>
            </Form.Item>
        </Col>
    </Row>
}