# Lively AI Workspace

[code](edit://src/ai-workspace/components/lively-ai-workspace.js) | [journal entries](browse://doc/journal/)

Integration workspace for OpenAI Realtime Chat and OpenCode coding agent.

**Last Updated:** 2025-11-27
**Status:** Core features implemented, improvements in progress

## Current Architecture (November 2025)

```
lively-ai-workspace (coordinator/blackboard)
├── openai-realtime-chat (voice/audio interface)
│   ├── eventSource: 'realtime'
│   ├── captures events to _eventCapture[]
│   └── exposes function tools to call workspace API
├── lively-opencode (Claude Code agent via OpenCode.ai)
│   ├── eventSource: 'opencode'
│   ├── captures SSE events to _eventCapture[]
│   └── connects via WebSocket to opencode.ai server
├── Unified Session Management
│   ├── DB schema: workspaces(id, conversationId, opencodeSessionId)
│   ├── Atomic session switching
│   └── lively-sessions-component UI
├── Message Display (Shared Pane)
│   ├── Live message updates (not full re-renders)
│   ├── displayedMessages Map (by msgId)
│   └── realtimeMessageWidgets Map (by item_id)
├── Event Capture & Replay
│   ├── getCapturedEvents() - merges child arrays
│   ├── saveMessagesToStorage() - debounced backup
│   └── replayMessageEvent() - delegates to child components
└── Blackboard State
    ├── currentTask, agentStatus
    ├── pendingRequests / completedRequests Maps
    └── coordination data
```

**Key Features:**
- **Linked Sessions:** One workspace = one realtime conversation + one opencode session
- **Event Sourcing:** All events captured with source tags, stored for replay
- **Live Updates:** Individual message widgets updated in place, not full re-renders
- **Request Tracking:** Audio agent can track task completion by code agent
- **Unified Controls:** Single set of replay/session controls for both agents

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

## Implementation Status

### Completed Features ✓

1. **Unified Session Management** ✓ - Workspace manages linked sessions atomically
   - Implemented in `lively-ai-workspace.js:183-312`
   - Methods: `createWorkspaceSession()`, `switchWorkspaceSession()`, `deleteWorkspaceSession()`
   - DB schema includes `conversationId` and `opencodeSessionId` linking

2. **Message Stream Architecture** ✓ - Event-based capture and replay system
   - Event capture with source tagging (`eventSource` property)
   - Live message updates via `createOpenCodeMessage()`, `updateOpenCodeMessage()`
   - Debounced storage backup with `_saveMessagesDebounced()`
   - Replay system with pause/resume/speed controls

3. **Request-Response Correlation** ✓ - Track coding agent task completion
   - Blackboard state with `pendingRequests` and `completedRequests` Maps
   - Methods: `sendMessageToOpenCode()`, `checkAndCompleteRequests()`, `completeRequest()`
   - Audio agent can query completion status

### In Progress / Planned

1. **Better Blackboard Integration** - Show tasks/notes as structured document, not JSON
2. **Enhanced Agent Context** - Realtime agent knows about MCP tools and its role (partial)
3. **Code Agent Transparency** - Optional display of internal thinking/messages
4. **Voice Agent Clarity** - Voice agent feels like extension of code agent (partial)
5. **Planning Mode** - Buffer for casual chat, execute only on coherent plans

---

## Improvement Plan

### Goals

### 1. Unified Session Management ✓ IMPLEMENTED

**Status:** Fully implemented and working.

**Implementation:** See `lively-ai-workspace.js:183-312`

**Database Schema:**
```javascript
workspaces: 'id, timestamp, lastActivityTime, title, conversationId, opencodeSessionId'
```

**Key Methods:**
- `createWorkspaceSession(title)` - Creates linked conversation + opencode session
- `switchWorkspaceSession(workspaceId)` - Switches both subsessions atomically
- `deleteWorkspaceSession(workspaceId)` - Removes workspace and updates UI
- `listWorkspaceSessions()` - Lists all workspace sessions

**UI Implementation:**
- Session switcher using `lively-sessions-component` (`#sessionsComponent`)
- Child components have `sessionUI = false` to hide individual session controls
- Unified session list in workspace header
- Session titles generated from first user message or date

**Event Handlers:**
- `onSessionSelected(sessionId)` - Switch to selected workspace
- `onSessionDeleted(sessionId)` - Delete with confirmation
- `onNewSessionButton()` - Create new linked workspace session

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

### 3. Enhanced Realtime Agent Context - PARTIAL

**Current Status:** Basic forwarding system in place, but limited context.

**Current Implementation:**
- System prompt loaded from `src/config/prompts/ai-workspace-audio-chat.txt`
- Simple forwarding approach: sends all requests to code agent via `send_user_task` tool
- Limited exception handling for meta-requests (e.g., "read")

**Current Issues:**
- Prompt is too simplistic - just forwards everything
- No awareness of MCP tools available via code agent
- No Lively4 environment context provided
- Voice agent doesn't understand its full capabilities

**Recommended Solution:** Comprehensive system prompt including:

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
- Generate tool descriptions from realtime-chat-tools/ toolset classes
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
2. **Session Management** ✓ - Foundation completed
3. **Message Stream Architecture** ✓ - Event capture, replay, and backup system
4. **Request-Response Correlation** ✓ - Track task completion across agents
5. **Blackboard Redesign** - Data structure and rendering (IN PROGRESS)
6. **Agent Context** - Better prompts and tool awareness (PARTIAL)
7. **Transparency** - Internal message display (TODO)
8. **Planning Mode** - Integration layer (TODO)
9. **Testing & Refinement** - Iterate on each component (ONGOING)

### Recent Additions (November 2025)

**Event Capture System:**
- Source-tagged events at capture time via `eventSource` property
- Child components (`openai-realtime-chat`, `lively-opencode`) capture events independently
- Workspace merges child event arrays via `getCapturedEvents()`
- Debounced storage with `_saveMessagesDebounced()` (2 second delay)

**Replay System:**
- New standalone **Replay UI** component (`lively-chat-replay`) opened in separate window
- **Dual replay modes:**
  - **Manual stepping** - Step forward one event at a time (like debugger)
  - **Auto replay** - Replay with original timing and speed control (1x, 2x, 5x, instant)
- **Flexible control** - Pause during auto replay, step manually, then resume
- Event list display with current event highlighting and auto-scroll
- Click event to open inspector for detailed examination
- Context menu: "Open Replay UI" available on all chat components
- Hierarchical replay: workspace coordinates child component replay
- Artificial session IDs during replay to avoid database pollution
- Session cleanup with `cleanupSession()` method

**Replay UI Features:**
- Opens in window positioned on top of chat window
- Starts in paused state - user must click Play or Step Forward
- Event list shows: timestamp, type, source, content preview
- Current event highlighted and automatically scrolled into view
- Inspector integration: click any event to examine full data structure
- Inherited by all chat components via `LivelyChat` base class

**UI Improvements:**
- Batch rendering optimization with `_batchRendering` flag
- Individual message widgets tracked in `displayedMessages` Map
- Realtime message widgets tracked by `item_id` for updates
- Context menu integration for replay and event storage controls

**ESC Key Interruption:**
- Double-ESC press detection (within 500ms) to abort message generation
- `onKeyDown(evt)` handler in workspace
- Delegates to `opencodeComponent.abortCurrentSession()`

### Technical Notes

- **Backward Compatibility:** Keep subsession independence as fallback
- **Feature Flags:** Gradual rollout with preferences
- **Message Capture:** Maintain existing architecture, extend don't replace
- **Database Migration:** Add fields, don't break existing data
- **Component Coupling:** Loose coupling via events and API methods

### Known Issues and TODOs

**From Code:**
1. Connection status polling (line 757-768 in lively-ai-workspace.js) - Currently disabled
   - Need to ensure it only runs when component is open
   - Previously checked OpenCode connection every 5 seconds
   - Consider using visibility API or lifecycle hooks

**Architecture:**
2. Old workspace sessions lack `conversationId` or `opencodeSessionId`
   - Display fallback message: "This is an old session without audio/code chat data"
   - Could implement migration script to upgrade old sessions

3. Message format inconsistency
   - OpenCode uses `{info: {id, role, time}, parts: [...]}`  format
   - Realtime uses flat `{id, role, content, timestamp}` format
   - Both formats supported but requires format detection

**UI/UX:**
4. Session titles based on first user message
   - Works well for conversations starting with audio
   - Could be improved for code-first sessions
   - Consider allowing manual title editing

5. Blackboard currently stores raw state
   - Not rendered as user-friendly UI
   - Should show tasks/notes as structured document

### Open Questions

- Should planning mode be default or opt-in?
- How to visualize plan vs execution state?
- Should workspace sessions be hierarchical (parent/child)?
- What level of internal message detail to show?
- Should event storage be enabled by default or opt-in?
