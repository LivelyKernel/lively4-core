# System Message Rendering Implementation

## Overview

Implemented automatic detection and special rendering for system-like messages in the voice agent (OpenAI Realtime Chat). These are technically user messages but contain system information that should be displayed differently.

## Pattern Detection

Messages matching this pattern are detected and parsed:

```
[System: <content>]
```

**Example:**
```json
{
  "role": "user",
  "content": "[System: The coding agent finished working on: \"Vox tool call rendering path\"]",
  "source": "audio",
  "streamType": "realtime"
}
```

## Implementation Details

### Detection Logic

1. **Source filtering**: Only messages from `source: "audio"` (voice agent) are checked
2. **Role filtering**: Only `role: "user"` messages are checked
3. **Pattern matching**: Content must exactly match `[System: <content>]` (start to end)
4. **Content extraction**: System content is extracted from inside the brackets

### Rendering Behavior

When a system message is detected:

1. **Role change**: The message's role attribute is changed from "user" to "system"
2. **Special styling**: System messages get a distinct visual style:
   - Background: `#f0f4fa` (light blue-gray)
   - Border: `#607d8b` (blue-gray)
   - Font style: Italic
   - Opacity: 0.9 (slightly transparent)
3. **Content formatting**: The content is rendered in italic markdown: `*<content>*`

### Files Modified

1. **lively-chat-message.js**:
   - Added `parseSystemMessage(messageObj)` method to detect and parse the pattern
   - Added `renderSystemMessage(systemContent, originalMessage)` method for special rendering
   - Modified `renderContent()` to check for system messages before normal user message formatting
   - Updated `applyPositioning()` to handle 'system' role

2. **lively-chat-message.html**:
   - Added CSS styling for `[role="system"]` messages
   - Updated positioning classes to include 'audio-system'

3. **openai-realtime-chat-test.js**:
   - Added comprehensive test suite for system message parsing
   - Tests cover: detection, whitespace handling, edge cases, rendering

## Usage Examples

### Valid System Messages (Will be parsed)

```javascript
{
  role: 'user',
  content: '[System: Agent started task]',
  source: 'audio'
}
```

```javascript
{
  role: 'user',
  content: '[System: The coding agent finished working on: "feature implementation"]',
  source: 'audio'
}
```

### Invalid Patterns (Will NOT be parsed)

```javascript
// Wrong source
{
  role: 'user',
  content: '[System: This will not parse]',
  source: 'code'  // Not from audio
}

// Wrong role
{
  role: 'assistant',
  content: '[System: This will not parse]',
  source: 'audio'
}

// Incomplete pattern
{
  role: 'user',
  content: 'System: Missing brackets',
  source: 'audio'
}

// Content outside brackets
{
  role: 'user',
  content: 'Before [System: content] after',
  source: 'audio'
}
```

## Testing

### Run Tests

```bash
npm test -- src/ai-workspace/test/openai-realtime-chat-test.js
```

Or using MCP tools:
```javascript
mcp__lively4__run-tests(testPath: "src/ai-workspace/test/openai-realtime-chat-test.js")
```

### Visual Test

Browse to: [system-message-test.md](edit://demos/claude/system-message-test.md)

This demo file includes:
- Unit tests for parsing logic
- Visual comparison of system vs. user vs. assistant messages
- Edge case testing

## Design Rationale

### Why Pattern Detection Instead of Role?

The messages come from the OpenAI Realtime API as user messages (role: "user"), but some contain system information injected by the voice agent itself. We cannot change the role at the API level, so we detect and transform them during rendering.

### Why Only Audio Source?

This feature is specifically for the voice agent (OpenAI Realtime Chat). The code agent (OpenCode) has its own message formatting and doesn't use this pattern.

### Why [System: ...] Pattern?

This pattern is:
- **Distinctive**: Unlikely to appear in normal user speech
- **Easy to parse**: Simple regex matching
- **Human-readable**: Clear intent when debugging
- **Backwards compatible**: Existing messages without the pattern render normally

## Future Enhancements

Potential improvements:

1. **Support multiple system message types**: `[System:Info: ...]`, `[System:Warning: ...]`, `[System:Error: ...]`
2. **Configurable patterns**: Allow customization via preferences
3. **Rich system message rendering**: Icons, colors based on message type
4. **Database migration**: Retroactively update old messages to use proper role

## Related Files

- Implementation: [lively-chat-message.js](edit://src/ai-workspace/components/lively-chat-message.js)
- Styles: [lively-chat-message.html](edit://src/ai-workspace/components/lively-chat-message.html)
- Tests: [openai-realtime-chat-test.js](edit://src/ai-workspace/test/openai-realtime-chat-test.js)
- Demo: [system-message-test.md](edit://demos/claude/system-message-test.md)
