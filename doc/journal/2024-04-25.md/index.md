## 2024-04-25 OpenAI text to speech
*Author: @JensLincke*

This should either go into a tool ore context menu


```javascript
import OpenAI from "demos/openai/openai.js"

let apiKey = await OpenAI.ensureSubscriptionKey()

let prompt = {
    "model": "tts-1",
    "input": that.value,
    "voice": "alloy"
  }


const url = "https://api.openai.com/v1/audio/speech";

const requestOptions = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify(prompt)
};

const ctx = new AudioContext();

let result = await fetch(url, requestOptions)


let audio = await result.arrayBuffer().then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
	

function playback() {
  const playSound = ctx.createBufferSource();
  playSound.buffer = audio;
  playSound.connect(ctx.destination);
  playSound.start(ctx.currentTime);
}

playback()
```

