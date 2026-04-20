import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for lively4_evaluate-code tool (mcp_lively4_evaluate-code)
// Shows the code snippet and parsed result/console output
export class OpenCodeEvaluateCodeTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_lively4_evaluate-code' ||
           toolName === 'lively4_evaluate-code' ||
           toolName === 'lively4_evaluate_code';
  }

  /**
   * Extract the status icon from the first non-empty output line.
   * Returns '✅', '❌', or '🔧'.
   */
  statusIcon(output) {
    if (!output) return '🔧';
    const firstLine = output.split('\n').find(l => l.trim()) || '';
    if (firstLine.includes('✅')) return '✅';
    if (firstLine.includes('❌')) return '❌';
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

  async renderCompact(part, result, showDebug) {
    return this._renderShared(part, result, showDebug, false);
  }

  async renderCompactStreaming(part, showDebug) {
    return this._renderShared(part, null, showDebug, true);
  }

  async _renderShared(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    const code = data.input.code || '';

    if (!data.toolId) {
      console.warn('OpenCodeEvaluateCodeTool: toolId is missing', part);
    }

    const icon = this.statusIcon(data.output);
    const label = this.codeLabel(code);
    const summaryText = `${icon} ${label}`;

    const debugLabel = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(data.toolId, summaryText, data.input, showDebug, debugLabel);

    // Code block
    if (code) {
      details.appendChild(await this.createMarkdownEl(
        `\`\`\`javascript\n${code.trim()}\n\`\`\``
      ));
    }

    // Parsed output: result + console
    if (data.output) {
      const parsed = ToolHelpers.parseLively4EvaluateOutput(data.output);
      if (parsed) {
        const outputParts = [];
        if (parsed.result) outputParts.push(`**Result:**\n\`\`\`\n${parsed.result}\n\`\`\``);
        if (parsed.consoleOutput) outputParts.push(`**Console output:**\n\`\`\`\n${parsed.consoleOutput}\n\`\`\``);
        if (outputParts.length) {
          details.appendChild(await this.createMarkdownEl(outputParts.join('\n\n')));
        }
      } else if (showDebug) {
        details.appendChild(await this.createMarkdownEl(`**Output:**\n\`\`\`\n${data.output}\n\`\`\``));
      }
    }

    return details;
  }
}
