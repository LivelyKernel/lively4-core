import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeSearchTool } from './opencode-search-tool.js';

// Renderer for Glob tool (mcp_glob, glob)
// Displays glob file search results in a compact <details> block
export class OpenCodeGlobTool extends OpenCodeSearchTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_glob' || toolName === 'glob';
  }

  getIcon() { return '📂'; }

  /**
   * Parse glob output into a list of file paths.
   * Output is typically newline-separated file paths.
   */
  parseGlobOutput(rawOutput) {
    if (!rawOutput) return [];
    return rawOutput.split('\n').map(l => l.trim()).filter(Boolean);
  }

  getSummary(input, output) {
    const pattern = input.pattern || '';
    const files = this.parseGlobOutput(output);
    return `glob \`${pattern}\` — ${files.length} file${files.length === 1 ? '' : 's'}`;
  }

  async renderBody(input, output, showDebug) {
    const files = this.parseGlobOutput(output);
    const els = [];

    if (files.length > 0) {
      const label = showDebug ? '**Files:**\n' : '';
      const filesMd = files.map(f => {
        const fileName = ToolHelpers.getFileName(f);
        return `- **${fileName}** \`${f}\``;
      }).join('\n');
      els.push(await this.createMarkdownEl(`${label}${filesMd}`));
    } else if (output) {
      els.push(await this.createMarkdownEl(`\`\`\`\n${output}\n\`\`\``));
    }

    return els;
  }
}
