# AI Workspace Implementation Details

Technical implementation of the hybrid voice + code agent system.

## Components

### openai-realtime-chat
WebRTC-based voice interface with OpenAI Realtime API
- Real-time audio streaming
- Async function calling for tool integration
- Conversation persistence in IndexedDB

### lively-opencode
UI wrapper for Claude Code terminal agent (OpenCode server)
- RESTful HTTP API to local OpenCode server (port 9100)
- Server-sent events (SSE) for real-time updates
- Session-based conversation management
- Incremental message updates

### lively-ai-workspace
Coordinator managing both agents with shared conversation history
- Embeds both voice and code components
- Unified session management
- Event capture and replay system
- Blackboard pattern for coordination

## Core Features

### Unified Session Management
Links voice and code conversations in single workspace sessions:
- Database schema: `workspaces(id, conversationId, opencodeSessionId)`
- Atomic session switching
- Shared conversation history

### Event Capture & Replay
All interactions recorded for debugging and analysis:
- Source-tagged events (`eventSource` property)
- JSONL export/import format
- Replay with timing controls (pause, speed adjustment)
- Useful for comparing configurations

### Blackboard Pattern
Shared state object for agent coordination:
```javascript
blackboard: {
  currentTask: string,
  agentStatus: 'idle' | 'working' | 'blocked',
  coordination: object,
  lastUpdate: timestamp,
  pendingRequests: Map,
  completedRequests: Map
}
```

### Request-Response Correlation
Tracks task completion across agents:
- Voice agent sends task with request ID
- System tracks pending requests
- Marks requests complete when code agent finishes
- Voice agent can query completion status

### Incremental Message Rendering
Smooth streaming UX without full re-renders:
- Individual message widgets tracked in Maps
- Update existing messages as new parts arrive
- Prevents flicker during streaming

## Plan: Realtime Control over OpenCode Agent

Goal: allow `openai-realtime-chat` to explicitly **stop**, **continue**, and **inspect current state** of the coding agent (`lively-opencode`) through first-class tools.

### Current Integration Points
- Tool gateway: `src/ai-workspace/components/realtime-chat-tools/workspace-toolset.js`
- Realtime function-call execution: `src/ai-workspace/components/openai-realtime-chat.js`
- Workspace orchestration API: `src/ai-workspace/components/lively-ai-workspace.js`
- OpenCode execution/abort internals: `src/ai-workspace/components/lively-opencode.js`

### Gaps
- Only `send_opencode_task` is currently implemented in `WorkspaceToolset`
- Realtime allowlist only includes `send_opencode_task`
- No explicit `continue` API; only regular message send exists
- `getOpenCodeStatus()` exists but is not exposed as a dedicated realtime tool with a stable compact schema

### Planned Semantics
- **stop**: abort current generation for the active OpenCode session (does not stop server)
- **continue**: continue in same session by sending follow-up instruction
- **current state**: structured snapshot of connection/session/generation/request-tracking state

### Implementation Steps

1. Extend workspace toolset
   - File: `src/ai-workspace/components/realtime-chat-tools/workspace-toolset.js`
   - Add tools:
     - `stop_opencode_task`
     - `continue_opencode_task`
     - `get_opencode_current_state`
   - Keep return shape stable: `{ success, ... }`

2. Add workspace-level API methods (single coordination surface)
   - File: `src/ai-workspace/components/lively-ai-workspace.js`
   - Add methods:
     - `stopOpenCodeTask({ requestId? })` (delegates to existing `abortCurrentSession()`)
     - `continueOpenCodeTask({ instruction?, requestId? })` (delegates to `sendMessageToOpenCode()`)
     - `getOpenCodeCurrentState({ includeHistory?, includePending? })`
   - Keep request correlation in blackboard (`pendingRequests`, `completedRequests`)

3. Add explicit OpenCode state snapshot method
   - File: `src/ai-workspace/components/lively-opencode.js`
   - Add `getExecutionStateSnapshot()` returning bounded data:
     - `connected`, `isGenerating`, `currentSessionId`, `generatingSessionIds`
     - last status/event metadata for diagnostics

4. Expose tools in realtime allowlist
   - File: `src/ai-workspace/components/openai-realtime-chat.js`
   - Update `updateToolset()` allowlist to include the three new tool names

5. Keep tool rendering/UI mapping coherent
   - Files:
     - `src/ai-workspace/components/lively-chat-message.js`
     - `src/ai-workspace/components/tool-renderers/vox-generic-tool.js`
   - Add new function names to local-function classification and icon mapping

6. Tests
   - `src/ai-workspace/test/openai-realtime-chat-tools-test.js`
     - verify definitions and delegation for new WorkspaceToolset tools
   - `src/ai-workspace/test/openai-realtime-chat-test.js`
     - verify allowlist + permission behavior includes new tools
   - `src/ai-workspace/test/lively-ai-workspace-test.js`
     - verify stop/continue/state API behavior and request-state transitions

### Verification Flow (manual)
1. `send_opencode_task`
2. `get_opencode_current_state` → expect working
3. `stop_opencode_task`
4. `get_opencode_current_state` → expect idle/aborted
5. `continue_opencode_task`
6. `get_opencode_current_state` → expect working then idle

### Acceptance Criteria
- Realtime chat can stop, continue, and inspect coding-agent state without UI-only interactions
- Workspace remains the mediator between realtime and opencode (no direct cross-component coupling)
- Tool outputs are deterministic and compact enough for reliable function-call use

## Configuration

### System Prompts
Located in `src/config/prompts/`:
- `ai-workspace-audio-chat.txt` - Voice agent instructions
- Defines agent role and capabilities
- Configurable for different responsibility models

### Tool Availability
Controlled per component:
- Voice agent tools defined in `realtime-chat-tools/`
- Code agent tools via MCP server (`../lively4-server/tools.json`)
- Can adjust which tools are available for different configurations

## Database Schema

### Workspace DB (lively-ai-workspace-history)
```javascript
workspaces: {
  id: string (UUID)
  timestamp: date
  lastActivityTime: date
  title: string
  conversationId: string  // links to realtime DB
  opencodeSessionId: string  // links to opencode session
  messagesArray: Array<Object>  // optional event backup
}
```

### Realtime DB (openai-realtime-conversations)
```javascript
conversations: {
  id: string (UUID)
  timestamp: number
  lastMessageTime: number
}

messages: {
  id: number (auto-increment)
  conversationId: string
  timestamp: number
  type: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  metadata: object
  sequence: number
}
```

### OpenCode Sessions
Managed server-side, accessed via REST API.
