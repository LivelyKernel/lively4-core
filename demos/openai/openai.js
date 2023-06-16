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

  static async completeCode(code, placeholder="AI_COMPLETE_HERE") {
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
        "max_tokens": 500,
        "temperature": 0.1,
        "top_p": 1,
        "n": 1,
        "stream": false,
        "stop": "VANILLA",
        "messages": [
          { "role": "system", "content": "You are an Code completion AI tool." },
          { "role": "user", "content": `Only anwser by completing the code. Please only replace the ${placeholder} marker with sugggested code!`},
          { "role": "assistant", "content": "yes, I can!" },
          { "role": "user", "content": `function add(a, b) {
  ${placeholder}
}` },
          { "role": "assistant", "content": "  return a + b " },
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
        completion: data.choices.first.message.content.replace(/.*```/g,"").replace(/```(?:\n|.)*/g,"")
      }
    } catch (error) {
      return {
        isError: true,
        error
      }
    }
  }
}
