import OpenAI from "src/client/openai.js"
import Morph from 'src/components/widgets/lively-morph.js'
import {Tools, getFunctionDefinitions as getToolDefinitions, executeTool} from "./openai-audio-chat-tools.js"
/*MD # OpenAI Realtime Chat - Pure WebRTC Streaming
MD*/

export default class OpenaiRealtimeChat extends Morph {

  get responses() { return this.get("#responses")}
  get resetButton() { return this.get("#resetButton")}
  get stopButton() { return this.get("#stopButton")}
  get voiceBox() { return this.get("#voiceBox")}
  get modelBox() { return this.get("#modelBox")}
  get textInput() { return this.get("#textInput")}

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

  set isStopped(stopped) {
    this.classList.toggle("stopped", stopped);
  }

  get isStopped() {
    return this.classList.contains("stopped")
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
    this.windowTitle = "OpenAI Realtime Chat";

    // Realtime WebRTC properties
    this.peerConnection = null;
    this.dataChannel = null;
    this.isStreamingActive = false;
    this.ephemeralToken = null;

    // Local function calling
    this.initializeFunctionRegistry();

    // Listen for window close events
    this.addEventListener('close', () => this.onWindowClose());

    // Restore conversation from saved attribute
    if (!this.conversation) {
      try {
        const saved = this.getAttribute("data-conversation")
        this.conversation = saved ? JSON.parse(saved) : []
      } catch (error) {
        console.error("Failed to restore conversation:", error)
        this.conversation = []
      }
    }

    // Setup voice selection
    this.voiceBox.setOptions(["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "cedar", "marin"]);
    this.voiceBox.value = lively.preferences.get("openai-realtime-chat-voice") || "marin";
    this.voiceBox.addEventListener("change", async () => {
      lively.preferences.set("openai-realtime-chat-voice", this.voiceBox.value);
      this.realtimeVoice = this.voiceBox.value;
      await this.reconnectWithNewVoice();
    });
    this.realtimeVoice = this.voiceBox.value;

    // Setup model selection
    this.modelBox.setOptions(["gpt-realtime", "gpt-realtime-mini"]);
    this.modelBox.value = lively.preferences.get("openai-realtime-chat-model") || "gpt-realtime";
    this.modelBox.addEventListener("change", () => {
      lively.preferences.set("openai-realtime-chat-model", this.modelBox.value);
      lively.notify("Model changed", "Reconnect to apply changes");
    });

    this.setupUI()
    await this.renderConversation()
    lively.ensureID(this)

    // Don't auto-connect - wait for user to click "Start"
    this.isStopped = true
    this.stopButton.textContent = "▶️ Start"
  }
  
  connectedCallback() {
    // No global keyboard shortcuts needed for pure realtime mode
  }
  
  disconnectedCallback() {
    lively.notify("close realtime chat")
    lively.removeEventListener(lively.ensureID(this), document.documentElement)

    // Disconnect real-time streaming when component is removed
    this.cleanupStreaming();
  }

  onWindowClose() {
    console.log("Window closing, cleaning up streaming");
    this.cleanupStreaming();
  }

  cleanupStreaming() {
    if (this.isStreamingActive) {
      console.log("Cleaning up real-time streaming connection");
      this.isConnecting = false; // Allow cleanup to proceed
      this.disconnectRealtimeWebRTC();
    }
  }
  
  resetConversation() {
    this.conversation = [{
      role: 'system',
      content: 'Play the role of an AI that speaks out loud with the user. He also speaks to you. what you get in text he spoke.'
    }]
    this.responses.innerHTML = ''
  }

  async toggleStop() {
    // Handle initial "Start" state - no connection yet
    if (!this.peerConnection) {
      this.stopButton.textContent = "⏹️ Stop"
      this.isStopped = false
      await this.connectRealtimeWebRTC()
      return
    }

    // Handle Stop/Resume toggle for existing connection
    if (this.isStopped) {
      this.resumeConversation();
    } else {
      this.stopConversation();
    }
  }

  stopConversation() {
    // Cancel any ongoing response by sending a response.cancel event
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const cancelMessage = {
        type: "response.cancel"
      };
      this.dataChannel.send(JSON.stringify(cancelMessage));
      console.log("Sent response.cancel to stop current conversation");
    }

    // Stop microphone (local stream)
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = false; // Mute microphone
      });
      console.log("Disabled microphone");
    }

    // Stop remote audio playback by disabling the audio tracks
    if (this.remoteAudio && this.remoteAudio.srcObject) {
      const tracks = this.remoteAudio.srcObject.getAudioTracks();
      tracks.forEach(track => {
        track.enabled = false; // Mute the track immediately
      });
      console.log("Disabled audio tracks");
    }

    // Clear live message tracking if there's an ongoing assistant message
    if (this.currentLiveMarkdown) {
      this.currentLiveMarkdown = null;
      this.currentLiveMessageElement = null;
    }

    if (this.currentLiveUserMarkdown) {
      this.currentLiveUserMarkdown = null;
      this.currentLiveUserMessageElement = null;
    }

    this.currentAssistantTranscript = "";
    this.isListening = false; // Clear listening state
    this.isStopped = true;

    // Update button text
    this.stopButton.textContent = "▶️ Resume";

    lively.notify("Audio stopped");
  }

  resumeConversation() {
    // Re-enable microphone (local stream)
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.enabled = true;
          console.log("Re-enabled microphone");
        }
      });
    }

    // Re-enable remote audio tracks
    if (this.remoteAudio && this.remoteAudio.srcObject) {
      const tracks = this.remoteAudio.srcObject.getAudioTracks();
      console.log("Resuming audio, found tracks:", tracks.length);
      tracks.forEach(track => {
        console.log("Track readyState:", track.readyState, "currently enabled:", track.enabled);
        if (track.readyState === 'live') {
          track.enabled = true;
          console.log("Re-enabled audio track");
        }
      });
    } else {
      console.warn("Cannot resume: no remoteAudio or srcObject", {
        hasRemoteAudio: !!this.remoteAudio,
        hasSrcObject: this.remoteAudio?.srcObject
      });
    }

    this.isStopped = false;

    // Update button text
    this.stopButton.textContent = "⏹️ Stop";

    lively.notify("Audio resumed");
  }

  async setupUI() {
    this.resetButton.addEventListener("mousedown", () => {
      this.resetConversation();
      // Also resume audio when resetting
      if (this.isStopped) {
        this.resumeConversation();
      }
    })

    this.stopButton.addEventListener("click", () =>
      this.toggleStop()
    )

    this.textInput.addEventListener("keydown", evt => {
      if (evt.key == "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        this.chatFromInput()
      }
    })
  }

  async chatFromInput() {
    const userText = this.textInput.value.trim();
    if (!userText) return;

    this.textInput.value = "";
    await this.addMessage("user", userText)

    // Send text message to realtime API via data channel
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const textMessage = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{
            type: "input_text",
            text: userText
          }]
        }
      };
      this.dataChannel.send(JSON.stringify(textMessage));

      // Trigger response
      const responseCreate = {
        type: "response.create"
      };
      this.dataChannel.send(JSON.stringify(responseCreate));
    }
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

  async renderConversation() {
    for (let ea of this.conversation) {
      await this.renderMessage(ea)
    }
  }

  livelyMigrate(other) {
    this.conversation = other.conversation
    this.realtimeVoice = other.realtimeVoice
    if (this.voiceBox && other.voiceBox) {
      this.voiceBox.value = other.voiceBox.value
    }
    if (this.modelBox && other.modelBox) {
      this.modelBox.value = other.modelBox.value
    }
  }

  livelyPrepareSave() {
    // Save conversation history to attribute for persistence
    this.setAttribute("data-conversation", JSON.stringify(this.conversation))
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
        model: this.modelBox.value || "gpt-4o-realtime-preview",
        voice: this.realtimeVoice || "shimmer",
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
        voice: this.realtimeVoice || "shimmer",
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

  async reconnectWithNewVoice() {
    lively.notify("Reconnecting...", `Switching to ${this.realtimeVoice}`);

    // Disconnect current session
    this.disconnectRealtimeWebRTC();

    // Wait a moment for cleanup
    await lively.sleep(500);

    // Reconnect with new voice (conversation history is preserved in this.conversation)
    await this.connectRealtimeWebRTC();

    lively.success("Voice changed", `Now using ${this.realtimeVoice}`);
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
}
