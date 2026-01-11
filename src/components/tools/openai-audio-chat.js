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
  
  set isRecording(recording) {
    this.classList.toggle("recording", recording);
  }

  get isRecording() {
    return this.classList.contains("recording")
  }
  
  async initialize() {
    this.windowTitle = "OpenAI Audio Chat";
    this.audioRecorder = new AudioRecorder();
    this.prompt = [
        {
        role: 'system',
          content: 'Play the role of a helpfull AI chat-bot in a JavaScript, HTML, CSS Web-based development environment.'
          // content: 'Play the role of a helpfull AI chat-bot.'
        }
      ]      
    
    if (!this.conversation) {
      this.conversation = [
        // {
        // role: 'system',
        // content: 'Play the role of an AI.'
        // }
      ]      
    }
    
    // remember voice and model in preference
    this.voiceBox.value =  lively.preferences.get("openai-audio-chat-voice") || this.voiceBox.value
    this.voiceBox.addEventListener("change", 
      () => lively.preferences.set("openai-audio-chat-voice", this.voiceBox.value)) 
    this.modelBox.value =  lively.preferences.get("openai-audio-chat-model") || this.modelBox.value
    this.modelBox.addEventListener("change", 
      () => lively.preferences.set("openai-audio-chat-model", this.modelBox.value)) 
    
    this.setupUI()
    await this.renderConversation()
    lively.ensureID(this)
  }
  
  connectedCallback() {
    lively.removeEventListener(lively.ensureID(this), document.documentElement)    
    lively.addEventListener(lively.ensureID(this), document.documentElement, "keydown", evt => this.onGlobalKeyDown(evt))
    
  }
  
  disconnectedCallback() {
    lively.removeEventListener(lively.ensureID(this), document.documentElement) 
    if (CurrentChat === this) CurrentChat = null;
  }
  
  
  async onGlobalKeyDown(evt) {
    // #KeyboardShortcut Hold-F4 to use push to talk 
    if (evt.key === "F4"  && !this.isRecording  && !CurrentChat  && lively.isInBody(this)) {
      CurrentChat = this
      lively.addEventListener(lively.ensureID(this), document.documentElement, "keyup", evt => this.onGlobalKeyUp(evt))  
            
      await this.startRecording()
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

  async startRecording() {
    this.isRecording = true
    await this.audioRecorder.startRecording()
    lively.success('AI Voice Recording started')
  }
  async stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false
    var blob = await this.audioRecorder.stopRecording()
    const text = await Speech.transcript(blob)
    this.textInput.value = this.textInput.value + text.text
    this.chatFromInput()
  }
  
  async setupUI() {
    this.resetButton.addEventListener("mousedown", () =>
      this.resetConversation()
    )
    this.recordButton.addEventListener("mousedown", async () => await this.startRecording())
    this.recordButton.addEventListener("mouseup", () => this.stopRecording() )

    this.textInput.addEventListener("keydown", evt => {
      if (evt.key == "Enter"  && !evt.shiftKey) {
        this.chatFromInput()
      }
    })
    
    //comboboxes
    this.voiceBox.setOptions(["alloy", "echo", "fable", "onyx", "nova", "shimmer", "silent"])
    if (!this.voiceBox.value) this.voiceBox.value="shimmer"
    this.modelBox.setOptions(['gpt-5.2', 'gpt-5.2-pro', 'gpt-5.1-codex-max', 'gpt-5-mini', 'gpt-5-nano'])
    if (!this.modelBox.value) this.modelBox.value="gpt-5.2"
  }

  get isSilent() {
    return this.voiceBox.value == "silent"
  }
  
  async chatFromInput() {
    const selectedText = globalThis.getSelection()?.toString?.();
    if (selectedText) {
      await this.addMessage("user", `The user selected the following text while asking for advice. You may consider this for your answer, if you deem it useful.
\`\`\`
${selectedText}
\`\`\`
      `)
    }
    
    const userText = this.textInput.value;
    this.textInput.value = "";
    await this.addMessage("user", userText)

    this.chat()
  }

  async addMessage(role, text) {
    const myMessage = { role, "content": text }
    this.conversation.push(myMessage);
    await this.renderMessage(myMessage)
  }
  
  // response to the question
  async chat() {
    const key = await OpenAI.ensureSubscriptionKey()
    const url = "https://api.openai.com/v1/chat/completions"

    let prompt = {
      "model": this.modelBox.value,
      "max_tokens": 2000,
      "temperature": 0.1,
      "top_p": 1,
      "n": 1,
      "stream": false,
      "stop": "VANILLA",
      "messages": this.prompt.concat(this.conversation),
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
    let message = { "role": "system", "content": result.choices[0].message.content }
    this.conversation.push(message)

    const extractedCodeBlock = this.extractFirstCodeBlock(result.choices[0].message.content)
    if (extractedCodeBlock) {
      lively.copyTextToClipboard(extractedCodeBlock)
      lively.success('copied answer to clipboard')
    }

    await this.renderMessage(message)
  
    // Generate speech for the user message
    // if (!this.isSilent) Speech.playSpeech(result.choices[0].message.content, this.voiceBox.value)
    if (!this.isSilent) Speech.playSpeechStreaming(result.choices[0].message.content, this.voiceBox.value, "tts-1", this.get("#player"))
  }
  
  async renderMessage(message) {
    var markdown = await <lively-markdown></lively-markdown>
    markdown.setContent(message.content)
    this.responses.appendChild(<li class={message.role}>{markdown}</li>)
    
    lively.sleep(100).then(() => this.responses.scrollTop = this.responses.scrollHeight)
  }
    
  extractFirstCodeBlock(text) {
    const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    return match ? match[1].trim() : null;
  }

  async renderConversation() {
    for (let ea of this.conversation) {
      await this.renderMessage(ea)
    }
  }

  livelyMigrate(other) {
    this.voiceBox.value = other.voiceBox.value
    this.modelBox.value = other.modelBox.value
    this.conversation = other.conversation
  }
}
