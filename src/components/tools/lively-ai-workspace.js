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
      lastUpdate: Date.now()
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
        this.updateRealtimeStatus('Ready (recovered)', true);
      }
    }
  }

  setupOpenCodeListeners() {
    // Monitor OpenCode component for state changes
    // Note: This is a polling approach since OpenCode doesn't emit events directly
    // A better approach would be to extend OpenCode to emit custom events

    setInterval(() => {
      if (this.opencodeComponent) {
        const isConnected = this.opencodeComponent.connected;
        const currentSession = this.opencodeComponent.currentSession;

        if (isConnected) {
          this.updateOpenCodeStatus('Connected', true);

          if (currentSession) {
            this.blackboard.agentStatus = 'active';
            this.blackboard.currentTask = currentSession.title || 'Untitled session';
          } else {
            this.blackboard.agentStatus = 'idle';
            this.blackboard.currentTask = null;
          }
        } else {
          this.updateOpenCodeStatus('Disconnected', false);
          this.blackboard.agentStatus = 'disconnected';
        }

        this.blackboard.lastUpdate = Date.now();
        this.updateBlackboardDisplay();
      }
    }, 2000); // Poll every 2 seconds
  }

  // ===================================================================
  // Public API for Realtime Chat
  // ===================================================================

  /**
   * Send a message or task to the OpenCode agent
   * @param {string} message - The message or task to send
   * @returns {Promise<Object>} Response with status
   */
  async sendMessageToOpenCode(message) {
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
      this.updateBlackboardDisplay();

      return {
        success: true,
        message: 'Task sent to OpenCode agent'
      };

    } catch (error) {
      console.error('Error sending message to OpenCode:', error);
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
