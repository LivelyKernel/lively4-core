import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for CodeSearch tool (codesearch)
// Uses Exa Code API - returns code examples and documentation snippets.
// Output is typically markdown with code blocks.
export class OpenCodeCodeSearchTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'codesearch';
  }

  /**
   * Truncate output to a max number of lines.
   */
  truncate(output, maxLines = 40) {
    if (!output) return { text: '', wasTruncated: false, totalLines: 0 };
    const lines = output.split('\n');
    const totalLines = lines.length;
    if (totalLines <= maxLines) return { text: output, wasTruncated: false, totalLines };
    return { text: lines.slice(0, maxLines).join('\n'), wasTruncated: true, totalLines };
  }

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const query = input.query || '';
    const tokensNum = input.tokensNum || 5000;
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeCodeSearchTool.renderCompact: part.id is missing', part);

    const rawOutput = ToolHelpers.extractResultContent(result);
    const hasError = result && result.is_error;
    const summary = `🔎 code: "${query.length > 60 ? query.slice(0, 60) + '…' : query}"`;

    const details = await this.buildDetails(toolId, summary, input, showDebug);

    if (rawOutput && !hasError) {
      const { text, wasTruncated, totalLines } = this.truncate(rawOutput, 40);
      const suffix = wasTruncated ? `\n\n*… ${totalLines - 40} more lines (${tokensNum} tokens requested)*` : '';
      details.appendChild(await this.createMarkdownEl(text + suffix));
    }

    if (hasError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${rawOutput}\n\`\`\``));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const query = input.query || '';
    const tokensNum = input.tokensNum || 5000;
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeCodeSearchTool.renderCompactStreaming: part.callID is missing', part);

    const summary = `🔎 code: "${query.length > 60 ? query.slice(0, 60) + '…' : query}"`;
    const details = await this.buildDetails(toolId, summary, input, showDebug, 'Input');

    if (output) {
      const { text, wasTruncated, totalLines } = this.truncate(output, 40);
      const suffix = wasTruncated ? `\n\n*… ${totalLines - 40} more lines (${tokensNum} tokens requested)*` : '';
      details.appendChild(await this.createMarkdownEl(text + suffix));
    }

    return details;
  }
}
