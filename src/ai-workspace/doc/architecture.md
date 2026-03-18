# AI Workspace Architecture

Comprehensive architecture documentation for the Lively4 AI Workspace system.

**Last Updated:** 2025-02-26

---

## Table of Contents

1. [Overview](#overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Core Components](#core-components)
4. [Supporting Components](#supporting-components)
5. [Tool Rendering System](#tool-rendering-system)
6. [Data Flow](#data-flow)
7. [Key Architectural Patterns](#key-architectural-patterns)
8. [Database Schema](#database-schema)
9. [Integration Points](#integration-points)

---

## Overview

The AI Workspace is a **multi-agent coordination system** that integrates:

- **OpenAI Realtime Chat** - Voice/text interface using WebRTC
- **Lively OpenCode** - Claude Code terminal-based coding agent
- **Agent Board** - Visual display of TODOs, tools, and file operations

```
┌─────────────────────────────────────────────────────────────┐
│                    lively-ai-workspace                      │
│                   (Coordinator/Blackboard)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐     │
│  │ openai-realtime-chat │      │  lively-opencode     │     │
│  │ Voice/Audio Agent    │◄────►│  Coding Agent        │     │
│  │eventSource:'realtime'│      │eventSource:'opencode'│     │
│  └──────────────────────┘      └──────────────────────┘     │
│            │                            │                   │
│            └────────────┬───────────────┘                   │
│                         ▼                                   │
│              ┌──────────────────────┐                       │
│              │  Shared Message Pane │                       │
│              │  Unified Timeline    │                       │
│              └──────────────────────┘                       │
│                         │                                   │
│                         ▼                                   │
│              ┌───────────────────────┐                      │
│              │  lively-agent-board   │                      │
│              │  TODOs | Tools | Files│                      │
│              └───────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles:**

1. **Event-Driven Architecture** - All components communicate via CustomEvents
2. **Composition over Inheritance** - Workspace embeds child components
3. **Object-Oriented Design** - Shared base class (`LivelyChat`) provides common functionality
4. **Event Sourcing** - All events captured for replay/debugging
5. **Incremental Rendering** - Messages update in-place, not full re-renders

---

## Component Hierarchy

### Inheritance Tree

```
Morph (Base Web Component)
├── LivelyChat (Base Chat Component)
│   ├── LivelyAiWorkspace (Coordinator)
│   ├── OpenaiRealtimeChat (Voice/Audio Agent)
│   └── LivelyOpencode (Coding Agent)
├── LivelyChatMessage (Message Renderer)
├── LivelyChatSessions (Session Management UI)
└── LivelyAgentBoard (Agent Information Display)
```

### Class Methods Overview

#### LivelyChat (Base Class)
*extends Morph*

Core functionality shared by all AI chat components:

**Initialization & Configuration:**
- `initialize()` - Component setup
- `canWriteToDatabase()` - Database write guard
- `setupInputHandling()` - Input event wiring

**Event Capture & Replay:**
- `enableReplay()` / `disableReplay()` - Enter/exit replay mode
- `saveStateBeforeReplay()` / `restoreStateAfterReplay()` - State preservation
- `captureEvent()` / `addCapturedEvent()` - Record events
- `getCapturedEvents()` - Retrieve event history
- `dispatchMessageEvent()` - Emit custom events

**Export & Import:**
- `exportChatHistory()` - Full JSONL export
- `exportChatHistoryShortened()` - Compact export
- `exportChatStatistics()` / `exportChatStatisticsTree()` - Statistics
- `replayEventsFromClipboard()` - Import and replay
- `compactEvents()` / `compactEventData()` - Reduce storage size

**Replay Controls:**
- `loadEventsForReplay()` - Load event stream
- `createReplayControls()` / `showReplayControls()` / `hideReplayControls()`
- `updateReplayProgress()` - Progress indicator
- `onReplayPauseButton()` / `onReplayStopButton()` / `onReplaySpeedChange()`
- `stopReplay()` - Abort replay
- `openReplayUI()` - Open standalone replay window

**Replay Navigation:**
- `onReplayCommand()` - Handle replay commands
- `stepForwardOneEvent()` - Manual stepping
- `resumeAutoReplay()` / `pauseReplay()` - Auto replay controls
- `rewindReplay()` - Go back to start
- `seekToEvent()` - Jump to specific event
- `scheduleEventFromIndex()` - Schedule next event
- `calculateDelay()` - Timing calculation

**UI State:**
- `updateMessagesDebugState()` - Toggle debug mode
- `scrollToBottom()` / `isAtBottom()` - Scroll utilities
- `log()` / `clearDebugLog()` - Debug logging
- `onClearLogButton()` - Clear debug log

**Context Menu:**
- `createBaseContextMenu()` - Base menu items
- `getContextMenuItems()` - Override to add custom items

**Lifecycle:**
- `cleanupSession()` - Session cleanup
- `livelyMigrate()` - Live update handling

---

#### LivelyAiWorkspace (Coordinator)
*extends LivelyChat*

Coordinates multiple AI agents in a unified workspace:

**Session Management:**
- `initializeWorkspaceHistory()` - Setup database
- `createWorkspaceSession()` - Create linked session
- `switchWorkspaceSession()` - Switch sessions atomically
- `listWorkspaceSessions()` - List all workspaces
- `deleteWorkspaceSession()` - Delete workspace

**Component Initialization:**
- `initialize()` - Setup workspace
- `initializeComponents()` - Create child components
- `linkComponentsToWorkspace()` - Wire up event handlers
- `setupRealtimeEvents()` / `setupOpenCodeEvents()` - Event subscriptions

**OpenCode Integration:**
- `createOpenCodeMessage()` - Add OpenCode message
- `updateOpenCodeMessage()` - Update existing message
- `updateOpenCodeStatusMessage()` - Status updates
- `sendMessageToOpenCode()` - Send task to coding agent
- `getOpenCodeStatus()` - Query agent status
- `getOpenCodeHistory()` - Get conversation history
- `getOpenCodeSessions()` - List agent sessions
- `ensureOpenCodeServer()` - Auto-start server

**Realtime Integration:**
- `createRealtimeMessage()` - Add realtime message
- `updateRealtimeMessage()` - Update realtime message
- `createRealtimeToolMessage()` - Add tool execution message
- `getMessageCount()` / `getFirstUserAudioMessage()` - Message queries

**Unified Message Rendering:**
- `renderAllMessages()` - Rebuild message timeline
- `updateLiveSharedMessage()` - Update existing message
- `scrollSharedPaneToBottom()` / `isSharedPaneAtBottom()` - Scroll utilities

**Request-Response Tracking:**
- `checkAndCompleteRequests()` - Check task completion
- `completeRequest()` - Mark request complete
- `getRequestResponse()` - Retrieve response
- `setRequestAudioWaiting()` - Mark audio waiting
- `extractMessageContent()` - Parse OpenCode output

**Agent Board Integration:**
- `updateWorkspaceBoardFromMessage()` - Update board from messages
- `updateWorkspaceBoardTodos()` - Update TODO display

**Session UI:**
- `setupSessionsComponent()` - Setup session selector
- `renderSessionsList()` - Render session list
- `updateSessionUI()` - Update UI state
- `onSessionSelected()` / `onSessionDeleted()` / `onSessionsBulkDeleted()`
- `onNewSessionButton()` - Create new session
- `loadSelectedSessions()` - Load selected sessions
- `generateSessionTitle()` - Auto-generate titles

**Replay System:**
- `showReplayControls()` - Show replay UI
- `enableReplay()` / `disableReplay()` - Control replay mode
- `saveStateBeforeReplay()` / `restoreStateAfterReplay()` - State management
- `cleanupSession()` - Cleanup artificial sessions
- `getCapturedEvents()` - Get event history
- `saveMessagesToStorage()` / `loadMessageStream()` / `copyMessageStream()` - Message stream operations
- `loadEventsForReplay()` / `replayMessageStream()` / `replayMessageEvent()` - Replay operations

**UI Controls:**
- `onDebugLogTab()` / `onBoardTab()` - Tab switching
- `switchPanelTab()` - Switch panel
- `onClearLogButton()` - Clear debug log
- `onKeyDown()` - Keyboard shortcuts (double-ESC abort)
- `abortCurrentSession()` - Abort current operation

**Utilities:**
- `getWorkspace()` - Get workspace instance
- `updateMessagesDebugState()` - Debug mode toggle
- `getContextMenuItems()` - Context menu
- `livelyMigrate()` - Live update handling

---

#### OpenaiRealtimeChat (Voice/Audio Agent)
*extends LivelyChat*

WebRTC-based real-time voice interaction with OpenAI:

**Initialization & Setup:**
- `initialize()` - Setup component
- `setupUI()` - Build interface
- `setupModelSelecton()` - Model selector
- `setupVoiceSelection()` - Voice selector
- `setupSessionsComponent()` - Session UI

**Connection Management:**
- `generateEphemeralToken()` - Get OpenAI token
- `connectRealtimeWebRTC()` - Establish WebRTC connection
- `disconnectRealtimeWebRTC()` - Close connection
- `setupDataChannel()` - Setup data channel
- `sendSessionConfig()` - Send configuration
- `sendConversationHistory()` - Restore context
- `reconnectWithNewVoice()` - Change voice
- `disconnectedCallback()` - Cleanup

**Message Management:**
- `getMessages()` - Get message list
- `createRealtimeMessage()` - Unified message creation (streaming + non-streaming)
- `updateMessage()` - Update existing message
- `renderMessage()` - Render single message
- `renderConversation()` - Render all messages
- `chatFromInput()` - Send user message

**Session/Conversation:**
- `getConversation()` - Get current conversation
- `ensureConversation()` - Ensure conversation exists
- `setConversation()` - Switch conversation
- `createSession()` - Create new session
- `loadConversation()` - Load conversation from DB
- `getConversationList()` - List conversations
- `deleteConversation()` - Delete conversation
- `saveMessageToDb()` - Persist message

**Session UI Events:**
- `renderConversationsList()` - Render session list
- `onSessionSelected()` / `onSessionDeleted()` / `onSessionsBulkDeleted()`
- `onNewConversationButton()` - Create new conversation
- `loadSelectedSessions()` - Load sessions

**Realtime Event Handling:**
- `handleRealtimeMessage()` - Process incoming events
- `sendDataChannelMessage()` - Send control message
- `requestAssistantResponse()` - Trigger AI response
- `cancelAssistantResponse()` - Cancel response
- `isDataChannelOpen()` - Check connection state

**Function Calling / Tools:**
- `getFunctionDefinitions()` - Get tool definitions
- `setInstructions()` - Set system prompt
- `setAvailableTools()` - Filter tools
- `callFunction()` - Execute tool
- `handleFunctionCallFromResponse()` - Process function calls

**Agent Coordination:**
- `onAgentStatusChange()` - Handle agent status updates
- `relayAgentResponse()` - Relay coding agent response
- `injectSystemContext()` - Inject system messages

**UI Controls:**
- `onStopButton()` - Stop/resume
- `onResetButton()` - Reset conversation
- `toggleStop()` - Toggle pause state
- `stopConversation()` / `resumeConversation()` - Control playback
- `cleanupStreaming()` - Cleanup streaming state

**Replay:**
- `replayMessageEvent()` - Replay single event
- `enableReplay()` / `disableReplay()` - Replay mode
- `cleanupArtificialSession()` - Cleanup replay session

**State Management:**
- `updateStatus()` - Update status display
- `scrollResponsesSoon()` - Scroll to bottom
- `updateMessagesDebugState()` - Debug mode
- `createDebugHeader()` - Debug info

**Lifecycle:**
- `getContextMenuItems()` - Context menu
- `livelyMigrate()` - Live update
- `cleanupSession()` - Session cleanup
- `livelyPrepareSave()` - Pre-save hook

---

#### LivelyOpencode (Coding Agent)
*extends LivelyChat*

Terminal-based AI coding agent via Claude Code server:

**Initialization & Connection:**
- `initialize()` - Setup component
- `connectedCallback()` / `disconnectedCallback()` - Lifecycle
- `connectToServer()` - Connect to Claude Code server
- `disconnectFromServer()` - Disconnect
- `connectEventStream()` - Setup SSE connection
- `onReconnectButton()` - Manual reconnect

**Event Handling:**
- `handleEvent()` - Process SSE events
- `replayMessageEvent()` - Replay event
- `handlePermissionRequest()` - Handle permission requests
- `showPermissionUI()` - Show permission dialog
- `submitPermissionResponse()` - Submit permission response

**Session Management:**
- `loadSessions()` - Load session list
- `selectSession()` - Switch session
- `createSession()` - Create new session
- `deleteSession()` - Delete session
- `onNewSessionButton()` - New session button
- `onSessionDeleted()` / `onSessionsBulkDeleted()` - Session deletion events
- `markSessionBusy()` / `markSessionIdle()` - Session state
- `refreshSessionTitle()` - Update title
- `inferStatusFromEvent()` - Infer status from events

**Message Management:**
- `loadMessagesForSession()` - Load messages
- `getMessages()` - Get message list
- `displayMessages()` - Full rebuild (avoid!)
- `renderMessage()` - Render single message
- `updateOpenCodeMessage()` - Update existing message
- `createOpenCodeMessage()` - Create message widget
- `updateOpenCodeMessageFromEvent()` - Update from SSE event
- `updateOpenCodePart()` - Update message part
- `loadMessageById()` - Fetch single message
- `loadSelectedSessions()` - Load sessions

**Temporary Messages:**
- `addTemporaryMessage()` - Add temp message
- `clearTemporaryMessages()` - Clear temp messages

**Project Context:**
- `setupProjectSelector()` - Setup project selector
- `loadProjectUrlBase()` / `saveProjectUrlBase()` - Project URL persistence
- `onClearProjectButton()` - Clear project
- `selectProject()` - Select project
- `clearProject()` - Clear project
- `refreshProjectComboboxOptions()` - Update project list
- `updateProjectSelector()` - Update UI
- `applyProjectForSession()` - Apply project to session
- `updateProjectIndicator()` - Update indicator
- `getRecentProjectsForWorkingDir()` - Get recent projects
- `saveRecentProject()` - Save project
- `loadSessionProjectsFromStorage()` - Load projects
- `setSessionProject()` - Set session project
- `buildProjectUrl()` - Build project URL
- `tryFetchProjectFile()` - Fetch project file
- `buildProjectContextMessage()` - Build context message

**Working Directory:**
- `filterSessionsByWorkingDirectory()` - Filter sessions
- `setupWorkdirSelector()` - Setup directory selector
- `getRecentWorkingDirectories()` - Get recent directories
- `saveRecentWorkingDirectory()` - Save directory
- `changeWorkingDirectory()` - Change directory

**Agent Board Integration:**
- `fetchTodosForSession()` - Fetch TODOs
- `updateBoard()` - Update agent board
- `updateBoardWithFileOperations()` - Update file operations
- `updateBoardWithAllMessages()` - Update from all messages

**Session UI:**
- `setupSessionsComponent()` - Setup session list
- `updateSessionList()` - Update list
- `sortSessionsWithSubagents()` - Sort sessions
- `loadAllSessionMetadata()` - Load metadata
- `cacheSessionMetadata()` - Cache metadata
- `incrementCachedMessageCount()` - Update count

**Cost Tracking:**
- `computeAccumulatedTokens()` - Compute tokens
- `computeCostFromAccumulatedTokens()` - Compute cost
- `getTotalSessionCost()` - Get total cost
- `updateSessionCostDisplay()` - Update cost display
- `loadAllSessionsMetadata()` - Load all metadata
- `updateAllSessionCosts()` - Update all costs

**Subagent Sessions:**
- `scanMessagesForSubagentSessions()` - Scan for subagents
- `recordSubagentSession()` - Record subagent

**Server Control:**
- `onServerButton()` - Toggle server
- `startServer()` - Start Claude Code server
- `stopServer()` - Stop server
- `checkIfServerRunning()` - Check server status
- `updateServerButton()` - Update button state

**Health Monitoring:**
- `startConnectionHealthCheck()` - Start monitoring
- `stopConnectionHealthCheck()` - Stop monitoring
- `checkServerHealth()` - Check health

**UI Controls:**
- `onDebugLogTab()` / `onBoardTab()` - Tab switching
- `switchPanelTab()` - Switch panel
- `onClearLogButton()` - Clear log
- `onSendButton()` - Send message
- `onVariantButton()` - Toggle variant
- `updateVariantButton()` - Update button
- `onKeyDown()` - Keyboard shortcuts
- `abortCurrentSession()` - Abort current operation

**Replay:**
- `enableReplay()` / `disableReplay()` - Replay mode
- `cleanupArtificialSession()` - Cleanup replay session

**State & Statistics:**
- `updateStatus()` - Update status
- `static getEventTypeStats()` - Get event stats
- `static clearEventTypeStats()` - Clear stats
- `static printEventTypeStats()` - Print stats

**Utilities:**
- `escapeHtml()` - HTML escaping
- `truncateMsgId()` - Truncate IDs
- `updateMessagesDebugState()` - Debug mode

**Lifecycle:**
- `getContextMenuItems()` - Context menu
- `livelyPreMigrate()` / `livelyMigrate()` - Live updates
- `cleanupSession()` - Session cleanup
- `livelyExample()` - Example content

---

#### LivelyChatMessage (Message Renderer)
*extends Morph*

Renders individual chat messages with tool call visualization:

**Message Setting:**
- `initialize()` - Setup component
- `setMessage()` - Set flat format message
- `setOpenCodeMessage()` - Set OpenCode format message

**Rendering:**
- `renderContent()` - Render flat format
- `renderOpenCodeParts()` - Render OpenCode parts
- `renderDebugHeader()` / `renderOpenCodeDebugHeader()` - Debug headers
- `renderUsageStats()` - Usage statistics
- `createMarkdownElement()` - Markdown rendering

**Tool Rendering:**
- `dispatchToolRender()` - Dispatch to tool renderer
- `formatToolMessage()` - Format tool calls/results
- `isLocalFunction()` - Check if local function

**UI Controls:**
- `onInspect()` - Inspect message
- `onViewRawButton()` - Toggle raw JSON
- `updateRawDisplay()` - Show raw data
- `onMessageClick()` - Expand/collapse
- `updateExpandState()` - Update expansion

**Utilities:**
- `applyPositioning()` - Apply CSS classes
- `formatTimestamp()` - Format time
- `escapeHtml()` - HTML escaping
- `getMessageData()` - Get message data

**Lifecycle:**
- `livelyExample()` - Example content
- `livelyMigrate()` - Live updates

---

#### LivelyChatSessions (Session Management UI)
*extends Morph*

Multi-select session management component:

**Initialization:**
- `initialize()` - Setup component
- `setupEventListeners()` - Wire up events

**Rendering:**
- `render()` - Render session list
- `renderSessionItem()` - Render single session
- `formatSessionTitle()` - Format title
- `formatSessionMeta()` - Format metadata
- `formatDate()` - Format dates
- `escapeHtml()` - HTML escaping

**UI Updates:**
- `updateNewButtonVisibility()` - Toggle new button
- `updateHeaderTitle()` - Update header
- `updateSelectionCount()` - Update selection count
- `updateActiveState()` - Update active state
- `updateSelectionState()` - Update selection state

**Session Operations:**
- `addSession()` - Add session
- `removeSession()` - Remove single session
- `removeSessions()` - Remove multiple sessions
- `updateSession()` - Update session
- `getSession()` - Get session data

**Selection Management:**
- `onSessionsListClick()` - Handle clicks
- `toggleSelection()` - Toggle selection
- `selectRange()` - Range selection
- `selectSession()` - Select single session
- `selectAllSessions()` - Select all
- `invertSelection()` - Invert selection
- `clearSelection()` - Clear selection
- `selectEmptySessions()` - Select empty sessions

**Actions:**
- `deleteSingleSession()` - Delete one session
- `deleteSelectedSessions()` - Delete selected
- `loadSelectedSessions()` - Load selected
- `onContextMenu()` - Context menu
- `onNewSessionButton()` - New session

**Lifecycle:**
- `livelyMigrate()` - Live updates

---

#### LivelyAgentBoard (Agent Information Display)
*extends Morph*

Visual display of agent activity (TODOs, tools, files):

**Initialization:**
- `initialize()` - Setup component
- `livelyExample()` - Example content

**Context Management:**
- `setProjectFocus()` - Set project focus
- `setContext()` - Set context

**File Tracking:**
- `addFileRead()` - Add file read
- `addFileWritten()` - Add file written
- `clearFileLinks()` - Clear file links
- `buildFileUrl()` - Build file URL
- `shortenPath()` - Shorten file path

**Tool Tracking:**
- `addToolUsage()` - Add tool usage
- `getTotalToolUsages()` - Get total usages
- `clearToolUsages()` - Clear tool usages

**TODO Management:**
- `updateTodos()` - Update TODO list

**Message Processing:**
- `updateFromMessage()` - Update from message
- `updateFromOpenCode()` - Update from OpenCode message

**Project Focus:**
- `updateProjectFocus()` - Update project focus

**Rendering:**
- `render()` - Render board
- `renderStatsSection()` - Render statistics
- `renderLinksSection()` - Render file links
- `renderTodosSection()` - Render TODOs

**Utilities:**
- `clearAll()` - Clear all data

---

## Core Components

### 1. LivelyChat (Base Class)

**Purpose:** Shared functionality for all AI chat components

**Key Features:**
- Event capture system for replay/debugging
- Replay controls (pause, speed, step-through)
- Export/import JSONL format
- Context menu integration
- Debug logging panel

**Properties:**
```javascript
messagesUI: boolean     // Show/hide message display
sessionUI: boolean      // Show/hide session management
showDebug: boolean      // Show debug annotations
_eventCapture: Array    // Captured events
_replayMode: boolean    // Replay state
```

**Event Capture Format:**
```javascript
{
  type: string,           // Event type
  data: object,          // Event data
  sessionId: string,     // Session ID
  timestamp: number,     // Unix timestamp
  eventSource: string    // 'realtime' | 'opencode'
}
```

---

### 2. LivelyAiWorkspace (Coordinator)

**Purpose:** Unified workspace that coordinates voice and coding agents

**Architecture Pattern:** Composition (embeds child components)

**Key Responsibilities:**
1. **Session Management** - Links realtime conversations with OpenCode sessions
2. **Message Coordination** - Merges message timelines from both agents
3. **Request-Response Tracking** - Tracks coding tasks initiated by voice agent
4. **Event Sourcing** - Captures all events for replay

**Database Schema:**
```javascript
workspaces: {
  id: string (UUID)
  timestamp: date
  lastActivityTime: date
  title: string
  conversationId: string      // Links to realtime DB
  opencodeSessionId: string   // Links to opencode session
  messagesArray: Array        // Optional: message backup
}
```

**Blackboard State:**
```javascript
{
  currentTask: string,
  agentStatus: 'idle' | 'working',
  coordination: object,
  lastUpdate: timestamp,
  pendingRequests: Map,       // requestId → request
  completedRequests: Map      // requestId → response
}
```

**Message Flow:**
1. User speaks → `openai-realtime-chat` captures
2. Event: `realtime:create-live-user-message`
3. Workspace calls `createRealtimeMessage()`
4. Message added to unified timeline

**Function Call Flow:**
1. Voice agent calls `send_opencode_task(message)`
2. Workspace calls `sendMessageToOpenCode(message, requestId)`
3. OpenCode processes and emits SSE events
4. Events trigger `updateOpenCodeMessage()`
5. On completion, `checkAndCompleteRequests()` marks task done
6. Voice agent can query `getRequestResponse(requestId)`

---

### 3. OpenaiRealtimeChat (Voice Agent)

**Purpose:** WebRTC audio/text chat using OpenAI Realtime API

**Architecture:**
- WebRTC peer connection for audio streaming
- Data channel for control messages (SSE-like)
- Function calling via tools framework
- Conversation persistence in IndexedDB

**Database Schema:**
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

**WebRTC Lifecycle:**
1. `generateEphemeralToken()` - Get session token from OpenAI
2. `connectRealtimeWebRTC()` - Create RTCPeerConnection
3. `getUserMedia()` - Get microphone access
4. `createOffer()` / `setLocalDescription()`
5. POST to OpenAI `/v1/realtime` with SDP
6. `setRemoteDescription()` with OpenAI's SDP
7. Data channel opens
8. `sendSessionConfig()` - Send instructions/tools
9. `sendConversationHistory()` - Restore context

**Message Event Types:**
- `session.created` / `session.updated`
- `input_audio_buffer.speech_started` / `speech_stopped`
- `conversation.item.input_audio_transcription.delta` / `completed`
- `response.audio.delta` / `response.audio_transcript.delta`
- `response.function_call_arguments.delta` / `done`
- `response.done`

**Function Calling:**
- `BasicToolset` - Standalone tools
- `WorkspaceToolset` - Tools that coordinate with coding agent

**Agent Coordination:**
```javascript
agentStatus: 'idle' | 'working'
waitingForAgentReply: boolean
pendingTask: object
pendingRequestId: string

onAgentStatusChange(eventData)  // Called by workspace
relayAgentResponse(task)        // Auto-relay results
```

---

### 4. LivelyOpencode (Coding Agent)

**Purpose:** Terminal-based AI coding agent via Claude Code server

**Architecture:**
- RESTful HTTP API to local server (port 9100)
- Server-sent events (SSE) for real-time updates
- Session-based conversation management
- Incremental message updates

**Server Endpoints:**
```javascript
GET  /config                    // Server config
GET  /session                   // List sessions
POST /session                   // Create session
GET  /session/:id/message       // Get messages
POST /session/:id/message       // Send message
GET  /session/:id/message/:id   // Get single message
POST /session/:id/abort         // Abort generation
GET  /event                     // SSE stream
```

**SSE Event Types:**
- `message.updated` - Message metadata updated
- `message.part.updated` - Message part streaming
- `session.updated` - Session state changed
- `session.idle` - Agent idle

**Message Format:**
```javascript
{
  info: {
    id: string,
    role: 'user' | 'assistant',
    time: { created: ISO string },
    sessionID: string
  },
  parts: [
    { type: 'text', text: string, id: string },
    { type: 'tool_use', id: string, name: string, input: {...} },
    { type: 'tool_result', tool_use_id: string, content: string }
  ]
}
```

**Incremental Rendering:**
```javascript
// GOOD: Incremental update
updateOpenCodeMessage(messageId, updatedMessage)

// AVOID: Full rebuild
displayMessages()  // Only use on session switch!
```

**Project Context:**
- Project URL base stored per session
- Auto-fetches `CLAUDE.md` for context
- Recent projects tracked per working directory

**Working Directory:**
- Sessions filtered by working directory
- Recent directories tracked
- Selector UI for quick switching

---

## Supporting Components

### LivelyChatMessage

**Purpose:** Renders individual chat messages with rich formatting

**Message Formats:**

1. **Flat Format (Realtime):**
```javascript
{
  role: 'user' | 'assistant' | 'tool',
  content: string,
  source: 'audio' | 'code',
  streamType: 'realtime' | 'opencode',
  timestamp: number,
  metadata: object
}
```

2. **OpenCode Format:**
```javascript
{
  info: { id, role, time, sessionID },
  parts: [...]
}
```

**Part Types:**
- `text` - Plain text content
- `tool_use` - Tool call (Anthropic format)
- `tool_result` - Tool result (Anthropic format)
- `tool` - Tool streaming (OpenCode format)
- `step-start` / `step-finish` - Step events (debug only)

**Tool Rendering:**
- Delegates to specialized tool renderers
- Hides internal/local functions
- Expand/collapse for long content
- Syntax highlighting for code

**Local Function Filtering:**
```javascript
isLocalFunction(name) {
  const localFunctions = [
    'send_opencode_task',
    'get_opencode_status',
    'create_opencode_session',
    // ... coordinator functions
  ];
  return localFunctions.includes(name);
}
```

---

### LivelyChatSessions

**Purpose:** Multi-select session management UI

**Features:**
- Multi-select with Shift-click range selection
- Active session highlighting
- Empty session detection
- Bulk delete operations
- Context menu for operations

**Selection Operations:**
- Select All / Invert Selection / Clear Selection
- Select Empty Sessions
- Range selection (Shift-click)

**Events Emitted:**
- `session-selected` - Session selected
- `session-deleted` - Single session deleted
- `sessions-bulk-deleted` - Multiple sessions deleted

---

### LivelyAgentBoard

**Purpose:** Visual display of agent activity

**Sections:**

1. **TODOs** - Grouped by status (pending, in_progress, completed, cancelled)
   - Priority-based color coding
   - Status icons

2. **Tool Usage** - Statistics on tool calls
   - Tool name and count
   - Sorted by usage

3. **File Operations** - Files read/written
   - Clickable links to files
   - Path shortening for readability

4. **Project Focus** - Current project context
   - Project URL
   - Project description

**Data Sources:**
- Updated from OpenCode messages
- Parses tool calls and results
- Tracks file operations across session

---

## Tool Rendering System

The tool rendering system provides specialized visualization for different MCP tool types.

### Architecture

```
OpenCodeBaseTool (Base Renderer)
├── OpenCodeGenericTool (Fallback)
├── OpenCodeReadTool (File reading)
├── OpenCodeWriteTool (File writing)
├── OpenCodeEditTool (File editing)
├── OpenCodeMultiEditTool (Multi-file editing)
├── OpenCodeApplyPatchTool (Patch application)
├── OpenCodeBashTool (Shell commands)
├── OpenCodeSearchTool (Base for search tools)
│   ├── OpenCodeGrepTool (Content search)
│   ├── OpenCodeGlobTool (File pattern matching)
│   └── OpenCodeLsTool (Directory listing)
├── OpenCodeCodeSearchTool (Code search)
├── OpenCodeTaskTool (Subagent tasks)
├── OpenCodeQuestionTool (Interactive questions)
├── OpenCodePlanTool (Planning mode)
├── OpenCodeTodoReadTool (TODO reading)
├── OpenCodeTodoWriteTool (TODO writing)
├── OpenCodeRunTestsTool (Test execution)
├── OpenCodeInspectTestsTool (Test inspection)
├── OpenCodeEvaluateCodeTool (Code evaluation)
├── OpenCodeLspTool (Language server)
├── OpenCodeWebFetchTool (Web fetching)
├── OpenCodeWebSearchTool (Web search)
├── OpenCodeSkillTool (Skill loading)
├── OpenCodeBatchTool (Batch operations)
└── OpenCodeInvalidTool (Invalid tools)
```

### Base Tool Renderer (OpenCodeBaseTool)

**Core Methods:**
```javascript
matches(toolName)              // Check if tool matches
renderCompact(part)            // Compact view
renderCompactStreaming(part)   // Streaming compact view
renderToolUse(part)            // Tool call details
renderToolResult(part)         // Tool result details
renderToolStreaming(part)      // Streaming updates
createMarkdownEl(text)         // Markdown rendering
makeCodeBlock(code, lang)      // Code block rendering
buildDetails(summary, body)    // Details element
```

### Tool Renderer Examples

#### Read Tool
```javascript
class OpenCodeReadTool extends OpenCodeBaseTool {
  matches(toolName) {
    return toolName === 'mcp_read';
  }
  
  renderCompact(part) {
    const filePath = part.input?.filePath;
    const offset = part.input?.offset || 1;
    const limit = part.input?.limit || 2000;
    
    return `📖 Read ${filePath} (lines ${offset}-${offset + limit})`;
  }
  
  renderCompactStreaming(part) {
    // Syntax highlighted code display
    // Shows file path and line numbers
    // Expandable details
  }
}
```

#### Edit Tool
```javascript
class OpenCodeEditTool extends OpenCodeBaseTool {
  matches(toolName) {
    return toolName === 'mcp_edit';
  }
  
  generateInlineDiffEl(oldString, newString) {
    // Inline diff visualization
    // Red for removed, green for added
    // Line-by-line comparison
  }
  
  renderCompact(part) {
    return `✏️ Edit ${filePath}`;
  }
}
```

#### Question Tool
```javascript
class OpenCodeQuestionTool extends OpenCodeBaseTool {
  matches(toolName) {
    return toolName === 'mcp_question';
  }
  
  renderInteractiveQuestion(part) {
    // Renders interactive question form
    // Radio buttons for choices
    // Submit/Reject buttons
    // Sends response back to agent
  }
}
```

### Tool Renderer Registration

Tool renderers are automatically discovered and registered:

```javascript
// In lively-chat-message.js
dispatchToolRender(part) {
  const renderers = [
    OpenCodeReadTool,
    OpenCodeWriteTool,
    OpenCodeEditTool,
    // ... all renderers
  ];
  
  for (const Renderer of renderers) {
    const renderer = new Renderer();
    if (renderer.matches(part.name || part.tool)) {
      return renderer.renderCompact(part);
    }
  }
  
  // Fallback to generic renderer
  return new OpenCodeGenericTool().renderCompact(part);
}
```

### Tool Rendering Modes

1. **Compact View** - Summary line
   - Icon + brief description
   - File paths, tool names
   - Clickable to expand

2. **Streaming View** - Live updates
   - Shows partial results
   - Updates as data arrives
   - Progress indicators

3. **Full Details View** - Complete information
   - Input parameters
   - Full output
   - Error messages
   - Syntax highlighting

---

## Data Flow

### Message Flow in Workspace

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interaction                        │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                  openai-realtime-chat                       │
│  • User speaks                                              │
│  • Speech → text transcription                              │
│  • Event: realtime:create-live-user-message                 │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                   lively-ai-workspace                       │
│  • createRealtimeMessage(messageData)                       │
│  • Add to shared messages pane                              │
│  • Capture event for replay                                 │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                  OpenAI Processes Request                   │
│  • Response streaming begins                                │
│  • Event: realtime:update-live-assistant-message            │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                   lively-ai-workspace                       │
│  • updateRealtimeMessage(messageData)                       │
│  • Update existing message widget                           │
└─────────────────────────────────────────────────────────────┘
     │
     │ (Function call detected)
     ▼
┌─────────────────────────────────────────────────────────────┐
│                openai-realtime-chat                         │
│  • callFunction('send_opencode_task', {message})            │
│  • workspace.sendMessageToOpenCode(message, requestId)      │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                     lively-opencode                         │
│  • POST /session/:id/message                                │
│  • SSE events start flowing                                 │
│  • Event: opencode:message-added                            │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                   lively-ai-workspace                       │
│  • createOpenCodeMessage(message)                           │
│  • Add to shared messages pane                              │
│  • Track in pendingRequests Map                             │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                  OpenCode Processes                         │
│  • Tool execution (read, edit, bash, etc.)                  │
│  • SSE: message.part.updated (streaming)                    │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                   lively-ai-workspace                       │
│  • updateOpenCodeMessage(messageId, updatedMessage)         │
│  • Update message widget in place                           │
│  • Tool renderers visualize tool execution                  │
└─────────────────────────────────────────────────────────────┘
     │
     │ (Agent becomes idle)
     ▼
┌─────────────────────────────────────────────────────────────┐
│                   lively-ai-workspace                       │
│  • Event: session.idle                                      │
│  • checkAndCompleteRequests()                               │
│  • completeRequest(requestId, responses)                    │
│  • Move to completedRequests Map                            │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                openai-realtime-chat                         │
│  • Can query: workspace.getRequestResponse(requestId)       │
│  • relayAgentResponse() - Auto-relay to user                │
└─────────────────────────────────────────────────────────────┘
```

### Event Capture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Occurs                             │
│  • User message, AI response, tool call, etc.               │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│               Component captureEvent()                      │
│  • captureEvent(type, data, sessionId)                      │
│  • Add eventSource tag ('realtime' | 'opencode')            │
│  • Push to _eventCapture array                              │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Optional: Storage                          │
│  • Workspace: saveMessagesToStorage() (debounced)           │
│  • Store in workspace.messagesArray                         │
└─────────────────────────────────────────────────────────────┘
     │
     │ (User requests export)
     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Export to JSONL                          │
│  • getCapturedEvents() - Merge child arrays                 │
│  • compactEventData() - Strip verbose fields                │
│  • Convert to JSONL (one JSON per line)                     │
│  • Copy to clipboard                                        │
└─────────────────────────────────────────────────────────────┘
     │
     │ (Later: User pastes from clipboard)
     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Replay from Clipboard                       │
│  • replayEventsFromClipboard()                              │
│  • Parse JSONL                                              │
│  • enableReplay() - Create artificial session               │
│  • Open Replay UI window                                    │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Replay Events                            │
│  • Step-by-step or auto-replay                              │
│  • replayMessageEvent(event)                                │
│  • Dispatch to child components based on eventSource        │
│  • UI updates as if events happening live                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Patterns

### 1. Composition over Inheritance

**Problem:** Multiple agents need to work together

**Solution:** Workspace embeds child components rather than inheriting

**Benefits:**
- Components work standalone or embedded
- Reuse existing components without modification
- Clear separation of concerns
- Easy to test independently

**Implementation:**
```javascript
// In lively-ai-workspace.js
initializeComponents() {
  this.opencodeComponent = document.createElement('lively-opencode');
  this.opencodeComponent.sessionUI = false;  // Hide individual session UI
  this.opencodeComponent.messagesUI = false; // Hide individual messages
  
  this.realtimeComponent = document.createElement('openai-realtime-chat');
  this.realtimeComponent.sessionUI = false;
  this.realtimeComponent.messagesUI = false;
  
  // Link to workspace
  this.linkComponentsToWorkspace();
}
```

---

### 2. Event-Driven Communication

**Pattern:** Components communicate via CustomEvents

**Benefits:**
- Loose coupling
- Easy to add new listeners
- Testable event flow
- Clear event contracts

**Event Naming Convention:**
```
[component]:[action]-[entity]

Examples:
- realtime:create-live-user-message
- realtime:update-live-assistant-message
- opencode:message-added
- opencode:message-updated
- opencode:status-change
```

**Implementation:**
```javascript
// Emit event
this.dispatchMessageEvent('realtime:create-live-user-message', {
  role: 'user',
  content: 'Hello',
  timestamp: Date.now()
});

// Listen for event
lively.addEventListener(
  'realtime-events',
  this.realtimeComponent,
  'realtime:create-live-user-message',
  evt => this.createRealtimeMessage(evt.detail)
);
```

---

### 3. Incremental Rendering

**Problem:** Full re-renders cause flicker during streaming

**Solution:** Update individual message widgets in place

**Pattern:**
```javascript
// GOOD: Incremental update
const existingWidget = this.displayedMessages.get(messageId);
if (existingWidget) {
  await existingWidget.setOpenCodeMessage(updatedMessage);
} else {
  const newWidget = await lively.create('lively-chat-message');
  await newWidget.setOpenCodeMessage(message);
  this.messagesContainer.appendChild(newWidget);
  this.displayedMessages.set(messageId, newWidget);
}

// AVOID: Full rebuild
displayMessages() {
  this.messagesContainer.innerHTML = '';  // Clears everything!
  for (const message of this.messages) {
    // Re-render everything from scratch
  }
}
```

**When to use full rebuild:**
- Session switch
- Major state change
- Replay stop

**When to use incremental:**
- Message streaming
- Part updates
- Tool execution updates

---

### 4. Event Sourcing & Replay

**Pattern:** Capture all events for debugging and testing

**Event Structure:**
```javascript
{
  type: 'message.updated',
  data: { ... },
  sessionId: 'session-uuid',
  timestamp: 1234567890,
  eventSource: 'opencode'  // Tagged at capture time
}
```

**Replay Modes:**

1. **Manual Stepping** - Step forward one event at a time
2. **Auto Replay** - Replay with timing control (1x, 2x, 5x, instant)
3. **Mixed Mode** - Pause auto replay, step manually, resume

**Replay UI:**
- Standalone window (`lively-chat-replay`)
- Event list with highlighting
- Current event auto-scroll
- Inspector integration

**Artificial Sessions:**
- IDs prefixed with `replay-`
- Not persisted to database
- Cleaned up on session switch

---

### 5. Request-Response Correlation

**Problem:** Voice agent needs to know when coding task completes

**Solution:** Blackboard pattern with request tracking

**Data Structure:**
```javascript
blackboard: {
  pendingRequests: Map<requestId, {
    message: string,
    timestamp: number,
    status: 'pending' | 'working'
  }>,
  
  completedRequests: Map<requestId, {
    message: string,
    responses: Array<OpenCodeMessage>,
    completedAt: number
  }>
}
```

**Flow:**
```javascript
// 1. Voice agent initiates task
const requestId = generateUUID();
workspace.sendMessageToOpenCode(message, requestId);
// → Adds to pendingRequests

// 2. OpenCode processes
// SSE events flow, messages update

// 3. Agent becomes idle
// Event: session.idle
workspace.checkAndCompleteRequests();
// → Moves to completedRequests

// 4. Voice agent queries result
const response = workspace.getRequestResponse(requestId);
// → Returns responses from completedRequests
```

**Cleanup:**
- Keep last 50 completed requests
- Older requests automatically pruned

---

### 6. Blackboard Coordination

**Pattern:** Shared state object for multi-agent coordination

**Current Structure:**
```javascript
{
  currentTask: string,
  agentStatus: 'idle' | 'working',
  coordination: object,
  lastUpdate: timestamp,
  pendingRequests: Map,
  completedRequests: Map
}
```

**Future Enhancement:**
```javascript
{
  tasks: [
    { id, title, description, status, created, updated },
    ...
  ],
  notes: [
    { id, content, timestamp, source },
    ...
  ],
  context: {
    currentFocus: string,
    files: [],
    concepts: []
  },
  agentStatus: { ... },
  planningMode: {
    state: 'planning' | 'ready' | 'executing' | 'idle',
    currentPlan: {
      steps: [],
      discussion: [],
      readyToExecute: boolean
    }
  }
}
```

---

### 7. Tool Rendering Strategy Pattern

**Pattern:** Specialized renderers for different tool types

**Base Interface:**
```javascript
class ToolRenderer {
  matches(toolName)           // Check if tool matches
  renderCompact(part)         // Summary view
  renderCompactStreaming(part) // Streaming view
}
```

**Fallback Chain:**
```
1. Try specific renderer (e.g., OpenCodeReadTool)
2. Try category renderer (e.g., OpenCodeSearchTool)
3. Fallback to OpenCodeGenericTool
```

**Benefits:**
- Easy to add new tool visualizations
- Clear separation of concerns
- Testable rendering logic
- Graceful fallback

---

## Database Schema

### Workspace Database

**Database Name:** `lively-ai-workspace-history`

**Table:** `workspaces`
```javascript
{
  id: string (UUID),              // Primary key
  timestamp: date,                // Creation time
  lastActivityTime: date,         // Last activity
  title: string,                  // Session title
  conversationId: string,         // Links to realtime DB
  opencodeSessionId: string,      // Links to opencode session
  messagesArray: Array<object>    // Optional: message backup
}
```

**Indexes:**
- `id` (primary key)
- `timestamp`
- `lastActivityTime`

**Sample Record:**
```javascript
{
  id: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: '2025-02-26T10:30:00.000Z',
  lastActivityTime: '2025-02-26T11:45:00.000Z',
  title: 'Implement search feature',
  conversationId: 'c9f6d8e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f',
  opencodeSessionId: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
  messagesArray: [...]  // Compacted event data
}
```

---

### Realtime Database

**Database Name:** `openai-realtime-conversations`

**Table:** `conversations`
```javascript
{
  id: string (UUID),              // Primary key
  timestamp: number,              // Creation time (Unix)
  lastMessageTime: number         // Last message (Unix)
}
```

**Table:** `messages`
```javascript
{
  id: number,                     // Auto-increment
  conversationId: string,         // Foreign key
  timestamp: number,              // Message time (Unix)
  type: string,                   // Message type
  role: 'user' | 'assistant' | 'tool',
  content: string,                // Message content
  metadata: object,               // Additional data
  sequence: number                // Message sequence
}
```

**Indexes:**
- `messages.conversationId` - For querying by conversation
- `messages.timestamp` - For time-based queries

---

### OpenCode Sessions

**Storage:** Server-side (Claude Code server)

**Access:** Via REST API

**Endpoints:**
- `GET /session` - List sessions
- `GET /session/:id/message` - Get messages
- `POST /session/:id/message` - Send message

**No local database** - All data managed by server

**Session Metadata Caching:**
Lively4 caches session metadata locally for performance:
```javascript
{
  id: string,
  title: string,
  messageCount: number,
  accumulatedTokens: { input, output, total },
  estimatedCost: number
}
```

---

## Integration Points

### 1. Workspace ↔ Realtime Chat

**Events Emitted by Realtime:**
- `realtime:create-live-user-message` - User spoke
- `realtime:update-live-assistant-message` - AI responding
- `realtime:create-tool-message` - Function call

**Events Listened by Realtime:**
- `agent-status-change` - Coding agent status updated

**Method Calls (Workspace → Realtime):**
```javascript
realtimeComponent.setInstructions(prompt)
realtimeComponent.setAvailableTools(toolNames)
realtimeComponent.onAgentStatusChange(eventData)
realtimeComponent.relayAgentResponse(task)
```

**Function Tools (Realtime → Workspace):**
```javascript
send_opencode_task(message)
get_opencode_status()
get_opencode_history()
create_opencode_session(title)
switch_opencode_session(sessionId)
get_opencode_sessions()
```

---

### 2. Workspace ↔ OpenCode

**Events Emitted by OpenCode:**
- `opencode:message-added` - New message
- `opencode:message-updated` - Message updated
- `opencode:status-change` - Status changed
- `opencode:connected` - Connected to server
- `opencode:session-switched` - Session switched

**Method Calls (Workspace → OpenCode):**
```javascript
opencodeComponent.abortCurrentSession()
opencodeComponent.sendMessage(message)
opencodeComponent.getMessages()
opencodeComponent.selectSession(sessionId)
```

**SSE Events Handled:**
- `message.updated` - Message metadata
- `message.part.updated` - Part streaming
- `session.updated` - Session state
- `session.idle` - Agent idle

---

### 3. Components → Agent Board

**Update Methods:**
```javascript
agentBoard.setProjectFocus(url)
agentBoard.addFileRead(path)
agentBoard.addFileWritten(path)
agentBoard.addToolUsage(toolName)
agentBoard.updateTodos(todos)
agentBoard.updateFromMessage(message)
```

**Data Extraction:**
- Parse OpenCode messages for tool calls
- Extract file operations (read, write, edit)
- Parse TODO tool results
- Track tool usage statistics

---

### 4. Message Renderer ↔ Tool Renderers

**Dispatch Flow:**
```javascript
// In lively-chat-message.js
dispatchToolRender(part) {
  // Find matching renderer
  for (const RendererClass of toolRenderers) {
    const renderer = new RendererClass();
    if (renderer.matches(part.name || part.tool)) {
      return renderer.renderCompact(part);
    }
  }
  
  // Fallback
  return new OpenCodeGenericTool().renderCompact(part);
}
```

**Renderer Interface:**
```javascript
class MyToolRenderer extends OpenCodeBaseTool {
  matches(toolName) {
    return toolName === 'my_tool';
  }
  
  renderCompact(part) {
    // Return HTML string or DOM element
    return `<div>Tool: ${part.name}</div>`;
  }
  
  renderCompactStreaming(part) {
    // Handle streaming updates
    // Show partial results, progress
  }
}
```

---

### 5. Session Components Integration

**Session Component Usage:**
```javascript
// In workspace/opencode/realtime
const sessions = await lively.create('lively-chat-sessions');
this.get('#sessionsContainer').appendChild(sessions);

// Listen for events
lively.addEventListener('sessions', sessions, 'session-selected',
  evt => this.onSessionSelected(evt.detail.sessionId)
);

lively.addEventListener('sessions', sessions, 'session-deleted',
  evt => this.onSessionDeleted(evt.detail.sessionId)
);

// Update session list
sessions.render(sessionsList);
```

**Session Data Format:**
```javascript
[
  {
    id: string,
    title: string,
    timestamp: number,
    lastActivityTime: number,
    messageCount: number,
    isActive: boolean,
    isEmpty: boolean
  },
  ...
]
```

---

## Summary

### Key Strengths

1. ✅ **Clean Object-Oriented Design** - Proper inheritance hierarchy
2. ✅ **Event-Driven Architecture** - Loose coupling via CustomEvents
3. ✅ **Composition Pattern** - Workspace embeds child components
4. ✅ **Incremental Rendering** - Smooth streaming without flicker
5. ✅ **Event Sourcing** - Complete replay capability for debugging
6. ✅ **Specialized Tool Renderers** - Rich visualization of tool execution
7. ✅ **Request-Response Tracking** - Multi-agent coordination
8. ✅ **Unified Session Management** - Atomic session switching

### Architecture Principles

1. **Single Responsibility** - Each component has clear purpose
2. **Open/Closed** - Open for extension (tool renderers), closed for modification
3. **Liskov Substitution** - Subclasses can replace base class (LivelyChat)
4. **Interface Segregation** - Small, focused interfaces (tool renderer interface)
5. **Dependency Inversion** - Depend on abstractions (event contracts)

### Future Enhancements

1. **Blackboard Redesign** - Structured tasks/notes instead of raw JSON
2. **Planning Mode** - Buffer for casual chat before execution
3. **Enhanced Context** - Better system prompts with MCP tool descriptions
4. **Internal Message Display** - Show agent's internal thinking
5. **Voice Agent Clarity** - Reframe as direct extension of coding agent

---

**End of Architecture Documentation**

*For implementation details, see individual component files in `src/ai-workspace/components/`*

*For testing, see `src/ai-workspace/test/`*

*For additional documentation, see `src/ai-workspace/doc/`*
