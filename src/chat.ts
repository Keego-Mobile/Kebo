import { ChatGPTAPI } from 'chatgpt';
export class Chat {
  private chatAPI: ChatGPTAPI;

  constructor(apikey: string) {
    this.chatAPI = new ChatGPTAPI({
      apiKey: apikey,
    });
  }

  private generatePrompt = (patch: string) => {
    return `review this code, only answer short text limited 1 line. if it's good, answers "OK", if any bug risk and improvement suggestion are welcome
    ${patch}
    `;
  };

  public codeReview = async (patch: string) => {
    if (!patch) {
      return '';
    }

    console.time('code-review cost');
    const prompt = this.generatePrompt(patch);
    const lang = process.env.LANGUAGE;

    const res = await this.chatAPI.sendMessage(prompt, {
      promptPrefix: 'hi,',
      promptSuffix: `\nlet's start` + (lang ? ', Answer me in ${lang}' : ''),
    });

    console.timeEnd('code-review cost');
    return res.text.includes('Not OK') ? '' : res.text;
  };
}
