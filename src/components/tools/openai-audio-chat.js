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
  get streamingCheckbox() { return this.get("#streamingCheckbox")}
  
  set isRecording(recording) {
    this.classList.toggle("recording", recording);
  }

  get isRecording() {
    return this.classList.contains("recording")
  }
  
  set isStreaming(streaming) {
    this.classList.toggle("streaming-mode", streaming);
  }

  get isStreaming() {
    return this.classList.contains("streaming-mode")
  }
  
  async initialize() {
    this.windowTitle = "OpenAI Audio Chat";
    this.audioRecorder = new AudioRecorder();
    
    // Streaming mode properties (WebRTC)
    this.peerConnection = null;
    this.dataChannel = null;
    this.audioContext = null;
    this.audioPlaybackQueue = [];
    this.isStreamingActive = false;
    this.ephemeralToken = null;
    
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
    if (this.isStreaming) {
      await this.startStreamingRecording();
    } else {
      this.isRecording = true
      await this.audioRecorder.startRecording()
      lively.success('AI Voice Recording started')
    }
  }
  async stopRecording() {
    if (this.isStreaming) {
      await this.stopStreamingRecording();
    } else {
      if (!this.isRecording) return;
      this.isRecording = false
      var blob = await this.audioRecorder.stopRecording()
      const text = await Speech.transcript(blob)
      this.textInput.value = this.textInput.value + text.text
      this.chatFromInput()
    }
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
    
    // Start with regular TTS voices
    this.updateVoiceOptions(false);
    if (!this.voiceBox.value) this.voiceBox.value="shimmer"
    this.modelBox.setOptions(["gpt-4.1", "gpt-4.1-mini", "gpt-4o","gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"])
    if (!this.modelBox.value) this.modelBox.value="gpt-3.5-turbo"
    
    // Streaming mode toggle
    this.streamingCheckbox.addEventListener("change", async () => {
      if (this.streamingCheckbox.checked) {
        await this.enableStreamingMode();
      } else {
        await this.disableStreamingMode();
      }
    })
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
  
  // Voice options management
  updateVoiceOptions(isRealtime) {
    if (isRealtime) {
      // Realtime API voices
      this.voiceBox.setOptions(["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar", "silent"]);
    } else {
      // Regular TTS voices
      this.voiceBox.setOptions(["alloy", "echo", "fable", "onyx", "nova", "shimmer", "silent"]);
    }
  }

  // Realtime API Streaming Methods
  async enableStreamingMode() {
    try {
      this.isStreaming = true;

      // Update voice options to Realtime API voices
      this.updateVoiceOptions(true);

      // Check if current voice is compatible with Realtime API
      const realtimeVoices = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar", "silent"];
      const currentVoice = this.voiceBox.value;

      if (!realtimeVoices.includes(currentVoice)) {
        // Map incompatible voices to similar Realtime API voices
        const voiceMapping = {
          "fable": "ballad",   // storytelling style
          "onyx": "echo",      // deep voice
          "nova": "shimmer"    // friendly voice
        };

        const newVoice = voiceMapping[currentVoice] || "shimmer";
        this.voiceBox.value = newVoice;
        lively.warn(`Voice changed from "${currentVoice}" to "${newVoice}" (Realtime API compatible)`);
      }

      await this.connectRealtimeWebRTC();
      lively.success("Streaming mode enabled");
    } catch (error) {
      this.isStreaming = false;
      this.streamingCheckbox.checked = false;
      // Restore regular TTS voices on error
      this.updateVoiceOptions(false);
      lively.error("Failed to enable streaming mode: " + error.message);
      console.error("Streaming mode error:", error);
    }
  }

  async disableStreamingMode() {
    this.isStreaming = false;
    this.disconnectRealtimeWebRTC();

    // Switch back to regular TTS voices
    this.updateVoiceOptions(false);

    // Map Realtime-only voices back to TTS equivalents
    const ttsVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer", "silent"];
    const currentVoice = this.voiceBox.value;

    if (!ttsVoices.includes(currentVoice)) {
      const reverseMapping = {
        "ash": "alloy",
        "ballad": "fable",
        "coral": "shimmer",
        "sage": "echo",
        "verse": "fable",
        "marin": "nova",
        "cedar": "onyx"
      };

      const newVoice = reverseMapping[currentVoice] || "shimmer";
      this.voiceBox.value = newVoice;
      lively.warn(`Voice changed from "${currentVoice}" to "${newVoice}" (TTS compatible)`);
    }

    lively.success("Streaming mode disabled");
  }
  
  // WebRTC Realtime API Implementation
  async generateEphemeralToken() {
    const apiKey = await OpenAI.ensureSubscriptionKey();
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: this.voiceBox.value === "silent" ? "alloy" : this.voiceBox.value,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ephemeral token error response:", errorText);
      try {
        const errorJson = JSON.parse(errorText);
        console.error("Error details:", errorJson);
        throw new Error(`Failed to generate ephemeral token: ${errorJson.error?.message || response.statusText}`);
      } catch (parseError) {
        throw new Error(`Failed to generate ephemeral token: ${response.statusText} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log("Ephemeral token response:", data);
    return data.client_secret.value;
  }

  async connectRealtimeWebRTC() {
    console.log("Connecting to OpenAI Realtime API via WebRTC...");

    // Step 1: Generate ephemeral token
    this.ephemeralToken = await this.generateEphemeralToken();
    console.log("Ephemeral token generated");

    // Step 2: Create RTCPeerConnection
    this.peerConnection = new RTCPeerConnection();

    // Step 3: Set up audio track from microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, stream);
    });
    this.localStream = stream;

    // Step 4: Set up data channel for messages
    this.dataChannel = this.peerConnection.createDataChannel('oai-events');
    this.setupDataChannel();

    // Step 5: Handle incoming audio tracks
    this.peerConnection.ontrack = (event) => {
      console.log("Received remote audio track");
      const remoteAudio = new Audio();
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.play();
      this.remoteAudio = remoteAudio;
    };

    // Step 6: Create and set local offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // Step 7: Send offer to OpenAI and get answer
    const answerResponse = await fetch('https://api.openai.com/v1/realtime', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.ephemeralToken}`,
        'Content-Type': 'application/sdp',
      },
      body: offer.sdp,
    });

    if (!answerResponse.ok) {
      throw new Error(`Failed to connect: ${answerResponse.statusText}`);
    }

    const answerSDP = await answerResponse.text();
    await this.peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: answerSDP,
    });

    console.log("WebRTC connection established");
    this.isStreamingActive = true;
  }

  setupDataChannel() {
    this.dataChannel.onopen = () => {
      console.log("Data channel opened");
      this.sendSessionConfig();
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleRealtimeMessage(message);
      } catch (error) {
        console.error("Error parsing data channel message:", error);
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error("Data channel error:", error);
      lively.error("Realtime connection error");
    };

    this.dataChannel.onclose = () => {
      console.log("Data channel closed");
      this.isStreamingActive = false;
    };
  }

  sendSessionConfig() {
    const sessionConfig = {
      type: "session.update",
      session: {
        instructions: "You are a helpful AI assistant in a JavaScript, HTML, CSS Web-based development environment. Respond in a conversational, natural way.",
        voice: this.voiceBox.value === "silent" ? "alloy" : this.voiceBox.value,
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      }
    };

    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(sessionConfig));
    }
  }

  disconnectRealtimeWebRTC() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio.srcObject = null;
      this.remoteAudio = null;
    }

    this.isStreamingActive = false;
    this.ephemeralToken = null;
  }

  handleRealtimeMessage(message) {
    switch (message.type) {
      case "session.created":
        console.log("Session created:", message);
        break;
      case "session.updated":
        console.log("Session updated:", message);
        break;
      case "input_audio_buffer.speech_started":
        console.log("Speech started");
        lively.success("Listening...");
        // Start accumulating user transcript
        this.currentUserTranscript = "";
        break;
      case "input_audio_buffer.speech_stopped":
        console.log("Speech stopped");
        break;
      case "conversation.item.created":
        console.log("Item created:", message);
        // Check if this is a user message with transcript
        if (message.item?.type === "message" && message.item?.role === "user") {
          const content = message.item.content?.find(c => c.type === "input_text" || c.type === "text");
          if (content?.text || content?.transcript) {
            const userText = content.text || content.transcript;
            this.addMessage("user", userText);
          }
        }
        break;
      case "conversation.item.input_audio_transcription.completed":
        // User speech was transcribed
        console.log("User transcript:", message.transcript);
        if (message.transcript) {
          this.addMessage("user", message.transcript);
        }
        break;
      case "response.audio_transcript.delta":
        console.log("Transcript delta:", message.delta);
        // Accumulate assistant response transcript
        if (!this.currentAssistantTranscript) {
          this.currentAssistantTranscript = "";
        }
        this.currentAssistantTranscript += message.delta;
        break;
      case "response.audio_transcript.done":
        console.log("Transcript done:", message.transcript);
        // Display complete assistant response
        if (message.transcript) {
          this.addMessage("assistant", message.transcript);
          this.currentAssistantTranscript = "";
        }
        break;
      case "response.done":
        console.log("Response complete:", message);
        // Fallback: if we accumulated transcript but didn't get .done event
        if (this.currentAssistantTranscript) {
          this.addMessage("assistant", this.currentAssistantTranscript);
          this.currentAssistantTranscript = "";
        }
        break;
      case "error":
        console.error("Realtime API error:", message);
        console.error("Full error details:", JSON.stringify(message, null, 2));
        lively.error("Realtime API error: " + (message.error?.message || JSON.stringify(message)));
        break;
      default:
        console.log("Unhandled message type:", message.type, message);
    }
  }
  

  async startStreamingRecording() {
    // WebRTC mode: Audio is automatically streamed via RTCPeerConnection
    // No need to manually record - just indicate we're in recording mode
    this.isRecording = true;
    lively.success('Real-time audio streaming active - speak now');
  }

  async stopStreamingRecording() {
    // WebRTC mode: Just toggle the recording indicator
    // The audio stream continues but we're not actively "recording"
    this.isRecording = false;
    lively.success('Paused - click record to resume');
  }
}
