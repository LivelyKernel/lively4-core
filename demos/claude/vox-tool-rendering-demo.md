# Vox Tool Rendering Demo

This demo shows the new separate rendering path for Vox (voice agent) tool calls, which now match the style of OpenCode tool calls while maintaining separate code paths.

## Test: Vox Tool Call Rendering

<script>
(async () => {
  const container = <div></div>;

  // Create a message component
  const message = await lively.create('lively-chat-message');
  message.showDebug = false;

  // Test data: Vox function call (voice agent)
  const voxToolCall = {
    role: 'tool',
    source: 'audio',
    content: '🔧 Calling send_opencode_task...',
    metadata: {
      type: 'function_call',
      functionName: 'send_opencode_task',
      call_id: 'call_abc123',
      arguments: {
        description: 'Fix the bug in user authentication',
        prompt: 'The login function is not properly validating email addresses. Please fix the regex pattern to accept all valid email formats.'
      }
    },
    timestamp: Date.now()
  };

  // Set the message
  await message.setMessage(voxToolCall);

  container.appendChild(<h3>Vox Tool Call (Function Call)</h3>);
  container.appendChild(message);

  // Create another message for the result
  const message2 = await lively.create('lively-chat-message');
  message2.showDebug = false;

  const voxToolResult = {
    role: 'tool',
    source: 'audio',
    content: '✅ Result',
    metadata: {
      type: 'function_call_output',
      call_id: 'call_abc123',
      output: {
        success: true,
        response: 'Task created successfully. The code agent is now working on fixing the email validation bug.'
      }
    },
    timestamp: Date.now()
  };

  await message2.setMessage(voxToolResult);

  container.appendChild(<h3>Vox Tool Result (Success)</h3>);
  container.appendChild(message2);

  // Create a message for an error case
  const message3 = await lively.create('lively-chat-message');
  message3.showDebug = false;

  const voxToolError = {
    role: 'tool',
    source: 'audio',
    content: '❌ Error',
    metadata: {
      type: 'function_call_output',
      call_id: 'call_xyz789',
      output: {
        success: false,
        error: 'Failed to connect to OpenCode server. Please check that the server is running.'
      }
    },
    timestamp: Date.now()
  };

  await message3.setMessage(voxToolError);

  container.appendChild(<h3>Vox Tool Result (Error)</h3>);
  container.appendChild(message3);

  // Add comparison with OpenCode style (for reference)
  container.appendChild(<h3>Comparison Notes</h3>);
  container.appendChild(<div style="padding: 10px; background: #f0f0f0; border-radius: 5px;">
    <p><strong>Key Features:</strong></p>
    <ul>
      <li>✅ Separate code path for vox tools (maintains independence from OpenCode)</li>
      <li>✅ Matching visual style with collapsible details</li>
      <li>✅ Function-specific icons and formatting</li>
      <li>✅ Debug mode support (show with context menu)</li>
      <li>✅ Smart handling of success/error cases</li>
    </ul>
  </div>);

  return container;
})();
</script>

## Implementation Details

The new vox tool rendering system consists of:

1. **VoxBaseTool** (`vox-base-tool.js`) - Base class providing common functionality
2. **VoxGenericTool** (`vox-generic-tool.js`) - Generic renderer for all function calls
3. **Integration in LivelyChatMessage** - Separate rendering path that:
   - Detects vox messages by checking `source === 'audio'` and `role === 'tool'`
   - Routes to `voxToolRenderers` instead of legacy `formatToolMessage()`
   - Maintains backward compatibility with existing tool messages

## Code Structure

```javascript
// In lively-chat-message.js:

// Separate renderer arrays
this.toolRenderers = [...];      // OpenCode tools
this.voxToolRenderers = [...];   // Vox tools

// Separate rendering paths
if (source === 'audio' && role === 'tool') {
  // Use vox tool renderers
  await this.renderVoxToolMessage(messageObj);
} else if (role === 'tool') {
  // Use legacy formatToolMessage
  content = this.formatToolMessage(messageObj);
}
```

This ensures that:
- OpenCode tool rendering remains unchanged
- Vox tool rendering gets the same nice formatting
- Both paths are independent and maintainable
