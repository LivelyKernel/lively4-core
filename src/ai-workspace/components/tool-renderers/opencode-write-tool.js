import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for Write tool (mcp_write, write_file, write)
// Displays file writes in a compact <details> block with a content preview
export class OpenCodeWriteTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_write' ||
           toolName === 'write_file' ||
           toolName === 'write';
  }

  /**
   * Truncate content to a limited number of lines for the preview.
   */
  truncateContent(content, maxLines = 20) {
    if (!content) return { truncated: '', originalLineCount: 0, wasTruncated: false };
    const lines = content.split('\n');
    const originalLineCount = lines.length;
    if (lines.length <= maxLines) {
      return { truncated: content, originalLineCount, wasTruncated: false };
    }
    return { truncated: lines.slice(0, maxLines).join('\n'), originalLineCount, wasTruncated: true };
  }

  async render(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    const filePath = data.input.filePath || data.input.path || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const content = data.input.content || '';

    if (!data.toolId) {
      console.warn('OpenCodeWriteTool: toolId is missing', part);
    }

    const language = ToolHelpers.detectLanguage(fileName);
    const { truncated, originalLineCount, wasTruncated } = this.truncateContent(content, 20);

    const summaryText = wasTruncated
      ? `💾 ${fileName} (${originalLineCount} lines)`
      : `💾 ${fileName}`;

    const debugLabel = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(data.toolId, summaryText, data.input, showDebug, debugLabel);

    if (truncated) {
      const label = showDebug ? '**Content:**\n' : '';
      const suffix = wasTruncated ? `\n*… ${originalLineCount - 20} more lines*` : '';
      details.appendChild(await this.createMarkdownEl(
        `${label}\`\`\`${language}\n${truncated}\n\`\`\`${suffix}`
      ));
    }

    if (data.isError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${data.output}\n\`\`\``));
    }

    return details;
  }
}
