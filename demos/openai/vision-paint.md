# Paint


<script>
  import OpenAI from "demos/openai/openai.js"
  
  
  let paint = await (<lively-image-editor id="editor"></lively-image-editor>)
  paint.clear()


  async function view() {
    let url =  paint.canvas.toDataURL()
    let blob = await fetch(url).then(r => r.blob())
    let image = await lively.files.readBlobAsDataURL(blob)
    let prompt =  {
            "model": "gpt-4o", 
            "max_tokens": 500,
            "temperature": 0.1,
            "top_p": 1,
            "n": 1,
            "stream": false,
            "stop": "VANILLA",
            "messages": [
              { "role": "system", "content": "You are an AI chat bot!" },
              { "role": "user", "content":  [
                {
                  "type": "text",
                  "text": "What’s in this image?"
                },
                {
                  "type": "image_url",
                  "image_url": {
                    "url": image,
                    "detail": "low" // high
                  }
                }
              ]}
            ]
          }

    let json = await OpenAI.openAIRequest(prompt).then(r => r.json())
    result.textContent = json.choices[0].message.content
  }

  let result = <div></div>

  let pane = <div>
    {paint}
    <button click={() => view()}>view</button> 
    {result}
  </div>


  pane
</script>
