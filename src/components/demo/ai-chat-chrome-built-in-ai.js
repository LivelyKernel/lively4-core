import {Speech} from "src/client/openai.js"
import Morph from 'src/components/widgets/lively-morph.js'
import {AudioRecorder} from "src/client/audio.js"
/*MD # OpenAI Chat App with Speech-to-Text support
MD*/

import preloaWebComponents from 'src/client/preload-components.js'
await preloaWebComponents(['lively-markdown'])

let CurrentChat

export default class AiChatChromeBuiltInAi extends Morph {
  
  static get current() {
    return CurrentChat
  }
  
  get responses() { return this.get("#responses")}
  get recordButton() { return this.get("#recordButton")}
  get resetButton() { return this.get("#resetButton")}
  get voiceBox() { return this.get("#voiceBox")}
  get modelBox() { return this.get("#modelBox")}
  get textInput() { return this.get("#textInput")}
  
  get tokensSoFar() { return this.get("#tokens-so-far")}
  get maxTokens() { return this.get("#max-tokens")}
  get tokensLeft() { return this.get("#tokens-left")}
  
  set isRecording(recording) {
    this.classList.toggle("recording", recording);
  }

  get isRecording() {
    return this.classList.contains("recording")
  }
  
  get session() {
    return this.sessions.first
  }
  
  updateMetaData() {
    if (this.sessions) {
      this.tokensSoFar.innerText = this.sessions.last.tokensSoFar
      this.maxTokens.innerText = this.sessions.last.maxTokens
      this.tokensLeft.innerText = this.sessions.last.tokensLeft
    }
  }
  
  async initialize() {
    this.windowTitle = "OpenAI Audio Chat";
    this.audioRecorder = new AudioRecorder();
    const SYSTEM_PROMPT = 'Play the role of a helpful AI chat-bot in a JavaScript, HTML, CSS Web-based development environment.';
    this.prompt = [
        {
        role: 'system',
          content: SYSTEM_PROMPT
          // content: 'Play the role of a helpful AI chat-bot.'
        }
      ];
    
    if (!this.sessions) {
      const session = await self.ai.languageModel.create({
        // temperature: Math.max(capabilities.defaultTemperature * 1.2, 1.0),
        // topK: capabilities.defaultTopK,
        monitor(m) {
          m.addEventListener("downloadprogress", e => {
            lively.warn(`Downloaded ${e.loaded} of ${e.total} bytes.`);
          });
        },
        systemPrompt: SYSTEM_PROMPT
      });
      
      this.sessions = [session]
    }
    
    this.updateMetaData();
    
    if (!this.conversation) {
      this.conversation = [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        }
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
    // #KeyboardShortcut Hold-F9 to use push to talk 
    if (evt.key === "F9"  && !this.isRecording  && !CurrentChat  && lively.isInBody(this)) {
      CurrentChat = this
      lively.addEventListener(lively.ensureID(this), document.documentElement, "keyup", evt => this.onGlobalKeyUp(evt))  
            
      await this.startRecording()
    }
  }
  
  onGlobalKeyUp(evt) {
    if (evt.key === "F9" && this.isRecording) {
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
    this.modelBox.setOptions(["gpt-4o","gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"])
    if (!this.modelBox.value) this.modelBox.value="gpt-3.5-turbo"
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
    this.renderMessage(myMessage)
  }
  
  // response to the question
  async chat() {
    const stream = await this.session.promptStreaming(this.conversation.last.content)
    let message = { "role": "assistant", "content": '' }
    this.conversation.push(message)
    
    const result = await this.renderStreamedMessage(stream, message)

    const extractedCodeBlock = this.extractFirstCodeBlock(result)
    if (extractedCodeBlock) {
      lively.copyTextToClipboard(extractedCodeBlock)
      lively.success('copied answer to clipboard')
    }

    // await this.renderMessage(message)
  
    // Generate speech for the user message
    // if (!this.isSilent) Speech.playSpeech(result, this.voiceBox.value)
    if (!this.isSilent) Speech.playSpeechStreaming(result, this.voiceBox.value, "tts-1", this.get("#player"))
  }
  
  renderMessage(message) {
    const markdown = document.createElement('lively-markdown')
    markdown.setContent(message.content)
    this.responses.appendChild(<li class={message.role}>{markdown}</li>)
    
    lively.sleep(100).then(() => this.responses.scrollTop = this.responses.scrollHeight)
  }
  
  async renderStreamedMessage(stream, message) {
    const markdown = document.createElement('lively-markdown')
    this.responses.appendChild(<li class={"assistant"}>{markdown}</li>)

    let previousChunk = '';
    for await (const chunk of stream) {
      // handle API changes in prompt streaming
      const newChunk = chunk.startsWith(previousChunk) ? chunk.slice(previousChunk.length) : chunk;
      message.content += newChunk;
      previousChunk = chunk;

      markdown.setContent(chunk)
      this.responses.scrollTop = this.responses.scrollHeight
      this.updateMetaData();
    }

    return message.content
  }
    
  extractFirstCodeBlock(text) {
    const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    return match ? match[1].trim() : null;
  }

  async renderConversation() {
    for (let ea of this.conversation) {
      this.renderMessage(ea)
    }
  }

  livelyMigrate(other) {
    this.voiceBox.value = other.voiceBox.value
    this.modelBox.value = other.modelBox.value
    this.conversation = other.conversation
    this.sessions = other.sessions
  }
}
