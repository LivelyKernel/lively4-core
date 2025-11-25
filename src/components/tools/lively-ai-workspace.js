import LivelyChat from 'src/components/tools/lively-chat.js';
import Dexie from "src/external/dexie3.js";
import { uuid as generateUuid } from 'utils';
import { WorkspaceToolset } from "./openai-realtime-chat-tools.js";

/*MD
# [Lively AI Workspace](browse://doc/tools/ai-workspace.md)

MD*/

export default class LivelyAiWorkspace extends LivelyChat {

  /*MD ## Database Schema MD*/
  static get historydb() {
    var db = new Dexie("lively-ai-workspace-history");
    db.version(7).stores({
      workspaces: 'id, timestamp, lastActivityTime, title, conversationId, opencodeSessionId',
    }).upgrade(function () {
      console.log('[AI Workspace] Database upgraded to v6');
    });


    return db;
  }
  
  /*MD ## Initialize MD*/
  // #override
  updateMessagesDebugState() {
    if (this.sharedMessagesPane) {
      Array.from(this.sharedMessagesPane.querySelectorAll("lively-chat-message")).forEach(ea => {
        ea.showDebug = this.showDebug;
      });
    }
  }

  // #important
  async initialize() {
    // Call parent initialize to setup event capture system
    await super.initialize();
    this.registerButtons()

    this.windowTitle = "AI Workspace";

    // Initialize debug log visibility (controlled by showDebug property)
    this.setAttribute("hide-debug-log", this.showDebug ? "false" : "true");

    this.blackboard = this.blackboard || {
      currentTask: null,
      agentStatus: 'idle',
      coordination: {},
      lastUpdate: Date.now(),
      pendingRequests: new Map(),    // Map<requestId, {task, timestamp, status, audioWaiting}>
      completedRequests: new Map()   // Map<requestId, {task, response, timestamp}>
    };

    this.addEventListener('contextmenu', evt => this.createBaseContextMenu(evt), false);
    
    this.opencodeComponent = null;
    this.realtimeComponent = null;
    this.sessionsComponent = this.get('#sessionsComponent');

    this.sharedMessagesPane = this.get('#sharedMessagesPane');

    this.currentLiveSharedMessageElement = null;
    this.currentLiveSharedMessageRole = null;

    // Track displayed messages to avoid duplicates (Map<messageId, element>)
    this.displayedMessages = this.displayedMessages || new Map();

    // Track realtime message widgets by item_id for updates
    this.realtimeMessageWidgets = this.realtimeMessageWidgets || new Map();

    // ESC key interruption state
    this.lastEscPress = 0; // Timestamp of last ESC press for double-press detection

    // Register keyboard handler for ESC key interruption
    lively.html.registerKeys(this);

    // Optional message stream backup (for debugging/replay)
    this._pendingMessages = this._pendingMessages || [];
    this._saveMessagesDebounced = (() => this.saveMessagesToStorage()).debounce(2000);

    await this.initializeWorkspaceHistory();

    await this.initializeComponents();

    await this.setupSessionsComponent();

    this.debouncedRenderSharedMessages = (() => this.renderSharedMessages()).debounce(100)

    this.debouncedRenderSharedMessages()

    this.log('AI Workspace initialized');
  }

  /**
   * Handle keyboard events - implements double-ESC press to abort message generation
   */
  onKeyDown(evt) {
    if (evt.key === 'Escape') {
      const now = Date.now();
      const timeSinceLastEsc = now - this.lastEscPress;

      // Check if this is a double-press (within 500ms)
      if (timeSinceLastEsc < 500 && timeSinceLastEsc > 0) {
        // Double ESC press detected
        evt.preventDefault();
        evt.stopPropagation();
        this.abortCurrentSession();
        this.lastEscPress = 0; // Reset after successful double-press
      } else {
        // First ESC press - just record the timestamp
        this.lastEscPress = now;
      }
    }
  }

  /**
   * Abort the current session's message generation
   * Delegates to the embedded OpenCode component
   */
  async abortCurrentSession() {
    if (!this.opencodeComponent) {
      console.log('No OpenCode component available');
      return;
    }

    // Delegate to the opencode component's abort method
    if (this.opencodeComponent.abortCurrentSession) {
      await this.opencodeComponent.abortCurrentSession();
    } else {
      lively.notify('OpenCode abort not available');
    }
  }

  /*MD ## Workspace History Management MD*/

  async initializeWorkspaceHistory() {
    if (!this.workspaceId) {
      // Try to restore most recent workspace
      try {
        const workspaces = await LivelyAiWorkspace.historydb.workspaces
          .orderBy('lastActivityTime')
          .reverse()
          .limit(1)
          .toArray();

        if (workspaces.length > 0) {
          this.workspaceId = workspaces[0].id;
          console.log('[AI Workspace] Restored workspace:', this.workspaceId);
        } else {
          // Create new workspace
          await this.createNewWorkspace();
        }
      } catch (error) {
        console.error('Failed to restore workspace:', error);
        await this.createNewWorkspace();
      }
    }
  }

  async createNewWorkspace() {
    this.workspaceId = generateUuid();
    const now = new Date();
    try {
      await LivelyAiWorkspace.historydb.workspaces.add({
        id: this.workspaceId,
        timestamp: now.toISOString(),
        lastActivityTime: now.toISOString(),
        title: null,  // Title is generated from lastActivityTime
        conversationId: null,
        opencodeSessionId: null
      });
      console.log('[AI Workspace] Created new workspace:', this.workspaceId);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  }

  /*MD ## Unified Session Management MD*/

  async createWorkspaceSession(title) {
    try {
      const now = new Date();
      const workspaceId = generateUuid();

      // Create conversation in realtime chat DB if component exists
      let conversationId = null;
      if (this.realtimeComponent) {
        conversationId = generateUuid();
        const OpenaiRealtimeChat = (await System.import('src/components/tools/openai-realtime-chat.js')).default;
        await OpenaiRealtimeChat.conversationdb.conversations.add({
          id: conversationId,
          timestamp: now.toISOString(),
          lastMessageTime: now.toISOString()
        });
        console.log('[AI Workspace] Created conversation:', conversationId);
      }

      // Create OpenCode session if component exists
      let opencodeSessionId = null;
      if (this.opencodeComponent && this.opencodeComponent.connected) {
        const result = await this.createOpenCodeSession(title);
        if (result.success) {
          opencodeSessionId = result.session.id;
          console.log('[AI Workspace] Created OpenCode session:', opencodeSessionId);
        }
      }

      // Create workspace entry linking both
      await LivelyAiWorkspace.historydb.workspaces.add({
        id: workspaceId,
        timestamp: now.toISOString(),
        lastActivityTime: now.toISOString(),
        conversationId: conversationId,
        opencodeSessionId: opencodeSessionId
      });
      console.log('[AI Workspace] Created workspace session:', workspaceId);
      return {
        success: true,
        workspaceId: workspaceId,
        conversationId: conversationId,
        opencodeSessionId: opencodeSessionId
      };

    } catch (error) {
      console.error('[AI Workspace] Failed to create workspace session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async switchWorkspaceSession(workspaceId) {
    // Clean up if in replay mode
    if (this._replayMode) {
      this.stopReplay();
    }

    // Clean up artificial session if present (recursively)
    this.cleanupArtificialSession();

    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(workspaceId);

      if (!workspace) {
        return {
          success: false,
          error: 'Workspace not found'
        };
      }
      
      // Switch conversation in realtime chat
      if (this.realtimeComponent) {
        if (workspace.conversationId) {
          await this.realtimeComponent.setConversation(workspace.conversationId);
        } else {
          this.realtimeComponent.responses.innerHTML = '<div class="empty-chat">This is an old session without audio chat data. Create a new session to continue.</div>';
        }
      }

      // Switch OpenCode session
      if (this.opencodeComponent) {
        if (workspace.opencodeSessionId) {
          // Reload sessions first to ensure we have the latest data
          await this.opencodeComponent.loadSessions();
          const session = this.opencodeComponent.sessions.find(s => s.id === workspace.opencodeSessionId);
          if (session) {
            await this.opencodeComponent.selectSession(session);
            console.log('[AI Workspace] Switched to OpenCode session:', workspace.opencodeSessionId);
          }
        } else {
          // Old workspace without opencodeSessionId - clear the display
          const container = this.opencodeComponent.get('#messagesContainer');
          if (container) {
            container.innerHTML = '<div class="empty-chat">This is an old session without code chat data. Create a new session to continue.</div>';
          }
          console.warn('[AI Workspace] Workspace has no opencodeSessionId - old session format');
        }
      }

      // Update current workspace ID
      this.workspaceId = workspaceId;

      // Clear displayed messages tracking and re-render for new session
      this.displayedMessages.clear();
      await this.debouncedRenderSharedMessages();

      // Update UI - refresh sessions list to show new active session
      await this.updateSessionUI();

      return {
        success: true,
        workspace: workspace
      };

    } catch (error) {
      console.error('[AI Workspace] Failed to switch workspace session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }


  async listWorkspaceSessions() {
    try {
      return await LivelyAiWorkspace.historydb.workspaces
        .orderBy('timestamp')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('[AI Workspace] Failed to list workspace sessions:', error);
      return [];
    }
  }


  async deleteWorkspaceSession(workspaceId) {
    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(workspaceId);
      if (!workspace) {
        return {
          success: false,
          error: 'Workspace not found'
        };
      }
      await LivelyAiWorkspace.historydb.workspaces.delete(workspaceId);
      // If this was the current workspace, switch to most recent
      if (this.workspaceId === workspaceId) {
        await this.initializeWorkspaceHistory();
      }

      console.log('[AI Workspace] Deleted workspace session:', workspaceId);
      return {
        success: true
      };

    } catch (error) {
      console.error('[AI Workspace] Failed to delete workspace session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /*MD ## Message Display Hooks MD*/


  setupRealtimeEvents() {
    this.realtimeComponent.addEventListener('realtime:create-live-user-message', (evt) => {
      this.createRealtimeMessage('user', evt.detail);
    });
    this.realtimeComponent.addEventListener('realtime:update-live-user-message', (evt) => {
      this.updateRealtimeMessage('user', evt.detail);
    });
    this.realtimeComponent.addEventListener('realtime:create-live-assistant-message', (evt) => {
      this.createRealtimeMessage('assistant', evt.detail);
    });
    this.realtimeComponent.addEventListener('realtime:update-live-assistant-message', (evt) => {
      this.updateRealtimeMessage('assistant', evt.detail);
    });
  }
  

  async createOpenCodeMessage(msg) {
    if (!this.sharedMessagesPane || !msg) return;

    const msgId = msg.info?.id;
    if (!msgId) {
      this.log(`[workspace] message has no ID, skipping`);
      return;
    }

    if (this.displayedMessages.has(msgId)) {
      this.log(`[workspace] message already displayed (id: ${msgId.substring(0, 5)}), skipping`);
      return;
    }

    // Create and append new message element
    const chatMessage = await lively.create('lively-chat-message');
    await chatMessage.setOpenCodeMessage(msg, {
      source: 'code',
      streamType: 'opencode'
    });
    chatMessage.showDebug = this.showDebug;

    this.sharedMessagesPane.appendChild(chatMessage);
    this.displayedMessages.set(msgId, chatMessage);

    this.log(`[workspace] appended OpenCode message (id: ${msgId.substring(0, 5)})`);
    this.scrollSharedPaneToBottom();
  }

  async updateOpenCodeMessage(msg) {
    if (!msg) return;

    const msgId = msg.info?.id;
    if (!msgId) return;

    const chatMessage = this.displayedMessages.get(msgId);
    if (chatMessage) {
      await chatMessage.setOpenCodeMessage(msg, {
        source: 'code',
        streamType: 'opencode'
      });
      this.log(`[workspace] updated OpenCode message (id: ${msgId.substring(0, 5)})`);
    } else {
      this.log(`[workspace] message not found for update (id: ${msgId.substring(0, 5)}), creating new`);
      await this.createOpenCodeMessage(msg);
    }
  }

  async updateOpenCodeStatusMessage(msg) {
      const {type, sessionId, status, message, timestamp} = msg;

      console.log('[workspace] OpenCode status change:', msg);

      // Update blackboard state
      this.blackboard.agentStatus = status;
      this.blackboard.lastUpdate = timestamp;

      // Update current task from session if available
      if (this.opencodeComponent.currentSession) {
        this.blackboard.currentTask = this.opencodeComponent.currentSession.title || 'Untitled session';
      }


      // Update OpenCode status indicator
      if (status === 'working') {
        this.updateOpenCodeStatus('Working', true);
        const dotEl = this.get('#opencodeDot');
        if (dotEl) dotEl.classList.add('working');
      } else if (status === 'idle') {
        this.updateOpenCodeStatus('Idle', true);
        const dotEl = this.get('#opencodeDot');
        if (dotEl) dotEl.classList.remove('working');
      }

      // Check for completed requests when agent becomes idle
      if (status === 'idle' && type === 'session.idle') {
        this.checkAndCompleteRequests();
      }

      // Notify realtime chat component
      if (this.realtimeComponent && this.realtimeComponent.onAgentStatusChange) {
        this.realtimeComponent.onAgentStatusChange({
          status: status,
          message: message,
          eventType: type,
          task: this.blackboard.currentTask,
          timestamp: timestamp
        });
      }
    
  }
  
  async updateOpenCodeMessage(msg) {
    if (!msg) return;

    const msgId = msg.info?.id;
    if (!msgId) return;

    const chatMessage = this.displayedMessages.get(msgId);
    if (chatMessage) {
      await chatMessage.setOpenCodeMessage(msg, {
        source: 'code',
        streamType: 'opencode'
      });
      this.log(`[workspace] updated OpenCode message (id: ${msgId.substring(0, 5)})`);
    } else {
      this.log(`[workspace] message not found for update (id: ${msgId.substring(0, 5)}), creating new`);
      await this.createOpenCodeMessage(msg);
    }
  }

  
  /*MD ## Shared Message Pane Rendering MD*/
  async renderSharedMessages() {
    
    
    if (!this.sharedMessagesPane || !this.workspaceId) return;

    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(this.workspaceId);
      if (!workspace) return;

      const allMessages = [];

      // Get audio messages from realtime component's database (old flat format)
      if (this.realtimeComponent && workspace.conversationId) {
        const OpenaiRealtimeChat = (await System.import('src/components/tools/openai-realtime-chat.js')).default;
        const audioMessages = await OpenaiRealtimeChat.conversationdb.messages
          .where('conversationId')
          .equals(workspace.conversationId)
          .sortBy('timestamp');

        allMessages.push(...audioMessages.map(m => ({
          ...m,
          source: 'audio',
          streamType: 'realtime',
          messageFormat: 'flat' // Mark as old flat format
        })));
      }

      // Get code messages from opencode component's memory (OpenCode format)
      if (this.opencodeComponent && workspace.opencodeSessionId) {
        const codeMessages = this.opencodeComponent.messages.get(workspace.opencodeSessionId) || [];
        allMessages.push(...codeMessages.map(m => ({
          ...m,
          source: 'code',
          streamType: 'opencode',
          messageFormat: 'opencode', // Mark as OpenCode format
          // Extract timestamp for sorting from OpenCode message structure
          timestamp: m.info?.time?.created || m.timestamp
        })));
      }

      // Sort by timestamp
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const audioCount = allMessages.filter(m=>m.source==='audio').length;
      const codeCount = allMessages.filter(m=>m.source==='code').length;

      console.log(`[AI Workspace] Rendering ${allMessages.length} messages (${audioCount} audio, ${codeCount} code)`);
      this.log(`Rendering ${allMessages.length} messages (${audioCount} audio, ${codeCount} code)`);

      // Clear and render
      this.sharedMessagesPane.innerHTML = '';
      for (const msg of allMessages) {
        const chatMessage = await lively.create('lively-chat-message');

        // Use appropriate method based on message format
        if (msg.messageFormat === 'opencode') {
          // OpenCode format with info/parts structure
          await chatMessage.setOpenCodeMessage(msg, {
            source: msg.source,
            streamType: msg.streamType
          });
        } else {
          // Flat format from realtime (role, content, timestamp)
          await chatMessage.setMessage(msg);
        }

        chatMessage.showDebug = this.showDebug;
        this.sharedMessagesPane.appendChild(chatMessage);

        // Track displayed messages
        const msgId = msg.info?.id || msg.id;
        if (msgId) {
          this.displayedMessages.set(msgId, chatMessage);
        }

        // Capture message for optional storage (if event-storage attribute enabled)
        this.captureMessageForStorage(msg);
      }

      this.scrollSharedPaneToBottom(true);

    } catch (error) {
      console.error('[AI Workspace] Failed to render shared messages:', error);
    }
  }


  // Wrapper for base class method for backwards compatibility
  isSharedPaneAtBottom(threshold = 50) {
    return this.isAtBottom(this.sharedMessagesPane, threshold);
  }

  // Wrapper for base class method for backwards compatibility
  scrollSharedPaneToBottom(force = false) {
    this.scrollToBottom(this.sharedMessagesPane, force);
  }

  /*MD ## Live Message Updates MD*/

  async updateLiveSharedMessage(role, message) {
    let text = message.content
    this.log(`[workspace] updateLiveSharedMessage(${role}, ${text})`);
    
    if (!this.currentLiveSharedMessageElement) {
      this.log(`[workspace] [${role}] WARN: no live element, skipping update`);
      return;
    }

    // Ensure we're updating the right role
    if (this.currentLiveSharedMessageRole !== role) {
      console.warn(`[AI Workspace] Role mismatch in live message update: expected ${this.currentLiveSharedMessageRole}, got ${role}`);
      this.log(`[workspace] [${role}] WARN: role mismatch (expected ${this.currentLiveSharedMessageRole})`);
      return;
    }

    // Note: Don't log every character update here, already logged in realtime hooks

    // Update the live message with new text
    await this.currentLiveSharedMessageElement.setMessage({
      role: role,
      content: text,
      source: 'audio',
      streamType: 'realtime'
    });
    this.scrollSharedPaneToBottom();
  }

  /**
   * Create a realtime message widget - clean item_id-based approach
   * @param {string} role - 'user' or 'assistant'
   * @param {Object} messageData - Message data with item_id
   */
  async createRealtimeMessage(role, messageData) {
    const item_id = messageData.item_id;
    this.log(`[workspace] createRealtimeMessage(${role}, item_id: ${item_id})`);

    // Create widget
    const widget = await lively.create('lively-chat-message');
    await widget.setMessage({
      role: role,
      content: messageData.content,
      source: 'audio',
      streamType: 'realtime'
    });
    widget.showDebug = this.showDebug;

    // Store by item_id
    this.realtimeMessageWidgets.set(item_id, widget);

    // Add to shared pane
    this.sharedMessagesPane.appendChild(widget);
    this.scrollSharedPaneToBottom();
  }

  /**
   * Update a realtime message widget - clean item_id-based lookup
   * @param {string} role - 'user' or 'assistant'
   * @param {Object} messageData - Message data with item_id
   */
  async updateRealtimeMessage(role, messageData) {
    const item_id = messageData.item_id;
    this.log(`[workspace] updateRealtimeMessage(${role}, item_id: ${item_id})`);

    // Look up widget by item_id
    const widget = this.realtimeMessageWidgets.get(item_id);
    if (!widget) {
      this.log(`[workspace] WARN: No widget found for item_id ${item_id}`);
      return;
    }

    // Update widget
    await widget.setMessage({
      role: role,
      content: messageData.content,
      source: 'audio',
      streamType: 'realtime'
    });
    this.scrollSharedPaneToBottom();
  }

  /*MD ## Message Query Methods MD*/

  async getMessageCount(workspaceId, source) {
    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(workspaceId);
      if (!workspace) return 0;

      if (source === 'audio' && workspace.conversationId) {
        const OpenaiRealtimeChat = (await System.import('src/components/tools/openai-realtime-chat.js')).default;
        return await OpenaiRealtimeChat.conversationdb.messages
          .where('conversationId')
          .equals(workspace.conversationId)
          .count();
      } else if (source === 'code' && workspace.opencodeSessionId) {
        const messages = this.opencodeComponent?.messages.get(workspace.opencodeSessionId) || [];
        return messages.length;
      }

      return 0;
    } catch (error) {
      console.error('[AI Workspace] Failed to get message count:', error);
      return 0;
    }
  }

  /**
   * Get first user audio message for workspace (from realtime DB)
   */
  async getFirstUserAudioMessage(workspaceId) {
    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(workspaceId);
      if (!workspace || !workspace.conversationId) return null;

      const OpenaiRealtimeChat = (await System.import('src/components/tools/openai-realtime-chat.js')).default;
      const messages = await OpenaiRealtimeChat.conversationdb.messages
        .where('conversationId')
        .equals(workspace.conversationId)
        .sortBy('timestamp');

      const userMessages = messages.filter(m => m.role === 'user');
      return userMessages.length > 0 ? userMessages[0].content : null;
    } catch (error) {
      console.error('[AI Workspace] Failed to get first user audio message:', error);
      return null;
    }
  }


  async initializeComponents() {
    // Create OpenCode component
    try {
      this.opencodeComponent = await lively.create('lively-opencode');
      const opencodeContainer = this.get('#opencodeContainer');
      if (opencodeContainer) {
        opencodeContainer.appendChild(this.opencodeComponent);

        this.opencodeComponent.sessionUI = false;
        this.opencodeComponent.messagesUI = false;
        this.opencodeComponent.log = (...args) => this.log(...args)
        
        this.setupOpenCodeEvents();
        this.updateOpenCodeStatus('Connected', true);
      }
    } catch (error) {
      console.error('Failed to create OpenCode component:', error);
      this.updateOpenCodeStatus('Error', false);
    }

    // Create Realtime Chat component
    try {
      this.realtimeComponent = await lively.create('openai-realtime-chat');
      const realtimeContainer = this.get('#realtimeContainer');
      if (realtimeContainer) {
        this.realtimeComponent.sessionUI = false;
        this.realtimeComponent.messagesUI = false;
        this.realtimeComponent.log = (...args) => this.log(...args)

        // Configure as workspace bridge - focused on forwarding to coding agent
        var prompt = await lively.files.loadFile(lively4url + "/src/config/prompts/ai-workspace-audio-chat.txt")
        // lively.notify("prompt", prompt)
        this.realtimeComponent.setInstructions(prompt);

        this.realtimeComponent.toolset = new WorkspaceToolset(this);

        // Setup hooks BEFORE adding to DOM to ensure they're active from the start
        this.setupRealtimeEvents();

        realtimeContainer.appendChild(this.realtimeComponent);
        this.updateRealtimeStatus('Ready', true);
      } else {
        console.error('Realtime container not found');
        this.updateRealtimeStatus('Container not found', false);
      }
    } catch (error) {
      console.error('Failed to create Realtime Chat component:', error);
      this.updateRealtimeStatus('Error', false);
    }

  }

  setupOpenCodeEvents() {
    // Listen for status changes from OpenCode component via CustomEvents
    if (!this.opencodeComponent) return;

    this.opencodeComponent.addEventListener('opencode:message-added', (evt) => {
      const { message } = evt.detail;
      if (message) {
        this.createOpenCodeMessage(message);
      } else {
        this.log('[workspace] message-added event has no message object');
      }
    });

    this.opencodeComponent.addEventListener('opencode:status-change', (evt) => {
      const { messageObj } = evt.detail;
      // Update status
      this.updateOpenCodeStatusMessage(evt.detail);
      // If there's a message update, handle it
      if (messageObj && evt.detail.type === 'message.part.updated') {
        this.updateOpenCodeMessage(messageObj);
      }
    });

    // #TODO renable it only after making sure it does not run forever, but only when it is open....
    // // Also monitor connection status via polling (lightweight check)
    // setInterval(() => {
    //   if (this.opencodeComponent) {
    //     const isConnected = this.opencodeComponent.connected;
    //     if (!isConnected) {
    //       this.updateOpenCodeStatus('Disconnected', false);
    //       this.blackboard.agentStatus = 'disconnected';
    //       this.blackboard.lastUpdate = Date.now();
    //     }
    //   }
    // }, 5000); // Check connection every 5 seconds
  }

  /*MD ## Request-Response Correlation MD*/

  /**
   * Helper: Extract text content from OpenCode message format
   * Includes text parts AND tool execution results
   */
  extractMessageContent(opencodeMessage) {
    if (!opencodeMessage || !opencodeMessage.parts) {
      return '';
    }

    const parts = [];

    for (const part of opencodeMessage.parts) {
      if (part.type === 'text') {
        // Plain text content
        parts.push(part.text);

      } else if (part.type === 'tool' && part.state?.status === 'completed' && part.state?.output) {
        // Tool execution result (includes evaluate_code, list_sessions, etc.)
        parts.push(part.state.output);

      } else if (part.type === 'tool_result') {
        // Tool result from server
        let content = '';
        if (typeof part.content === 'string') {
          content = part.content;
        } else if (Array.isArray(part.content)) {
          content = part.content
            .map(block => block.type === 'text' ? block.text : JSON.stringify(block))
            .join('\n');
        } else {
          content = JSON.stringify(part.content);
        }
        parts.push(content);
      }
      // Skip: tool_use (just the call, not result), step-start/finish (metrics)
    }

    return parts.join('\n');
  }

  checkAndCompleteRequests() {
    if (!this.opencodeComponent || !this.opencodeComponent.currentSession) {
      return;
    }

    const currentSessionId = this.opencodeComponent.currentSession.id;

    // Check each pending request
    for (const [requestId, request] of this.blackboard.pendingRequests.entries()) {
      // Only check requests for current session
      if (request.sessionId !== currentSessionId) {
        continue;
      }

      // Check if new messages have arrived since this request was sent
      const currentMessages = this.opencodeComponent.messages.get(currentSessionId) || [];

      if (currentMessages.length > request.initialMessageCount) {
        // Collect ALL new assistant messages after the request
        // OpenCode often sends multiple messages (e.g., list_sessions, then evaluate_code)
        const responses = [];
        for (let i = request.initialMessageCount; i < currentMessages.length; i++) {
          const msg = currentMessages[i];
          const role = msg.info?.role || msg.role; // Handle both OpenCode and flat format
          if (role === 'assistant') {
            responses.push(msg);
          }
        }

        if (responses.length > 0) {
          // Mark request as completed with ALL responses
          this.completeRequest(requestId, responses);
        }
      }
    }
  }


  completeRequest(requestId, responses) {
    const request = this.blackboard.pendingRequests.get(requestId);

    if (!request) {
      return; // Request not found
    }

    // Handle both single response and array of responses
    const responseArray = Array.isArray(responses) ? responses : [responses];

    // Extract and combine content from all responses
    const contentParts = responseArray.map(response => this.extractMessageContent(response));
    const content = contentParts.join('\n\n');

    console.log(`[AI Workspace] Request ${requestId} completed with ${responseArray.length} message(s):`, request.task, '→', content.substring(0, 100));

    // Move to completed requests
    // Store the last response for compatibility, but include all content
    this.blackboard.completedRequests.set(requestId, {
      task: request.task,
      response: responseArray[responseArray.length - 1], // Store last response for compatibility
      responses: responseArray, // Store all responses
      responseContent: content, // Store combined content from all messages
      timestamp: Date.now(),
      audioWaiting: request.audioWaiting
    });

    // Remove from pending
    this.blackboard.pendingRequests.delete(requestId);

    // Cleanup old completed requests (keep last 50)
    if (this.blackboard.completedRequests.size > 50) {
      const entries = Array.from(this.blackboard.completedRequests.entries());
      const toDelete = entries.slice(0, entries.length - 50);
      toDelete.forEach(([id]) => this.blackboard.completedRequests.delete(id));
    }
  }


  getRequestResponse(requestId) {
    const completed = this.blackboard.completedRequests.get(requestId);
    if (completed) {
      return completed.response;
    }

    // Check if request is still pending
    if (this.blackboard.pendingRequests.has(requestId)) {
      return null; // Still waiting
    }

    return null; // Request not found
  }


  setRequestAudioWaiting(requestId, waiting = true) {
    const request = this.blackboard.pendingRequests.get(requestId);
    if (request) {
      request.audioWaiting = waiting;
    }
  }

  /*MD ## Public API for Realtime Chat MD*/

  // #important
  async sendMessageToOpenCode(message, requestId = null) {
    if (!this.opencodeComponent) {
      return {
        success: false,
        error: 'OpenCode component not available'
      };
    }

    if (!this.opencodeComponent.connected) {
      return {
        success: false,
        error: 'OpenCode not connected to server'
      };
    }

    try {
      // If no session exists, create one
      if (!this.opencodeComponent.currentSession) {
        await this.createOpenCodeSession(`Task: ${message.substring(0, 30)}...`);
      }

      // Track request if ID provided
      if (requestId) {
        this.blackboard.pendingRequests.set(requestId, {
          task: message,
          timestamp: Date.now(),
          status: 'sent',
          audioWaiting: false,
          sessionId: this.opencodeComponent.currentSession.id,
          initialMessageCount: (this.opencodeComponent.messages.get(this.opencodeComponent.currentSession.id) || []).length
        });
      }

      // Set the message in the input and send
      const input = this.opencodeComponent.get('#messageInput');
      if (input) {
        input.value = message;
        await this.opencodeComponent.onSendButton();
      }

      // Update blackboard
      this.blackboard.currentTask = message;
      this.blackboard.agentStatus = 'working';
      this.blackboard.lastUpdate = Date.now();
      this.blackboard.lastRequestId = requestId; // Track the last request ID

      return {
        success: true,
        message: 'Task sent to OpenCode agent',
        requestId: requestId
      };

    } catch (error) {
      console.error('Error sending message to OpenCode:', error);

      // Remove from pending requests on error
      if (requestId && this.blackboard.pendingRequests.has(requestId)) {
        this.blackboard.pendingRequests.delete(requestId);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

 
  getOpenCodeStatus() {
    if (!this.opencodeComponent) {
      return {
        available: false,
        error: 'OpenCode component not available'
      };
    }

    return {
      available: true,
      connected: this.opencodeComponent.connected,
      currentSession: this.opencodeComponent.currentSession,
      sessionCount: this.opencodeComponent.sessions?.length || 0,
      serverUrl: this.opencodeComponent.serverUrl,
      blackboard: this.blackboard
    };
  }


  /**
   * Get OpenCode message history
   * NOTE: Returns messages in OpenCode format (with info/parts structure)
   */
  async getOpenCodeHistory() {
    if (!this.opencodeComponent) {
      return {
        success: false,
        error: 'OpenCode component not available'
      };
    }

    if (!this.opencodeComponent.currentSession) {
      return {
        success: false,
        error: 'No active session'
      };
    }

    try {
      const sessionId = this.opencodeComponent.currentSession.id;
      const messages = this.opencodeComponent.messages.get(sessionId) || [];

      return {
        success: true,
        sessionId: sessionId,
        messages: messages, // OpenCode format: {info: {id, role, time}, parts: [...]}
        messageFormat: 'opencode' // Indicate format for consumers
      };

    } catch (error) {
      console.error('Error getting OpenCode history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createOpenCodeSession(title) {
    if (!this.opencodeComponent) {
      return {
        success: false,
        error: 'OpenCode component not available'
      };
    }

    try {
      // Create session using OpenCode's method
      const response = await fetch(`${this.opencodeComponent.serverUrl}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title || `Session ${new Date().toLocaleTimeString()}`
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const newSession = await response.json();

      // Reload sessions and select the new one
      await this.opencodeComponent.loadSessions();
      this.opencodeComponent.selectSession(newSession);

      return {
        success: true,
        session: newSession
      };

    } catch (error) {
      console.error('Error creating OpenCode session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }



  getOpenCodeSessions() {
    if (!this.opencodeComponent) {
      return {
        success: false,
        error: 'OpenCode component not available'
      };
    }

    return {
      success: true,
      sessions: this.opencodeComponent.sessions || []
    };
  }

  /*MD ## UI Update Methods MD*/

  updateOpenCodeStatus(text, connected) {
    const statusEl = this.get('#opencodeStatus');
    const dotEl = this.get('#opencodeDot');

    if (statusEl) {
      statusEl.textContent = `OpenCode: ${text}`;
    }

    if (dotEl) {
      if (connected) {
        dotEl.classList.add('connected');
        dotEl.classList.remove('working');
      } else {
        dotEl.classList.remove('connected');
        dotEl.classList.remove('working');
      }
    }
  }

  updateRealtimeStatus(text, connected) {
    const statusEl = this.get('#realtimeStatus');
    const dotEl = this.get('#realtimeDot');

    if (statusEl) {
      statusEl.textContent = `Realtime: ${text}`;
    }

    if (dotEl) {
      if (connected) {
        dotEl.classList.add('connected');
      } else {
        dotEl.classList.remove('connected');
      }
    }
  }

  /*MD ## Button Handlers MD*/
  // (onNewSessionButton moved to Session Event Handlers section below)

  /*MD ## Sessions Component Setup MD*/

  async setupSessionsComponent() {
    if (!this.sessionsComponent) return;

    // Configure component
    this.sessionsComponent.headerTitle = "Sessions";
    this.sessionsComponent.showNewButton = true;
    this.sessionsComponent.showDeleteButtons = true;

    // Wire up event handlers
    this.sessionsComponent.addEventListener('session-selected', (evt) => {
      this.onSessionSelected(evt.detail.sessionId);
    });

    this.sessionsComponent.addEventListener('session-deleted', (evt) => {
      this.onSessionDeleted(evt.detail.sessionId);
    });

    this.sessionsComponent.addEventListener('sessions-bulk-deleted', (evt) => {
      this.onSessionsBulkDeleted(evt.detail.sessionIds);
    });

    this.sessionsComponent.addEventListener('session-created', () => {
      this.onNewSessionButton();
    });

    // Initial render
    await this.renderSessionsList();
  }

  async renderSessionsList() {
    if (!this.sessionsComponent) return;

    const sessions = await this.listWorkspaceSessions();

    // Get message counts and first user message for each session
    const sessionsWithData = await Promise.all(sessions.map(async session => {
      const audioCount = await this.getMessageCount(session.id, 'audio');
      const codeCount = await this.getMessageCount(session.id, 'code');
      const firstMessage = await this.getFirstUserAudioMessage(session.id);

      const createdDate = new Date(session.timestamp);

      // Generate title from first user message if available
      let title = '';
      if (firstMessage) {
        const truncatedMessage = firstMessage.length > 50
          ? firstMessage.substring(0, 50) + '...'
          : firstMessage;
        title = truncatedMessage;
      } else {
        // Fallback to date-based title if no message
        title = this.generateSessionTitle(createdDate);
      }

      return {
        id: session.id,
        title: title,
        timestamp: session.timestamp,
        lastActivityTime: session.lastActivityTime,
        audioMessages: audioCount,
        codeMessages: codeCount,
        messageCount: audioCount + codeCount
      };
    }));

    // Update component
    this.sessionsComponent.sessions = sessionsWithData;
    this.sessionsComponent.activeSessionId = this.workspaceId;
  }

  async updateSessionUI() {
    // Called after switching sessions - refresh the sessions list to update active state
    await this.renderSessionsList();
    console.log('[AI Workspace] Session UI updated');
  }

  /*MD ## Session Event Handlers MD*/

  async onSessionSelected(sessionId) {
    // Don't switch if already active
    if (sessionId === this.workspaceId) return;

    await this.switchWorkspaceSession(sessionId);
    lively.success('Session switched');
  }

  async onSessionDeleted(sessionId) {
    if (await lively.confirm('Delete this session? This will delete all messages and events.')) {
      const result = await this.deleteWorkspaceSession(sessionId);
      if (result.success) {
        await this.renderSessionsList();
        lively.success('Session deleted');
      } else {
        lively.warn('Failed to delete session', result.error);
      }
    }
  }

  async onSessionsBulkDeleted(sessionIds) {
    // Already confirmed in the component
    const results = await Promise.all(
      sessionIds.map(id => this.deleteWorkspaceSession(id))
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    await this.renderSessionsList();

    if (failCount === 0) {
      lively.success(`${successCount} session(s) deleted`);
    } else {
      lively.warn(`${successCount} deleted, ${failCount} failed`);
    }
  }

  async onNewSessionButton() {
    // Clean up if in replay mode
    if (this._replayMode) {
      this.stopReplay();
    }

    // Clean up artificial session if present (recursively)
    this.cleanupArtificialSession();

    // Auto-create session without prompting
    const result = await this.createWorkspaceSession(null);

    if (result.success) {
      // Switch to the new session
      await this.switchWorkspaceSession(result.workspaceId);

      // Update sessions list
      await this.renderSessionsList();

      lively.success('New session created');
    } else {
      lively.warn('Failed to create session', result.error);
    }
  }


  generateSessionTitle(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Check if today, yesterday, or older
    if (sessionDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (sessionDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      // Format as "Mon, Jan 15" or "Jan 15, 2024" if different year
      const options = date.getFullYear() === now.getFullYear()
        ? { weekday: 'short', month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  }

  /*MD ## Context Menu MD*/
  // Override base class method to add component-specific menu items
  /*MD ## Unified Event Capture and Replay MD*/

  /**
   * Export unified chat history with compacted verbose fields
   * Same as exportChatHistory but removes long instructions and tool definitions
   */
  async getCapturedEvents() {
    const allEvents = [];
    if (this.realtimeComponent && this.realtimeComponent._eventCapture) {
      const realtimeEvents = this.realtimeComponent._eventCapture.map(event => ({
        ...event,
        source: 'realtime'
      }));
      allEvents.push(...realtimeEvents);
    }
    if (this.opencodeComponent && this.opencodeComponent._eventCapture) {
      const opencodeEvents = this.opencodeComponent._eventCapture.map(event => ({
        ...event,
        source: 'opencode'
      }));
      allEvents.push(...opencodeEvents);
    }
    allEvents.sort((a, b) => a.timestamp - b.timestamp);
    return allEvents
  }

  _getEventsForExport() {
    const allEvents = [];

    if (this.realtimeComponent?._eventCapture) {
      allEvents.push(...this.realtimeComponent._eventCapture.map(e => ({ ...e, source: 'realtime' })));
    }

    if (this.opencodeComponent?._eventCapture) {
      allEvents.push(...this.opencodeComponent._eventCapture.map(e => ({ ...e, source: 'opencode' })));
    }

    return allEvents.sort((a, b) => a.timestamp - b.timestamp);
  }

  /*MD ## Unified Replay Controls MD*/

  /**
   * Show replay controls in workspace (suppress in embedded components)
   */
  showReplayControls() {
    // Suppress controls in embedded components
    if (this.realtimeComponent) this.realtimeComponent._suppressReplayControls = true;
    if (this.opencodeComponent) this.opencodeComponent._suppressReplayControls = true;

    // Delegate to base class which uses the placeholder
    super.showReplayControls();
  }

  /**
   * Handle pause/resume button - sync to both components
   */
  onReplayPauseButton(evt) {
    this._replayPaused = !this._replayPaused;

    // Sync to both components
    if (this.realtimeComponent) this.realtimeComponent._replayPaused = this._replayPaused;
    if (this.opencodeComponent) this.opencodeComponent._replayPaused = this._replayPaused;

    // Update button label
    const btn = this.get('#replayPauseButton');
    if (btn) {
      btn.textContent = this._replayPaused ? '▶️ Resume' : '⏸️ Pause';
    }

    this.log(`[workspace] ${this._replayPaused ? 'Paused' : 'Resumed'} replay`);
  }

  /**
   * Handle stop button - stop both components
   */
  onReplayStopButton(evt) {
    if (this.realtimeComponent) this.realtimeComponent.stopReplay();
    if (this.opencodeComponent) this.opencodeComponent.stopReplay();

    this.hideReplayControls();
    lively.notify('Replay stopped');
    this.log('[workspace] Stopped replay');
  }

  /**
   * Handle speed change - sync to both components
   */
  onReplaySpeedChange(evt) {
    this._replaySpeed = parseFloat(evt.target.value);

    // Sync to both components
    if (this.realtimeComponent) this.realtimeComponent._replaySpeed = this._replaySpeed;
    if (this.opencodeComponent) this.opencodeComponent._replaySpeed = this._replaySpeed;

    const speedText = this._replaySpeed === 0 ? 'Instant' : `${this._replaySpeed}x`;
    this.log(`[workspace] Speed changed to ${speedText}`);
  }

  /**
   * Update progress - aggregate from both sources
   */
  updateReplayProgress(current, total) {
    // Aggregate from both sources
    const realtimeCurrent = this.realtimeComponent?._replayCurrentEvent || 0;
    const realtimeTotal = this.realtimeComponent?._replayTotalEvents || 0;
    const opencodeCurrent = this.opencodeComponent?._replayCurrentEvent || 0;
    const opencodeTotal = this.opencodeComponent?._replayTotalEvents || 0;

    const totalCurrent = realtimeCurrent + opencodeCurrent;
    const totalEvents = realtimeTotal + opencodeTotal;

    const progress = this.get('#replayProgress');
    if (progress) {
      progress.textContent = `${totalCurrent}/${totalEvents} events`;
    }
  }

  /**
   * Enable replay mode: disable inputs, clear UI, create artificial workspace
   */
  enableReplay() {
    // Set replay mode flag
    this._replayMode = true;

    // Create artificial workspace ID (don't persist to historydb)
    const replayWorkspaceId = `replay-workspace-${Date.now()}`;
    this.workspaceId = replayWorkspaceId;

    // Clear workspace UI for fresh replay
    const sharedPane = this.get('#sharedMessagesPane');
    if (sharedPane) {
      sharedPane.innerHTML = '';
    }
    if (this.displayedMessages) {
      this.displayedMessages.clear();
    }
    if (this.realtimeMessageWidgets) {
      this.realtimeMessageWidgets.clear();
    }

    // Disable workspace controls during replay
    const newSessionBtn = this.get('#newSessionButton');
    if (newSessionBtn) newSessionBtn.disabled = true;

    // Suppress replay controls in child components (use unified controls)
    if (this.realtimeComponent) {
      this.realtimeComponent._suppressReplayControls = true;
    }
    if (this.opencodeComponent) {
      this.opencodeComponent._suppressReplayControls = true;
    }

    return replayWorkspaceId;
  }

  /**
   * Disable replay mode: re-enable inputs (but keep artificial session visible)
   */
  disableReplay() {
    this._replayMode = false;

    // Re-enable workspace controls
    const newSessionBtn = this.get('#newSessionButton');
    if (newSessionBtn) newSessionBtn.disabled = false;
  }

  /**
   * Clean up artificial replay session (recursively cleans embedded components)
   */
  cleanupArtificialSession() {
    if (this.workspaceId?.startsWith('replay-')) {
      this.workspaceId = null;

      // Clear workspace UI
      const sharedPane = this.get('#sharedMessagesPane');
      if (sharedPane) sharedPane.innerHTML = '';
      if (this.displayedMessages) this.displayedMessages.clear();
      if (this.realtimeMessageWidgets) this.realtimeMessageWidgets.clear();

      // Recursively clean up embedded components
      if (this.realtimeComponent) {
        this.realtimeComponent.cleanupArtificialSession();
      }
      if (this.opencodeComponent) {
        this.opencodeComponent.cleanupArtificialSession();
      }
    }
  }

  /**
   * Replay events from an array - dispatches to appropriate component
   * Filters events by source and replays them in their respective components
   *
   * @param {Array} events - Array of event objects with source tags
   */
  replayEventsFromArray(events) {
    // Separate events by source
    const realtimeEvents = events.filter(e => e.source === 'realtime');
    const opencodeEvents = events.filter(e => e.source === 'opencode');

    // Validate we have components for the events
    if (realtimeEvents.length > 0 && !this.realtimeComponent) {
      lively.warn(`Found ${realtimeEvents.length} realtime events but no realtime component`);
    }

    if (opencodeEvents.length > 0 && !this.opencodeComponent) {
      lively.warn(`Found ${opencodeEvents.length} opencode events but no opencode component`);
    }

    // Initialize replay state
    this._replayPaused = false;
    this._replaySpeed = 1;

    // Enable replay mode (disables inputs, clears UI, creates artificial workspace)
    const replayWorkspaceId = this.enableReplay();

    // Show unified controls
    this.showReplayControls();

    // Replay in each component independently
    if (realtimeEvents.length > 0 && this.realtimeComponent) {
      lively.notify(`Replaying ${realtimeEvents.length} realtime events...`);
      this.realtimeComponent.replayEventsFromArray(realtimeEvents);
    }

    if (opencodeEvents.length > 0 && this.opencodeComponent) {
      lively.notify(`Replaying ${opencodeEvents.length} opencode events...`);
      this.opencodeComponent.replayEventsFromArray(opencodeEvents);
    }

    if (realtimeEvents.length === 0 && opencodeEvents.length === 0) {
      lively.warn("No events with 'realtime' or 'opencode' source found");
    }

    // Poll for progress updates
    this._progressInterval = setInterval(() => {
      this.updateReplayProgress();

      // Check if both components are done
      const realtimeDone = !this.realtimeComponent?._replayMode;
      const opencodeDone = !this.opencodeComponent?._replayMode;

      if (realtimeDone && opencodeDone) {
        clearInterval(this._progressInterval);

        // Disable replay mode (re-enables inputs, keeps artificial session)
        this.disableReplay();

        this.hideReplayControls();
        lively.success('Unified replay complete');
      }
    }, 100);
  }

  /*MD ## Message Stream Backup (Optional Debug Feature) MD*/

  get isEventStorageEnabled() {
    return this.getAttribute('event-storage') !== 'disabled';
  }

  captureMessageForStorage(message) {
    if (!this.isEventStorageEnabled) return;

    try {
      // Compact the message using base class method
      let compactedMessage = JSON.parse(JSON.stringify(message));
      this.compactEventData(compactedMessage);

      // Add to pending buffer
      this._pendingMessages.push(compactedMessage);

      // Trigger debounced save
      this._saveMessagesDebounced();
    } catch (error) {
      console.error('[AI Workspace] Failed to capture message:', error);
    }
  }

  async saveMessagesToStorage() {
    if (!this.isEventStorageEnabled || !this.workspaceId) return;
    if (this._pendingMessages.length === 0) return;

    try {
      // Read current workspace record
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(this.workspaceId);
      if (!workspace) {
        console.warn('[AI Workspace] Cannot save messages: workspace not found');
        return;
      }

      // Get existing messagesArray or initialize empty array
      const existingMessages = workspace.messagesArray || [];

      // Append pending messages
      const updatedMessages = [...existingMessages, ...this._pendingMessages];

      // Update workspace record
      await LivelyAiWorkspace.historydb.workspaces.update(this.workspaceId, {
        messagesArray: updatedMessages,
        lastActivityTime: new Date().toISOString()
      });

      console.log(`[AI Workspace] Saved ${this._pendingMessages.length} messages to storage (total: ${updatedMessages.length})`);

      // Clear pending buffer
      this._pendingMessages = [];
    } catch (error) {
      console.error('[AI Workspace] Failed to save messages to storage:', error);
    }
  }

  async copyMessageStream() {
    if (!this.workspaceId) {
      lively.warn('No active workspace');
      return;
    }

    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(this.workspaceId);
      if (!workspace || !workspace.messagesArray || workspace.messagesArray.length === 0) {
        lively.warn('No messages stored for this workspace');
        return;
      }

      // Convert to JSONL (one JSON per line)
      const jsonl = workspace.messagesArray.map(msg => JSON.stringify(msg)).join('\n');

      await navigator.clipboard.writeText(jsonl);
      lively.success(`Copied ${workspace.messagesArray.length} messages to clipboard`);
    } catch (error) {
      console.error('[AI Workspace] Failed to copy message stream:', error);
      lively.error('Failed to copy message stream');
    }
  }

  async replayMessageStream() {
    if (!this.workspaceId) {
      lively.warn('No active workspace');
      return;
    }

    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(this.workspaceId);
      if (!workspace || !workspace.messagesArray || workspace.messagesArray.length === 0) {
        lively.warn('No messages stored for this workspace');
        return;
      }

      // Convert messages to event format for replay
      // Wrap each message as an event with source metadata
      const events = workspace.messagesArray.map(msg => ({
        type: msg.source === 'audio' ? 'realtime' : 'opencode',
        data: msg,
        timestamp: msg.timestamp || msg.info?.time?.created
      }));

      // Use existing replay infrastructure
      await this.replayEventsFromArray(events);
      lively.success(`Replaying ${events.length} messages`);
    } catch (error) {
      console.error('[AI Workspace] Failed to replay message stream:', error);
      lively.error('Failed to replay message stream');
    }
  }

  /**
   * Clear stored messages for current workspace
   */
  async clearMessageStream() {
    if (!this.workspaceId) {
      lively.warn('No active workspace');
      return;
    }

    try {
      // Clear messagesArray in workspace record
      await LivelyAiWorkspace.historydb.workspaces.update(this.workspaceId, {
        messagesArray: []
      });

      // Clear pending buffer
      this._pendingMessages = [];

      lively.success('Message stream cleared');
    } catch (error) {
      console.error('[AI Workspace] Failed to clear message stream:', error);
      lively.error('Failed to clear message stream');
    }
  }

  getContextMenuItems() {
    const items = [
      [" Show Audio Tools", () => {
        const hideAudioTools = this.getAttribute("hide-audio-tools") === "true";
        this.setAttribute("hide-audio-tools", hideAudioTools ? "false" : "true");
      }, "", this.generateToggleIcon(this.getAttribute("hide-audio-tools") !== "true")],
      [" Show Code Tools", () => {
        const hideCodeTools = this.getAttribute("hide-code-tools") === "true";
        this.setAttribute("hide-code-tools", hideCodeTools ? "false" : "true");
      }, "", this.generateToggleIcon(this.getAttribute("hide-code-tools") !== "true")]
    ];

    // Add message stream items
    if (this.isEventStorageEnabled) {
      items.push(
        ["---"], // Separator
        ["Copy Message Stream", () => this.copyMessageStream()],
        ["Replay Message Stream", () => this.replayMessageStream()],
        ["Clear Message Stream", () => this.clearMessageStream()],
        [" Event Storage", () => {
          this.setAttribute('event-storage', 'disabled');
          lively.success('Event storage disabled');
        }, "", this.generateToggleIcon(true)]
      );
    } else {
      items.push(
        ["---"], // Separator
        [" Event Storage", () => {
          this.removeAttribute('event-storage');
          lively.success('Event storage enabled');
        }, "", this.generateToggleIcon(false)]
      );
    }

    return items;
  }
  
   /*MD ## Lifecycle Methods MD*/
  livelyMigrate(other) {
    super.livelyMigrate(other)
    this.blackboard = other.blackboard
    this.workspaceId = other.workspaceId || null;
    this.realtimeMessageWidgets = other.realtimeMessageWidgets || new Map();
    this._pendingMessages = other._pendingMessages || [];
  }

}
