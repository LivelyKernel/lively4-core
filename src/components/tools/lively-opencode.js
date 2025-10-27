import Morph from 'src/components/widgets/lively-morph.js';

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

export default class LivelyOpencode extends Morph {

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
    this.messages = new Map(); // sessionId -> messages array

    // Connection state
    this.eventSource = null;
    this.connected = false;
    this.shouldReconnect = true;
    this.reconnectTimer = null;

    // Update UI
    this.updateStatus('Connecting...', false);

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
    console.log('[OpenCode] message.updated (ignoring)');
  }

  /**
   * Update a specific part from an event - updates messages in memory
   * Only fetches from server when we need structured data we don't have
   */
  updatePartFromEvent(sessionId, part) {
    const messages = this.messages.get(sessionId);
    if (!messages) return;

    const messageId = part.messageID;
    const partType = part.type;

    if (partType === 'text') {
      // Text streaming - update directly from event data
      console.log('[OpenCode] Text part streaming:', part.text?.substring(0, 50));

      // Create or update text message in memory
      const textMsgId = messageId + '_text_' + part.id;
      const existingIndex = messages.findIndex(m => m.id === textMsgId);

      const textMsg = {
        id: textMsgId,
        role: 'assistant',
        content: part.text || '',
        type: 'text',
        timestamp: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        messages[existingIndex] = textMsg;
      } else {
        messages.push(textMsg);
      }

      // Re-render without server call
      this.displayMessages();

    } else if (partType === 'tool') {
      // Tool execution status update
      const state = part.state?.status || 'unknown';
      const toolName = part.tool || 'unknown';

      console.log('[OpenCode] Tool status:', toolName, state);

      if (state === 'completed') {
        // Tool finished - NOW fetch ONLY this message to get full tool_use + tool_result structure
        console.log('[OpenCode] Tool completed, fetching single message:', messageId);
        this.loadMessageById(sessionId, messageId).then(() => {
          this.displayMessages();
        });
      } else {
        // Tool pending/running - update status in memory
        const toolMsgId = messageId + '_tool_live_' + part.callID;
        const existingIndex = messages.findIndex(m => m.id === toolMsgId);

        const toolMsg = {
          id: toolMsgId,
          role: 'tool',
          content: `${toolName}: ${state}`,
          type: 'tool_live',
          metadata: {
            toolName: toolName,
            callId: part.callID,
            state: state
          },
          timestamp: new Date().toISOString()
        };

        if (existingIndex >= 0) {
          messages[existingIndex] = toolMsg;
        } else {
          messages.push(toolMsg);
        }

        // Re-render without server call
        this.displayMessages();
      }
    }
    // For tool_use/tool_result: these come from server fetch after tool completion
  }

  /**
   * Load a single message by ID and merge it into the messages array
   */
  async loadMessageById(sessionId, messageId) {
    try {
      const response = await fetch(`${this.serverUrl}/session/${sessionId}/message/${messageId}`);
      if (!response.ok) {
        throw new Error(`Failed to load message: ${response.status}`);
      }

      const msg = await response.json();
      console.log('[OpenCode] Loaded single message:', messageId, 'parts:', msg.parts.map(p => p.type));

      const messages = this.messages.get(sessionId) || [];

      // Keep full history - only add NEW parts we don't already have
      // Don't remove anything - we want to see tool pending/running/completed progression

      // Check which parts we already have
      const existingIds = new Set(messages.map(m => m.id));

      // Add only new parts from the fetched message
      for (const part of msg.parts) {
        if (part.type === 'text') {
          const textId = msg.info.id + '_text_' + (part.id || 0);
          if (!existingIds.has(textId)) {
            messages.push({
              id: textId,
              role: msg.info.role,
              content: part.text,
              type: 'text',
              timestamp: msg.info.time.created
            });
          }
        } else if (part.type === 'tool_use') {
          const toolId = msg.info.id + '_tool_' + part.id;
          if (!existingIds.has(toolId)) {
            messages.push({
              id: toolId,
              role: 'tool',
              content: part.input ? JSON.stringify(part.input) : '',
              type: 'tool_use',
              metadata: {
                toolName: part.name,
                toolId: part.id,
                input: part.input
              },
              timestamp: msg.info.time.created
            });
          }
        } else if (part.type === 'tool_result') {
          let resultContent = '';
          if (typeof part.content === 'string') {
            resultContent = part.content;
          } else if (Array.isArray(part.content)) {
            resultContent = part.content.map(c => {
              if (typeof c === 'string') return c;
              if (c.type === 'text') return c.text;
              return JSON.stringify(c);
            }).join('\n');
          } else {
            resultContent = JSON.stringify(part.content);
          }

          const resultId = msg.info.id + '_result_' + part.tool_use_id;
          if (!existingIds.has(resultId)) {
            messages.push({
              id: resultId,
              role: 'tool',
              content: resultContent,
              type: 'tool_result',
              metadata: {
                toolId: part.tool_use_id,
                isError: part.is_error || false
              },
              timestamp: msg.info.time.created
            });
          }
        }
      }

      this.messages.set(sessionId, messages);

    } catch (error) {
      console.error('Error loading message:', error);
    }
  }

  async loadMessagesForSession(sessionId) {
    try {
      const response = await fetch(`${this.serverUrl}/session/${sessionId}/message`);
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const rawMessages = await response.json();

      // Debug: Log raw messages to see what we're getting
      console.log('[OpenCode] Raw messages from API (JSON):');
      console.log(JSON.stringify(rawMessages, null, 2));

      // Transform messages from API format to internal format
      // Each message can have multiple parts (text, tool_use, tool_result)
      const messages = [];

      for (const msg of rawMessages) {
        // Process each part as a separate message for better display
        for (const part of msg.parts) {
          if (part.type === 'text') {
            messages.push({
              id: msg.info.id + '_text_' + (part.id || messages.length),
              role: msg.info.role,
              content: part.text,
              type: 'text',
              timestamp: msg.info.time.created
            });
          } else if (part.type === 'tool_use') {
            // Tool call message - this is the complete tool call with arguments
            messages.push({
              id: msg.info.id + '_tool_' + part.id,
              role: 'tool',
              content: part.input ? JSON.stringify(part.input) : '',
              type: 'tool_use',
              metadata: {
                toolName: part.name,
                toolId: part.id,
                input: part.input
              },
              timestamp: msg.info.time.created
            });
          } else if (part.type === 'tool_result') {
            // Tool result message
            // Extract actual content from the part
            let resultContent = '';
            if (typeof part.content === 'string') {
              resultContent = part.content;
            } else if (Array.isArray(part.content)) {
              // Content might be an array of content blocks
              resultContent = part.content.map(c => {
                if (typeof c === 'string') return c;
                if (c.type === 'text') return c.text;
                return JSON.stringify(c);
              }).join('\n');
            } else {
              resultContent = JSON.stringify(part.content);
            }

            messages.push({
              id: msg.info.id + '_result_' + part.tool_use_id,
              role: 'tool',
              content: resultContent,
              type: 'tool_result',
              metadata: {
                toolId: part.tool_use_id,
                isError: part.is_error || false
              },
              timestamp: msg.info.time.created
            });
          } else if (part.type === 'tool') {
            // Live tool execution (from message.part.updated events)
            // Skip these if we already have tool_use/tool_result for the same call
            // We'll keep them for now but they should get replaced when complete data arrives
            const state = part.state?.status || 'unknown';
            const toolName = part.tool || 'unknown';
            messages.push({
              id: msg.info.id + '_tool_live_' + part.callID,
              role: 'tool',
              content: `Status: ${state}`,
              type: 'tool_live',
              metadata: {
                toolName: toolName,
                callId: part.callID,
                state: state
              },
              timestamp: msg.info.time.created
            });
          }
        }
      }

      this.messages.set(sessionId, messages);

    } catch (error) {
      console.error('Error loading messages:', error);
      // Initialize empty messages array if loading fails
      if (!this.messages.has(sessionId)) {
        this.messages.set(sessionId, []);
      }
    }
  }

  async displayMessages() {
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

    const messages = this.messages.get(this.currentSession.id) || [];

    if (messages.length === 0) {
      container.innerHTML = '<div class="empty-chat">No messages yet. Start the conversation!</div>';
      return;
    }

    for (const msg of messages) {
      const chatMessage = await lively.create('lively-chat-message');
      await chatMessage.setMessage({
        role: msg.role,
        content: msg.content,
        source: 'code',
        streamType: 'opencode',
        type: msg.type || 'text',
        metadata: msg.metadata || {},
        timestamp: msg.timestamp,
        sessionId: this.currentSession.id
      });
      container.appendChild(chatMessage);
    }

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  addMessage(sessionId, role, content) {
    if (!this.messages.has(sessionId)) {
      this.messages.set(sessionId, []);
    }

    const messages = this.messages.get(sessionId);
    messages.push({ role, content, timestamp: new Date().toISOString() });
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

    // Add user message to display immediately
    this.addMessage(this.currentSession.id, 'user', message);
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

      // Add error message
      this.addMessage(this.currentSession.id, 'assistant', `Error: ${error.message}`);
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
