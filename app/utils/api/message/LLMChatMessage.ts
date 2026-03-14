import { ChatMessage, LayerChatMessage, MessageSection } from "./ServerMessage";


export interface LLMThinkingSection extends MessageSection {
    name : "thinking",
    thinking: boolean
}

export type LLMChatMessage = LayerChatMessage & {
    content: {
        sections: (LLMThinkingSection | MessageSection)[]
    },
    extra: {
        sesson_id: number,
    }
}