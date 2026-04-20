import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for lively4_run-tests tool (mcp_lively4_run-tests)
// Displays test run results with pass/fail status
export class OpenCodeRunTestsTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_lively4_run-tests' || toolName === 'lively4_run-tests';
  }

  /**
   * Parse the output string to determine pass/fail status.
   * Returns { passed: boolean, summary: string }
   */
  parseOutput(output) {
    if (!output) return { passed: null, summary: '' };
    const firstLine = output.split('\n')[0] || output;
    const passed = firstLine.includes('✅') || firstLine.includes('All') && firstLine.includes('passed');
    return { passed: !firstLine.includes('❌') && passed, summary: firstLine };
  }

  /**
   * Build the summary label shown in <summary>.
   */
  buildSummaryText(input, outputSummary) {
    const { testPath, runAll, errorsOnly, grep } = input;

    let label;
    if (runAll) {
      label = 'all tests';
    } else if (testPath) {
      label = ToolHelpers.getFileName(testPath);
    } else {
      label = 'tests';
    }

    if (grep) label += ` (grep: ${grep})`;
    if (errorsOnly) label += ' (errors only)';

    // If we have a parsed output summary, use its status icon
    if (outputSummary) {
      const icon = outputSummary.startsWith('✅') ? '✅' :
                   outputSummary.startsWith('❌') ? '❌' : '🧪';
      return `${icon} ${label}`;
    }

    return `🧪 ${label}`;
  }

  async renderCompact(part, result, showDebug) {
    return this._renderShared(part, result, showDebug, false);
  }

  async renderCompactStreaming(part, showDebug) {
    return this._renderShared(part, null, showDebug, true);
  }

  async _renderShared(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);

    if (!data.toolId) {
      console.warn('OpenCodeRunTestsTool: toolId is missing', part);
    }

    const { summary: outputSummary } = this.parseOutput(data.output);
    const summaryText = this.buildSummaryText(data.input, outputSummary);

    const debugLabel = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(data.toolId, summaryText, data.input, showDebug, debugLabel);

    if (data.output) {
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${data.output}\n\`\`\``));
    }

    return details;
  }
}
