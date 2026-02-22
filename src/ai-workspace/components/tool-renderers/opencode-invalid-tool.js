import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for failed/invalid tool calls (name === 'invalid')
// Shown when the AI sends malformed arguments that fail JSON parsing
export class OpenCodeInvalidTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'invalid';
  }

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const intendedTool = input.tool || 'unknown';
    const errorMsg = input.error || '';
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeInvalidTool.renderCompact: part.id is missing', part);

    const details = await this.buildDetails(
      toolId,
      `⚠️ invalid call to ${intendedTool}`,
      input,
      showDebug
    );

    if (errorMsg) {
      // Extract the core message, stripping the long JSON echo if present
      const shortError = errorMsg.split('. Error message:').pop()?.trim() || errorMsg;
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${shortError}\n\`\`\``));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || part.input || {};
    const intendedTool = input.tool || 'unknown';
    const errorMsg = input.error || '';
    const toolId = part.callID;

    const details = await this.buildDetails(
      toolId,
      `⚠️ invalid call to ${intendedTool}`,
      input,
      showDebug,
      'Input'
    );

    if (errorMsg) {
      const shortError = errorMsg.split('. Error message:').pop()?.trim() || errorMsg;
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${shortError}\n\`\`\``));
    }

    return details;
  }
}
