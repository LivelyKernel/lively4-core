import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for failed/invalid tool calls (name === 'invalid')
// Shown when the AI sends malformed arguments that fail JSON parsing
export class OpenCodeInvalidTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'invalid';
  }

  async render(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    const intendedTool = data.input.tool || 'unknown';
    const errorMsg = data.input.error || '';
    
    if (!data.toolId) {
      console.warn('OpenCodeInvalidTool.render: toolId is missing', part);
    }

    const debugLabel = isStreaming ? 'Input' : undefined;
    const details = await this.buildDetails(
      data.toolId,
      `⚠️ invalid call to ${intendedTool}`,
      data.input,
      showDebug,
      debugLabel
    );

    if (errorMsg) {
      // Extract the core message, stripping the long JSON echo if present
      const shortError = errorMsg.split('. Error message:').pop()?.trim() || errorMsg;
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${shortError}\n\`\`\``));
    }

    return details;
  }
}
