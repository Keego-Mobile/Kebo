import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from 'chatgpt';
export declare class Chat {
    chatAPI: ChatGPTAPI | ChatGPTUnofficialProxyAPI;
    constructor(apikey: string, unofficial?: boolean);
    private generatePrompt;
    testModel: () => Promise<import("chatgpt").ChatMessage>;
    codeReview: (patch: string) => Promise<string>;
}
