import Preferences from 'src/client/preferences.js'; 

const openAiSubscriptionKeyId = "openai-key";

/*MD # OpenAI 

- #IDEA use streaming to get immediate feedback! 


MD*/

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
  
  static jensPrompt(code, placeholder) {
    return {
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
      }
  }
  
  static lukasPrompt(code) {
    return {
        "model": "gpt-3.5-turbo-0613",
        "max_tokens": 500,
        "temperature": 0.1,
        "top_p": 1,
        "n": 1,
        "stream": false,
        "stop": null,
        "messages": [
          { "role": "system", "content": "You are a JavaScript code completion tool. You complete whole functions." },
          { "role": "user", "content": code }
        ],
        "functions": [
          {
          "name": "auto_complete_code",
          "description": "Generate code completing the user written JavaScript code.",
          "parameters": {
            "type": "object",
            "properties": {
              "code": {
                "type": "string", // User provided code.
                "description": "Generated code which completes prior code."
              },
              "intent": {
                "type": "string", // We can use this as further information for the user.
                "description": "Assumed intent of the code of the user."
              }
            },
            "required": ["code"]
            }
          }
        ],
        "function_call": {"name": "auto_complete_code"} // Enforce return value in form of 'auto_complete_code'
      }
  }
  
  static async openAIRequest(prompt) {
    const apiKey = await this.ensureSubscriptionKey();
    const url = "https://api.openai.com/v1/chat/completions";

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(prompt)
    };
    return fetch(url, requestOptions);
  }
  
  static async completeCode(code, placeholder="AI_COMPLETE_HERE") {    
    try {
      if (Preferences.get("AILukasExperiment")) {
        var splitCode = code.split(placeholder)
        const beforeCode  = splitCode[0]
        const afterCode  = splitCode[1] || ""
        
        const response = await this.openAIRequest(this.lukasPrompt(beforeCode))
        const data = await response.json();
        const args = JSON.parse(data.choices.first.message.function_call.arguments);
        return {
          data: data,
          completion: args.code,
        }
      } else {
        const response = await this.openAIRequest(this.jensPrompt(code, placeholder))
        const data = await response.json();
        return {
          data: data,
          completion: data.choices.first.message.content.replace(/.*```/g,"").replace(/```(?:\n|.)*/g,"")
        }  
      }
    } catch (error) {
      return {
        isError: true,
        error
      }
    }
  }
}
