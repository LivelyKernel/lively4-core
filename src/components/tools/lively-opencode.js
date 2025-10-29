import LivelyChat from 'src/components/tools/lively-chat.js';

/*MD
# Lively OpenCode Agent

OpenCode.ai agent chat interface that connects to OpenCode server for AI-powered development assistance.

**Architecture:**
- RESTful API connection to OpenCode server (default: http://localhost:9100)
- Server-sent events (SSE) for real-time message streaming
- Session management for organizing conversations
- Simple chat interface with message history

**Features:**
- Create and manage multiple chat sessions
- Send messages to AI agent
- Real-time streaming responses via EventSource
- Session switching and history

**API Endpoints:**
- `GET /session` - List all sessions
- `POST /session` - Create new session
- `POST /session/:id/message` - Send message
- `GET /event` - Server-sent events stream

MD*/

import ContextMenu from 'src/client/contextmenu.js';

export default class LivelyOpencode extends LivelyChat {

  get showDebug() {
    return this._showDebug
  }
  
  
  set showDebug(bool) {
    this._showDebug = bool
    Array.from(this.get('#messagesContainer').querySelectorAll("lively-chat-message")).forEach(ea => ea.showDebug = bool)
  }
  
  set sessionUI(value) {
    // Positive property: if explicitly false, hide the session panel
    // Default (undefined/true) shows the panel
    if (value === false || value === "false") {
      this.setAttribute("session-ui", "false");
    } else if (value === true || value === "true") {
      this.setAttribute("session-ui", "true");
    } else {
      this.removeAttribute("session-ui");
    }
  }

  get sessionUI() {
    const attr = this.getAttribute("session-ui");
    if (attr === "false") return false;
    return true; // default is visible
  }

  async initialize() {
    this.windowTitle = "OpenCode Agent";
    this.registerButtons();

    // Server configuration
    this.serverUrl = 'http://localhost:9100';

    // Session state
    this.sessions = [];
    this.currentSession = null;
    this.messages = new Map(); // sessionId -> messages array (pure server data)
    this.temporaryMessages = new Map(); // sessionId -> temporary UI messages

    // Connection state
    this.eventSource = null;
    this.connected = false;
    this.shouldReconnect = true;
    this.reconnectTimer = null;

    // Update UI
    this.updateStatus('Connecting...', false);

    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);
    
    // Setup input handling
    this.setupInputHandling();
  }

  connectedCallback() {
    this.shouldReconnect = true;
    // Connect to OpenCode server
    this.connectToServer();
  }

  disconnectedCallback() {
    this.disconnectFromServer();
  }

  setupInputHandling() {
    const input = this.get('#messageInput');
    if (input) {
      // Send message on Enter (Shift+Enter for new line)
      input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter' && !evt.shiftKey) {
          evt.preventDefault();
          this.onSendButton();
        }
      });
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
      console.error('Failed to connect to OpenCode server:', error);
      lively.error(`Failed to connect to OpenCode server at ${this.serverUrl}`);

      // Auto-reconnect after 5 seconds if not intentionally disconnected
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect to OpenCode server...');
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

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.connected = false;
    this.updateStatus('Disconnected', false);
  }

  connectEventStream() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(`${this.serverUrl}/event`);

      this.eventSource.onopen = () => {
        console.log('EventSource connected');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (error) {
          console.error('Error parsing event data:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        // EventSource will automatically try to reconnect
      };

    } catch (error) {
      console.error('Failed to connect event stream:', error);
    }
  }

  handleEvent(data) {
    // Log all events for debugging
    console.log('[OpenCode Event]', data);

    // Extract sessionID based on event type
    debugger
    let sessionId = null;
    if (data.type === 'message.updated') {
      sessionId = data.properties?.info?.sessionID;
    } else if (data.type === 'message.part.updated') {
      sessionId = data.properties?.part?.sessionID;
    } else if (data.type === 'session.idle' || data.type === 'session.updated') {
      sessionId = data.properties?.sessionID;
    }

    // Handle different event types from OpenCode server
    if (data.type === 'message.updated') {
      // Message updated - update specific message in memory
      if (sessionId && this.currentSession && this.currentSession.id === sessionId) {
        const messageInfo = data.properties?.info;
        if (messageInfo) {
          this.updateMessageFromEvent(sessionId, messageInfo);
        }
      }
    } else if (data.type === 'message.part.updated') {
      // Part updated - update specific part in memory
      if (sessionId && this.currentSession && this.currentSession.id === sessionId) {
        const part = data.properties?.part;
        if (part) {
          this.updatePartFromEvent(sessionId, part);
        }
      }
    } else if (data.type === 'session.updated' || data.type === 'session.idle') {
      // Session update event - could reload sessions list if needed
    } else if (data.type === 'session') {
      // Session update event
      this.loadSessions();
    }

    // Emit CustomEvent for status changes
    const statusInfo = this.inferStatusFromEvent(data, sessionId);
    if (statusInfo) {
      this.dispatchEvent(new CustomEvent('opencode:status-change', {
        detail: statusInfo,
        bubbles: true,
        composed: true // crosses shadow DOM boundaries
      }));
    }
  }

  inferStatusFromEvent(data, sessionId) {
    // Only emit events for current session
    if (sessionId && this.currentSession && this.currentSession.id !== sessionId) {
      return null;
    }

    let status = null;
    let message = '';

    switch(data.type) {
      case 'message.updated':
        status = 'working';
        message = 'Agent is responding';
        break;
      case 'message.part.updated':
        status = 'working';
        message = 'Agent is generating response';
        break;
      case 'session.idle':
        status = 'idle';
        message = 'Agent finished task';
        break;
      case 'session.updated':
        status = 'updated';
        message = 'Session updated';
        break;
      default:
        return null; // Don't emit for other event types
    }

    return {
      type: data.type,
      sessionId: sessionId,
      status: status,
      message: message,
      timestamp: Date.now()
    };
  }

  async loadSessions() {
    try {
      const response = await fetch(`${this.serverUrl}/session`);
      if (!response.ok) {
        throw new Error(`Failed to load sessions: ${response.status}`);
      }

      this.sessions = await response.json();
      this.updateSessionList();

    } catch (error) {
      console.error('Error loading sessions:', error);
      lively.error('Failed to load sessions');
    }
  }

  updateSessionList() {
    const sessionList = this.get('#sessionList');
    if (!sessionList) return;

    sessionList.innerHTML = '';

    if (this.sessions.length === 0) {
      sessionList.innerHTML = '<div class="empty-chat">No sessions yet</div>';
      return;
    }

    this.sessions.forEach(session => {
      const sessionItem = document.createElement('div');
      sessionItem.className = 'session-item';
      if (this.currentSession && this.currentSession.id === session.id) {
        sessionItem.classList.add('active');
      }

      sessionItem.innerHTML = `
        <div class="session-item-title">${session.title || 'Untitled'}</div>
        <div class="session-item-id">${session.id.substring(0, 8)}...</div>
      `;

      sessionItem.addEventListener('click', () => this.selectSession(session));
      sessionList.appendChild(sessionItem);
    });
  }

  async selectSession(session) {
    this.currentSession = session;
    this.updateSessionList();

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
   */
  updateMessageFromEvent(sessionId, messageInfo) {
    // message.updated is just a status change, not content
    // Content changes come through message.part.updated
    // Do nothing here - no reload needed
    console.log('[OpenCode] message.updated', messageInfo);
  }

  /**
   * Update a specific part from an event - SIMPLIFIED to work with OpenCode messages
   */
  updatePartFromEvent(sessionId, part) {
    const messages = this.messages.get(sessionId);
    if (!messages) return;

    // Clear temporary messages when server starts sending real data
    if (this.temporaryMessages.has(sessionId)) {
      this.clearTemporaryMessages(sessionId);
    }

    console.log('[OpenCode] message.part', part);

    const messageId = part.messageID;
    const partType = part.type;

    if (partType === 'text') {
      // Text streaming - update directly from event data
      console.log('[OpenCode] Text part streaming:', part.text?.substring(0, 50));

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
      } else {
        // Message doesn't exist yet - fetch it from server to get correct role
        console.log('[OpenCode] New message detected, fetching from server:', messageId);
        debugger
        this.loadMessageById(sessionId, messageId).then(() => {
          this.displayMessages();
        });
        return; // Don't create temporary message with wrong role
      }

      // Re-render
      this.displayMessages();

    } else if (partType === 'tool') {
      // Tool execution status update
      const state = part.state?.status || 'unknown';
      const toolName = part.tool || 'unknown';

      console.log('[OpenCode] Tool status:', toolName, state);

      if (state === 'completed') {
        // Tool finished - fetch full message to get structured tool_use + tool_result
        console.log('[OpenCode] Tool completed, fetching single message:', messageId);
        this.loadMessageById(sessionId, messageId).then(() => {
          this.displayMessages();
        });
      } else {
        // Tool pending/running - show status temporarily
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
        } else {
          // Message doesn't exist yet - fetch it from server to get correct role
          console.log('[OpenCode] New message with tool detected, fetching from server:', messageId);
          this.loadMessageById(sessionId, messageId).then(() => {
            this.displayMessages();
          });
          return; // Don't create temporary message with wrong role
        }

        // Re-render
        this.displayMessages();
      }
    }
    // For tool_use/tool_result: these come from server fetch after tool completion
  }

  // #important
  async loadMessageById(sessionId, messageId) {
    try {
      const response = await fetch(`${this.serverUrl}/session/${sessionId}/message/${messageId}`);
      if (!response.ok) {
        throw new Error(`Failed to load message: ${response.status}`);
      }

      const msg = await response.json();
      console.log('[OpenCode] Loaded single message:', messageId, 'parts:', msg.parts.map(p => p.type));

      const messages = this.messages.get(sessionId) || [];

      // SIMPLIFIED: Check if we already have this message, if so update it, otherwise add it
      const existingIndex = messages.findIndex(m => m.info?.id === msg.info.id);

      if (existingIndex >= 0) {
        // Update existing message with new data
        messages[existingIndex] = msg;
        console.log('[OpenCode] Updated existing message:', messageId);
      } else {
        // Add new message
        messages.push(msg);
        console.log('[OpenCode] Added new message:', messageId);
      }

      this.messages.set(sessionId, messages);

    } catch (error) {
      console.error('Error loading message:', error);
    }
  }

  async loadMessagesForSession(sessionId) {
    lively.notify("loadMessagesForSession " + sessionId)
    try {
      const response = await fetch(`${this.serverUrl}/session/${sessionId}/message`);
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const opencodeMessages = await response.json();
      this.debugRawMessages = opencodeMessages

      // SIMPLIFIED: Just store OpenCode messages as-is
      // No transformation - lively-chat-message handles rendering
      this.messages.set(sessionId, opencodeMessages);

      // Clear temporary messages when loading server messages
      this.clearTemporaryMessages(sessionId);

      console.log('[OpenCode] Loaded', opencodeMessages.length, 'OpenCode messages for session', sessionId);

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

    const container = this.get('#messagesContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!this.currentSession) {
      container.innerHTML = `
        <div class="no-session">
          <i class="fa fa-comments-o"></i>
          <div>Select or create a session to start chatting</div>
        </div>
      `;
      return;
    }

    // Combine server messages and temporary UI messages
    const serverMessages = this.messages.get(this.currentSession.id) || [];
    const tempMessages = this.temporaryMessages.get(this.currentSession.id) || [];
    const allMessages = [...serverMessages, ...tempMessages];

    if (allMessages.length === 0) {
      container.innerHTML = '<div class="empty-chat">No messages yet. Start the conversation!</div>';
      return;
    }

    // SIMPLIFIED: Just pass OpenCode messages directly to chat-message components
    for (const opencodeMsg of allMessages) {
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
    }

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
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

  // #important
  addMessage(sessionId, role, content) {
    if (!this.messages.has(sessionId)) {
      this.messages.set(sessionId, []);
    }

    const messages = this.messages.get(sessionId);
    const timestamp = new Date().toISOString();

    // Create an OpenCode message format
    const opencodeMessage = this.createOpenCodeMessage(role, [
      { type: 'text', text: content }
    ]);

    messages.push(opencodeMessage);

    // Dispatch event for workspace integration
    this.dispatchEvent(new CustomEvent('opencode:message-added', {
      detail: {
        sessionId,
        role,
        content,
        timestamp,
        type: 'text',
        metadata: {}
      },
      bubbles: true,
      composed: true
    }));
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
    this.temporaryMessages.delete(sessionId);
  }

  async onNewSessionButton() {
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

  async onSendButton() {
    const input = this.get('#messageInput');
    if (!input || !input.value.trim()) return;

    if (!this.currentSession) {
      lively.warn('Please select a session first');
      return;
    }

    const message = input.value.trim();
    input.value = '';

    // Add temporary user message for immediate UI feedback
    this.addTemporaryMessage(this.currentSession.id, 'user', message);
    this.displayMessages();

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

      // Response will come through event stream

    } catch (error) {
      console.error('Error sending message:', error);
      lively.error('Failed to send message');

      // Add temporary error message for immediate UI feedback
      this.addTemporaryMessage(this.currentSession.id, 'assistant', `Error: ${error.message}`);
      this.displayMessages();

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
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Attempt to reconnect
    this.connectToServer();
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

    /*MD ## Context Menu  MD*/
  onContextMenu(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const menuItems = [
      ["Copy", () => {
        // Get selected text or copy last message
        const selection = window.getSelection().toString();
        if (selection) {
          navigator.clipboard.writeText(selection);
          lively.notify("Copied", "Selection copied to clipboard");
        }
      }], 
      ["Toggle Debug", () => {
        this.showDebug = !this.showDebug
      }], 
      ["Raw Message", () => {
        lively.openInspector(this.debugRawMessages)
      }], 

    ];
    var menu = new ContextMenu(this, menuItems);
    menu.openIn(document.body, evt, this);
    return true;
  }
  
  
  livelyPreMigrate() {
    this.disconnectFromServer();
  }

  livelyMigrate(other) {
    this.serverUrl = other.serverUrl || 'http://localhost:9100';
    this.sessions = other.sessions || [];
    this.currentSession = other.currentSession || null;
    this.messages = other.messages || new Map();

    this.updateSessionList();
    this.displayMessages();
  }

  async livelyExample() {
    this.style.backgroundColor = "white";
    this.style.border = "2px solid #4a90e2";
  }
}
