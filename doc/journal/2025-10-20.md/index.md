# 2025-10-20 OpenAI Realtime Chat Component #webrtc #openai #realtime-api #function-calling

*Author: @JensLincke [with @BlindGoldie]*

Documentation of the OpenAI Realtime Chat component, a pure WebRTC-based real-time audio chat interface that integrates OpenAI's Realtime API with function calling capabilities, conversation persistence, and multi-modal interaction (voice and text).

- **Components**: [openai-realtime-chat.js](edit://src/components/tools/openai-realtime-chat.js), [openai-realtime-chat.html](edit://src/components/tools/openai-realtime-chat.html)
- **Tools Module**: [openai-realtime-chat-tools.js](edit://src/components/tools/openai-realtime-chat-tools.js)
- **Feature**: Real-time bidirectional audio streaming with WebRTC
- **Feature**: Function calling with 4 built-in tools
- **Feature**: Persistent conversation storage with Dexie database
- **UI**: Multi-conversation management, voice/model selection, context menu controls

## Component Overview

The `openai-realtime-chat` component provides a complete interface for real-time conversations with OpenAI's GPT models using the [Realtime API](https://platform.openai.com/docs/guides/realtime). It supports both voice and text input, maintains conversation history across sessions, and enables the AI to call functions to interact with the Lively4 environment.

**OpenAI API Documentation:**
- [Realtime API Guide](https://platform.openai.com/docs/guides/realtime)
- [API Reference](https://platform.openai.com/docs/api-reference/realtime)

**Key Capabilities:**
- Real-time audio conversations with automatic speech detection
- Text-based chat without requiring audio connection
- Function calling for system interaction
- Persistent multi-conversation storage
- Live transcript streaming during audio responses
- Flexible voice and model configuration

## Architecture

**WebRTC Connection Flow:**
1. `generateEphemeralToken()` - Creates 60-second ephemeral token via `POST /v1/realtime/sessions`
2. `connectRealtimeWebRTC()` - Establishes RTCPeerConnection with OpenAI
3. SDP offer/answer exchange via `POST /v1/realtime` using ephemeral token authentication
4. Data channel creation for control messages (`oai-events`)
5. Microphone audio track added to peer connection
6. Remote audio track received and played through Audio element

**Database Persistence:**
- Dexie database: `openai-realtime-conversations`
- Tables: `conversations` (id, timestamp, lastMessageTime), `messages` (id, conversationId, timestamp, type, role, content, metadata, sequence)
- Methods: `saveMessageToDb()`, `loadConversation()`, `createSession()`, `deleteConversation()`
- Stores user, assistant, AND tool messages for complete conversation replay

**Message Flow:**
- User speaks → WebRTC audio stream → Server VAD detects speech
- Server transcribes → `conversation.item.input_audio_transcription.completed` event
- AI responds → `response.audio_transcript.delta` events stream transcript
- Live UI updates via `createLiveAssistantMessage()` and `updateLiveAssistantMessage()`
- Final transcript saved to database via `addMessage()` and `saveMessageToDb()`

## Core Methods

**Connection Lifecycle:**
- `connectRealtimeWebRTC()` - Establishes WebRTC connection with ephemeral token, sets up peer connection, audio tracks, and data channel
- `disconnectRealtimeWebRTC()` - Cleans up peer connection, data channel, and audio streams
- `setupDataChannel()` - Configures data channel event handlers for open, message, error, close
- `sendSessionConfig()` - Sends session configuration with instructions, voice, VAD settings, and tool definitions
- `sendConversationHistory()` - Replays conversation history to API on reconnect, including tool messages

**Message Handling:**
- `handleRealtimeMessage(message)` - Main event dispatcher for all Realtime API events (session, audio, transcripts, function calls)
- `addMessage(role, text)` - Adds message to conversation array, renders to UI, persists to database
- `addToolMessage(text, metadata)` - Specialized message handler for function call events with metadata
- `renderMessage(message)` - Creates lively-markdown element with debug header showing sequence, role, type, timestamp

**Live Updates:**
- `createLiveUserMessage()` / `updateLiveUserMessage(text)` - Progressive transcript updates during user speech
- `createLiveAssistantMessage()` / `updateLiveAssistantMessage(text)` - Progressive transcript updates during AI response
- Messages stream in real-time via delta events, finalized on done events

**Function Calling:**
- `getFunctionDefinitions()` - Returns tool definitions from tools module
- `handleFunctionCallFromResponse(item)` - Processes function calls from `response.done` events
- `callFunction(functionName, args)` - Executes tool via tools module `executeTool()`
- Results sent back to API via `conversation.item.create` with `function_call_output` type

**Conversation Management:**
- `ensureConversation()` - Loads most recent conversation on startup or creates new one
- `createSession()` - Generates UUID, creates DB entry, disconnects current session
- `loadConversation(conversationId)` - Loads messages from DB, updates UI, disconnects to allow reconnect
- `getConversationList()` - Returns all conversations sorted by last message time with message counts
- `toggleConversationsModal()` / `renderConversationsList()` - UI for browsing and switching conversations

## Function Calling Integration

**Tools Module** (`openai-realtime-chat-tools.js`):
Independent tool definitions with OpenAI-compatible schemas and simple async handlers.

**Available Tools:**
1. **get_current_time** - Returns current time in specified timezone (UTC, NY, London, Tokyo, LA)
2. **open_component** - Opens Lively4 components via `lively.openComponentInWindow()`
3. **evaluate_code** - Executes JavaScript code in Lively4 environment using eval
4. **create_notification** - Displays notifications via lively.notify/success/error/warn

**Tool Architecture:**
- Each tool has `definition` (OpenAI function schema) and `execute(args)` handler
- Returns `{success, result/error, message}` objects
- Independent from MCP protocol - designed specifically for OpenAI chat needs
- Registered with session via `session.update` message containing tools array

**Function Call Flow:**
1. AI decides to call function → included in `response.done` event output array
2. `handleFunctionCallFromResponse()` extracts name, call_id, arguments
3. Tool message added to chat: `🔧 Calling **functionName**(args...)`
4. `callFunction()` executes tool via tools module
5. Result message added: `↩️ Result: {result preview}`
6. Result sent to API via data channel as `function_call_output`
7. `requestAssistantResponse()` triggers AI to continue with result

## Session Configuration

**Realtime API Settings:**
```javascript
{
  instructions: "You are a helpful AI assistant in a JavaScript, HTML, CSS Web-based development environment...",
  voice: "marin" (default), // 10 voices available
  input_audio_transcription: { model: "whisper-1" },
  turn_detection: {
    type: "server_vad",
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500
  },
  tools: [...function definitions],
  tool_choice: "auto"
}
```

**Model Selection:**
- `gpt-realtime` (default) or `gpt-realtime-mini`
- Set via dropdown, persisted in preferences
- Requires reconnection to apply changes

**Voice Selection:**
- 10 voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse, cedar, marin
- Set via dropdown, persisted in preferences
- `reconnectWithNewVoice()` preserves conversation history

## Automatic Speech Detection

**Server-Side Voice Activity Detection (VAD):**
The component uses OpenAI's server-side VAD for automatic speech detection - **no local processing required**. The microphone audio is streamed continuously via WebRTC, and OpenAI's server analyzes the stream to detect when the user starts and stops speaking.

**VAD Configuration** (configured in `sendSessionConfig()` at openai-realtime-chat.js:890-912):
```javascript
turn_detection: {
  type: "server_vad",           // Server-side Voice Activity Detection
  threshold: 0.5,                // Sensitivity (0-1, higher = less sensitive)
  prefix_padding_ms: 300,        // Include 300ms before speech starts
  silence_duration_ms: 500       // 500ms of silence = speech ended
}
```

**How It Works:**

1. **Continuous Audio Streaming**: Microphone audio streams continuously to OpenAI via WebRTC audio track
2. **Server Analysis**: OpenAI's server monitors the audio stream and detects speech vs silence
3. **Speech Start**: When audio exceeds threshold, server sends `input_audio_buffer.speech_started` event
4. **Speech End**: After 500ms of silence below threshold, server sends `input_audio_buffer.speech_stopped` event
5. **Transcription**: Server transcribes the captured audio and sends `conversation.item.input_audio_transcription.completed`

**Event Flow in Code** (from `handleRealtimeMessage()` at openai-realtime-chat.js:1028-1207):
```javascript
case "input_audio_buffer.speech_started":
  this.isListening = true;
  lively.success("Listening...");
  await this.createLiveUserMessage();  // Shows "_Listening..._" placeholder
  break;

case "input_audio_buffer.speech_stopped":
  this.isListening = false;
  // Transcription is still processing
  break;

case "conversation.item.input_audio_transcription.completed":
  // Replace placeholder with final transcript
  await this.updateLiveUserMessage(message.transcript);
  // Save to conversation and database
  this.conversation.push(userMessage);
  await this.saveMessageToDb(userMessage);
  break;
```

**Parameter Effects:**

- **threshold (0.5)**: Controls sensitivity to sound vs silence
  - Lower = picks up quieter speech but may trigger on background noise
  - Higher = requires louder speech but ignores noise better
  - Current setting: moderate sensitivity

- **prefix_padding_ms (300)**: Captures 300ms of audio *before* speech detection triggers
  - Prevents cutting off the start of words
  - Improves transcription accuracy by including the full first word

- **silence_duration_ms (500)**: How long to wait after speaking stops before ending turn
  - 500ms = half-second pause triggers end of turn
  - Shorter = more responsive but may cut off mid-sentence pauses
  - Longer = allows natural pauses but slower response time

**Advantages of Server-Side VAD:**
- No local speech detection logic needed
- No amplitude analysis or silence detection code
- Consistent behavior across devices and browsers
- Optimized for OpenAI's transcription models
- Handles variable microphone sensitivities automatically

**UI Feedback:**
- `.listening` CSS class applied during speech (`isListening` state)
- "Listening..." notification shown when speech starts
- Live message placeholder shows "_Listening..._" during speech
- Placeholder updates to actual transcript when transcription completes

## UI Features

**Controls:**
- Stop/Resume button - Toggles audio streaming without disconnecting (mutes tracks, cancels responses)
- New button - Creates new conversation and disconnects session
- Conversations button - Opens modal with conversation list
- Voice dropdown - Selects AI voice
- Model dropdown - Selects realtime model
- Text input - Send text messages without audio (Enter to send, Shift+Enter for newline)

**Context Menu:**
- Copy - Copy selected text or content
- New Conversation - Create fresh conversation
- Export Conversation - Copy text-only history to clipboard
- Copy as JSONL - Export full conversation with metadata as JSONL format
- Show Debug Annotations - Toggle sequence/timestamp/metadata headers
- Show Tool Calls - Toggle visibility of tool call messages

**Visual States:**
- `.listening` class - Active during user speech (isListening state)
- `.stopped` class - When audio is paused (isStopped state)
- `.muted` class - When microphone is muted (isMuted state)
- `show-debug-annotations` attribute - Reveals debug headers
- `show-tool-calls` attribute - Shows/hides tool messages

**Message Rendering:**
- User messages: Gray background, right-aligned, italic, quoted
- Assistant messages: Blue background, left-aligned
- Tool messages: Teal background with left border, monospace metadata
- Debug headers: Small gray text showing sequence number, role, type, timestamp

## Event Handlers

**Key Realtime API Events:**
- `session.created` / `session.updated` - Confirms session and tool registration
- `input_audio_buffer.speech_started` - Sets listening state, creates live user message placeholder
- `input_audio_buffer.speech_stopped` - Clears listening state
- `conversation.item.input_audio_transcription.completed` - Final user transcript, saves to DB
- `response.audio_transcript.delta` - Streams AI response transcript character-by-character
- `response.audio_transcript.done` - Final AI transcript, saves to DB
- `response.done` - Response complete, processes function calls
- `response.function_call_arguments.delta` / `.done` - Function arguments streaming
- `error` - Handles API errors with user notification

## Preferences

**Persisted Settings:**
- `openai-realtime-chat-voice` - Selected voice name
- `openai-realtime-chat-model` - Selected model
- `openai-realtime-chat-show-tool-calls` - Tool visibility toggle (default: true)

## Technical Details

**Cleanup and Migration:**
- `disconnectedCallback()` - Calls `cleanupStreaming()` when component removed
- `livelyMigrate(other)` - Preserves conversation, voice, and model settings during live updates
- `livelyPrepareSave()` - Serializes conversation to attribute for persistence

**Sequence Tracking:**
- `messageSequence` counter ensures ordered message replay
- Persisted with each message in DB
- Restored from max sequence when loading conversations

**Data Channel Protocol:**
- `sendDataChannelMessage(payload, options)` - Sends JSON over data channel with open state validation
- `isDataChannelOpen()` - Checks channel readyState === 'open'
- `requestAssistantResponse()` - Sends `response.create` event
- `cancelAssistantResponse()` - Sends `response.cancel` event to interrupt

## Implementation Notes

**Authentication:**
- Ephemeral tokens solve browser WebSocket header limitations
- Tokens expire after 60 seconds, require reconnection for extended sessions
- No API key exposed in client-side code

**Audio Handling:**
- Microphone via `navigator.mediaDevices.getUserMedia({audio: true})`
- Remote audio via `new Audio()` with `srcObject = event.streams[0]`
- Track enable/disable for stop/resume without full reconnection

**Conversation Continuity:**
- Full conversation history (user, assistant, tool messages) sent on reconnect
- Function calls and outputs replayed to maintain context
- Reconnection preserves conversation array in memory

**Text Chat Without Audio:**
- `chatFromInput()` connects in paused mode if not connected
- Immediately calls `stopConversation()` to disable audio tracks
- Sends `conversation.item.create` with `input_text` content type
- Allows pure text interaction with Realtime API

## Future Considerations

- Visual waveform display during audio streaming
- Recording and playback of audio conversations
- Export conversations with audio attachments
- Additional tools for file operations, web search, etc.
- Multi-session support (parallel conversations)
- Custom system instructions per conversation
