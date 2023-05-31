# OpenAI Workspaces

## First, we need a key:

```javascript
localStorage.setItem('openai-key', 'xxxx');
```

## What models are out there?

```javascript
const apiKey = localStorage.getItem('openai-key');
const url = 'https://api.openai.com/v1/models';
let json;
(async () => {
  json = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Organization': 'org-MPQoSTR6cnoOYKKoexRQqilJ'
    }
  }).then(res => res.json());
  
  return json.data.filter(ea => ea.id.includes(''));
})();
```

## Say Hello World!

```javascript
const apiKey = localStorage.getItem('openai-key');
async function completeCode() {
  const url = "https://api.openai.com/v1/chat/completions";
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      "model": "gpt-3.5-turbo-0301",
      "max_tokens": 70,
      "temperature": 0,
      "top_p": 1,
      "n": 1,
      "stream": false,
      "stop": "\n",
      "messages": [{"role": "user", "content": "What is the meaning of life the universe and everything?"}],
    })
  };
  try {
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    const result = data;
    // document.getElementById('gpt-output').value = result;
    return data
  } catch (error) {
    console.error('Error:', error);
  }
}
completeCode();
```






