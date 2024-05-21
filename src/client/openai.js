const openAiSubscriptionKeyId = "openai-key";

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
  
}



export class Speech {

  static playSpeechStreaming(text, voice="alloy", quality="tts-1", audio=new Audio()) {
    const mediaSource = new MediaSource();
    audio.controls = true;
    audio.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', () => {
      console.log("sourceopen")
      const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg'); // Use the appropriate MIME type

      // Fetch the data and append it to the source buffer
      this.fetchDataAndAppend(mediaSource, sourceBuffer, text, voice, quality);
    });

    audio.play()

    return audio;
  }

  // This function fetches audio data using POST and appends chunks to the source buffer.
  static async fetchDataAndAppend(mediaSource, sourceBuffer, text, voice, quality) {
    let apiKey = await OpenAI.ensureSubscriptionKey()
    const url = "https://api.openai.com/v1/audio/speech";

    let prompt = {
      "model": quality,
      "input": text,
      "voice": voice
    }


    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(prompt)
    };


    const response = await fetch(url, requestOptions)
    const reader = response.body.getReader();

    function process({ done, value }) {
      if (done) {
        mediaSource.endOfStream();
        return;
      }
      if (sourceBuffer.updating) {
        // If buffer is still updating, wait before appending more data
        setTimeout(() => reader.read().then(process), 100);
      } else {
        sourceBuffer.appendBuffer(value);
        reader.read().then(process);
      }
    }

    reader.read().then(process).catch(error => {
      console.error('Error fetching or processing data:', error);
      mediaSource.endOfStream('network'); // Signal an error in fetching stream
    });
  }
  
  
  static async playSpeech(text, voice) {
    let speechKey = await OpenAI.ensureSubscriptionKey()
    const speechUrl = "https://api.openai.com/v1/audio/speech";

    let prompt = {
      "model": "tts-1",
      "input": text,
      "voice": voice
    };

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${speechKey}`
      },
      body: JSON.stringify(prompt)
    };

    const response = await fetch(speechUrl, requestOptions)
    const audioBlob = await response.blob()

    // Create an audio element and play the speech
    const audio = new Audio(URL.createObjectURL(audioBlob))
    audio.play();
  }

  static async transcript(audioFile) {

    let transcriptKey = await OpenAI.ensureSubscriptionKey()
    const transcriptUrl = "https://api.openai.com/v1/audio/transcriptions"

    const formData = new FormData();
    formData.append('file', audioFile, 'audio.ogg');
    formData.append('model', 'whisper-1');

    const requestOptions = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${transcriptKey}`,

      },
      body: formData
    };

    let result = await fetch(transcriptUrl, requestOptions).then(r => r.json())
    return result;
  }
}