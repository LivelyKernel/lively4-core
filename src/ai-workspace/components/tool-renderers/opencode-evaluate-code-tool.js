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
    const input = part.input || {};
    const code = input.code || '';
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeEvaluateCodeTool.renderCompact: part.id is missing', part);

    const rawOutput = ToolHelpers.extractResultContent(result);
    const icon = this.statusIcon(rawOutput);
    const label = this.codeLabel(code);
    const summaryText = `${icon} ${label}`;

    const details = await this.buildDetails(toolId, summaryText, input, showDebug);

    // Code block
    if (code) {
      details.appendChild(await this.createMarkdownEl(
        `\`\`\`javascript\n${code.trim()}\n\`\`\``
      ));
    }

    // Parsed output: result + console
    if (rawOutput) {
      const parsed = ToolHelpers.parseLively4EvaluateOutput(rawOutput);
      if (parsed) {
        const outputParts = [];
        if (parsed.result) outputParts.push(`**Result:**\n\`\`\`\n${parsed.result}\n\`\`\``);
        if (parsed.consoleOutput) outputParts.push(`**Console output:**\n\`\`\`\n${parsed.consoleOutput}\n\`\`\``);
        if (outputParts.length) {
          details.appendChild(await this.createMarkdownEl(outputParts.join('\n\n')));
        }
      } else if (showDebug) {
        details.appendChild(await this.createMarkdownEl(`**Output:**\n\`\`\`\n${rawOutput}\n\`\`\``));
      }
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const code = input.code || '';
    const output = state.output || '';
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeEvaluateCodeTool.renderCompactStreaming: part.callID is missing', part);

    const icon = this.statusIcon(output);
    const label = this.codeLabel(code);
    const summaryText = `${icon} ${label}`;

    const details = await this.buildDetails(toolId, summaryText, input, showDebug, 'Input');

    // Code block
    if (code) {
      details.appendChild(await this.createMarkdownEl(
        `\`\`\`javascript\n${code.trim()}\n\`\`\``
      ));
    }

    // Parsed output
    if (output) {
      const parsed = ToolHelpers.parseLively4EvaluateOutput(output);
      if (parsed) {
        const outputParts = [];
        if (parsed.result) outputParts.push(`**Result:**\n\`\`\`\n${parsed.result}\n\`\`\``);
        if (parsed.consoleOutput) outputParts.push(`**Console output:**\n\`\`\`\n${parsed.consoleOutput}\n\`\`\``);
        if (outputParts.length) {
          details.appendChild(await this.createMarkdownEl(outputParts.join('\n\n')));
        }
      } else if (showDebug) {
        details.appendChild(await this.createMarkdownEl(`**Output:**\n\`\`\`\n${output}\n\`\`\``));
      }
    }

    return details;
  }
}
