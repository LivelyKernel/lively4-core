# AI Workspace Architecture Documentation

## Overview

The Lively4 AI workspace consists of three main components that work together to provide a unified AI-assisted development environment:

1. **lively-ai-workspace** - Unified workspace coordinator
2. **openai-realtime-chat** - WebRTC audio/text chat with OpenAI Realtime API
3. **lively-opencode** - Text-based coding agent via OpenCode.ai server

All components extend a shared base class (`lively-chat.js`) which provides common chat functionality.

## Class Hierarchy

```
Morph (lively-morph.js)
  ├─ LivelyChat (lively-chat.js)
  │    ├─ LivelyAiWorkspace (lively-ai-workspace.js)
  │    ├─ OpenaiRealtimeChat (openai-realtime-chat.js)
  │    └─ LivelyOpencode (lively-opencode.js)
  │
  └─ LivelyChatMessage (lively-chat-message.js)  [Message Renderer]
```

**Note:** `LivelyChatMessage` extends `Morph` directly (not `LivelyChat`). It's used by all chat components to render individual messages.

---

## Component Details

### 1. Morph (Base Web Component)

**File:** `src/components/widgets/lively-morph.js`

**Purpose:** Base class for all Lively4 custom elements, extends `HTMLElement`

**Key Features:**
- `get(selector)` - Query within component and shadowRoot
- `registerButtons()` - Auto-register button click handlers
- `windowTitle` / `windowIcon` - Integration with lively-window
- `registerAttribute(name)` - Create attribute getters/setters
- `livelyUpdateStrategy` - Controls hot-reloading behavior

**Methods:**
```javascript
get(selector)                    // Query helper
getSubmorph(selector)            // Deprecated alias
getAllSubmorphs(selector)        // Get all matching elements
registerButtons()                // Auto-wire button handlers
registerAttribute(name)          // Create attribute property
setWindowSize(width, height)     // Resize container window
```

---

### 2. LivelyChat (Shared Chat Base)

**File:** `src/components/tools/lively-chat.js`

**Purpose:** Shared superclass for all AI chat components

**Shared Properties:**
```javascript
messagesUI    // boolean - Show/hide message display
sessionUI     // boolean - Show/hide session management
showDebug     // boolean - Show debug annotations
```

**Event Capture & Replay:**
```javascript
_eventCapture      // Array of captured events
_replayMode        // Boolean flag for replay state
captureEvent(type, data, sessionId)
exportChatHistory()
exportChatHistoryShortened()     // Strips verbose fields
replayEventsFromClipboard()
replayEventsFromArray(events)    // Override in subclass
clearEventCapture()
```

**Replay Controls:**
```javascript
createReplayControls()           // Create UI controls
showReplayControls()             // Display controls
hideReplayControls()             // Remove controls
updateReplayProgress(current, total)
onReplayPauseButton(evt)
onReplayStopButton(evt)
onReplaySpeedChange(evt)
stopReplay()
```

**Utility Methods:**
```javascript
log(...args)                     // Debug logging to #debugLog
clearDebugLog()
setupInputHandling(inputSelector, sendHandler)
scrollToBottom(container, force, delay)
isAtBottom(container, threshold)
generateToggleIcon(state)        // Checkbox icons
dispatchMessageEvent(name, msg)  // Custom event helper
```

**Context Menu:**
```javascript
createBaseContextMenu(evt)       // Base menu items
getContextMenuItems()            // Override to add items
```

---

### 3. LivelyAiWorkspace (Coordinator)

**File:** `src/components/tools/lively-ai-workspace.js`

**Purpose:** Unified workspace that embeds and coordinates both audio and code chat

**Architecture:**
- Creates embedded `openai-realtime-chat` and `lively-opencode` components
- Manages unified workspace sessions linking both chat types
- Renders merged message timeline from both sources
- Coordinates request-response between audio and code agents
- Automatically ensures OpenCode server is running on startup

**Database Schema (Dexie):**
```javascript
workspaces: {
  id: string (UUID)
  timestamp: date
  lastActivityTime: date
  title: string (nullable)
  conversationId: string (links to realtime DB)
  opencodeSessionId: string (links to opencode session)
}
```

**Session Management:**
```javascript
workspaceId              // Current workspace ID
blackboard               // Coordination state object
displayedMessages        // Map<messageId, element>
realtimeMessageWidgets   // Map<item_id, widget>

createWorkspaceSession(title)
switchWorkspaceSession(workspaceId)
listWorkspaceSessions()
deleteWorkspaceSession(workspaceId)
```

**Message Integration:**
```javascript
// Hooks for realtime component
setupRealtimeEvents()
createRealtimeMessage(role, messageData)
updateRealtimeMessage(role, messageData)

// Hooks for opencode component
setupOpenCodeEvents()
ensureOpenCodeServer()           // Auto-start server if not running
createOpenCodeMessage(msg)
updateOpenCodeMessage(msg)
updateOpenCodeStatusMessage(msg)

// Unified rendering
renderSharedMessages()           // Merges both sources
```

**Request-Response Correlation:**
```javascript
// Track requests to coding agent
blackboard.pendingRequests       // Map<requestId, request>
blackboard.completedRequests     // Map<requestId, response>

sendMessageToOpenCode(message, requestId)
checkAndCompleteRequests()       // Called when agent idle
completeRequest(requestId, responses)
getRequestResponse(requestId)
extractMessageContent(opencodeMessage)  // Parse tool results
```

**Public API for Realtime:**
```javascript
sendMessageToOpenCode(message, requestId)
getOpenCodeStatus()
getOpenCodeHistory()             // Returns OpenCode format
createOpenCodeSession(title)
getOpenCodeSessions()
```

**Unified Replay:**
```javascript
enableReplay()                   // Disables inputs, creates artificial workspace
disableReplay()                  // Re-enables inputs
cleanupArtificialSession()       // Removes replay-* sessions
replayEventsFromArray(events)    // Dispatches to embedded components
```

**ESC Key Handling:**
```javascript
onKeyDown(evt)                   // Double-ESC detection
abortCurrentSession()            // Delegates to opencode
```

---

### 4. OpenaiRealtimeChat (Audio Chat)

**File:** `src/components/tools/openai-realtime-chat.js`

**Purpose:** WebRTC audio/text chat using OpenAI Realtime API

**Architecture:**
- WebRTC peer connection for audio streaming
- Data channel for control messages (SSE-like)
- Function calling via tools framework
- Conversation persistence in IndexedDB

**Database Schema (Dexie):**
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
  role: string ('user'|'assistant'|'tool')
  content: string
  metadata: object
  sequence: number
}
```

**WebRTC State:**
```javascript
peerConnection       // RTCPeerConnection
dataChannel          // RTCDataChannel for messages
localStream          // User's microphone
remoteAudio          // Audio element for playback
ephemeralToken       // OpenAI session token
isStreamingActive    // Connection state
```

**Conversation State:**
```javascript
currentConversationId
conversation         // Array of messages
messageSequence      // Incrementing counter
savedResponseItems   // Set<item_id> for deduplication
messageWidgets       // Map<item_id, DOM element>
accumulatedTranscripts  // Map<item_id, partial text>
```

**WebRTC Lifecycle:**
```javascript
generateEphemeralToken()
connectRealtimeWebRTC()
disconnectRealtimeWebRTC()
setupDataChannel()
sendSessionConfig()              // Send instructions/tools
sendConversationHistory()        // Restore context
reconnectWithNewVoice()
```

**Message Handling:**
```javascript
handleRealtimeMessage(message)   // Main event handler
createMessage(item_id, role, initialContent)
updateMessage(item_id, role, content)
addMessage(role, text, metadata)
renderMessage(message)
```

**Event Types:**
```javascript
// Session
'session.created'
'session.updated'

// User input
'input_audio_buffer.speech_started'
'input_audio_buffer.speech_stopped'
'conversation.item.input_audio_transcription.delta'
'conversation.item.input_audio_transcription.completed'

// Assistant response
'response.audio.delta'           // Audio chunks
'response.audio_transcript.delta'
'response.audio_transcript.done'
'response.done'

// Function calling
'response.function_call_arguments.delta'
'response.function_call_arguments.done'
```

**Function Calling:**
```javascript
toolset                          // BasicToolset or WorkspaceToolset
customInstructions               // Override system prompt
availableTools                   // Filter tool availability

getFunctionDefinitions()
callFunction(functionName, args)
handleFunctionCallFromResponse(item)
setInstructions(instructions)
setAvailableTools(toolNames)
```

**Agent Coordination:**
```javascript
// Used by workspace to track coding agent
agentStatus              // 'idle' | 'working'
lastAgentUpdate
agentEventHistory
waitingForAgentReply
pendingTask
pendingRequestId

onAgentStatusChange(eventData)   // Called by workspace
relayAgentResponse(task)         // Auto-relay coding results
injectSystemContext(text)        // Add system messages
```

**Persistence:**
```javascript
createSession()
loadConversation(conversationId)
setConversation(conversationId)  // Public API
getConversationList()
deleteConversation(conversationId)
saveMessageToDb(message)
```

**UI State:**
```javascript
isListening          // CSS class for mic indicator
isMuted              // Audio mute state
isStopped            // Pause/resume state
showDebugAnnotations // Debug metadata
showToolCalls        // Show/hide tool executions
```

---

### 5. LivelyOpencode (Coding Agent)

**File:** `src/components/tools/lively-opencode.js`

**Purpose:** Text-based AI coding agent via OpenCode.ai server

**Architecture:**
- RESTful HTTP API to local OpenCode server (port 9100)
- Server-sent events (SSE) for real-time updates
- Session-based conversation management
- Incremental message updates via events

**Server Connection:**
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

**Session State:**
```javascript
sessions             // Array of session metadata
currentSession       // Current session object
messages             // Map<sessionId, messages[]>
temporaryMessages    // Map<sessionId, temp messages[]>
messageElements      // Map<messageId, DOM element>
```

**API Endpoints:**
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

**Event Handling:**
```javascript
handleEvent(data, replaySessionId)
connectEventStream()

// Event types from server:
'message.updated'                // Message metadata
'message.part.updated'           // Part streaming
'session.updated'
'session.idle'
```

**Message Format (OpenCode):**
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

**Message Rendering:**
```javascript
loadMessagesForSession(sessionId)
displayMessages()                // Full rebuild (avoid!)
renderMessage(opencodeMsg)       // Incremental add
updateOpenCodeMessage(messageId, msg)  // Incremental update
createOpenCodeMessage(role, parts, messageId)
```

**Incremental Updates:**
```javascript
updateOpenCodeMessageFromEvent(sessionId, messageInfo)
updateOpenCodePart(sessionId, part)
loadMessageById(sessionId, messageId)  // Fallback fetch
```

**Temporary Messages:**
```javascript
// For immediate UI feedback before server confirms
addTemporaryMessage(sessionId, role, content)
clearTemporaryMessages(sessionId)
```

**ESC Key Handling:**
```javascript
isGenerating         // Track if AI responding
lastEscPress         // Double-ESC detection

onKeyDown(evt)
abortCurrentSession()  // POST /session/:id/abort
```

**Embedded Server:**
```javascript
startServer()        // Starts opencode in lively-xterm
stopServer()         // Sends Ctrl+C to terminal
updateServerButton()
```

**Health Monitoring:**
```javascript
startConnectionHealthCheck()
stopConnectionHealthCheck()
checkServerHealth()              // Poll /config every 30s
```

---

### 6. LivelyChatMessage (Message Renderer)

**File:** `src/components/tools/lively-chat-message.js`

**Purpose:** Renders individual chat messages for all chat components

**Architecture:**
- Extends `Morph` directly (not `LivelyChat`)
- Used by workspace, realtime, and opencode to display messages
- Handles two message formats: flat (realtime) and structured (OpenCode)
- Supports expand/collapse for long tool messages
- Filters internal/local function calls from display

**Properties:**
```javascript
_messageData         // Stored message object
_opencodeMessage     // OpenCode format message
_isExpanded          // Expand/collapse state
_showRaw             // Show raw JSON toggle
showDebug            // Show debug header
```

**Main APIs:**
```javascript
// Flat message format (realtime, workspace)
setMessage(messageObj)
  // messageObj: { role, content, source, streamType, sequence, timestamp, metadata }

// OpenCode message format (opencode)
setOpenCodeMessage(opencodeMessage, options)
  // opencodeMessage: { info: {...}, parts: [...] }
  // options: { source, streamType }
```

**Rendering Methods:**
```javascript
renderContent(messageObj)        // Render flat format
renderOpenCodeParts(opencodeMsg) // Render OpenCode parts
renderDebugHeader(messageObj)
renderOpenCodeDebugHeader(opencodeMessage)
formatToolMessage(messageObj)    // Format tool calls/results
```

**Part Types Handled:**

1. **Text Parts:**
   ```javascript
   { type: 'text', text: 'content', id: 'part-uuid' }
   ```

2. **Tool Use (Anthropic format):**
   ```javascript
   { type: 'tool_use', id: 'tool-uuid', name: 'read_file', input: {...} }
   ```
   - Rendered as: `### 🔧 Tool Call: read_file`
   - Shows arguments as JSON

3. **Tool Result (Anthropic format):**
   ```javascript
   { type: 'tool_result', tool_use_id: 'tool-uuid', content: '...', is_error: false }
   ```
   - Rendered as: `### ↩️ Tool Result`
   - Formats JSON or plain text

4. **Tool Streaming (OpenCode events):**
   ```javascript
   { type: 'tool', callID: 'xyz', tool: 'lively4_evaluate_code', state: {...} }
   ```
   - Shows status (pending/running/completed)
   - Special handling for `lively4_evaluate_code` - parses structured output

5. **Step Events (only in debug mode):**
   ```javascript
   { type: 'step-start' | 'step-finish', tokens: {...}, cost: '...' }
   ```

6. **Realtime Tool Messages:**
   ```javascript
   metadata: {
     type: 'function_call' | 'function_call_output',
     functionName: '...',
     call_id: '...',
     arguments: {...},
     output: {...}
   }
   ```

**Special Features:**

**1. Local Function Filtering:**
Hides internal coordination functions from display:
```javascript
isLocalFunction(functionName)
  // Returns true for: send_opencode_task, get_opencode_status, etc.
  // These are filtered out (return null) in formatToolMessage()
```

**2. Expand/Collapse for Long Content:**
```javascript
updateExpandState()              // Auto-collapse content > 100px
onMessageClick(evt)              // Toggle expand on click
```

**3. lively4_evaluate_code Parser:**
```javascript
parseLively4EvaluateOutput(output)
  // Parses structured output from MCP tool
  // Returns: { result: '...', consoleOutput: '...' }
```

**4. Positioning/Styling:**
```javascript
applyPositioning(messageObj)
  // Applies CSS classes based on role + source:
  // audio-user, audio-assistant, audio-tool
  // code-user, code-assistant, code-tool
```

**5. Raw JSON Inspector:**
```javascript
onViewRawButton()                // Toggle raw JSON display
updateRawDisplay()               // Show _opencodeMessage as JSON
onInspect()                      // Open lively.openInspector()
```

**Usage Pattern:**

```javascript
// In chat components:
const chatMessage = await lively.create('lively-chat-message');

// Flat format (realtime):
await chatMessage.setMessage({
  role: 'user',
  content: 'Hello!',
  source: 'audio',
  streamType: 'realtime',
  timestamp: Date.now()
});

// OpenCode format:
await chatMessage.setOpenCodeMessage(opencodeMsg, {
  source: 'code',
  streamType: 'opencode'
});

chatMessage.showDebug = this.showDebug;
container.appendChild(chatMessage);
```

**Supported Attributes:**
```javascript
role           // 'user' | 'assistant' | 'tool' | 'system'
source         // 'audio' | 'code'
stream-type    // 'realtime' | 'opencode'
color-mode     // Custom color scheme
has-tools      // Indicates message contains tool executions
```

**Migration:**
```javascript
livelyMigrate(other)
  // Preserves: _messageData, _isExpanded, _opencodeMessage, _showRaw
  // Handles old _rawMessage name
```

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

**Controls:**
- Pause/Resume
- Speed (1x, 2x, 5x, Instant)
- Stop
- Progress indicator

**Implementation:**
```javascript
// Capture during operation
captureEvent('realtime', data, conversationId)

// Export to clipboard
exportChatHistory()              // Full
exportChatHistoryShortened()     // Compact

// Replay from clipboard
replayEventsFromClipboard()
replayEventsFromArray(events)

// Replay state
enableReplay()                   // Disable inputs, create artificial session
disableReplay()                  // Re-enable inputs
cleanupArtificialSession()       // Remove replay-* IDs
```

**Artificial Sessions:**
- IDs prefixed with `replay-`
- Not persisted to database
- Cleaned up when switching to real session

### 3. Context Menu Pattern

All components use right-click context menu:

```javascript
// Base class provides:
createBaseContextMenu(evt)
  - Copy selection
  - Toggle debug
  - Copy chat history
  - Copy shortened
  - Replay from clipboard

// Subclasses override:
getContextMenuItems()
  // Return array of additional menu items
```

### 4. Debug Logging

Shared debug log panel:

```javascript
log(...args)                     // Append to #debugLog
clearDebugLog()
showDebug = true/false           // Control visibility
```

### 5. UI Control Attributes

Shared attributes for embedding:

```javascript
messagesUI = false               // Hide message display
sessionUI = false                // Hide session list
showDebug = true                 // Show debug info
```

**Example (workspace):**
```javascript
this.opencodeComponent.sessionUI = false;
this.opencodeComponent.messagesUI = false;
this.realtimeComponent.sessionUI = false;
this.realtimeComponent.messagesUI = false;
```

### 6. Button Registration

Auto-wiring pattern from Morph:

```javascript
// In initialize():
this.registerButtons()

// Finds buttons by ID and calls on[ButtonName]():
<button id="sendButton">     → onSendButton()
<button id="resetButton">    → onResetButton()
```

### 7. Message Stream Backup (Optional)

**Purpose:** Debug feature to store message history for replay/analysis

**Architecture:**
- Enabled by default, disable with `event-storage="disabled"` attribute
- Stores ALL messages as JSON array in workspace session record
- Debounced writes (1-2 seconds) to batch updates during streaming
- Compact format only (uses `compactEventData()` from base class)
- Not part of core architecture - purely for debugging

**Storage Model:**
```javascript
// Added to workspace IndexedDB record:
workspaces: {
  id: string
  timestamp: ISO date
  lastActivityTime: ISO date
  title: string
  conversationId: string
  opencodeSessionId: string
  messagesArray: Array<Object>  // NEW: Compacted messages (v7)
}
```

**Message Capture:**
```javascript
// Enabled by default:
<lively-ai-workspace>

// Explicitly disable:
<lively-ai-workspace event-storage="disabled">

// In component (default logic hidden in getter):
get isEventStorageEnabled() {
  return this.getAttribute('event-storage') !== 'disabled';
}

if (this.isEventStorageEnabled) {
  this._pendingMessages.push(compactEventData(message));
  this._saveMessagesDebounced(); // Write after 1-2 sec delay
}
```

**Operations:**
- **Copy Stream:** Export `messagesArray` as JSONL to clipboard
- **Replay Stream:** Load from IndexedDB, replay through workspace
- **Clear Stream:** Empty `messagesArray` for current session

**Design Rationale:**
1. **Why JSON Array?** Native JavaScript, easy manipulation, IndexedDB auto-serialization
2. **Why Debounced?** Avoid excessive writes during message streaming (dozens per second)
3. **Why Enabled by Default?** Useful for debugging, minimal overhead with compaction
4. **Why Workspace Only?** Centralized storage, already has session linking
5. **Why Compact Format?** Reduces storage (strips system prompts, large tool outputs)

**Export Format:**
```javascript
// Convert to JSONL for clipboard:
messagesArray.map(msg => JSON.stringify(msg)).join('\n')

// Compatible with existing replay system
```

**Context Menu:**
```javascript
getContextMenuItems() {
  // Enabled by default - shows operations + toggle
  if (this.isEventStorageEnabled) {
    return [
      ["Copy Message Stream", () => this.copyMessageStream()],
      ["Replay Message Stream", () => this.replayMessageStream()],
      ["Clear Message Stream", () => this.clearMessageStream()],
      [" Event Storage", () => this.setAttribute('event-storage', 'disabled'), "", "☑"]
    ];
  } else {
    // Disabled - only show toggle to re-enable
    return [
      [" Event Storage", () => this.removeAttribute('event-storage'), "", "☐"]
    ];
  }
}
```

**Limitations:**
- Only stores messages visible in unified pane (not raw events)
- Lost on session deletion (tied to workspace record)
- No cross-session queries (JSON array is opaque to IndexedDB)
- Compaction is lossy (system prompts stripped)

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

### OpenCode Event Flow

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

### Realtime WebRTC Flow

```
User clicks Start → generateEphemeralToken()
                  → createPeerConnection()
                  → getUserMedia() (microphone)
                  → createOffer()
                  → POST to /v1/realtime (SDP)
                  → setRemoteDescription()
                       ↓
Data channel opens → sendSessionConfig()
                   → sendConversationHistory()
                       ↓
User speaks → speech_started event
            → conversation.item.created
            → input_audio_transcription.delta (streaming)
            → input_audio_transcription.completed
                       ↓
AI responds → response.audio.delta (audio chunks)
            → response.audio_transcript.delta (text streaming)
            → response.audio_transcript.done
            → response.done
```

---

## Refactoring Opportunities

### 1. **Message Rendering Inconsistencies**

**Issue:** Different components have different message container names

- `lively-ai-workspace`: `#sharedMessagesPane`
- `openai-realtime-chat`: `#messagesContainer` (alias: `responses`)
- `lively-opencode`: `#messagesContainer`

**Recommendation:**
- Standardize on `#messagesContainer` across all components
- Remove `responses` alias from realtime-chat
- Update workspace to use consistent naming

### 2. **Duplicate Scroll Logic**

**Issue:** Multiple scroll-to-bottom implementations

```javascript
// Workspace has wrappers:
isSharedPaneAtBottom(threshold)
scrollSharedPaneToBottom(force)

// These just call base class:
isAtBottom(this.sharedMessagesPane, threshold)
scrollToBottom(this.sharedMessagesPane, force)
```

**Recommendation:**
- Remove wrapper methods, use base class directly
- Or make wrappers consistent across all components

### 3. **Inconsistent Method Naming**

**Issue:** Similar functionality, different names

| Component | Display All | Display One | Update One |
|-----------|-------------|-------------|------------|
| openai-realtime-chat | `renderConversation()` | `renderMessage()` | `updateMessage()` |
| lively-opencode | `displayMessages()` | `renderMessage()` | `updateOpenCodeMessage()` |
| lively-ai-workspace | `renderSharedMessages()` | N/A | N/A |

**Recommendation:**
- Standardize on: `renderMessages()`, `renderMessage()`, `updateMessage()`
- Add consistent parameters: `renderMessage(message)`, `updateMessage(messageId, message)`

### 4. **Temporary Message Duplication**

**Issue:** Only opencode has temporary message support

**Code:**
```javascript
// lively-opencode.js
this.temporaryMessages = new Map();
addTemporaryMessage(sessionId, role, content)
clearTemporaryMessages(sessionId)
```

**Recommendation:**
- Move to base class if useful for all components
- Or document why only opencode needs it (immediate feedback before server confirms)

### 5. **Debug State Update Methods**

**Issue:** Inconsistent override method names

```javascript
// Base class:
updateMessagesDebugState()       // Empty implementation

// Subclasses:
updateMessagesDebugState()       // lively-ai-workspace
updateMessagesDebugState()       // openai-realtime-chat
updateOpenCodeMessagesDebugState()  // lively-opencode (DIFFERENT NAME!)
```

**Recommendation:**
- Rename `updateOpenCodeMessagesDebugState()` → `updateMessagesDebugState()` in opencode
- Add call to parent's `updateMessagesDebugState()` in opencode's initialize

### 6. **Event Capture Deduplication**

**Issue:** Realtime chat has special deduplication for `conversation.item.created`

**Code:**
```javascript
// openai-realtime-chat.js
if (!this._capturedItemIds) {
  this._capturedItemIds = new Set();
}
if (this._capturedItemIds.has(message.item.id)) {
  this.log(`Skipping duplicate`);
} else {
  this._capturedItemIds.add(message.item.id);
  this.captureEvent('realtime', message, this.currentConversationId);
}
```

**Recommendation:**
- Move deduplication to base class if other components need it
- Or document why only realtime needs it (API sends duplicate item.created events)

### 7. **Session/Conversation Terminology**

**Issue:** Inconsistent terminology across components

- `lively-ai-workspace`: "workspace" (links conversation + session)
- `openai-realtime-chat`: "conversation"
- `lively-opencode`: "session"

**Recommendation:**
- Document the terminology differences clearly
- Consider renaming for consistency (e.g., all use "session")
- Or maintain current naming but add clear comments

### 8. **Replay Implementation Duplication**

**Issue:** Each component has similar but slightly different replay logic

**Common Pattern:**
```javascript
replayEventsFromArray(events) {
  // Filter events for this component
  // enableReplay() - disable inputs, create artificial session
  // showReplayControls()
  // Schedule events with timing
  // Handle pause/resume
  // disableReplay() when done
}
```

**Recommendation:**
- Extract common replay scheduling logic to base class
- Keep event filtering and processing in subclasses
- Provide template method pattern

### 9. **Health Check / Reconnection Logic**

**Issue:** Only opencode has health checking and auto-reconnect

**Code:**
```javascript
// lively-opencode.js
startConnectionHealthCheck()
stopConnectionHealthCheck()
checkServerHealth()              // Poll every 30s
```

**Recommendation:**
- Consider if realtime needs similar health checking
- Document why opencode needs it (local server can crash)
- vs realtime (OpenAI is always available)

### 10. **Button Handler Naming**

**Issue:** Some buttons use different naming patterns

```javascript
// Good (follows registerButtons pattern):
onSendButton()
onResetButton()
onNewSessionButton()

// Inconsistent:
onConversationsButton()          // openai-realtime-chat
onServerButton()                 // lively-opencode
onReconnectButton()              // lively-opencode
```

**Recommendation:**
- All buttons should follow `on[ButtonId]Button()` pattern
- Update HTML to match: `<button id="send">` → `onSendButton()`

### 11. **Chat Message Format Handling**

**Issue:** Two separate APIs for setting messages in lively-chat-message

**Code:**
```javascript
// lively-chat-message.js
setMessage(messageObj)           // For flat format
setOpenCodeMessage(opencodeMsg)  // For OpenCode format

// Storage:
this._messageData                // Flat format
this._opencodeMessage            // OpenCode format
```

**Recommendation:**
- Unify into single `setMessage()` with auto-detection
- Or add `format` parameter: `setMessage(msg, format='auto')`
- Reduce storage redundancy (both formats stored separately)

### 12. **Tool-Specific Parser**

**Issue:** Hardcoded parser for specific MCP tool

**Code:**
```javascript
// lively-chat-message.js
parseLively4EvaluateOutput(output)
  // Special parsing for lively4_evaluate_code only
```

**Recommendation:**
- Create extensible parser registry
- Allow tools to register custom formatters
- Move tool-specific logic out of message component

### 13. **Local Function List**

**Issue:** Hardcoded list of internal functions to hide

**Code:**
```javascript
// lively-chat-message.js
isLocalFunction(functionName) {
  const localFunctions = [
    'send_opencode_task',
    'get_opencode_status',
    // ... hardcoded list
  ];
  return localFunctions.includes(functionName);
}
```

**Recommendation:**
- Make configurable via options
- Pass from parent component
- Or use naming convention (e.g., prefix `_internal_`)

### 14. **Complex formatToolMessage Method**

**Issue:** Long method handling many tool message types

**Code:**
```javascript
// lively-chat-message.js (lines 463-571)
formatToolMessage(messageObj) {
  // 100+ lines handling:
  // - tool_use, tool_result, tool_live
  // - function_call, function_call_output
  // Different formats, different metadata structures
}
```

**Recommendation:**
- Break into smaller methods per type
- Create format strategy pattern
- Extract to separate formatter classes

### 15. **Positioning Logic**

**Issue:** CSS class application based on role + source combinations

**Code:**
```javascript
// lively-chat-message.js
applyPositioning(messageObj) {
  // Remove all: position-left, position-mid-left, etc.
  // Then add: audio-user, audio-assistant, code-tool, etc.
  // 8 different combinations
}
```

**Recommendation:**
- Document CSS class naming convention
- Consider data attributes instead: `data-role="user" data-source="audio"`
- Let CSS handle combinations: `[data-role="user"][data-source="audio"]`

---

## Potential Unused Code

### 1. **Deprecated Aliases**

```javascript
// openai-realtime-chat.js
get responses() {
  return this.messagesContainer;  // Backward compatibility alias
}
```

**Status:** Marked as backward compatibility
**Recommendation:** Check if workspace still uses `responses`, if not remove

### 2. **Deprecated getSubmorph**

```javascript
// lively-morph.js
getSubmorph(selector) {  // #Deprecated, please use either "get" or "querySelector" directly
  // ... implementation
}
```

**Status:** Marked deprecated but still used by `get()`
**Recommendation:** Keep for now as internal implementation

### 3. **Commented Out Code**

```javascript
// lively-ai-workspace.js (lines 793-804)
// #TODO renable it only after making sure it does not run forever
// setInterval(() => {
//   if (this.opencodeComponent) {
//     const isConnected = this.opencodeComponent.connected;
//     if (!isConnected) {
//       this.updateOpenCodeStatus('Disconnected', false);
//     }
//   }
// }, 5000);
```

**Status:** Disabled polling for connection status
**Recommendation:** Remove or fix the issue and re-enable

### 4. **Old Event Handling**

```javascript
// openai-realtime-chat.js (lines 1300-1307)
case "response.audio.delta":
  // Audio chunk received - log structure to see timing info
  // this.log("FULL response.audio.delta:", JSON.stringify({
  //   ... lots of commented logging
  // }, null, 2));
  break;
```

**Status:** Commented debug logging
**Recommendation:** Remove commented code

### 5. **Duplicate updateOpenCodeMessage Methods**

```javascript
// lively-ai-workspace.js
async updateOpenCodeMessage(msg) {
  // ... lines 392-409
}

async updateOpenCodeMessage(msg) {
  // ... lines 455-472 (DUPLICATE!)
}
```

**Status:** DUPLICATE METHOD DEFINITION!
**Recommendation:** **Remove one of these** - JavaScript keeps the last one

---

## Architecture Improvements

### 1. **Extract Message Widget Management**

Currently each component manages `messageWidgets` / `messageElements` maps independently.

**Recommendation:**
- Create shared `MessageWidgetManager` class
- Handles: create, update, track, cleanup
- Reduces duplication

### 2. **Standardize Event Dispatching**

Different components dispatch different event patterns:

```javascript
// Workspace:
this.dispatchMessageEvent('opencode:message-added', {...})

// OpenCode:
this.dispatchEvent(new CustomEvent('opencode:status-change', {...}))

// Realtime:
this.dispatchMessageEvent('realtime:create-live-user-message', {...})
```

**Recommendation:**
- Document event naming convention
- Create helper methods for common events
- Consider event catalog documentation

### 3. **Unify Session Persistence**

Three different approaches:
- Workspace: Dexie with workspaces table
- Realtime: Dexie with conversations + messages tables
- OpenCode: Server-side persistence only

**Recommendation:**
- Document why each has different persistence
- Consider unified workspace DB that references others
- Add migration path if old data exists

### 4. **Extract Blackboard Pattern**

Workspace uses a "blackboard" for coordination:

```javascript
this.blackboard = {
  currentTask: null,
  agentStatus: 'idle',
  coordination: {},
  lastUpdate: Date.now(),
  pendingRequests: new Map(),
  completedRequests: new Map()
}
```

**Recommendation:**
- Create `WorkspaceBlackboard` class
- Move coordination logic to this class
- Make it reusable for other multi-agent scenarios

### 5. **Toolset Architecture**

Two toolsets:
- `BasicToolset` - For standalone realtime chat
- `WorkspaceToolset` - For workspace-integrated realtime

**Recommendation:**
- Document toolset interface
- Create base `Toolset` class
- Allow dynamic tool registration

---

## TODO Tasks from Code Comments

### High Priority

1. **Fix displayMessages overuse** (lively-opencode.js:20)
   ```javascript
   // AVOID using: displayMessages, use it only on reload etc. #TODO
   ```
   - Use incremental rendering instead
   - Only call on session switch

2. **Remove duplicate updateOpenCodeMessage** (lively-ai-workspace.js:392, 455)
   - Keep one implementation
   - Test after removal

3. **Rename updateOpenCodeMessagesDebugState** (lively-opencode.js:35)
   - Should be `updateMessagesDebugState()` to match base class

4. **Re-enable connection polling or remove** (lively-ai-workspace.js:793)
   ```javascript
   // #TODO renable it only after making sure it does not run forever
   ```

### Medium Priority

5. **Add MCP tools for special URLs** (CLAUDE.md)
   ```javascript
   // #TODO Add MCP tools for special URL schemes (open://, edit://, browse://)
   ```

6. **Replace with connections** (lively-morph.js:40, 59)
   - Use event-based window title updates instead of direct access

7. **Feature: Owner and sibling lookup** (lively-morph.js:12)
   ```javascript
   // #FeatureIdea -- could it also be used to look for owners and siblings
   ```

### Low Priority

8. **Custom elements inheritance** (lively-morph.js:6)
   ```javascript
   // #TODO all custom elements have to inherit from HTMLElement
   ```
   - Currently already inheriting, comment may be outdated

9. **Extract OpenCode message content** (lively-ai-workspace.js:810-847)
   - Method is complex, could be simplified
   - Consider moving to utility class

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
  metadata: {
    type: 'function_call',
    functionName: 'sendMessageToOpenCode',
    call_id: 'call_xyz',
    arguments: {...},
    output: {...}
  }
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
    {
      type: 'text',
      text: 'content',
      id: 'part-uuid'
    },
    {
      type: 'tool_use',
      id: 'tool-uuid',
      name: 'read_file',
      input: {...}
    },
    {
      type: 'tool_result',
      tool_use_id: 'tool-uuid',
      content: 'result text'
    }
  ]
}
```

### Unified Format (Workspace)

Workspace doesn't transform, it preserves both formats and tags with source:

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
**OpenCode:** Structured format from Anthropic/OpenCode

**Recommendation:**
- Keep both formats (they come from external APIs)
- Document the differences clearly
- `lively-chat-message` handles both formats

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

---

## Performance Considerations

### 1. Message Widget Tracking

All components use Map for O(1) lookups:

```javascript
this.messageElements = new Map()     // messageId → DOM element
this.messageWidgets = new Map()      // item_id → widget
this.realtimeMessageWidgets = new Map()  // item_id → widget
```

### 2. Event Capture Memory

Unbounded growth in `_eventCapture` array:

```javascript
this._eventCapture.push({...})       // No size limit!
```

**Recommendation:**
- Add max size limit (e.g., 1000 events)
- Or clear on session switch
- Workspace keeps last 50 completed requests (good pattern)

### 3. Duplicate Prevention

Realtime uses Set for deduplication:

```javascript
this.savedResponseItems = new Set()  // O(1) lookup
if (this.savedResponseItems.has(item_id)) {
  return; // Skip duplicate
}
```

**Cleanup:** Every 100 items, keep only last 100 (good!)

### 4. Debounced Rendering

Workspace debounces shared message rendering:

```javascript
this.debouncedRenderSharedMessages = (() => this.renderSharedMessages()).debounce(100)
```

**Good practice:** Prevents excessive re-renders during streaming

---

## Testing Recommendations

### Unit Tests

1. **Message Format Conversion**
   - Test flat → display
   - Test OpenCode → display
   - Test edge cases (missing fields)

2. **Event Capture/Replay**
   - Capture events during operation
   - Export to JSONL
   - Reimport and replay
   - Verify UI state matches

3. **Incremental Rendering**
   - Create message
   - Update message (text delta)
   - Update message (tool execution)
   - Verify DOM updates correctly

### Integration Tests

1. **Workspace Coordination**
   - Send audio message
   - Trigger code agent via function call
   - Verify message appears in unified pane
   - Verify response relayed back to audio

2. **Session Management**
   - Create workspace
   - Switch workspace
   - Delete workspace
   - Verify both DBs updated correctly

3. **Double-ESC Abort**
   - Start generation
   - Press ESC twice
   - Verify generation stops
   - Verify UI updates

### Replay Tests

1. **Record and replay session**
   - Perform multi-turn conversation
   - Export history
   - Create new session
   - Replay history
   - Verify same UI state

2. **Speed controls**
   - Test 1x, 2x, 5x, instant speeds
   - Test pause/resume
   - Test stop mid-replay

---

## Documentation Gaps

### 1. Event Flow Diagrams

Need sequence diagrams for:
- Workspace coordination flow
- OpenCode SSE event handling
- Realtime WebRTC lifecycle
- Function call orchestration

### 2. Database Schemas

- Add ER diagram showing relationships
- Document migration strategy
- Explain why multiple DBs

### 3. Tool System

- Document `Toolset` interface
- Show how to add new tools
- Explain workspace vs basic toolset

### 4. Message Widget Lifecycle

- When widgets are created
- When they're updated
- When they're cleaned up
- Memory management

### 5. Session Lifecycle

Document complete lifecycle:
- Create → Use → Switch → Delete
- Artificial sessions (replay)
- Cleanup on component removal

---

## Summary

### Strengths

1. ✅ **Clean inheritance hierarchy** - Morph → LivelyChat → Components
2. ✅ **Shared base functionality** - Event capture, replay, context menus, logging
3. ✅ **Incremental rendering** - Smooth streaming UX in opencode
4. ✅ **Embedding architecture** - Components work standalone or in workspace
5. ✅ **Database persistence** - Conversations and sessions survive reload
6. ✅ **Event-driven coordination** - CustomEvents for loose coupling
7. ✅ **Deduplication logic** - Prevents duplicate messages
8. ✅ **Replay system** - Great for debugging and testing
9. ✅ **Unified message renderer** - Single component handles all message formats
10. ✅ **Smart tool formatting** - Hides internal functions, special parsing for tools

### Areas for Improvement

1. ⚠️ **Naming inconsistencies** - Different method names for similar operations
2. ⚠️ **Duplicate code** - Scroll wrappers, message rendering patterns
3. ⚠️ **Commented code** - Remove or fix and re-enable
4. ⚠️ **Duplicate method** - `updateOpenCodeMessage` defined twice in workspace
5. ⚠️ **Unbounded growth** - `_eventCapture` array needs size limit
6. ⚠️ **Documentation** - Missing sequence diagrams and interface docs
7. ⚠️ **Message format complexity** - Two formats increase cognitive load
8. ⚠️ **Terminology variance** - workspace/conversation/session confusion
9. ⚠️ **Dual message APIs** - setMessage() vs setOpenCodeMessage() redundancy
10. ⚠️ **Hardcoded tool logic** - parseLively4EvaluateOutput() and isLocalFunction()
11. ⚠️ **Long formatter method** - formatToolMessage() needs decomposition

### Recommended Refactoring Priority

**Phase 1 - Critical Bugs:**
1. Remove duplicate `updateOpenCodeMessage` in workspace
2. Fix or remove commented polling code
3. Rename `updateOpenCodeMessagesDebugState` → `updateMessagesDebugState`

**Phase 2 - Standardization:**
4. Standardize container names (`#messagesContainer`)
5. Standardize method names (`renderMessages`, `renderMessage`, `updateMessage`)
6. Standardize button handler names (`on[ButtonId]Button`)
7. Remove or document backward compatibility aliases

**Phase 3 - Cleanup:**
8. Remove commented debug code
9. Add size limit to `_eventCapture`
10. Document or remove deprecated methods

**Phase 4 - Architecture:**
11. Extract `MessageWidgetManager` class
12. Extract `WorkspaceBlackboard` class
13. Create `Toolset` base class
14. Add sequence diagrams
15. Unify terminology in documentation

**Phase 5 - Message Component:**
16. Unify setMessage() APIs or add auto-detection
17. Make tool parsers extensible (registry pattern)
18. Make isLocalFunction() configurable
19. Decompose formatToolMessage() into smaller methods
20. Consider data attributes for positioning instead of CSS classes

---

## Files Changed Summary

### Core Components
- `src/components/tools/lively-ai-workspace.js` (1670 lines)
- `src/components/tools/openai-realtime-chat.js` (1908 lines)
- `src/components/tools/lively-opencode.js` (1447 lines)
- `src/components/tools/lively-chat-message.js` (689 lines)

### Base Classes
- `src/components/tools/lively-chat.js` (525 lines)
- `src/components/widgets/lively-morph.js` (155 lines)

### Total LOC: ~6,394 lines

---

*End of architecture documentation*
