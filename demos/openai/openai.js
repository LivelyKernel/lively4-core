const openAiSubscriptionKeyId = "openai-key";


export default class OpenAI {
  static async ensureSubscriptionKey() {
    var key = this.getSubscriptionKey()
    if (!key) {
      key = await lively.prompt(`Enter your OpenAI key`, "");
      this.setSubscriptionKey(key);
    }
    return key
  }

  static setSubscriptionKey(key) {
    return localStorage.setItem(openAiSubscriptionKeyId, key);
  }

  static getSubscriptionKey() {
    return localStorage.getItem(openAiSubscriptionKeyId);
  }

  static async completeCode(code) {
    const apiKey = await this.ensureSubscriptionKey();
    const url = "https://api.openai.com/v1/chat/completions";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        "model": "gpt-3.5-turbo",
        "max_tokens": 100,
        "temperature": 0.1,
        "top_p": 1,
        "n": 1,
        "stream": false,
        "stop": "VANILLA",
        "messages": [
          { "role": "user", "content": "You are an Code completion AI tool. Only anwser by completing the code. Can you autocomplete the following code for me?" },
          { "role": "user", "content": code }
        ],
      })
    };
    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();
      const result = data;
      // document.getElementById('gpt-output').value = result;

      return {
        data: data,
        completion: data.choices.first.message.content
      }
    } catch (error) {
      return {
        isError: true,
        error
      }
    }
  }
}
