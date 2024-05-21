# Audio 

```javascript
let mediaRecorder
await navigator.mediaDevices
    .getUserMedia(
      // constraints - only audio needed for this app
      {
        audio: true,
      },
    )
    .then((stream) => {
       mediaRecorder = new MediaRecorder(stream);   
     })
    .catch((err) => {
      lively.err(`The following getUserMedia error occurred: ${err}`);
    });



let chunks = [];


mediaRecorder.addEventListener("dataavailable", (e) => {
  chunks.push(e.data);
})


mediaRecorder.requestData()

chunks.length

mediaRecorder.start();
mediaRecorder.stop()




const audio = document.createElement("audio");

const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
  chunks = [];
  const audioURL = window.URL.createObjectURL(blob);
  audio.src = audioURL;
audio.play()


audioURL

import OpenAI from "demos/openai/openai.js"
 let apiKey = await OpenAI.ensureSubscriptionKey()
 
   const formData = new FormData();
 
  // Append the Blob object to the FormData object
  formData.append('file', blob, 'audio.ogg');

  // Append any other parameters required by the API
  // For example, specifying the model or language
  formData.append('model', 'whisper-1');

 
 
 const url = "https://api.openai.com/v1/audio/transcriptions";

    const requestOptions = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: formData
    };


fetch(url, requestOptions).then(r => r.text())
```