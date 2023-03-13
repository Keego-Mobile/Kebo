import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from 'chatgpt';

export class Chat {
  public chatAPI: ChatGPTAPI | ChatGPTUnofficialProxyAPI;

  constructor(apikey: string, unofficial: boolean = true) {
    this.chatAPI = unofficial ?
      new ChatGPTUnofficialProxyAPI({
        accessToken: apikey,
        apiReverseProxyUrl: "https://bypass.duti.tech/api/conversation"
      }) :
      new ChatGPTAPI({ apiKey: apikey });
  }

  private generatePrompt = (patch: string) => {
    return `review this code, only answer short text limited 1 line. if it's good, answers "OK" else start with "💢 NOT OK - {text}", if any bug risk lint and improvement suggestion are welcome
    ${patch}
    `;
  };

  public testModel = async () => {
    return await this.chatAPI.sendMessage("hello, i need your help");
  }

  public codeReview = async (patch: string) => {
    if (!patch) {
      return '';
    }

    console.time('code-review cost');
    const prompt = this.generatePrompt(patch);

    const res = await this.chatAPI.sendMessage(prompt);

    console.timeEnd('code-review cost');
    console.log("Answers: ", res.text);
    return res.text.includes('NOT OK') ? res.text : '';
  };
}
