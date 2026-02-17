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
    const input = part.input || {};
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeRunTestsTool.renderCompact: part.id is missing', part);

    const rawOutput = ToolHelpers.extractResultContent(result);
    const { summary: outputSummary } = this.parseOutput(rawOutput);
    const summaryText = this.buildSummaryText(input, outputSummary);

    const details = await this.buildDetails(toolId, summaryText, input, showDebug);

    if (rawOutput) {
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${rawOutput}\n\`\`\``));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeRunTestsTool.renderCompactStreaming: part.callID is missing', part);

    const { summary: outputSummary } = this.parseOutput(output);
    const summaryText = this.buildSummaryText(input, outputSummary);

    const details = await this.buildDetails(toolId, summaryText, input, showDebug, 'Input');

    if (output) {
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${output}\n\`\`\``));
    }

    return details;
  }
}
