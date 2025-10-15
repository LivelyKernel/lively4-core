import OpenAI from "src/client/openai.js"
import {Speech} from "src/client/openai.js"
import Morph from 'src/components/widgets/lively-morph.js'
import {AudioRecorder} from "src/client/audio.js"
import {Tools, getFunctionDefinitions as getToolDefinitions, executeTool} from "./openai-audio-chat-tools.js"
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
  get pauseButton() { return this.get("#pauseButton")}
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

  set isListening(listening) {
    this.classList.toggle("listening", listening);
  }

  get isListening() {
    return this.classList.contains("listening")
  }

  set isMuted(muted) {
    this.classList.toggle("muted", muted);
  }

  get isMuted() {
    return this.classList.contains("muted")
  }

  // Function Registry for Local Function Calling
  initializeFunctionRegistry() {
    // Tools are loaded from openai-audio-chat-tools.js
    // No additional setup needed
  }

  getFunctionDefinitions() {
    return getToolDefinitions();
  }

  async callFunction(functionName, args) {
    console.log(`Calling function ${functionName} with args:`, args);

    try {
      const result = await executeTool(functionName, args);
      console.log(`Function ${functionName} returned:`, result);
      return result;
    } catch (error) {
      console.error(`Function ${functionName} error:`, error);
      return { success: false, error: error.message };
    }
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

    // Local function calling
    this.initializeFunctionRegistry();

    // Listen for window close events
    this.addEventListener('close', () => this.onWindowClose());
    
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
    lively.notify("close audio chat")
    lively.removeEventListener(lively.ensureID(this), document.documentElement)
    if (CurrentChat === this) CurrentChat = null;

    // Disconnect real-time streaming when component is removed
    this.cleanupStreaming();
  }

  onWindowClose() {
    console.log("Window closing, cleaning up streaming");
    this.cleanupStreaming();
  }

  cleanupStreaming() {
    if (this.isStreaming) {
      console.log("Cleaning up real-time streaming connection");
      this.isConnecting = false; // Allow cleanup to proceed
      this.disconnectRealtimeWebRTC();
      this.isStreaming = false;
      if (this.streamingCheckbox) {
        this.streamingCheckbox.checked = false;
      }
    }
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

  toggleMute() {
    if (!this.isStreaming || !this.localStream) {
      lively.warn("Pause only works in real-time mode");
      return;
    }

    this.isMuted = !this.isMuted;

    // Enable/disable microphone track
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !this.isMuted;
    });

    // Update button text/icon
    this.pauseButton.textContent = this.isMuted ? "▶️ Resume" : "⏸️ Pause";

    // Visual feedback
    lively.notify(this.isMuted ? "Microphone muted" : "Microphone active");
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

    this.pauseButton.addEventListener("click", () => this.toggleMute())

    this.textInput.addEventListener("keydown", evt => {
      if (evt.key == "Enter"  && !evt.shiftKey) {
        this.chatFromInput()
      }
    })

    // Start with regular TTS voices
    this.updateVoiceOptions(false);
    if (!this.voiceBox.value) this.voiceBox.value="shimmer"

    // Start with regular chat models
    this.updateModelOptions(false);
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

  async addToolMessage(text) {
    // Tool messages are ephemeral UI feedback, not added to conversation history
    var markdown = await <lively-markdown></lively-markdown>
    markdown.setContent(text)
    this.responses.appendChild(<li class="tool">{markdown}</li>)
    lively.sleep(100).then(() => this.responses.scrollTop = this.responses.scrollHeight)
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
      "tools": this.getFunctionDefinitions(),
      "tool_choice": "auto"
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

    // Handle function calling
    if (result.choices[0].message.tool_calls) {
      // Add assistant's function call to conversation
      this.conversation.push({
        role: "assistant",
        content: null,
        tool_calls: result.choices[0].message.tool_calls
      });

      // Execute each function call
      for (const toolCall of result.choices[0].message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`AI is calling function: ${functionName}`, functionArgs);

        // Call the function
        const functionResult = await this.callFunction(functionName, functionArgs);

        // Add function result to conversation
        this.conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify(functionResult)
        });
      }

      // Make another API call to get the final response with function results
      return await this.chat();
    }

    // Regular text response
    let message = { "role": "assistant", "content": result.choices[0].message.content }
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

  async createLiveUserMessage() {
    // Create markdown element for user message placeholder
    this.currentLiveUserMarkdown = await <lively-markdown></lively-markdown>
    this.currentLiveUserMarkdown.setContent("_Listening..._")

    // Create list item and add to responses
    this.currentLiveUserMessageElement = <li class="user">{this.currentLiveUserMarkdown}</li>
    this.responses.appendChild(this.currentLiveUserMessageElement)

    // Auto-scroll to show new message
    lively.sleep(100).then(() => this.responses.scrollTop = this.responses.scrollHeight)
  }

  async updateLiveUserMessage(text) {
    if (this.currentLiveUserMarkdown) {
      this.currentLiveUserMarkdown.setContent(text)
      // Auto-scroll as content grows
      lively.sleep(10).then(() => this.responses.scrollTop = this.responses.scrollHeight)
    }
  }

  async createLiveAssistantMessage() {
    // Create markdown element for live updates
    this.currentLiveMarkdown = await <lively-markdown></lively-markdown>
    this.currentLiveMarkdown.setContent("")

    // Create list item and add to responses
    this.currentLiveMessageElement = <li class="assistant">{this.currentLiveMarkdown}</li>
    this.responses.appendChild(this.currentLiveMessageElement)

    // Auto-scroll to show new message
    lively.sleep(100).then(() => this.responses.scrollTop = this.responses.scrollHeight)
  }

  async updateLiveAssistantMessage(text) {
    if (this.currentLiveMarkdown) {
      this.currentLiveMarkdown.setContent(text)
      // Auto-scroll as content grows
      lively.sleep(10).then(() => this.responses.scrollTop = this.responses.scrollHeight)
    }
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

  // Model options management
  updateModelOptions(isRealtime) {
    if (isRealtime) {
      // Realtime API models
      this.modelBox.setOptions(["gpt-4o-realtime-preview-2024-12-17"]);
      this.modelBox.value = "gpt-4o-realtime-preview-2024-12-17";
    } else {
      // Regular chat completion models
      this.modelBox.setOptions(["gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]);
    }
  }

  // Realtime API Streaming Methods
  async enableStreamingMode() {
    try {
      this.isStreaming = true;

      // Update voice and model options to Realtime API
      this.updateVoiceOptions(true);
      this.updateModelOptions(true);

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
        lively.notify(`Voice changed to "${newVoice}"`, `"${currentVoice}" is not available in real-time mode`);
      }

      await this.connectRealtimeWebRTC();
      lively.success("Streaming mode enabled");
    } catch (error) {
      this.isStreaming = false;
      this.streamingCheckbox.checked = false;
      // Restore regular TTS voices and models on error
      this.updateVoiceOptions(false);
      this.updateModelOptions(false);
      lively.notify("Could not enable real-time mode", error.message);
      console.error("Streaming mode error:", error);
    }
  }

  async disableStreamingMode() {
    this.isStreaming = false;
    this.isMuted = false; // Reset mute state
    this.pauseButton.textContent = "⏸️ Pause"; // Reset button text
    this.disconnectRealtimeWebRTC();

    // Switch back to regular TTS voices and chat models
    this.updateVoiceOptions(false);

    const currentModel = this.modelBox.value;
    this.updateModelOptions(false);

    // Check if current model is available in regular mode
    const regularModels = ["gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"];
    if (!regularModels.includes(currentModel)) {
      // Map Realtime model to best regular model
      const newModel = "gpt-4o"; // Default to gpt-4o as it's most similar to realtime
      this.modelBox.value = newModel;
      lively.notify(`Model changed to "${newModel}"`, `"${currentModel}" is only for real-time mode`);
    }

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
      lively.notify(`Voice changed to "${newVoice}"`, `"${currentVoice}" is only for real-time mode`);
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
        model: this.modelBox.value,
        voice: this.voiceBox.value === "silent" ? "alloy" : this.voiceBox.value,
        tools: this.getFunctionDefinitions()
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

    // Clear any existing connection first
    if (this.peerConnection) {
      console.log("Cleaning up existing connection before reconnecting");
      this.disconnectRealtimeWebRTC();
    }

    // Step 1: Generate ephemeral token
    this.ephemeralToken = await this.generateEphemeralToken();
    console.log("Ephemeral token generated");

    // Step 2: Create RTCPeerConnection
    this.peerConnection = new RTCPeerConnection();
    this.isConnecting = true; // Flag to prevent premature cleanup

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

    // Check if peer connection still exists (might have been disconnected)
    if (!this.peerConnection) {
      throw new Error("Peer connection was closed during setup");
    }

    await this.peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: answerSDP,
    });

    console.log("WebRTC connection established");
    this.isStreamingActive = true;
    this.isConnecting = false;
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
      lively.notify("Connection issue", "Real-time audio connection error");
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
        instructions: "You are a helpful AI assistant in a JavaScript, HTML, CSS Web-based development environment. Respond in a conversational, natural way. You have access to several functions that you can call to help the user.",
        voice: this.voiceBox.value === "silent" ? "alloy" : this.voiceBox.value,
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: this.getFunctionDefinitions(),
        tool_choice: "auto"
      }
    };

    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(sessionConfig));
    }
  }

  disconnectRealtimeWebRTC() {
    // Don't disconnect if we're still connecting
    if (this.isConnecting) {
      console.log("Connection in progress, skipping disconnect");
      return;
    }

    console.log("Disconnecting WebRTC...");

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
    this.isListening = false;
  }

  async handleRealtimeMessage(message) {
    switch (message.type) {
      case "session.created":
        console.log("Session created:", message);
        if (message.session?.tools) {
          console.log("✓ Functions registered in session:", message.session.tools);
          lively.notify("Functions Ready", `${message.session.tools.length} functions available`);
        }
        break;
      case "session.updated":
        console.log("Session updated:", message);
        if (message.session?.tools) {
          console.log("✓ Functions in updated session:", message.session.tools);
        }
        break;

      case "response.function_call_arguments.delta":
        // Function arguments are being streamed
        console.log("Function call arguments delta:", message);
        break;

      case "response.function_call_arguments.done":
        // Function call arguments complete - logged but actual handling in response.done
        console.log("Function call arguments done:", message);
        break;

      case "response.done":
        console.log("Response complete:", message);
        // Check if response contains function calls
        if (message.response?.output) {
          for (const item of message.response.output) {
            if (item.type === "function_call") {
              this.handleFunctionCallFromResponse(item);
            }
          }
        }
        // Fallback: if we accumulated transcript but didn't get .done event
        if (this.currentAssistantTranscript) {
          if (this.currentLiveMessageElement) {
            // Already have live message, just finalize it
            this.conversation.push({ role: "assistant", content: this.currentAssistantTranscript });
            this.currentLiveMessageElement = null;
            this.currentLiveMarkdown = null;
          } else {
            // No live message, create one
            await this.addMessage("assistant", this.currentAssistantTranscript);
          }
          this.currentAssistantTranscript = "";
        }
        break;
      case "input_audio_buffer.speech_started":
        console.log("Speech started");
        this.isListening = true;
        lively.success("Listening...");
        // Create placeholder for user message
        await this.createLiveUserMessage();
        break;
      case "input_audio_buffer.speech_stopped":
        console.log("Speech stopped");
        this.isListening = false;
        break;
      case "conversation.item.created":
        console.log("Item created:", message);
        // Check if this is a user message with transcript
        if (message.item?.type === "message" && message.item?.role === "user") {
          const content = message.item.content?.find(c => c.type === "input_text" || c.type === "text");
          if (content?.text || content?.transcript) {
            const userText = content.text || content.transcript;
            // Update placeholder if exists, otherwise create new message
            if (this.currentLiveUserMessageElement) {
              await this.updateLiveUserMessage(userText);
            } else {
              await this.addMessage("user", userText);
            }
          }
        }
        break;
      case "conversation.item.input_audio_transcription.completed":
        // User speech was transcribed
        console.log("User transcript:", message.transcript);
        console.log("FULL conversation.item.input_audio_transcription.completed:", JSON.stringify(message, null, 2));
        if (message.transcript) {
          if (this.currentLiveUserMessageElement) {
            // Update existing placeholder with final transcript
            await this.updateLiveUserMessage(message.transcript);
            // Add to conversation history
            this.conversation.push({ role: "user", content: message.transcript });
            // Clear live message tracking
            this.currentLiveUserMessageElement = null;
            this.currentLiveUserMarkdown = null;
          } else {
            // Fallback: create message if somehow missed the placeholder
            await this.addMessage("user", message.transcript);
          }
        }
        break;
      case "response.audio.delta":
        // Audio chunk received - log structure to see timing info
        console.log("FULL response.audio.delta:", JSON.stringify({
          type: message.type,
          response_id: message.response_id,
          item_id: message.item_id,
          output_index: message.output_index,
          content_index: message.content_index,
          delta_length: message.delta?.length
        }, null, 2));
        break;
      case "response.audio_transcript.delta":
        console.log("Transcript delta:", message.delta);
        console.log("FULL response.audio_transcript.delta:", JSON.stringify(message, null, 2));

        // Initialize transcript accumulation and create message element on first delta
        if (!this.currentAssistantTranscript) {
          this.currentAssistantTranscript = "";
          // Create live message element for progressive updates
          await this.createLiveAssistantMessage();
        }

        // Accumulate transcript text
        this.currentAssistantTranscript += message.delta;

        // Update the live message element with accumulated text
        await this.updateLiveAssistantMessage(this.currentAssistantTranscript);
        break;

      case "response.audio_transcript.done":
        console.log("Transcript done:", message.transcript);
        console.log("FULL response.audio_transcript.done:", JSON.stringify(message, null, 2));

        // Replace with final complete transcript for accuracy
        if (message.transcript) {
          if (this.currentLiveMessageElement) {
            // Update existing element with final transcript
            await this.updateLiveAssistantMessage(message.transcript);
            // Add to conversation history
            this.conversation.push({ role: "assistant", content: message.transcript });
            // Clear live message tracking
            this.currentLiveMessageElement = null;
            this.currentLiveMarkdown = null;
          } else {
            // Fallback: create message if somehow missed the deltas
            await this.addMessage("assistant", message.transcript);
          }
          this.currentAssistantTranscript = "";
        }
        break;
      case "error":
        console.error("Realtime API error:", message);
        console.error("Full error details:", JSON.stringify(message, null, 2));
        lively.notify("Real-time API issue", message.error?.message || "An error occurred");
        break;
      default:
        // Log all unhandled message types, highlight function/tool events
        if (message.type?.includes('function') || message.type?.includes('tool')) {
          console.warn("⚠️ Unhandled function/tool message:", message.type, message);
        } else {
          console.log("Unhandled message type:", message.type, message);
        }
    }
  }

  async handleFunctionCallFromResponse(item) {
    // item contains: name, call_id, arguments (as JSON string)
    const functionName = item.name;
    const callId = item.call_id;
    const functionArgs = JSON.parse(item.arguments);

    console.log(`Realtime API function call: ${functionName}`, functionArgs);
    lively.notify("Function Called", `Executing ${functionName}`);

    // Add tool call message to chat
    const argsPreview = JSON.stringify(functionArgs).length > 50
      ? JSON.stringify(functionArgs).substring(0, 47) + "..."
      : JSON.stringify(functionArgs);
    await this.addToolMessage(`🔧 Calling **${functionName}**(${argsPreview})`);

    try {
      // Execute the function
      const result = await this.callFunction(functionName, functionArgs);

      // Add result message to chat (short version)
      const resultPreview = result.success
        ? "✅ Success"
        : result.error
          ? `❌ Error: ${result.error}`
          : JSON.stringify(result).length > 60
            ? JSON.stringify(result).substring(0, 57) + "..."
            : JSON.stringify(result);
      await this.addToolMessage(`↩️ Result: ${resultPreview}`);

      // Send the result back to the realtime API
      const functionOutput = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(result)
        }
      };

      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        this.dataChannel.send(JSON.stringify(functionOutput));
        console.log("Function result sent to API:", result);

        // Trigger a response generation
        const responseCreate = {
          type: "response.create"
        };
        this.dataChannel.send(JSON.stringify(responseCreate));
      }
    } catch (error) {
      console.error("Function call error:", error);
      lively.notify("Function Error", error.message);

      // Add error message to chat
      await this.addToolMessage(`❌ Error: ${error.message}`);

      // Send error back to API
      const errorOutput = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify({ success: false, error: error.message })
        }
      };

      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        this.dataChannel.send(JSON.stringify(errorOutput));

        // Still trigger a response so the model can explain the error
        const responseCreate = {
          type: "response.create"
        };
        this.dataChannel.send(JSON.stringify(responseCreate));
      }
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
