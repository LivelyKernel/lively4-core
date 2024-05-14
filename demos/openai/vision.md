# Vision

![](vision.png)


![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAsUlEQVR4nO3aMQrCQBBF0XcU7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB7qB)


```javascript

import OpenAI from "demos/openai/openai.js"

let blob = await fetch("http://localhost:9005/lively4-core/demos/openai/vision.png").then(r => r.blob())

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
var json = await OpenAI.openAIRequest(prompt).then(r => r.json())
json


json.choices[0].message

```

Response:
```
 {
content: "The image appears to be a simple drawing of a smiling face. The face is outlined in red, with two eyes and a smiling mouth. The drawing is basic and cartoon-like."
role: "assistant"
}
```