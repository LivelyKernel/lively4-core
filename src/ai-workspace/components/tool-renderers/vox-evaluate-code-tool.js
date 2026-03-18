import * as ToolHelpers from '../chat-tool-helpers.js';
import { VoxBaseTool } from './vox-base-tool.js';

/**
 * Renderer for evaluate_code tool in Vox (realtime/voice agent).
 * Shows the code snippet and parsed result/console output.
 * 
 * Similar to OpenCodeEvaluateCodeTool but adapted for Vox message structure:
 * - Tool calls: role='tool', metadata={ type: 'function_call', functionName, call_id, arguments }
 * - Tool results: role='tool', metadata={ type: 'function_call_output', call_id, output }
 */
export class VoxEvaluateCodeTool extends VoxBaseTool {

  matches(messageObj) {
    if (messageObj.role !== 'tool') return false;
    if (messageObj.source !== 'audio') return false;
    
    const metadata = messageObj.metadata || {};
    
    // Match function_call messages by function name
    if (metadata.type === 'function_call') {
      const functionName = metadata.functionName || metadata.function_name || '';
      return functionName === 'evaluate_code';
    }
    
    // Match function_call_output messages by output structure
    // evaluate_code outputs have { success, result?, error?, message? }
    if (metadata.type === 'function_call_output') {
      const output = metadata.output || {};
      // Check if output has the characteristic structure of evaluate_code
      return typeof output.success === 'boolean' || 
             ('result' in output) || 
             ('error' in output && 'code' in output);
    }
    
    return false;
  }

  /**
   * Extract the status icon from the output.
   * Returns '✅', '❌', or '🔧'.
   */
  statusIcon(output) {
    if (!output) return '🔧';
    
    // Check output object structure
    if (typeof output === 'object') {
      if (output.success === true) return '✅';
      if (output.success === false || output.error) return '❌';
    }
    
    // Fallback for string output
    if (typeof output === 'string') {
      if (output.includes('✅')) return '✅';
      if (output.includes('❌')) return '❌';
    }
    
    return '🔧';
  }

  /**
   * Build a short label from the code: first non-comment, non-empty line.
   */
  codeLabel(code) {
    if (!code) return 'evaluate-code';
    const firstMeaningfulLine = code.split('\n')
      .map(l => l.trim())
      .find(l => l && !l.startsWith('//') && !l.startsWith('/*') && !l.startsWith('*'));
    if (!firstMeaningfulLine) return 'evaluate-code';
    return firstMeaningfulLine.length > 60
      ? firstMeaningfulLine.substring(0, 60) + '…'
      : firstMeaningfulLine;
  }

  async renderToolCall(messageObj, showDebug) {
    const metadata = messageObj.metadata || {};
    const args = metadata.arguments || {};
    const code = args.code || '';
    const callId = metadata.call_id || '';

    const icon = '🔧';
    const label = this.codeLabel(code);
    const summaryText = `${icon} ${label}`;

    const details = await this.buildDetails(callId, summaryText, args, showDebug, 'Arguments');

    // Code block
    if (code) {
      details.appendChild(await this.createMarkdownEl(
        `\`\`\`javascript\n${code.trim()}\n\`\`\``
      ));
    }

    return details;
  }

  async renderToolResult(messageObj, showDebug) {
    const metadata = messageObj.metadata || {};
    const callId = metadata.call_id || '';
    const output = metadata.output || {};
    const code = output.code || '';

    const icon = this.statusIcon(output);
    const label = code ? this.codeLabel(code) : 'evaluate-code';
    const summaryText = `${icon} ${label}`;

    const details = <details class="compact-tool-call" {...(callId ? {"data-tool-id": callId} : {})} open={false}>
      <summary>{summaryText}</summary>
    </details>;

    // Build combined output with code + result (like OpenCode style)
    const outputParts = [];

    // Show code if available
    if (code) {
      outputParts.push(`\`\`\`javascript\n${code.trim()}\n\`\`\``);
    }

    // Show result or error
    if (output.error) {
      const errorText = typeof output.error === 'string' ? output.error : JSON.stringify(output.error);
      outputParts.push(`**Error:**\n\`\`\`\n${errorText}\n\`\`\``);
    } else if (output.result !== undefined) {
      outputParts.push(`**Result:**\n\`\`\`\n${output.result}\n\`\`\``);
    }

    // Combine all parts into one markdown element
    if (outputParts.length) {
      details.appendChild(await this.createMarkdownEl(outputParts.join('\n\n')));
    }

    // Show message if available (debug only)
    if (output.message && showDebug) {
      details.appendChild(await this.createMarkdownEl(
        `**Message:** ${output.message}`
      ));
    }

    // Add call ID if available and debug mode
    if (callId && showDebug) {
      details.appendChild(await this.createMarkdownEl(`*Call ID: ${callId}*`));
    }

    return details;
  }
}
