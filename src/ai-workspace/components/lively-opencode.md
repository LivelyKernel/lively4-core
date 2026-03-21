# LivelyOpencode (Coding Agent)

<lively-import src="../_navigation.html"></lively-import>

**File:** `lively-opencode.js`

**Purpose:** Text-based AI coding agent via Claude Code server

**Extends:** [LivelyChat](lively-chat.md)

---

## Architecture

- RESTful HTTP API to local Claude Code server (port 9100)
- Server-sent events (SSE) for real-time updates
- Session-based conversation management
- Incremental message updates via events

**Server Connection:**
```javascript
serverUrl: 'http://localhost:9100'
```

**External Dependencies:**
- Claude Code Server: Runs separately on port 9100
- Source code in `../Claude/` directory (for documentation/reference only)

---

## Server Connection

### Properties
```javascript
serverUrl            // 'http://localhost:9100'
eventSource          // EventSource for SSE
connected            // Connection state
shouldReconnect      // Auto-reconnect flag
reconnectTimer       // Retry timer

// Shared server state across instances
static sharedServerTerminal
static sharedServerRunning
```

### Methods
```javascript
connectEventStream()
  // Establish SSE connection
  
handleEvent(data, replaySessionId)
  // Process SSE events
```

---

## Session State

### Properties
```javascript
sessions             // Array of session metadata
currentSession       // Current session object
messages             // Map<sessionId, messages[]>
temporaryMessages    // Map<sessionId, temp messages[]>
messageElements      // Map<messageId, DOM element>
```

---

## API Endpoints

```javascript
GET  /config                     // Server config
GET  /session                    // List sessions
POST /session                    // Create session
GET  /session/:id/message        // Get messages
POST /session/:id/message        // Send message
GET  /session/:id/message/:id    // Get single message
POST /session/:id/abort          // Abort generation
GET  /event                      // SSE stream
```

---

## Event Handling

### Event Types from Server
```javascript
'message.updated'                // Message metadata
'message.part.updated'           // Part streaming
'session.updated'
'session.idle'
```

### Event Flow
```
User sends message → POST /session/:id/message
                       ↓
Server processes → SSE: message.updated (info)
                → SSE: message.part.updated (text streaming)
                → SSE: message.part.updated (tool execution)
                → SSE: session.idle
                       ↓
Component updates → updateOpenCodeMessageFromEvent()
                  → updateOpenCodePart()
                       ↓
UI renders → renderMessage() or updateOpenCodeMessage()
```

---

## Message Format (OpenCode)

**Structured format from Claude Code:**
```javascript
{
  info: {
    id: string
    role: 'user' | 'assistant'
    time: { created: ISO string }
    sessionID: string
  },
  parts: [
    { type: 'text', text: string, id: string },
    { type: 'tool', callID: string, tool: string, state: {...} },
    { type: 'tool_use', id: string, name: string, input: {...} },
    { type: 'tool_result', tool_use_id: string, content: string }
  ]
}
```

### Part Types

**1. Text Parts:**
```javascript
{ type: 'text', text: 'content', id: 'part-uuid' }
```

**2. Tool Use (Anthropic format):**
```javascript
{ type: 'tool_use', id: 'tool-uuid', name: 'read_file', input: {...} }
```

**3. Tool Result (Anthropic format):**
```javascript
{ type: 'tool_result', tool_use_id: 'tool-uuid', content: '...', is_error: false }
```

**4. Tool Streaming (OpenCode events):**
```javascript
{ type: 'tool', callID: 'xyz', tool: 'lively4_evaluate_code', state: {...} }
```

---

## Message Rendering

### Methods
```javascript
loadMessagesForSession(sessionId)
  // Load all messages for a session
  
displayMessages()
  // Full rebuild (AVOID! Use incremental rendering)
  // ONLY use on session switch
  
renderMessage(opencodeMsg)
  // Incremental add - Add new message to DOM
  
updateOpenCodeMessage(messageId, msg)
  // Incremental update - Update existing message
  
createOpenCodeMessage(role, parts, messageId)
  // Create new message element
```

### Incremental Updates
```javascript
updateOpenCodeMessageFromEvent(sessionId, messageInfo)
  // Update message metadata from event
  
updateOpenCodePart(sessionId, part)
  // Update specific message part
  
loadMessageById(sessionId, messageId)
  // Fallback fetch if needed
```

**Important:** Prefer incremental rendering for smooth streaming UX:
- ✅ Use `renderMessage()` and `updateOpenCodeMessage()`
- ❌ Avoid `displayMessages()` - expensive full rebuild

---

## Temporary Messages

**Purpose:** Immediate UI feedback before server confirms

```javascript
addTemporaryMessage(sessionId, role, content)
  // Add optimistic message
  
clearTemporaryMessages(sessionId)
  // Remove when server confirms
```

---

## ESC Key Handling

**Double-ESC to abort generation:**

### Properties
```javascript
isGenerating         // Track if AI responding
lastEscPress         // Double-ESC detection
```

### Methods
```javascript
onKeyDown(evt)
  // Detect double ESC press
  
abortCurrentSession()
  // POST /session/:id/abort
```

---

## Embedded Server

### Methods
```javascript
startServer()
  // Starts Claude Code in lively-xterm
  
stopServer()
  // Sends Ctrl+C to terminal
  
updateServerButton()
  // Update UI button state
```

---

## Health Monitoring

```javascript
startConnectionHealthCheck()
  // Start polling server health
  
stopConnectionHealthCheck()
  // Stop health check
  
checkServerHealth()
  // Poll /config every 30s
```

**Why OpenCode needs health checking:**
- Local server can crash
- Unlike OpenAI which is always available
- Auto-reconnect on failure

---

## Tool Renderers

Specialized renderers for different tool types. See [Tool Renderers](tool-renderers/index.md) for complete documentation.

**Key Renderers:**
- `opencode-read-tool` - File reads with syntax highlighting
- `opencode-write-tool` - File writes with content preview
- `opencode-edit-tool` - File edits with diff view
- `opencode-grep-tool` - Search results
- `opencode-bash-tool` - Command execution
- `opencode-generic-tool` - Fallback for all tools

---

## Performance

### Incremental Rendering Benefits
- Smooth streaming UX, no flicker
- Only update changed parts
- Better memory usage

### Message Widget Tracking
```javascript
this.messageElements = new Map()     // messageId → DOM element
```

**Benefit:** O(1) lookups for message updates

---

## Design Decisions

### Why Incremental Rendering?

OpenCode streams messages part-by-part via SSE.

**Approach:**
- `renderMessage()` - Add new message to DOM
- `updateOpenCodeMessage()` - Update existing message
- Avoid `displayMessages()` - Full rebuild is expensive

**Benefit:** Smooth streaming UX, no flicker
**Tradeoff:** More complex state management

---

## See Also

- [Architecture Overview](../doc/ai-workspace.md)
- [OpenCode Details](../doc/opencode.md)
- [Question Tool](../doc/opencode-question-tool.md)
- [Tool Renderers](tool-renderers/index.md)
- [LivelyAiWorkspace](lively-ai-workspace.md) - Workspace integration
- [LivelyChatMessage](lively-chat-message.md) - Message rendering
