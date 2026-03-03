# LivelyChat (Base Class)

<lively-import src="../_navigation.html"></lively-import>

**File:** `lively-chat.js`

**Purpose:** Shared superclass for all AI chat components

**Extends:** `Morph` (from `src/components/widgets/lively-morph.js`)

**Subclasses:**
- [LivelyAiWorkspace](lively-ai-workspace.md) - Unified workspace coordinator
- [OpenaiRealtimeChat](openai-realtime-chat.md) - WebRTC audio/text chat
- [LivelyOpencode](lively-opencode.md) - Text-based coding agent

---

## Properties

### UI Control Attributes
```javascript
messagesUI    // boolean - Show/hide message display
sessionUI     // boolean - Show/hide session management
showDebug     // boolean - Show debug annotations
```

**Usage (for embedding):**
```javascript
this.opencodeComponent.sessionUI = false;
this.opencodeComponent.messagesUI = false;
```

---

## Event Capture & Replay

**Purpose:** Record live sessions for debugging and testing

### Properties
```javascript
_eventCapture      // Array of captured events
_replayMode        // Boolean flag for replay state
```

### Methods
```javascript
captureEvent(type, data, sessionId, {deduplicate = false, idField = 'id'} = {})
  // Capture event with optional deduplication
  
exportChatHistory()
  // Export full history to clipboard as JSONL
  
exportChatHistoryShortened()
  // Export compact version (strips verbose fields)
  
replayEventsFromClipboard()
  // Import JSONL from clipboard and replay
  
clearEventCapture()
  // Clear captured events array
```

### Replay Controls
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

### Workflow
1. Normal operation: Events captured to `_eventCapture` array
2. Export: Convert to JSONL (one JSON per line)
3. Import: Parse JSONL from clipboard
4. Replay: Process events with timing control

**Controls:**
- Pause/Resume
- Speed (1x, 2x, 5x, Instant)
- Stop
- Progress indicator

**Artificial Sessions:**
- IDs prefixed with `replay-`
- Not persisted to database
- Cleaned up when switching to real session

---

## Utility Methods

### Debug Logging
```javascript
log(...args)                     // Debug logging to #debugLog
clearDebugLog()
```

### Input Handling
```javascript
setupInputHandling(inputSelector, sendHandler)
  // Wire up input field with send handler
```

### Scrolling
```javascript
scrollToBottom(container, force, delay)
  // Scroll container to bottom
  
isAtBottom(container, threshold)
  // Check if container is scrolled to bottom
```

### UI Helpers
```javascript
generateToggleIcon(state)        // Checkbox icons (☑/☐)
dispatchMessageEvent(name, msg)  // Custom event helper
```

---

## Context Menu

**Base Implementation:**
```javascript
createBaseContextMenu(evt)       // Base menu items
getContextMenuItems()            // Override to add items
```

**Base Menu Items:**
- Copy selection
- Toggle debug
- Copy chat history
- Copy shortened history
- Replay from clipboard

**Override Pattern:**
```javascript
// In subclass:
getContextMenuItems() {
  return [
    ["Custom Action", () => this.doSomething()],
    ["---"],
    ...super.getContextMenuItems()
  ];
}
```

---

## Shared Patterns

### Button Registration
Auto-wiring pattern from Morph:
```javascript
// In initialize():
this.registerButtons()

// Finds buttons by ID and calls on[ButtonName]():
<button id="sendButton">     → onSendButton()
<button id="resetButton">    → onResetButton()
```

### Event Handling
Use `lively.addEventListener()` for proper cleanup:
```javascript
lively.addEventListener("myId", this, "click", evt => this.onClick(evt))
// Automatically cleaned up with lively.removeEventListener("myId", this)
```

---

## Component Access

```javascript
this.get("#selector") // querySelector in component and shadowRoot
await lively.openComponentInWindow("component-name")
```

---

## Implementation Notes

### Performance Considerations

**Event Capture Memory:**
Unbounded growth in `_eventCapture` array:
```javascript
this._eventCapture.push({...})       // No size limit!
```

**Recommendation:**
- Add max size limit (e.g., 1000 events)
- Or clear on session switch

### Deduplication
Base class provides optional deduplication via parameters:
```javascript
// Usage example
this.captureEvent('realtime', message, this.currentConversationId, {
  deduplicate: true,
  idField: 'item.id'
});
```

---

## See Also

- [Class Hierarchy](../doc/ai-workspace.md#class-hierarchy)
- [Shared Patterns](../doc/ai-workspace.md#shared-patterns)
- [Testing](../doc/ai-workspace.md#testing-recommendations)
