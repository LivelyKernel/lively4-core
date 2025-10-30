# Lively Chat Architecture

Comprehensive documentation for the Lively4 AI chat component family and their integration patterns.

## Component Family Overview

```
LivelyChat (base class)
├── openai-realtime-chat    - Voice/audio AI chat with WebRTC streaming
├── lively-opencode          - Code-focused AI agent via OpenCode.ai server
└── lively-ai-workspace      - Orchestrates both for unified development experience
```

**File Locations:**
- Base: [lively-chat.js](edit://src/components/tools/lively-chat.js) (38 lines)
- Realtime: [openai-realtime-chat.js](edit://src/components/tools/openai-realtime-chat.js) (1,770 lines)
- OpenCode: [lively-opencode.js](edit://src/components/tools/lively-opencode.js) (812 lines)
- Workspace: [lively-ai-workspace.js](edit://src/components/tools/lively-ai-workspace.js) (1,468 lines)
- Message Display: [lively-chat-message.js](edit://src/components/tools/lively-chat-message.js)

---

## Component Architectures

### openai-realtime-chat

**Purpose:** Voice-based AI assistant using OpenAI's Realtime API with streaming audio I/O

**Technical Stack:**
- WebRTC Data Channel for bidirectional messaging
- OpenAI Realtime API for speech-to-text and text-to-speech
- IndexedDB (Dexie) for conversation persistence
- WebAudio API for audio processing

**Key Features:**
- Real-time voice conversation with streaming responses
- Function calling capabilities (tools integration)
- Conversation history management
- Live transcript updates
- Audio input/output with multiple voice options

**API Surface:**
```javascript
// Lifecycle
async initialize()
connectedCallback()
disconnectedCallback()

// Conversation Management
async createNewConversation()
async loadConversation(conversationId)
async setConversation(conversationId)
async deleteConversation(conversationId)

// WebRTC Connection
async connectRealtimeWebRTC()
disconnectRealtimeWebRTC()
async reconnectWithNewVoice()

// Message Handling
async addMessage(role, text)
async addToolMessage(text, metadata)
async saveMessageToDb(message)

// Live Updates (streaming transcripts)
async createLiveUserMessage()
async updateLiveUserMessage(text)
async createLiveAssistantMessage()
async updateLiveAssistantMessage(text)

// Configuration
setInstructions(instructions)
setAvailableTools(toolNames)
async callFunction(functionName, args)

// Properties
messagesUI: boolean          // Show/hide messages pane
sessionUI: boolean           // Show/hide session management UI
showDebugAnnotations: boolean
showToolCalls: boolean
```

**Database Schema:**
```javascript
conversations: 'id, timestamp, lastMessageTime'
messages: '++id, conversationId, timestamp, type, role, content, metadata, sequence'
```

**Integration Points:**
- Tools defined in [openai-realtime-chat-tools.js](edit://src/components/tools/openai-realtime-chat-tools.js)
- Can call external APIs via function calling
- Emits status events for workspace coordination

---

### lively-opencode

**Purpose:** Text-based coding AI agent with streaming responses and session management

**Technical Stack:**
- RESTful API to OpenCode.ai server (http://localhost:9100)
- Server-Sent Events (SSE) for real-time message streaming
- In-memory session and message storage
- EventSource for event stream handling

**Key Features:**
- Multi-session management
- Streaming message responses with live updates
- Server-side conversation persistence
- Status change events for coordination
- Rich message format (parts-based with different types)

**API Surface:**
```javascript
// Lifecycle
async initialize()
connectedCallback()
disconnectedCallback()

// Server Connection
async connectToServer()
disconnectFromServer()
connectEventStream()

// Session Management
async loadSessions()
async selectSession(session)
async onNewSessionButton()

// Message Handling
async loadMessagesForSession(sessionId)
async displayMessages()
addMessage(sessionId, role, content)
addTemporaryMessage(sessionId, role, content)
clearTemporaryMessages(sessionId)

// Streaming Updates
handleEvent(data)                    // Process SSE events
updateMessageFromEvent(sessionId, messageInfo)
updatePartFromEvent(sessionId, part)

// Properties
messagesUI: boolean          // Show/hide messages pane
sessionUI: boolean           // Show/hide session list
showDebug: boolean          // Show debug info in messages
messages: Map               // sessionId → messages array
sessions: Array             // Available sessions
currentSession: Object      // Currently active session
```

**Message Format:**
```javascript
{
  info: {
    id: string,
    role: 'user' | 'assistant',
    time: { created: timestamp }
  },
  parts: [
    { type: 'text', text: string },
    { type: 'thinking', thinking: string },
    { type: 'tool_use', ...toolData }
  ]
}
```

**Server API:**
- `GET /session` - List sessions
- `POST /session` - Create session
- `POST /session/:id/message` - Send message
- `GET /event` - SSE stream for updates
- `GET /config` - Server configuration

**Events Dispatched:**
```javascript
'opencode:status-change' - { type, sessionId, status, message, timestamp }
```

---

### lively-ai-workspace

**Purpose:** Unified workspace orchestrating both realtime chat and opencode for seamless development

**Technical Stack:**
- IndexedDB for workspace session linking
- Method hooking for message capture
- Blackboard pattern for state coordination
- Event-driven integration

**Key Features:**
- Unified session management (links audio + code sessions)
- Shared message pane showing chronological history
- Real-time transcript updates from both sources
- Blackboard for agent coordination
- Request-response correlation
- Session switching and history export

**API Surface:**
```javascript
// Workspace Session Management
async createWorkspaceSession(title)
async switchWorkspaceSession(workspaceId)
async listWorkspaceSessions()
async deleteWorkspaceSession(workspaceId)

// Message Display
async renderSharedMessages()
async createLiveSharedMessage(role)
async updateLiveSharedMessage(text, role)
scrollSharedPaneToBottom(force)

// OpenCode Integration API (exposed to realtime chat tools)
async sendMessageToOpenCode(message, requestId)
getOpenCodeStatus()
async getOpenCodeHistory()
async createOpenCodeSession(title)
async switchOpenCodeSession(sessionId)
getOpenCodeSessions()

// Request Correlation
checkAndCompleteRequests()
completeRequest(requestId, response)
getRequestResponse(requestId)

// History & Export
async exportWorkspaceHistory()
async debugDumpMessages()

// Properties
showDebug: boolean
blackboard: Object           // Coordination state
workspaceId: string         // Current workspace ID
```

**Database Schema:**
```javascript
workspaces: 'id, timestamp, lastActivityTime, title, conversationId, opencodeSessionId'
messages: '++id, workspaceId, timestamp, source, streamType, conversationId, sessionId, sequence'
events: '++id, workspaceId, timestamp, eventType, source, data'
```

**Blackboard State:**
```javascript
{
  currentTask: string,
  agentStatus: 'idle' | 'working' | 'blocked',
  coordination: Object,
  lastUpdate: timestamp,
  pendingRequests: Map,      // requestId → request state
  completedRequests: Map     // requestId → response
}
```

**Integration Pattern:**
```javascript
// Hooks into subcomponent methods to capture messages
setupRealtimeMessageCapture() {
  // Hook createLiveUserMessage, updateLiveUserMessage
  // Hook createLiveAssistantMessage, updateLiveAssistantMessage
  // Hook saveMessageToDb
}

setupOpenCodeMessageCapture() {
  // Hook displayMessages
}
```

---

## Shared Patterns

### Common Properties

All chat components support these properties:

```javascript
messagesUI: boolean     // Show/hide message display pane (default: true)
sessionUI: boolean      // Show/hide session management UI (default: true)
showDebug: boolean      // Show debug annotations in messages
```

**Usage:**
```javascript
component.messagesUI = false;    // Hide messages when embedded
component.sessionUI = false;     // Hide session controls
```

### Message Display

All components use `lively-chat-message` for consistent message rendering:

```javascript
const chatMessage = await lively.create('lively-chat-message');

// Flat format (realtime chat)
await chatMessage.setMessage({
  role: 'user' | 'assistant' | 'tool',
  content: string,
  source: 'audio' | 'code',
  streamType: 'realtime' | 'opencode'
});

// OpenCode format
await chatMessage.setOpenCodeMessage(opencodeMessage, { source, streamType });
```

### Context Menus

All components implement context menus with common options:
- Copy selected text
- Toggle debug mode
- Component-specific actions

### Lifecycle Hooks

All components implement:
```javascript
async initialize()           // Component setup
livelyMigrate(other)        // Preserve state during hot reload
livelyPreMigrate()          // Cleanup before migration
livelyPrepareSave()         // Prepare for save (optional)
```

---

## Usage Examples

### Standalone OpenCode

```javascript
const opencode = await lively.openComponentInWindow('lively-opencode');

// Wait for connection
await lively.sleep(1000);

// Send message
opencode.get('#messageInput').value = "Explain async/await";
await opencode.onSendButton();
```

### Standalone Realtime Chat

```javascript
const chat = await lively.openComponentInWindow('openai-realtime-chat');

// Configure tools
chat.setAvailableTools(['get_current_time', 'search_web']);

// Set custom instructions
chat.setInstructions("You are a helpful coding assistant.");

// Start conversation (automatically connects to OpenAI)
```

### Integrated Workspace

```javascript
const workspace = await lively.openComponentInWindow('lively-ai-workspace');

// Components are auto-initialized with messagesUI=false, sessionUI=false
// Workspace manages all session switching

// Send message to code agent
await workspace.sendMessageToOpenCode("Add error handling to loadFile");

// Check status
const status = workspace.getOpenCodeStatus();
console.log(status.agentStatus); // 'working' | 'idle'

// Export history
const history = await workspace.exportWorkspaceHistory();
```

---

## Architecture Issues & Refactoring Proposals

### Current Problems

1. **Minimal Base Class** - Only 38 lines, most shared code duplicated across subclasses
2. **Method Override Integration** - Workspace uses fragile method hooking instead of proper events
3. **Mixed Concerns** - UI rendering, business logic, and state management not separated
4. **Code Duplication** - ~4,000 lines total with significant overlap
5. **No Extension Points** - Hard to customize or extend without modifying core code
6. **Tight Coupling** - Components know too much about each other's internals

### Proposed Refactoring

#### 1. Enhanced Base Class

Move shared functionality into `LivelyChat`:

```javascript
export default class LivelyChat extends Morph {
  // Shared Properties (move from subclasses)
  set messagesUI(value) { /* current implementation */ }
  get messagesUI() { /* current implementation */ }
  set sessionUI(value) { /* NEW */ }
  get sessionUI() { /* NEW */ }
  set showDebug(value) { /* NEW */ }
  get showDebug(value) { /* NEW */ }

  // Shared Message Display
  async renderMessage(message) { /* NEW - base implementation */ }
  async createLiveMessage(role, initialContent) { /* NEW */ }
  async updateLiveMessage(text) { /* NEW */ }
  scrollToBottom(force) { /* NEW */ }

  // Event Hooks (Template Method Pattern)
  onMessageCreated(message) { /* Override in subclass */ }
  onMessageUpdated(message) { /* Override in subclass */ }
  onMessageCompleted(message) { /* Override in subclass */ }
  onSessionChanged(sessionId) { /* Override in subclass */ }
  onStatusChanged(status) { /* Override in subclass */ }

  // Shared Context Menu
  generateToggleIcon(state) { /* NEW */ }
  onContextMenu(evt) { /* NEW - base implementation */ }

  // Shared Lifecycle
  setupInputHandling() { /* NEW - Enter to send pattern */ }
}
```

**Benefits:**
- Reduces duplication by ~200-300 lines per subclass
- Consistent behavior across all components
- Easier to add new chat component types

#### 2. Event-Based Integration

Replace method hooking with proper event system:

```javascript
// In openai-realtime-chat.js
async createLiveAssistantMessage() {
  // ... create message ...

  // Emit event instead of relying on method override
  this.dispatchEvent(new CustomEvent('chat:live-message-created', {
    detail: { role: 'assistant', element: this.currentLiveMessageElement },
    bubbles: true
  }));
}

async updateLiveAssistantMessage(text) {
  // ... update message ...

  this.dispatchEvent(new CustomEvent('chat:live-message-updated', {
    detail: { role: 'assistant', text: text },
    bubbles: true
  }));
}

async saveMessageToDb(message) {
  // ... save to DB ...

  this.dispatchEvent(new CustomEvent('chat:message-completed', {
    detail: { message: message },
    bubbles: true
  }));
}
```

```javascript
// In lively-ai-workspace.js
setupRealtimeMessageCapture() {
  this.realtimeComponent.addEventListener('chat:live-message-created',
    (evt) => this.createLiveSharedMessage(evt.detail.role)
  );

  this.realtimeComponent.addEventListener('chat:live-message-updated',
    (evt) => this.updateLiveSharedMessage(evt.detail.text, evt.detail.role)
  );

  this.realtimeComponent.addEventListener('chat:message-completed',
    async (evt) => {
      this.currentLiveSharedMessageElement = null;
      await this.renderSharedMessages();
    }
  );
}
```

**Benefits:**
- Decouples components (workspace doesn't override internals)
- More maintainable and testable
- Easier to debug (event listeners visible in devtools)
- Can have multiple listeners for same event

#### 3. Separation of Concerns

Extract UI rendering from business logic:

```javascript
// Message State Manager (business logic)
class MessageStateManager {
  constructor(storage) {
    this.storage = storage;  // IndexedDB or in-memory
    this.liveMessages = new Map();
  }

  createLiveMessage(role) { /* return message ID */ }
  updateLiveMessage(messageId, text) { /* update state */ }
  completeLiveMessage(messageId) { /* finalize & persist */ }
  getMessages(sessionId) { /* retrieve messages */ }
}

// Message Renderer (UI logic)
class MessageRenderer {
  constructor(container, messageStateManager) {
    this.container = container;
    this.stateManager = messageStateManager;
  }

  async renderLiveMessage(messageId) { /* create DOM */ }
  async updateLiveMessageUI(messageId) { /* update DOM */ }
  async renderMessages(sessionId) { /* full render */ }
}

// Component ties them together
class OpenaiRealtimeChat extends LivelyChat {
  async initialize() {
    this.messageState = new MessageStateManager(this.db);
    this.messageRenderer = new MessageRenderer(
      this.responses,
      this.messageState
    );
  }
}
```

**Benefits:**
- Easier to test business logic without UI
- UI can be swapped/themed without touching logic
- Clearer responsibilities
- Could support headless mode for testing

#### 4. Extract Common Patterns

Create shared utilities:

```javascript
// src/client/chat-utils.js
export class SessionManager {
  constructor(storage) {
    this.storage = storage;
    this.currentSession = null;
  }

  async listSessions() { /* ... */ }
  async createSession(title) { /* ... */ }
  async switchSession(sessionId) { /* ... */ }
  async deleteSession(sessionId) { /* ... */ }
}

export class LiveMessageTracker {
  constructor() {
    this.currentMessage = null;
    this.currentRole = null;
  }

  createLive(role, initialContent) { /* ... */ }
  updateLive(text) { /* ... */ }
  completeLive() { /* ... */ }
}

export class StatusIndicator {
  constructor(element) {
    this.element = element;
  }

  updateStatus(text, connected, working) { /* ... */ }
  setConnected(connected) { /* ... */ }
  setWorking(working) { /* ... */ }
}
```

**Benefits:**
- Reusable across all chat components
- Consistent behavior
- Easier to test in isolation
- ~100-200 lines saved per component

#### 5. Standardized Event Schema

Define consistent event naming and structure:

```javascript
// Event Types
const ChatEvents = {
  // Lifecycle
  CONNECTED: 'chat:connected',
  DISCONNECTED: 'chat:disconnected',

  // Messages
  LIVE_MESSAGE_CREATED: 'chat:live-message-created',
  LIVE_MESSAGE_UPDATED: 'chat:live-message-updated',
  MESSAGE_COMPLETED: 'chat:message-completed',
  MESSAGE_DELETED: 'chat:message-deleted',

  // Sessions
  SESSION_CREATED: 'chat:session-created',
  SESSION_SWITCHED: 'chat:session-switched',
  SESSION_DELETED: 'chat:session-deleted',

  // Status
  STATUS_CHANGED: 'chat:status-changed'
};

// Event Detail Schema
interface ChatEventDetail {
  source: 'opencode' | 'realtime';  // Which component
  timestamp: number;

  // Message events
  message?: {
    role: 'user' | 'assistant' | 'tool';
    content: string;
    metadata?: Object;
  };

  // Session events
  session?: {
    id: string;
    title: string;
  };

  // Status events
  status?: {
    state: 'idle' | 'working' | 'connected' | 'disconnected';
    message?: string;
  };
}
```

**Benefits:**
- Predictable event structure
- TypeScript-ready (could add .d.ts)
- Self-documenting
- Easier to debug

---

## Implementation Plan

### Phase 1: Documentation & Cleanup (Current)
- [x] Create comprehensive architecture documentation
- [ ] Remove experimental/unused code
- [ ] Trim excessive comments
- [ ] Add proper JSDoc comments

### Phase 2: Base Class Enhancement
- [ ] Move `showDebug`, `sessionUI` to base class
- [ ] Add `renderMessage()` to base class
- [ ] Add shared context menu implementation
- [ ] Add shared input handling (Enter to send)
- [ ] Reduce subclass code by ~200 lines each

### Phase 3: Event System
- [ ] Define `ChatEvents` constant
- [ ] Add event dispatching to all message lifecycle methods
- [ ] Replace workspace method hooks with event listeners
- [ ] Add event documentation

### Phase 4: Extract Utilities
- [ ] Create `chat-utils.js`
- [ ] Extract `SessionManager`
- [ ] Extract `LiveMessageTracker`
- [ ] Extract `StatusIndicator`
- [ ] Update components to use utilities

### Phase 5: Separation of Concerns (Optional - Major Refactor)
- [ ] Create `MessageStateManager`
- [ ] Create `MessageRenderer`
- [ ] Update components to use new architecture
- [ ] Add tests for business logic

### Phase 6: Testing & Refinement
- [ ] Create integration tests
- [ ] Test workspace integration thoroughly
- [ ] Performance profiling
- [ ] Documentation updates

---

## Size Reduction Targets

**Current:**
- lively-chat.js: 38 lines
- openai-realtime-chat.js: 1,770 lines
- lively-opencode.js: 812 lines
- lively-ai-workspace.js: 1,468 lines
- **Total: 4,088 lines**

**After Refactoring (Estimated):**
- lively-chat.js: 200 lines (+162) - enhanced base class
- chat-utils.js: 150 lines (new) - shared utilities
- openai-realtime-chat.js: 1,200 lines (-570) - 32% reduction
- lively-opencode.js: 600 lines (-212) - 26% reduction
- lively-ai-workspace.js: 1,100 lines (-368) - 25% reduction
- **Total: 3,250 lines (20% reduction)**

**Key Improvements:**
- Less duplication
- Better separation of concerns
- Proper extension points
- Event-driven integration
- Easier to maintain and extend

---

## API Integration Patterns

### Tool Functions (Realtime Chat → Workspace)

Defined in [openai-realtime-chat-tools.js](edit://src/components/tools/openai-realtime-chat-tools.js):

```javascript
{
  name: 'send_opencode_task',
  description: 'Send a coding task to Claude Code agent',
  parameters: {
    task: { type: 'string', description: 'The coding task' }
  }
}
```

Implementation in workspace:
```javascript
async callFunction(functionName, args) {
  if (functionName === 'send_opencode_task') {
    const workspace = this.closest('lively-ai-workspace');
    return await workspace.sendMessageToOpenCode(args.task);
  }
}
```

### Event Coordination (OpenCode → Workspace)

```javascript
// OpenCode dispatches status events
this.dispatchEvent(new CustomEvent('opencode:status-change', {
  detail: {
    type: 'session.idle',
    sessionId: this.currentSession.id,
    status: 'idle',
    message: 'Task completed',
    timestamp: Date.now()
  }
}));

// Workspace listens and updates blackboard
this.opencodeComponent.addEventListener('opencode:status-change', (evt) => {
  this.blackboard.agentStatus = evt.detail.status;
  this.updateBlackboardDisplay();
});
```

---

## Best Practices

### Creating a New Chat Component

1. Extend `LivelyChat` base class
2. Implement required lifecycle methods
3. Use `messagesUI` and `sessionUI` properties
4. Dispatch standard events for integration
5. Support context menu with debug toggle
6. Use `lively-chat-message` for rendering
7. Follow naming conventions (onButtonName, evt parameter)

### Integrating with Workspace

1. Don't override component methods - use events
2. Store cross-component state in workspace
3. Let workspace manage unified sessions
4. Emit events for all state changes
5. Provide public API for tool integration

### Message Handling

1. Use live message pattern for streaming
2. Always save final messages to persistence
3. Include timestamps from creation (not save time)
4. Support both UI and headless modes
5. Emit events at each lifecycle stage

---

## Related Documentation

- [AI Workspace Details](edit://doc/tools/ai-workspace.md) - Workspace-specific features and improvement plans
- [OpenCode Server](edit://../lively4-server/README.md) - OpenCode.ai server integration
- [MCP Integration](edit://doc/mcp-integration.md) - Model Context Protocol for Claude Code
- [Realtime Chat Tools](edit://src/components/tools/openai-realtime-chat-tools.js) - Available function definitions

---

## Glossary

- **Live Message** - Message being updated in real-time as content streams in
- **Session** - Conversation or workspace context containing messages
- **Blackboard** - Shared state coordination pattern used by workspace
- **Hook** - Method override for integration (anti-pattern, being replaced)
- **Tool** - Function callable by AI agent (OpenAI function calling)
- **SSE** - Server-Sent Events (one-way streaming from server)
- **WebRTC** - Web Real-Time Communication (peer-to-peer with data channels)
