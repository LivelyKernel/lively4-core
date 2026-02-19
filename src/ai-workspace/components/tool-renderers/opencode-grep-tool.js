import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeSearchTool } from './opencode-search-tool.js';

/**
 * Renderer for Grep tool (mcp_grep, grep).
 * Displays results grouped by file inside a compact <details> block.
 */
export class OpenCodeGrepTool extends OpenCodeSearchTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_grep' || toolName === 'grep';
  }

  getIcon() { return '🔍'; }

  /**
   * Parse grep output into structured match info.
   * Expected format:
   *   Line 0:  summary (e.g. "Found N matches in M files")
   *   Subsequent lines:
   *     - file header: full path ending with ':'
   *     - match lines: start with 'Line '
   *
   * @returns {{ summary: string, matches: Array<{ file: string, lines: string[] }> }}
   */
  parseGrepOutput(rawOutput) {
    if (!rawOutput) return { summary: '', matches: [] };

    const [summary, ...rest] = rawOutput.split('\n');
    const matches = [];

    for (const raw of rest) {
      const line = raw.trim();
      if (!line) continue;
      if (!line.startsWith('Line ') && line.endsWith(':')) {
        matches.push({ file: line.slice(0, -1), lines: [] });
      } else if (line.startsWith('Line ') && matches.length > 0) {
        matches.at(-1).lines.push(line);
      }
    }

    return { summary, matches };
  }

  getSummary(input, output) {
    const pattern = input.pattern || '';
    const { summary, matches } = this.parseGrepOutput(output);
    const count = matches.reduce((n, m) => n + m.lines.length, 0);
    const label = summary || `${count} match${count === 1 ? '' : 'es'}`;
    return `grep \`${pattern}\` — ${label}`;
  }

  async renderBody(input, output /*, showDebug */) {
    const { matches } = this.parseGrepOutput(output);

    if (matches.length > 0) {
      const els = [];
      for (const { file, lines } of matches) {
        const fileName = ToolHelpers.getFileName(file);
        els.push(await this.createMarkdownEl(`**${fileName}** \`${file}\``));
        els.push(this.makeCodeBlock(lines.join('\n')));
      }
      return els;
    }

    return output ? [this.makeCodeBlock(output)] : [];
  }
}
