# AI Function Calling

<script>
  import OpenAI from "demos/openai/openai.js"
  
  let maxCalls = 3
  let calls = 0
  
  function getCurrentDateTime() {
    return new Date().toLocaleString();
  }
  
  const functions = {
    getCurrentDateTime: getCurrentDateTime,
  };


  async function handleFunctionCall(functionName, args) {
    if (functions[functionName]) {
      return functions[functionName](...args);
    } else {
      throw new Error(`Function ${functionName} not found`);
    }
  }
  
  let messages = [
              { "role": "system", "content": "You are an AI chat bot!" },
              { "role": "user", "content":  [
                {
                  "type": "text",
                  "text": "What is the current time?"
                }
              ]}
            ]
  
  
  async function chat() {
    calls++
    if (calls > maxCalls) {
      lively.warn("max calls reached")
      return
    }
    
    let prompt =  {
            "model": "gpt-4o", 
            "max_tokens": 2000,
            "temperature": 0.1,
            "top_p": 1,
            "n": 1,
            "stream": false,
            "stop": "VANILLA",
            "messages": messages,
            "functions": [
              {
                "name": "getCurrentDateTime",
                "description": "Fetches the current date and time",
                
              },
              {
                    name: "addNumbers",
                    description: "Adds two numbers",
                    parameters: {
                        type: "object",
                        properties: {
                            a: { type: "number" },
                            b: { type: "number" }
                        },
                        required: ["a", "b"]
                    }
                }
            ]
          }

    let json = await OpenAI.openAIRequest(prompt).then(r => r.json())
    if (!json.choices) {
      result.textContent += JSON.stringify(json, undefined, 2)
      return 
    }
    
    
    let message = json.choices[0].message
    messages.push(message)
    
    result.textContent = JSON.stringify(messages, undefined, 2)
    
    if (message.function_call) {
      const functionName = message.function_call.name;
      const args = message.function_call.arguments || [];
      const result = await handleFunctionCall(functionName, args);
      
      
      messages.push({
          role: 'function',
          name: functionName,
          content: JSON.stringify(result)
        })
      chat()
    }
  }

  let result = <div style="white-space: pre-wrap"></div>

  let pane = <div>
    <button click={() => chat()}>chat</button> 
    {result}
  </div>
  pane
</script>