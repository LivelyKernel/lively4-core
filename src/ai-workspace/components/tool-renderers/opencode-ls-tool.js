import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeSearchTool } from './opencode-search-tool.js';

// Renderer for List tool (list, ls)
// Output is an indented directory tree like:
//   /path/to/dir/
//     subdir/
//       file.js
//     other.ts
export class OpenCodeLsTool extends OpenCodeSearchTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'list' || toolName === 'ls';
  }

  getIcon() { return '📁'; }

  getSummary(input, output) {
    const dirPath = input.path || '.';
    const dirName = dirPath.split('/').filter(Boolean).pop() || dirPath;
    // Count lines that look like files (not trailing slash = dirs)
    const lines = (output || '').split('\n').filter(l => l.trim() && !l.trim().endsWith('/'));
    const count = lines.length;
    return `${dirName}/ — ${count} file${count === 1 ? '' : 's'}`;
  }

  async renderBody(input, output, showDebug) {
    if (!output) return [];
    const label = showDebug ? '**Contents:**\n' : '';
    const el = await this.createMarkdownEl(`${label}\`\`\`\n${output.trimEnd()}\n\`\`\``);
    return [el];
  }
}
