import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for Batch tool (batch) — experimental, opt-in
// Executes up to 25 tool calls concurrently.
// Input: { tool_calls: [{ tool, parameters }] }
// Output: concatenated results from each sub-call.
export class OpenCodeBatchTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'batch';
  }

  buildSummary(toolCalls) {
    const count = toolCalls.length;
    if (!count) return '⚡ batch — empty';
    // Tally unique tool types
    const tally = {};
    for (const tc of toolCalls) tally[tc.tool] = (tally[tc.tool] || 0) + 1;
    const parts = Object.entries(tally).map(([name, n]) => n > 1 ? `${n}×${name}` : name);
    return `⚡ batch (${count}): ${parts.slice(0, 5).join(', ')}${parts.length > 5 ? ', …' : ''}`;
  }

  async renderToolCallList(toolCalls, showDebug) {
    if (!toolCalls.length) return null;
    const rows = toolCalls.map(({ tool, parameters }) => {
      // Show a short param summary — first string value or key count
      let paramHint = '';
      if (parameters && typeof parameters === 'object') {
        const vals = Object.values(parameters);
        const firstStr = vals.find(v => typeof v === 'string');
        if (firstStr) {
          paramHint = firstStr.length > 50 ? firstStr.slice(0, 50) + '…' : firstStr;
        } else {
          paramHint = `${Object.keys(parameters).length} params`;
        }
      }
      return `| \`${tool}\` | ${paramHint} |`;
    });
    return this.createMarkdownEl(`| Tool | Parameters |\n|---|---|\n${rows.join('\n')}`);
  }

  async renderCompact(part, result, showDebug) {
    return this._renderShared(part, result, showDebug, false);
  }

  async renderCompactStreaming(part, showDebug) {
    return this._renderShared(part, null, showDebug, true);
  }

  async _renderShared(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    const toolCalls = data.input.tool_calls || [];

    if (!data.toolId) {
      console.warn('OpenCodeBatchTool: toolId is missing', part);
    }

    const summary = this.buildSummary(toolCalls);
    const debugLabel = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(data.toolId, summary, data.input, showDebug, debugLabel);

    const listEl = await this.renderToolCallList(toolCalls, showDebug);
    if (listEl) details.appendChild(listEl);

    if (data.output && showDebug) {
      const { text, wasTruncated, totalLines } = this._truncate(data.output, 30);
      const suffix = wasTruncated ? `\n\n*… ${totalLines - 30} more lines*` : '';
      details.appendChild(await this.createMarkdownEl(`**Output:**\n\`\`\`\n${text}\n\`\`\`${suffix}`));
    }

    if (data.isError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${data.output}\n\`\`\``));
    }

    return details;
  }

  _truncate(output, maxLines) {
    const lines = output.split('\n');
    const totalLines = lines.length;
    if (totalLines <= maxLines) return { text: output, wasTruncated: false, totalLines };
    return { text: lines.slice(0, maxLines).join('\n'), wasTruncated: true, totalLines };
  }
}
