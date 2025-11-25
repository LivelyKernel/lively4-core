## 2025-11-25 AI Workspace Message Stream Backup Refactoring
*Author: @JensLincke with @BlindGoldi*

Refactored the Message Stream Backup feature to use proper event-based architecture with source tagging at capture time.

## Event-Based Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│ lively-ai-workspace (Coordinator/Blackboard)                              │
│ [src/components/tools/lively-ai-workspace.js]                             │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Message Stream Backup                                                   ││
│ │                                                                          ││
│ │ getCapturedEvents()                                                     ││
│ │   ├─> merge realtimeComponent._eventCapture                            ││
│ │   ├─> merge opencodeComponent._eventCapture                            ││
│ │   └─> sort by timestamp                                                ││
│ │                                                                          ││
│ │ saveMessagesToStorage()                                                 ││
│ │   ├─> getCapturedEvents()                                              ││
│ │   ├─> compactEvents() - remove verbose fields                          ││
│ │   └─> workspace.messagesArray = compactedEvents                        ││
│ │                                                                          ││
│ │ Triggered by: _saveMessagesDebounced() (2 second debounce)             ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│           ▲                                           ▲                     │
│           │                                           │                     │
│ ┌─────────┴─────────────────┐         ┌──────────────┴────────────────┐   │
│ │ openai-realtime-chat      │         │ lively-opencode               │   │
│ │                           │         │                               │   │
│ │ eventSource: 'realtime'   │         │ eventSource: 'opencode'       │   │
│ │                           │         │                               │   │
│ │ captureEvent(type, data,  │         │ captureEvent(type, data,      │   │
│ │              sessionId)   │         │              sessionId)       │   │
│ │   └─> _eventCapture.push({│         │   └─> _eventCapture.push({    │   │
│ │         timestamp,         │         │         timestamp,            │   │
│ │         type,              │         │         type,                 │   │
│ │         sessionId,         │         │         sessionId,            │   │
│ │         source: this.      │         │         source: this.         │   │
│ │           eventSource,     │         │           eventSource,        │   │
│ │         data               │         │         data                  │   │
│ │       })                   │         │       })                      │   │
│ └───────────────────────────┘         └───────────────────────────────┘   │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Live Update Methods (Individual Widget Updates)                        ││
│ │                                                                          ││
│ │ createRealtimeMessage(role, data)                                      ││
│ │   ├─> create new lively-chat-message widget                            ││
│ │   ├─> add to sharedMessagesPane                                        ││
│ │   └─> track in realtimeMessageWidgets Map                              ││
│ │                                                                          ││
│ │ updateRealtimeMessage(role, data)                                      ││
│ │   ├─> lookup widget by item_id                                         ││
│ │   ├─> widget.setMessage(data)                                          ││
│ │   └─> _saveMessagesDebounced()  ← TRIGGER BACKUP                       ││
│ │                                                                          ││
│ │ createOpenCodeMessage(msg)                                             ││
│ │   ├─> create new lively-chat-message widget                            ││
│ │   ├─> widget.setOpenCodeMessage(msg)                                   ││
│ │   └─> add to sharedMessagesPane                                        ││
│ │                                                                          ││
│ │ updateOpenCodeMessage(msg)                                             ││
│ │   ├─> lookup widget by msgId                                           ││
│ │   ├─> widget.setOpenCodeMessage(msg)                                   ││
│ │   └─> _saveMessagesDebounced()  ← TRIGGER BACKUP                       ││
│ │                                                                          ││
│ │ renderSharedMessages() - ONLY called for full re-renders:              ││
│ │   ├─> workspace switch                                                 ││
│ │   ├─> initial load                                                     ││
│ │   └─> NOT called during streaming updates                              ││
│ └─────────────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────────────┘
```

### Event Format

Events stored in `_eventCapture[]` and `workspace.messagesArray`:

```javascript
{
  timestamp: 1732550400000,           // Date.now()
  type: 'realtime' | 'sse',           // Event type
  sessionId: 'abc123',                // Session identifier
  source: 'realtime' | 'opencode',    // Auto-added by eventSource property
  data: { /* event-specific data */ } // Original event data
}
```

## Changes Made

**Modified Files:**
- [lively-chat.js](edit://src/components/tools/lively-chat.js) - Added `eventSource` property, modified `captureEvent()`
- [openai-realtime-chat.js](edit://src/components/tools/openai-realtime-chat.js) - Set `eventSource = 'realtime'`
- [lively-opencode.js](edit://src/components/tools/lively-opencode.js) - Set `eventSource = 'opencode'`, renamed SSE connection
- [lively-ai-workspace.js](edit://src/components/tools/lively-ai-workspace.js) - Complete refactoring of backup system

**Key Improvements:**
- Removed `_pendingMessages` buffer - events captured by child components
- Added source tagging at capture time via `this.eventSource` property
- Simplified `saveMessagesToStorage()` to merge child events
- Moved save triggers to live update methods (not rendering)
- Updated replay to work with new event format

---

# AI Workspace Architecture - Key Insights

## Live Message Updates (Not Re-render Everything)

**Critical architectural pattern:**

The AI workspace does **NOT** re-render all messages on every change. Instead, it uses **live updates** to individual message widgets.

### Update Methods

- `updateOpenCodeMessage(msg)` - Updates individual OpenCode messages by msgId lookup
- `updateRealtimeMessage(role, messageData)` - Updates individual realtime messages by item_id lookup

These methods:
1. Look up the existing message widget in `displayedMessages` Map (keyed by msgId)
2. Call `setOpenCodeMessage()` or `setMessage()` on the widget to update it in place
3. If widget doesn't exist, create it via `createOpenCodeMessage()` or similar

### When renderSharedMessages() is Called

`renderSharedMessages()` is only called when:
- Initial load of workspace
- Switching between workspaces
- Major state changes requiring full re-render

It is NOT called on every message update during streaming.

### Message Stream Backup Integration

The Message Stream Backup feature should trigger saves from the **live update methods**, not from rendering:

- `updateOpenCodeMessage()` - triggers `_saveMessagesDebounced()` after updating widget
- `updateRealtimeMessage()` - triggers `_saveMessagesDebounced()` after updating widget

This ensures:
- Saves happen when actual events occur (not during passive rendering)
- No duplicate saves from re-renders
- Clean separation between rendering and event capture

### Component Roles

**lively-ai-workspace (coordinator/blackboard):**
- Manages two child components (openai-realtime-chat and lively-opencode)
- Does NOT handle messages directly
- Renders unified view by merging messages from children
- Coordinates sessions and shared state

**Child components (openai-realtime-chat, lively-opencode):**
- Capture their own events via `captureEvent(type, data, sessionId)`
- Each sets `this.eventSource` property ('realtime' or 'opencode')
- Events are automatically tagged with source

**Event merging:**
- AI workspace overrides `getCapturedEvents()` to merge child component events
- Events are sorted by timestamp
- No wrapping needed - source is already part of the event

### Lessons Learned

1. **Read documentation first** - `doc/tools/ai-workspace.md` clearly describes the coordinator pattern
2. **Don't assume re-render patterns** - Modern UI uses live updates, not full re-renders
3. **Look for update methods** - Methods like `updateXXX()` are signals of live update architecture
4. **Properties over parameters** - Using `this.eventSource` property is cleaner than passing source parameter
