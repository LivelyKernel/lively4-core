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

- [ ] **ESC abort UI feedback**
  - Double-ESC mechanism works but lacks visual feedback
  - No indication after first ESC press that user should press ESC again
  - Should show toast/banner: "Press ESC again within 500ms to abort"
  - First press at line 232, abort at line 229 in lively-opencode.js

### 🔮 Future Work

Items that would be nice to have but are unlikely to happen in the foreseeable future:

- [ ] **Advanced Agent Interception** - Step-through and modification capabilities
  - "Approve next tool call" mode for cautious execution
  - Step-through debugging with pause/resume
  - Ability to modify tool inputs before execution
  - Tool call preview before execution

- [ ] **Subagent rendering**
  - Visual representation of spawned subagents
  - Agent hierarchy/tree view
  - Track which agent generated which messages

### ✅ Recently Completed

- [x] **Permission system & interactive questions** (`opencode-question-tool`)
  - Agent can pause and ask user for confirmation using `mcp_question` tool
  - Interactive UI with radio/checkbox options for single/multiple choice
  - Custom text input support ("Type your own answer")
  - User responses sent back to agent via POST to `/tool-call/:id/answer`
  - Implemented in `src/ai-workspace/components/tool-renderers/opencode-question-tool.js`

- [x] **Agent interception & abort mechanism**
  - Double-ESC (within 500ms) aborts current message generation
  - Uses OpenCode API: `POST /session/:id/abort`
  - Keyboard handler in `onKeyDown()` at line 219 of lively-opencode.js
  - First ESC records timestamp, second ESC triggers abort
  - Works but could use better UI feedback (see TODO above)

- [x] **Comprehensive tool call visualization** (25+ specialized renderers)
  - `opencode-read-tool` - Shows file content with syntax highlighting
  - `opencode-edit-tool` - Shows inline diffs using diff-match-patch
  - `opencode-evaluate-code-tool` - Shows code execution with formatted output
  - `opencode-bash-tool` - Shows command output
  - `opencode-grep-tool`, `opencode-glob-tool` - Shows search results
  - `opencode-question-tool` - Shows interactive questions
  - `opencode-plan-tool`, `opencode-todowrite-tool` - Shows task management
  - Plus many more specialized renderers for all tool types
  - Located in: `src/ai-workspace/components/tool-renderers/`

- [x] **Streaming reasoning updates**
  - Reasoning parts update incrementally as deltas arrive via SSE
  - `handleMessagePartUpdated` finds existing part and updates via `Object.assign`
  - UI re-renders automatically with updated text
  - Rendered as collapsible `<details>` blocks with 💭 emoji

- [x] **Thinking steps rendering**
  - Extended thinking blocks render as collapsible `<details>` elements
  - Differentiated with 💭 emoji and italic "Thinking..." summary
  - Part type: `{ type: 'reasoning', text: '...' }` from OpenCode API

- [x] **Activating "thinking" mode**
  - Variant button cycles through none/high/max thinking modes
  - Uses OpenCode's variant system to control thinking budget tokens
  - For Claude: none (default), high (16k tokens), max (32k tokens)
  - Variant is included in message POST requests

## Key Components

**Base Class:** `src/ai-workspace/components/lively-chat.js`
- Shared chat functionality, event capture, replay controls

**Message Renderer:** `src/ai-workspace/components/lively-chat-message.js`
- Handles both flat (realtime) and structured (OpenCode) message formats
- Renders tool_use and tool_result parts
- Dispatches to specialized tool renderers
- Filters internal coordination functions

**Main Component:**
- `src/ai-workspace/components/lively-opencode.js` - Main component logic
- `src/ai-workspace/components/lively-opencode.html` - UI template

**Tool Renderers:** `src/ai-workspace/components/tool-renderers/`

All tool renderers extend `OpenCodeBaseTool` base class which provides:
- `matches(part)` - Pattern matching for tool types
- `renderToolUse(part, component)` - Render tool call
- `renderToolResult(part, component)` - Render tool result  
- `renderToolStreaming(part, component)` - Render streaming tool execution
- `renderCompact(part, result, showDebug)` - Compact view in `<details>` blocks
- Helper methods for markdown rendering, file path formatting, etc.

**Available Renderers:**
- `opencode-read-tool` - File reads with syntax highlighting
- `opencode-edit-tool` - File edits with inline diffs
- `opencode-write-tool` - File writes
- `opencode-bash-tool` - Shell command execution
- `opencode-evaluate-code-tool` - JavaScript evaluation in browser
- `opencode-grep-tool` - Code search results
- `opencode-glob-tool` - File pattern matching
- `opencode-ls-tool` - Directory listings
- `opencode-apply-patch-tool` - Patch application
- `opencode-multiedit-tool` - Multiple file edits
- `opencode-question-tool` - Interactive questions
- `opencode-plan-tool` - Planning steps
- `opencode-todowrite-tool` - TODO management
- `opencode-task-tool` - Subagent task spawning
- `opencode-run-tests-tool` - Test execution
- `opencode-inspect-tests-tool` - Test result inspection
- `opencode-lsp-tool` - Language Server Protocol operations
- `opencode-codesearch-tool` - Semantic code search
- `opencode-webfetch-tool` - Web page fetching
- `opencode-websearch-tool` - Web search
- `opencode-skill-tool` - Skill loading
- `opencode-batch-tool` - Batch operations
- `opencode-invalid-tool` - Invalid tool calls
- `opencode-generic-tool` - Fallback for unmatched tools

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
