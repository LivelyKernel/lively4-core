# Vox Tool Rendering

This document describes the separate rendering path for Vox (voice agent) tool calls, which provides the same nice formatting as OpenCode tools while maintaining code independence.

## Overview

**Problem:** Vox tool calls were rendering using legacy `formatToolMessage()` method with simple markdown blocks, while OpenCode tool calls had beautiful, specialized renderers with collapsible details.

**Solution:** Implement a distinct rendering path for vox tool calls that:
- Matches the visual style of OpenCode tool renderers
- Maintains complete separation from OpenCode rendering code
- Uses the same extensible renderer architecture
- Provides proper support for debug mode and interactive features

## Architecture

### Components

#### 1. VoxBaseTool (`tool-renderers/vox-base-tool.js`)

Base class for all vox tool renderers. Provides:
- `matches(messageObj)` - Check if renderer handles this message
- `renderToolCall(messageObj, showDebug)` - Render function call messages
- `renderToolResult(messageObj, showDebug)` - Render function result messages
- Helper methods: `createMarkdownEl()`, `makeCodeBlock()`, `buildDetails()`

**Key Differences from OpenCodeBaseTool:**
- Works with message objects (role, source, metadata) instead of parts
- Separate methods for calls vs results instead of unified rendering
- Adapted for OpenAI Realtime API message structure

#### 2. VoxGenericTool (`tool-renderers/vox-generic-tool.js`)

Generic renderer that handles all vox function calls. Features:
- Function-specific icons (📋 for send_opencode_task, 🔧 for generic)
- Smart argument preview formatting
- Success/error state handling
- Collapsible `<details>` elements matching OpenCode style
- Debug mode support showing full JSON

#### 3. Integration in LivelyChatMessage

**Separate renderer arrays:**
```javascript
this.toolRenderers = [...];      // OpenCode tools (unchanged)
this.voxToolRenderers = [...];   // Vox tools (new)
```

**Distinct rendering paths in `renderContent()`:**
```javascript
// Vox tool path (NEW)
if (role === 'tool' && source === 'audio' && metadata) {
  await this.renderVoxToolMessage(messageObj);
  return;
}

// Legacy tool path (UNCHANGED)
if (role === 'tool' && metadata) {
  content = this.formatToolMessage(messageObj);
  // ...
}
```

**New method `renderVoxToolMessage()`:**
1. Checks for local/internal functions (hides them)
2. Finds matching renderer from `voxToolRenderers`
3. Routes to appropriate method based on `metadata.type`:
   - `function_call` → `renderer.renderToolCall()`
   - `function_call_output` → `renderer.renderToolResult()`
4. Falls back to legacy `formatToolMessage()` if no renderer matches

## Message Structure

### Vox Function Call
```javascript
{
  role: 'tool',
  source: 'audio',
  content: '🔧 Calling functionName...',
  metadata: {
    type: 'function_call',
    functionName: 'send_opencode_task',
    call_id: 'call_abc123',
    arguments: { description: '...', prompt: '...' }
  },
  timestamp: 1234567890
}
```

### Vox Function Result
```javascript
{
  role: 'tool',
  source: 'audio',
  content: '✅ Result',
  metadata: {
    type: 'function_call_output',
    call_id: 'call_abc123',
    output: {
      success: true,
      response: 'Task created successfully...'
    }
  },
  timestamp: 1234567890
}
```

## Visual Features

### Tool Calls
- Collapsible `<details>` with function name and icon in summary
- Arguments preview in closed state (smart formatting)
- Full JSON arguments in debug mode
- Consistent styling with OpenCode tools

### Tool Results
- Success/error indicators (✅/❌)
- Smart result formatting (preview vs full output)
- Error messages highlighted
- Full output shown in debug mode

## Extensibility

Adding new vox-specific tool renderers:

1. Create new class extending `VoxBaseTool`
2. Implement `matches()` to identify specific function types
3. Override `renderToolCall()` and/or `renderToolResult()` for custom formatting
4. Add to `voxToolRenderers` array in `lively-chat-message.js`

Example:
```javascript
export class VoxCustomTool extends VoxBaseTool {
  matches(messageObj) {
    return messageObj.metadata?.functionName === 'my_custom_function';
  }
  
  async renderToolCall(messageObj, showDebug) {
    // Custom rendering logic
  }
}
```

## Benefits

1. **Separation of Concerns:** OpenCode and Vox rendering completely independent
2. **Consistency:** Both use same visual style and patterns
3. **Maintainability:** Each agent type has its own renderer system
4. **Extensibility:** Easy to add new vox-specific renderers
5. **Backward Compatibility:** Legacy tool messages still work via fallback

## Testing

See `demos/claude/vox-tool-rendering-demo.md` for interactive examples showing:
- Function call rendering
- Success result rendering
- Error result rendering
- Comparison with OpenCode style

## Implementation Files

- `src/ai-workspace/components/tool-renderers/vox-base-tool.js` - Base class
- `src/ai-workspace/components/tool-renderers/vox-generic-tool.js` - Generic renderer
- `src/ai-workspace/components/lively-chat-message.js` - Integration (lines 38, 86-88, 571-649)
- `demos/claude/vox-tool-rendering-demo.md` - Demo and test cases
