# AI Streaming Chat

<script>
  import OpenAI from "demos/openai/openai.js"
  
 
  let messages = [
              { "role": "system", "content": "You are an AI chat bot!" },
              { "role": "user", "content":  [
                {
                  "type": "text",
                  "text": "Tell me a funny story about walking and talking trees!"
                }
              ]}
            ]
  
  
  
  async function chat() {
      
    let prompt =  {
      "model": "gpt-4o", 
      "max_tokens": 2000,
      "temperature": 0.1,
      "top_p": 1,
      "n": 1,
      "stream": false,
      "stop": "VANILLA",
      stream: true,
      "messages": messages
    }


    let response = await OpenAI.openAIRequest(prompt)

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let aiMessage = '';

    const chunks = []

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // the format seems to be Server-Sent Events (SSE)
      let jsonSources = chunk
        .split("\n\n")
        .filter(ea => ea)
        .map(ea => ea.replace(/^data: /,""))

      try {
        for(let source of jsonSources) {
          if (source == "[DONE]") {
            result.textContent += "DONE!!!"
          } else {
            const json = JSON.parse(source)

            chunks.push(json)
            // result.textContent += JSON.stringify(json.choices[0].delta) + "\n"
            const content = json.choices[0].delta.content
            if (content) {
              result.textContent += content 
            }
          }
        
        }
      } catch(e) {
        result.textContent += "\nERROR: " + e + " while parsing: '" + chunk + "'"
      }
    }
  }

  let result = <div style="white-space: pre-wrap"></div>

  let pane = <div>
    <button click={() => chat()}>chat</button> 
    {result}
  </div>
  pane
</script>