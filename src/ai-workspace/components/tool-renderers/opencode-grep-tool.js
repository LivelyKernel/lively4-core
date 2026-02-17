import * as ToolHelpers from '../chat-tool-helpers.js';

// Renderer for Grep tool (mcp_grep, grep)
// Displays grep search results in a compact <details> block
export const OpenCodeGrepTool = {
  name: 'GrepTool',

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_grep' || toolName === 'grep';
  },

  async renderToolUse(part, component) {
    const result = component.toolResultById[part.id];
    return this.renderCompact(part, result, component.showDebug);
  },

  renderToolResult(part, component) {
    return null; // Skip - already rendered in tool_use
  },

  async renderToolStreaming(part, component) {
    if (part.state?.status === 'completed') {
      return this.renderCompactStreaming(part, component.showDebug);
    }
    return null; // Fall back to generic renderer
  },

  /**
   * Create an initialized lively-markdown element with content set.
   */
  async createMarkdownEl(markdownText) {
    const md = await lively.create('lively-markdown');
    await md.setContent(markdownText);
    return md;
  },

  /**
   * Parse grep output into structured match info.
   * Returns { summary, matches } where matches is an array of { file, lines }
   */
  parseGrepOutput(rawOutput) {
    if (!rawOutput) return { summary: '', matches: [] };

    const lines = rawOutput.split('\n');
    const summary = lines[0] || '';
    const matches = [];
    let currentFile = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // File header lines end with ':'
      if (!line.startsWith('Line ') && line.endsWith(':')) {
        currentFile = line.slice(0, -1);
        matches.push({ file: currentFile, lines: [] });
      } else if (line.startsWith('Line ') && matches.length > 0) {
        matches[matches.length - 1].lines.push(line);
      }
    }

    return { summary, matches };
  },

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const pattern = input.pattern || '';
    const searchPath = input.path || '';
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeGrepTool.renderCompact: part.id is missing, data-tool-id will not be set', part);

    const rawOutput = ToolHelpers.extractResultContent(result);
    const { summary, matches } = this.parseGrepOutput(rawOutput);
    const matchCount = matches.reduce((n, m) => n + m.lines.length, 0);

    const details = <details class="compact-tool-call" {...(toolId ? {"data-tool-id": toolId} : {})}>
      <summary>🔍 grep `{pattern}` — {summary || `${matchCount} matches`}</summary>
    </details>;

    if (showDebug) {
      details.appendChild(await this.createMarkdownEl(
        `**Path:** \`${searchPath}\`\n\n**Arguments:**\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``
      ));
    }

    if (matches.length > 0) {
      const label = showDebug ? '**Matches:**\n' : '';
      const matchMd = matches.map(({ file, lines }) => {
        const fileName = ToolHelpers.getFileName(file);
        const linesMd = lines.map(l => `  ${l}`).join('\n');
        return `**${fileName}** (\`${file}\`)\n${linesMd}`;
      }).join('\n\n');
      details.appendChild(await this.createMarkdownEl(`${label}${matchMd}`));
    } else if (rawOutput) {
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${rawOutput}\n\`\`\``));
    }

    return details;
  },

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const pattern = input.pattern || '';
    const searchPath = input.path || '';
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeGrepTool.renderCompactStreaming: part.callID is missing, data-tool-id will not be set', part);

    const { summary, matches } = this.parseGrepOutput(output);
    const matchCount = matches.reduce((n, m) => n + m.lines.length, 0);

    const details = <details class="compact-tool-call" {...(toolId ? {"data-tool-id": toolId} : {})}>
      <summary>🔍 grep `{pattern}` — {summary || `${matchCount} matches`}</summary>
    </details>;

    if (showDebug) {
      details.appendChild(await this.createMarkdownEl(
        `**Path:** \`${searchPath}\`\n\n**Input:**\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``
      ));
    }

    if (matches.length > 0) {
      const label = showDebug ? '**Matches:**\n' : '';
      const matchMd = matches.map(({ file, lines }) => {
        const fileName = ToolHelpers.getFileName(file);
        const linesMd = lines.map(l => `  ${l}`).join('\n');
        return `**${fileName}** (\`${file}\`)\n${linesMd}`;
      }).join('\n\n');
      details.appendChild(await this.createMarkdownEl(`${label}${matchMd}`));
    } else if (output) {
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${output}\n\`\`\``));
    }

    return details;
  }
};
