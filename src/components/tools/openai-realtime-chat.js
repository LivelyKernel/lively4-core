import OpenAI from "src/client/openai.js";
import LivelyChat from 'src/components/tools/lively-chat.js';
import { BasicToolset } from "./openai-realtime-chat-tools.js";
import Dexie from "src/external/dexie3.js";
import { uuid as generateUuid } from 'utils';
import ContextMenu from 'src/client/contextmenu.js';
/*MD # OpenAI Realtime Chat - Pure WebRTC Streaming
MD*/

export default class OpenaiRealtimeChat extends LivelyChat {
  /*MD ## Getters and Setters MD*/

  get messagesContainer() {
    return this.get("#messagesContainer");
  }

  // Backward compatibility alias
  get responses() {
    return this.messagesContainer;
  }

  get resetButton() {
    return this.get("#resetButton");
  }

  get stopButton() {
    return this.get("#stopButton");
  }

  get voiceBox() {
    return this.get("#voiceBox");
  }

  get modelBox() {
    return this.get("#modelBox");
  }

  get textInput() {
    return this.get("#textInput");
  }
  
  get conversationsButton() {
    return this.get("#conversationsButton");
  }

  
  get conversationsModal() {
    return this.get("#conversationsModal");
  }

  get conversationsList() {
    return this.get("#conversationsList");
  }

  get statusBar() {
    return this.get("#statusBar");
  }

  set isListening(listening) {
    this.classList.toggle("listening", listening);
  }

  get isListening() {
    return this.classList.contains("listening");
  }

  set isMuted(muted) {
    this.classList.toggle("muted", muted);
  }

  get isMuted() {
    return this.classList.contains("muted");
  }

  set isStopped(stopped) {
    this.classList.toggle("stopped", stopped);
  }

  get isStopped() {
    return this.classList.contains("stopped");
  }

  set showDebugAnnotations(show) {
    if (show) {
      this.setAttribute("show-debug-annotations", "");
    } else {
      this.removeAttribute("show-debug-annotations");
    }
  }

  get showDebugAnnotations() {
    return this.hasAttribute("show-debug-annotations");
  }

  set showToolCalls(show) {
    if (show) {
      this.setAttribute("show-tool-calls", "");
    } else {
      this.removeAttribute("show-tool-calls");
    }
    // Persist preference
    lively.preferences.set("openai-realtime-chat-show-tool-calls", show);
  }

  get showToolCalls() {
    return this.hasAttribute("show-tool-calls");
  }

  // Override base class method to update message debug state
  updateMessagesDebugState() {
    if (this.responses) {
      Array.from(this.responses.querySelectorAll("lively-chat-message")).forEach(ea => {
        ea.showDebug = this.showDebug;
      });
    }
  }

  isDataChannelOpen() {
    return this.dataChannel && this.dataChannel.readyState === 'open';
  }

  /*MD ## Helper Methods MD*/

  updateStatus(state, message) {
    if (!this.statusBar) return;

    // Clear all state classes
    this.statusBar.classList.remove('connecting', 'ready', 'listening');

    if (state === 'hidden') {
      this.statusBar.textContent = '';
      return;
    }

    // Set new state
    this.statusBar.classList.add(state);
    this.statusBar.textContent = message;
  }

  sendDataChannelMessage(payload, {
    warnOnClosed = true
  } = {}) {
    if (!this.isDataChannelOpen()) {
      return false;
    }
    try {
      this.dataChannel.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error("Failed to send payload over data channel:", error, payload);
      return false;
    }
  }

  requestAssistantResponse() {
    this.sendDataChannelMessage({
      type: "response.create"
    }, {
      warnOnClosed: false
    });
  }

  cancelAssistantResponse() {
    if (this.sendDataChannelMessage({
      type: "response.cancel"
    }, {
      warnOnClosed: false
    })) {
      this.log("Sent response.cancel to stop current conversation");
    }
  }

  // Wrapper for base class scrollToBottom method for backwards compatibility
  scrollResponsesSoon(delay = 100) {
    this.scrollToBottom(this.responses, true, delay);
  }

  createDebugHeader(metaInfo) {
    const debugHeader = document.createElement('div');
    debugHeader.className = 'debug-header';
    debugHeader.style.fontSize = '9px';
    debugHeader.style.opacity = '0.6';
    debugHeader.style.marginBottom = '4px';
    debugHeader.style.fontFamily = 'monospace';
    debugHeader.style.borderBottom = '1px solid rgba(128,128,128,0.2)';
    debugHeader.style.paddingBottom = '2px';
    debugHeader.textContent = metaInfo.join(' | ');
    return debugHeader;
  }

  static get conversationdb() {
    var db = new Dexie("openai-realtime-conversations");
    db.version(1).stores({
      conversations: 'id, timestamp, lastMessageTime',
      messages: '++id, conversationId, timestamp, type, role'
    }).upgrade(function () {});
    return db;
  }

  /*MD ## Setup MD*/
  
  // #important
  async initialize() {
    // Call parent initialize to setup event capture system
    await super.initialize();
    this.registerButtons()
    
    this.windowTitle = "OpenAI Realtime Chat";

    // Initialize debug log visibility (controlled by showDebug property)
    this.setAttribute("hide-debug-log", this.showDebug ? "false" : "true");

    // Realtime WebRTC properties
    this.peerConnection = null;
    this.dataChannel = null;
    this.isStreamingActive = false;
    this.ephemeralToken = null;

    // Message sequencing for debug
    this.messageSequence = this.messageSequence || 0;

    // Track saved response items by OpenAI item_id to prevent duplicates
    this.savedResponseItems = this.savedResponseItems || new Set();

    // Track message widgets by OpenAI item_id for updates
    this.messageWidgets = this.messageWidgets || new Map();

    // Track accumulated transcripts for assistant streaming messages
    this.accumulatedTranscripts = this.accumulatedTranscripts || new Map();

    // Agent status tracking (for coordination with coding agent)
    this.agentStatus = this.agentStatus || 'idle';
    this.lastAgentUpdate = this.lastAgentUpdate || null;
    this.agentEventHistory = this.agentEventHistory || [];
    this.waitingForAgentReply = this.waitingForAgentReply || false;
    this.pendingTask = this.pendingTask || null;
    this.pendingRequestId = this.pendingRequestId || null;

    // External configuration (can be set by container)
    this.customInstructions = this.customInstructions || null;
    this.availableTools = this.availableTools || null; // null = all tools

    // Initialize toolset (basic tools for pure audio chat)
    this.toolset = this.toolset || new BasicToolset();

    // Context menu handler using base class
    this.addEventListener('contextmenu', evt => this.createBaseContextMenu(evt), false);

    // Load preferences
    this.showToolCalls = lively.preferences.get("openai-realtime-chat-show-tool-calls") !== false; // Default to true

    await this.ensureConversation();
    await this.setupVoiceSelection();

    await this.setupModelSelecton()
    this.setupUI();
    await this.renderConversation();
    lively.ensureID(this);

    // Don't auto-connect - wait for user to click "Start"
    this.isStopped = true;
    this.stopButton.textContent = "▶️ Start";
  }
  
  setupModelSelecton() {
    this.modelBox.setOptions(["gpt-realtime", "gpt-realtime-mini"]);
    this.modelBox.value = lively.preferences.get("openai-realtime-chat-model") || "gpt-realtime";
    this.modelBox.addEventListener("change", () => {
      lively.preferences.set("openai-realtime-chat-model", this.modelBox.value);
      lively.notify("Model changed", "Reconnect to apply changes");
    });
  }
  
  async ensureConversation() {
    if (!this.conversation) {
      try {
        // Try to load the most recent conversation
        const conversations = await OpenaiRealtimeChat.conversationdb.conversations.orderBy('lastMessageTime').reverse().limit(1).toArray();
        if (conversations.length > 0) {
          // Load existing conversation
          const convId = conversations[0].id;
          const messages = await OpenaiRealtimeChat.conversationdb.messages.where('conversationId').equals(convId).sortBy('timestamp');
          this.currentConversationId = convId;
          this.conversation = messages.map(m => ({
            role: m.role,
            content: m.content,
            type: m.type,
            metadata: m.metadata,
            timestamp: m.timestamp,
            sequence: m.sequence
          }));

          // Update sequence counter based on loaded messages
          const maxSequence = Math.max(0, ...messages.map(m => m.sequence || 0));
          this.messageSequence = maxSequence + 1;
        } else {
          // Create new conversation if none exist
          await this.createNewConversation();
        }
      } catch (error) {
        console.error("Failed to load conversation from DB:", error);
        // Fallback to empty conversation
        await this.createNewConversation();
      }
    }
  }

  /**
   * Programmatically switch to a specific conversation
   * Used by workspace to coordinate sessions
   */
  async setConversation(conversationId) {
    return this.loadConversation(conversationId)
  }

  async setupVoiceSelection() {
    // Setup voice selection
    this.voiceBox.setOptions(["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "cedar", "marin"]);
    this.voiceBox.value = lively.preferences.get("openai-realtime-chat-voice") || "marin";
    this.voiceBox.addEventListener("change", async () => {
      lively.preferences.set("openai-realtime-chat-voice", this.voiceBox.value);
      this.realtimeVoice = this.voiceBox.value;
      await this.reconnectWithNewVoice();
    });
    this.realtimeVoice = this.voiceBox.value;
  }
  
  /*MD ## WebRTC Lifecycle MD*/
  cleanupStreaming() {
    if (this.isStreamingActive) {
      this.log("Cleaning up real-time streaming connection");
      this.isConnecting = false; // Allow cleanup to proceed
      this.disconnectRealtimeWebRTC();
    }
  }

  async toggleStop() {
    // Handle initial "Start" state - no connection yet
    if (!this.peerConnection) {
      this.stopButton.textContent = "⏹️ Stop";
      this.isStopped = false;
      await this.connectRealtimeWebRTC();
      return;
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
    this.cancelAssistantResponse();

    // Stop microphone (local stream)
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = false; // Mute microphone
      });

      this.log("Disabled microphone");
    }

    // Stop remote audio playback by disabling the audio tracks
    if (this.remoteAudio && this.remoteAudio.srcObject) {
      const tracks = this.remoteAudio.srcObject.getAudioTracks();
      tracks.forEach(track => {
        track.enabled = false; // Mute the track immediately
      });

      this.log("Disabled audio tracks");
    }

    // Clear listening state
    this.isListening = false;
    this.isStopped = true;

    // Hide status bar when stopped
    this.updateStatus('hidden', '');

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
          this.log("Re-enabled microphone");
        }
      });
    }

    // Re-enable remote audio tracks
    if (this.remoteAudio && this.remoteAudio.srcObject) {
      const tracks = this.remoteAudio.srcObject.getAudioTracks();
      this.log("Resuming audio, found tracks:", tracks.length);
      tracks.forEach(track => {
        this.log("Track readyState:", track.readyState, "currently enabled:", track.enabled);
        if (track.readyState === 'live') {
          track.enabled = true;
          this.log("Re-enabled audio track");
        }
      });
    } else {
      console.warn("Cannot resume: no remoteAudio or srcObject", {
        hasRemoteAudio: !!this.remoteAudio,
        hasSrcObject: this.remoteAudio?.srcObject
      });
    }
    this.isStopped = false;

    // Show ready status when resumed
    this.updateStatus('ready', '✅ Ready to listen - you can speak now');

    // Update button text
    this.stopButton.textContent = "⏹️ Stop";
    lively.notify("Audio resumed");
  }

  onStopButton() {
    this.toggleStop()
  }
  onResetButton(evt) {
    this.createNewConversation();
    this.clearDebugLog()
  }
  
  onConversationsButton(evt) {
    this.toggleConversationsModal();
  }

  async setupUI() {
    this.textInput.addEventListener("keydown", evt => {
      if (evt.key == "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        this.chatFromInput();
      }
    });

    // Close modal when clicking outside
    document.addEventListener("click", evt => {
      if (!this.conversationsModal.contains(evt.target) && evt.target !== this.conversationsButton) {
        this.conversationsModal.classList.remove("visible");
      }
    });
  }

  /*MD ## Conversation UI MD*/
  async toggleConversationsModal() {
    const isVisible = this.conversationsModal.classList.contains("visible");
    if (isVisible) {
      this.conversationsModal.classList.remove("visible");
    } else {
      await this.renderConversationsList();
      this.conversationsModal.classList.add("visible");
    }
  }

  async renderConversationsList() {
    const conversations = await this.getConversationList();
    this.conversationsList.innerHTML = '';
    if (conversations.length === 0) {
      this.conversationsList.innerHTML = '<li style="padding: 16px; text-align: center; color: #666;">No conversations yet</li>';
      return;
    }

    for (const conv of conversations) {
      const item = document.createElement('li');
      item.className = 'conversation-item';
      if (conv.id === this.currentConversationId) {
        item.classList.add('active');
      }
      const timestamp = new Date(conv.lastMessageTime).toLocaleString();
      item.innerHTML = `
        <div class="conversation-info">
          <div class="conversation-timestamp">${timestamp}</div>
          <div class="conversation-meta">${conv.messageCount} messages</div>
        </div>
        <button class="delete-conversation" data-id="${conv.id}">Delete</button>
      `;

      // Load conversation on click (but not on delete button)
      item.addEventListener('click', async evt => {
        if (!evt.target.classList.contains('delete-conversation')) {
          await this.loadConversation(conv.id);
          this.conversationsModal.classList.remove("visible");
        }
      });

      // Delete button handler
      const deleteBtn = item.querySelector('.delete-conversation');
      deleteBtn.addEventListener('click', async evt => {
        evt.stopPropagation();
        if (await lively.confirm('Delete this conversation?')) {
          // Store whether we're deleting the current conversation
          const isDeletingCurrent = conv.id === this.currentConversationId;

          // If deleting current conversation, find next conversation to load
          let nextConversationId = null;
          if (isDeletingCurrent) {
            const currentIndex = conversations.findIndex(c => c.id === conv.id);
            // Try to load the next conversation in the list
            if (currentIndex + 1 < conversations.length) {
              nextConversationId = conversations[currentIndex + 1].id;
            }
            // Otherwise try the previous one
            else if (currentIndex - 1 >= 0) {
              nextConversationId = conversations[currentIndex - 1].id;
            }
          }

          // Delete the conversation
          await this.deleteConversation(conv.id);

          // Load next conversation or create new one if list is now empty
          if (isDeletingCurrent) {
            if (nextConversationId) {
              await this.loadConversation(nextConversationId);
            } else {
              // No other conversations exist, create new one
              await this.createNewConversation();
            }
          }
          await this.renderConversationsList();
        }
      });
      this.conversationsList.appendChild(item);
    }
  }

  async chatFromInput() {
    const userText = this.textInput.value.trim();
    if (!userText) return;
    this.textInput.value = "";
    await this.addMessage("user", userText);

    // If not connected, connect in paused mode (no audio)
    if (!this.peerConnection) {
      lively.notify("Connecting...", "Starting text-only chat");
      await this.connectRealtimeWebRTC();
      // Immediately pause to disable audio
      this.stopConversation();
    }

    // Wait for data channel to be ready
    let attempts = 0;
    while (!this.isDataChannelOpen() && attempts < 50) {
      await lively.sleep(100);
      attempts++;
    }

    if (!this.isDataChannelOpen()) {
      lively.notify("Connection failed", "Could not send message");
      return;
    }

    // Send text message to realtime API via data channel
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
    if (this.sendDataChannelMessage(textMessage)) {
      this.requestAssistantResponse();
    }
  }

  /*MD ## Conversation Messages MD*/
  // #important
  async addMessage(role, text, metadata = {}) {
    const myMessage = {
      role,
      "content": text,
      sequence: this.messageSequence++,
      metadata: metadata,
      type: metadata.type || 'tool',
      timestamp: Date.now()
    };
    this.conversation.push(myMessage);
    
    this.log(`[realtime] addMessage: ${role} (seq ${myMessage.sequence})`);
    this.dispatchMessageEvent('realtime:add-message', myMessage);
    await this.renderMessage(myMessage);
    await this.saveMessageToDb(myMessage);
  }

  // #important
  async renderMessage(message) {
    if (!this.messagesUI) return; 

    this.log(`[realtime] renderMessage: ${message.role} (seq ${message.sequence})`);
    const chatMessage = await <lively-chat-message></lively-chat-message>;
    await chatMessage.setMessage(message);
    this.responses.appendChild(chatMessage);
    this.scrollResponsesSoon();
    return chatMessage
  }

  /*MD ## Live Updates MD*/

  /**
   * Create a new message - handles state, events, and optional UI rendering
   * @param {string} item_id - OpenAI item_id for tracking
   * @param {string} role - 'user' or 'assistant'
   * @returns {Object} message data structure
   */
  async createMessage(item_id, role) {
    // Create message data structure
    const messageData = {
      role: role,
      content: role === 'user' ? '_Listening..._' : '',
      source: 'audio',
      streamType: 'realtime',
      sequence: this.messageSequence,
      timestamp: Date.now(),
      item_id: item_id
    };

    // Always dispatch event for workspace integration
    const eventName = role === 'user' ? 'realtime:create-live-user-message' : 'realtime:create-live-assistant-message';
    this.dispatchMessageEvent(eventName, messageData);

    // Optionally render UI widget
    if (this.messagesUI !== false) {
      const widget = await this.renderMessage(messageData);
      this.messageWidgets.set(item_id, widget);
      this.log(`[item_id] Created widget for ${item_id} (${role})`);
    }

    return messageData;
  }

  /**
   * Update an existing message - handles events and optional UI updates
   * @param {string} item_id - OpenAI item_id for tracking
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - Updated content
   */
  async updateMessage(item_id, role, content) {
    // Create update message data
    const widget = this.messageWidgets.get(item_id);
    const messageData = {
      role: role,
      content: content,
      source: 'audio',
      streamType: 'realtime',
      sequence: widget?.message?.sequence || this.messageSequence,
      timestamp: Date.now(),
      item_id: item_id  // Include item_id for workspace lookup
    };

    // Always dispatch event for workspace integration
    const eventName = role === 'user' ? 'realtime:update-live-user-message' : 'realtime:update-live-assistant-message';
    this.dispatchMessageEvent(eventName, messageData);

    // Optionally update UI widget if it exists
    if (widget) {
      await widget.setMessage(messageData);
      this.scrollResponsesSoon(10);
      this.log(`[item_id] Updated ${role} widget ${item_id}`);
    } else {
      this.log(`[item_id] WARN: No widget found for ${item_id}, but event dispatched`);
    }

    return messageData;
  }

  async renderConversation() {
    this.log(`[realtime] renderConversation: full redisplay (${this.conversation.length} messages)`);
    for (let ea of this.conversation) {
      await this.renderMessage(ea);
    }
  }
  /*MD ## Conversation Persistence MD*/
  // #important
  async saveMessageToDb(message) {
    if (!this.currentConversationId) {
      console.warn("No conversation ID, skipping message save");
      return;
    }
    try {
      await OpenaiRealtimeChat.conversationdb.messages.add({
        conversationId: this.currentConversationId,
        timestamp: message.timestamp || Date.now(), // Use message creation time, not save time
        type: message.type || "message",
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        sequence: message.sequence
      });

      // Update last message time in conversation
      await OpenaiRealtimeChat.conversationdb.conversations.update(this.currentConversationId, {
        lastMessageTime: Date.now()
      });

      // Dispatch event for workspace integration
      this.dispatchEvent(new CustomEvent('realtime:message-saved', {
        detail: {
          conversationId: this.currentConversationId,
          message: {
            role: message.role,
            content: message.content,
            type: message.type || "message",
            metadata: message.metadata || {},
            sequence: message.sequence,
            timestamp: message.timestamp || Date.now()
          }
        },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error("Failed to save message to DB:", error);
    }
  }

  async createNewConversation() {
    this.clearEventCapture();
    const conversationId = generateUuid();
    try {
      await OpenaiRealtimeChat.conversationdb.conversations.add({
        id: conversationId,
        timestamp: Date.now(),
        lastMessageTime: Date.now()
      });
      this.currentConversationId = conversationId;
      this.conversation = [];
      this.responses.innerHTML = '';
      this.messageSequence = 0; // Reset sequence counter for new conversation

      // Disconnect if currently connected - user can press Start to begin new conversation
      if (this.peerConnection && this.isStreamingActive) {
        this.log("Disconnecting current session - press Start to begin new conversation");
        this.disconnectRealtimeWebRTC();
        this.isStopped = true;
        this.stopButton.textContent = "▶️ Start";
      }

      lively.notify("New conversation", "Started new conversation");
      return conversationId;
    } catch (error) {
      console.error("Failed to create new conversation:", error);
      throw error;
    }
  }

  async loadConversation(conversationId) {
    try {
      const conv = await OpenaiRealtimeChat.conversationdb.conversations.get(conversationId);
      if (!conv) {
        console.error("Conversation not found:", conversationId);
        return;
      }
      const messages = await OpenaiRealtimeChat.conversationdb.messages.where('conversationId').equals(conversationId).sortBy('timestamp');

      this.conversation = messages.map(m => ({
        role: m.role,
        content: m.content,
        type: m.type,
        metadata: m.metadata,
        timestamp: m.timestamp,
        sequence: m.sequence
      }));

      const maxSequence = Math.max(0, ...messages.map(m => m.sequence || 0));
      this.messageSequence = maxSequence + 1;

      this.currentConversationId = conversationId;

      // Clear event capture buffer when switching conversations
      this.clearEventCapture();

      this.responses.innerHTML = '';
      await this.renderConversation();

      // Disconnect if currently connected - user can press Start to reconnect with this conversation
      if (this.peerConnection && this.isStreamingActive) {
        this.log("Disconnecting current session - press Start to continue with loaded conversation");
        this.disconnectRealtimeWebRTC();
        this.isStopped = true;
        this.stopButton.textContent = "▶️ Start";
      }

      lively.notify("Loaded", `Conversation with ${messages.length} messages`);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }

  async getConversationList() {
    try {
      const conversations = await OpenaiRealtimeChat.conversationdb.conversations.orderBy('lastMessageTime').reverse().toArray();

      // Get message counts for each conversation
      const conversationsWithCounts = await Promise.all(conversations.map(async conv => {
        const count = await OpenaiRealtimeChat.conversationdb.messages.where('conversationId').equals(conv.id).count();
        return {
          ...conv,
          messageCount: count
        };
      }));
      return conversationsWithCounts;
    } catch (error) {
      console.error("Failed to get conversation list:", error);
      return [];
    }
  }

  async deleteConversation(conversationId) {
    try {
      // Delete all messages
      await OpenaiRealtimeChat.conversationdb.messages.where('conversationId').equals(conversationId).delete();

      // Delete conversation
      await OpenaiRealtimeChat.conversationdb.conversations.delete(conversationId);
      lively.notify("Deleted", "Conversation deleted");
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  }

  
    /*MD ## OpenAI Realtime API MD*/
  
  // WebRTC Realtime API Implementation
  // #important
  async generateEphemeralToken() {
    const apiKey = await OpenAI.ensureSubscriptionKey();
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.modelBox.value || "gpt-4o-realtime-preview",
        voice: this.realtimeVoice || "shimmer",
        tools: this.getFunctionDefinitions()
      })
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
    this.log("Ephemeral token response:", data);
    return data.client_secret.value;
  }

  // #important
  async connectRealtimeWebRTC() {
    this.log("Connecting to OpenAI Realtime API via WebRTC...");

    // Clear any existing connection first
    if (this.peerConnection) {
      this.log("Cleaning up existing connection before reconnecting");
      this.disconnectRealtimeWebRTC();
    }

    // Show connecting status
    this.updateStatus('connecting', '⏳ Connecting... please wait');

    // Step 1: Generate ephemeral token
    this.ephemeralToken = await this.generateEphemeralToken();
    this.log("Ephemeral token generated");

    // Step 2: Create RTCPeerConnection
    this.peerConnection = new RTCPeerConnection();
    this.isConnecting = true; // Flag to prevent premature cleanup

    // Step 3: Set up audio track from microphone
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
    stream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, stream);
    });
    this.localStream = stream;

    // Step 4: Set up data channel for messages
    this.dataChannel = this.peerConnection.createDataChannel('oai-events');
    this.setupDataChannel();

    // Step 5: Handle incoming audio tracks
    this.peerConnection.ontrack = event => {
      this.log("Received remote audio track");
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
        'Content-Type': 'application/sdp'
      },
      body: offer.sdp
    });
    if (!answerResponse.ok) {
      this.log(`Failed to connect: ${answerResponse.statusText}`);
    }
    const answerSDP = await answerResponse.text();

    // Check if peer connection still exists (might have been disconnected)
    if (!this.peerConnection) {
      throw new Error("Peer connection was closed during setup");
    }
    await this.peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: answerSDP
    });
    this.log("WebRTC connection established");
    this.isStreamingActive = true;
    this.isConnecting = false;
  }

  // #important
  setupDataChannel() {
    this.dataChannel.onopen = () => {
      this.log("Data channel opened");
      this.updateStatus('ready', '✅ Ready to listen - you can speak now');
      this.sendSessionConfig();
      // Send conversation history after session config
      this.sendConversationHistory();
    };
    this.dataChannel.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        this.handleRealtimeMessage(message);
      } catch (error) {
        console.error("Error parsing data channel message:", error);
      }
    };
    this.dataChannel.onerror = error => {
      console.error("Data channel error:", error);
      lively.notify("Connection issue", "Real-time audio connection error");
    };
    this.dataChannel.onclose = () => {
      this.log("Data channel closed");
      this.isStreamingActive = false;
    };
  }

  sendSessionConfig() {
    // Use custom instructions if set, otherwise default instructions
    const instructions = this.customInstructions ||
      "You are a helpful AI assistant in a JavaScript, HTML, CSS Web-based development environment. Respond in a conversational, natural way. You have access to several functions that you can call to help the user.";

    const sessionConfig = {
      type: "session.update",
      session: {
        instructions: instructions,
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
    this.sendDataChannelMessage(sessionConfig, {
      warnOnClosed: false
    });
  }

  sendConversationHistory() {
    if (!this.isDataChannelOpen()) {
      console.warn("Cannot send conversation history: data channel not ready");
      return;
    }

    if (!this.conversation || this.conversation.length === 0) {
      this.log("No conversation history to send");
      return;
    }

    // Include user, assistant, AND tool messages for full context
    const messagesToSend = this.conversation.filter(msg =>
      msg.role === 'user' || msg.role === 'assistant' || msg.role === 'tool'
    );
    if (messagesToSend.length === 0) {
      this.log("No messages in history");
      return;
    }
    this.log(`Sending ${messagesToSend.length} historical messages (including tool calls) to API`);

    // Send each message as a conversation item
    for (const msg of messagesToSend) {
      if (msg.role === 'tool') {
        // Handle tool messages based on their type
        if (msg.type === 'function_call' || msg.metadata?.type === 'function_call') {
          // Function call - send as function_call item
          const item = {
            type: "conversation.item.create",
            item: {
              type: "function_call",
              name: msg.metadata.functionName,
              call_id: msg.metadata.call_id,
              arguments: JSON.stringify(msg.metadata.arguments)
            }
          };
          this.sendDataChannelMessage(item, { warnOnClosed: false });
        } else if (msg.type === 'function_call_output' || msg.metadata?.type === 'function_call_output') {
          // Function call output - send as function_call_output item
          const item = {
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: msg.metadata.call_id,
              output: JSON.stringify(msg.metadata.output)
            }
          };
          this.sendDataChannelMessage(item, { warnOnClosed: false });
        }
      } else {
        // User or assistant message
        const item = {
          type: "conversation.item.create",
          item: {
            type: "message",
            role: msg.role,
            content: [{
              type: "input_text",
              text: msg.content
            }]
          }
        };
        this.sendDataChannelMessage(item, { warnOnClosed: false });
      }
    }
    lively.notify("History Loaded", `${messagesToSend.length} messages sent to context`);
  }

  async reconnectWithNewVoice() {
    lively.notify("Reconnecting...", `Switching to ${this.realtimeVoice}`);

    // Disconnect current session
    this.disconnectRealtimeWebRTC()
    await lively.sleep(500);

    // Reconnect with new voice (conversation history is preserved in this.conversation)
    await this.connectRealtimeWebRTC();
    lively.success("Voice changed", `Now using ${this.realtimeVoice}`);
  }

  // #important
  disconnectRealtimeWebRTC() {
    // Don't disconnect if we're still connecting
    if (this.isConnecting) {
      this.log("Connection in progress, skipping disconnect");
      return;
    }
    this.log("Disconnecting WebRTC...");
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

    // Hide status bar when disconnected
    this.updateStatus('hidden', '');
  }

  /*MD ## Event Handlers MD*/
  // #important
  async handleRealtimeMessage(message) {
    // Capture event for replay (skip audio data)
    if (!this._replayMode && message.type && !message.type.includes('audio.delta')) {
      this.captureEvent('realtime', message, this.currentConversationId);
    }
    
    switch (message.type) {
      case "session.created":
        this.log("Session created:", message);
        if (message.session && message.session.tools) {
          this.log("✓ Functions registered in session:", message.session.tools);
          lively.notify("Functions Ready", `${message.session.tools.length} functions available`);
        }
        break;
      case "session.updated":
        this.log("Session updated:", message);
        if (message.session && message.session.tools) {
          this.log("✓ Functions in updated session:", message.session.tools);
        }
        break;
      case "response.function_call_arguments.delta":
        // Function arguments are being streamed
        this.log("Function call arguments delta:", message);
        break;
      case "response.function_call_arguments.done":
        // Function call arguments complete - logged but actual handling in response.done
        this.log("Function call arguments done:", message);
        break;
      case "response.done":
        this.log("Response complete:", message);
        // Check if response contains function calls
        if (message.response && message.response.output) {
          for (const item of message.response.output) {
            if (item.type === "function_call") {
              this.handleFunctionCallFromResponse(item);
            }
          }
        }

        // Cleanup: Keep only last 100 item IDs to prevent memory bloat
        if (this.savedResponseItems.size > 100) {
          const arr = Array.from(this.savedResponseItems);
          this.savedResponseItems = new Set(arr.slice(-100));
          this.log(`[Duplicate Prevention] Cleaned up old item IDs, kept last 100`);
        }
        break;
      case "input_audio_buffer.speech_started":
        this.log("Speech started");
        this.isListening = true;
        this.updateStatus('listening', '🎤 Listening...');
        // Widget will be created when conversation.item.created arrives
        break;
      case "input_audio_buffer.speech_stopped":
        this.log("Speech stopped");
        this.isListening = false;
        this.updateStatus('ready', '✅ Ready to listen - you can speak now');
        break;
      case "conversation.item.created":
        this.log("Item created:", message);

        // Create message when item exists in API
        if (message.item && message.item.id && message.item.type === "message") {
          const item_id = message.item.id;
          const role = message.item.role;

          // Skip if already created
          if (this.messageWidgets.has(item_id)) {
            this.log(`[item_id] Message already exists for ${item_id}`);
            break;
          }

          // Create message (handles event dispatch + optional UI)
          await this.createMessage(item_id, role);
        }
        break;
      case "conversation.item.input_audio_transcription.delta":
        // Incremental transcript update
        if (message.delta && message.item_id) {
          await this.updateMessage(message.item_id, 'user', message.delta);
        }
        break;
      case "conversation.item.input_audio_transcription.completed":
        // User speech was transcribed
        this.log("User transcript:", message.transcript);

        if (message.transcript && message.item_id) {
          const widget = this.messageWidgets.get(message.item_id);
          if (widget) {
            // Update widget with final transcript
            const finalMessage = {
              role: 'user',
              content: message.transcript,
              source: 'audio',
              streamType: 'realtime',
              sequence: widget.message?.sequence || this.messageSequence
            };
            await widget.setMessage(finalMessage);
            this.log(`[item_id] Finalized user widget ${message.item_id}`);

            // Save to conversation history and DB
            const userMessage = {
              role: "user",
              content: message.transcript,
              sequence: this.messageSequence++,
              timestamp: Date.now()
            };
            this.conversation.push(userMessage);
            await this.saveMessageToDb(userMessage);
          } else {
            this.log(`[item_id] WARN: No widget found for completed ${message.item_id}, creating new message`);
            await this.addMessage("user", message.transcript);
          }
        }
        break;
      case "response.audio.delta":
        // Audio chunk received - log structure to see timing info
        // this.log("FULL response.audio.delta:", JSON.stringify({
        //   type: message.type,
        //   response_id: message.response_id,
        //   item_id: message.item_id,
        //   output_index: message.output_index,
        //   content_index: message.content_index,
        //   delta_length: message.delta?.length
        // }, null, 2));
        break;
      case "response.audio_transcript.delta":
        this.log("Transcript delta:", message.delta);

        if (message.delta && message.item_id) {
          // Accumulate transcript
          const currentTranscript = this.accumulatedTranscripts.get(message.item_id) || "";
          const updatedTranscript = currentTranscript + message.delta;
          this.accumulatedTranscripts.set(message.item_id, updatedTranscript);

          // Update message with accumulated content
          await this.updateMessage(message.item_id, 'assistant', updatedTranscript);
        }
        break;
      case "response.audio_transcript.done":
        this.log("Transcript done:", message.transcript);

        // Check if we've already saved this item using OpenAI's item_id
        if (message.item_id && this.savedResponseItems.has(message.item_id)) {
          this.log(`[Duplicate Prevention] Skipping duplicate save for item ${message.item_id}`);
          break;
        }

        if (message.transcript && message.item_id) {
          // Update message with final transcript
          await this.updateMessage(message.item_id, 'assistant', message.transcript);

          // Clean up accumulated transcript
          this.accumulatedTranscripts.delete(message.item_id);

          // Mark as saved
          this.savedResponseItems.add(message.item_id);
          this.log(`[item_id] Finalized assistant message ${message.item_id}`);

          // Save to conversation history and DB
          const assistantMessage = {
            role: "assistant",
            content: message.transcript,
            sequence: this.messageSequence++,
            timestamp: Date.now()
          };
          this.conversation.push(assistantMessage);
          await this.saveMessageToDb(assistantMessage);
        }
        break;
      case "error":
        console.error("Realtime API error:", message);
        console.error("Full error details:", JSON.stringify(message, null, 2));

        // Don't show notifications for errors during replay (they're from the recording)
        if (!this._replayMode) {
          lively.notify("Real-time API issue", message.error?.message || "An error occurred");
        }
        break;
      default:
        // Log all unhandled message types, highlight function/tool events
        if (message.type?.includes('function') || message.type?.includes('tool')) {
          console.warn("⚠️ Unhandled function/tool message:", message.type, message);
        } else {
          this.log("Unhandled message type:", message.type, message);
        }
    }
  }

  /*MD ## Event Replay System MD*/

  /**
   * Replay events from an array with preserved timing
   * Overrides base class method to implement realtime-specific replay
   *
   * @param {Array} events - Array of event objects
   * @param {string} conversationId - Optional conversation ID to replay into
   */
  replayEventsFromArray(events, conversationId = null) {
    // Filter to only realtime events
    const realtimeEvents = events.filter(e => e.type === 'realtime');

    if (realtimeEvents.length === 0) {
      lively.warn("No realtime events found in captured data");
      return;
    }

    // Initialize replay state
    this._replayMode = true;
    this._replayPaused = false;
    this._replaySpeed = 1;
    this._replayTimeouts = [];
    this._replayCurrentEvent = 0;
    this._replayTotalEvents = realtimeEvents.length;
    this._eventCapture = []; // Clear for new capture

    // Create synthetic conversation for replay
    const replayConversationId = conversationId || `replay-${Date.now()}`;

    // Setup conversation state
    this.currentConversationId = replayConversationId;
    this.conversation = [];
    this.responses.innerHTML = '';
    this.messageSequence = 0;

    // Ensure we're not connected to WebRTC during replay
    if (this.peerConnection && this.isStreamingActive) {
      this.disconnectRealtimeWebRTC();
    }

    // Show replay controls
    this.showReplayControls();

    // Replay events with controllable timing
    let completedEvents = 0;

    this.log(`[realtime] Starting replay of ${realtimeEvents.length} events`);

    const scheduleEvent = (index) => {
      if (index >= realtimeEvents.length) return;

      const event = realtimeEvents[index];

      // Calculate delay from previous event (or 0 for first event)
      let delay = 0;
      if (index > 0) {
        delay = event.timestamp - realtimeEvents[index - 1].timestamp;

        // Apply speed multiplier
        if (this._replaySpeed > 0) {
          delay = delay / this._replaySpeed;
        } else {
          // Instant mode
          delay = 0;
        }
      }

      const timeoutId = setTimeout(async () => {
        // Check if paused - reschedule if needed
        if (this._replayPaused) {
          // Reschedule this event after a short delay and track the timeout ID
          const pauseTimeoutId = setTimeout(() => scheduleEvent(index), 100);
          this._replayTimeouts.push(pauseTimeoutId);
          return;
        }

        // Process the event
        await this.handleRealtimeMessage(event.data);
        completedEvents++;
        this._replayCurrentEvent = completedEvents;

        // Update progress
        this.updateReplayProgress(completedEvents, realtimeEvents.length);

        // Schedule next event
        scheduleEvent(index + 1);

        // Check if complete
        if (completedEvents === realtimeEvents.length) {
          this._replayMode = false;
          this.hideReplayControls();
          lively.success(`Replay complete: ${realtimeEvents.length} events processed`);
        }
      }, delay);

      // Store timeout ID for cancellation
      this._replayTimeouts.push(timeoutId);
    };

    // Start replaying first event
    scheduleEvent(0);
  }


  /*MD ## OpenAI Function Calling MD*/
  getFunctionDefinitions() {
    const allTools = this.toolset.getDefinitions();

    // If availableTools is set, filter to only those tools
    if (this.availableTools !== null && Array.isArray(this.availableTools)) {
      return allTools.filter(tool => this.availableTools.includes(tool.name));
    }

    // Otherwise return all tools (default behavior)
    return allTools;
  }

  /**
   * Set custom system instructions for the AI
   * Can be called by container components to configure behavior
   * @param {string} instructions - Custom prompt for the AI
   */
  setInstructions(instructions) {
    this.customInstructions = instructions;
    this.log('[Audio Chat] Custom instructions set:', instructions);

    // Update live session if active
    if (this.isDataChannelOpen()) {
      this.sendSessionConfig();
    }
  }

  /**
   * Set which tools are available to the AI
   * Can be called by container components to restrict capabilities
   * @param {Array<string>|null} toolNames - Array of tool names, or null for all tools
   */
  setAvailableTools(toolNames) {
    this.availableTools = toolNames;
    this.log('[Audio Chat] Available tools set:', toolNames);

    // Update live session if active
    if (this.isDataChannelOpen()) {
      this.sendSessionConfig();
    }
  }

  // #important
  async callFunction(functionName, args) {
    this.log(`Calling function ${functionName} with args:`, args);
    try {
      const result = await this.toolset.execute(functionName, args);
      this.log(`Function ${functionName} returned:`, result);
      return result;
    } catch (error) {
      console.error(`Function ${functionName} error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }  

  // #important
  async handleFunctionCallFromResponse(item) {
    // item contains: name, call_id, arguments (as JSON string)
    const functionName = item.name;
    const callId = item.call_id;
    const functionArgs = JSON.parse(item.arguments);
    this.log(`Realtime API function call: ${functionName}`, functionArgs);
    lively.notify("Function Called", `Executing ${functionName}`);

    // Add tool call message to chat
    const argsPreview = JSON.stringify(functionArgs).length > 50 ? JSON.stringify(functionArgs).substring(0, 47) + "..." : JSON.stringify(functionArgs);
    await this.addMessage("tool", `🔧 Calling **${functionName}**(${argsPreview})`, {
      type: "function_call",
      functionName: functionName,
      call_id: callId,
      arguments: functionArgs
    });
    try {
      // Execute the function
      const result = await this.callFunction(functionName, functionArgs);

      // Add result message to chat - show full result data
      let resultText;
      if (result.success) {
        // Prioritize result.response for full text (from OpenCode/audio API)
        if (result.response !== undefined) {
          resultText = `✅ ${result.response}`;
        } else {
          // Fallback to result.result or result.message
          const resultData = result.result !== undefined ? result.result : result.message || JSON.stringify(result);
          const resultStr = typeof resultData === 'object' ? JSON.stringify(resultData) : String(resultData);
          resultText = `✅ ${resultStr}`;
        }
      } else if (result.error) {
        // Show full error message
        const errorStr = String(result.error);
        resultText = `❌ Error: ${errorStr}`;
      } else {
        // Fallback: stringify entire result
        resultText = JSON.stringify(result);
      }

      await this.addMessage("tool", `↩️ Result: ${resultText}`, {
        type: "function_call_output",
        call_id: callId,
        output: result
      });

      // Send the result back to the realtime API
      const functionOutput = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(result)
        }
      };
      if (this.sendDataChannelMessage(functionOutput)) {
        this.log("Function result sent to API:", result);
        this.requestAssistantResponse();
      }
    } catch (error) {
      console.error("Function call error:", error);
      lively.notify("Function Error", error.message);

      // Add error message to chat
      await this.addMessage("tool", `❌ Error: ${error.message}`, {
        type: "function_call_output",
        call_id: callId,
        output: {
          success: false,
          error: error.message
        }
      });

      // Send error back to API
      const errorOutput = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify({
            success: false,
            error: error.message
          })
        }
      };
      if (this.sendDataChannelMessage(errorOutput)) {
        // Still trigger a response so the model can explain the error
        this.requestAssistantResponse();
      }
    }
  }
  
  
  /*MD ## Context Menu MD*/

  // Override base class method to add component-specific menu items
  getContextMenuItems() {
    return [
      ["New Conversation", async () => {
        await this.createNewConversation();
      }],
      ["Export Conversation", () => {
        const conversationText = this.conversation
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => `${m.role}: ${m.content}`)
          .join('\n\n');
        navigator.clipboard.writeText(conversationText);
        lively.notify("Exported", "Conversation copied to clipboard");
      }],
      ["Copy as JSONL", () => {
        const jsonlText = this.conversation.map(msg => JSON.stringify({
          role: msg.role,
          content: msg.content,
          type: msg.type,
          metadata: msg.metadata,
          timestamp: msg.timestamp,
          sequence: msg.sequence
        })).join('\n');
        navigator.clipboard.writeText(jsonlText);
        lively.notify("Copied as JSONL", `${this.conversation.length} messages copied`);
      }],
      [" Show Debug Annotations", () => {
        this.showDebugAnnotations = !this.showDebugAnnotations;
        lively.notify("Debug Annotations", this.showDebugAnnotations ? "Enabled" : "Disabled");
      }, "", this.generateToggleIcon(this.showDebugAnnotations)],
      [" Show Tool Calls", () => {
        this.showToolCalls = !this.showToolCalls;
        lively.notify("Tool Calls", this.showToolCalls ? "Visible" : "Hidden");
      }, "", this.generateToggleIcon(this.showToolCalls)]
    ];
  }
  
  /*MD ## Lively4 Hooks MD*/
  
  connectedCallback() {
    // No global keyboard shortcuts needed for pure realtime mode
  }
  /*MD ## Agent Status Coordination MD*/

  /**
   * Called by lively-ai-workspace when the coding agent status changes
   * This allows the audio chat AI to be conversationally aware of agent progress
   */
  onAgentStatusChange(eventData) {
    const {status, message, eventType, task, timestamp} = eventData;

    this.log('[Audio Chat] Agent status changed:', eventData);

    // Store current status (free, no token cost)
    this.agentStatus = status;
    this.lastAgentUpdate = {
      status,
      message,
      eventType,
      task,
      timestamp
    };

    // Keep history of recent events (last 10)
    this.agentEventHistory.push({...eventData, timestamp: timestamp || Date.now()});
    if (this.agentEventHistory.length > 10) {
      this.agentEventHistory.shift();
    }

    // Inject conversation context for major status changes
    // This allows the AI to naturally mention completion without user asking
    if (status === 'idle' && eventData.eventType === 'session.idle') {
      // Agent finished a task
      if (this.waitingForAgentReply) {
        // Automatically relay the agent's response
        this.waitingForAgentReply = false;
        this.relayAgentResponse(this.pendingTask || task);
      } else {
        // Just notify that agent finished
        this.injectSystemContext(`The coding agent finished working on: "${task || 'the current task'}"`);
      }
    } else if (status === 'working' && eventData.eventType === 'message.updated') {
      // Agent started working - optionally inject (less intrusive)
      // Only inject if user recently asked about it
      // this.injectSystemContext(`The coding agent started working on the task`);
    }
  }

  /**
   * Automatically relay the coding agent's response to the audio conversation
   * This creates a seamless three-way conversation experience
   */
  async relayAgentResponse(task) {
    try {
      const workspace = lively.query(document.body, "lively-ai-workspace");
      if (!workspace) {
        console.warn('[Audio Chat] Cannot relay - workspace not found');
        return;
      }

      let response = null;

      // If we have a request ID, use it for precise matching
      if (this.pendingRequestId) {
        response = workspace.getRequestResponse(this.pendingRequestId);

        if (response) {
          this.log('[Audio Chat] Found response by request ID:', this.pendingRequestId);
        } else {
          console.warn('[Audio Chat] Request not yet completed:', this.pendingRequestId);
          return;
        }
      } else {
        // Fallback to history-based matching (old method)
        const historyResult = await workspace.getOpenCodeHistory();

        if (!historyResult.success || !historyResult.messages || historyResult.messages.length === 0) {
          console.warn('[Audio Chat] Cannot relay - no message history');
          return;
        }

        // Find the last assistant message
        const messages = historyResult.messages;
        const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');

        if (!lastAssistantMsg) {
          console.warn('[Audio Chat] Cannot relay - no assistant message found');
          return;
        }

        response = lastAssistantMsg;
      }

      // Inject the agent's response into the conversation
      // The AI will naturally relay this to the user
      const taskContext = task ? ` to "${task}"` : '';
      this.injectSystemContext(
        `The coding agent replied${taskContext}: ${response.content}`
      );

      this.log('[Audio Chat] Auto-relayed agent response');

      // Clear pending request tracking
      this.pendingRequestId = null;

    } catch (error) {
      console.error('[Audio Chat] Error relaying agent response:', error);
    }
  }

  /**
   * Inject system context into the conversation
   * This allows the AI to be aware of events without explicit user queries
   */
  injectSystemContext(text) {
    if (!this.isDataChannelOpen()) {
      this.log('[Audio Chat] Skipping context injection - data channel not open');
      return;
    }

    // Send as a conversation item update
    // The AI will see this in its context and can naturally reference it
    this.sendDataChannelMessage({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: `[System: ${text}]`
        }]
      }
    });

    this.log('[Audio Chat] Injected context:', text);
  }

  disconnectedCallback() {
    lively.notify("close realtime chat");
    lively.removeEventListener(lively.ensureID(this), document.documentElement);

    // Disconnect real-time streaming when component is removed
    this.cleanupStreaming();
  }
  
  livelyMigrate(other) {
    super.livelyMigrate(other)
    this.conversation = other.conversation;
    this.realtimeVoice = other.realtimeVoice;
    this.savedResponseItems = other.savedResponseItems || new Set();
    this.messageWidgets = other.messageWidgets || new Map();
    this.accumulatedTranscripts = other.accumulatedTranscripts || new Map();

    if (this.voiceBox && other.voiceBox) {
      this.voiceBox.value = other.voiceBox.value;
    }

    if (this.modelBox && other.modelBox) {
      this.modelBox.value = other.modelBox.value;
    }

    // Preserve agent status tracking
    this.agentStatus = other.agentStatus || 'idle';
    this.lastAgentUpdate = other.lastAgentUpdate || null;
    this.agentEventHistory = other.agentEventHistory || [];
    this.waitingForAgentReply = other.waitingForAgentReply || false;
    this.pendingTask = other.pendingTask || null;
    this.pendingRequestId = other.pendingRequestId || null;

    // Preserve external configuration
    this.customInstructions = other.customInstructions || null;
    this.availableTools = other.availableTools || null;
  }

  livelyPrepareSave() {
    // Save conversation history to attribute for persistence
    this.setAttribute("data-conversation", JSON.stringify(this.conversation));
  }
  
}
