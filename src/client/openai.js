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