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

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const filePath = input.filePath || input.path || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const content = input.content || '';
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeWriteTool.renderCompact: part.id is missing', part);

    const language = ToolHelpers.detectLanguage(fileName);
    const { truncated, originalLineCount, wasTruncated } = this.truncateContent(content, 20);

    const summaryText = wasTruncated
      ? `💾 ${fileName} (${originalLineCount} lines)`
      : `💾 ${fileName}`;

    const details = await this.buildDetails(toolId, summaryText, input, showDebug);

    if (truncated) {
      const label = showDebug ? '**Content:**\n' : '';
      const suffix = wasTruncated ? `\n*… ${originalLineCount - 20} more lines*` : '';
      details.appendChild(await this.createMarkdownEl(
        `${label}\`\`\`${language}\n${truncated}\n\`\`\`${suffix}`
      ));
    }

    if (result && result.is_error) {
      const errorContent = ToolHelpers.extractResultContent(result);
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${errorContent}\n\`\`\``));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const content = input.content || '';
    const filePath = input.filePath || input.path || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeWriteTool.renderCompactStreaming: part.callID is missing', part);

    const language = ToolHelpers.detectLanguage(fileName);
    const { truncated, originalLineCount, wasTruncated } = this.truncateContent(content, 20);

    const summaryText = wasTruncated
      ? `💾 ${fileName} (${originalLineCount} lines)`
      : `💾 ${fileName}`;

    const details = await this.buildDetails(toolId, summaryText, input, showDebug, 'Input');

    if (truncated) {
      const label = showDebug ? '**Content:**\n' : '';
      const suffix = wasTruncated ? `\n*… ${originalLineCount - 20} more lines*` : '';
      details.appendChild(await this.createMarkdownEl(
        `${label}\`\`\`${language}\n${truncated}\n\`\`\`${suffix}`
      ));
    }

    return details;
  }
}
