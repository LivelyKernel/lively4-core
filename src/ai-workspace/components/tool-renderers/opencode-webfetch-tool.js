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

  async render(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    const url = data.input.url || '';
    const format = data.input.format || 'markdown';

    if (!data.toolId) {
      console.warn('OpenCodeWebFetchTool: toolId is missing', part);
    }

    const label = this.urlLabel(url);
    const summary = `🌐 ${label}`;
    const debugLabel = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(data.toolId, summary, data.input, showDebug, debugLabel);

    if (data.output && !data.isError) {
      const { text, wasTruncated, totalLines } = this.truncate(data.output, 30);
      const suffix = wasTruncated ? `\n\n*… ${totalLines - 30} more lines*` : '';
      if (format === 'markdown') {
        details.appendChild(await this.createMarkdownEl(text + suffix));
      } else {
        details.appendChild(await this.createMarkdownEl(`\`\`\`\n${text}\n\`\`\`${suffix}`));
      }
    }

    if (data.isError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${data.output}\n\`\`\``));
    }

    return details;
  }
}
