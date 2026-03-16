# Message Toolset - Get Message By ID Example

This demonstrates the new `get_message_by_id` function added to the MessageToolset.

## Overview

The `get_message_by_id` function retrieves complete details of a specific message by its ID, including:
- Full message object with all fields
- Internal reasoning steps (thinking parts)
- Tool call outputs with full details
- Timestamps and meta-information
- Parsed sections for easier reading

## Usage

```javascript
// In the AI Workspace context, the voice agent (Vox) can call:
const result = await messageToolset.getMessageById({
  message_id: 'msg_opencode_002'
});

// Result structure:
{
  success: true,
  message_id: 'msg_opencode_002',
  source: 'scribe',  // or 'vox', 'user', 'system'
  
  // Complete original message
  full_message: {
    eventSource: 'opencode',
    info: { id: 'msg_opencode_002', role: 'assistant', time: {...} },
    parts: [...],
    timestamp: '2024-01-01T10:01:00Z'
  },
  
  // Parsed sections for easier reading
  parsed: {
    role: 'assistant',
    timestamp: '2024-01-01T10:01:00Z',
    content: 'I will fix the bug',
    
    // Internal reasoning (if available)
    internal_reasoning: [
      'First I need to analyze the login.js file'
    ],
    
    // Tool calls with full details
    tool_calls: [
      {
        name: 'mcp_edit',
        input: { filePath: 'login.js' },
        output: 'File updated',
        status: 'completed',
        full_details: { /* complete tool part object */ }
      }
    ],
    
    // List of all part types in message
    part_types: ['text', 'thinking', 'tool']
  },
  
  // Metadata about the message
  metadata: {
    event_source: 'opencode',
    has_parts: true,
    parts_count: 3,
    has_tool_calls: true,
    has_reasoning: true
  }
}
```

## Message ID Formats

The function handles different ID formats depending on message source:

### OpenCode Messages (Scribe)
- ID field: `message.info.id`
- Example: `'msg_opencode_002'`
- Structure includes `parts` array with text, thinking, and tool parts

### Realtime Messages (Vox)
- ID field: `message.item_id` or `message.id`
- Example: `'msg_realtime_002'`
- Structure includes `content` string

## Example: Finding Tool Details

When you want to inspect what a specific tool call did:

```javascript
// Get message with tool calls
const result = await messageToolset.getMessageById({
  message_id: 'msg_with_tools'
});

if (result.success && result.parsed.tool_calls) {
  result.parsed.tool_calls.forEach(tool => {
    console.log(`Tool: ${tool.name}`);
    console.log(`Input:`, tool.input);
    console.log(`Output:`, tool.output);
    console.log(`Status: ${tool.status}`);
  });
}
```

## Example: Inspecting Internal Reasoning

When you want to see Claude's internal reasoning:

```javascript
const result = await messageToolset.getMessageById({
  message_id: 'msg_with_reasoning'
});

if (result.success && result.parsed.internal_reasoning) {
  console.log('Internal reasoning steps:');
  result.parsed.internal_reasoning.forEach((step, i) => {
    console.log(`${i + 1}. ${step}`);
  });
}
```

## Error Handling

```javascript
const result = await messageToolset.getMessageById({
  message_id: 'nonexistent_id'
});

if (!result.success) {
  console.error(result.error);
  // "Message with ID 'nonexistent_id' not found in conversation history"
}
```

## Tool Definition

The tool is automatically available to the voice agent (Vox) with this definition:

```javascript
{
  type: "function",
  name: "get_message_by_id",
  description: "Retrieve the complete details of a specific message by its ID. " +
               "Returns everything available about the message including internal reasoning steps, " +
               "tool call outputs, timestamps, and all meta-information. Useful for detailed inspection " +
               "of specific messages.",
  parameters: {
    type: "object",
    properties: {
      message_id: {
        type: "string",
        description: "The unique ID of the message to retrieve"
      }
    },
    required: ["message_id"]
  }
}
```

## Implementation Details

- Location: [message-toolset.js](edit://src/ai-workspace/components/realtime-chat-tools/message-toolset.js)
- Tests: [message-toolset-test.js](edit://src/ai-workspace/test/message-toolset-test.js)
- Added: 2026-03-16
