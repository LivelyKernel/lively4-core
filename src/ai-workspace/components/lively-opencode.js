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
  static sharedWorkingDirectory = null;
  
  // Event type tracking across all instances
  static eventTypeLog = [];
  static eventTypeTally = new Map();

  /**
   * IndexedDB for caching session metadata (message counts, timestamps)
   * Note: Server is source of truth for actual messages - this is metadata cache only
   */
  static get sessionMetaDB() {
    var db = new Dexie("opencode-session-metadata");
    db.version(1).stores({
      sessionMeta: 'sessionId, messageCount, lastUpdated, lastMessageTime'
    }).upgrade(function () {});
    db.version(2).stores({
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

    // Server configuration
    this.serverUrl = 'http://localhost:9100';

    // Working directory state - sync with shared state if server already running
    this.workingDirectory = this.workingDirectory || LivelyOpencode.sharedWorkingDirectory;
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

    // ESC key interruption state
    this.lastEscPress = 0; // Timestamp of last ESC press for double-press detection
    this.isGenerating = false; // Track if AI is currently generating response

    // Variant (thinking mode) state - preserve during live updates
    this.variant = this.variant || 'high'; // none, high, max

    // Event capture already initialized by parent, but preserve existing logic for safety
    // this._eventCapture and this._replayMode are set by parent's initialize()

    // Update UI
    this.updateStatus('Connecting...', false);
    this.updateServerButton();
    this.updateVariantButton();

    // Initialize debug log visibility (controlled by showDebug property)
    this.setAttribute("hide-debug-log", this.showDebug ? "false" : "true");

    this.addEventListener('contextmenu', evt => this.createBaseContextMenu(evt), false);

    // Setup input handling using base class method
    this.setupInputHandling('#messageInput', this.onSendButton);

    // Setup sessions component
    this.setupSessionsComponent();

    // Setup working directory selector
    this.setupWorkdirSelector();

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
    await this.handleEvent(event.data, replaySessionId)
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
      } else if (data.type === 'session.idle' || data.type === 'session.updated') {
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

    // Set default to current lively4-core directory if nothing selected
    if (!this.workingDirectory && recentDirs.length > 0) {
      this.workingDirectory = recentDirs[0];
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

    // Update working directory
    this.workingDirectory = newDir;
    this.saveRecentWorkingDirectory(newDir);

    // Update combobox
    const workdirCombobox = this.get('#workdirCombobox');
    if (workdirCombobox) {
      workdirCombobox.value = newDir;
    }

    // Clear current session since it belongs to old directory
    this.currentSession = null;
    
    // Filter sessions immediately (will show empty list until new server connects)
    this.filterSessionsByWorkingDirectory();
    await this.updateSessionList();

    // Start server in new directory (will load sessions for new directory when connected)
    await this.startServer();
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
        parentSessionId: metadata?.parentSessionId || null
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

      // Build message body
      const messageBody = {
        parts: [
          {
            type: 'text',
            text: message
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

  captureEvent(type, data, sessionId) {
    if (this._replayMode) return; // Don't capture during replay

    this._eventCapture.push({
      timestamp: Date.now(),
      type: type,
      sessionId: sessionId,
      source: this.eventSource,
      data: data
    });
  }
  
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
    this.allSessions = other.allSessions || [];
    this.sessions = other.sessions || [];
    this.currentSession = other.currentSession || null;
    this.messages = other.messages || new Map();
    this.variant = other.variant || 'none';

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
