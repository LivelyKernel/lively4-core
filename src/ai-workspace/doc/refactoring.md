# AI Workspace Refactoring

**Consolidated refactoring tasks and architecture improvements**

**Last Updated:** 2026-02-26

## Open Tasks

- [ ] #3 Session vs Conversation Terminology
- [ ] #5 Button Handler Naming
- [ ] #7 Scroll Wrapper Methods
- [ ] #8 Temporary Message Handling
- [ ] #9 Event Capture Deduplication
- [ ] #10 Health Check / Reconnection
- [ ] #11 Extract Message Widget Manager
- [ ] #12 Standardize Event Dispatching
- [ ] #13 Unify Session Persistence
- [ ] #14 Extract Blackboard Pattern
- [ ] #15 Toolset Interface
- [ ] #16 Auto-Scroll Message Container
- [ ] #17 Session Metadata Sync
- [ ] #18 Method Render Double Bug
- [ ] #19 Voice Chat Timestamp Issues
- [ ] #21 Remove Commented Code
- [ ] #22 Remove Deprecated Aliases
- [ ] #23 Fix or Remove Deprecated Methods

---

## Naming & Terminology

### 1. ✅ Inconsistent Container Names - COMPLETED

**Problem:** Different components use different names for message containers

**Solution:** ✅ Standardized on `messagesContainer` across all components

All three components now use:
```javascript
this.messagesContainer = this.get('#messagesContainer');
```

**Changes made:**
- Renamed `#sharedMessagesPane` → `#messagesContainer` in HTML
- Renamed property in lively-ai-workspace.js
- Updated all call sites (14 occurrences)
- Removed wrapper methods `isSharedPaneAtBottom()` and `scrollSharedPaneToBottom()`
- Updated tests and documentation

**Refactoring:**
```javascript
// Before (lively-ai-workspace.js)
get sharedMessagesPane() {
  return this.get('#sharedMessagesPane');
}

isSharedPaneAtBottom(threshold) {
  return this.isAtBottom(this.sharedMessagesPane, threshold);
}

scrollSharedPaneToBottom(force) {
  return this.scrollToBottom(this.sharedMessagesPane, force);
}

// After
get messagesContainer() {
  return this.get('#messagesContainer');  // Rename HTML element too
}

// Use base class methods directly
// this.isAtBottom(this.messagesContainer)
// this.scrollToBottom(this.messagesContainer)
```

**Status:** ✅ COMPLETED (2025-02-26)

**Files changed:**
- ✅ `lively-ai-workspace.js` - Renamed property, removed wrapper methods, updated 14 call sites
- ✅ `lively-ai-workspace.html` - Renamed ID and CSS class
- ✅ `ai-workspace-transcript-test.js` - Updated test assertions
- ✅ `ai-workspace.md` - Updated documentation
- ✅ `refactoring.md` - Marked as complete


---

### 2. ✅ Inconsistent Method Names - COMPLETED

**Problem:** Similar operations have different names across components

| Operation | Workspace | Realtime | OpenCode |
|-----------|-----------|----------|----------|
| Display all | `renderAllMessages()` | `renderConversation()` | `displayMessages()` |
| Display one | N/A | `renderMessage()` | `renderMessage()` |
| Update one | `updateLiveSharedMessage()` | `updateMessage()` | `updateOpenCodeMessage()` |

**Impact:**
- Mental overhead when switching between components
- Harder to create shared utilities
- API surface is unclear

**Solution:** Standardize on:
- `renderMessages()` - Rebuild all messages (use sparingly)
- `renderMessage(message)` - Add single message incrementally
- `updateMessage(messageId, updates)` - Update existing message

**Refactoring:**
```javascript
// Before (openai-realtime-chat.js)
renderConversation() {
  this.messagesContainer.innerHTML = '';
  for (const msg of this.conversation) {
    this.renderMessage(msg);
  }
}

// After
renderMessages() {  // Renamed for consistency
  this.messagesContainer.innerHTML = '';
  for (const msg of this.conversation) {
    this.renderMessage(msg);
  }
}
```

```javascript
// Before (lively-opencode.js)
displayMessages() {
  // Full rebuild - AVOID using this!
}

// After
renderMessages() {  // Renamed
  // Full rebuild - only use on session switch
}
```

**Files changed:**
- ✅ `openai-realtime-chat.js` - Renamed `renderConversation` → `renderMessages` (3 call sites)
- ✅ `lively-opencode.js` - Renamed `displayMessages` → `renderMessages` (2 call sites)
- ✅ `lively-ai-workspace.js` - Renamed `renderAllMessages` → `renderMessages` (2 call sites)

**Status:** ✅ COMPLETED (2025-02-26)


---

### 3. ⏸️ Session vs Conversation Terminology - POSTPONED

**Problem:** Inconsistent terminology confuses the domain model

- **Workspace:** "workspace" (links conversation + session)
- **Realtime:** "conversation" (conversationId)
- **OpenCode:** "session" (sessionId)

**Impact:**
- Unclear what "session" means in context
- Workspace coordinator mixes both terms (conversationId, sessionId)
- Hard to explain the linking model
- Code comments needed to clarify

**Why Postponed:**

The mixed terminology is intentional and reflects the APIs being wrapped:
- **OpenAI Realtime API uses "conversation"** - it's their domain term
- **Claude Code API uses "session"** - it's their domain term
- **Leaf components stay honest** - they use API-native terminology

The workspace component naturally uses "conversation" heavily because it interacts extensively with the voice component (openai-realtime-chat). Forcing internal abstraction would fight against this reality.

**Attempted Solution (rejected):**
- Creating internal abstraction layer (audioSessionId, codeSessionId)
- Would not help: workspace still needs to work with `conversationId` constantly
- Would add translation overhead without improving clarity
- Would make code less readable by fighting natural API terminology

**Current Approach:**
Keep the API-native terms and document clearly:

```javascript
/**
 * TERMINOLOGY CONSTRAINTS:
 * 
 * Components use their API's native terminology:
 * - openai-realtime-chat: conversationId (OpenAI's term)
 * - lively-opencode: sessionId (Claude Code's term)
 * - lively-ai-workspace: uses both when interacting with children
 * 
 * This mixed terminology is intentional - components honestly reflect
 * their underlying APIs rather than forcing artificial consistency.
 * 
 * Workspace linking:
 * - workspaceSession links one conversationId + one sessionId
 * - conversationId → OpenAI realtime chat history
 * - sessionId → Claude Code coding session
 */
```

**Status:** ⏸️ POSTPONED - Keep as is, not a priority to change

**Decision Date:** 2026-02-26

**Files to update with documentation:**
- `architecture.md` - Add terminology constraints section
- `lively-ai-workspace.js` - Add JSDoc explaining the mixed terminology
- Component headers - Document the linking model


---

### 4. ✅ Debug Method Naming - COMPLETED

**Problem:** OpenCode has different name for debug state update

```javascript
// Base class + most subclasses
updateMessagesDebugState() { ... }

// OpenCode (INCONSISTENT!)
updateOpenCodeMessagesDebugState() { ... }
```

**Solution:** ✅ Renamed to match base class

**Refactoring:**
```javascript
// Before (lively-opencode.js)
updateOpenCodeMessagesDebugState() {
  const showDebug = this.showDebug;
  for (const [messageId, element] of this.messageElements) {
    element.showDebug = showDebug;
  }
}

// After
updateMessagesDebugState() {  // Renamed
  const showDebug = this.showDebug;
  for (const [messageId, element] of this.messageElements) {
    element.showDebug = showDebug;
  }
}
```

**Files changed:**
- ✅ `lively-opencode.js` - Method already renamed

**Status:** ✅ COMPLETED (pre-existing)


---

### 5. Button Handler Naming

**Problem:** Some buttons don't follow `on[ButtonId]Button()` pattern

```javascript
// Good (follows pattern)
onSendButton()
onResetButton()
onNewSessionButton()

// Inconsistent
onConversationsButton()     // Should match element ID
onServerButton()            // OK if element is #serverButton
onReconnectButton()         // OK if element is #reconnectButton
```

**Solution:** Audit all button IDs and ensure method names match

**Refactoring:**
```javascript
// Check HTML templates
<button id="send">Send</button>        → onSendButton()
<button id="reconnect">Reconnect</button> → onReconnectButton()

// If ID doesn't match, either:
// 1. Rename the ID to match method
// 2. Rename the method to match ID
```

**Files to audit:**
- All component `.html` files
- Corresponding `.js` files


---

## Code Duplication

### 6. ✅ Message Rendering Duplication - COMPLETED

**Problem:** Message rendering logic duplicated between workspace and opencode

```javascript
// lively-opencode.js - renderMessage()
const widget = await lively.create('lively-chat-message');
await widget.setOpenCodeMessage(message);
this.messagesContainer.appendChild(widget);
this.messageElements.set(messageId, widget);

// lively-ai-workspace.js - createOpenCodeMessage()
const widget = await lively.create('lively-chat-message');
await widget.setOpenCodeMessage(msg);
this.messagesContainer.appendChild(widget);
this.displayedMessages.set(messageId, widget);
```

**Impact:**
- Same logic in two places
- Bug fixes must be applied twice
- Inconsistent behavior risk
- Harder to maintain

**Solution:** Extract common pattern to shared method in `LivelyChat` base class

**Implementation:**

Added `renderChatMessage()` base method that handles the common rendering pattern:

```javascript
// Base class (lively-chat.js)
async renderChatMessage(message, messageId, targetContainer = null, options = null) {
  const container = targetContainer || this.messagesContainer;
  if (!container) return null;

  // Create widget
  const widget = await lively.create('lively-chat-message');
  
  // Auto-detect message format and use appropriate setter
  if (message.info && message.parts) {
    // OpenCode format
    await widget.setOpenCodeMessage(message, options);
  } else {
    // Simple format
    await widget.setMessage(message);
  }
  
  // Apply debug state from parent
  widget.showDebug = this.showDebug;
  
  // Append to container
  container.appendChild(widget);
  
  // Track in appropriate Map (subclass can override)
  this.trackMessageWidget(messageId, widget);
  
  // Scroll to bottom (unless batching)
  if (!this._batchRendering) {
    this.scrollToBottom(container);
  }
  
  return widget;
}

trackMessageWidget(messageId, widget) {
  // Default implementation - subclasses can override
  if (!this.messageElements) {
    this.messageElements = new Map();
  }
  this.messageElements.set(messageId, widget);
}
```

**Workspace now uses base method:**

```javascript
// Subclass (lively-ai-workspace.js)
async createOpenCodeMessage(msg) {
  const msgId = msg.info?.id;
  if (!msgId) return;

  if (this.displayedMessages.has(msgId)) return;

  // Use base class method for consistent rendering
  await this.renderChatMessage(msg, msgId, this.messagesContainer, {
    source: 'code',
    streamType: 'opencode'
  });
}

// Override to use workspace's map
trackMessageWidget(messageId, widget) {
  this.displayedMessages.set(messageId, widget);
}
```

**OpenCode keeps specialized implementation:**

OpenCode's `renderMessage()` **does NOT use** the base method because it has specialized streaming requirements:

1. **Buffered part merging** - parts that arrive before message.created
2. **Immediate DOM insertion + tracking BEFORE async setOpenCodeMessage** - critical for preserving order
3. **Rendering completion tracking** - to handle late updates
4. **Post-render update application** - updates that arrive during rendering

However, OpenCode now includes documentation explaining why it follows the same PATTERN manually rather than using the base method. Both approaches create widget → set content → append → track, but OpenCode controls the exact sequence for streaming correctness.

**Benefits:**
- Workspace uses single source of truth for simple batch rendering
- OpenCode documents its specialized streaming needs
- Both follow the same pattern (create → set → append → track)
- Consistent behavior where appropriate, specialized behavior where needed

**Files changed:**
- ✅ `lively-chat.js` - Added `renderChatMessage()` and `trackMessageWidget()` base methods
- ✅ `lively-ai-workspace.js` - Refactored to use base method + override tracking
- ✅ `lively-opencode.js` - Documented why it uses specialized implementation

**Tests:**
- ✅ `lively-ai-workspace-test.js` - All tests pass
- ✅ `lively-opencode-test.js` - All 22 tests pass
- ✅ `openai-realtime-chat-test.js` - All 4 tests pass

**Status:** ✅ COMPLETED (2026-02-26)



### 7. Scroll Wrapper Methods

**Problem:** Workspace has wrapper methods that just call base class

```javascript
// lively-ai-workspace.js
isSharedPaneAtBottom(threshold = 50) {
  return this.isAtBottom(this.sharedMessagesPane, threshold);
}

scrollSharedPaneToBottom(force = false, delay = 100) {
  return this.scrollToBottom(this.sharedMessagesPane, force, delay);
}
```

**Impact:**
- Unnecessary code
- More methods to maintain
- No added value

**Solution:** Remove wrappers, use base class directly

**Refactoring:**
```javascript
// Before
if (this.isSharedPaneAtBottom()) {
  this.scrollSharedPaneToBottom(true);
}

// After
if (this.isAtBottom(this.messagesContainer)) {
  this.scrollToBottom(this.messagesContainer, true);
}
```

**Files to change:**
- `lively-ai-workspace.js` - Remove wrapper methods
- Update all call sites


---

### 8. Temporary Message Handling

**Problem:** Only OpenCode has temporary message support

```javascript
// lively-opencode.js
this.temporaryMessages = new Map();

addTemporaryMessage(sessionId, role, content) {
  // Add temporary message for immediate UI feedback
}

clearTemporaryMessages(sessionId) {
  // Clear when server confirms
}
```

**Question:** Do other components need this?

**Option A: Move to base class**
- If realtime/workspace could benefit from temporary messages
- Provides consistent pattern across all components

**Option B: Keep in OpenCode only**
- If it's specific to OpenCode's SSE architecture
- Document why only OpenCode needs it

**Recommendation:** Keep in OpenCode only, document the reason

**Documentation:**
```javascript
// lively-opencode.js
/**
 * Temporary messages provide immediate UI feedback before server confirmation.
 * 
 * Why only in OpenCode:
 * - SSE has network latency before server confirms message
 * - User sees their input immediately while server processes
 * - Realtime doesn't need this (WebRTC data channel is fast)
 */
```

**Files to change:**
- `lively-opencode.js` - Add JSDoc explaining why


---

### 9. Event Capture Deduplication

**Problem:** Only realtime has deduplication logic

```javascript
// openai-realtime-chat.js
if (!this._capturedItemIds) {
  this._capturedItemIds = new Set();
}

if (this._capturedItemIds.has(message.item.id)) {
  this.log(`Skipping duplicate event`);
  return;
}

this._capturedItemIds.add(message.item.id);
this.captureEvent('realtime', message, this.currentConversationId);
```

**Question:** Is this needed in other components?

**Analysis:**
- **Realtime:** OpenAI API sends duplicate `conversation.item.created` events
- **OpenCode:** SSE events are unique (no duplicates observed)
- **Workspace:** Merges events from children (could have duplicates)

**Solution:** Move to base class with optional flag

**Refactoring:**
```javascript
// Base class (lively-chat.js)
captureEvent(type, data, sessionId, {deduplicate = false, idField = 'id'} = {}) {
  if (deduplicate) {
    if (!this._capturedItemIds) {
      this._capturedItemIds = new Set();
    }
    
    const itemId = data[idField] || data.item?.[idField];
    if (this._capturedItemIds.has(itemId)) {
      this.log(`Skipping duplicate event: ${itemId}`);
      return;
    }
    this._capturedItemIds.add(itemId);
  }
  
  this._eventCapture.push({
    type,
    data,
    sessionId,
    timestamp: Date.now(),
    eventSource: this.constructor.name.toLowerCase()
  });
}

// Subclass (openai-realtime-chat.js)
this.captureEvent('realtime', message, this.currentConversationId, {
  deduplicate: true,
  idField: 'item.id'
});
```

**Files to change:**
- `lively-chat.js` - Add deduplication to base `captureEvent()`
- `openai-realtime-chat.js` - Remove local implementation, use base class


---

### 10. Health Check / Reconnection

**Problem:** Only OpenCode has health checking and auto-reconnect

```javascript
// lively-opencode.js
startConnectionHealthCheck() {
  this.healthCheckInterval = setInterval(() => {
    this.checkServerHealth();
  }, 30000);
}

stopConnectionHealthCheck() {
  if (this.healthCheckInterval) {
    clearInterval(this.healthCheckInterval);
  }
}

checkServerHealth() {
  fetch(`${this.serverUrl}/config`)
    .then(response => {
      if (response.ok) {
        this.updateStatus('Connected', true);
      }
    })
    .catch(error => {
      this.updateStatus('Disconnected', false);
      this.reconnectTimer = setTimeout(() => {
        this.connectToServer();
      }, 5000);
    });
}
```

**Question:** Does realtime need this?

**Analysis:**
- **OpenCode:** Local server can crash/restart (needs health check)
- **Realtime:** OpenAI is cloud service (always available)
- **Pattern:** Only needed for self-hosted backends

**Solution:** Keep in OpenCode only, document why

**Documentation:**
```javascript
/**
 * Health checking and auto-reconnect for local Claude Code server.
 * 
 * Why only in OpenCode:
 * - OpenCode server runs locally (can crash, restart)
 * - Realtime uses OpenAI cloud (no health checking needed)
 * - Workspace doesn't connect to backend (delegates to children)
 */
```

**Files to change:**
- `lively-opencode.js` - Add JSDoc


---

## Architecture Improvements

### 11. Extract Message Widget Manager

**Problem:** All three components manage message widgets independently

```javascript
// Each component has similar code:
this.messageElements = new Map();    // messageId → DOM element
this.displayedMessages = new Map();  // messageId → widget
this.messageWidgets = new Map();     // item_id → widget

// Similar operations:
// - Create widget
// - Track in Map
// - Update widget
// - Remove widget
// - Clear all widgets
```

**Solution:** Extract to shared MessageWidgetManager class

**Refactoring:**
```javascript
// New file: src/ai-workspace/components/message-widget-manager.js
export class MessageWidgetManager {
  constructor() {
    this.widgets = new Map();  // id → widget
  }
  
  async create(messageId, messageData) {
    const widget = await lively.create('lively-chat-message');
    await widget.setMessage(messageData);
    this.widgets.set(messageId, widget);
    return widget;
  }
  
  get(messageId) {
    return this.widgets.get(messageId);
  }
  
  has(messageId) {
    return this.widgets.has(messageId);
  }
  
  async update(messageId, updates) {
    const widget = this.widgets.get(messageId);
    if (widget) {
      await widget.setMessage(updates);
    }
    return widget;
  }
  
  remove(messageId) {
    const widget = this.widgets.get(messageId);
    if (widget) {
      widget.remove();
      this.widgets.delete(messageId);
    }
  }
  
  clear() {
    for (const widget of this.widgets.values()) {
      widget.remove();
    }
    this.widgets.clear();
  }
  
  get size() {
    return this.widgets.size;
  }
  
  *[Symbol.iterator]() {
    yield* this.widgets.entries();
  }
}
```

**Usage:**
```javascript
// In components
import { MessageWidgetManager } from './message-widget-manager.js';

class LivelyOpencode extends LivelyChat {
  initialize() {
    this.messageManager = new MessageWidgetManager();
  }
  
  async renderMessage(message) {
    const messageId = message.info.id;
    
    if (this.messageManager.has(messageId)) {
      await this.messageManager.update(messageId, message);
    } else {
      const widget = await this.messageManager.create(messageId, message);
      this.messagesContainer.appendChild(widget);
    }
  }
}
```

**Benefits:**
- Single source of truth for widget management
- Easier to add features (batch operations, lifecycle hooks)
- Reduces duplication across components
- Testable in isolation

**Files to create:**
- `src/ai-workspace/components/message-widget-manager.js`

**Files to change:**
- `lively-ai-workspace.js`
- `openai-realtime-chat.js`
- `lively-opencode.js`


---

### 12. Standardize Event Dispatching

**Problem:** Different event dispatching patterns across components

```javascript
// Some use helper method
this.dispatchMessageEvent('realtime:create-live-user-message', data);

// Some use direct CustomEvent
this.dispatchEvent(new CustomEvent('opencode:status-change', {
  detail: data,
  bubbles: true
}));

// Inconsistent event naming
'realtime:create-live-user-message'  // Very descriptive
'opencode:status-change'             // Short
```

**Solution:** Standardize on helper method, document naming convention

**Refactoring:**
```javascript
// Base class (lively-chat.js) - already exists
dispatchMessageEvent(name, data) {
  this.dispatchEvent(new CustomEvent(name, {
    detail: data,
    bubbles: true,
    composed: true
  }));
}

// Enforce usage in all components
// Add JSDoc with event naming convention
/**
 * Dispatch component event following naming convention:
 * 
 * Format: [component]:[action]-[entity]
 * 
 * Examples:
 * - realtime:message-created
 * - realtime:message-updated
 * - opencode:session-switched
 * - opencode:status-changed
 * 
 * @param {string} name - Event name
 * @param {object} data - Event data
 */
```

**Create Event Catalog:**
```javascript
// New file: src/ai-workspace/doc/events.md
# AI Workspace Events

## Event Naming Convention

Format: `[component]:[action]-[entity]`

## Workspace Events
- `workspace:session-created`
- `workspace:session-switched`
- `workspace:session-deleted`

## Realtime Events
- `realtime:message-created`
- `realtime:message-updated`
- `realtime:tool-executed`

## OpenCode Events
- `opencode:message-added`
- `opencode:message-updated`
- `opencode:status-changed`
- `opencode:session-switched`
```

**Files to create:**
- `src/ai-workspace/doc/events.md` - Event catalog

**Files to change:**
- All components - Use `dispatchMessageEvent()` consistently
- Add JSDoc to event emitters


---

### 13. Unify Session Persistence

**Problem:** Three different persistence approaches

```javascript
// Workspace: Dexie with workspaces table
db.workspaces.put({id, conversationId, opencodeSessionId, ...});

// Realtime: Dexie with conversations + messages tables
db.conversations.put({id, timestamp, ...});
db.messages.add({conversationId, role, content, ...});

// OpenCode: Server-side only (no local DB)
POST /session/:id/message
```

**Analysis:** Each approach makes sense for its context

- **Workspace:** Needs to link both sub-sessions
- **Realtime:** Needs full message history in IndexedDB
- **OpenCode:** Server is source of truth (client caches metadata)

**Solution:** Document why each is different, not refactor

**Documentation:**
```markdown
## Session Persistence Strategies

### Why Different Approaches?

1. **Workspace** - Linking metadata only
   - Stores: workspace ID, linked session IDs, title
   - Why: Lightweight linking layer, doesn't duplicate data
   - Database: `lively-ai-workspace-history`

2. **Realtime** - Full message persistence
   - Stores: Conversations, messages, metadata
   - Why: OpenAI doesn't persist history, must store locally
   - Database: `openai-realtime-conversations`

3. **OpenCode** - Server-side only
   - Stores: Nothing locally (server is source of truth)
   - Why: Claude Code server already persists everything
   - Client cache: Session metadata for UI (not persisted)

### Data Flow

```
Workspace Session
├── conversationId → Realtime DB → Full messages
└── opencodeSessionId → Server → Fetch on demand
```
```

**Files to change:**
- `architecture.md` - Add persistence strategy section


---

### 14. Extract Blackboard Pattern

**Problem:** Blackboard is embedded in workspace component

```javascript
// lively-ai-workspace.js
this.blackboard = {
  currentTask: null,
  agentStatus: 'idle',
  coordination: {},
  lastUpdate: Date.now(),
  pendingRequests: new Map(),
  completedRequests: new Map()
};
```

**Solution:** Extract to WorkspaceBlackboard class

**Refactoring:**
```javascript
// New file: src/ai-workspace/components/workspace-blackboard.js
export class WorkspaceBlackboard {
  constructor() {
    this.currentTask = null;
    this.agentStatus = 'idle';
    this.coordination = {};
    this.lastUpdate = Date.now();
    this.pendingRequests = new Map();
    this.completedRequests = new Map();
    this.maxCompletedRequests = 50;
  }
  
  // Task management
  setCurrentTask(task) {
    this.currentTask = task;
    this.touch();
  }
  
  getCurrentTask() {
    return this.currentTask;
  }
  
  clearCurrentTask() {
    this.currentTask = null;
    this.touch();
  }
  
  // Agent status
  setAgentStatus(status) {
    this.agentStatus = status;
    this.touch();
  }
  
  getAgentStatus() {
    return this.agentStatus;
  }
  
  isAgentIdle() {
    return this.agentStatus === 'idle';
  }
  
  isAgentWorking() {
    return this.agentStatus === 'working';
  }
  
  // Request tracking
  addRequest(requestId, message) {
    this.pendingRequests.set(requestId, {
      message,
      timestamp: Date.now(),
      status: 'pending'
    });
    this.touch();
  }
  
  completeRequest(requestId, responses) {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      this.pendingRequests.delete(requestId);
      this.completedRequests.set(requestId, {
        message: request.message,
        responses,
        completedAt: Date.now()
      });
      
      // Prune old completed requests
      this.pruneCompletedRequests();
      this.touch();
    }
  }
  
  getRequest(requestId) {
    return this.pendingRequests.get(requestId) || 
           this.completedRequests.get(requestId);
  }
  
  getPendingRequests() {
    return Array.from(this.pendingRequests.values());
  }
  
  getCompletedRequests() {
    return Array.from(this.completedRequests.values());
  }
  
  pruneCompletedRequests() {
    if (this.completedRequests.size > this.maxCompletedRequests) {
      const entries = Array.from(this.completedRequests.entries());
      const toDelete = entries.slice(0, entries.length - this.maxCompletedRequests);
      for (const [requestId] of toDelete) {
        this.completedRequests.delete(requestId);
      }
    }
  }
  
  // Coordination data
  setCoordination(key, value) {
    this.coordination[key] = value;
    this.touch();
  }
  
  getCoordination(key) {
    return this.coordination[key];
  }
  
  // Utility
  touch() {
    this.lastUpdate = Date.now();
  }
  
  toJSON() {
    return {
      currentTask: this.currentTask,
      agentStatus: this.agentStatus,
      coordination: this.coordination,
      lastUpdate: this.lastUpdate,
      pendingRequests: Array.from(this.pendingRequests.entries()),
      completedRequests: Array.from(this.completedRequests.entries())
    };
  }
}
```

**Usage:**
```javascript
// lively-ai-workspace.js
import { WorkspaceBlackboard } from './workspace-blackboard.js';

class LivelyAiWorkspace extends LivelyChat {
  initialize() {
    this.blackboard = new WorkspaceBlackboard();
  }
  
  sendMessageToOpenCode(message, requestId) {
    this.blackboard.addRequest(requestId, message);
    // ...
  }
  
  checkAndCompleteRequests() {
    if (this.blackboard.isAgentIdle()) {
      // ...
    }
  }
}
```

**Benefits:**
- Encapsulated blackboard logic
- Testable in isolation
- Reusable for other multi-agent scenarios
- Clear API for coordination

**Files to create:**
- `src/ai-workspace/components/workspace-blackboard.js`

**Files to change:**
- `lively-ai-workspace.js`


---

### 15. Toolset Interface

**Problem:** Two toolsets without documented interface

```javascript
// openai-realtime-chat-tools.js
class BasicToolset { ... }
class WorkspaceToolset { ... }
class CompositeToolset { ... }
```

**Solution:** Create base Toolset class with documented interface

**Refactoring:**
```javascript
// New base class
export class Toolset {
  /**
   * Get tool definitions in OpenAI Realtime API format
   * @returns {Array<object>} Tool definitions
   */
  getDefinitions() {
    throw new Error('Subclass must implement getDefinitions()');
  }
  
  /**
   * Execute a tool function
   * @param {string} functionName - Tool name
   * @param {object} args - Tool arguments
   * @returns {Promise<object>} Tool result
   */
  async execute(functionName, args) {
    throw new Error('Subclass must implement execute()');
  }
}

// Subclasses
export class BasicToolset extends Toolset {
  getDefinitions() {
    return [
      {
        type: 'function',
        name: 'get_time',
        description: 'Get current time',
        parameters: { type: 'object', properties: {} }
      }
    ];
  }
  
  async execute(functionName, args) {
    if (functionName === 'get_time') {
      return { time: new Date().toISOString() };
    }
    throw new Error(`Unknown function: ${functionName}`);
  }
}
```

**Documentation:**
```javascript
/**
 * Toolset Interface
 * 
 * Toolsets provide function calling capabilities for AI agents.
 * 
 * Basic Architecture:
 * - BasicToolset: Standalone tools (time, random, etc.)
 * - WorkspaceToolset: Coordination tools (send to coding agent, etc.)
 * - CompositeToolset: Combines multiple toolsets
 * 
 * Creating Custom Toolsets:
 * 
 * 1. Extend Toolset base class
 * 2. Implement getDefinitions() - Return OpenAI function definitions
 * 3. Implement execute(name, args) - Execute the function
 * 
 * Example:
 * 
 * class MyToolset extends Toolset {
 *   getDefinitions() {
 *     return [{
 *       type: 'function',
 *       name: 'my_tool',
 *       description: 'Does something useful',
 *       parameters: {
 *         type: 'object',
 *         properties: {
 *           input: { type: 'string', description: 'Input data' }
 *         },
 *         required: ['input']
 *       }
 *     }];
 *   }
 *   
 *   async execute(functionName, args) {
 *     if (functionName === 'my_tool') {
 *       return { result: args.input.toUpperCase() };
 *     }
 *   }
 * }
 */
```

**Files to change:**
- `openai-realtime-chat-tools.js` - Add base class, update subclasses

**Files to create:**
- `src/ai-workspace/doc/toolsets.md` - Toolset documentation


---

## UI/UX Improvements

### 16. Auto-Scroll Message Container

**Problem:** Message container scroll behavior is inconsistent

**Requirements:**
- Auto-scroll to bottom when new message arrives IF already scrolled to bottom
- Keep scroll position stable if user scrolled up to read earlier messages
- Handle edge case: rapidly arriving messages during streaming

**Current Issue:**
```javascript
// Simple approach breaks when user is reading history:
this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
```

**Solution:** Smart scroll detection

**Refactoring:**
```javascript
// Base class (lively-chat.js) - already has helpers
isAtBottom(container, threshold = 50) {
  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight;
  const clientHeight = container.clientHeight;
  return scrollHeight - scrollTop - clientHeight < threshold;
}

scrollToBottom(container, force = false, delay = 100) {
  if (force || this.isAtBottom(container)) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, delay);
  }
}

// Enhanced version for streaming:
scrollToBottomSmooth(container, force = false) {
  if (force || this.isAtBottom(container)) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }
}

// Use in message rendering:
async renderMessage(message) {
  const wasAtBottom = this.isAtBottom(this.messagesContainer);
  
  // Render message...
  const widget = await this.renderChatMessage(message, messageId);
  
  // Auto-scroll if was already at bottom
  if (wasAtBottom) {
    this.scrollToBottom(this.messagesContainer, false, 50);
  }
}
```

**Additional considerations:**
- Debounce scroll during rapid streaming
- User gesture detection (if user manually scrolls up, stop auto-scroll)
- Visual indicator when new messages arrive while scrolled up

**Files to change:**
- `lively-chat.js` - Add `scrollToBottomSmooth()` helper
- `lively-opencode.js` - Use smart scroll in `renderMessage()`
- `lively-ai-workspace.js` - Use smart scroll in message handlers
- `openai-realtime-chat.js` - Use smart scroll in `renderMessage()`

**Reference:** [tasks.md](browse://src/ai-workspace/tasks.md#L21)



---

### 17. Session Metadata Sync

**Problem:** OpenCode session costs and info not available in AI workspace sessions

**Current behavior:**
- OpenCode tracks: token usage, cost, file operations
- Workspace sessions don't have access to this metadata
- User can't see costs when browsing workspace sessions

**Solution:** Sync metadata from OpenCode to workspace

**Refactoring:**
```javascript
// When workspace switches sessions, fetch OpenCode metadata
async switchToSession(workspaceId) {
  const workspace = await this.db.workspaces.get(workspaceId);
  
  // Load OpenCode metadata
  if (workspace.opencodeSessionId) {
    const metadata = await this.opencodeComponent.getSessionMetadata(
      workspace.opencodeSessionId
    );
    
    // Store in workspace record
    await this.db.workspaces.update(workspaceId, {
      opencodeMetadata: metadata
    });
  }
}

// In lively-opencode.js, add metadata getter
async getSessionMetadata(sessionId) {
  const response = await fetch(`${this.serverUrl}/session/${sessionId}/info`);
  const data = await response.json();
  
  return {
    totalTokens: data.usage?.total_tokens || 0,
    totalCost: data.usage?.total_cost || 0,
    filesRead: data.files?.read || [],
    filesWritten: data.files?.written || []
  };
}

// Display in workspace UI
updateSessionInfo() {
  const metadata = this.currentWorkspace?.opencodeMetadata;
  if (metadata) {
    this.get('#sessionCost').textContent = `$${metadata.totalCost.toFixed(4)}`;
    this.get('#sessionTokens').textContent = metadata.totalTokens;
  }
}
```

**Files to change:**
- `lively-ai-workspace.js` - Add metadata sync on session switch
- `lively-opencode.js` - Add `getSessionMetadata()` method
- `lively-ai-workspace.html` - Add UI elements for metadata display

**Reference:** [tasks.md](browse://src/ai-workspace/tasks.md#L24)



---

## Bug Fixes

### 18. Method Render Double Bug

**Problem:** Unclear bug related to method rendering

**Status:** NEEDS INVESTIGATION

**Action items:**
1. Reproduce the bug (what symptoms?)
2. Identify root cause
3. Create test case
4. Implement fix
5. Verify fix with test

**Reference:** [tasks.md](browse://src/ai-workspace/tasks.md#L23)



---

### 19. Voice Chat Timestamp Issues

**Problem:** Voice chat entries not correctly timestamped, causing bad replay rendering

**Current behavior:**
- Realtime messages may have incorrect timestamps
- Replay renders messages out of order
- Timeline jumps during replay

**Root cause candidates:**
- Client-side timestamp vs server timestamp mismatch
- Missing timestamp in some OpenAI events
- Timestamp format inconsistency

**Solution:** Audit timestamp handling in realtime chat

**Investigation needed:**
```javascript
// Check where timestamps are assigned
captureEvent(type, data, sessionId) {
  this._eventCapture.push({
    type,
    data,
    sessionId,
    timestamp: Date.now(),  // Client timestamp
    eventSource: this.constructor.name.toLowerCase()
  });
}

// vs OpenAI event timestamps
{
  type: "conversation.item.created",
  item: {
    created_at: 1234567890  // Server timestamp?
  }
}
```

**Action items:**
1. Log all timestamps during capture
2. Compare client vs server timestamps
3. Standardize on single timestamp source
4. Add timestamp validation
5. Test replay rendering with fixed timestamps

**Files to investigate:**
- `openai-realtime-chat.js` - Event capture and timestamp logic
- `lively-chat.js` - Base event capture
- `lively-ai-workspace.js` - Replay rendering

**Reference:** [tasks.md](browse://src/ai-workspace/tasks.md#L20)



---

## Technical Debt

### 20. ✅ Remove Duplicate Method - COMPLETED

**Problem:** CRITICAL BUG - Duplicate method definition

```javascript
// lively-ai-workspace.js
async updateOpenCodeMessage(msg) {
  // ... lines 392-409
}

async updateOpenCodeMessage(msg) {
  // ... lines 455-472 (DUPLICATE!)
}
```

**Impact:** JavaScript keeps the last definition, first one is unreachable

**Solution:** Compare both implementations, keep the correct one

**Action:**
1. Read both implementations
2. Determine which is correct (likely the second one)
3. Remove the first one
4. Test workspace messaging

**Files to change:**
- `lively-ai-workspace.js` - Remove duplicate



---

### 21. Remove Commented Code

**Problem:** Lots of commented-out code

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

```javascript
// openai-realtime-chat.js (lines 1300-1307)
case "response.audio.delta":
  // this.log("FULL response.audio.delta:", JSON.stringify({
  //   ... lots of commented logging
  // }, null, 2));
  break;
```

**Solution:** Either re-enable or remove

**For disabled connection polling:**
```javascript
// Option 1: Fix and re-enable
startConnectionPolling() {
  // Only poll when component is visible
  if (!this.isConnected()) return;
  
  this.connectionPollInterval = setInterval(() => {
    if (!this.isConnected()) {
      clearInterval(this.connectionPollInterval);
      return;
    }
    
    if (this.opencodeComponent) {
      const isConnected = this.opencodeComponent.connected;
      if (!isConnected) {
        this.updateOpenCodeStatus('Disconnected', false);
      }
    }
  }, 5000);
}

// Stop when component disconnects
disconnectedCallback() {
  if (this.connectionPollInterval) {
    clearInterval(this.connectionPollInterval);
  }
}

// Option 2: Remove if not needed
// DELETE the commented code
```

**Files to audit:**
- `lively-ai-workspace.js`
- `openai-realtime-chat.js`
- `lively-opencode.js`


---

### 22. Remove Deprecated Aliases

**Problem:** Backward compatibility aliases

```javascript
// openai-realtime-chat.js
get responses() {
  return this.messagesContainer;  // Backward compatibility alias
}
```

**Action:**
1. Search codebase for usage of `responses`
2. If used, replace with `messagesContainer`
3. If not used, remove the alias

**Files to audit:**
- All workspace components


---

### 23. Fix or Remove Deprecated Methods

**Problem:** Methods marked deprecated

```javascript
// lively-morph.js
getSubmorph(selector) {  // #Deprecated, please use either "get" or "querySelector" directly
  // ... implementation
}
```

**Action:**
- If used internally by `get()`, keep it (it is)
- If used elsewhere, migrate to `get()`
- Add clear deprecation warning

**Files to audit:**
- Check usage of `getSubmorph()`


---

## Testing Strategy

For each refactoring:

1. **Before:**
   - Write tests for existing behavior
   - Document current API usage

2. **During:**
   - Refactor incrementally
   - Keep tests passing
   - Update call sites

3. **After:**
   - Run full test suite
   - Test in browser (lively4-core)
   - Update documentation

**Test Coverage:**
- Unit tests for new classes (MessageWidgetManager, WorkspaceBlackboard)
- Integration tests for event flow
- Manual testing for UI components

---

## Risk Mitigation

**High-Risk Refactorings:**
- Extract MessageWidgetManager (touches all 3 components)
- Standardize container names (many call sites)
- Extract WorkspaceBlackboard (coordination logic)

**Mitigation:**
- Feature flags for gradual rollout
- Keep old code alongside new (deprecate, then remove)
- Thorough testing before/after
- Document breaking changes

**Rollback Plan:**
- Use git branches for major refactorings
- Document what changed
- Keep tests passing throughout
