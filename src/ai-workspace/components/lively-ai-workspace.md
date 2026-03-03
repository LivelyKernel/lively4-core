# LivelyAiWorkspace (Coordinator)

<lively-import src="../_navigation.html"></lively-import>

**File:** `lively-ai-workspace.js`

**Purpose:** Unified workspace that embeds and coordinates both audio and code chat

**Extends:** [LivelyChat](lively-chat.md)

---

## Architecture

Creates embedded `openai-realtime-chat` and `lively-opencode` components:
- Manages unified workspace sessions linking both chat types
- Renders merged message timeline from both sources
- Coordinates request-response between audio and code agents
- Automatically ensures OpenCode server is running on startup

```
lively-ai-workspace (coordinator/blackboard)
├── openai-realtime-chat (eventSource: 'realtime')
│   ├── Voice/text interaction with OpenAI
│   └── Tool execution capabilities
├── lively-opencode (eventSource: 'opencode')
│   ├── Terminal-based coding agent
│   └── Full Claude Code server integration
└── lively-agent-board
    ├── TODOs and task tracking
    ├── Tool usage statistics
    └── Session links and file operations
```

---

## Database Schema (Dexie)

**Table:** `lively-ai-workspace-history`

```javascript
workspaces: {
  id: string (UUID)
  timestamp: date
  lastActivityTime: date
  title: string (nullable)
  conversationId: string           // links to openai-realtime-conversations
  opencodeSessionId: string         // links to opencode session
  messagesArray: Array<Object>      // Optional: compacted messages (v7)
}
```

---

## Session Management

### Properties
```javascript
workspaceId              // Current workspace ID
blackboard               // Coordination state object
displayedMessages        // Map<messageId, element>
realtimeMessageWidgets   // Map<item_id, widget>
```

### Methods
```javascript
createWorkspaceSession(title)
switchWorkspaceSession(workspaceId)
listWorkspaceSessions()
deleteWorkspaceSession(workspaceId)
```

---

## Message Integration

### Realtime Events
```javascript
setupRealtimeEvents()
  // Listen for realtime component events
  
createRealtimeMessage(role, messageData)
  // Add new realtime message to shared pane
  
updateRealtimeMessage(role, messageData)
  // Update existing realtime message
```

### OpenCode Events
```javascript
setupOpenCodeEvents()
  // Listen for opencode component events
  
ensureOpenCodeServer()
  // Auto-start server if not running
  
createOpenCodeMessage(msg)
  // Add new opencode message to shared pane
  
updateOpenCodeMessage(msg)
  // Update existing opencode message
  
updateOpenCodeStatusMessage(msg)
  // Update status indicator
```

### Unified Rendering
```javascript
renderSharedMessages()
  // Merges both sources (realtime + opencode)
  // Sorts by timestamp
  // Renders in unified message pane
```

---

## Request-Response Correlation

**Purpose:** Track coding agent tasks initiated by voice chat

### Blackboard State
```javascript
this.blackboard = {
  pendingRequests: new Map(),       // Map<requestId, request>
  completedRequests: new Map(),     // Map<requestId, response>
  // ... other coordination state
}
```

### Methods
```javascript
sendMessageToOpenCode(message, requestId)
  // Send coding task to opencode component
  
checkAndCompleteRequests()
  // Called when agent idle - check for completed requests
  
completeRequest(requestId, responses)
  // Mark request as completed with responses
  
getRequestResponse(requestId)
  // Retrieve response for given request
  
extractMessageContent(opencodeMessage)
  // Parse tool results from opencode message
```

**Workflow:**
1. Voice agent calls `send_opencode_task` tool
2. Workspace creates pending request
3. OpenCode agent processes task
4. Workspace detects completion (via `session.idle` event)
5. Workspace marks request complete, relays result back to voice

---

## Public API for Realtime

**Methods exposed to realtime component:**
```javascript
sendMessageToOpenCode(message, requestId)
getOpenCodeStatus()
getOpenCodeHistory()             // Returns OpenCode format
createOpenCodeSession(title)
getOpenCodeSessions()
```

---

## Unified Replay

**Purpose:** Replay both realtime and opencode events in sync

```javascript
enableReplay()
  // Disables inputs, creates artificial workspace
  // IMPORTANT: Propagates _replayMode to child components
  this._replayMode = true;
  this.realtimeComponent._replayMode = true;
  this.opencodeComponent._replayMode = true;
  
disableReplay()
  // Re-enables inputs
  // IMPORTANT: Clears _replayMode from child components
  this._replayMode = false;
  if (this.realtimeComponent) this.realtimeComponent._replayMode = false;
  if (this.opencodeComponent) this.opencodeComponent._replayMode = false;
  
cleanupArtificialSession()
  // Removes replay-* sessions
```

**Key Principle:** Child components don't automatically inherit instance variables from their container. State must be explicitly synchronized in composition relationships.

---

## ESC Key Handling

**Double-ESC to abort generation:**
```javascript
onKeyDown(evt)
  // Double-ESC detection
  
abortCurrentSession()
  // Delegates to opencode component
```

---

## Message Stream Backup (Optional)

**Purpose:** Debug feature to store message history for replay/analysis

### Architecture
- Enabled by default, disable with `event-storage="disabled"` attribute
- Stores ALL messages as JSON array in workspace session record
- Debounced writes (1-2 seconds) to batch updates during streaming
- Compact format only (uses `compactEventData()` from base class)

### Storage
Messages stored in `messagesArray` field of workspace record:
```javascript
workspaces: {
  // ... other fields
  messagesArray: Array<Object>  // Compacted messages
}
```

### Usage
```javascript
// Enabled by default:
<lively-ai-workspace>

// Explicitly disable:
<lively-ai-workspace event-storage="disabled">

// In component:
get isEventStorageEnabled() {
  return this.getAttribute('event-storage') !== 'disabled';
}
```

### Operations
- **Copy Stream:** Export `messagesArray` as JSONL to clipboard
- **Replay Stream:** Load from IndexedDB, replay through workspace
- **Clear Stream:** Empty `messagesArray` for current session

### Context Menu
```javascript
getContextMenuItems() {
  if (this.isEventStorageEnabled) {
    return [
      ["Copy Message Stream", () => this.copyMessageStream()],
      ["Replay Message Stream", () => this.replayMessageStream()],
      ["Clear Message Stream", () => this.clearMessageStream()],
      [" Event Storage", () => this.setAttribute('event-storage', 'disabled'), "", "☑"]
    ];
  }
  // ... disabled state
}
```

### Design Rationale
1. **Why JSON Array?** Native JavaScript, easy manipulation, IndexedDB auto-serialization
2. **Why Debounced?** Avoid excessive writes during message streaming
3. **Why Enabled by Default?** Useful for debugging, minimal overhead with compaction
4. **Why Workspace Only?** Centralized storage, already has session linking
5. **Why Compact Format?** Reduces storage (strips system prompts, large tool outputs)

### Limitations
- Only stores messages visible in unified pane (not raw events)
- Lost on session deletion (tied to workspace record)
- No cross-session queries (JSON array is opaque to IndexedDB)
- Compaction is lossy (system prompts stripped)

---

## Data Flow

### Message Flow
```
User speaks → OpenaiRealtimeChat
                ↓ (event: realtime:create-live-user-message)
              Workspace
                ↓ (createRealtimeMessage)
              Shared Messages Pane

AI responds → OpenaiRealtimeChat
                ↓ (event: realtime:update-live-assistant-message)
              Workspace
                ↓ (updateRealtimeMessage)
              Shared Messages Pane

User calls function → OpenaiRealtimeChat
                         ↓ (sendMessageToOpenCode)
                       Workspace
                         ↓ (HTTP POST)
                       LivelyOpencode
                         ↓ (SSE events)
                       Workspace
                         ↓ (createOpenCodeMessage)
                       Shared Messages Pane
```

---

## Design Decisions

### Why Embedded Components?

Workspace embeds realtime and opencode rather than inheriting:

**Benefits:**
- Reuse existing components without modification
- Each component works standalone or embedded
- Clear separation of concerns
- Easy to test components independently

**Tradeoffs:**
- More complex event coordination
- Duplicate UI state (messages shown in workspace, hidden in embedded)
- Careful management of `messagesUI` and `sessionUI` flags

---

## Performance

### Debounced Rendering
```javascript
this.debouncedRenderSharedMessages = (() => this.renderSharedMessages()).debounce(100)
```

**Good practice:** Prevents excessive re-renders during streaming

### Message Widget Tracking
```javascript
this.displayedMessages = new Map()           // messageId → DOM element
this.realtimeMessageWidgets = new Map()      // item_id → widget
```

**Benefit:** O(1) lookups for message updates

---

## See Also

- [Architecture Overview](../doc/ai-workspace.md)
- [Task Management](../doc/ai-workspace-tasks.md)
- [Modes](../doc/ai-workspace-modes.md)
- [OpenaiRealtimeChat](openai-realtime-chat.md)
- [LivelyOpencode](lively-opencode.md)
