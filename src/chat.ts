import { ChatGPTAPI, ChatGPTUnofficialProxyAPI, ChatMessage } from 'chatgpt';

export class Chat {
  public chatAPI: ChatGPTAPI | ChatGPTUnofficialProxyAPI;
  public lastChatMessage?: ChatMessage;

  constructor(apikey: string, unofficial: boolean = true) {
    this.chatAPI = unofficial ?
      new ChatGPTUnofficialProxyAPI({
        accessToken: apikey,
        apiReverseProxyUrl: "https://bypass.duti.tech/api/conversation"
      }) :
      new ChatGPTAPI({ apiKey: apikey });
  }

  private generatePrompt = (patch: string) => {
    return `i want you act as android developer, review this code, only care about java, kotlin or android related files, only answer short text limited 1 line. if it's good, answer "✅OK" else answer start with "💢 NOT OK - {text}", if any bug, risk, lint, clean code and improvement suggestion are welcome
    ${patch}
    `;
  };

  public testModel = async () => {
    this.lastChatMessage = this.lastChatMessage ?? await this.chatAPI.sendMessage(this.generatePrompt(''));
  }

  public codeReview = async (patch: string, usingPrompt: boolean = true) => {
    if (!patch) {
      return '';
    }

    console.time('code-review cost');
    var prompt = patch;
    if (usingPrompt) {
      prompt = this.generatePrompt(patch);
    }

    this.lastChatMessage = await this.chatAPI.sendMessage(prompt, {
      parentMessageId: this.lastChatMessage?.id,
      conversationId: this.lastChatMessage?.conversationId
    });

    console.timeEnd('code-review cost');
    console.log("Answers: ", this.lastChatMessage.text);
    return this.lastChatMessage.text;
    // return this.lastChatMessage.text.includes('NOT OK') ? this.lastChatMessage.text : '';
  };
}
