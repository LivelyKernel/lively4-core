import LivelyChat from './lively-chat.js';
import Dexie from "src/external/dexie3.js";
import { computeCost } from "src/client/claude/claude-pricing.js";

/*MD
# Lively OpenCode Agent

[Notes](browse://src/ai-workspace/doc/architecture/opencode.md)

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
  
  // Shared state via localStorage (survives page reload, shared across instances)
  static get sharedWorkingDirectory() {
    return localStorage.getItem('opencode.workingDirectory');
  }
  static set sharedWorkingDirectory(value) {
    if (value) {
      localStorage.setItem('opencode.workingDirectory', value);
    } else {
      localStorage.removeItem('opencode.workingDirectory');
    }
  }
  
  static get sharedSessionId() {
    return localStorage.getItem('opencode.currentSessionId');
  }
  static set sharedSessionId(value) {
    if (value) {
      localStorage.setItem('opencode.currentSessionId', value);
    } else {
      localStorage.removeItem('opencode.currentSessionId');
    }
  }
  
  // Event type tracking across all instances
  static eventTypeLog = [];
  static eventTypeTally = new Map();

  /**
   * IndexedDB for caching session metadata (message counts, timestamps)
   * Note: Server is source of truth for actual messages - this is metadata cache only
   */
  static get sessionMetaDB() {
    var db = new Dexie("opencode-session-metadata");
    db.version(31).stores({
      sessionMeta: 'sessionId, messageCount, lastUpdated, lastMessageTime'
    }).upgrade(function () {});
    db.version(32).stores({
      sessionMeta: 'sessionId, messageCount, lastUpdated, lastMessageTime, parentSessionId'
    }).upgrade(function () {});
    return db;
  }

  /**
   * IndexedDB for message persistence with local timestamps
   * Stores full messages enriched with browser-local timestamps for consistent ordering
   */
  static get messagesdb() {
    var db = new Dexie("opencode-messages");
    db.version(1).stores({
      messages: '[sessionId+messageId], sessionId, messageId, localTimestamp, lastModified'
    }).upgrade(function () {});
    return db;
  }

  // Override base class method to update message debug state
  updateMessagesDebugState() {
    const container = this.get('#messagesContainer');
    if (container) {
      Array.from(container.querySelectorAll("lively-chat-message")).forEach(ea => {
        ea.showDebug = this.showDebug;
      });
    }
    // Also propagate to sessions component so cost visibility updates
    const sessionsComponent = this.get('#sessionsComponent');
    if (sessionsComponent) {
      sessionsComponent.showDebug = this.showDebug;
    }
  }

  async initialize() {
    // Call parent initialize to setup event capture system
    await super.initialize();

    this.windowTitle = "OpenCode Agent";
    this.registerButtons();

    this.registerAttribute('variant');

    // Server configuration
    this.serverUrl = 'http://localhost:9100';

    // Restore from shared state (hot-reload safe: preserves live state first)
    this.workingDirectory = this.workingDirectory || LivelyOpencode.sharedWorkingDirectory;
    this.currentSessionId = this.currentSessionId || LivelyOpencode.sharedSessionId;

    // Use defaults if still not set
    if (!this.workingDirectory) {
      const recent = this.getRecentWorkingDirectories();
      this.workingDirectory = recent.length > 0 ? recent[0] : null;
      if (this.workingDirectory) {
        LivelyOpencode.sharedWorkingDirectory = this.workingDirectory;
      }
    }
    
    this.allSessions = []; // All sessions from server

    // Session state
    this.sessions = []; // Filtered sessions for current working directory
    this.currentSession = null;
    this.messages = new Map(); // sessionId -> messages array (pure server data)
    this.temporaryMessages = new Map(); // sessionId -> temporary UI messages
    this.messageElements = this.messageElements || new Map(); // messageId -> DOM element for fast updates
    this.pendingUpdates = this.pendingUpdates || new Map(); // messageId -> array of pending update messages
    this.renderingMessages = this.renderingMessages || new Set(); // messageIds currently being rendered

    // Set event source for capture system (parent class property)
    this.eventSource = 'opencode';

    // SSE Connection state
    this.sseConnection = null;
    this.connected = false;
    this.shouldReconnect = true;
    this.reconnectTimer = null;
    this._hasTriedAutoStart = false; // Track if we've tried auto-starting server

    // ESC key interruption state
    this.lastEscPress = 0; // Timestamp of last ESC press for double-press detection
    this.isGenerating = false; // Track if AI is currently generating response
    this.generatingSessions = this.generatingSessions || new Set(); // Track generating state per session
    this._busyTimeouts = new Map(); // Per-session debounce timers for idle detection (always fresh)

    // Set default variant if not present
    if (!this.variant) {
      this.variant = 'high';
    }

    // Project focus state - preserve during hot reload
    this.currentProject = this.currentProject || null; // { path, name, indexContent } or null
    if (this.projectPath && !this.currentProject) {
      // Restore project if projectPath is set (hot reload scenario)
      await this.selectProject(this.projectPath);
    }
    // Per-session project mapping: sessionId -> projectPath (persisted to localStorage)
    this.sessionProjects = this.sessionProjects || this.loadSessionProjectsFromStorage();

    // Event capture already initialized by parent, but preserve existing logic for safety
    // this._eventCapture and this._replayMode are set by parent's initialize()

    // Update UI
    this.updateStatus('Connecting...', false);
    this.updateServerButton();
    this.updateVariantButton();

    this.addEventListener('contextmenu', evt => this.createBaseContextMenu(evt), false);

    // Setup input handling using base class method
    this.setupInputHandling('#messageInput', this.onSendButton);

    // Setup sessions component
    this.setupSessionsComponent();

    // Setup working directory selector
    this.setupWorkdirSelector();

    // Setup project selector
    this.setupProjectSelector();

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
    // Auto-reconnect to running server (AUTOSTART disabled - server must be started manually)
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
      
      // Reset auto-start flag on successful connection
      this._hasTriedAutoStart = false;

      // Load existing sessions
      await this.loadSessions();

      // Restore saved session if present
      if (this.currentSessionId && !this.currentSession) {
        const savedSession = this.sessions.find(s => s.id === this.currentSessionId);
        if (savedSession) {
          this.log(`Restoring saved session: ${savedSession.id}`);
          await this.selectSession(savedSession);
        }
      }

      // Connect to event stream
      this.connectEventStream();

      lively.success('Connected to OpenCode server');

    } catch (error) {
      this.updateStatus('Disconnected', false);
      this.connected = false;
      
      // AUTOSTART DISABLED - Server must be started manually via button
      // Try to auto-start server on first failure (only once)
      // if (this.shouldReconnect && !this._hasTriedAutoStart) {
      //   this._hasTriedAutoStart = true;
      //   this.log('Server not running - attempting to start automatically...');
      //   await this.startServer();
      //   // startServer() already schedules connection attempt
      //   return;
      // }
      
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

      this.sseConnection.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          await this.handleEvent(data);
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

  async replayMessageEvent(event, replaySessionId) {
    // When called from UI replay controls (stepForwardOneEvent / scheduleEventFromIndex),
    // replaySessionId is undefined. Fall back to the current session so that handleEvent's
    // "this.currentSession.id === sessionId" guard passes:
    //   - Standalone replay: currentSession.id is the synthetic replay-session-* created
    //     by enableReplay(), so all events are routed to it regardless of the original ID.
    //   - Workspace replay: enableReplay() keeps the real session on the child component,
    //     so currentSession.id already matches the original ID in the event data.
    const sessionId = replaySessionId || (this._replayMode ? this.currentSession?.id : null);
    await this.handleEvent(event.data, sessionId);
  }
  
  async handleEvent(data, replaySessionId = null) {
    // Track event types for analysis
    const eventType = data.type;
    if (eventType) {
      LivelyOpencode.eventTypeLog.push(eventType);
      const currentCount = LivelyOpencode.eventTypeTally.get(eventType) || 0;
      LivelyOpencode.eventTypeTally.set(eventType, currentCount + 1);
    }
    
    // Log all events for debugging
    // this.log('[opencode] handleEvent', data);

    let sessionId = replaySessionId; // Use replay session if provided
    if (!sessionId) {
      // Extract session ID from event data (normal live mode)
      if (data.type === 'message.updated') {
        sessionId = data.properties?.info?.sessionID;
      } else if (data.type === 'message.part.updated') {
        sessionId = data.properties?.part?.sessionID;
      } else if (data.type === 'session.idle' || data.type === 'session.status') {
        sessionId = data.properties?.sessionID;
      } else if (data.type === 'session.updated') {
        // session.updated puts the ID under properties.info.id
        sessionId = data.properties?.info?.id || data.properties?.sessionID;
      } else if (data.type === 'todo.updated') {
        sessionId = data.properties?.sessionID;
      } else if (data.type === 'permission.asked') {
        sessionId = data.properties?.sessionID;
      }
    }

    // Capture event for replay (skip if in replay mode)
    if (!this._replayMode && sessionId) {
      this.captureEvent('sse', data, sessionId);
    }

    // If this event's session is unknown, a new subagent session was spawned — refresh list
    if (sessionId && !this._replayMode) {
      const isKnown = this.allSessions.some(s => s.id === sessionId);
      if (!isKnown) {
        this.loadSessions();
      }
    }

    // Handle different event types from OpenCode server
    if (data.type === 'message.updated') {
      // Message updated - update specific message in memory
      if (sessionId && this.currentSession && this.currentSession.id === sessionId) {
        const messageInfo = data.properties?.info;
        if (messageInfo) {
          // Pass the full message properties (info + parts) so parts are also updated
          await this.updateOpenCodeMessageFromEvent(sessionId, messageInfo, data.properties?.parts);
        }
      }
    } else if (data.type === 'message.part.updated') {
      if (sessionId && this.currentSession && this.currentSession.id === sessionId) {
        const part = data.properties?.part;
        if (part) {
          await this.updateOpenCodePart(sessionId, part);
        }
      }
    } else if (data.type === 'session.updated' || data.type === 'session.idle') {
      if (data.type === 'session.idle') {
        this.markSessionIdle(sessionId);
      }
    } else if (data.type === 'session.status') {
      // session.status fires repeatedly while busy; never fires "idle" type.
      // Use it to set the generating flag, and debounce to detect completion.
      if (sessionId && data.properties?.status?.type === 'busy') {
        this.markSessionBusy(sessionId);
      }
    } else if (data.type === 'todo.updated') {
      // TODO list updated - refresh board if this is the current session
      if (sessionId && this.currentSession && this.currentSession.id === sessionId) {
        const todos = data.properties?.todos;
        if (todos) {
          this.log(`TODOs updated for session ${sessionId}: ${todos.length} items`);
          this.updateBoard(todos);
        }
      }
    } else if (data.type === 'permission.asked') {
      // Permission request - show UI to approve/deny
      if (sessionId && this.currentSession && this.currentSession.id === sessionId) {
        const permission = data.properties;
        if (permission) {
          this.log(`Permission requested: ${permission.permission} - ${permission.patterns}`);
          await this.handlePermissionRequest(permission);
        } else {
          console.warn('[opencode] permission.asked event has no properties:', data);
        }
      }
    } else if (data.type === 'session') {
      this.loadSessions();
    }

    const statusInfo = this.inferStatusFromEvent(data, sessionId);
    if (statusInfo) {
      this.dispatchMessageEvent('opencode:status-change', statusInfo);
    }
  }

  /**
   * Handle a permission request from the OpenCode server.
   * Shows a dialog to the user and sends their response back to the server.
   * 
   * @param {Object} permission - The permission request object
   * @param {string} permission.id - Permission request ID
   * @param {string} permission.sessionID - Session ID
   * @param {string} permission.permission - Permission type (e.g., "tool.external_directory")
   * @param {string[]} permission.patterns - Patterns being requested (e.g., ["/etc/group"])
   * @param {Object} permission.metadata - Additional metadata
   */
  async handlePermissionRequest(permission) {
    const { id, sessionID, permission: permType, patterns, metadata } = permission;
    
    // Show notification
    lively.warn(`Permission requested: ${permType} - ${patterns?.join(', ')}`);
    
    // Show permission UI in the chat
    await this.showPermissionUI(permission);
  }

  /**
   * Show permission request UI in the chat area
   */
  async showPermissionUI(permission) {
    const { id, sessionID, permission: permType, patterns, metadata } = permission;
    
    // Create permission UI element
    const permissionDiv = document.createElement('div');
    permissionDiv.className = 'permission-request-ui';
    permissionDiv.innerHTML = `
      <div class="permission-header">🔒 Permission Request</div>
      <div class="permission-body">
        <div class="permission-type"><strong>Type:</strong> ${permType}</div>
        ${patterns && patterns.length > 0 ? `
          <div class="permission-patterns">
            <strong>Files/Patterns:</strong>
            <ul>${patterns.map(p => `<li>${p}</li>`).join('')}</ul>
          </div>
        ` : ''}
        ${metadata && Object.keys(metadata).length > 0 ? `
          <details class="permission-metadata">
            <summary>Additional details</summary>
            <pre>${JSON.stringify(metadata, null, 2)}</pre>
          </details>
        ` : ''}
      </div>
      <div class="permission-actions">
        <button class="permission-btn permission-approve-once">Approve Once</button>
        <button class="permission-btn permission-approve-always">Approve Always</button>
        <button class="permission-btn permission-reject">Reject</button>
      </div>
    `;
    
    // Add to messages container
    const messagesContainer = this.get('#messagesContainer');
    
    if (messagesContainer) {
      messagesContainer.appendChild(permissionDiv);
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
      console.error('[opencode] messagesContainer not found! Cannot show permission UI.');
      // Fallback to native dialog
      const approved = confirm(`Permission requested: ${permType}\n\nPatterns: ${patterns?.join(', ')}\n\nApprove?`);
      const response = approved ? 'once' : 'reject';
      await this.submitPermissionResponse(id, sessionID, response, permType, patterns);
      return;
    }
    
    // Set up button handlers
    const approveOnceBtn = permissionDiv.querySelector('.permission-approve-once');
    const approveAlwaysBtn = permissionDiv.querySelector('.permission-approve-always');
    const rejectBtn = permissionDiv.querySelector('.permission-reject');
    
    const submitResponse = async (response) => {
      // Disable all buttons
      approveOnceBtn.disabled = true;
      approveAlwaysBtn.disabled = true;
      rejectBtn.disabled = true;
      
      const success = await this.submitPermissionResponse(id, sessionID, response, permType, patterns);
      
      if (success) {
        // Update UI to show submitted state
        permissionDiv.innerHTML = `
          <div class="permission-submitted">
            Permission ${response === 'reject' ? 'rejected' : 'approved'} ${response === 'always' ? '(remembered)' : ''} - waiting for agent...
          </div>
        `;
      } else {
        // Re-enable buttons on error
        approveOnceBtn.disabled = false;
        approveAlwaysBtn.disabled = false;
        rejectBtn.disabled = false;
      }
    };
    
    approveOnceBtn.addEventListener('click', () => submitResponse('once'));
    approveAlwaysBtn.addEventListener('click', () => submitResponse('always'));
    rejectBtn.addEventListener('click', () => submitResponse('reject'));
  }

  /**
   * Submit permission response to server
   */
  async submitPermissionResponse(permissionId, sessionID, response, permType, patterns) {
    try {
      const url = `${this.serverUrl}/session/${sessionID}/permissions/${permissionId}`;
      
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`[opencode] Permission response error:`, errorText);
        lively.error(`Failed to submit permission response: ${resp.status}`);
        return false;
      }
      
      this.log(`Permission ${response} for ${permType}: ${patterns}`);
      lively.notify(`Permission ${response}`);
      return true;
    } catch (error) {
      console.error('[opencode] Error submitting permission response:', error);
      lively.error('Error submitting permission: ' + error.message);
      return false;
    }
  }

  /**
   * Mark a session as actively generating (busy).
   * Resets a debounce timer: if no new busy signal arrives within 5s, mark idle.
   */
  markSessionBusy(sessionId) {
    if (!sessionId) return;
    const wasAlreadyBusy = this.generatingSessions.has(sessionId);
    this.generatingSessions.add(sessionId);
    if (sessionId === this.currentSession?.id) this.isGenerating = true;

    // Reset the idle debounce timer for this session
    if (this._busyTimeouts.has(sessionId)) {
      clearTimeout(this._busyTimeouts.get(sessionId));
    }
    this._busyTimeouts.set(sessionId, setTimeout(() => {
      this._busyTimeouts.delete(sessionId);
      this.markSessionIdle(sessionId);
    }, 5000));

    if (!wasAlreadyBusy) {
      this.updateSessionList();
    }
  }

  /**
   * Mark a session as idle (not generating). Clears any pending debounce timer.
   */
  markSessionIdle(sessionId) {
    if (!sessionId) return;
    if (this._busyTimeouts.has(sessionId)) {
      clearTimeout(this._busyTimeouts.get(sessionId));
      this._busyTimeouts.delete(sessionId);
    }
    if (this.generatingSessions.has(sessionId)) {
      this.generatingSessions.delete(sessionId);
      if (sessionId === this.currentSession?.id) this.isGenerating = false;
      this.updateSessionList();
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

      this.allSessions = await response.json();
      
      // Filter sessions by current working directory
      this.filterSessionsByWorkingDirectory();
      
      await this.updateSessionList();

    } catch (error) {
      console.error('Error loading sessions:', error);
      lively.error('Failed to load sessions');
    }
  }

  /**
   * Filter sessions to only show those matching the current working directory
   */
  filterSessionsByWorkingDirectory() {
    if (!this.workingDirectory) {
      this.sessions = this.allSessions;
      return;
    }

    // Filter sessions by directory property
    this.sessions = this.allSessions.filter(session => {
      return session.directory === this.workingDirectory;
    });

    this.log(`Filtered ${this.sessions.length} sessions for directory: ${this.workingDirectory}`);
  }

  /*MD ## Working Directory Selector Setup MD*/

  setupWorkdirSelector() {
    const workdirCombobox = this.get('#workdirCombobox');
    if (!workdirCombobox) return;

    // Load recent working directories from localStorage
    const recentDirs = this.getRecentWorkingDirectories();
    workdirCombobox.setOptions(recentDirs);

    // Update combobox to show current value
    if (this.workingDirectory) {
      workdirCombobox.value = this.workingDirectory;
    }

    // Handle directory changes
    workdirCombobox.addEventListener('change', async (evt) => {
      const newDir = workdirCombobox.value;
      if (!newDir || newDir === this.workingDirectory) return;

      await this.changeWorkingDirectory(newDir);
    });
  }

  getRecentWorkingDirectories() {
    try {
      const stored = localStorage.getItem('opencode-recent-workdirs');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading recent working directories:', error);
    }

    // Default directories
    return [
      '/home/jens/lively4/lively4-core',
      '/home/jens/lively4/lively4-server'
    ];
  }

  saveRecentWorkingDirectory(dir) {
    try {
      let recentDirs = this.getRecentWorkingDirectories();
      
      // Remove if already exists
      recentDirs = recentDirs.filter(d => d !== dir);
      
      // Add to front
      recentDirs.unshift(dir);
      
      // Keep only last 10
      recentDirs = recentDirs.slice(0, 10);
      
      localStorage.setItem('opencode-recent-workdirs', JSON.stringify(recentDirs));
      
      // Update combobox options
      const workdirCombobox = this.get('#workdirCombobox');
      if (workdirCombobox) {
        workdirCombobox.setOptions(recentDirs);
      }
    } catch (error) {
      console.error('Error saving recent working directory:', error);
    }
  }

  async changeWorkingDirectory(newDir) {
    lively.notify(`Switching to ${newDir}...`);

    // Stop current server if running
    if (LivelyOpencode.sharedServerRunning) {
      await this.stopServer();
    }

    // Update working directory and sync to shared state
    this.workingDirectory = newDir;
    LivelyOpencode.sharedWorkingDirectory = newDir;
    this.saveRecentWorkingDirectory(newDir);

    // Update combobox
    const workdirCombobox = this.get('#workdirCombobox');
    if (workdirCombobox) {
      workdirCombobox.value = newDir;
    }

    // Clear current session and project (they belong to old directory)
    this.currentSession = null;
    this.clearProject();

    // Filter sessions immediately (will show empty list until new server connects)
    this.filterSessionsByWorkingDirectory();
    await this.updateSessionList();

    // Refresh project selector with options for the new working directory
    this.updateProjectSelector();

    // Start server in new directory (will load sessions for new directory when connected)
    await this.startServer();
  }

  /*MD ## Project Focus MD*/

  /**
   * Initialize the project selector UI with the current available projects.
   */
  setupProjectSelector() {
    const projectCombobox = this.get('#projectCombobox');
    if (!projectCombobox) return;

    this.refreshProjectComboboxOptions();

    if (this.currentProject) {
      projectCombobox.value = this.currentProject.path;
    } else {
      projectCombobox.value = 'none';
    }

    projectCombobox.addEventListener('change', async (evt) => {
      const path = projectCombobox.value;
      if (!path || path === 'none') {
        this.clearProject();
      } else {
        await this.selectProject(path);
      }
    });

    // URL base input — maps local working dir path to lively4 server URL
    const urlBaseInput = this.get('#projectUrlBase');
    if (urlBaseInput) {
      urlBaseInput.value = this.loadProjectUrlBase();
      urlBaseInput.addEventListener('change', (evt) => {
        this.saveProjectUrlBase(urlBaseInput.value.trim());
      });
      urlBaseInput.addEventListener('blur', (evt) => {
        this.saveProjectUrlBase(urlBaseInput.value.trim());
      });
    }

    this.updateProjectIndicator();
  }


  onDebugLogTab() {
    this.switchPanelTab('debugLog')
  }
  onBoardTab() {
    this.switchPanelTab('board')
  }
  
  switchPanelTab(panelName) {
    // Update tab buttons
    const debugLogTab = this.get('#debugLogTab');
    const boardTab = this.get('#boardTab');
    
    if (debugLogTab) {
      debugLogTab.classList.toggle('active', panelName === 'debugLog');
    }
    if (boardTab) {
      boardTab.classList.toggle('active', panelName === 'board');
    }
    
    // Update content panels
    const debugLogContent = this.get('#debugLogContent');
    const boardContent = this.get('#boardContent');
    
    if (debugLogContent) {
      debugLogContent.classList.toggle('active', panelName === 'debugLog');
    }
    if (boardContent) {
      boardContent.classList.toggle('active', panelName === 'board');
    }
  }

  /**
   * Clear debug log button handler
   */
  onClearLogButton() {
    const debugLog = this.get('#debugLog');
    if (debugLog) {
      debugLog.innerHTML = '';
    }
  }

  /**
   * Fetch TODOs for a session from server
   * @param {string} sessionId - Session ID to fetch TODOs for
   */
  async fetchTodosForSession(sessionId) {
    if (!sessionId) return [];
    
    try {
      const response = await fetch(`${this.serverUrl}/session/${sessionId}/todo`);
      if (!response.ok) {
        console.warn(`Failed to fetch TODOs for session ${sessionId}: ${response.status}`);
        return [];
      }
      
      const todos = await response.json();
      this.log(`Fetched ${todos.length} TODOs for session ${sessionId}`);
      return todos;
    } catch (error) {
      console.error(`Error fetching TODOs for session ${sessionId}:`, error);
      return [];
    }
  }

  /**
   * Update board with TODOs and session links
   * @param {Array} todos - Array of TODO items
   */
  updateBoard(todos) {
    const board = this.get('#agentBoard');
    if (!board) return;
    
    // Update context for URL building and path shortening
    if (board.setContext) {
      board.setContext({
        workingDirectory: this.workingDirectory,
        projectPath: this.currentProject?.path,
        urlBase: this.loadProjectUrlBase()
      });
    }
    
    // Update TODOs
    if (board.updateTodos) {
      board.updateTodos(todos);
    }
    
    // Update project focus link
    if (board.setProjectFocus && this.currentProject) {
      const indexUrl = this.currentProject.url ? this.currentProject.url + 'index.md' : `${this.currentProject.path}/index.md`;
      board.setProjectFocus(indexUrl);
    }
  }

  /**
   * Scan message parts for tool uses and update the board
   * Tracks all tool usages and file operations
   * @param {Object} message - OpenCode message object with parts
   */
  updateBoardWithFileOperations(message) {
    const board = this.get('#agentBoard');
    if (!board) return;
    
    // Update context for URL building and path shortening
    if (board.setContext) {
      board.setContext({
        workingDirectory: this.workingDirectory,
        projectPath: this.currentProject?.path,
        urlBase: this.loadProjectUrlBase()
      });
    }
    
    const parts = message.parts || [];
    
    for (const part of parts) {
      const toolName = part.name || part.tool;
      if (!toolName) continue;
      
      // Track all tool usages
      if (board.addToolUsage) {
        board.addToolUsage(toolName);
      }
      
      // Track file operations specifically
      const input = part.input || part.state?.input || {};
      const filePath = input.filePath || input.path;
      
      if (!filePath) continue;
      
      // Check for Read tools
      if (toolName === 'mcp_read' || toolName === 'read_file' || toolName === 'read') {
        if (board.addFileRead) {
          board.addFileRead(filePath);
        }
      }
      
      // Check for Write tools  
      if (toolName === 'mcp_write' || toolName === 'write_file' || toolName === 'write' || 
          toolName === 'mcp_edit' || toolName === 'edit') {
        if (board.addFileWritten) {
          board.addFileWritten(filePath);
        }
      }
    }
  }

  /**
   * Scan all messages for a session and update board with file operations
   * @param {string} sessionId - Session ID to scan messages for
   */
  updateBoardWithAllMessages(sessionId) {
    const messages = this.messages.get(sessionId);
    if (!messages) return;
    
    // Scan all messages for file operations
    for (const message of messages) {
      this.updateBoardWithFileOperations(message);
    }
  }

  /**
   * Load the stored URL base for fetching project files.
   * e.g. "http://localhost:9005/lively4-core/"
   */
  loadProjectUrlBase() {
    try {
      return localStorage.getItem('opencode-project-url-base') || '';
    } catch (e) {
      return '';
    }
  }

  /**
   * Save the URL base for fetching project files to localStorage.
   * @param {string} urlBase - e.g. "http://localhost:9005/lively4-core/"
   */
  saveProjectUrlBase(urlBase) {
    try {
      localStorage.setItem('opencode-project-url-base', urlBase);
      lively.success(`URL base saved: ${urlBase || '(cleared)'}`);
    } catch (e) {
      console.error('[project] Error saving URL base:', e);
    }
  }

  onClearProjectButton() {
    this.clearProject();
  }

  /**
   * Select a project by path (relative to working directory).
   * Tries to load its index.md, saves the path to localStorage,
   * and binds the project to the current session.
   * @param {string} projectPath - Relative path, e.g. 'src/ai-workspace'
   */
  async selectProject(projectPath) {
    // Try to load index.md from this path
    const content = await this.tryFetchProjectFile(projectPath, 'index.md');

    const project = {
      path: projectPath,
      url: this.buildProjectUrl(projectPath),
      name: projectPath.split('/').pop(),
      indexContent: content // null if no index.md exists
    };

    this.currentProject = project;
    
    // Save to temp property (persisted via session binding)
    this.projectPath = projectPath;

    // Remember this path for the current working directory
    this.saveRecentProject(this.workingDirectory, projectPath);

    // Bind project to current session
    if (this.currentSession) {
      this.setSessionProject(this.currentSession.id, projectPath);
    }

    this.updateProjectSelector();

    const hasContext = content ? ' (with index.md context)' : '';
    lively.success(`Project focus: ${project.name}${hasContext}`);
  }

  /**
   * Clear the current project focus (sets combobox to "none").
   */
  clearProject() {
    this.currentProject = null;
    
    // Clear temp property
    this.projectPath = null;

    // Bind "none" to current session
    if (this.currentSession) {
      this.setSessionProject(this.currentSession.id, null);
    }

    const projectCombobox = this.get('#projectCombobox');
    if (projectCombobox) {
      projectCombobox.value = 'none';
    }
    this.updateProjectIndicator();
  }

  /**
   * Refresh the project combobox options: always 'none' first, then recent paths.
   */
  refreshProjectComboboxOptions() {
    const projectCombobox = this.get('#projectCombobox');
    if (!projectCombobox) return;
    const recent = this.getRecentProjectsForWorkingDir(this.workingDirectory);
    projectCombobox.setOptions(['none', ...recent]);
  }

  /**
   * Update the project selector UI to reflect current state.
   */
  updateProjectSelector() {
    this.refreshProjectComboboxOptions();
    const projectCombobox = this.get('#projectCombobox');
    if (projectCombobox) {
      projectCombobox.value = this.currentProject ? this.currentProject.path : 'none';
    }
    this.updateProjectIndicator();
  }

  /**
   * Load and apply the stored project for a session (called on session switch).
   * @param {string} sessionId
   */
  async applyProjectForSession(sessionId) {
    const storedPath = this.sessionProjects.get(sessionId);

    if (storedPath === undefined) {
      // No record for this session yet - keep current project as-is
      return;
    }

    if (!storedPath) {
      // Explicitly set to "none"
      this.currentProject = null;
      this.projectPath = null;
    } else if (!this.currentProject || this.currentProject.path !== storedPath) {
      // Different project - load it silently (no success toast)
      const content = await this.tryFetchProjectFile(storedPath, 'index.md');
      this.currentProject = {
        path: storedPath,
        url: this.buildProjectUrl(storedPath),
        name: storedPath.split('/').pop(),
        indexContent: content
      };
      this.projectPath = storedPath;
    }

    this.updateProjectSelector();
  }

  /**
   * Update the project indicator badge shown below the combobox.
   */
  updateProjectIndicator() {
    const indicator = this.get('#projectIndicator');
    if (!indicator) return;

    if (this.currentProject) {
      const hasIndex = this.currentProject.indexContent ? ' [index.md]' : '';
      indicator.textContent = this.currentProject.path + hasIndex;
      indicator.style.display = 'block';
      if (this.currentProject.indexContent) {
        const preview = this.currentProject.indexContent.slice(0, 300);
        indicator.title = `${this.currentProject.path}/index.md:\n\n${preview}`;
      } else {
        indicator.title = `No index.md in ${this.currentProject.path}`;
      }
    } else {
      indicator.style.display = 'none';
    }
  }

  /**
   * Return remembered project paths for a given working directory.
   * @param {string} workingDir
   * @returns {string[]}
   */
  getRecentProjectsForWorkingDir(workingDir) {
    if (!workingDir) return [];
    try {
      const stored = localStorage.getItem('opencode-recent-projects');
      const all = stored ? JSON.parse(stored) : {};
      return all[workingDir] || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save a project path as recently used for the given working directory.
   * Keeps the list capped at 20 entries, most-recent first.
   * @param {string} workingDir
   * @param {string} projectPath
   */
  saveRecentProject(workingDir, projectPath) {
    if (!workingDir || !projectPath) return;
    try {
      const stored = localStorage.getItem('opencode-recent-projects');
      const all = stored ? JSON.parse(stored) : {};
      let list = all[workingDir] || [];
      list = list.filter(p => p !== projectPath); // remove duplicates
      list.unshift(projectPath);                   // most-recent first
      list = list.slice(0, 20);
      all[workingDir] = list;
      localStorage.setItem('opencode-recent-projects', JSON.stringify(all));
    } catch (e) {
      console.error('[project] Error saving recent project:', e);
    }
  }

  /**
   * Load the session→project map from localStorage into a Map.
   * @returns {Map<string, string|null>}
   */
  loadSessionProjectsFromStorage() {
    try {
      const stored = localStorage.getItem('opencode-session-projects');
      if (!stored) return new Map();
      const obj = JSON.parse(stored);
      return new Map(Object.entries(obj));
    } catch (e) {
      return new Map();
    }
  }

  /**
   * Bind a project path to a session and persist to localStorage.
   * @param {string} sessionId
   * @param {string|null} projectPath - null means "none"
   */
  setSessionProject(sessionId, projectPath) {
    if (!sessionId) return;
    this.sessionProjects.set(sessionId, projectPath);
    try {
      const stored = localStorage.getItem('opencode-session-projects');
      const obj = stored ? JSON.parse(stored) : {};
      obj[sessionId] = projectPath;
      localStorage.setItem('opencode-session-projects', JSON.stringify(obj));
    } catch (e) {
      console.error('[project] Error saving session project:', e);
    }
  }

  /**
   * Build a full URL for a project path using the configured URL base.
   * e.g. buildProjectUrl('src/ai-workspace') → 'http://localhost:9005/lively4-core/src/ai-workspace/'
   * @param {string} projectPath - Relative path, e.g. 'src/ai-workspace'
   * @returns {string} Full URL with trailing slash
   */
  buildProjectUrl(projectPath) {
    const storedBase = this.loadProjectUrlBase();
    let base;
    if (storedBase) {
      // Ensure trailing slash
      base = storedBase.endsWith('/') ? storedBase : storedBase + '/';
    } else {
      // Fallback: derive from lively4url browser global if available
      if (typeof lively4url !== 'undefined') {
        base = lively4url.replace(/[^/]+$/, '');
      } else {
        // No URL base configured and no browser global - return path as-is
        return projectPath + '/';
      }
    }
    return base + projectPath + '/';
  }

  /**
   * Try to load a file from a path relative to the lively4 web root.
   * Uses the configured URL base (e.g. "http://localhost:9005/lively4-core/")
   * to map the subproject path to a fetchable URL.
   * Falls back to deriving base from lively4url if no URL base is configured.
   * Returns file content as string, or null if not found / no server.
   */
  async tryFetchProjectFile(relativePath, filename) {
    try {
      const storedBase = this.loadProjectUrlBase();
      let base;
      if (storedBase) {
        // Ensure trailing slash
        base = storedBase.endsWith('/') ? storedBase : storedBase + '/';
      } else {
        // Fallback: derive from lively4url browser global
        base = lively4url.replace(/[^/]+$/, '');
      }
      const url = base + relativePath + '/' + filename;
      const response = await fetch(url);
      return response.ok ? await response.text() : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Build the context message to inject as the first user message in a session.
   * The project context is wrapped in <system-reminder> tags so the renderer
   * displays it as a collapsible details block, and Claude Code treats it as
   * contextual information rather than the primary message.
   *
   * The subproject's index.md acts as a second-level CLAUDE.md — it can store
   * project-focus-specific insights, conventions, and notes for AI assistants.
   */
  buildProjectContextMessage(message) {
    if (!this.currentProject) return message;

    const projectUrl = this.currentProject.url || this.currentProject.path;
    const indexUrl = projectUrl + 'index.md';
    
    const contextParts = [
      `We are focusing on subproject [${projectUrl}](${projectUrl})`
    ];

    if (this.currentProject.indexContent) {
      contextParts.push(
        `\nThe [${indexUrl}](${indexUrl}) file below acts as a second-level CLAUDE.md for this subproject — it contains project-focus-specific insights, conventions, and context. Read it carefully:\n\n${this.currentProject.indexContent}`
      );
    } else {
      contextParts.push(
        `\nNote: [${indexUrl}](${indexUrl}) can be used to store project-focus-specific insights, conventions, and context (like a second-level CLAUDE.md). No index.md found yet.`
      );
    }

    const context = contextParts.join('\n');
    return `${message}\n\n<system-reminder>\n${context}\n</system-reminder>`;
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

    sessionsComponent.addEventListener('sessions-load-requested', (evt) => {
      this.loadSelectedSessions(evt.detail.sessionIds);
    });
  }

  /**
   * Build a per-model accumulated token map from an array of OpenCode messages.
   * Structure: { "claude-sonnet-4-5": { input, output, cacheRead, cacheWrite }, ... }
   * Only models/messages that carry token data are included.
   * @param {Array} messages
   * @returns {Object} accumulatedTokens map
   */
  computeAccumulatedTokens(messages) {
    const acc = {};
    for (const msg of messages) {
      const tokens = msg.info?.tokens;
      const modelID = msg.info?.modelID;
      if (!tokens || !modelID) continue;
      const modelKey = modelID.replace(/-\d{8}$/, '');
      if (!acc[modelKey]) {
        acc[modelKey] = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
      }
      acc[modelKey].input     += tokens.input          || 0;
      acc[modelKey].output    += tokens.output         || 0;
      acc[modelKey].cacheRead += tokens.cache?.read    || 0;
      acc[modelKey].cacheWrite += tokens.cache?.write  || 0;
    }
    return acc;
  }

  /**
   * Compute total cost in USD from an accumulatedTokens map.
   * @param {Object} accumulatedTokens - per-model token map
   * @returns {number} Total cost in USD (0 if map is empty/unknown models)
   */
  computeCostFromAccumulatedTokens(accumulatedTokens) {
    let total = 0;
    for (const [modelKey, tokens] of Object.entries(accumulatedTokens)) {
      const cost = computeCost(modelKey, {
        baseInput:    tokens.input,
        output:       tokens.output,
        cacheHit:     tokens.cacheRead,
        cacheWrite5m: tokens.cacheWrite
      });
      if (cost != null) total += cost;
    }
    return total;
  }

  /**
   * Compute total cost for a session from in-memory messages.
   * Returns null if messages are not yet loaded for this session.
   * @param {string} sessionId
   * @returns {number|null} Total cost in USD, or null if not available
   */
  getTotalSessionCost(sessionId) {
    const messages = this.messages.get(sessionId);
    if (!messages) return null;
    return this.computeCostFromAccumulatedTokens(
      this.computeAccumulatedTokens(messages)
    );
  }

  /**
   * Lightweight update: refresh only the cost field for a single session
   * in the sessions component without re-fetching all metadata.
   * Also persists updated accumulatedTokens to IndexedDB.
   * @param {string} sessionId
   */
  async updateSessionCostDisplay(sessionId) {
    const messages = this.messages.get(sessionId);
    if (!messages) return;

    // Recompute accumulated tokens from in-memory messages (authoritative)
    const accumulatedTokens = this.computeAccumulatedTokens(messages);
    const cost = this.computeCostFromAccumulatedTokens(accumulatedTokens);

    // Persist updated tokens to IndexedDB
    if (this.canWriteToDatabase()) {
      try {
        const existing = await LivelyOpencode.sessionMetaDB.sessionMeta.get(sessionId);
        if (existing) {
          existing.accumulatedTokens = accumulatedTokens;
          existing.lastUpdated = Date.now();
          await LivelyOpencode.sessionMetaDB.sessionMeta.put(existing);
        }
      } catch (error) {
        console.error('Error persisting accumulated tokens:', error);
      }
    }

    // Update the cost in the sessions sidebar and re-render
    const sessionsComponent = this.get('#sessionsComponent');
    if (!sessionsComponent) return;
    const sessions = sessionsComponent._sessions;
    if (!sessions) return;
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.cost = cost;
      sessionsComponent.render();
    }
  }

  async updateSessionList() {
    const sessionsComponent = this.get('#sessionsComponent');
    if (!sessionsComponent) return;

    // Load cached metadata for all sessions
    const metadataMap = await this.loadAllSessionMetadata();

    // Map sessions to component format with cached message counts and costs
    const sessionsData = this.sessions.map(session => {
      const metadata = metadataMap.get(session.id);

      // Prefer in-memory cost (most up-to-date); fall back to cached accumulated tokens
      let cost = this.getTotalSessionCost(session.id);
      if (cost == null && metadata?.accumulatedTokens) {
        cost = this.computeCostFromAccumulatedTokens(metadata.accumulatedTokens);
      }

      return {
        id: session.id,
        title: session.title || 'Untitled',
        timestamp: session.time?.updated || session.time?.created || null,
        messageCount: metadata?.messageCount,
        cost,
        isSubagent: !!metadata?.parentSessionId,
        parentSessionId: metadata?.parentSessionId || null,
        isGenerating: this.generatingSessions.has(session.id)
      };
    });

    // Update component (subagent sessions sorted below their parent)
    sessionsComponent.sessions = this.sortSessionsWithSubagents(sessionsData);
    sessionsComponent.activeSessionId = this.currentSession?.id;
    sessionsComponent.showDebug = this.showDebug;
  }

  /**
   * Sort sessions so each subagent appears directly below its parent.
   * Preserves original order for root sessions; orphaned subagents (parent
   * not in the list) are treated as roots so they are never dropped.
   */
  sortSessionsWithSubagents(sessions) {
    const sessionIds = new Set(sessions.map(s => s.id));
    const childrenMap = new Map();
    const roots = [];

    for (const session of sessions) {
      const parentId = session.parentSessionId;
      if (parentId && sessionIds.has(parentId)) {
        const siblings = childrenMap.get(parentId) || [];
        siblings.push(session);
        childrenMap.set(parentId, siblings);
      } else {
        roots.push(session);
      }
    }

    function flatten(session) {
      const children = childrenMap.get(session.id) || [];
      return [session, ...children.flatMap(flatten)];
    }

    return roots.flatMap(flatten);
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
    
    // Save session ID and sync to shared state
    this.currentSessionId = session.id;
    LivelyOpencode.sharedSessionId = session.id;
    
    await this.updateSessionList();

    // Load messages for this session
    await this.loadMessagesForSession(session.id);

    // Enable input
    const input = this.get('#messageInput');
    if (input) input.disabled = false;

    // Clear board before loading new session data
    const board = this.get('#agentBoard');
    if (board && board.clearAll) {
      board.clearAll();
    }

    // Restore project focus for this session
    await this.applyProjectForSession(session.id);
    
    // Load TODOs for this session
    const todos = await this.fetchTodosForSession(session.id);
    this.updateBoard(todos);
    
    // Update board with file operations from all messages
    this.updateBoardWithAllMessages(session.id);

    // Display messages
    this.displayMessages();
  }

  /**
   * Update a specific message from an event
   * This creates or updates the message structure (role, timestamp, etc.)
   * Parts come later through message.part.updated events
   */
  async updateOpenCodeMessageFromEvent(sessionId, messageInfo, eventParts) {
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
      const msg = messages[messageIndex];
      // Update existing message info
      msg.info = messageInfo;
      // Update lastModified timestamp
      msg.lastModified = Date.now();

      // If the event includes parts (final snapshot), update them and re-render
      if (eventParts && eventParts.length > 0) {
        msg.parts = eventParts;
        this.log(`[opencode] message.updated with ${eventParts.length} parts for ${msgId}, re-rendering`);
        await this.updateOpenCodeMessage(messageInfo.id, msg);
        // Update board with file operations from this message
        this.updateBoardWithFileOperations(msg);
      } else if (messageInfo.error) {
        // Server error with no parts - re-render to show the error
        this.log(`[opencode] message.updated with error for ${msgId}: ${messageInfo.error.name}`);
        await this.updateOpenCodeMessage(messageInfo.id, msg);
      } else {
        // No parts in event - just update debug stats panel
        if (this.showDebug) {
          const chatMessage = this.messageElements.get(messageInfo.id);
          if (chatMessage && chatMessage.renderUsageStats) {
            const usageEl = chatMessage.get('#usageStats');
            if (usageEl) chatMessage.renderUsageStats(usageEl, messageInfo);
          }
        }
      }

      // Live-update session cost display when token data arrives
      if (messageInfo.tokens) {
        this.updateSessionCostDisplay(sessionId);
      }
    } else {
      // Create new message with info (parts will be added by message.part.updated)
      const messageId = messageInfo.id;
      const now = Date.now();

      // Check if message already exists in DB to preserve localTimestamp (skip in replay mode)
      let existing = null;
      if (!this._replayMode) {
        existing = await LivelyOpencode.messagesdb.messages.get({
          sessionId: sessionId,
          messageId: messageId
        });
      }

      const newMsg = {
        info: messageInfo,
        parts: [],
        localTimestamp: existing?.localTimestamp || now,  // Preserve created time or create
        lastModified: now  // Always update to current time
      };

      // IMPORTANT: Merge any buffered parts that arrived before this message was created
      // This handles the race condition where message.part.updated arrives before message.updated
      if (this.pendingUpdates && this.pendingUpdates.has(messageId)) {
        const pending = this.pendingUpdates.get(messageId);
        this.log(`[opencode] merging ${pending.length} buffered parts into new message ${msgId}`);
        // Merge parts from all buffered updates
        for (const bufferedMsg of pending) {
          if (bufferedMsg.parts) {
            for (const part of bufferedMsg.parts) {
              // Only add if not already present
              if (!newMsg.parts.find(p => p.id === part.id)) {
                newMsg.parts.push(part);
              }
            }
          }
        }
        // Clear pending updates since we've merged them
        this.pendingUpdates.delete(messageId);
      }

      messages.push(newMsg);
      // this.log('[opencode] Created message from message.updated:', msgId, 'role:', messageInfo.role);

      // Save to IndexedDB (skip in replay mode)
      if (!this._replayMode) {
        await LivelyOpencode.messagesdb.messages.put({
          sessionId: sessionId,
          messageId: messageId,
          localTimestamp: newMsg.localTimestamp,
          lastModified: newMsg.lastModified,
          message: newMsg  // Full message for future use
        });
      }

      // Add the new message to UI incrementally
      await this.renderMessage(newMsg);

      // Update cached metadata (increment message count)
      this.incrementCachedMessageCount(sessionId, messageInfo);
      // Dispatch event for workspace integration
      this.dispatchMessageEvent('opencode:message-added', {
          sessionId,
          role: messageInfo.role,
          timestamp: now, // use our own time... to compare make it compatible with realtime-chat
          type: 'opencode',
          metadata: { id: messageInfo.id },
          message: newMsg // Include the full message for direct access
        });
    }
  }

  /**
   * Update a specific part from an event - SIMPLIFIED to work with OpenCode messages
   */
  async updateOpenCodePart(sessionId, part) {
    const msgId = this.truncateMsgId(part.messageID);
    this.log(`[opencode] updateOpenCodePart ${part.type} for message ${msgId}`);

    const messages = this.messages.get(sessionId);
    if (!messages) {
      this.log(`[opencode] updateOpenCodePart: no messages for session ${sessionId}`);
      return;
    }

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

        // Update lastModified timestamp and save to IndexedDB (skip in replay mode)
        msg.lastModified = Date.now();
        if (!this._replayMode) {
          await LivelyOpencode.messagesdb.messages.put({
            sessionId: sessionId,
            messageId: msg.info.id,
            localTimestamp: msg.localTimestamp,  // Keep original creation time
            lastModified: msg.lastModified,       // Update modification time
            message: msg
          });
        }

        this.updateOpenCodeMessage(messageId, msg);
      } else {
        // Message doesn't exist yet - buffer this part update
        // It will be applied when the message is created
        this.log(`[opencode] Text part arrived before message exists for ${msgId}, buffering`);

        // We need to buffer the entire part, not just this update
        // Store it temporarily and it will be picked up when the message is created
        if (!this.pendingUpdates.has(messageId)) {
          this.pendingUpdates.set(messageId, []);
        }
        // Create a synthetic message with just this part for buffering
        const syntheticMsg = {
          info: { id: messageId },
          parts: [{ type: 'text', text: part.text || '', id: part.id }]
        };
        this.pendingUpdates.get(messageId).push(syntheticMsg);
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

        // Update lastModified timestamp and save to IndexedDB (skip in replay mode)
        msg.lastModified = Date.now();
        if (!this._replayMode) {
          await LivelyOpencode.messagesdb.messages.put({
            sessionId: sessionId,
            messageId: msg.info.id,
            localTimestamp: msg.localTimestamp,  // Keep original creation time
            lastModified: msg.lastModified,       // Update modification time
            message: msg
          });
        }

        this.updateOpenCodeMessage(messageId, msg);

        // Detect task tool completions to record subagent parent relationships
        if ((toolName === 'task' || toolName === 'mcp_task') && part.state?.status === 'completed') {
          const subagentSessionId = part.state?.metadata?.sessionId;
          if (subagentSessionId && sessionId) {
            this.recordSubagentSession(subagentSessionId, sessionId);
          }
        }
        
        // Update board with file operations when tool completes
        if (part.state?.status === 'completed') {
          this.updateBoardWithFileOperations(msg);
        }
      } 
    }
    // For tool_use/tool_result: these come from server fetch after tool completion
  }

  /**
   * Scan a set of messages for completed task tool calls and record any
   * subagent sessions discovered in those calls.
   * @param {string} parentSessionId - The session that owns these messages
   * @param {Array} messages - OpenCode message objects to scan
   */
  async scanMessagesForSubagentSessions(parentSessionId, messages) {
    if (this._replayMode) return;
    for (const msg of messages) {
      for (const part of (msg.parts || [])) {
        if (part.type === 'tool' &&
            (part.tool === 'task' || part.tool === 'mcp_task') &&
            part.state?.status === 'completed') {
          const subagentSessionId = part.state?.metadata?.sessionId;
          if (subagentSessionId) {
            await this.recordSubagentSession(subagentSessionId, parentSessionId, false);
          }
        }
      }
    }
  }

  /**
   * Record that a session is a subagent session spawned from a parent session.
   * Persists parentSessionId into the session's IndexedDB metadata record.
   * @param {string} subagentSessionId - The subagent's session ID
   * @param {string} parentSessionId - The parent session's ID
   * @param {boolean} refreshList - Whether to refresh the session list after recording (default true)
   */
  async recordSubagentSession(subagentSessionId, parentSessionId, refreshList = true) {
    if (this._replayMode) return;
    try {
      const existing = await LivelyOpencode.sessionMetaDB.sessionMeta.get(subagentSessionId);
      if (existing) {
        if (existing.parentSessionId === parentSessionId) return; // already recorded, skip
        existing.parentSessionId = parentSessionId;
        await LivelyOpencode.sessionMetaDB.sessionMeta.put(existing);
      } else {
        await LivelyOpencode.sessionMetaDB.sessionMeta.put({
          sessionId: subagentSessionId,
          parentSessionId: parentSessionId,
          messageCount: 0,
          lastUpdated: Date.now(),
          lastMessageTime: null
        });
      }
      this.log('[opencode] Recorded subagent session:', subagentSessionId, 'parent:', parentSessionId);
      // Refresh session list so the subagent marker appears immediately
      if (refreshList) await this.updateSessionList();
    } catch (error) {
      console.error('Error recording subagent session:', error);
    }
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
   * Cache session metadata (message count, timestamps, accumulated tokens) to IndexedDB.
   * Accumulated tokens are stored as a per-model map so cost can be recomputed
   * without loading all messages into memory.
   * @param {string} sessionId - Session ID
   * @param {Array} opencodeMessages - Array of OpenCode messages
   */
  async cacheSessionMetadata(sessionId, opencodeMessages) {
    // CENTRALIZED DATABASE GUARD (inherited from LivelyChat)
    if (!this.canWriteToDatabase()) return;

    try {
      // Find the most recent message timestamp
      let lastMessageTime = null;
      if (opencodeMessages.length > 0) {
        const timestamps = opencodeMessages
          .map(msg => msg.info?.time?.updated || msg.info?.time?.created)
          .filter(t => t != null);
        if (timestamps.length > 0) {
          lastMessageTime = Math.max(...timestamps);
        }
      }

      // Accumulate token usage per model across all messages
      const accumulatedTokens = this.computeAccumulatedTokens(opencodeMessages);

      // Get existing record and mutate it in place to preserve all fields (e.g. parentSessionId)
      const metadata = (await LivelyOpencode.sessionMetaDB.sessionMeta.get(sessionId)) || { sessionId };
      metadata.messageCount = opencodeMessages.length;
      metadata.lastUpdated = Date.now();
      metadata.lastMessageTime = lastMessageTime;
      metadata.accumulatedTokens = accumulatedTokens;

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
    // Skip database operations in replay mode
    if (this._replayMode) return;

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

      // Enrich with localTimestamp from IndexedDB or create new (skip in replay mode)
      for (const msg of opencodeMessages) {
        const messageId = msg.info?.id;
        if (messageId) {
          const now = Date.now();
          let existing = null;
          if (!this._replayMode) {
            existing = await LivelyOpencode.messagesdb.messages.get({
              sessionId: sessionId,
              messageId: messageId
            });
          }

          msg.localTimestamp = existing?.localTimestamp || now;
          msg.lastModified = now;  // Update modification time on load

          // Save to DB (create or update) (skip in replay mode)
          if (!this._replayMode) {
            await LivelyOpencode.messagesdb.messages.put({
              sessionId: sessionId,
              messageId: messageId,
              localTimestamp: msg.localTimestamp,
              lastModified: msg.lastModified,
              message: msg
            });
          }
        }
      }

      this.messages.set(sessionId, opencodeMessages);

      this.log('[opencode] Loaded', opencodeMessages.length, 'OpenCode messages for session', sessionId);

      // Cache metadata to IndexedDB
      await this.cacheSessionMetadata(sessionId, opencodeMessages);

      // Scan messages for task tool completions to record subagent parent relationships
      await this.scanMessagesForSubagentSessions(sessionId, opencodeMessages);

    } catch (error) {
      console.error('Error loading messages:', error);
      // Initialize empty messages array if loading fails
      if (!this.messages.has(sessionId)) {
        this.messages.set(sessionId, []);
      }
    }
  }

  getMessages(sessionId) {
    if (!sessionId  && this.currentSession) {
      sessionId = this.currentSession.id
    }
    if (!sessionId) {
      return []
    }
    return this.messages.get(sessionId)
  }

  /**
   * Load and cache metadata for selected sessions
   * @param {string[]} sessionIds - Array of session IDs to load
   */
  async loadSelectedSessions(sessionIds) {
    if (!sessionIds || sessionIds.length === 0) return;

    lively.notify(`Loading ${sessionIds.length} session${sessionIds.length > 1 ? 's' : ''}...`);

    let loaded = 0;
    let failed = 0;

    for (const sessionId of sessionIds) {
      try {
        // Fetch messages from server
        const response = await fetch(`${this.serverUrl}/session/${sessionId}/message`);
        if (!response.ok) {
          throw new Error(`Failed to load messages: ${response.status}`);
        }

        const opencodeMessages = await response.json();

        // Cache metadata to IndexedDB
        await this.cacheSessionMetadata(sessionId, opencodeMessages);

        loaded++;
      } catch (error) {
        console.error(`Error loading session ${sessionId}:`, error);
        failed++;
      }
    }

    // Refresh the session list to show updated counts
    await this.updateSessionList();

    // Show completion notification
    if (failed === 0) {
      lively.notify(`✓ Loaded ${loaded} session${loaded > 1 ? 's' : ''}`);
    } else {
      lively.notify(`⚠ Loaded ${loaded}, failed ${failed} session${sessionIds.length > 1 ? 's' : ''}`);
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

    const messageId = opencodeMsg?.info?.id;
    this.log("[opencode] renderMessage", messageId, opencodeMsg?.info.role, opencodeMsg)

    const container = this.get('#messagesContainer');
    if (!container || !this.currentSession) return;

    // Mark this message as currently being rendered
    if (messageId) {
      this.renderingMessages.add(messageId);

      // IMPORTANT: Merge any buffered parts that arrived before the message was created
      if (this.pendingUpdates.has(messageId)) {
        const pending = this.pendingUpdates.get(messageId);
        this.log(`[opencode] merging ${pending.length} buffered parts into message before rendering`);
        // Merge parts from all buffered updates
        for (const bufferedMsg of pending) {
          if (bufferedMsg.parts) {
            for (const part of bufferedMsg.parts) {
              // Only add if not already present
              if (!opencodeMsg.parts.find(p => p.id === part.id)) {
                opencodeMsg.parts.push(part);
              }
            }
          }
        }
        // Clear pending updates since we've merged them
        this.pendingUpdates.delete(messageId);
      }
    }

    // Clear placeholder if this is the first message
    const emptyChat = container.querySelector('.empty-chat');
    if (emptyChat) {
      emptyChat.remove();
    }

    const chatMessage = await lively.create('lively-chat-message');

    // IMPORTANT: Append to DOM IMMEDIATELY to preserve message order
    // If we wait until after async rendering, messages can appear out of order
    container.appendChild(chatMessage);

    // IMPORTANT: Track element IMMEDIATELY after creation, before any async operations
    // This prevents race conditions where part updates arrive before rendering completes
    if (messageId) {
      this.messageElements.set(messageId, chatMessage);
    }

    // Use setOpenCodeMessage() which handles all the rendering logic
    await chatMessage.setOpenCodeMessage(opencodeMsg, {
      source: 'code',
      streamType: 'opencode'
    });

    chatMessage.showDebug = this.showDebug;

    // Mark rendering complete and apply any additional updates that arrived during rendering
    if (messageId) {
      this.log(`[opencode] renderMessage complete for ${messageId}`);
      this.renderingMessages.delete(messageId);

      // Check if new updates arrived while we were rendering (after merge but during render)
      if (this.pendingUpdates.has(messageId)) {
        const pending = this.pendingUpdates.get(messageId);
        this.log(`[opencode] applying ${pending.length} updates that arrived during rendering`);
        // Apply only the latest update (it contains all the current parts)
        const latestUpdate = pending[pending.length - 1];
        await chatMessage.setOpenCodeMessage(latestUpdate, {
          source: 'code',
          streamType: 'opencode'
        });
        this.pendingUpdates.delete(messageId);
      }
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
    this.log("[opencode] updateOpenCodeMessage ", messageId, opencodeMsg)

    // If messagesUI is disabled (embedded in workspace), dispatch event instead of rendering
    if (!this.messagesUI) {
      this.dispatchMessageEvent('opencode:message-updated', {
        messageId: messageId,
        message: opencodeMsg
      });
      return;
    }   
    
    
    // Check if message is currently being rendered or not ready yet
    const isRendering = this.renderingMessages.has(messageId);
    const hasElement = this.messageElements.has(messageId);

    if (isRendering || !hasElement) {
      // Buffer this update - it will be applied after rendering completes
      this.log(`[opencode] message ${messageId} not ready (rendering: ${isRendering}, hasElement: ${hasElement}), buffering update`);
      if (!this.pendingUpdates.has(messageId)) {
        this.pendingUpdates.set(messageId, []);
      }
      this.pendingUpdates.get(messageId).push(opencodeMsg);
      return;
    }

    const chatMessage = this.messageElements.get(messageId);

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
    this.createSession()
  }

  async createSession() {
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

      // Inherit current project focus for the new session
      if (this.currentProject) {
        this.setSessionProject(newSession.id, this.currentProject.path);
      }

      await this.loadSessions();
      this.selectSession(newSession);

      lively.success('Session created');

      return newSession.id
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

      // Inject project context only on the very first message of a session.
      // Check actual stored messages (not just memory map) so reloads don't re-inject.
      let messageText = message;
      if (this.currentProject) {
        const existingMessages = this.messages.get(this.currentSession.id) || [];
        const isFirstMessage = existingMessages.length === 0;
        if (isFirstMessage) {
          messageText = this.buildProjectContextMessage(message);
        }
      }

      // Build message body
      const messageBody = {
        parts: [
          {
            type: 'text',
            text: messageText
          }
        ]
      };

      // Include variant if not 'none'
      if (this.variant && this.variant !== 'none') {
        messageBody.variant = this.variant;
      }

      const response = await fetch(`${this.serverUrl}/session/${this.currentSession.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      // Mark that generation has started immediately (session.status:busy will also confirm it)
      this.markSessionBusy(this.currentSession.id);

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

  onVariantButton() {
    // Cycle through thinking modes: none -> high -> max -> none
    const variants = ['none', 'high', 'max'];
    const currentIndex = variants.indexOf(this.variant);
    const nextIndex = (currentIndex + 1) % variants.length;
    this.variant = variants[nextIndex];
    
    this.updateVariantButton();
    lively.notify(`Thinking mode: ${this.variant}`);
  }

  updateVariantButton() {
    const button = this.get('#variantButton');
    const label = this.get('#variantLabel');
    if (!button || !label) return;

    label.textContent = this.variant;
    
    // Update button style based on variant
    button.style.fontWeight = this.variant === 'none' ? 'normal' : 'bold';
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

      // Ensure we have a working directory
      if (!this.workingDirectory) {
        const recentDirs = this.getRecentWorkingDirectories();
        this.workingDirectory = recentDirs[0] || '/home/jens/lively4/lively4-core';
        LivelyOpencode.sharedWorkingDirectory = this.workingDirectory;
      }

      // Create a hidden terminal for running the server
      const terminal = await lively.create('lively-xterm');
      terminal.url = lively4url;
      terminal.cwd = this.workingDirectory;
      // Change to working directory first, then run opencode
      terminal.command = `cd ${this.workingDirectory} && opencode serve --port 9100 --hostname localhost`;
      terminal.style.width = "100%";
      terminal.style.height = "300px"; // Give it some height even though hidden

      const container = this.get('#serverTerminalContainer');
      container.innerHTML = '';
      container.appendChild(terminal);

      // Force terminal to re-setup with new cwd (setup was called in initialize with default cwd)
      await terminal.setup(true);

      // Store in shared static property
      LivelyOpencode.sharedServerTerminal = terminal;
      LivelyOpencode.sharedServerRunning = true;
      LivelyOpencode.sharedWorkingDirectory = this.workingDirectory;
      this.updateServerButton();

      lively.success(`OpenCode server starting in ${this.workingDirectory}...`);

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
      LivelyOpencode.sharedWorkingDirectory = null;
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
   * Get event type statistics
   * @returns {Object} Object with eventLog array and tally map
   */
  static getEventTypeStats() {
    return {
      log: this.eventTypeLog,
      tally: Object.fromEntries(this.eventTypeTally),
      totalEvents: this.eventTypeLog.length,
      uniqueTypes: this.eventTypeTally.size
    };
  }
  
  /**
   * Clear event type tracking
   */
  static clearEventTypeStats() {
    this.eventTypeLog = [];
    this.eventTypeTally = new Map();
  }
  
  /**
   * Print formatted event type statistics to console
   */
  static printEventTypeStats() {
    const stats = this.getEventTypeStats();
    console.log('=== OpenCode Event Type Statistics ===');
    console.log(`Total events: ${stats.totalEvents}`);
    console.log(`Unique types: ${stats.uniqueTypes}`);
    console.log('\nEvent type counts:');
    
    // Sort by count descending
    const sorted = Object.entries(stats.tally).sort((a, b) => b[1] - a[1]);
    for (const [type, count] of sorted) {
      console.log(`  ${type}: ${count}`);
    }
    
    return stats;
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

  /*MD ## Context Menu MD*/

  // Override base class method to add component-specific menu items
  getContextMenuItems() {
    var menutItems = super.getContextMenuItems()
    return menutItems.concat([
      ["Load All Sessions (Update Cache)", () => {
        this.loadAllSessionsMetadata();
      }],
      ["Update Session Costs", () => {
        this.updateAllSessionCosts();
      }],
    ])
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

  /**
   * Load messages for all sessions into this.messages so costs can be computed.
   * Shows progress and updates the session list cost display when done.
   */
  async updateAllSessionCosts() {
    if (!this.sessions || this.sessions.length === 0) {
      lively.warn('No sessions to update');
      return;
    }

    const totalSessions = this.sessions.length;
    lively.notify(`Computing costs for ${totalSessions} sessions...`);

    let loaded = 0;
    let failed = 0;

    for (const session of this.sessions) {
      try {
        const response = await fetch(`${this.serverUrl}/session/${session.id}/message`);
        if (!response.ok) throw new Error(`Failed: ${response.status}`);

        const opencodeMessages = await response.json();

        // Store in this.messages so getTotalSessionCost() can compute
        if (!this.messages.has(session.id)) {
          this.messages.set(session.id, opencodeMessages);
        }

        // Also cache metadata while we're at it
        await this.cacheSessionMetadata(session.id, opencodeMessages);

        loaded++;
        if (loaded % 10 === 0) {
          lively.notify(`Computing costs... ${loaded}/${totalSessions}`);
        }
      } catch (error) {
        console.error(`Error loading session ${session.id}:`, error);
        failed++;
      }
    }

    // Refresh session list with computed costs
    await this.updateSessionList();

    if (failed > 0) {
      lively.warn(`Updated costs for ${loaded} sessions, ${failed} failed`);
    } else {
      lively.success(`Session costs updated for all ${loaded} sessions`);
    }
  }



  livelyPreMigrate() {
    this.disconnectFromServer();
    this.stopConnectionHealthCheck();
  }

  livelyMigrate(other) {
    super.livelyMigrate(other)
    this.serverUrl = other.serverUrl || 'http://localhost:9100';
    this.workingDirectory = other.workingDirectory || LivelyOpencode.sharedWorkingDirectory;
    this.currentProject = other.currentProject || null;
    this.sessionProjects = other.sessionProjects || this.loadSessionProjectsFromStorage();
    this.allSessions = other.allSessions || [];
    this.sessions = other.sessions || [];
    this.currentSession = other.currentSession || null;
    this.messages = other.messages || new Map();
    this.variant = other.variant || 'none';
    this.generatingSessions = other.generatingSessions || new Set();
    this.isGenerating = other.isGenerating || false;
    // _busyTimeouts: always start fresh; re-arm debounce for any already-busy sessions
    this._busyTimeouts = new Map();
    for (const sessionId of this.generatingSessions) {
      this._busyTimeouts.set(sessionId, setTimeout(() => {
        this._busyTimeouts.delete(sessionId);
        this.markSessionIdle(sessionId);
      }, 5000));
    }

    // Server terminal state is now shared at class level, no need to migrate

    // Update working directory selector
    const workdirCombobox = this.get('#workdirCombobox');
    if (workdirCombobox && this.workingDirectory) {
      workdirCombobox.value = this.workingDirectory;
    }

    this.updateSessionList();
    this.displayMessages();
    this.updateServerButton();
    this.updateVariantButton();
    this.updateProjectSelector();
  }

  cleanupSession() {
    super.cleanupSession();

    // Clear message display
    const container = this.get('#messagesContainer');
    if (container) {
      container.innerHTML = '';
    }

    // Clear in-memory messages for current session
    if (this.currentSession) {
      this.messages.set(this.currentSession.id, []);
    }
  }

  async livelyExample() {
    this.style.backgroundColor = "white";
    this.style.border = "2px solid #4a90e2";
  }
}
