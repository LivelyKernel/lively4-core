import OpenAI from "demos/openai/openai.js"
import Morph from 'src/components/widgets/lively-morph.js'


export default class Speech {

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

    const response = await fetch(speechUrl, requestOptions);
    const audioBlob = await response.blob();

    // Create an audio element and play the speech
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.play();
  }

  static async transcript(audioFile) {

    let transcriptKey = await OpenAI.ensureSubscriptionKey()
    const transcriptUrl = "https://api.openai.com/v1/audio/transcriptions";

    let prompt = {
      "file": audioFile,
      "model": "whisper-1"
    }

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


export default class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.lastAudioUrl = null;
    this.lastBlob = null;
  }

  async init() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.setupListeners();
  }

  setupListeners() {
    this.mediaRecorder.addEventListener("dataavailable", event => {
      this.audioChunks.push(event.data);
    });

    this.mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(this.audioChunks);
      this.lastBlob = audioBlob;
      if (this.lastAudioUrl) {
        // Revoke the old URL to avoid memory leaks
        URL.revokeObjectURL(this.lastAudioUrl);
      }
      this.lastAudioUrl = URL.createObjectURL(audioBlob);
      this.cleanup(); // Cleanup the audio chunks for the next recording


      this.stopRecordingResolve(this.lastBlob)

    });
  }

  startRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "inactive") {
      this.audioChunks = []; // Clear previous recordings
      this.mediaRecorder.start();
    }
  }


  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();


      return new Promise(resolve => {
        this.stopRecordingResolve = resolve
      })
    }
  }

  play() {
    if (this.lastAudioUrl) {
      const audio = new Audio(this.lastAudioUrl);
      audio.play();
    }
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.audioChunks = [];
  }
}
/*MD # OpenAI Text-to-Speech Tools

  <https://platform.openai.com/docs/guides/text-to-speech>

MD*/

export default class OpenaiAudioChat extends Morph {
  async initialize() {
    this.windowTitle = "OpenaiAudioChat";
    this.registerButtons()
    lively.html.registerKeys(this); // automatically installs handler for some methods


    this.audioRecorder = new AudioRecorder();

    this.conversation = [{
      role: 'system',
      content: 'Play the role of an AI that speaks out loud with the user. He also speaks to you. what you get in text he spoke.'
    }];


    this.setupUI()
  }

  resetConversation() {
    this.conversation = [{
      role: 'system',
      content: 'Play the role of an AI that speaks out loud with the user. He also speaks to you. what you get in text he spoke.'
    }];

    this.responses.innerHTML = ''
  }

  async setupUI() {

    this.audioRecorder.init();

    this.recordButton =
      <button id="record" style="padding:14px; background-color: white; border: 1px solid lightgray; border-radius: 10px; bottom: 15px; position: absolute; right: 35px; background:transparent; border:none; font-size: 20px">🎤</button>

    this.responses =
      <ul style="list-style-type: none; height: calc(100% - 140px) ; overflow-y: scroll; top: 40px; position: absolute; width: 100%"></ul>;

    this.resetButton = <button style="border-radius: 100px; position: absolute; left: 0px; top: 0px">🔄</button>
    this.textInput =

      <input type="text" placeholder="Message ChatGPT" style="padding:15px; background-color:white; border: 1px solid lightgray; border-radius: 10px; width: calc(100% - 100px); bottom: 20px; position: absolute; margin-left: 35px; margin-right: 35px"></input>;

    this.voiceBox = await (
      <input-combobox value="shimmer" style="position: absolute; top: 7px; left: 40px"></input-combobox>);
    this.modelBox = await (
      <input-combobox value="gpt-3.5-turbo" style="position: absolute; top: 7px; left: 150px;"></input-combobox>);

    //TEMP CODEs

    this.resetButton.addEventListener("mousedown", () =>
      this.resetConversation()
    )
    this.recordButton.addEventListener("mousedown", () => this.audioRecorder.startRecording())
    this.recordButton.addEventListener("mouseup", async () => {
      var blob = await this.audioRecorder.stopRecording();
      const text = await Speech.transcript(blob)
      this.textInput.value = this.textInput.value + text.text;
      this.audioRecorder.init()
      1 this.chat(this.textInput.value);
    })

    this.textInput.addEventListener("keydown", (event) => {
      if (event.keyCode === 13) {
        this.chat(this.textInput.value);
      }
    });

    //comboboxes
    this.voiceBox.setOptions(["alloy", "echo", "fable", "onyx", "nova", "shimmer"])
    this.modelBox.setOptions(["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"])

    var ui =

      <div style=" height: 100%; width: 100%; position: absolute; top: 0px; left: 0px">
      {this.responses}
      {this.textInput}
      {this.recordButton}
          <div style="width: 100%; height: 40px; background: white; position: absolute; top: 0px; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)">
          {this.resetButton}
          {this.voiceBox}
          {this.modelBox}
          </div>
    </div>

    this.get("#pane").innerHMTML = ""
    this.get("#pane").appendChild(ui)
  }

  //respons to the question
  async chat(text) {

    const key = await OpenAI.ensureSubscriptionKey()
    const url = "https://api.openai.com/v1/chat/completions"

    this.textInput.value = "";

    this.conversation.push({ "role": "user", "content": text });

    let prompt = {
      "model": this.modelBox.value,
      "max_tokens": 500,
      "temperature": 0.1,
      "top_p": 1,
      "n": 1,
      "stream": false,
      "stop": "VANILLA",
      "messages": this.conversation,
    };


    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify(prompt)
    };



    let result = await fetch(url, requestOptions).then(r => r.json())
    this.conversation.push({ "role": "system", "content": result.choices[0].message.content })

    this.responses.appendChild(<li><strong>You</strong></li>);
    this.responses.appendChild(<li style="margin-bottom:15px;">{text}</li>);

    this.responses.appendChild(<li><strong>AI</strong></li>);
    this.responses.appendChild(<li style="margin-bottom:15px;">{result.choices[0].message.content}</li>);

    // Generate speech for the user message
    Speech.playSpeech(result.choices[0].message.content, this.voiceBox.value);


  }
}
