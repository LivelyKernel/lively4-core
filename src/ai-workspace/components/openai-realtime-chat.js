import OpenAI from "src/client/openai.js";
import LivelyChat from './lively-chat.js';
import { BasicToolset } from "./realtime-chat-tools/basic-toolset.js";
import { WorkspaceToolset } from "./realtime-chat-tools/workspace-toolset.js";
import { MessageToolset } from "./realtime-chat-tools/message-toolset.js";
import { CompositeToolset } from "./realtime-chat-tools/composite-toolset.js";
import Dexie from "src/external/dexie3.js";
import { uuid as generateUuid } from 'utils';
import ContextMenu from 'src/client/contextmenu.js';
/*MD # OpenAI Realtime Chat - Pure WebRTC Streaming


<https://developers.openai.com/api/reference/resources/realtime/client-events>

MD*/

export default class OpenaiRealtimeChat extends LivelyChat {
  /*MD ## Getters and Setters MD*/

  getMessages(conversationId) {
    return OpenaiRealtimeChat.conversationdb.messages.where('conversationId').equals(conversationId)
  }
  
  getConversation(conversationId) { 
    return OpenaiRealtimeChat.conversationdb.conversations.get(conversationId)
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
    Array.from(this.get('#messagesContainer').querySelectorAll("lively-chat-message")).forEach(ea => {
      ea.showDebug = this.showDebug;
    });
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
    this.scrollToBottom(this.get('#messagesContainer'), false, delay);
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
    // Version 2: Add sequence index for correct message ordering
    db.version(2).stores({
      conversations: 'id, timestamp, lastMessageTime',
      messages: '++id, conversationId, sequence, timestamp, type, role'
    });
    // Version 3: Add item_id for OpenAI Realtime API message tracking
    db.version(3).stores({
      conversations: 'id, timestamp, lastMessageTime',
      messages: '++id, conversationId, sequence, timestamp, type, role, item_id'
    });
    return db;
  }

  /*MD ## Setup MD*/
  
  // #important
  async initialize() {
    // Call parent initialize to setup event capture system
    await super.initialize();
    this.registerButtons()

    // Set event source for capture system
    this.eventSource = 'realtime';

    this.windowTitle = "OpenAI Realtime Chat";

    // Realtime WebRTC properties
    this.peerConnection = null;
    this.dataChannel = null;
    this.isStreamingActive = false;
    this.ephemeralToken = null;

    // Track saved response items by OpenAI item_id to prevent duplicates
    this.savedResponseItems = this.savedResponseItems || new Set();

    // Note: chatMessages map inherited from base class (lively-chat.js)

    // Track accumulated transcripts for assistant streaming messages
    this.accumulatedTranscripts = this.accumulatedTranscripts || new Map();

    // Track message timestamps by item_id to preserve ordering across updates
    // CRITICAL: Timestamps must never change after initial assignment
    this.messageTimestamps = this.messageTimestamps || new Map();

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
    this.workspaceReference = this.workspaceReference || null; // Reference to lively-ai-workspace if embedded

    // Tool permissions will be loaded in setupToolSettings()
    // Initialize toolset (basic tools for pure audio chat)
    this.toolset = this.toolset || new BasicToolset();

    // Context menu handler using base class
    this.addEventListener('contextmenu', evt => this.createBaseContextMenu(evt), false);

    // Load preferences
    this.showToolCalls = lively.preferences.get("openai-realtime-chat-show-tool-calls") !== false; // Default to true

    await this.ensureConversation();
    await this.setupSessionsComponent();
    await this.setupVoiceSelection();
    await this.setupVadSelection();

    await this.setupModelSelecton();
    await this.setupToolSettings();
    this.setupUI();
    await this.renderMessages();
    lively.ensureID(this);

    // Don't auto-connect - wait for user to click "Start"
    this.isStopped = true;
    this.get("#stopButton").textContent = "▶️ Start";
  }
  
  setupModelSelecton() {
    this.get("#modelBox").setOptions(["gpt-realtime", "gpt-realtime-1.5","gpt-realtime-mini"]);
    this.get("#modelBox").value = lively.preferences.get("openai-realtime-chat-model") || "gpt-realtime";
    this.get("#modelBox").addEventListener("change", () => {
      lively.preferences.set("openai-realtime-chat-model", this.get("#modelBox").value);
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
          // Sort by timestamp for correct ordering
          const messages = await this.getMessages(convId).toArray();
          messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          this.currentConversationId = convId;
          this.conversation = messages;
        } else {
          // Create new conversation if none exist
          await this.createSession();
        }
      } catch (error) {
        console.error("Failed to load conversation from DB:", error);
        // Fallback to empty conversation
        await this.createSession();
      }
    }
  }

  async setConversation(conversationId) {
    return this.loadConversation(conversationId)
  }

  async setupVoiceSelection() {
    // Setup voice selection
    var voiceBox = this.get("#voiceBox")
    voiceBox.setOptions(["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "cedar", "marin"]);
    voiceBox.value = lively.preferences.get("openai-realtime-chat-voice") || "marin";
    voiceBox.addEventListener("change", async () => {
      lively.preferences.set("openai-realtime-chat-voice", voiceBox.value);
      this.realtimeVoice = voiceBox.value;
      await this.reconnectWithNewVoice();
    });
    this.realtimeVoice = voiceBox.value;
  }

  async setupVadSelection() {
    // Setup VAD type selection
    const vadTypeBox = this.get("#vadTypeBox");
    vadTypeBox.setOptions(["server_vad", "semantic_vad"]);
    vadTypeBox.value = lively.preferences.get("openai-realtime-chat-vad-type") || "server_vad";
    this.vadType = vadTypeBox.value;

    // Setup VAD eagerness selection (only for semantic_vad)
    const vadEagernessBox = this.get("#vadEagernessBox");
    vadEagernessBox.setOptions(["low", "medium", "high", "auto"]);
    vadEagernessBox.value = lively.preferences.get("openai-realtime-chat-vad-eagerness") || "medium";
    this.vadEagerness = vadEagernessBox.value;

    // Setup VAD threshold slider (only for server_vad)
    const vadThresholdSlider = this.get("#vadThresholdSlider");
    const vadThresholdValue = this.get("#vadThresholdValue");
    const vadThresholdContainer = this.get("#vadThresholdContainer");
    
    const savedThreshold = lively.preferences.get("openai-realtime-chat-vad-threshold");
    this.vadThreshold = savedThreshold !== undefined ? savedThreshold : 0.85;
    vadThresholdSlider.value = this.vadThreshold;
    vadThresholdValue.textContent = this.vadThreshold.toFixed(2);

    // Show/hide controls based on VAD type
    const updateControlsVisibility = () => {
      vadEagernessBox.style.display = this.vadType === "semantic_vad" ? "block" : "none";
      vadThresholdContainer.style.display = this.vadType === "server_vad" ? "flex" : "none";
    };
    updateControlsVisibility();

    // VAD type change handler
    vadTypeBox.addEventListener("change", async () => {
      lively.preferences.set("openai-realtime-chat-vad-type", vadTypeBox.value);
      this.vadType = vadTypeBox.value;
      updateControlsVisibility();
      await this.updateVadSettings();
    });

    // Eagerness change handler
    vadEagernessBox.addEventListener("change", async () => {
      lively.preferences.set("openai-realtime-chat-vad-eagerness", vadEagernessBox.value);
      this.vadEagerness = vadEagernessBox.value;
      await this.updateVadSettings();
    });

    // Threshold slider change handler
    vadThresholdSlider.addEventListener("input", (evt) => {
      this.vadThreshold = parseFloat(evt.target.value);
      vadThresholdValue.textContent = this.vadThreshold.toFixed(2);
    });

    vadThresholdSlider.addEventListener("change", async (evt) => {
      this.vadThreshold = parseFloat(evt.target.value);
      lively.preferences.set("openai-realtime-chat-vad-threshold", this.vadThreshold);
      vadThresholdValue.textContent = this.vadThreshold.toFixed(2);
      await this.updateVadSettings();
    });
  }

  async setupToolSettings() {
    // Load saved tool permissions
    this.loadToolPermissions();

    // Setup modal event handlers
    const toolSettingsButton = this.get("#toolSettingsButton");
    const toolSettingsModal = this.get("#toolSettingsModal");
    const toolSettingsOverlay = this.get("#toolSettingsOverlay");
    const saveButton = this.get("#saveToolSettings");
    const cancelButton = this.get("#cancelToolSettings");

    // Open modal
    toolSettingsButton?.addEventListener("click", () => {
      this.openToolSettingsModal();
    });

    // Close modal on overlay click
    toolSettingsOverlay?.addEventListener("click", () => {
      this.closeToolSettingsModal();
    });

    // Cancel button
    cancelButton?.addEventListener("click", () => {
      this.closeToolSettingsModal();
    });

    // Save button
    saveButton?.addEventListener("click", () => {
      this.saveToolPermissions();
      this.closeToolSettingsModal();
    });

    // Update toolset based on loaded permissions
    this.updateToolset();
  }

  openToolSettingsModal() {
    const modal = this.get("#toolSettingsModal");
    const overlay = this.get("#toolSettingsOverlay");

    // Load current settings into checkboxes
    const allowCodeEval = this.get("#allowCodeEvaluation");
    const allowOpenCode = this.get("#allowOpenCodeTasks");
    const allowMessageInspection = this.get("#allowMessageInspection");

    if (allowCodeEval) {
      allowCodeEval.checked = this.toolPermissions.allowCodeEvaluation;
    }
    if (allowOpenCode) {
      allowOpenCode.checked = this.toolPermissions.allowOpenCodeTasks;
    }
    if (allowMessageInspection) {
      allowMessageInspection.checked = this.toolPermissions.allowMessageInspection;
    }

    // Show modal
    modal?.classList.add("visible");
    overlay?.classList.add("visible");
  }

  closeToolSettingsModal() {
    const modal = this.get("#toolSettingsModal");
    const overlay = this.get("#toolSettingsOverlay");

    modal?.classList.remove("visible");
    overlay?.classList.remove("visible");
  }

  loadToolPermissions() {
    // Load from preferences, use defaults if not set
    const savedPermissions = lively.preferences.get("openai-realtime-chat-tool-permissions");
    
    // Always set toolPermissions, don't rely on || operator
    if (savedPermissions && typeof savedPermissions === 'object') {
      this.toolPermissions = {
        allowCodeEvaluation: savedPermissions.allowCodeEvaluation !== false,
        allowOpenCodeTasks: savedPermissions.allowOpenCodeTasks !== false,
        allowMessageInspection: savedPermissions.allowMessageInspection !== false
      };
    } else {
      // Defaults: all enabled
      this.toolPermissions = {
        allowCodeEvaluation: true,
        allowOpenCodeTasks: true,
        allowMessageInspection: true
      };
    }

    this.log("[Tool Permissions] Loaded:", this.toolPermissions);
  }

  saveToolPermissions() {
    // Read from checkboxes
    const allowCodeEval = this.get("#allowCodeEvaluation");
    const allowOpenCode = this.get("#allowOpenCodeTasks");
    const allowMessageInspection = this.get("#allowMessageInspection");

    this.toolPermissions = {
      allowCodeEvaluation: allowCodeEval?.checked !== false,
      allowOpenCodeTasks: allowOpenCode?.checked !== false,
      allowMessageInspection: allowMessageInspection?.checked !== false
    };

    // Save to preferences
    lively.preferences.set("openai-realtime-chat-tool-permissions", this.toolPermissions);

    this.log("[Tool Permissions] Saved:", this.toolPermissions);

    // Update toolset with new permissions
    this.updateToolset();

    // Update live session if active
    if (this.isDataChannelOpen()) {
      this.sendSessionConfig();
      lively.success("Tool permissions updated", "Reconnect to apply changes");
    } else {
      lively.success("Tool permissions saved");
    }
  }

  updateToolset() {
    const { allowCodeEvaluation, allowOpenCodeTasks, allowMessageInspection } = this.toolPermissions;

    // Get workspace reference if available (for WorkspaceToolset and MessageToolset)
    // Try stored reference first, then query DOM
    const workspace = this.workspaceReference || lively.query(document.body, "lively-ai-workspace");

    // Build toolset based on permissions
    const toolsets = [];
    const allowedToolNames = [];

    // BasicToolset tools
    const basicToolset = new BasicToolset();
    toolsets.push(basicToolset);

    // Add BasicToolset tool names if allowed
    if (allowCodeEvaluation) {
      allowedToolNames.push('evaluate_code');
    }

    // Add WorkspaceToolset if OpenCode tasks are allowed AND workspace is available
    if (allowOpenCodeTasks && workspace) {
      const workspaceToolset = new WorkspaceToolset(workspace);
      toolsets.push(workspaceToolset);
      allowedToolNames.push('send_opencode_task');
    }

    // Add MessageToolset if message inspection is allowed AND workspace is available
    if (allowMessageInspection && workspace) {
      const messageToolset = new MessageToolset(workspace);
      toolsets.push(messageToolset);
      allowedToolNames.push('get_recent_messages', 'search_messages', 'get_message_by_id');
    }

    // Use CompositeToolset if we have multiple toolsets, otherwise just the basic one
    if (toolsets.length > 1) {
      this.toolset = new CompositeToolset(...toolsets);
    } else {
      this.toolset = toolsets[0];
    }

    // Use setAvailableTools to filter based on permissions
    // This leverages the existing filtering in getFunctionDefinitions()
    // Empty array = no tools allowed, null = all tools allowed
    this.setAvailableTools(allowedToolNames);

    this.log("[Tool Permissions] Toolset updated with permissions:", this.toolPermissions);
    this.log("[Tool Permissions] Available tools:", this.getFunctionDefinitions().map(t => t.name));
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
      this.get("#stopButton").textContent = "⏹️ Stop";
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
    this.get("#stopButton").textContent = "▶️ Resume";
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
    this.get('#stopButton').textContent = "⏹️ Stop";
    lively.notify("Audio resumed");
  }

  onStopButton() {
    this.toggleStop()
  }
  onResetButton(evt) {
    this.createSession();
    this.clearDebugLog()
  }
  onToolSettingsButton() {
    this.openToolSettingsModal();
  }
  onSaveToolSettings() {
    this.saveToolPermissions();
    this.closeToolSettingsModal();
  }
  onCancelToolSettings() {
    this.closeToolSettingsModal();
  }
  
  async setupUI() {
    this.get("#textInput").addEventListener("keydown", evt => {
      if (evt.key == "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        this.chatFromInput();
      }
    });
  }

  /*MD ## Sessions Component Setup MD*/

  async setupSessionsComponent() {
    if (!this.get("#sessionsComponent")) return;

    // Configure component
    this.get("#sessionsComponent").headerTitle = "Conversations";
    this.get("#sessionsComponent").showNewButton = true;
    this.get("#sessionsComponent").showDeleteButtons = true;

    // Wire up event handlers
    this.get("#sessionsComponent").addEventListener('session-selected', (evt) => {
      this.onSessionSelected(evt.detail.sessionId);
    });

    this.get("#sessionsComponent").addEventListener('session-deleted', (evt) => {
      this.onSessionDeleted(evt.detail.sessionId);
    });

    this.get("#sessionsComponent").addEventListener('sessions-bulk-deleted', (evt) => {
      this.onSessionsBulkDeleted(evt.detail.sessionIds);
    });

    this.get("#sessionsComponent").addEventListener('session-created', () => {
      this.onNewConversationButton();
    });

    this.get("#sessionsComponent").addEventListener('sessions-load-requested', (evt) => {
      this.loadSelectedSessions(evt.detail.sessionIds);
    });

    // Initial render
    await this.renderConversationsList();
  }

  async renderConversationsList() {
    if (!this.get("#sessionsComponent")) return;

    const conversations = await this.getConversationList();

    // Map conversations to session format
    const sessionsData = conversations.map(conv => ({
      id: conv.id,
      title: new Date(conv.lastMessageTime).toLocaleString(),
      timestamp: conv.lastMessageTime,
      messageCount: conv.messageCount
    }));

    // Update component
    this.get("#sessionsComponent").sessions = sessionsData;
    this.get("#sessionsComponent").activeSessionId = this.currentConversationId;
  }

  /*MD ## Session Event Handlers MD*/

  async onSessionSelected(conversationId) {
    if (conversationId === this.currentConversationId) return;
    await this.loadConversation(conversationId);
  }

  async onSessionDeleted(conversationId) {
    if (await lively.confirm('Delete this conversation?')) {
      const conversations = await this.getConversationList();
      const isDeletingCurrent = conversationId === this.currentConversationId;

      // If deleting current conversation, find next conversation to load
      let nextConversationId = null;
      if (isDeletingCurrent) {
        const currentIndex = conversations.findIndex(c => c.id === conversationId);
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
      await this.deleteConversation(conversationId);

      // Load next conversation or create new one if list is now empty
      if (isDeletingCurrent) {
        if (nextConversationId) {
          await this.loadConversation(nextConversationId);
        } else {
          // No other conversations exist, create new one
          await this.createSession();
        }
      }
      await this.renderConversationsList();
    }
  }

  async onSessionsBulkDeleted(conversationIds) {
    // Already confirmed in the component
    const isDeletingCurrent = conversationIds.includes(this.currentConversationId);

    // Delete all conversations
    await Promise.all(conversationIds.map(id => this.deleteConversation(id)));

    // If we deleted the current conversation, create a new one
    if (isDeletingCurrent) {
      await this.createSession();
    }

    await this.renderConversationsList();
    lively.success(`${conversationIds.length} conversation(s) deleted`);
  }

  async onNewConversationButton() {
    await this.createSession();
    await this.renderConversationsList();
  }

  /**
   * Load selected sessions - stub for future implementation
   * @param {string[]} sessionIds - Array of session IDs to load
   */
  async loadSelectedSessions(sessionIds) {
    // TODO: Implement loading for realtime chat sessions if needed
    lively.notify('Load sessions not yet implemented for Realtime Chat');
  }

  async chatFromInput() {
    const userText = this.get("#textInput").value.trim();
    if (!userText) return;
    this.get("#textInput").value = "";

    // Don't manually add message - let API's conversation.item.created event handle it
    // This prevents duplication when API echoes the message back

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
  async renderMessage(message) {
    if (!this.messagesUI) return; 

    this.log(`[realtime] renderMessage: ${message.role}`);
    
    // Check if already rendered by item_id to prevent duplicates
    if (message.item_id && this.chatMessages.has(message.item_id)) {
      this.log(`[item_id] Message already rendered: ${message.item_id}`);
      return this.chatMessages.get(message.item_id);
    }
    
    const chatMessage = await <lively-chat-message></lively-chat-message>;
    await chatMessage.setMessage(message);
    this.get('#messagesContainer').appendChild(chatMessage);
    
    // Track rendered message by item_id to prevent duplicates
    if (message.item_id) {
      this.chatMessages.set(message.item_id, chatMessage);
      this.log(`[item_id] Tracked rendered message: ${message.item_id}`);
    }
    
    this.scrollResponsesSoon();
    return chatMessage
  }

  /*MD ## Live Updates MD*/

  /**
   * Unified method for creating realtime messages
   * 
   * @param {string} role - Message role: 'user', 'assistant', or 'tool'
   * @param {string} content - Message content (may be placeholder for streaming messages)
   * @param {Object} options - Configuration options
   * @param {string} options.item_id - OpenAI item_id for streaming messages (enables widget tracking)
   * @param {Object} options.metadata - Additional metadata (type, functionName, call_id, etc.)
   * @param {boolean} options.persist - Whether to save to database (auto-determined if null)
   * @param {string} options.eventName - Custom event name (auto-determined if null)
   * @returns {Object} messageData object with role, content, timestamp, etc.
   */
  async createRealtimeMessage(role, content, {
    item_id = null,
    metadata = {},
    persist = null,
    eventName = null
  } = {}) {
    // Auto-determine persistence if not specified
    // Streaming messages (with item_id): only persist if content is complete (not placeholder)
    // Non-streaming messages: always persist
    const isStreamingMessage = !!item_id;
    const hasCompleteContent = content && content !== '_Listening..._' && content !== '';
    const shouldPersist = persist !== null 
      ? persist 
      : (isStreamingMessage ? hasCompleteContent : true);

    // Auto-determine event name if not specified
    const autoEventName = eventName || (isStreamingMessage
      ? (role === 'user' ? 'realtime:create-live-user-message' : 'realtime:create-live-assistant-message')
      : 'realtime:add-message');

    // Generate timestamp
    const msgTimestamp = Date.now();
    
    // Track timestamp by item_id for streaming messages
    if (item_id && !this.messageTimestamps.has(item_id)) {
      this.messageTimestamps.set(item_id, msgTimestamp);
    }

    // Build message data
    const messageData = {
      role,
      content,
      metadata,
      source: 'audio',
      timestamp: msgTimestamp,
      ...(item_id && { item_id }),
      ...(metadata.type && { type: metadata.type }),
      ...(isStreamingMessage && { streamType: 'realtime' })
    };

    // Log creation
    this.log(`[realtime] createRealtimeMessage: ${role}${item_id ? ` (${item_id})` : ''}`);

    // Dispatch event for workspace integration
    this.dispatchMessageEvent(autoEventName, messageData);

    // Render UI widget
    let widget = null;
    if (this.messagesUI !== false) {
      widget = await this.renderMessage(messageData);
      if (isStreamingMessage && item_id) {
        this.chatMessages.set(item_id, widget);
        this.log(`[item_id] Created widget for ${item_id} (${role})`);
      }
    }

    // Persist to database
    if (shouldPersist && content && this.canWriteToDatabase()) {
      const dbMessage = {
        role,
        content,
        metadata,
        timestamp: msgTimestamp,
        ...(item_id && { item_id }),
        ...(metadata.type && { type: metadata.type })
      };
      this.conversation.push(dbMessage);
      await this.saveMessageToDb(dbMessage);
      this.log(`[Persistence] Saved ${role} message${item_id ? ` (${item_id})` : ''}`);
    }

    return messageData;
  }


  async updateMessage(item_id, role, content, persist = false) {
    // CRITICAL: Retrieve original timestamp from Map
    // If no timestamp exists, it means createMessage was never called - this is a bug!
    const timestamp = this.messageTimestamps.get(item_id);
    if (!timestamp) {
      throw new Error(`[updateMessage] No timestamp found for ${item_id} - createMessage must be called first`);
    }
    
    const messageData = {
      role: role,
      content: content,
      source: 'audio',
      streamType: 'realtime',
      timestamp: timestamp,  // Always use original timestamp from Map
      item_id: item_id  // Include item_id for workspace lookup
    };

    // Always dispatch event for workspace integration
    const eventName = role === 'user' ? 'realtime:update-live-user-message' : 'realtime:update-live-assistant-message';
    this.dispatchMessageEvent(eventName, messageData);

    // Optionally update UI widget if it exists
    const widget = this.chatMessages.get(item_id);
    if (widget) {
      await widget.setMessage(messageData);
      this.scrollResponsesSoon(10);
      this.log(`[item_id] Updated ${role} widget ${item_id}`);
    } 

    // Persist final version to database if requested (skip during replay)
    if (persist && content && this.canWriteToDatabase()) {
      // Deduplication for assistant messages
      if (role === 'assistant' && item_id) {
        if (this.savedResponseItems.has(item_id)) {
          this.log(`[Duplicate Prevention] Skipping duplicate save for item ${item_id}`);
          return messageData;
        }
        this.savedResponseItems.add(item_id);
      }

      const message = {
        role,
        content,
        timestamp: messageData.timestamp,
        item_id: item_id
      };
      this.conversation.push(message);
      await this.saveMessageToDb(message);
      this.log(`[Persistence] Saved ${role} message via updateMessage`);
    }

    return messageData;
  }

  async renderMessages() {  // Renamed for consistency
    this.log(`[realtime] renderMessages: full redisplay (${this.conversation.length} messages)`);
    
    // Populate tracking sets from loaded messages to prevent duplicates
    for (let ea of this.conversation) {
      if (ea.item_id) {
        // Track assistant messages to prevent duplicate saves
        if (ea.role === 'assistant') {
          this.savedResponseItems.add(ea.item_id);
        }
        // Track timestamp for ordering
        if (ea.timestamp) {
          this.messageTimestamps.set(ea.item_id, ea.timestamp);
        }
      }
      
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

    // CENTRALIZED REPLAY GUARD - blocks ALL DB writes during replay
    if (!this.canWriteToDatabase()) {
      return;
    }

    try {
      // Save message to database
      await OpenaiRealtimeChat.conversationdb.messages.add({
        conversationId: this.currentConversationId,
        timestamp: message.timestamp || Date.now(), // Use message creation time, not save time
        type: message.type || "message",
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        item_id: message.item_id, // OpenAI Realtime API item ID for deduplication
        // Add format markers for workspace integration
        source: 'audio',
        streamType: 'realtime',
        messageFormat: 'flat'
      });

      // Update conversation's last message time
      await OpenaiRealtimeChat.conversationdb.conversations.update(this.currentConversationId, {
        lastMessageTime: Date.now()
      });

      // Dispatch event for workspace integration
      this.dispatchMessageEvent('realtime:message-saved', {
        conversationId: this.currentConversationId,
        message: {
          role: message.role,
          content: message.content,
          type: message.type || "message",
          metadata: message.metadata || {},
          timestamp: message.timestamp || Date.now()
        }
      });
    } catch (error) {
      console.error("Failed to save message to DB:", error);
    }
  }

  async createSession() {
    // Clean up if in replay mode
    if (this._replayMode) {
      this.stopReplay();
    }

    // Clean up artificial session if present
    this.cleanupArtificialSession();

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
      
      // Clear tracking maps for new conversation
      this.chatMessages.clear();
      this.savedResponseItems.clear();
      this.accumulatedTranscripts.clear();
      this.messageTimestamps.clear();
      
      this.get('#messagesContainer').innerHTML = '';

      // Disconnect if currently connected - user can press Start to begin new conversation
      if (this.peerConnection && this.isStreamingActive) {
        this.log("Disconnecting current session - press Start to begin new conversation");
        this.disconnectRealtimeWebRTC();
        this.isStopped = true;
        this.get('#stopButton').textContent = "▶️ Start";
      }

      lively.notify("New conversation", "Started new conversation");
      return conversationId;
    } catch (error) {
      console.error("Failed to create new conversation:", error);
      throw error;
    }
  }

  async loadConversation(conversationId) {
    // Clean up if in replay mode
    if (this._replayMode) {
      this.stopReplay();
    }

    // Clean up artificial session if present
    this.cleanupArtificialSession();

    try {
      const conv = await this.getConversation(conversationId);
      if (!conv) {
        console.error("Conversation not found:", conversationId);
        return;
      }
      // Sort by timestamp for correct ordering
      const messages = await this.getMessages(conversationId).toArray();
      messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      this.conversation = messages;

      this.currentConversationId = conversationId;

      // Clear event capture buffer when switching conversations
      this.clearEventCapture();

      // Clear tracking maps before rendering new conversation
      this.chatMessages.clear();
      this.savedResponseItems.clear();
      this.accumulatedTranscripts.clear();
      this.messageTimestamps.clear();

      this.get('#messagesContainer').innerHTML = '';
      await this.renderMessages();

      // Disconnect if currently connected - user can press Start to reconnect with this conversation
      if (this.peerConnection && this.isStreamingActive) {
        this.log("Disconnecting current session - press Start to continue with loaded conversation");
        this.disconnectRealtimeWebRTC();
        this.isStopped = true;
        this.get('#stopButton').textContent = "▶️ Start";
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
        const count = await this.getMessages(conv.id).count();
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
    // Block deletes during replay mode
    if (!this.canWriteToDatabase()) {
      lively.warn("Cannot delete during replay mode");
      return;
    }

    try {
      await this.getMessages(conversationId).delete();
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
        model: this.get("#modelBox").value || "gpt-4o-realtime-preview",
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

    // Build turn_detection config based on VAD type
    const vadType = this.vadType || "server_vad";
    let turn_detection;
    
    if (vadType === "semantic_vad") {
      turn_detection = {
        type: "semantic_vad",
        eagerness: this.vadEagerness || "medium",
        create_response: true,
        interrupt_response: true
      };
    } else {
      turn_detection = {
        type: "server_vad",
        threshold: this.vadThreshold !== undefined ? this.vadThreshold : 0.85,
        prefix_padding_ms: 300,
        silence_duration_ms: 700
      };
    }

    const sessionConfig = {
      type: "session.update",
      session: {
        instructions: instructions,
        voice: this.realtimeVoice || "shimmer",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: turn_detection,
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
      let event = {
        type: "conversation.item.create"
      }
      if (msg.role === 'tool') {
        if (msg.type === 'function_call' ) {
          event.item = {    
              type: "function_call",
              name: msg.metadata.functionName,
              call_id: msg.metadata.call_id,
              arguments: JSON.stringify(msg.metadata.arguments)
            }
        } else if (msg.type === 'function_call_output' ) {
          event.item = {
              type: "function_call_output",
              call_id: msg.metadata.call_id,
              output: JSON.stringify(msg.metadata.output)
            }
        }
      } else if (msg.role === 'user') {
          event.item = {
              type: "message",
              role: msg.role,
              content: [{
                type: "input_text",
                text: msg.content
              }]
            }
          
      } else if (msg.role === 'assistant') {
           event.item = {
              type: "message",
              role: msg.role,
              content: [{
                type: "text",
                text: msg.content
              }]
            }
      } else {
         throw new Error("replay not supported")
      }
      
      // Include item_id if available to preserve OpenAI message IDs
      if (msg.item_id && event.item) {
        event.item.id = msg.item_id;
      }
      
      this.sendDataChannelMessage(event, { warnOnClosed: false });
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

  async updateVadSettings() {
    const vadType = this.vadType || "server_vad";
    const displayName = vadType === "semantic_vad" 
      ? `Semantic VAD (${this.vadEagerness})`
      : "Server VAD";
    
    this.log('[VAD Settings] VAD type changed to:', displayName);

    // Update live session if active
    if (this.isDataChannelOpen()) {
      this.sendSessionConfig();
      lively.success("VAD updated", displayName);
    } else {
      lively.notify("VAD will be applied", `${displayName} on next connection`);
    }
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
  async replayMessageEvent(event, replaySessionId) {
    await this.handleRealtimeMessage(event.data)
  }
  
  // #important
  async handleRealtimeMessage(message) {
    // Capture event for replay (skip audio data and deduplicate item.created)
    if (!this._replayMode && message.type && !message.type.includes('audio.delta')) {
      // For conversation.item.created events, only capture if we haven't seen this item_id yet
      if (message.type === 'conversation.item.created' && message.item?.id) {
        if (!this._capturedItemIds) {
          this._capturedItemIds = new Set();
        }
        if (this._capturedItemIds.has(message.item.id)) {
          this.log(`[capture] Skipping duplicate item.created for ${message.item.id}`);
        } else {
          this._capturedItemIds.add(message.item.id);
          this.captureEvent('realtime', message, this.currentConversationId);
        }
      } else {
        // Capture all other event types normally
        this.captureEvent('realtime', message, this.currentConversationId);
      }
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
        // this.log("Speech started");
        this.isListening = true;
        this.updateStatus('listening', '🎤 Listening...');
        // Widget will be created when conversation.item.created arrives
        break;
      case "input_audio_buffer.speech_stopped":
        // this.log("Speech stopped");
        this.isListening = false;
        this.updateStatus('ready', '✅ Ready to listen - you can speak now');
        break;
      case "conversation.item.created":
        // this.log("Item created:", message);

        // Create message when item exists in API
        if (message.item && message.item.id && message.item.type === "message") {
          const item_id = message.item.id;
          const role = message.item.role;

          // Skip if already created
          if (this.chatMessages.has(item_id)) {
            this.log(`[item_id] Message already exists for ${item_id}`);
            break;
          }

          // Extract initial content if available (e.g., from text input)
          let initialContent = null;
          if (message.item.content && Array.isArray(message.item.content)) {
            for (const contentPart of message.item.content) {
              if (contentPart.type === "input_text" && contentPart.text) {
                initialContent = contentPart.text;
                this.log(`[text input] Found text content in item.created for ${item_id}`);
                break;
              } else if (contentPart.type === "input_audio" && contentPart.transcript) {
                initialContent = contentPart.transcript;
                this.log(`[audio] Found transcript in item.created for ${item_id}`);
                break;
              }
            }
          }

          // Create message with initial content (or placeholder if none available)
          // This dispatches the create event with correct content from the start
          // Detect if this is a complete text message (vs audio that needs transcription)
          const hasAudioContent = message.item.content?.some(c => c.type === 'input_audio');
          const shouldPersist = initialContent && role === 'user' && !hasAudioContent;

          const content = initialContent || (role === 'user' ? '_Listening..._' : '');
          await this.createRealtimeMessage(role, content, { item_id, persist: shouldPersist });
        }
        break;
      case "conversation.item.input_audio_transcription.delta":
        // Incremental transcript update
        if (message.delta && message.item_id) {
          // Accumulate user transcript deltas (same as assistant)
          const currentTranscript = this.accumulatedTranscripts.get(message.item_id) || "";
          const updatedTranscript = currentTranscript + message.delta;
          this.accumulatedTranscripts.set(message.item_id, updatedTranscript);

          await this.updateMessage(message.item_id, 'user', updatedTranscript);
        }
        break;
      case "conversation.item.input_audio_transcription.completed":
        // User speech was transcribed
        this.log("User transcript:", message.transcript);

        if (message.transcript && message.item_id) {
          // Clean up accumulated transcript
          this.accumulatedTranscripts.delete(message.item_id);

          // Always use updateMessage to finalize - the message was already created
          // by conversation.item.created event. updateMessage handles missing widgets
          // gracefully by still dispatching the update event for workspace integration.
          await this.updateMessage(message.item_id, 'user', message.transcript, true);
          this.log(`[item_id] Finalized user message ${message.item_id}`);
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

        if (message.transcript && message.item_id) {
          // Clean up accumulated transcript
          this.accumulatedTranscripts.delete(message.item_id);

          // Update widget and persist (includes deduplication)
          await this.updateMessage(message.item_id, 'assistant', message.transcript, true);
          this.log(`[item_id] Finalized assistant message ${message.item_id}`);
        }
        break;
      case "response.audio.done":
        // Audio playback complete for this response
        // this.log("Audio playback done:", message.item_id);
        break;
      case "error":
        console.error("Realtime API error:", message);
        console.error("Full error details:", JSON.stringify(message, null, 2));

        // Don't show notifications for errors during replay (they're from the recording)
        if (!this._replayMode) {
          lively.notify("Real-time API issue", message.error?.message || "An error occurred");
        }
        break;

      // Informational events - no action needed, just log for debugging
      case "response.created":
        // this.log("Response created:", message.response_id);
        break;
      case "response.output_item.added":
        // this.log("Output item added:", message.item);
        break;
      case "input_audio_buffer.committed":
        // this.log("Audio buffer committed:", message.item_id);
        break;
      case "response.content_part.added":
        // this.log("Content part added:", message.part);
        break;
      case "response.content_part.done":
        // this.log("Content part done:", message.part);
        break;
      case "response.output_item.done":
        ;; this.log("Output item done:", message.item);
        break;
      case "rate_limits.updated":
        // this.log("Rate limits updated:", message.rate_limits);
        break;
      case "output_audio_buffer.started":
       // this.log("Output audio buffer started");
        break;
      case "output_audio_buffer.cleared":
        // this.log("Output audio buffer cleared");
        break;
      case "conversation.item.truncated":
        // this.log("Conversation item truncated:", message.item_id);
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
   * Enable replay mode: disable inputs, clear UI, create artificial session
   * @param {string} conversationId - Optional conversation ID for replay session
   */
  enableReplay(conversationId = null) {
    this._replayMode = true;
    this.get('#textInput').disabled = true;
    this.get('#stopButton').disabled = true;

    const replayConversationId = conversationId || `replay-${Date.now()}`;

    this.currentConversationId = replayConversationId;
    this.conversation = [];
    this.get('#messagesContainer').innerHTML = '';

    // Clear tracking maps to allow replay to create new widgets
    this.chatMessages.clear();
    this.savedResponseItems.clear();
    this.accumulatedTranscripts.clear();
    this.messageTimestamps.clear();

    // Ensure we're not connected to WebRTC during replay
    if (this.peerConnection && this.isStreamingActive) {
      this.disconnectRealtimeWebRTC();
    }

    return replayConversationId;
  }

  disableReplay() {
    this._replayMode = false;
    this.get('#textInput').disabled = false;
    this.get('#stopButton').disabled = false;
  }

  cleanupArtificialSession() {
    if (this.currentConversationId?.startsWith('replay-')) {
      this.currentConversationId = null;
      this.conversation = [];
      this.get('#messagesContainer').innerHTML = '';
      this.chatMessages.clear();
      this.savedResponseItems.clear();
      this.accumulatedTranscripts.clear();
      this.messageTimestamps.clear();
    }
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

  setInstructions(instructions) {
    this.customInstructions = instructions;
    this.log('[Audio Chat] Custom instructions set:', instructions);

    // Update live session if active
    if (this.isDataChannelOpen()) {
      this.sendSessionConfig();
    }
  }

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
    await this.createRealtimeMessage("tool", `🔧 Calling **${functionName}**(${argsPreview})`, {
      metadata: {
        type: "function_call",
        functionName: functionName,
        call_id: callId,
        arguments: functionArgs
      }
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

      await this.createRealtimeMessage("tool", `↩️ Result: ${resultText}`, {
        metadata: {
          type: "function_call_output",
          call_id: callId,
          output: result
        }
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
      await this.createRealtimeMessage("tool", `❌ Error: ${error.message}`, {
        metadata: {
          type: "function_call_output",
          call_id: callId,
          output: {
            success: false,
            error: error.message
          }
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
    var items = super.getContextMenuItems()
    return items.concat([
      ["New Conversation", async () => {
        await this.createSession();
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
          timestamp: msg.timestamp
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
    ]);
  }

  /*MD ## Agent Status Coordination MD*/
  onAgentStatusChange(eventData) {
    const {status, message, eventType, task, timestamp} = eventData;

    // this.log('[Audio Chat] Agent status changed:', eventData);

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
    // Note: chatMessages migration handled by base class
    this.accumulatedTranscripts = other.accumulatedTranscripts || new Map();
    this.messageTimestamps = other.messageTimestamps || new Map();

    this.get("#voiceBox").value = other.get("#voiceBox").value
    this.get("#modelBox").value = other.get("#modelBox").value

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

  cleanupSession() {
    super.cleanupSession();

    // Clear conversation display
    const messagesContainer = this.get('#messagesContainer');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }

    // Clear conversation data
    this.conversation = [];
    
    // Clear timestamp tracking (important for replay rewind)
    if (this.messageTimestamps) {
      this.messageTimestamps.clear();
    }
  }

  livelyPrepareSave() {
    // Save conversation history to attribute for persistence
    this.setAttribute("data-conversation", JSON.stringify(this.conversation));
  }

}
