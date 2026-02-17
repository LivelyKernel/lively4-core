import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for lively4_inspect-test-results tool (mcp_lively4_inspect-test-results)
// Displays hierarchical test results with pass/fail status
export class OpenCodeInspectTestsTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_lively4_inspect-test-results' ||
           toolName === 'lively4_inspect-test-results';
  }

  /**
   * Build the <summary> label from input and the first meaningful output line.
   * Covers 3 levels: summary, file, file+suite.
   */
  buildSummaryText(input, output) {
    const { file, suite, failedOnly } = input;

    // Determine icon from output content
    let icon = '🧪';
    if (output) {
      if (output.includes('❌')) icon = '❌';
      else if (output.includes('✅') || output.includes('passed')) icon = '✅';
    }

    let label;
    if (suite && file) {
      label = `${ToolHelpers.getFileName(file)} › ${suite}`;
    } else if (file) {
      // Extract summary line: "X passed, Y failed, Zms"
      const summaryMatch = output && output.match(/\*\*Summary:\*\*\s*([^\n]+)/);
      const summary = summaryMatch ? summaryMatch[1].trim() : ToolHelpers.getFileName(file);
      label = `${ToolHelpers.getFileName(file)} — ${summary}`;
    } else {
      // Top-level summary: extract "X passed, Y failed across N files"
      const totalMatch = output && output.match(/\*\*Total:\*\*\s*([^\n]+)/);
      label = totalMatch ? totalMatch[1].trim() : 'test results';
      if (failedOnly) label += ' (failed only)';
    }

    return `${icon} ${label}`;
  }

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeInspectTestsTool.renderCompact: part.id is missing', part);

    const rawOutput = ToolHelpers.extractResultContent(result);

    // Strip the leading "inspect-test-results successful in Xms (...)" header line
    const body = rawOutput.replace(/^inspect-test-results successful[^\n]*\n\n?/, '').trim();

    const summaryText = this.buildSummaryText(input, body);
    const details = await this.buildDetails(toolId, summaryText, input, showDebug);

    if (body) {
      details.appendChild(await this.createMarkdownEl(body));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeInspectTestsTool.renderCompactStreaming: part.callID is missing', part);

    const body = output.replace(/^inspect-test-results successful[^\n]*\n\n?/, '').trim();
    const summaryText = this.buildSummaryText(input, body);
    const details = await this.buildDetails(toolId, summaryText, input, showDebug, 'Input');

    if (body) {
      details.appendChild(await this.createMarkdownEl(body));
    }

    return details;
  }
}
