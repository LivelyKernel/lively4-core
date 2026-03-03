# OpenaiRealtimeChat (Audio Chat)

<lively-import src="../_navigation.html"></lively-import>

**File:** `openai-realtime-chat.js`

**Purpose:** WebRTC audio/text chat using OpenAI Realtime API

**Extends:** [LivelyChat](lively-chat.md)

---

## Architecture

- WebRTC peer connection for audio streaming
- Data channel for control messages (SSE-like)
- Function calling via tools framework
- Conversation persistence in IndexedDB

---

## Database Schema (Dexie)

**Database:** `openai-realtime-conversations`

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

---

## WebRTC State

### Properties
```javascript
peerConnection       // RTCPeerConnection
dataChannel          // RTCDataChannel for messages
localStream          // User's microphone
remoteAudio          // Audio element for playback
ephemeralToken       // OpenAI session token
isStreamingActive    // Connection state
```

### Lifecycle Methods
```javascript
generateEphemeralToken()
  // Get ephemeral token from OpenAI API
  
connectRealtimeWebRTC()
  // Establish WebRTC connection
  
disconnectRealtimeWebRTC()
  // Close connection and cleanup
  
setupDataChannel()
  // Configure data channel event handlers
  
sendSessionConfig()
  // Send instructions/tools to OpenAI
  
sendConversationHistory()
  // Restore context on reconnect
  
reconnectWithNewVoice()
  // Change voice and reconnect
```

---

## Conversation State

### Properties
```javascript
currentConversationId
conversation                 // Array of messages
messageSequence              // Incrementing counter
savedResponseItems           // Set<item_id> for deduplication
messageWidgets               // Map<item_id, DOM element>
accumulatedTranscripts       // Map<item_id, partial text>
```

### Message Handling
```javascript
handleRealtimeMessage(message)
  // Main event handler for WebRTC messages
  
createMessage(item_id, role, initialContent)
  // Create new message widget
  
updateMessage(item_id, role, content)
  // Update existing message content
  
addMessage(role, text, metadata)
  // Add message to conversation array
  
renderMessage(message)
  // Render message to UI
```

---

## Event Types

### Session Events
```javascript
'session.created'
'session.updated'
```

### User Input Events
```javascript
'input_audio_buffer.speech_started'
'input_audio_buffer.speech_stopped'
'conversation.item.input_audio_transcription.delta'
'conversation.item.input_audio_transcription.completed'
```

### Assistant Response Events
```javascript
'response.audio.delta'           // Audio chunks
'response.audio_transcript.delta'
'response.audio_transcript.done'
'response.done'
```

### Function Calling Events
```javascript
'response.function_call_arguments.delta'
'response.function_call_arguments.done'
```

---

## Function Calling

### Properties
```javascript
toolset                      // BasicToolset or WorkspaceToolset
customInstructions           // Override system prompt
availableTools               // Filter tool availability
```

### Methods
```javascript
getFunctionDefinitions()
  // Get tool definitions from toolset
  
callFunction(functionName, args)
  // Execute tool function
  
handleFunctionCallFromResponse(item)
  // Process function call from OpenAI
  
setInstructions(instructions)
  // Update system prompt
  
setAvailableTools(toolNames)
  // Filter which tools are available
```

### Toolsets

See [Realtime Chat Tools](realtime-chat-tools/index.md) for details:
- **BasicToolset** - For standalone realtime chat
  - `evaluate_code` - Execute JavaScript in Lively4
- **WorkspaceToolset** - For workspace-integrated realtime
  - Includes BasicToolset tools
  - `send_opencode_task` - Send tasks to coding agent

---

## Agent Coordination

**Used by workspace to track coding agent:**

### Properties
```javascript
agentStatus              // 'idle' | 'working'
lastAgentUpdate
agentEventHistory
waitingForAgentReply
pendingTask
pendingRequestId
```

### Methods
```javascript
onAgentStatusChange(eventData)
  // Called by workspace with agent status updates
  
relayAgentResponse(task)
  // Auto-relay coding results back to OpenAI
  
injectSystemContext(text)
  // Add system messages to conversation
```

---

## Persistence

### Methods
```javascript
createSession()
  // Create new conversation in database
  
loadConversation(conversationId)
  // Load conversation from database
  
setConversation(conversationId)
  // Public API to switch conversation
  
getConversationList()
  // List all conversations
  
deleteConversation(conversationId)
  // Delete conversation and messages
  
saveMessageToDb(message)
  // Persist message to database
```

---

## UI State

### Properties
```javascript
isListening          // CSS class for mic indicator
isMuted              // Audio mute state
isStopped            // Pause/resume state
showDebugAnnotations // Debug metadata
showToolCalls        // Show/hide tool executions
```

---

## Performance

### Deduplication
```javascript
this.savedResponseItems = new Set()  // O(1) lookup
if (this.savedResponseItems.has(item_id)) {
  return; // Skip duplicate
}
```

**Cleanup:** Every 100 items, keep only last 100

### Message Widget Tracking
```javascript
this.messageWidgets = new Map()      // item_id → widget
```

**Benefit:** O(1) lookups for message updates

---

## WebRTC Flow

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

## Message Format

**Flat format from OpenAI API:**
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

---

## See Also

- [Architecture Overview](../doc/ai-workspace.md)
- [Realtime Chat Tools](realtime-chat-tools/index.md)
- [Duplicate Messages](../doc/openai-realtime-duplicate-messages.md)
- [LivelyAiWorkspace](lively-ai-workspace.md) - Workspace integration
- [LivelyChatMessage](lively-chat-message.md) - Message rendering
