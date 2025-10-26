# Lively AI Workspace

[code](edit://src/components/tools/lively-ai-workspace.js)

Integration workspace for OpenAI Realtime Chat and OpenCode coding agent.

## Current Architecture

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

---

## Improvement Plan

### Goals

1. **Unified Session Management** - Hide subsession UI, workspace manages all sessions
2. **Better Blackboard Integration** - Show tasks/notes as structured document, not JSON
3. **Enhanced Agent Context** - Realtime agent knows about MCP tools and its role
4. **Code Agent Transparency** - Optional display of internal thinking/messages
5. **Voice Agent Clarity** - Voice agent feels like extension of code agent
6. **Planning Mode** - Buffer for casual chat, execute only on coherent plans

### 1. Unified Session Management

**Problem:** Currently, lively-ai-workspace has its own sessions, realtime-chat has conversations, and opencode has sessions. These are independent, causing confusion and complexity.

**Solution:**
- Workspace creates linked sessions (workspace session → conversation + opencode session)
- Switching workspace sessions switches both subsessions atomically
- Hide individual session UI in child components (conversations button, session list)

**Implementation:**
```javascript
// Extend workspace DB schema
workspaces: 'id, timestamp, lastActivityTime, title, conversationId, opencodeSessionId'

// New methods
async createWorkspaceSession(title) {
  // Create conversation in realtime-chat DB
  // Create session in opencode via API
  // Create workspace entry linking both
}

async switchWorkspaceSession(workspaceId) {
  // Load workspace record
  // Switch conversation in realtime-chat
  // Switch session in opencode
}
```

**UI Changes:**
- Add workspace session switcher in header
- Hide realtime-chat conversations button
- Hide opencode session list
- Show unified session list in workspace

### 2. Blackboard Content Integration

**Problem:** Current blackboard shows raw JSON, not useful for tasks/notes/context

**Solution:**
- Redesign blackboard as structured document
- Support tasks (with status), notes, shared context
- Render as formatted UI (not JSON dump)

**Data Structure:**
```javascript
blackboard: {
  tasks: [
    { id, title, description, status, created, updated },
    ...
  ],
  notes: [
    { id, content, timestamp, source },
    ...
  ],
  context: {
    currentFocus: string,
    files: [],
    concepts: []
  },
  agentStatus: { ... },
  lastUpdate: timestamp
}
```

**Methods:**
```javascript
addTask(title, description)
updateTaskStatus(id, status)
addNote(content, source)
getSharedContext()
```

**UI:**
- Markdown-style rendering
- Task list with checkboxes
- Notes section
- Make blackboard visible by default

### 3. Enhanced Realtime Agent Context

**Problem:** Realtime agent doesn't know about:
- MCP tools available via code agent
- Full capabilities of native tools
- Its role in the larger system
- Lively4 environment context

**Solution:** Comprehensive system prompt including:

```javascript
const systemPrompt = `
You are the voice interface for Claude Code, an AI coding agent running in Lively4.

IMPORTANT CONTEXT:
- You ARE the voice of Claude Code - the human is talking to Claude through you
- Use first-person for Claude's actions ("I will...", not "the agent will...")
- You have two types of tools:

NATIVE TOOLS (your direct capabilities):
${generateToolDescriptions(nativeTools)}

CODE AGENT TOOLS (via Claude Code MCP):
${generateToolDescriptions(mcpTools)}

LIVELY4 ENVIRONMENT:
- Self-supporting browser-based development environment
- Live programming with immediate feedback
- Components extend Morph, use Shadow DOM
- SystemJS with Babel7 runtime transpilation

YOUR ROLE:
1. Listen to user's development requests
2. Execute directly using tools or forward to Claude Code
3. For complex coding tasks, use send_opencode_task
4. Relay responses naturally (avoid meta-talk about "the agent")
5. Quick queries get immediate answers, longer tasks get async notification

PLANNING MODE:
- Casual conversation stays in planning mode
- Only execute when user confirms coherent plan
- Use "shall I proceed?" before executing significant changes
`;
```

**Implementation:**
- Generate tool descriptions from openai-realtime-chat-tools.js
- Fetch MCP tool descriptions from lively4-server/tools.json
- Build comprehensive prompt in workspace initialization
- Update realtime-chat configuration

### 4. Code Agent Transparency

**Problem:** OpenCode hides internal thinking, planning, and tool use details

**Solution:**
- Add `showInternalMessages` property (default: false)
- Capture thinking steps, internal messages, tool calls
- Style differently (smaller, dimmed, collapsible)

**Implementation:**
```javascript
// lively-opencode.js
showInternalMessages: false  // property

handleEvent(data) {
  if (data.type === 'message.thinking' && !this.showInternalMessages) {
    return; // Skip internal messages when hidden
  }
  // ... render with special styling
}
```

**UI:**
- Toggle button: "Show Internal Messages"
- Different styling: gray, smaller font, indented
- Optional: collapsible sections

### 5. Voice Agent Role Clarity

**Problem:** Current prompt creates separation between user, voice agent, and code agent

**Solution:** Reframe voice agent as direct extension of code agent

**Prompt Changes:**
```javascript
// BEFORE:
"You are a voice interface helping the user communicate with a coding agent"
"Forward coding tasks to the agent using send_opencode_task"
"Relay the agent's responses back to the user"

// AFTER:
"You are the voice interface FOR Claude Code"
"The user is talking directly to me (Claude Code) through you"
"Use 'I will...' not 'the agent will...'"
"You ARE Claude Code's voice"
```

**Impact:**
- More natural conversation flow
- Reduced meta-conversation
- Feels like talking to one AI, not two

### 6. Planning Mode Integration

**Problem:** Voice agent acts on every statement, no buffer for casual discussion

**Solution:**
- Planning mode: casual chat, build up plan
- Execution mode: only when plan confirmed
- Clear state transitions

**State Machine:**
```javascript
states: {
  PLANNING: 'planning',    // Building plan, casual chat
  READY: 'ready',          // Plan complete, awaiting confirmation
  EXECUTING: 'executing',  // Executing confirmed plan
  IDLE: 'idle'            // No active plan
}
```

**Blackboard Extension:**
```javascript
blackboard: {
  planningMode: {
    state: 'planning',
    currentPlan: {
      steps: [],
      discussion: [],
      readyToExecute: false
    }
  }
}
```

**Methods:**
```javascript
enterPlanningMode()
addPlanStep(step)
markPlanReady()
executePlan()
discardPlan()
```

**Voice Agent Behavior:**
- In planning mode: discuss, refine, suggest
- Ask "shall I proceed?" when plan seems complete
- Only send to code agent on confirmation
- Can casually chat without triggering execution

**UI:**
- Show current mode indicator
- Display plan steps
- Clear "Execute Plan" button
- "Discard Plan" option

### Implementation Order

1. **Documentation** (this file) ✓
2. **Session Management** - Foundation for everything else
3. **Blackboard Redesign** - Data structure and rendering
4. **Agent Context** - Better prompts and tool awareness
5. **Transparency** - Internal message display
6. **Planning Mode** - Integration layer
7. **Testing & Refinement** - Iterate on each component

### Technical Notes

- **Backward Compatibility:** Keep subsession independence as fallback
- **Feature Flags:** Gradual rollout with preferences
- **Message Capture:** Maintain existing architecture, extend don't replace
- **Database Migration:** Add fields, don't break existing data
- **Component Coupling:** Loose coupling via events and API methods

### Open Questions

- Should planning mode be default or opt-in?
- How to visualize plan vs execution state?
- Should workspace sessions be hierarchical (parent/child)?
- What level of internal message detail to show?
