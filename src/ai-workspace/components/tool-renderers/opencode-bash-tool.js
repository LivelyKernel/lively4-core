import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeSearchTool } from './opencode-search-tool.js';

// Renderer for Bash tool (mcp_bash, bash)
// Shows description in the default collapsed view; full output inside <details>
export class OpenCodeBashTool extends OpenCodeSearchTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_bash' || toolName === 'bash';
  }

  getIcon() { return '🔧'; }

  getSummary(input /*, output */) {
    const description = input.description || input.command || '';
    return description;
  }

  async renderBody(input, output, showDebug) {
    const els = [];
    const command = input.command || '';
    const workdir = input.workdir || '';

    const lines = [];
    if (command) lines.push(`\`$ ${command}\``);
    if (workdir) lines.push(`*Working directory: \`${workdir}\`*`);
    if (output)  lines.push(`\`\`\`\n${output}\n\`\`\``);

    if (lines.length > 0) {
      els.push(await this.createMarkdownEl(lines.join('\n\n')));
    }

    return els;
  }
}
