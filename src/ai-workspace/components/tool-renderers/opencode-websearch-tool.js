import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for WebSearch tool (websearch)
// Output is plain text containing search results (titles, URLs, snippets)
// from Exa AI. The text is already formatted; we show query + truncated results.
export class OpenCodeWebSearchTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'websearch';
  }

  /**
   * Count result items in the output.
   * Exa output typically has URL lines or result markers.
   * We count non-empty paragraphs or URL-like lines as a rough heuristic.
   */
  countResults(output) {
    if (!output) return 0;
    // Each result tends to start with a URL line
    const urlLines = output.split('\n').filter(l => l.match(/^https?:\/\//));
    return urlLines.length || output.split('\n\n').filter(Boolean).length;
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
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeWebSearchTool.renderCompact: part.id is missing', part);

    const rawOutput = ToolHelpers.extractResultContent(result);
    const hasError = result && result.is_error;
    const count = this.countResults(rawOutput);
    const summary = `🔎 "${query}"${count ? ` — ${count} result${count === 1 ? '' : 's'}` : ''}`;

    const details = await this.buildDetails(toolId, summary, input, showDebug);

    if (rawOutput && !hasError) {
      const { text, wasTruncated, totalLines } = this.truncate(rawOutput, 40);
      const suffix = wasTruncated ? `\n\n*… ${totalLines - 40} more lines*` : '';
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
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeWebSearchTool.renderCompactStreaming: part.callID is missing', part);

    const count = this.countResults(output);
    const summary = `🔎 "${query}"${count ? ` — ${count} result${count === 1 ? '' : 's'}` : ''}`;

    const details = await this.buildDetails(toolId, summary, input, showDebug, 'Input');

    if (output) {
      const { text, wasTruncated, totalLines } = this.truncate(output, 40);
      const suffix = wasTruncated ? `\n\n*… ${totalLines - 40} more lines*` : '';
      details.appendChild(await this.createMarkdownEl(text + suffix));
    }

    return details;
  }
}
