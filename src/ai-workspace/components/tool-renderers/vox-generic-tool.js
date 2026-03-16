import * as ToolHelpers from '../chat-tool-helpers.js';
import { VoxBaseTool } from './vox-base-tool.js';

/**
 * Generic renderer for Vox (voice agent) tool calls.
 * Handles all function_call and function_call_output messages.
 * 
 * Renders tool calls with a nice compact format matching the OpenCode style.
 */
export class VoxGenericTool extends VoxBaseTool {

  matches(messageObj) {
    // Match any tool message from audio source
    if (messageObj.role !== 'tool') return false;
    if (messageObj.source !== 'audio') return false;
    return true;
  }

  async renderToolCall(messageObj, showDebug) {
    const metadata = messageObj.metadata || {};
    const functionName = metadata.functionName || 'unknown';
    const callId = metadata.call_id || '';
    const args = metadata.arguments || {};

    // Create summary text
    const icon = this.getIconForFunction(functionName);
    const summaryText = `${icon} ${functionName}`;

    // Build details element
    const details = await this.buildDetails(callId, summaryText, args, showDebug, 'Arguments');

    // Add function-specific body if available
    const body = await this.renderFunctionBody(functionName, args, showDebug);
    if (body) {
      body.forEach(el => details.appendChild(el));
    }

    return details;
  }

  async renderToolResult(messageObj, showDebug) {
    const metadata = messageObj.metadata || {};
    const callId = metadata.call_id || '';
    const output = metadata.output || {};

    // Create summary text based on success/error
    let summaryText = '↩️ Result';
    let icon = '✅';
    
    if (output.error || !output.success) {
      icon = '❌';
      summaryText = `${icon} Error`;
    } else {
      summaryText = `${icon} Result`;
    }

    // Build details element
    const details = <details class="compact-tool-call" {...(callId ? {"data-tool-id": callId} : {})}>
      <summary>{summaryText}</summary>
    </details>;

    // Add result body
    const body = await this.renderResultBody(output, showDebug);
    if (body) {
      body.forEach(el => details.appendChild(el));
    }

    return details;
  }

  /**
   * Get icon emoji for a function name
   */
  getIconForFunction(functionName) {
    const iconMap = {
      // OpenCode task functions
      'send_opencode_task': '📋',
      'get_opencode_status': '📊',
      'get_opencode_history': '📜',
      'create_opencode_session': '🆕',
      'list_opencode_sessions': '📑',
      
      // Generic
      'default': '🔧'
    };
    
    return iconMap[functionName] || iconMap.default;
  }

  /**
   * Render function-specific body content
   */
  async renderFunctionBody(functionName, args, showDebug) {
    const els = [];

    // For send_opencode_task, show the task description
    if (functionName === 'send_opencode_task' && args.description) {
      els.push(await this.createMarkdownEl(`**Task:** ${args.description}`));
    }

    // For other functions, show a formatted preview of arguments
    if (!showDebug && Object.keys(args).length > 0) {
      const preview = this.formatArgsPreview(args);
      if (preview) {
        els.push(await this.createMarkdownEl(preview));
      }
    }

    return els;
  }

  /**
   * Render result body content
   */
  async renderResultBody(output, showDebug) {
    const els = [];

    if (output.error) {
      // Error case
      const errorText = typeof output.error === 'string' ? output.error : JSON.stringify(output.error);
      els.push(await this.createMarkdownEl(`**Error:** ${errorText}`));
    } else if (output.response) {
      // Response from OpenCode or other API
      els.push(await this.createMarkdownEl(String(output.response)));
    } else if (output.result !== undefined) {
      // Generic result
      const resultText = typeof output.result === 'object' 
        ? JSON.stringify(output.result, null, 2) 
        : String(output.result);
      
      if (resultText.length > 200 && !showDebug) {
        // Long result - show preview
        els.push(await this.createMarkdownEl(`\`\`\`\n${resultText.substring(0, 200)}...\n\`\`\``));
      } else {
        // Short result - show full
        els.push(await this.createMarkdownEl(`\`\`\`\n${resultText}\n\`\`\``));
      }
    }

    if (showDebug) {
      // Show full output in debug mode
      els.push(await this.createMarkdownEl(
        `**Full Output:**\n\`\`\`json\n${JSON.stringify(output, null, 2)}\n\`\`\``
      ));
    }

    return els;
  }

  /**
   * Format a preview of function arguments
   */
  formatArgsPreview(args) {
    const keys = Object.keys(args);
    if (keys.length === 0) return null;
    
    if (keys.length === 1 && typeof args[keys[0]] === 'string') {
      // Single string argument - show it directly
      return `\`${args[keys[0]]}\``;
    }
    
    // Multiple arguments - show as key: value list
    const lines = keys.slice(0, 3).map(key => {
      const value = args[key];
      const valueStr = typeof value === 'string' 
        ? value.substring(0, 50) 
        : JSON.stringify(value).substring(0, 50);
      return `- **${key}:** \`${valueStr}${valueStr.length >= 50 ? '...' : ''}\``;
    });
    
    if (keys.length > 3) {
      lines.push(`- *...and ${keys.length - 3} more*`);
    }
    
    return lines.join('\n');
  }
}
