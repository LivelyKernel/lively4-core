import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for WebFetch tool (webfetch)
// Shows the URL fetched and a preview of the returned content (markdown/text/html)
export class OpenCodeWebFetchTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'webfetch';
  }

  /**
   * Extract a short hostname label from a URL.
   */
  urlLabel(url) {
    try {
      const u = new URL(url);
      return u.hostname + (u.pathname !== '/' ? u.pathname : '');
    } catch {
      return url;
    }
  }

  /**
   * Truncate content to maxLines for the preview.
   */
  truncate(content, maxLines = 30) {
    if (!content) return { text: '', wasTruncated: false, totalLines: 0 };
    const lines = content.split('\n');
    const totalLines = lines.length;
    if (totalLines <= maxLines) return { text: content, wasTruncated: false, totalLines };
    return { text: lines.slice(0, maxLines).join('\n'), wasTruncated: true, totalLines };
  }

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const url = input.url || '';
    const format = input.format || 'markdown';
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeWebFetchTool.renderCompact: part.id is missing', part);

    const rawOutput = ToolHelpers.extractResultContent(result);
    const hasError = result && result.is_error;

    const label = this.urlLabel(url);
    const summary = `🌐 ${label}`;
    const details = await this.buildDetails(toolId, summary, input, showDebug);

    if (rawOutput && !hasError) {
      const { text, wasTruncated, totalLines } = this.truncate(rawOutput, 30);
      const suffix = wasTruncated ? `\n\n*… ${totalLines - 30} more lines*` : '';
      // If format is markdown, render as markdown directly; otherwise use code block
      if (format === 'markdown') {
        details.appendChild(await this.createMarkdownEl(text + suffix));
      } else {
        details.appendChild(await this.createMarkdownEl(`\`\`\`\n${text}\n\`\`\`${suffix}`));
      }
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
    const url = input.url || '';
    const format = input.format || 'markdown';
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeWebFetchTool.renderCompactStreaming: part.callID is missing', part);

    const label = this.urlLabel(url);
    const summary = `🌐 ${label}`;
    const details = await this.buildDetails(toolId, summary, input, showDebug, 'Input');

    if (output) {
      const { text, wasTruncated, totalLines } = this.truncate(output, 30);
      const suffix = wasTruncated ? `\n\n*… ${totalLines - 30} more lines*` : '';
      if (format === 'markdown') {
        details.appendChild(await this.createMarkdownEl(text + suffix));
      } else {
        details.appendChild(await this.createMarkdownEl(`\`\`\`\n${text}\n\`\`\`${suffix}`));
      }
    }

    return details;
  }
}
