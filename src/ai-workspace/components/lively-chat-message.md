# LivelyChatMessage (Message Renderer)

<lively-import src="../_navigation.html"></lively-import>

**File:** `lively-chat-message.js`

**Purpose:** Renders individual chat messages for all chat components

**Extends:** `Morph` (NOT LivelyChat - renders messages, doesn't manage conversations)

---

## Architecture

- Used by workspace, realtime, and opencode to display messages
- Handles two message formats: flat (realtime) and structured (OpenCode)
- Supports expand/collapse for long tool messages
- Filters internal/local function calls from display

---

## Properties

```javascript
_messageData         // Stored message object
_opencodeMessage     // OpenCode format message
_isExpanded          // Expand/collapse state
_showRaw             // Show raw JSON toggle
showDebug            // Show debug header
```

---

## Main APIs

### Flat Message Format (Realtime, Workspace)
```javascript
setMessage(messageObj)
  // messageObj: { role, content, source, streamType, sequence, timestamp, metadata }
```

**Example:**
```javascript
const chatMessage = await lively.create('lively-chat-message');
await chatMessage.setMessage({
  role: 'user',
  content: 'Hello!',
  source: 'audio',
  streamType: 'realtime',
  timestamp: Date.now()
});
```

### OpenCode Message Format
```javascript
setOpenCodeMessage(opencodeMessage, options)
  // opencodeMessage: { info: {...}, parts: [...] }
  // options: { source, streamType }
```

**Example:**
```javascript
await chatMessage.setOpenCodeMessage(opencodeMsg, {
  source: 'code',
  streamType: 'opencode'
});
```

---

## Rendering Methods

```javascript
renderContent(messageObj)
  // Render flat format
  
renderOpenCodeParts(opencodeMsg)
  // Render OpenCode parts
  
renderDebugHeader(messageObj)
  // Show debug metadata
  
renderOpenCodeDebugHeader(opencodeMessage)
  // Show OpenCode debug metadata
  
formatToolMessage(messageObj)
  // Format tool calls/results
```

---

## Part Types Handled

### 1. Text Parts
```javascript
{ type: 'text', text: 'content', id: 'part-uuid' }
```

### 2. Tool Use (Anthropic format)
```javascript
{ type: 'tool_use', id: 'tool-uuid', name: 'read_file', input: {...} }
```
- Rendered as: `### 🔧 Tool Call: read_file`
- Shows arguments as JSON

### 3. Tool Result (Anthropic format)
```javascript
{ type: 'tool_result', tool_use_id: 'tool-uuid', content: '...', is_error: false }
```
- Rendered as: `### ↩️ Tool Result`
- Formats JSON or plain text

### 4. Tool Streaming (OpenCode events)
```javascript
{ type: 'tool', callID: 'xyz', tool: 'lively4_evaluate_code', state: {...} }
```
- Shows status (pending/running/completed)
- Special handling for `lively4_evaluate_code` - parses structured output

### 5. Step Events (debug mode only)
```javascript
{ type: 'step-start', snapshot: '...' }
{ type: 'step-finish', tokens: {...}, cost: '...', snapshot: '...' }
```

**Rendering behavior:**
- **Normal mode** (`showDebug = false`): Step events are completely hidden (not rendered)
- **Debug mode** (`showDebug = true`): Rendered as compact one-liners with key details

**Rendered format in debug mode:**
- `step-start`: "▶️ Step started (snapshot: abc12345)"
- `step-finish`: "⏹️ Step complete: 1,500→250 tokens, 100 thinking, 500 cached, $0.0042"
  - Token format: `input→output tokens`
  - Shows thinking tokens if present and > 0
  - Shows cache read tokens if present and > 0
  - Shows cost if available
  - All on a single line with minimal styling (gray, italic, 11px)

### 6. Realtime Tool Messages
```javascript
metadata: {
  type: 'function_call' | 'function_call_output',
  functionName: '...',
  call_id: '...',
  arguments: {...},
  output: {...}
}
```

---

## Special Features

### 1. Local Function Filtering

Hides internal coordination functions from display:

```javascript
isLocalFunction(functionName)
  // Returns true for: send_opencode_task, get_opencode_status, etc.
  // These are filtered out (return null) in formatToolMessage()
```

**Filtered Functions:**
- `send_opencode_task`
- `get_opencode_status`
- `get_opencode_history`
- `create_opencode_session`
- `get_opencode_sessions`

### 2. Expand/Collapse for Long Content

```javascript
updateExpandState()
  // Auto-collapse content > 100px
  
onMessageClick(evt)
  // Toggle expand on click
```

**Interaction:**
- Click message to expand/collapse
- Automatic collapse for long tool results
- Preserves state during updates

### 3. lively4_evaluate_code Parser

```javascript
parseLively4EvaluateOutput(output)
  // Parses structured output from MCP tool
  // Returns: { result: '...', consoleOutput: '...' }
```

**Special handling for Lively4 code evaluation:**
- Extracts result and console output
- Formats with syntax highlighting
- Shows execution errors

### 4. Positioning/Styling

```javascript
applyPositioning(messageObj)
  // Applies CSS classes based on role + source:
  // audio-user, audio-assistant, audio-tool
  // code-user, code-assistant, code-tool
```

**CSS Classes:**
- `audio-user` - User voice messages
- `audio-assistant` - AI voice responses
- `audio-tool` - Voice tool calls
- `code-user` - User code messages
- `code-assistant` - AI code responses
- `code-tool` - Code tool calls

### 5. Raw JSON Inspector

```javascript
onViewRawButton()
  // Toggle raw JSON display
  
updateRawDisplay()
  // Show _opencodeMessage as JSON
  
onInspect()
  // Open lively.openInspector()
```

---

## Supported Attributes

```javascript
role           // 'user' | 'assistant' | 'tool' | 'system'
source         // 'audio' | 'code'
stream-type    // 'realtime' | 'opencode'
color-mode     // Custom color scheme
has-tools      // Indicates message contains tool executions
```

---

## Usage Pattern

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

---

## Migration

```javascript
livelyMigrate(other)
  // Preserves: _messageData, _isExpanded, _opencodeMessage, _showRaw
  // Handles old _rawMessage name
```

---

## Refactoring Opportunities

### 1. Chat Message Format Handling

**Issue:** Two separate APIs for setting messages

**Current:**
```javascript
setMessage(messageObj)           // For flat format
setOpenCodeMessage(opencodeMsg)  // For OpenCode format
```

**Recommendation:**
- Unify into single `setMessage()` with auto-detection
- Or add `format` parameter: `setMessage(msg, format='auto')`

### 2. Tool-Specific Parser

**Issue:** Hardcoded parser for specific MCP tool

**Current:**
```javascript
parseLively4EvaluateOutput(output)
  // Special parsing for lively4_evaluate_code only
```

**Recommendation:**
- Create extensible parser registry
- Allow tools to register custom formatters
- Move tool-specific logic out of message component

### 3. Local Function List

**Issue:** Hardcoded list of internal functions to hide

**Current:**
```javascript
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

### 4. Complex formatToolMessage Method

**Issue:** Long method handling many tool message types (100+ lines)

**Recommendation:**
- Break into smaller methods per type
- Create format strategy pattern
- Extract to separate formatter classes

### 5. Positioning Logic

**Issue:** CSS class application based on role + source combinations

**Current:**
```javascript
applyPositioning(messageObj) {
  // Remove all: position-left, position-mid-left, etc.
  // Then add: audio-user, audio-assistant, code-tool, etc.
  // 8 different combinations
}
```

**Recommendation:**
- Consider data attributes instead: `data-role="user" data-source="audio"`
- Let CSS handle combinations: `[data-role="user"][data-source="audio"]`

---

## See Also

- [Architecture Overview](../doc/ai-workspace.md)
- [LivelyChat](lively-chat.md) - Base class
- [LivelyAiWorkspace](lively-ai-workspace.md) - Workspace usage
- [OpenaiRealtimeChat](openai-realtime-chat.md) - Realtime usage
- [LivelyOpencode](lively-opencode.md) - OpenCode usage
