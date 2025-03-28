```javascript
import OpenAI from "demos/openai/openai.js"

// let drawboard = that

let input = "Can you make the line fat?"


let originalSVG  = drawboard.innerHTML

let prompt =  {
        "model": "gpt-4o", // gpt-4o
        "max_tokens": 500,
        "temperature": 0.1,
        "top_p": 1,
        "n": 1,
        "stream": false,
        "stop": "VANILLA",
        "messages": [
          { "role": "system", "content": "You are an SVG editor help!" },
          { "role": "user", "content":  [
            {
              "type": "text",
              "text": "Here is some svg: "
            },
            {
              "type": "text",
              "text": originalSVG
            },
            {
              "type": "text",
              "text":input
            },
            // {
            //   "type": "image_url",
            //   "image_url": {
            //     "url": image,
            //     "detail": "low" // high
            //   }
            // }
          ]}
        ]
      }
var json = await OpenAI.openAIRequest(prompt).then(r => r.json())
let generatedSVG  = 
    
    json.choices[0].message.content.replace(/(.|\n)*<svg/g,"<svg").replace(/```(.|\n)*/,"")

/*
drawboard.innerHTML = originalSVG
drawboard.initSVGInteraction()

*/


drawboard.innerHTML = generatedSVG
drawboard.initSVGInteraction()


lively.notify("completed", generatedSVG)
```