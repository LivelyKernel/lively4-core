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
- [x] Extended thinking rendering (collapsible blocks)
- [x] Variant cycling (none/high/max thinking modes)

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

- [x] **Thinking steps rendering**
  - Extended thinking blocks render as collapsible `<details>` elements
  - Differentiated with 💭 emoji and italic "Thinking..." summary
  - Part type: `{ type: 'reasoning', text: '...' }` from OpenCode API

- [ ] **(Optional) Subagent rendering**
  - If OpenCode supports spawning subagents, no visual representation
  - Could show agent hierarchy/tree
  - Track which agent generated which messages

- [x] **Activating "thinking" mode**
  - Variant button cycles through none/high/max thinking modes
  - Uses OpenCode's variant system to control thinking budget tokens
  - For Claude: none (default), high (16k tokens), max (32k tokens)
  - Variant is included in message POST requests

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

## OpenCode Server

**Location:** `../opencode/` (separate from lively4-server)
- Terminal-based application running on `http://localhost:9100`
- Source code is TypeScript in `packages/opencode/src/`
- Config endpoint: `GET /config` returns current configuration

**Thinking/Reasoning Configuration:**
- OpenCode supports Anthropic's extended thinking via reasoning API
- Configuration in `~/.config/opencode/opencode.json`:
  - `keybinds.display_thinking` - Toggle thinking visibility (default: "none")
  - Model-specific thinking options configured per provider
- Messages with reasoning include `{ type: 'reasoning', text: '...' }` parts
- Lively4 renders these as collapsible details blocks

**Provider Transform:**
Located in `packages/opencode/src/provider/transform.ts`:
- Different providers support different thinking configurations
- Anthropic: `thinking: { type: 'enabled', budgetTokens: 4000 }`
- OpenAI: `reasoning: { effort: 'low' | 'medium' | 'high' }`
- GitHub Copilot: `thinking_budget` parameter

**Message Format:**
```javascript
// Reasoning part (extended thinking)
{
  type: 'reasoning',
  text: 'Agent thinking process...',
  providerMetadata: { /* ... */ }
}

// Reasoning streaming via SSE
{
  "type": "message.part.updated",
  "properties": {
    "part": {
      "id": "prt_...",
      "sessionID": "ses_...",
      "messageID": "msg_...",
      "type": "reasoning",
      "text": "Current accumulated text...",  // Full text so far
      "time": { "start": 1771000088800 }
    },
    "delta": " algorithm"  // Incremental chunk to append
  }
}

// Step finish includes token usage
{
  type: 'step-finish',
  tokens: {
    input: 1234,
    output: 567,
    reasoning: 890,  // Thinking tokens
    cache: { read: 100, write: 50 }
  }
}
```

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

1. **Streaming Reasoning Updates** - Implement live streaming for reasoning text
   - Currently reasoning parts render as static collapsed blocks
   - Need to handle `message.part.updated` events with `type: "reasoning"`
   - Update reasoning text incrementally as `delta` chunks arrive
   - Show "thinking..." indicator while streaming in progress
   
2. **Permission System** - Add user approval UI for dangerous operations
3. **Tool Call Visualization** - Enhanced rendering for read/edit/eval
4. **Agent Interception** - Pause/approve mechanism during execution
5. **State Indicators** - Visual feedback for agent activity
6. **Diff Viewer** - Side-by-side file changes for edit operations
