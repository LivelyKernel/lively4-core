## 2023-04-13 #OpenAI #API
*Author: @JensLincke*


Meta queries are free....

```javascript
var OPENAI_API_KEY = `sk-fUX5fB5mZUR...`

var value;
(async () => {
  value = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`
    },
  }).then(r => r.json())

})()
  
```

```
 data: [
▼ 0: {
created: 1649358449
id: "babbage"
object: "model"
owned_by: "openai"
▶ permission: []
root: "babbage"
}
▼ 1: {
created: 1649359874
id: "davinci"
object: "model"
owned_by: "openai"
▶ permission: []
root: "davinci"
```

But we need money do ask actual questions:

```javascript      
fetch("https://api.openai.com/v1/completions", {
  method: "POST",
  headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    "model": "text-davinci-003",
    "prompt": "Say this is a test",
    "max_tokens": 7,
    "temperature": 0
  })
}).then(r => r.json())
```

```
"You exceeded your current quota, please check your plan and billing details."
type: "insufficient_quota"
```