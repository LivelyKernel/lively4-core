import * as ToolHelpers from '../chat-tool-helpers.js';

// Generic fallback renderer for all tools
// Always matches - should be registered last
export const OpenCodeGenericTool = {
  name: 'GenericTool',
  
  matches(part) {
    return true;
  },
  
  renderToolUse(part, component) {
    let html = `### 🔧 Tool Call: ${part.name}\n\n`;
    if (part.input && Object.keys(part.input).length > 0) {
      html += '**Arguments:**\n```json\n';
      html += JSON.stringify(part.input, null, 2);
      html += '\n```\n\n';
    }
    if (part.id) {
      html += `*Call ID: ${part.id}*\n\n`;
    }
    return html;
  },
  
  renderToolResult(part, component) {
    let html = `### ↩️ Tool Result\n\n`;
    if (part.is_error) {
      html += '**⚠️ Error:**\n';
    }

    // Handle different content formats
    let content = '';
    if (typeof part.content === 'string') {
      content = part.content;
    } else if (Array.isArray(part.content)) {
      content = part.content
        .map(block => {
          if (block.type === 'text') return block.text;
          if (block.type === 'image') return '[Image]';
          return JSON.stringify(block);
        })
        .join('\n');
    } else {
      content = JSON.stringify(part.content);
    }

    // Format content in code block
    if (content.includes('```')) {
      html += content + '\n\n';
    } else {
      try {
        const parsed = JSON.parse(content);
        html += '```json\n';
        html += JSON.stringify(parsed, null, 2);
        html += '\n```\n\n';
      } catch (e) {
        html += '```\n';
        html += content;
        html += '\n```\n\n';
      }
    }

    if (part.tool_use_id) {
      html += `*Tool Use ID: ${part.tool_use_id}*\n\n`;
    }
    return html;
  },
  
  renderToolStreaming(part, component) {
    const toolName = part.tool || 'Tool';
    const status = part.state?.status || 'unknown';
    const state = part.state || {};
    
    let html = `### 🔧 ${toolName}\n\n`;
    html += `**Status:** ${status}\n\n`;

    // Show input if available
    if (state.input && Object.keys(state.input).length > 0) {
      // Special handling for lively4_evaluate_code - show code directly
      if (toolName === 'lively4_evaluate_code' && state.input.code) {
        html += '**Code:**\n```javascript\n';
        html += state.input.code.trim();
        html += '\n```\n\n';
      } else {
        html += '**Input:**\n```json\n';
        html += JSON.stringify(state.input, null, 2);
        html += '\n```\n\n';
      }
    }

    // Show output if available (and status is completed)
    if (status === 'completed' && state.output) {
      // Special handling for lively4_evaluate_code - parse structured output
      if (toolName === 'lively4_evaluate_code') {
        const parsed = ToolHelpers.parseLively4EvaluateOutput(state.output);
        if (parsed) {
          if (parsed.result) {
            html += '**Result:**\n```\n';
            html += parsed.result;
            html += '\n```\n\n';
          }
          if (parsed.consoleOutput) {
            html += '**Console output:**\n```\n';
            html += parsed.consoleOutput;
            html += '\n```\n\n';
          }
        } else {
          // Fallback if parsing fails
          html += '**Output:**\n';
          html += state.output + '\n\n';
        }
      } else {
        html += '**Output:**\n```\n';
        html += state.output;
        html += '\n```\n\n';
      }
    }

    // Show timing and call ID in debug mode
    if (component.showDebug) {
      if (state.time) {
        const duration = state.time.end - state.time.start;
        html += `*Duration: ${duration}ms*\n\n`;
      }
      if (part.callID) {
        html += `*Call ID: ${part.callID}*\n\n`;
      }
    }
    
    return html;
  }
};
