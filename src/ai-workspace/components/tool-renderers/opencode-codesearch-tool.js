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
    return this._renderShared(part, result, showDebug, false);
  }

  async renderCompactStreaming(part, showDebug) {
    return this._renderShared(part, null, showDebug, true);
  }

  async _renderShared(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    const query = data.input.query || '';
    const tokensNum = data.input.tokensNum || 5000;

    if (!data.toolId) {
      console.warn('OpenCodeCodeSearchTool: toolId is missing', part);
    }

    const summary = `🔎 code: "${query.length > 60 ? query.slice(0, 60) + '…' : query}"`;
    const debugLabel = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(data.toolId, summary, data.input, showDebug, debugLabel);

    if (data.output && !data.isError) {
      const { text, wasTruncated, totalLines } = this.truncate(data.output, 40);
      const suffix = wasTruncated ? `\n\n*… ${totalLines - 40} more lines (${tokensNum} tokens requested)*` : '';
      details.appendChild(await this.createMarkdownEl(text + suffix));
    }

    if (data.isError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${data.output}\n\`\`\``));
    }

    return details;
  }
}
