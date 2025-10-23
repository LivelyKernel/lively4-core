import Morph from 'src/components/widgets/lively-morph.js';

/*MD
# Lively AI Workspace

Integration workspace for OpenAI Realtime Chat and OpenCode coding agent.

**Architecture:**
```
lively-ai-workspace (coordinator/blackboard)
├── Realtime Chat Component (voice/audio interface)
│   └── Function calls to workspace API
├── lively-opencode Component (Claude Code agent)
│   └── Via OpenCode.ai server
└── Blackboard state & coordination layer
```

**API for Realtime Chat:**

The workspace exposes methods that can be called from the realtime chat component via function tools:

- `sendMessageToOpenCode(message)` - Send coding task or message to agent
- `getOpenCodeStatus()` - Query current agent state
- `getOpenCodeHistory()` - Get conversation history
- `createOpenCodeSession(title)` - Create new session
- `switchOpenCodeSession(sessionId)` - Switch sessions
- `getOpenCodeSessions()` - List all sessions

**Blackboard State:**

Shared state object accessible to both components:
```javascript
{
  currentTask: string,        // Current coding task
  agentStatus: string,        // Agent state (idle, working, blocked)
  coordination: object,       // Coordination data
  lastUpdate: timestamp       // Last state update
}
```

**Usage:**

```javascript
// Open workspace
const workspace = await lively.openComponentInWindow('lively-ai-workspace');

// Send task from realtime chat
workspace.sendMessageToOpenCode("Add a search bar to lively-container");

// Query status
const status = workspace.getOpenCodeStatus();
console.log(status); // { state: 'working', session: {...}, ... }

// Get history
const history = await workspace.getOpenCodeHistory();
```

MD*/

export default class LivelyAiWorkspace extends Morph {
  async initialize() {
    this.windowTitle = "AI Workspace";
    this.registerButtons();

    // Initialize blackboard state
    this.blackboard = this.blackboard || {
      currentTask: null,
      agentStatus: 'idle',
      coordination: {},
      lastUpdate: Date.now(),
      pendingRequests: new Map(),    // Map<requestId, {task, timestamp, status, audioWaiting}>
      completedRequests: new Map()   // Map<requestId, {task, response, timestamp}>
    };

    // Component references
    this.opencodeComponent = null;
    this.realtimeComponent = null;

    // UI state
    this.blackboardVisible = false;

    // Update UI
    this.updateStatusDisplay();
    this.updateBlackboardDisplay();

    // Initialize components programmatically
    await this.initializeComponents();
  }

  async initializeComponents() {
    // Create OpenCode component
    try {
      this.opencodeComponent = await lively.create('lively-opencode');
      const opencodeContainer = this.get('#opencodeContainer');
      if (opencodeContainer) {
        opencodeContainer.appendChild(this.opencodeComponent);
        this.setupOpenCodeListeners();
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
        realtimeContainer.appendChild(this.realtimeComponent);

        // Configure as workspace bridge - focused on forwarding to coding agent
        this.realtimeComponent.setInstructions(
          "You are a voice interface helping the user communicate with a coding agent (Claude Code). " +
          "Your role is to:\n" +
          "1. Listen to the user's requests and forward coding tasks to the agent using send_opencode_task\n" +
          "2. Relay the agent's responses back to the user naturally and conversationally\n" +
          "3. You'll be automatically notified when the agent finishes - just relay what they said\n" +
          "4. For quick questions (like 'what is 3+4'), you'll get immediate answers to share\n" +
          "5. Focus on being a helpful bridge - don't try to solve coding problems yourself\n\n" +
          "Keep responses brief and natural. When relaying agent responses, paraphrase if they're very long."
        );

        this.realtimeComponent.setAvailableTools([
          'send_opencode_task',
          'get_opencode_status',
          'get_opencode_history',
          'create_opencode_session',
          'list_opencode_sessions'
        ]);

        this.updateRealtimeStatus('Ready', true);
      } else {
        console.error('Realtime container not found');
        this.updateRealtimeStatus('Container not found', false);
      }
    } catch (error) {
      console.error('Failed to create Realtime Chat component:', error);
      this.updateRealtimeStatus('Error', false);

      // Try to find it anyway in case it was created but threw error
      const realtimeContainer = this.get('#realtimeContainer');
      if (realtimeContainer && realtimeContainer.firstElementChild) {
        console.warn('Realtime component found in container despite error, using it');
        this.realtimeComponent = realtimeContainer.firstElementChild;

        // Still configure it even if recovered
        this.realtimeComponent.setInstructions(
          "You are a voice interface helping the user communicate with a coding agent (Claude Code). " +
          "Your role is to:\n" +
          "1. Listen to the user's requests and forward coding tasks to the agent using send_opencode_task\n" +
          "2. Relay the agent's responses back to the user naturally and conversationally\n" +
          "3. You'll be automatically notified when the agent finishes - just relay what they said\n" +
          "4. For quick questions (like 'what is 3+4'), you'll get immediate answers to share\n" +
          "5. Focus on being a helpful bridge - don't try to solve coding problems yourself\n\n" +
          "Keep responses brief and natural. When relaying agent responses, paraphrase if they're very long."
        );

        this.realtimeComponent.setAvailableTools([
          'send_opencode_task',
          'get_opencode_status',
          'get_opencode_history',
          'create_opencode_session',
          'list_opencode_sessions'
        ]);

        this.updateRealtimeStatus('Ready (recovered)', true);
      }
    }
  }

  setupOpenCodeListeners() {
    // Listen for status changes from OpenCode component via CustomEvents
    if (!this.opencodeComponent) return;

    // Listen for opencode:status-change events
    this.opencodeComponent.addEventListener('opencode:status-change', (evt) => {
      const {type, sessionId, status, message, timestamp} = evt.detail;

      console.log('[AI Workspace] Received OpenCode status change:', evt.detail);

      // Update blackboard state
      this.blackboard.agentStatus = status;
      this.blackboard.lastEventType = type;
      this.blackboard.lastEventMessage = message;
      this.blackboard.lastUpdate = timestamp;

      // Update current task from session if available
      if (this.opencodeComponent.currentSession) {
        this.blackboard.currentTask = this.opencodeComponent.currentSession.title || 'Untitled session';
      }

      // Update UI
      this.updateBlackboardDisplay();

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
    });

    // Also monitor connection status via polling (lightweight check)
    setInterval(() => {
      if (this.opencodeComponent) {
        const isConnected = this.opencodeComponent.connected;

        if (!isConnected) {
          this.updateOpenCodeStatus('Disconnected', false);
          this.blackboard.agentStatus = 'disconnected';
          this.blackboard.lastUpdate = Date.now();
          this.updateBlackboardDisplay();
        }
      }
    }, 5000); // Check connection every 5 seconds
  }

  // ===================================================================
  // Request-Response Correlation
  // ===================================================================

  /**
   * Check pending requests and mark them complete if responses have arrived
   */
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
        // Find the assistant's response (first new assistant message after the request)
        let response = null;
        for (let i = request.initialMessageCount; i < currentMessages.length; i++) {
          if (currentMessages[i].role === 'assistant') {
            response = currentMessages[i];
            break;
          }
        }

        if (response) {
          // Mark request as completed
          this.completeRequest(requestId, response);
        }
      }
    }
  }

  /**
   * Mark a request as completed with its response
   */
  completeRequest(requestId, response) {
    const request = this.blackboard.pendingRequests.get(requestId);

    if (!request) {
      return; // Request not found
    }

    console.log(`[AI Workspace] Request ${requestId} completed:`, request.task, '→', response.content);

    // Move to completed requests
    this.blackboard.completedRequests.set(requestId, {
      task: request.task,
      response: response,
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

    this.updateBlackboardDisplay();
  }

  /**
   * Get response for a specific request ID
   * @param {string} requestId - Request ID to check
   * @returns {Object|null} Response object or null if not yet complete
   */
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

  /**
   * Set audio waiting flag for a request
   */
  setRequestAudioWaiting(requestId, waiting = true) {
    const request = this.blackboard.pendingRequests.get(requestId);
    if (request) {
      request.audioWaiting = waiting;
    }
  }

  // ===================================================================
  // Public API for Realtime Chat
  // ===================================================================

  /**
   * Send a message or task to the OpenCode agent
   * @param {string} message - The message or task to send
   * @param {string} requestId - Optional request ID for tracking request-response correlation
   * @returns {Promise<Object>} Response with status
   */
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
      this.updateBlackboardDisplay();

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

  /**
   * Get current status of OpenCode agent
   * @returns {Object} Status information
   */
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
   * Get conversation history from current OpenCode session
   * @returns {Promise<Array>} Message history
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
        messages: messages
      };

    } catch (error) {
      console.error('Error getting OpenCode history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new OpenCode session
   * @param {string} title - Session title
   * @returns {Promise<Object>} New session information
   */
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

  /**
   * Switch to a different OpenCode session
   * @param {string} sessionId - Session ID to switch to
   * @returns {Promise<Object>} Result
   */
  async switchOpenCodeSession(sessionId) {
    if (!this.opencodeComponent) {
      return {
        success: false,
        error: 'OpenCode component not available'
      };
    }

    try {
      const session = this.opencodeComponent.sessions.find(s => s.id === sessionId);

      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      await this.opencodeComponent.selectSession(session);

      return {
        success: true,
        session: session
      };

    } catch (error) {
      console.error('Error switching OpenCode session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get list of all OpenCode sessions
   * @returns {Array} List of sessions
   */
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

  // ===================================================================
  // UI Update Methods
  // ===================================================================

  updateStatusDisplay() {
    // Will be called when status changes
  }

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

  updateBlackboardDisplay() {
    const contentEl = this.get('#blackboardContent');
    if (!contentEl) return;

    const blackboardText = JSON.stringify(this.blackboard, null, 2);
    contentEl.textContent = blackboardText;
  }

  // ===================================================================
  // Button Handlers
  // ===================================================================

  onToggleBlackboardButton() {
    this.blackboardVisible = !this.blackboardVisible;

    const panel = this.get('#blackboardPanel');
    if (panel) {
      if (this.blackboardVisible) {
        panel.classList.remove('collapsed');
      } else {
        panel.classList.add('collapsed');
      }
    }
  }

  onClearButton() {
    // Clear blackboard state
    this.blackboard = {
      currentTask: null,
      agentStatus: 'idle',
      coordination: {},
      lastUpdate: Date.now()
    };

    this.updateBlackboardDisplay();
    lively.notify('Workspace cleared');
  }

  // ===================================================================
  // Lifecycle Methods
  // ===================================================================

  livelyPreMigrate() {
    // Cleanup before migration
  }

  livelyMigrate(other) {
    // Preserve state during live updates
    this.blackboard = other.blackboard || {
      currentTask: null,
      agentStatus: 'idle',
      coordination: {},
      lastUpdate: Date.now()
    };

    this.blackboardVisible = other.blackboardVisible || false;

    // Update displays
    this.updateBlackboardDisplay();
    this.updateStatusDisplay();
  }

  async livelyExample() {
    this.style.backgroundColor = "white";
    this.style.border = "2px solid #667eea";
  }
}
