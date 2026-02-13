# Lively OpenCode Architecture

## Overview

`lively-opencode` is a text-based AI coding agent interface that connects to OpenCode.ai server (port 9100). It's one of three components in the unified AI workspace architecture.

## Relationship to AI Workspace

Part of the 3-component AI workspace system:
- **lively-ai-workspace** - Unified coordinator (embeds both agents)
- **openai-realtime-chat** - Audio/text chat with OpenAI Realtime API
- **lively-opencode** - Text-based coding agent via OpenCode server

All extend **LivelyChat** base class, which provides:
- Event capture & replay system
- Context menu pattern
- Debug logging
- Message rendering coordination

## Architecture

**Connection:**
- HTTP REST API to `http://localhost:9100` for commands
- Server-sent events (SSE) for real-time message streaming
- Session-based conversation management
- Server is source of truth, local IndexedDB caches metadata

**Message Flow:**
```
User sends → POST /session/:id/message
           → SSE: message.updated (metadata)
           → SSE: message.part.updated (streaming)
           → SSE: session.idle
           → Incremental UI updates
```

**Message Format (OpenCode/Anthropic):**
```javascript
{
  info: { id, role, time, sessionID },
  parts: [
    { type: 'text', text, id },
    { type: 'tool_use', id, name, input },
    { type: 'tool_result', tool_use_id, content }
  ]
}
```

## Current Status

### ✅ Working

- [x] Session creation and management
- [x] Message sending and receiving
- [x] SSE streaming for real-time updates
- [x] MCP integration (lively4_evaluate_code, read_file, etc)
- [x] Incremental message rendering
- [x] Event capture & replay system
- [x] Double-ESC abort mechanism
- [x] Session switching
- [x] Working directory isolation
- [x] Server auto-start via embedded terminal

### ❌ Not Working / TODO

- [ ] **Interaction - Agent asking for rights/permissions**
  - Agent cannot pause for user confirmation
  - No UI for approving dangerous operations
  - No permission system for file operations
  
- [ ] **Intercepting agent execution**
  - Cannot pause/modify agent mid-execution
  - No "approve next tool call" mode
  - No step-through debugging

- [ ] **Visualization of tool calls**
  - Basic text rendering only
  - No special UI for read/edit/eval operations
  - File diffs not highlighted
  - No file tree showing affected files
  
- [ ] **Enhanced tool call display**
  - `read_file` - Could show file icon, syntax highlighting preview
  - `edit_file` - Could show diff view, before/after comparison
  - `lively4_evaluate_code` - Could show console output separately, syntax highlight code
  - Tool results often truncated or hard to read

- [ ] **Agent state visibility**
  - No visual indicator of "thinking" vs "executing tool" vs "waiting"
  - Tool execution progress not shown
  - No queue of pending operations

- [ ] **(Optional) Thinking steps rendering**
  - If agent uses extended thinking, no special visualization
  - Could show collapsed/expandable thinking blocks
  - Differentiate thinking from output text

- [ ] **(Optional) Subagent rendering**
  - If OpenCode supports spawning subagents, no visual representation
  - Could show agent hierarchy/tree
  - Track which agent generated which messages

- [ ] **Activating "thinking" mode**
  - No UI to enable/disable extended thinking
  - No configuration for thinking depth/verbosity
  - Unclear if server supports thinking mode configuration

## Key Components

**Base Class:** `src/components/tools/lively-chat.js`
- Shared chat functionality, event capture, replay controls

**Message Renderer:** `src/components/tools/lively-chat-message.js`
- Handles both flat (realtime) and structured (OpenCode) message formats
- Renders tool_use and tool_result parts
- Filters internal coordination functions

**Files:**
- `src/components/tools/lively-opencode.js` - Main component
- `src/components/tools/lively-opencode.html` - UI template

## Integration Points

**Workspace Integration:**
Embedded in ai-workspace with coordination via:
- `messagesUI = false` - Workspace renders messages
- `sessionUI = false` - Workspace manages sessions
- Events: `opencode:message-added`, `opencode:status-change`, `opencode:session-idle`
- Public API: `sendMessage()`, `getCurrentMessages()`, `createSession()`

**MCP Tools:**
Available via opencode-server tools.json:
- `lively4_evaluate_code` - Execute JS in live browser
- File operations (read/write/edit via standard MCP)
- Additional tools configurable in server

## Next Steps (Priority Order)

1. **Permission System** - Add user approval UI for dangerous operations
2. **Tool Call Visualization** - Enhanced rendering for read/edit/eval
3. **Agent Interception** - Pause/approve mechanism during execution
4. **State Indicators** - Visual feedback for agent activity
5. **Diff Viewer** - Side-by-side file changes for edit operations
