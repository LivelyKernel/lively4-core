# AI Workspace Architecture Overview

<lively-import src="../_navigation.html"></lively-import>

## Overview

The Lively4 AI workspace consists of three main components that work together to provide a unified AI-assisted development environment:

1. **[lively-ai-workspace](../components/lively-ai-workspace.md)** - Unified workspace coordinator
2. **[openai-realtime-chat](../components/openai-realtime-chat.md)** - WebRTC audio/text chat with OpenAI Realtime API
3. **[lively-opencode](../components/lively-opencode.md)** - Text-based coding agent via Claude Code server

All components extend a shared base class ([lively-chat](../components/lively-chat.md)) which provides common chat functionality.

---

## Class Hierarchy

```
Morph (lively-morph.js)
  ├─ LivelyChat (lively-chat.js)
  │    ├─ LivelyAiWorkspace (lively-ai-workspace.js)
  │    ├─ OpenaiRealtimeChat (openai-realtime-chat.js)
  │    └─ LivelyOpencode (lively-opencode.js)
  │
  ├─ LivelyChatMessage (lively-chat-message.js)  [Message Renderer]
  ├─ LivelyChatSessions (lively-chat-sessions.js)  [Session Management]
  └─ LivelyAgentBoard (lively-agent-board.js)  [Agent Info Display]
```

**Note:** `LivelyChatMessage`, `LivelyChatSessions`, and `LivelyAgentBoard` extend `Morph` directly (not `LivelyChat`).

---

## Component Documentation

### Core Components

- **[lively-chat.js](../components/lively-chat.md)** - Base class for all AI chat components
  - Event capture and replay system
  - Shared utility methods
  - Context menu infrastructure
  
- **[lively-ai-workspace.js](../components/lively-ai-workspace.md)** - Coordinator component
  - Embeds realtime and opencode components
  - Manages unified workspace sessions
  - Coordinates request-response between agents
  
- **[openai-realtime-chat.js](../components/openai-realtime-chat.md)** - WebRTC audio/text chat
  - Real-time voice interaction
  - Function calling via tools
  - Conversation persistence
  
- **[lively-opencode.js](../components/lively-opencode.md)** - Text-based coding agent
  - Claude Code server integration
  - Incremental message rendering
  - Tool execution visualization

### Supporting Components

- **[lively-chat-message.js](../components/lively-chat-message.md)** - Message display component
  - Handles both flat and structured message formats
  - Tool call rendering
  - Expand/collapse for long messages
  
- **[lively-chat-sessions.js](../components/lively-chat-sessions.md)** - Session management component
  - Multi-select support
  - Context menu operations
  
- **[lively-agent-board.js](../components/lively-agent-board.md)** - Agent information display
  - TODOs grouped by status
  - Tool usage statistics
  - File operation summary

### Tool Integration

- **[Realtime Chat Tools](../components/realtime-chat-tools/index.md)** - OpenAI Realtime API tool integration
  - BasicToolset (standalone tools)
  - WorkspaceToolset (workspace integration)
  
- **[Tool Renderers](../components/tool-renderers/index.md)** - Specialized renderers for Claude Code tools
  - Read/Write/Edit tools
  - Search tools (Grep, Glob, Bash)
  - Generic fallback renderer

---

## Architecture Diagram

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

All components use event capture system to maintain conversation history and enable replay functionality.

---

## Shared Patterns

### 1. Message Display Architecture

All components delegate message rendering to `lively-chat-message` component:

```javascript
// Flat format (realtime)
await chatMessage.setMessage({
  role: 'user',
  content: 'text',
  source: 'audio',
  streamType: 'realtime'
});

// OpenCode format
await chatMessage.setOpenCodeMessage(opencodeMsg, {
  source: 'code',
  streamType: 'opencode'
});
```

### 2. Event Capture & Replay

**Purpose:** Record live sessions for debugging and testing

**Workflow:**
1. Normal operation: Events captured to `_eventCapture` array
2. Export: Convert to JSONL (one JSON per line)
3. Import: Parse JSONL from clipboard
4. Replay: Process events with timing control

**Controls:** Pause/Resume, Speed (1x, 2x, 5x, Instant), Stop, Progress indicator

### 3. Context Menu Pattern

All components use right-click context menu:

```javascript
// Base class provides:
createBaseContextMenu(evt)
  - Copy selection
  - Toggle debug
  - Copy chat history
  - Replay from clipboard

// Subclasses override:
getContextMenuItems()
  // Return array of additional menu items
```

### 4. Button Registration

Auto-wiring pattern from Morph:

```javascript
// In initialize():
this.registerButtons()

// Finds buttons by ID and calls on[ButtonName]():
<button id="sendButton">     → onSendButton()
<button id="resetButton">    → onResetButton()
```

### 5. UI Control Attributes

Shared attributes for embedding:

```javascript
messagesUI = false               // Hide message display
sessionUI = false                // Hide session list
showDebug = true                 // Show debug info
```

---

## Data Flow

### Message Flow in Workspace

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

## Message Format Differences

### Realtime Format (Flat)

```javascript
{
  role: 'user' | 'assistant' | 'tool',
  content: 'text content',
  sequence: 42,
  timestamp: 1234567890,
  type: 'message' | 'function_call' | 'function_call_output',
  metadata: {...}
}
```

### OpenCode Format (Structured)

```javascript
{
  info: {
    id: 'msg-uuid',
    role: 'user' | 'assistant',
    time: { created: '2024-01-15T10:30:00Z' },
    sessionID: 'session-uuid'
  },
  parts: [
    { type: 'text', text: 'content', id: 'part-uuid' },
    { type: 'tool_use', id: 'tool-uuid', name: 'read_file', input: {...} },
    { type: 'tool_result', tool_use_id: 'tool-uuid', content: 'result' }
  ]
}
```

### Unified Format (Workspace)

Workspace preserves both formats and tags with source:

```javascript
{
  ...originalMessage,
  source: 'audio' | 'code',
  streamType: 'realtime' | 'opencode',
  messageFormat: 'flat' | 'opencode'
}
```

---

## Key Design Decisions

### 1. Why Embedded Components?

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

### 2. Why Two Message Formats?

**Realtime:** Simple flat format from OpenAI API
**OpenCode:** Structured format from Anthropic/Claude Code

**Approach:**
- Keep both formats (they come from external APIs)
- `lively-chat-message` handles both formats
- Workspace tags messages with source for proper rendering

### 3. Why Multiple Databases?

- **Workspace DB:** Links audio + code sessions together
- **Realtime DB:** Stores conversation messages
- **OpenCode:** Server-side only (no local DB)

**Benefit:** Each component is self-contained
**Tradeoff:** Need to coordinate IDs across DBs

### 4. Why Incremental Rendering?

OpenCode streams messages part-by-part via SSE.

**Approach:**
- `renderMessage()` - Add new message to DOM
- `updateOpenCodeMessage()` - Update existing message
- Avoid `displayMessages()` - Full rebuild is expensive

**Benefit:** Smooth streaming UX, no flicker
**Tradeoff:** More complex state management

### 5. Object-Oriented Architecture

**CRITICAL:** This follows object-oriented principles with class hierarchies and inheritance.

- **Use inheritance properly**: Shared functionality goes in base class (`LivelyChat`)
- **Single source of truth**: Don't duplicate methods across subclasses
- **Polymorphism**: Subclasses inherit and can override parent methods
- **Composition pattern**: When using child components, state must be explicitly propagated

**Example: Propagating State in Composition**
```javascript
// ❌ WRONG: Only set state on parent
enableReplay() {
  this._replayMode = true;  // Only affects parent, children still write to DB!
}

// ✅ RIGHT: Propagate state to composed children
enableReplay() {
  this._replayMode = true;
  // CRITICAL: Propagate to child components
  this.realtimeComponent._replayMode = true;
  this.opencodeComponent._replayMode = true;
}
```

**Key principle:** Child components don't automatically inherit instance variables from their container. State must be explicitly synchronized in composition relationships.

---

## Performance Considerations

### 1. Message Widget Tracking

All components use Map for O(1) lookups:
```javascript
this.messageElements = new Map()     // messageId → DOM element
```

### 2. Debounced Rendering

Workspace debounces shared message rendering:
```javascript
this.debouncedRenderSharedMessages = (() => this.renderSharedMessages()).debounce(100)
```

**Good practice:** Prevents excessive re-renders during streaming

### 3. Deduplication

Realtime uses Set for deduplication:
```javascript
this.savedResponseItems = new Set()  // O(1) lookup
if (this.savedResponseItems.has(item_id)) {
  return; // Skip duplicate
}
```

**Cleanup:** Every 100 items, keep only last 100

---

## Refactoring Status

See [refactoring.md](refactoring.md) for complete refactoring roadmap and progress tracking.

**Progress Summary:**

✅ **Phases 1-4, 6 - COMPLETED**
- Critical bugs fixed
- Naming standardization complete
- Major architecture improvements done
- Cleanup tasks completed

🔄 **Phase 5 - IN PROGRESS** (UI/UX & Bug Fixes)
- Message rendering improvements
- Auto-scroll enhancements
- Session metadata sync
- Voice chat timestamp fixes

---

## Testing

Tests are located in `../test/` directory:
- `lively-ai-workspace-test.js` - Integration tests
- `lively-agent-board-test.js` - Agent board tests
- `lively-opencode-test.js` - Event replay tests
- `openai-realtime-chat-test.js` - Realtime API tests
- `openai-realtime-chat-tools-test.js` - Tool functionality tests
- `ai-workspace-transcript-test.js` - Transcript generation tests

Run tests:
```javascript
// Run specific test file
mcp__lively4__run-tests(testPath: "src/ai-workspace/test/lively-ai-workspace-test.js")
```

---

## External Dependencies

- **Claude Code Server**: Runs separately on `http://localhost:9100`
  - Source code in `../Claude/` directory (for documentation/reference only)
  - Terminal-based AI coding agent
  
- **OpenAI Realtime API**: Requires OpenAI API key
  - WebRTC-based real-time voice interaction
  - Configured via environment or component settings

---

## See Also

### Documentation
- [Introduction](introduction.md) - Motivation and document overview
- [Background](background.md) - State of the art: Code agents vs. realtime voice agents
- [Approach](approach.md) - Design rationale and exploration goals
- [Implementation](implementation.md) - Technical implementation details
- [Refactoring Guide](refactoring.md) - Current refactoring tasks and improvements
- [Task Management](ai-workspace-tasks.md) - Task handling and coordination
- [Modes](ai-workspace-modes.md) - Different operational modes
- [OpenCode Details](opencode.md) - Claude Code integration specifics
- [Question Tool](opencode-question-tool.md) - Question tool implementation
- [Duplicate Messages](openai-realtime-duplicate-messages.md) - OpenAI message handling
- [Ideas](ideas.md) - Future ideas and explorations

### Components
- [lively-chat.js](../components/lively-chat.md) - Base class
- [lively-ai-workspace.js](../components/lively-ai-workspace.md) - Coordinator
- [openai-realtime-chat.js](../components/openai-realtime-chat.md) - Audio chat
- [lively-opencode.js](../components/lively-opencode.md) - Coding agent
- [lively-chat-message.js](../components/lively-chat-message.md) - Message renderer
- [lively-chat-sessions.js](../components/lively-chat-sessions.md) - Session management
- [lively-agent-board.js](../components/lively-agent-board.md) - Agent info display

### Main Documentation
- [AI Workspace README](../index.md) - Main entry point

---

*This document provides an architectural overview. See individual component documentation for detailed APIs and implementation details.*
