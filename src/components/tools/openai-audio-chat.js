import OpenAI from "src/client/openai.js"
import {Speech} from "src/client/openai.js"
import Morph from 'src/components/widgets/lively-morph.js'
import {AudioRecorder} from "src/client/audio.js"
/*MD # OpenAI Chat App with Speech-to-Text support
MD*/

let CurrentChat



export default class OpenaiAudioChat extends Morph {
  
  static get current() {
    return CurrentChat
  }
  
  
  get responses() { return this.get("#responses")}
  get recordButton() { return this.get("#recordButton")}
  get resetButton() { return this.get("#resetButton")}
  get voiceBox() { return this.get("#voiceBox")}
  get modelBox() { return this.get("#modelBox")}
  get textInput() { return this.get("#textInput")}
  
  
  set isRecording(bool) {
    if (bool) {
      this.classList.add("recording")
    } else {
      this.classList.remove("recording")
    }
  }

  get isRecording() {
    return this.classList.contains("recording")
  }
  
  async initialize() {
    this.windowTitle = "OpenAI Audio Chat";
    this.audioRecorder = new AudioRecorder();
    this.conversation = [{
      role: 'system',
      content: 'Play the role of an AI that speaks out loud with the user. He also speaks to you. what you get in text he spoke.'
    }]
    this.setupUI()
    lively.ensureID(this)
  }
  
  connectedCallback() {
    lively.notify("connectedCallback")
    
    lively.removeEventListener(lively.ensureID(this), document.documentElement)    
    lively.addEventListener(lively.ensureID(this), document.documentElement, "keydown", evt => this.onGlobalKeyDown(evt))
    
  }
  
  disconnectedCallback() {
    lively.notify("disconnectedCallback")
    lively.removeEventListener(lively.ensureID(this), document.documentElement) 
    if (CurrentChat === this) CurrentChat = null;
  }
  
  
  onGlobalKeyDown(evt) {
    if (evt.key === "F4"  && !this.isRecording  && !CurrentChat  && lively.isInBody(this)) {
      CurrentChat = this
      lively.addEventListener(lively.ensureID(this), document.documentElement, "keyup", evt => this.onGlobalKeyUp(evt))  
            
      
      lively.showElement(this)
      this.startRecording()
    }
  }
  
  onGlobalKeyUp(evt) {
    if (evt.key === "F4" && this.isRecording) {
      lively.removeEventListener(lively.ensureID(this), document.documentElement, "keyup")    
      lively.warn("stop recording")
      this.stopRecording()
      CurrentChat = null
    }
  }

  resetConversation() {
    this.conversation = [{
      role: 'system',
      content: 'Play the role of an AI that speaks out loud with the user. He also speaks to you. what you get in text he spoke.'
    }]
    this.responses.innerHTML = ''
  }

  startRecording() {
    this.isRecording = true
    this.audioRecorder.startRecording()
  }
  async stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false
    var blob = await this.audioRecorder.stopRecording()
    debugger
    const text = await Speech.transcript(blob)
    this.textInput.value = this.textInput.value + text.text
    this.audioRecorder.init()
    this.chat(this.textInput.value)
  }
  
  async setupUI() {
    this.audioRecorder.init()
    this.resetButton.addEventListener("mousedown", () =>
      this.resetConversation()
    )
    this.recordButton.addEventListener("mousedown", () => this.startRecording())
    this.recordButton.addEventListener("mouseup", () => this.stopRecording() )

    this.textInput.addEventListener("keydown", evt => {
      if (evt.key == "Enter"  && !evt.shiftKey) {
        this.chat(this.textInput.value)
      }
    })
    
    //comboboxes
    this.voiceBox.setOptions(["alloy", "echo", "fable", "onyx", "nova", "shimmer", "silent"])
    this.voiceBox.value="shimmer"
    this.modelBox.setOptions(["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"])
    this.modelBox.value="gpt-3.5-turbo"
  }

  get isSilent() {
    return this.voiceBox.value == "silent"
  }
  
  // response to the question
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
    }
    
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify(prompt)
    }

    let result = await fetch(url, requestOptions).then(r => r.json())
    this.conversation.push({ "role": "system", "content": result.choices[0].message.content })

    this.responses.appendChild(<li><strong>You</strong></li>)
    this.responses.appendChild(<li style="margin-bottom:15px;">{text}</li>)

    this.responses.appendChild(<li><strong>AI</strong></li>)
    this.responses.appendChild(<li style="margin-bottom:15px;">{result.choices[0].message.content}</li>)

    // Generate speech for the user message
    if (!this.isSilent) Speech.playSpeech(result.choices[0].message.content, this.voiceBox.value)
  }
}
