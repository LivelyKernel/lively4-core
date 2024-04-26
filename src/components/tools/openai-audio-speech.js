import OpenAI from "demos/openai/openai.js"
import Morph from 'src/components/widgets/lively-morph.js';


/*MD # OpenAI Text-to-Speech Tools

  <https://platform.openai.com/docs/guides/text-to-speech>

MD*/

export default class OpenaiAudioSpeech extends Morph {
  async initialize() {
    this.windowTitle = "OpenaiAudioSpeech";
    this.registerButtons()
    lively.html.registerKeys(this); // automatically installs handler for some methods

    this.editor.value = this.getAttribute("value")

    this.editor.addEventListener("editor-loaded", () => {
      this.editor.setOption('lineWrapping', true)

      this.editor.editor.on("change", cm => {
        this.setAttribute("value", this.editor.value)
      })

    })

    this.get("#voice").setOptions(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]) 
    this.get("#voice").value = "alloy"
  
    this.get("#quality").setOptions(["tts-1", "tts-1-hd"]) 
    this.get("#quality").value = "tts-1"
  }
  
  

  get editor() {
    return this.get("#editor")
  }

  get player() {
    return this.get("#player")
  }

  get voice() {
    return this.get("#voice").value
  }
  
  get quality() {
    return this.get("#quality").value
  }
  
  
  get text() {
    return this.editor.value
  }


  setupMediaSource() {
    const mediaSource = new MediaSource();
    const audio = this.player;
    audio.controls = true;
    audio.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', () => {
      console.log("sourceopen")
      const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg'); // Use the appropriate MIME type

      // Fetch the data and append it to the source buffer
      this.fetchDataAndAppend(mediaSource, sourceBuffer);
    });

    audio.play()

    return audio;
  }

  // This function fetches audio data using POST and appends chunks to the source buffer.
  async fetchDataAndAppend(mediaSource, sourceBuffer) {
    let apiKey = await OpenAI.ensureSubscriptionKey()
    const url = "https://api.openai.com/v1/audio/speech";

    let prompt = {
      "model": this.quality,
      "input": this.text,
      "voice": this.voice
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

  async onGenerate() {
    this.setupMediaSource();
  }
}
