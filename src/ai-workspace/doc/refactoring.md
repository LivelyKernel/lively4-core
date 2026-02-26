# AI Workspace Refactoring Guide

Strategic refactoring opportunities to reduce redundancy and streamline the AI workspace architecture.

**Last Updated:** 2025-02-26

---

## Table of Contents

1. [Overview](#overview)
2. [Naming & Terminology](#naming--terminology)
3. [Code Duplication](#code-duplication)
4. [Architecture Improvements](#architecture-improvements)
5. [Technical Debt](#technical-debt)
6. [Refactoring Roadmap](#refactoring-roadmap)

---

## Overview

The AI workspace has grown organically, resulting in inconsistencies across the three main chat components:
- `LivelyAiWorkspace` (coordinator)
- `OpenaiRealtimeChat` (voice agent)
- `LivelyOpencode` (coding agent)

This document identifies opportunities to:
- **Reduce redundancy** - Move shared logic to base class
- **Standardize interfaces** - Consistent naming and patterns
- **Extract patterns** - Reusable components and utilities
- **Remove technical debt** - Clean up deprecated/commented code

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

**Actual effort:** ~1 hour

---

### 2. Inconsistent Method Names

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

**Files to change:**
- `openai-realtime-chat.js` - Rename `renderConversation` → `renderMessages`
- `lively-opencode.js` - Rename `displayMessages` → `renderMessages`
- `lively-ai-workspace.js` - Rename `renderAllMessages` → `renderMessages`

**Estimated effort:** 2-3 hours

---

### 3. Session vs Conversation Terminology

**Problem:** Inconsistent terminology confuses the domain model

- **Workspace:** "workspace" (links conversation + session)
- **Realtime:** "conversation"
- **OpenCode:** "session"

**Impact:**
- Unclear what "session" means in context
- Hard to explain the linking model
- Code comments needed to clarify

**Solution:** Document the terminology clearly, consider renaming for consistency

**Option A: Keep current terms, document clearly**
```javascript
// TERMINOLOGY:
// - Workspace: Links one realtime conversation with one opencode session
// - Conversation: OpenAI realtime chat history (conversationId)
// - Session: Claude Code coding session (opencodeSessionId)
```

**Option B: Rename for consistency**
```javascript
// Everything becomes "session":
// - workspaceSession (links audioSession + codeSession)
// - audioSession (OpenAI realtime)
// - codeSession (Claude Code)
```

**Recommendation:** Option A (keep current, document clearly)
- Less churn
- Matches external APIs (OpenAI uses "conversation", OpenCode uses "session")
- Add clear terminology section to architecture.md

**Files to change:**
- `architecture.md` - Add terminology glossary
- Component JSDoc comments - Document the linking model

**Estimated effort:** 1 hour (documentation)

---

### 4. Debug Method Naming

**Problem:** OpenCode has different name for debug state update

```javascript
// Base class + most subclasses
updateMessagesDebugState() { ... }

// OpenCode (INCONSISTENT!)
updateOpenCodeMessagesDebugState() { ... }
```

**Solution:** Rename to match base class

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

**Files to change:**
- `lively-opencode.js` - Rename method

**Estimated effort:** 15 minutes

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

**Estimated effort:** 2 hours

---

## Code Duplication

### 6. Scroll Wrapper Methods

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

**Estimated effort:** 1 hour

---

### 7. Temporary Message Handling

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

**Estimated effort:** 30 minutes (documentation)

---

### 8. Event Capture Deduplication

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

**Estimated effort:** 2 hours

---

### 9. Health Check / Reconnection

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

**Estimated effort:** 30 minutes (documentation)

---

## Architecture Improvements

### 10. Extract Message Widget Manager

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

**Estimated effort:** 4-6 hours

---

### 11. Standardize Event Dispatching

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

**Estimated effort:** 3-4 hours

---

### 12. Unify Session Persistence

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

**Estimated effort:** 1 hour (documentation)

---

### 13. Extract Blackboard Pattern

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

**Estimated effort:** 3-4 hours

---

### 14. Toolset Interface

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

**Estimated effort:** 3-4 hours

---

## Technical Debt

### 15. Remove Duplicate Method

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

**Estimated effort:** 30 minutes

**Priority:** CRITICAL - Do this first!

---

### 16. Remove Commented Code

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

**Estimated effort:** 2 hours

---

### 17. Remove Deprecated Aliases

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

**Estimated effort:** 1 hour

---

### 18. Fix or Remove Deprecated Methods

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

**Estimated effort:** 1 hour

---

## Refactoring Roadmap

### Phase 1: Critical Bugs (Week 1)

**Priority: CRITICAL**

1. ✅ **Remove duplicate `updateOpenCodeMessage`** (30 min)
   - Impact: Bug fix
   - Risk: Low
   - Files: `lively-ai-workspace.js`

2. ✅ **Fix or remove commented polling code** (1 hour)
   - Impact: Clean up technical debt
   - Risk: Low (already disabled)
   - Files: `lively-ai-workspace.js`

### Phase 2: Naming Standardization (Week 2-3)

**Priority: HIGH**

3. ✅ **Rename debug method in OpenCode** (15 min)
   - Impact: Consistency
   - Risk: Very low
   - Files: `lively-opencode.js`

4. ✅ **Standardize container names** (2 hours)
   - Impact: Consistency across components
   - Risk: Medium (many call sites)
   - Files: `lively-ai-workspace.js`, `.html`

5. ✅ **Standardize method names** (3 hours)
   - Impact: Clearer API
   - Risk: Medium
   - Files: All 3 chat components

6. ✅ **Audit button handler naming** (2 hours)
   - Impact: Consistency
   - Risk: Low
   - Files: All component HTML/JS

### Phase 3: Code Duplication (Week 4-5)

**Priority: MEDIUM**

7. ✅ **Remove scroll wrapper methods** (1 hour)
   - Impact: Less code to maintain
   - Risk: Low
   - Files: `lively-ai-workspace.js`

8. ✅ **Move deduplication to base class** (2 hours)
   - Impact: Reusable pattern
   - Risk: Medium
   - Files: `lively-chat.js`, `openai-realtime-chat.js`

9. ✅ **Document temporary messages** (30 min)
   - Impact: Clarity
   - Risk: None (docs only)
   - Files: `lively-opencode.js`

10. ✅ **Document health checking** (30 min)
    - Impact: Clarity
    - Risk: None (docs only)
    - Files: `lively-opencode.js`

### Phase 4: Architecture Improvements (Week 6-8)

**Priority: MEDIUM**

11. ✅ **Extract MessageWidgetManager** (6 hours)
    - Impact: Reusable component
    - Risk: High (major refactor)
    - Files: New file + all 3 components

12. ✅ **Standardize event dispatching** (4 hours)
    - Impact: Clearer event contracts
    - Risk: Medium
    - Files: All components, new docs

13. ✅ **Document persistence strategies** (1 hour)
    - Impact: Clarity
    - Risk: None (docs only)
    - Files: `architecture.md`

14. ✅ **Extract WorkspaceBlackboard** (4 hours)
    - Impact: Reusable coordination pattern
    - Risk: Medium
    - Files: New file + `lively-ai-workspace.js`

15. ✅ **Create Toolset interface** (4 hours)
    - Impact: Extensible tool system
    - Risk: Medium
    - Files: `openai-realtime-chat-tools.js`, new docs

### Phase 5: Cleanup (Week 9)

**Priority: LOW**

16. ✅ **Remove commented code** (2 hours)
    - Impact: Cleaner codebase
    - Risk: Low
    - Files: All components

17. ✅ **Remove deprecated aliases** (1 hour)
    - Impact: Cleaner API
    - Risk: Low
    - Files: `openai-realtime-chat.js`

18. ✅ **Document deprecated methods** (1 hour)
    - Impact: Clarity
    - Risk: None
    - Files: `lively-morph.js`

---

## Estimated Total Effort

| Phase | Hours | Weeks |
|-------|-------|-------|
| Phase 1: Critical Bugs | 1.5 | 0.5 |
| Phase 2: Naming | 7.25 | 1.5 |
| Phase 3: Duplication | 5 | 1 |
| Phase 4: Architecture | 19 | 3 |
| Phase 5: Cleanup | 4 | 0.5 |
| **Total** | **~37 hours** | **~6.5 weeks** |

*Assumes 1 developer working ~6 hours/week on refactoring*

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
- Git branches for each phase
- Can revert phase without affecting others
- Document what changed for each phase

---

## Success Metrics

After refactoring:

1. **Code Metrics:**
   - Reduced LOC (remove duplication)
   - Fewer methods per component
   - Higher code reuse

2. **Developer Experience:**
   - Easier to add new chat components
   - Clearer API surface
   - Better documentation

3. **Maintainability:**
   - Fewer bugs (less duplication)
   - Easier to debug (clearer patterns)
   - Faster onboarding for new developers

---

**End of Refactoring Guide**

*This is a living document - update as refactorings are completed*

*Mark items with ✅ when done, add notes on lessons learned*
