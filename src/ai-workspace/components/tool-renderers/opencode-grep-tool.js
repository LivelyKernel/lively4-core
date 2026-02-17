import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeSearchTool } from './opencode-search-tool.js';

// Renderer for Grep tool (mcp_grep, grep)
// Displays grep search results in a compact <details> block
export class OpenCodeGrepTool extends OpenCodeSearchTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_grep' || toolName === 'grep';
  }

  getIcon() { return '🔍'; }

  /**
   * Parse grep output into structured match info.
   * Returns { summary, matches } where matches is array of { file, lines[] }
   */
  parseGrepOutput(rawOutput) {
    if (!rawOutput) return { summary: '', matches: [] };

    const lines = rawOutput.split('\n');
    const summary = lines[0] || '';
    const matches = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // File header lines end with ':'
      if (!line.startsWith('Line ') && line.endsWith(':')) {
        matches.push({ file: line.slice(0, -1), lines: [] });
      } else if (line.startsWith('Line ') && matches.length > 0) {
        matches[matches.length - 1].lines.push(line);
      }
    }

    return { summary, matches };
  }

  getSummary(input, output) {
    const pattern = input.pattern || '';
    const { summary, matches } = this.parseGrepOutput(output);
    const matchCount = matches.reduce((n, m) => n + m.lines.length, 0);
    const label = summary || `${matchCount} matches`;
    return `grep \`${pattern}\` — ${label}`;
  }

  async renderBody(input, output, showDebug) {
    const { matches } = this.parseGrepOutput(output);
    const els = [];

    if (matches.length > 0) {
      const label = showDebug ? '**Matches:**\n' : '';
      const matchMd = matches.map(({ file, lines }) => {
        const fileName = ToolHelpers.getFileName(file);
        const linesMd = lines.map(l => `  ${l}`).join('\n');
        return `**${fileName}** (\`${file}\`)\n${linesMd}`;
      }).join('\n\n');
      els.push(await this.createMarkdownEl(`${label}${matchMd}`));
    } else if (output) {
      els.push(await this.createMarkdownEl(`\`\`\`\n${output}\n\`\`\``));
    }

    return els;
  }
}
