import { ChatGPTAPI, ChatGPTUnofficialProxyAPI, ChatMessage } from 'chatgpt';
export declare class Chat {
    chatAPI: ChatGPTAPI | ChatGPTUnofficialProxyAPI;
    lastChatMessage?: ChatMessage;
    constructor(apikey: string, unofficial?: boolean);
    private generatePrompt;
    testModel: () => Promise<void>;
    codeReview: (patch: string, usingPrompt?: boolean) => Promise<string>;
}
