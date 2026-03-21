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

