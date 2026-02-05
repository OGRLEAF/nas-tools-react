import { APIBase } from "./api_base";

export interface LLMClientConfig {
    provider: "azure" | "openai"
    api_key?: string
    api_url?: string
    azure_api_version?: string
    deployment_id?: string
    model?: string
}

export class LLMClient extends APIBase {
    config: LLMClientConfig;
    constructor(config: LLMClientConfig) {
        super();
        this.config = config;
    }
    
    public async models(): Promise<string[]> {
        const result = await this.API.get<{list: string[]}>("llm_chat/models", { auth: true, params: { config: JSON.stringify(this.config) } });
        return result.list
    }

    public async modelsTest(): Promise<string[]> {
        return ["a", "b", "c"];
    }
}