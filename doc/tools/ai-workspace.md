# Lively AI Workspace

[code](edit://src/components/tools/lively-ai-workspace.js)

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
