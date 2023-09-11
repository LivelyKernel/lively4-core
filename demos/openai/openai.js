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
  
  static prompt(code, placeholder) {
    const [ before, after ] = code.split(placeholder);
    return {
        "model": "gpt-3.5-turbo",
        "max_tokens": 500,
        "temperature": 0.1,
        "top_p": 1,
        "n": 1,
        "stream": false,
        "stop": "VANILLA",
        "messages": [
          { "role": "system", "content": `You are an code completion tool.` },
          { "role": "system", "content": `You take the code before the requested point for completion and after the requested completion.` },
          { "role": "system", "content": `Only complete a single line of code.`},
          { "role": "system", "content": `Only return the completed line to the user.`},
          { "role": "user", "content": `This is the code before the line to be completed: 

\`\`\`
${before}
\`\`\`` },
          { "role": "user", "content": `This is the code after the line to be completed: 

\`\`\`
${after}
\`\`\`` },
          { "role": "user", "content": `Give me an appropriate code completion to be inserted between those two code fragments.` },
        ],
      }
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
  
  static async completeCodeLukas(code, placeholder="AI_COMPLETE_HERE") {    
    try {
      var splitCode = code.split(placeholder)
      const beforeCode  = splitCode[0]
      const afterCode  = splitCode[1] || ""
      
      const request = this.lukasPrompt(beforeCode)
      const response = await this.openAIRequest(request)
      const data = await response.json();
      const args = JSON.parse(data.choices.first.message.function_call.arguments);
      return {
        data,
        completion: args.code,
      }
    } catch (error) {
      return {
        isError: true,
        error
      }
    }
  }
  
  static async completeCode(code, placeholder="AI_COMPLETE_HERE") {    
    if (Preferences.get("AILukasExperiment")) {
      return this.completeCodeLukas(code, placeholder)
    }
    
    let request
    let data
    try {
      request = this.prompt(code, placeholder)
      const response = await this.openAIRequest(request)
      data = await response.json();
      
      let completion = data.choices.first.message.content;
      if (completion.includes('```')) {
        completion = completion
          // .replace(/.*```/g,"")
          // .replace(/```(?:\n|.)*/g,"")
          .split('```').second
          ?.replace(/^javascript/i, '')
      }
      return {
        request,
        data,
        completion: completion.trim()
      }
      } catch (error) {
        return {
        isError: true,
        error,
        request,
        data
      }
    }
  }
}
