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
  
  static async get(url) {
    const apiKey = await this.ensureSubscriptionKey();
    
    const requestOptions = {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(prompt)
    };
    return fetch(url, requestOptions);
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

  // Transcribe an audio blob. Defaults to OpenAI Whisper (unchanged for existing
  // callers). Pass options to target a local whisper.cpp server instead:
  //   { url: 'http://127.0.0.1:8080/inference', apiKey: null, filename: 'audio.wav' }
  // apiKey:null skips the Authorization header (local servers take no key).
  static async transcript(audioFile, options = {}) {
    const transcriptUrl = options.url || "https://api.openai.com/v1/audio/transcriptions"

    const headers = {}
    if (options.apiKey !== null) {
      const key = options.apiKey || await OpenAI.ensureSubscriptionKey()
      headers["Authorization"] = `Bearer ${key}`
    }

    const formData = new FormData();
    formData.append('file', audioFile, options.filename || 'audio.ogg');
    formData.append('model', options.model || 'whisper-1');
    formData.append('response_format', 'json'); // whisper.cpp /inference; OpenAI accepts it too
    // language 'auto' → detect + transcribe in the spoken language (whisper.cpp
    // defaults to 'en', which force-decodes German as English). prompt seeds the
    // initial context to bias identifier spelling. Both are omitted by default,
    // so the OpenAI path (no options) is unchanged.
    if (options.language) formData.append('language', options.language)
    if (options.prompt) formData.append('prompt', options.prompt)

    const result = await fetch(transcriptUrl, { method: "POST", headers, body: formData })
      .then(r => r.json())
    return result;
  }
}