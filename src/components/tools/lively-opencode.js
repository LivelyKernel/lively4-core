import LivelyChat from 'src/components/tools/lively-chat.js';
import Dexie from "src/external/dexie3.js";

/*MD
# Lively OpenCode Agent

OpenCode.ai agent chat interface that connects to OpenCode server for AI-powered development assistance.

**Architecture:**
- RESTful API connection to OpenCode server (default: http://localhost:9100)
- Server-sent events (SSE) for real-time message streaming
- Session management for organizing conversations
- Simple chat interface with message history
- IndexedDB cache for session metadata (message counts, timestamps)

**Features:**
- Create and manage multiple chat sessions
- Send messages to AI agent
- Real-time streaming responses via EventSource
- Session switching and history
- Cached message counts in session list

AVOID using: displayMessages, use it only on reload etc. #TODO

MD*/



import ContextMenu from 'src/client/contextmenu.js';

export default class LivelyOpencode extends LivelyChat {

  // Shared server state across all instances
  static sharedServerTerminal = null;
  static sharedServerRunning = false;

  /**
   * IndexedDB for caching session metadata (message counts, timestamps)
   * Note: Server is source of truth for actual messages - this is metadata cache only
   */
  static get sessionMetaDB() {
    var db = new Dexie("opencode-session-metadata");
    db.version(1).stores({
      sessionMeta: 'sessionId, messageCount, lastUpdated, lastMessageTime'
    }).upgrade(function () {});
    return db;
  }

  // Override base class method to update message debug state
  updateOpenCodeMessagesDebugState() {
    const container = this.get('#messagesContainer');
    if (container) {
      Array.from(container.querySelectorAll("lively-chat-message")).forEach(ea => {
        ea.showDebug = this.showDebug;
      });
    }
  }

  async initialize() {
    // Call parent initialize to setup event capture system
    await super.initialize();

    this.windowTitle = "OpenCode Agent";
    this.registerButtons();

    // Server configuration
    this.serverUrl = 'http://localhost:9100';

    // Session state
    this.sessions = [];
    this.currentSession = null;
    this.messages = new Map(); // sessionId -> messages array (pure server data)
    this.temporaryMessages = new Map(); // sessionId -> temporary UI messages
    this.messageElements = this.messageElements || new Map(); // messageId -> DOM element for fast updates

    // Set event source for capture system (parent class property)
    this.eventSource = 'opencode';

    // SSE Connection state
    this.sseConnection = null;
    this.connected = false;
    this.shouldReconnect = true;
    this.reconnectTimer = null;

    // ESC key interruption state
    this.lastEscPress = 0; // Timestamp of last ESC press for double-press detection
    this.isGenerating = false; // Track if AI is currently generating response

    // Event capture already initialized by parent, but preserve existing logic for safety
    // this._eventCapture and this._replayMode are set by parent's initialize()

    // Update UI
    this.updateStatus('Connecting...', false);
    this.updateServerButton();

    // Initialize debug log visibility (controlled by showDebug property)
    this.setAttribute("hide-debug-log", this.showDebug ? "false" : "true");

    this.addEventListener('contextmenu', evt => this.createBaseContextMenu(evt), false);

    // Setup input handling using base class method
    this.setupInputHandling('#messageInput', this.onSendButton);

    // Setup sessions component
    this.setupSessionsComponent();

    // Register keyboard handler for ESC key interruption
    lively.html.registerKeys(this);

    // Also add ESC handler to message input for when it has focus
    const messageInput = this.get('#messageInput');
    if (messageInput) {
      messageInput.addEventListener('keydown', evt => this.onKeyDown(evt));
    }
  }

  connectedCallback() {
    this.shouldReconnect = true;
    // Connect to OpenCode server
    this.connectToServer();
  }

  disconnectedCallback() {
    this.disconnectFromServer();
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
   * Uses OpenCode API: POST /session/:id/abort
   */
  async abortCurrentSession() {
    lively.notify("abortCurrentSession")
    if (!this.currentSession) {
      lively.notify('No active session to abort');
      return;
    }

    if (!this.isGenerating) {
      lively.notify('No active generation to abort');
      return;
    }

    try {
      this.log(`Aborting session ${this.currentSession.id}...`);
      const response = await fetch(`${this.serverUrl}/session/${this.currentSession.id}/abort`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to abort session: ${response.status}`);
      }

      lively.notify('Message generation aborted');
      this.isGenerating = false;

    } catch (error) {
      console.error('Error aborting session:', error);
      lively.error(`Failed to abort: ${error.message}`);
    }
  }

  async connectToServer() {
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      // First check if server is available
      const response = await fetch(`${this.serverUrl}/config`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      this.updateStatus('Connected', true);
      this.connected = true;

      // Load existing sessions
      await this.loadSessions();

      // Connect to event stream
      this.connectEventStream();

      lively.success('Connected to OpenCode server');

    } catch (error) {
      this.updateStatus('Disconnected', false);
      this.connected = false;
      
      // Auto-reconnect after 5 seconds if not intentionally disconnected
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          // this.log('Attempting to reconnect to OpenCode server...');
          this.updateStatus('Reconnecting...', false);
          this.connectToServer();
        }, 5000);
      }
    }
  }

  disconnectFromServer() {
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
    }

    this.connected = false;
    this.updateStatus('Disconnected', false);
  }

  connectEventStream() {
    if (this.sseConnection) {
      this.sseConnection.close();
    }

    try {
      this.sseConnection = new EventSource(`${this.serverUrl}/event`);

      this.sseConnection.onopen = () => {
        this.log('EventSource connected');
      };

      this.sseConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (error) {
          console.error('Error parsing event data:', error);
        }
      };

      this.sseConnection.onerror = (error) => {
        console.error('EventSource error:', error);
        // EventSource will automatically try to reconnect
      };

    } catch (error) {
      console.error('Failed to connect event stream:', error);
    }
  }

  handleEvent(data, replaySessionId = null) {
    // Log all events for debugging
    // this.log('[opencode] handleEvent', data);

    let sessionId = replaySessionId; // Use replay session if provided
    if (!sessionId) {
      // Extract session ID from event data (normal live mode)
      if (data.type === 'message.updated') {
        sessionId = data.properties?.info?.sessionID;
      } else if (data.type === 'message.part.updated') {
        sessionId = data.properties?.part?.sessionID;
      } else if (data.type === 'session.idle' || data.type === 'session.updated') {
        sessionId = data.properties?.sessionID;
      }
    }

    // Capture event for replay (skip if in replay mode)
    if (!this._replayMode && sessionId) {
      this.captureEvent('sse', data, sessionId);
    }

    // Handle different event types from OpenCode server
    if (data.type === 'message.updated') {
      // Message updated - update specific message in memory
      if (sessionId && this.currentSession && this.currentSession.id === sessionId) {
        const messageInfo = data.properties?.info;
        if (messageInfo) {
          this.updateOpenCodeMessageFromEvent(sessionId, messageInfo);
        }
      }
    } else if (data.type === 'message.part.updated') {
      if (sessionId && this.currentSession && this.currentSession.id === sessionId) {
        const part = data.properties?.part;
        if (part) {
          this.updateOpenCodePart(sessionId, part);
        }
      }
    } else if (data.type === 'session.updated' || data.type === 'session.idle') {
      if (data.type === 'session.idle' && sessionId === this.currentSession?.id) {
        this.isGenerating = false;
      }
    } else if (data.type === 'session') {
      this.loadSessions();
    }

    const statusInfo = this.inferStatusFromEvent(data, sessionId);
    if (statusInfo) {
      this.dispatchMessageEvent('opencode:status-change', statusInfo);
    }
  }

  inferStatusFromEvent(data, sessionId) {
    // Only emit events for current session
    if (sessionId && this.currentSession && this.currentSession.id !== sessionId) {
      return null;
    }

    let status = null;
    let statusMessage = '';
    let messageObj = null;

    switch(data.type) {
      case 'message.updated':
        status = 'working';
        statusMessage = 'Agent is responding';
        // Find the message in the store
        if (sessionId && data.properties?.info?.id) {
          const messages = this.messages.get(sessionId);
          if (messages) {
            messageObj = messages.find(m => m.info?.id === data.properties.info.id);
          }
        }
        break;
      case 'message.part.updated':
        status = 'working';
        statusMessage = 'Agent is generating response';
        // Find the message being updated
        if (sessionId && data.properties?.part?.messageID) {
          const messages = this.messages.get(sessionId);
          if (messages) {
            messageObj = messages.find(m => m.info?.id === data.properties.part.messageID);
          }
        }
        break;
      case 'session.idle':
        status = 'idle';
        statusMessage = 'Agent finished task';
        break;
      case 'session.updated':
        status = 'updated';
        statusMessage = 'Session updated';
        break;
      default:
        return null; // Don't emit for other event types
    }

    return {
      type: data.type,
      sessionId: sessionId,
      status: status,
      message: statusMessage,
      messageObj: messageObj, // Include the full message object if available
      timestamp: Date.now()
    };
  }

  async loadSessions() {
    if (this._replayMode) return; // Skip server fetch during replay

    try {
      const response = await fetch(`${this.serverUrl}/session`);
      if (!response.ok) {
        throw new Error(`Failed to load sessions: ${response.status}`);
      }

      this.sessions = await response.json();
      await this.updateSessionList();

    } catch (error) {
      console.error('Error loading sessions:', error);
      lively.error('Failed to load sessions');
    }
  }

  /*MD ## Sessions Component Setup MD*/

  setupSessionsComponent() {
    const sessionsComponent = this.get('#sessionsComponent');
    if (!sessionsComponent) return;

    // Configure component
    sessionsComponent.headerTitle = "Sessions";
    sessionsComponent.showNewButton = true;
    sessionsComponent.showDeleteButtons = true;

    // Wire up event handlers
    sessionsComponent.addEventListener('session-selected', (evt) => {
      const session = this.sessions.find(s => s.id === evt.detail.sessionId);
      if (session) this.selectSession(session);
    });

    sessionsComponent.addEventListener('session-created', () => {
      this.onNewSessionButton();
    });

    sessionsComponent.addEventListener('session-deleted', (evt) => {
      this.onSessionDeleted(evt.detail.sessionId);
    });

    sessionsComponent.addEventListener('sessions-bulk-deleted', (evt) => {
      this.onSessionsBulkDeleted(evt.detail.sessionIds);
    });
  }

  async updateSessionList() {
    const sessionsComponent = this.get('#sessionsComponent');
    if (!sessionsComponent) return;

    // Load cached metadata for all sessions
    const metadataMap = await this.loadAllSessionMetadata();

    // Map sessions to component format with cached message counts
    const sessionsData = this.sessions.map(session => {
      const metadata = metadataMap.get(session.id);
      return {
        id: session.id,
        title: session.title || 'Untitled',
        timestamp: session.time?.updated || session.time?.created || null,
        messageCount: metadata?.messageCount
      };
    });

    // Update component
    sessionsComponent.sessions = sessionsData;
    sessionsComponent.activeSessionId = this.currentSession?.id;
  }

  /**
   * Load all session metadata from IndexedDB
   * @returns {Map<string, Object>} Map of sessionId -> metadata
   */
  async loadAllSessionMetadata() {
    try {
      const allMetadata = await LivelyOpencode.sessionMetaDB.sessionMeta.toArray();
      const metadataMap = new Map();
      for (const meta of allMetadata) {
        metadataMap.set(meta.sessionId, meta);
      }
      return metadataMap;
    } catch (error) {
      console.error('Error loading session metadata:', error);
      return new Map(); // Return empty map on error
    }
  }

  async selectSession(session) {
    // Clean up if in replay mode
    if (this._replayMode) {
      this.stopReplay();
    }

    // Clean up artificial session if present
    this.cleanupArtificialSession();

    this.currentSession = session;
    await this.updateSessionList();

    // Clear event capture buffer when switching sessions
    // This ensures "Copy chat history" only contains events for the current session
    this._eventCapture = [];

    // Load messages for this session
    await this.loadMessagesForSession(session.id);

    // Enable input
    const input = this.get('#messageInput');
    if (input) input.disabled = false;

    // Display messages
    this.displayMessages();
  }

  /**
   * Update a specific message from an event
   * This creates or updates the message structure (role, timestamp, etc.)
   * Parts come later through message.part.updated events
   */
  updateOpenCodeMessageFromEvent(sessionId, messageInfo) {
    // this.log("[opencode] updateOpenCodeMessageFromEvent", messageInfo)
    const msgId = this.truncateMsgId(messageInfo?.id);
    

    const messages = this.messages.get(sessionId);
    if (!messages) {
      console.warn('[opencode] No messages array for session:', sessionId);
      return;
    }

    // Clear temporary messages when first server message arrives
    // This prevents duplicate user messages (temporary + server version)
    if (this.temporaryMessages.has(sessionId)) {
      const tempMsgs = this.temporaryMessages.get(sessionId);
      if (tempMsgs && tempMsgs.length > 0) {
        this.clearTemporaryMessages(sessionId);
      }
    }

    // Find existing message or create new one
    let messageIndex = messages.findIndex(m => m.info?.id === messageInfo.id);

    if (messageIndex >= 0) {
      // Update existing message info
      messages[messageIndex].info = messageInfo;
      // No UI update needed - the message is already in the UI, parts will update it
    } else {
      // Create new message with info (parts will be added by message.part.updated)
      const newMsg = {
        info: messageInfo,
        parts: []
      };
      messages.push(newMsg);
      // this.log('[opencode] Created message from message.updated:', msgId, 'role:', messageInfo.role);

      // Add the new message to UI incrementally
      this.renderMessage(newMsg);

      // Update cached metadata (increment message count)
      this.incrementCachedMessageCount(sessionId, messageInfo);

      // Dispatch event for workspace integration
      this.dispatchMessageEvent('opencode:message-added', {
          sessionId,
          role: messageInfo.role,
          timestamp: Date.now(), // use our own time... to compare make it compatible with realtime-chat
          type: 'opencode',
          metadata: { id: messageInfo.id },
          message: newMsg // Include the full message for direct access
        });
    }
  }

  /**
   * Update a specific part from an event - SIMPLIFIED to work with OpenCode messages
   */
  updateOpenCodePart(sessionId, part) {
    // this.log("[opencode] updateOpenCodePart " + part.type + " " + part.state?.status) 
    const messages = this.messages.get(sessionId);
    if (!messages) return;

    const msgId = this.truncateMsgId(part.messageID);
    // this.log('message.part', part, `message.part.updated (type: ${part.type}, id: ${msgId})`);

    const messageId = part.messageID;
    const partType = part.type;

    if (partType === 'text') {
      // Text streaming - update directly from event data
      // this.log('[opencode] Text part streaming:', part.text?.substring(0, 50));

      // Find or create the message
      let messageIndex = messages.findIndex(m => m.info?.id === messageId);

      if (messageIndex >= 0) {
        // Update existing message's text part
        const msg = messages[messageIndex];
        let textPart = msg.parts.find(p => p.type === 'text' && p.id === part.id);
        if (textPart) {
          textPart.text = part.text || '';
        } else {
          msg.parts.push({ type: 'text', text: part.text || '', id: part.id });
        }
        this.updateOpenCodeMessage(messageId, msg);
      } else {
        // Message doesn't exist yet - this shouldn't happen if events arrive in order
        // message.updated should create the message before message.part.updated
        console.warn('[OpenCode] Text part arrived before message.updated event:', messageId);
        
        // During replay, skip - the message.updated event should arrive soon
        return;
      }

    } else if (partType === 'tool') {
      // Tool execution status update
      const state = part.state?.status || 'unknown';
      const toolName = part.tool || 'unknown';

      // this.log('[OpenCode] Tool status:', toolName, state);

      let messageIndex = messages.findIndex(m => m.info?.id === messageId);

      if (messageIndex >= 0) {
        // Add or update a temporary tool status part
        const msg = messages[messageIndex];
        let toolPart = msg.parts.find(p => p.callID === part.callID);
        if (toolPart) {
          toolPart.state = part.state;
          toolPart.tool = toolName;
        } else {
          msg.parts.push({
            type: 'tool',
            callID: part.callID,
            tool: toolName,
            state: part.state
          });
        }
        this.updateOpenCodeMessage(messageId, msg);
      } 
    }
    // For tool_use/tool_result: these come from server fetch after tool completion
  }

  // #important
  async loadMessageById(sessionId, messageId) {
    if (this._replayMode) return; // Skip server fetch during replay

    try {
      const response = await fetch(`${this.serverUrl}/session/${sessionId}/message/${messageId}`);
      if (!response.ok) {
        throw new Error(`Failed to load message: ${response.status}`);
      }

      const msg = await response.json();
      this.log('[opencode] Loaded single message:', messageId, 'parts:', msg.parts.map(p => p.type));

      const messages = this.messages.get(sessionId) || [];

      // SIMPLIFIED: Check if we already have this message, if so update it, otherwise add it
      const existingIndex = messages.findIndex(m => m.info?.id === msg.info.id);

      if (existingIndex >= 0) {
        // Update existing message with new data
        messages[existingIndex] = msg;
        this.log('[opencode] Updated existing message:', messageId);
      } else {
        // Add new message
        messages.push(msg);
        this.log('[opencode] Added new message:', messageId);
      }

      this.messages.set(sessionId, messages);

    } catch (error) {
      console.error('Error loading message:', error);
    }
  }

  /**
   * Cache session metadata (message count, timestamps) to IndexedDB
   * @param {string} sessionId - Session ID
   * @param {Array} opencodeMessages - Array of OpenCode messages
   */
  async cacheSessionMetadata(sessionId, opencodeMessages) {
    try {
      // Find the most recent message timestamp
      let lastMessageTime = null;
      if (opencodeMessages.length > 0) {
        // Get the most recent timestamp from message.info.time.created
        const timestamps = opencodeMessages
          .map(msg => msg.info?.time?.updated || msg.info?.time?.created)
          .filter(t => t != null);
        if (timestamps.length > 0) {
          lastMessageTime = Math.max(...timestamps);
        }
      }

      const metadata = {
        sessionId: sessionId,
        messageCount: opencodeMessages.length,
        lastUpdated: Date.now(),
        lastMessageTime: lastMessageTime
      };

      await LivelyOpencode.sessionMetaDB.sessionMeta.put(metadata);
      this.log('[opencode] Cached metadata for session:', sessionId, metadata);
    } catch (error) {
      console.error('Error caching session metadata:', error);
      // Non-fatal - continue without cache
    }
  }

  /**
   * Increment cached message count when a new message arrives
   * @param {string} sessionId - Session ID
   * @param {Object} messageInfo - Message info object with timestamp
   */
  async incrementCachedMessageCount(sessionId, messageInfo) {
    try {
      const existing = await LivelyOpencode.sessionMetaDB.sessionMeta.get(sessionId);

      const messageTime = messageInfo.time?.updated || messageInfo.time?.created;

      if (existing) {
        // Update existing metadata
        existing.messageCount = (existing.messageCount || 0) + 1;
        existing.lastUpdated = Date.now();
        if (messageTime) {
          existing.lastMessageTime = Math.max(existing.lastMessageTime || 0, messageTime);
        }
        await LivelyOpencode.sessionMetaDB.sessionMeta.put(existing);
      } else {
        // Create new metadata entry
        const metadata = {
          sessionId: sessionId,
          messageCount: 1,
          lastUpdated: Date.now(),
          lastMessageTime: messageTime
        };
        await LivelyOpencode.sessionMetaDB.sessionMeta.put(metadata);
      }
    } catch (error) {
      console.error('Error incrementing cached message count:', error);
      // Non-fatal - continue without cache
    }
  }

  async loadMessagesForSession(sessionId) {
    if (this._replayMode) return; // Skip server fetch during replay

    lively.notify("loadMessagesForSession " + sessionId)
    try {
      const response = await fetch(`${this.serverUrl}/session/${sessionId}/message`);
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const opencodeMessages = await response.json();
      this.debugRawMessages = opencodeMessages

      this.messages.set(sessionId, opencodeMessages);

      this.log('[opencode] Loaded', opencodeMessages.length, 'OpenCode messages for session', sessionId);

      // Cache metadata to IndexedDB
      await this.cacheSessionMetadata(sessionId, opencodeMessages);

    } catch (error) {
      console.error('Error loading messages:', error);
      // Initialize empty messages array if loading fails
      if (!this.messages.has(sessionId)) {
        this.messages.set(sessionId, []);
      }
    }
  }

  async displayMessages() {
    if (!this.messagesUI) return; // Skip UI rendering when messagesUI is false

    this.log("[opencode] displayMessages WARNING!");
    
    const container = this.get('#messagesContainer');
    if (!container) return;

    container.innerHTML = '';

    // Clear message elements tracking since we're rebuilding
    if (this.messageElements) this.messageElements.clear();

    if (!this.currentSession) {
      container.innerHTML = `
        <div class="no-session">
          <i class="fa fa-comments-o"></i>
          <div>Select or create a session to start chatting</div>
        </div>
      `;
      return;
    }


    const messages = this.messages.get(this.currentSession.id) || [];
   
    if (messages.length === 0) {
      container.innerHTML = '<div class="empty-chat">No messages yet. Start the conversation!</div>';
      return;
    }

    for (const opencodeMsg of messages) {
      const chatMessage = await lively.create('lively-chat-message');
      if (!this.currentSession) {
         console.warn("WARNING, session lost mid displaying...")
         return
      }

      // Use setOpenCodeMessage() which handles all the rendering logic
      await chatMessage.setOpenCodeMessage(opencodeMsg, {
        source: 'code',
        streamType: 'opencode'
      });

      chatMessage.showDebug = this.showDebug;
      container.appendChild(chatMessage);

      // Track element for future updates
      if (opencodeMsg.info?.id) {
        this.messageElements.set(opencodeMsg.info.id, chatMessage);
      }
    }

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Incrementally add a single message to the UI without full rebuild
   * @param {Object} opencodeMsg - OpenCode message object with info and parts
   */
  async renderMessage(opencodeMsg) {
    if (!this.messagesUI) return; // Skip UI rendering when messagesUI is false

    this.log("[opencode] renderMessage", opencodeMsg)
    
    const container = this.get('#messagesContainer');
    if (!container || !this.currentSession) return;

    const chatMessage = await lively.create('lively-chat-message');

    // Use setOpenCodeMessage() which handles all the rendering logic
    await chatMessage.setOpenCodeMessage(opencodeMsg, {
      source: 'code',
      streamType: 'opencode'
    });

    chatMessage.showDebug = this.showDebug;
    container.appendChild(chatMessage);

    // Track element for future updates
    if (opencodeMsg.info?.id) {
      this.messageElements.set(opencodeMsg.info.id, chatMessage);
    }

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Update an existing message in the UI without full rebuild
   * @param {string} messageId - Message ID to update
   * @param {Object} opencodeMsg - Updated OpenCode message object
   */
  async updateOpenCodeMessage(messageId, opencodeMsg) {
    if (!this.messagesUI) return; // Skip UI rendering when messagesUI is false

    this.log("[opencode] updateOpenCodeMessage ", messageId, opencodeMsg)   
    
    
    const chatMessage = this.messageElements.get(messageId);
    if (!chatMessage) {
      // Message not yet in UI - this can happen if message.updated arrives before we display
      // In this case, we'll just wait for the full displayMessages call
      return;
    }

    // Update the existing message element
    await chatMessage.setOpenCodeMessage(opencodeMsg, {
      source: 'code',
      streamType: 'opencode'
    });

    // Scroll to bottom if we're already near the bottom
    const container = this.get('#messagesContainer');
    if (container) {
      const scrollThreshold = 100; // pixels from bottom
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < scrollThreshold;
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }

  /**
   * Helper: Create an OpenCode message object from simple parts
   */
  createOpenCodeMessage(role, parts, messageId = null) {
    return {
      info: {
        id: messageId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: role,
        time: {
          created: new Date().toISOString()
        }
      },
      parts: parts
    };
  }

  // Add temporary UI-only message (not part of server data)
  addTemporaryMessage(sessionId, role, content) {
    if (!this.temporaryMessages.has(sessionId)) {
      this.temporaryMessages.set(sessionId, []);
    }

    const tempMessages = this.temporaryMessages.get(sessionId);

    // Create an OpenCode message format with temp ID
    const opencodeMessage = this.createOpenCodeMessage(role, [
      { type: 'text', text: content }
    ]);

    tempMessages.push(opencodeMessage);
  }

  // Clear temporary messages for a session
  clearTemporaryMessages(sessionId) {
    const tempMessages = this.temporaryMessages.get(sessionId);
    if (!tempMessages || tempMessages.length === 0) return;

    // Remove temporary message elements from DOM
    for (const tempMsg of tempMessages) {
      const msgId = tempMsg.info?.id;
      if (msgId) {
        const element = this.messageElements.get(msgId);
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
        this.messageElements.delete(msgId);
      }
    }

    this.temporaryMessages.delete(sessionId);
  }

  async onNewSessionButton() {
    // Clean up if in replay mode
    if (this._replayMode) {
      this.stopReplay();
    }

    // Clean up artificial session if present
    this.cleanupArtificialSession();

    if (!this.connected) {
      lively.warn('Not connected to OpenCode server');
      return;
    }

    try {
      const response = await fetch(`${this.serverUrl}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Session ${new Date().toLocaleTimeString()}`
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const newSession = await response.json();

      // Reload sessions and select the new one
      await this.loadSessions();
      this.selectSession(newSession);

      lively.success('Session created');

    } catch (error) {
      console.error('Error creating session:', error);
      lively.error('Failed to create session');
    }
  }

  async onSessionDeleted(sessionId) {
    if (!await lively.confirm('Delete this session? This cannot be undone.')) {
      return;
    }

    try {
      await this.deleteSession(sessionId);

      // If we deleted the current session, clear it
      if (this.currentSession?.id === sessionId) {
        this.currentSession = null;
        const messagesContainer = this.get('#messagesContainer');
        if (messagesContainer) {
          messagesContainer.innerHTML = `
            <div class="no-session">
              <i class="fa fa-comments-o"></i>
              <div>Select or create a session to start chatting</div>
            </div>
          `;
        }
      }

      // Reload sessions list
      await this.loadSessions();

      lively.success('Session deleted');

    } catch (error) {
      console.error('Error deleting session:', error);
      lively.error(`Failed to delete session: ${error.message}`);
    }
  }

  async onSessionsBulkDeleted(sessionIds) {
    // Confirmation already handled by sessions component
    if (!sessionIds || sessionIds.length === 0) return;

    lively.notify(`Deleting ${sessionIds.length} sessions...`);

    let deleted = 0;
    let failed = 0;

    for (const sessionId of sessionIds) {
      try {
        await this.deleteSession(sessionId);
        deleted++;
      } catch (error) {
        console.error(`Error deleting session ${sessionId}:`, error);
        failed++;
      }
    }

    // If we deleted the current session, clear it
    if (sessionIds.includes(this.currentSession?.id)) {
      this.currentSession = null;
      const messagesContainer = this.get('#messagesContainer');
      if (messagesContainer) {
        messagesContainer.innerHTML = `
          <div class="no-session">
            <i class="fa fa-comments-o"></i>
            <div>Select or create a session to start chatting</div>
          </div>
        `;
      }
    }

    // Reload sessions list
    await this.loadSessions();

    if (failed > 0) {
      lively.warn(`Deleted ${deleted} sessions, ${failed} failed`);
    } else {
      lively.success(`Successfully deleted ${deleted} sessions`);
    }
  }

  /**
   * Delete a session using OpenCode API: DELETE /session/:id
   * @param {string} sessionId - Session ID to delete
   */
  async deleteSession(sessionId) {
    try {
      const response = await fetch(`${this.serverUrl}/session/${sessionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      // Clean up local data
      this.messages.delete(sessionId);
      this.temporaryMessages.delete(sessionId);

      // Clean up cached metadata from IndexedDB
      try {
        await LivelyOpencode.sessionMetaDB.sessionMeta.delete(sessionId);
        this.log('[opencode] Deleted cached metadata for session:', sessionId);
      } catch (cacheError) {
        console.error('Error deleting cached metadata:', cacheError);
        // Non-fatal - continue even if cache deletion fails
      }

    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async onSendButton() {
    if (this._replayMode) return; // Skip during replay

    const input = this.get('#messageInput');
    if (!input || !input.value.trim()) return;

    if (!this.currentSession) {
      lively.warn('Please select a session first');
      return;
    }

    const message = input.value.trim();
    input.value = '';

    // Disable input while sending
    input.disabled = true;

    try {

      const response = await fetch(`${this.serverUrl}/session/${this.currentSession.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parts: [
            {
              type: 'text',
              text: message
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      // Mark that generation has started
      this.isGenerating = true;

      // Response will come through event stream

    } catch (error) {
      console.error('Error sending message:', error);
      lively.error('Failed to send message');

      // Detect connection failures
      if (error.message.includes('fetch') || error.message.includes('network') || error.name === 'TypeError') {
        // Network error - server is likely down
        this.connected = false;
        this.updateStatus('Disconnected', false);
        this.stopConnectionHealthCheck();

        // Trigger reconnection attempt
        if (this.shouldReconnect && !this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.updateStatus('Reconnecting...', false);
            this.connectToServer();
          }, 5000);
        }
      }

      // Add temporary error message as system message for proper styling
      this.addTemporaryMessage(this.currentSession.id, 'system', `Error: ${error.message}`);

    } finally {
      // Re-enable input
      input.disabled = false;
      input.focus();
    }
  }

  onReconnectButton() {
    this.shouldReconnect = true;

    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Close existing connections
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
    }

    // Attempt to reconnect
    this.connectToServer();
  }

  async onServerButton() {
    if (!LivelyOpencode.sharedServerRunning) {
      // Start the server
      await this.startServer();
    } else {
      // Stop the server
      await this.stopServer();
    }
  }

  async startServer() {
    try {
      // Check if server is already running (shared across all instances)
      if (LivelyOpencode.sharedServerRunning && LivelyOpencode.sharedServerTerminal) {
        lively.notify('OpenCode server is already running');
        this.updateServerButton();
        return;
      }

      // Create a hidden terminal for running the server
      const terminal = await lively.create('lively-xterm');
      terminal.url = lively4url;
      terminal.cwd = "/";
      terminal.command = "opencode serve --port 9100 --hostname localhost";
      terminal.style.width = "100%";
      terminal.style.height = "300px"; // Give it some height even though hidden

      const container = this.get('#serverTerminalContainer');
      container.innerHTML = '';
      container.appendChild(terminal);

      // Store in shared static property
      LivelyOpencode.sharedServerTerminal = terminal;
      LivelyOpencode.sharedServerRunning = true;
      this.updateServerButton();

      lively.success('OpenCode server starting on port 9100...');

      // Wait a moment for the server to start up, then try to connect
      this.shouldReconnect = true;
      setTimeout(() => {
        this.updateStatus('Connecting...', false);
        this.connectToServer();
      }, 2000);

    } catch (error) {
      console.error('Error starting server:', error);
      lively.error('Failed to start OpenCode server');
    }
  }

  async stopServer() {
    try {
      // Stop health checks immediately since we're stopping the server
      this.stopConnectionHealthCheck();

      // Update connection status immediately
      this.connected = false;
      this.updateStatus('Disconnected', false);

      if (LivelyOpencode.sharedServerTerminal) {
        // Send Ctrl+C to stop the server
        if (LivelyOpencode.sharedServerTerminal.term) {
          // Send \x03 which is Ctrl+C
          LivelyOpencode.sharedServerTerminal.term.paste('\x03');
        }

        // Wait a moment for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 500));

        // Disconnect and remove the terminal
        if (LivelyOpencode.sharedServerTerminal.socket) {
          LivelyOpencode.sharedServerTerminal.socket.close();
        }

        // Clean up terminal from DOM (only from this instance's container)
        const container = this.get('#serverTerminalContainer');
        if (container) {
          container.innerHTML = '';
        }

        // Clear shared state
        LivelyOpencode.sharedServerTerminal = null;
      }

      LivelyOpencode.sharedServerRunning = false;
      this.updateServerButton();

      lively.notify('OpenCode server stopped');

    } catch (error) {
      console.error('Error stopping server:', error);
      lively.error('Failed to stop OpenCode server');
    }
  }

  updateServerButton() {
    const button = this.get('#serverButton');
    if (!button) return;

    if (LivelyOpencode.sharedServerRunning) {
      button.innerHTML = '<i class="fa fa-stop"></i> Stop Server';
      button.title = 'Stop OpenCode server (shared across all instances)';
    } else {
      button.innerHTML = '<i class="fa fa-play"></i> Start Server';
      button.title = 'Start OpenCode server';
    }
  }

  startConnectionHealthCheck() {
    // Clear any existing health check
    this.stopConnectionHealthCheck();

    // Poll server health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkServerHealth();
    }, 30000);
  }

  stopConnectionHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async checkServerHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.serverUrl}/config`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      // Server is healthy
      if (!this.connected) {
        // Server came back online
        this.updateStatus('Connected', true);
        this.connected = true;
      }

    } catch (error) {
      // Server is not responding
      if (this.connected) {
        // Server went offline
        this.updateStatus('Disconnected', false);
        this.connected = false;

        // Trigger reconnect if auto-reconnect is enabled
        if (this.shouldReconnect && !this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.updateStatus('Reconnecting...', false);
            this.connectToServer();
          }, 5000);
        }
      }
    }
  }

  updateStatus(text, connected) {
    const statusEl = this.get('#status');
    const statusDot = this.get('#statusDot');

    if (statusEl) {
      statusEl.textContent = text;
    }

    if (statusDot) {
      if (connected) {
        statusDot.classList.add('connected');
      } else {
        statusDot.classList.remove('connected');
      }
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }


  truncateMsgId(messageId, length = 10) {
    return messageId ? messageId.substring(0, length) : 'no-id';
  }

  /*MD ## Event Capture & Replay MD*/

  /**
   * Capture an event for replay testing
   * Stores events as JSONL (one JSON object per line when exported)
   */
  captureEvent(type, data, sessionId) {
    if (this._replayMode) return; // Don't capture during replay

    this._eventCapture.push({
      timestamp: Date.now(),
      type: type,
      sessionId: sessionId,
      data: data
    });
  }

  /**
   * Export captured events to clipboard as JSONL format
   */
  async exportChatHistory() {
    if (this._eventCapture.length === 0) {
      lively.warn('No events captured yet');
      return;
    }

    // Convert to JSONL (one JSON per line)
    const jsonl = this._eventCapture.map(event => JSON.stringify(event)).join('\n');

    try {
      await navigator.clipboard.writeText(jsonl);
      lively.success(`Copied ${this._eventCapture.length} events to clipboard`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      lively.error('Failed to copy to clipboard');
    }
  }

  /**
   * Replay events from clipboard JSONL format
   * Uses the same code path as live events (handleEvent)
   */
  async replayEventsFromClipboard() {
    try {
      const jsonl = await navigator.clipboard.readText();
      if (!jsonl.trim()) {
        lively.warn('Clipboard is empty');
        return;
      }

      // Parse JSONL (one JSON object per line)
      const lines = jsonl.split('\n').filter(line => line.trim());
      const events = lines.map(line => JSON.parse(line));

      if (events.length === 0) {
        lively.warn('No valid events found in clipboard');
        return;
      }

      lively.notify(`Replaying ${events.length} events...`);

      // Use the internal replay method
      this.replayEventsFromArray(events);

    } catch (error) {
      console.error('Error replaying events:', error);
      lively.error(`Failed to replay: ${error.message}`);
      this._replayMode = false; // Ensure we exit replay mode on error
    }
  }

  /**
   * Enable replay mode: disable inputs, clear UI, create artificial session
   * @param {string} sessionId - Optional session ID for replay session
   */
  enableReplay(sessionId = null) {
    // Set replay mode flag
    this._replayMode = true;

    // Disable input during replay
    const messageInput = this.get('#messageInput');
    if (messageInput) messageInput.disabled = true;

    // Create synthetic session for replay
    const replaySessionId = sessionId || `replay-session-${Date.now()}`;
    this.currentSession = {
      id: replaySessionId,
      title: 'Replay Session',
      created_at: new Date().toISOString()
    };
    this.messages.set(replaySessionId, []);
    this.temporaryMessages.set(replaySessionId, []);

    // Clear UI for fresh replay
    const messagesContainer = this.get('#messagesContainer');
    if (messagesContainer) messagesContainer.innerHTML = '';
    this.messageElements.clear();

    return replaySessionId;
  }

  /**
   * Disable replay mode: re-enable inputs (but keep artificial session visible)
   */
  disableReplay() {
    this._replayMode = false;

    // Re-enable input
    const messageInput = this.get('#messageInput');
    if (messageInput) messageInput.disabled = false;
  }

  /**
   * Clean up artificial replay session
   */
  cleanupArtificialSession() {
    if (this.currentSession?.id?.startsWith('replay-')) {
      this.currentSession = null;
      const messagesContainer = this.get('#messagesContainer');
      if (messagesContainer) messagesContainer.innerHTML = '';
      this.messageElements.clear();
    }
  }

  /**
   * Replay events from array (internal method for testing)
   * Uses the same code path as live events (handleEvent)
   * @param {Array} events - Array of event objects with {timestamp, type, sessionId, data}
   * @param {string} sessionId - Optional session ID to use (defaults to generated replay session)
   * @returns {string} The replay session ID used
   */
  replayEventsFromArray(events, sessionId = null) {
    if (events.length === 0) {
      lively.warn("No events to replay");
      return;
    }

    // Initialize replay state
    this._replayPaused = false;
    this._replaySpeed = 1;
    this._replayTimeouts = [];
    this._replayCurrentEvent = 0;
    this._replayTotalEvents = events.length;
    this._eventCapture = []; // Clear for new capture

    // Enable replay mode (disables inputs, clears UI, creates artificial session)
    const replaySessionId = this.enableReplay(sessionId);

    // Show replay controls
    this.showReplayControls();

    // Replay events with controllable timing
    let completedEvents = 0;

    this.log(`[opencode] Starting replay of ${events.length} events`);

    const scheduleEvent = (index) => {
      if (index >= events.length) return;

      const event = events[index];

      // Calculate delay from previous event (or 0 for first event)
      let delay = 0;
      if (index > 0) {
        delay = event.timestamp - events[index - 1].timestamp;

        // Apply speed multiplier
        if (this._replaySpeed > 0) {
          delay = delay / this._replaySpeed;
        } else {
          // Instant mode
          delay = 0;
        }
      }

      const timeoutId = setTimeout(() => {
        // Check if paused - reschedule if needed
        if (this._replayPaused) {
          // Reschedule this event after a short delay and track the timeout ID
          const pauseTimeoutId = setTimeout(() => scheduleEvent(index), 100);
          this._replayTimeouts.push(pauseTimeoutId);
          return;
        }

        // Process the event
        this.handleEvent(event.data, replaySessionId);
        completedEvents++;
        this._replayCurrentEvent = completedEvents;

        // Update progress
        this.updateReplayProgress(completedEvents, events.length);

        // Schedule next event
        scheduleEvent(index + 1);

        // Check if complete
        if (completedEvents === events.length) {
          // Disable replay mode (re-enables inputs, keeps artificial session)
          this.disableReplay();

          this.hideReplayControls();
          lively.success(`Replay complete: ${events.length} events processed`);
        }
      }, delay);

      // Store timeout ID for cancellation
      this._replayTimeouts.push(timeoutId);
    };

    // Start replaying first event
    scheduleEvent(0);

    return replaySessionId;
  }

  /*MD ## Context Menu MD*/

  // Override base class method to add component-specific menu items
  getContextMenuItems() {
    return [
      ["Raw Messages", () => {
        lively.openInspector(this.debugRawMessages);
      }],
      ["Load All Sessions (Update Cache)", () => {
        this.loadAllSessionsMetadata();
      }],
      ["Copy Chat History", () => {
        this.exportChatHistory();
      }],
      ["Paste and Replay Chat History", () => {
        this.replayEventsFromClipboard();
      }]
    ];
  }

  /**
   * Load messages for all sessions to populate the metadata cache
   * This is useful for getting accurate message counts for all sessions
   */
  async loadAllSessionsMetadata() {
    if (!this.sessions || this.sessions.length === 0) {
      lively.warn('No sessions to load');
      return;
    }

    const totalSessions = this.sessions.length;
    lively.notify(`Loading metadata for ${totalSessions} sessions...`);

    let loaded = 0;
    let failed = 0;

    for (const session of this.sessions) {
      try {
        // Fetch messages for this session
        const response = await fetch(`${this.serverUrl}/session/${session.id}/message`);
        if (!response.ok) {
          throw new Error(`Failed to load messages: ${response.status}`);
        }

        const opencodeMessages = await response.json();

        // Cache the metadata
        await this.cacheSessionMetadata(session.id, opencodeMessages);

        loaded++;

        // Show progress every 10 sessions
        if (loaded % 10 === 0) {
          lively.notify(`Loaded ${loaded}/${totalSessions} sessions...`);
        }

      } catch (error) {
        console.error(`Error loading session ${session.id}:`, error);
        failed++;
      }
    }

    // Refresh the session list to show updated counts
    await this.updateSessionList();

    if (failed > 0) {
      lively.warn(`Loaded ${loaded} sessions, ${failed} failed`);
    } else {
      lively.success(`Successfully loaded metadata for all ${loaded} sessions`);
    }
  }
  
  
  livelyPreMigrate() {
    this.disconnectFromServer();
    this.stopConnectionHealthCheck();
  }

  livelyMigrate(other) {
    super.livelyMigrate(other)
    this.serverUrl = other.serverUrl || 'http://localhost:9100';
    this.sessions = other.sessions || [];
    this.currentSession = other.currentSession || null;
    this.messages = other.messages || new Map();

    // Server terminal state is now shared at class level, no need to migrate

    this.updateSessionList();
    this.displayMessages();
    this.updateServerButton();
  }

  async livelyExample() {
    this.style.backgroundColor = "white";
    this.style.border = "2px solid #4a90e2";
  }
}
