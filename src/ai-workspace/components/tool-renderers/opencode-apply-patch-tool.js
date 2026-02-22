import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for ApplyPatch tool (apply_patch)
// Parses the structured patch format and shows per-file summaries
// Patch format:
//   *** Begin Patch
//   *** Add File: path/to/new.js
//   *** Update File: path/to/existing.js
//   *** Delete File: path/to/old.js
//   *** Move File: old/path -> new/path
//   *** End Patch
export class OpenCodeApplyPatchTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'apply_patch';
  }

  /**
   * Parse patch text into a list of file operations.
   * Returns array of { op, path, lines } where op is 'add'|'update'|'delete'|'move'
   */
  parsePatch(patchText) {
    if (!patchText) return [];
    const ops = [];
    const lines = patchText.split('\n');
    for (const line of lines) {
      const addMatch    = line.match(/^\*\*\* Add File:\s*(.+)/);
      const updateMatch = line.match(/^\*\*\* (Update|Modify) File:\s*(.+)/);
      const deleteMatch = line.match(/^\*\*\* Delete File:\s*(.+)/);
      const moveMatch   = line.match(/^\*\*\* Move File:\s*(.+)\s*->\s*(.+)/);
      if (addMatch)    ops.push({ op: 'add',    path: addMatch[1].trim() });
      else if (moveMatch)   ops.push({ op: 'move',   path: moveMatch[1].trim(), dest: moveMatch[2].trim() });
      else if (updateMatch) ops.push({ op: 'update', path: updateMatch[2].trim() });
      else if (deleteMatch) ops.push({ op: 'delete', path: deleteMatch[1].trim() });
    }
    return ops;
  }

  opIcon(op) {
    return { add: '➕', update: '✏️', delete: '🗑️', move: '↪️' }[op] || '📄';
  }

  buildSummary(ops) {
    if (!ops.length) return 'apply_patch — empty';
    const counts = {};
    for (const { op } of ops) counts[op] = (counts[op] || 0) + 1;
    const parts = [];
    if (counts.add)    parts.push(`${counts.add} added`);
    if (counts.update) parts.push(`${counts.update} updated`);
    if (counts.delete) parts.push(`${counts.delete} deleted`);
    if (counts.move)   parts.push(`${counts.move} moved`);
    return `🩹 patch — ${parts.join(', ')}`;
  }

  async renderOps(ops) {
    if (!ops.length) return null;
    const rows = ops.map(({ op, path, dest }) => {
      const icon = this.opIcon(op);
      const name = ToolHelpers.getFileName(path);
      const detail = dest ? ` → \`${dest}\`` : '';
      return `| ${icon} | **${name}** \`${path}\`${detail} |`;
    }).join('\n');
    return this.createMarkdownEl(`| | File |\n|---|---|\n${rows}`);
  }

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const patchText = input.patchText || '';
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeApplyPatchTool.renderCompact: part.id is missing', part);

    const ops = this.parsePatch(patchText);
    const summary = this.buildSummary(ops);
    const details = await this.buildDetails(toolId, summary, input, showDebug);

    const opsEl = await this.renderOps(ops);
    if (opsEl) details.appendChild(opsEl);

    if (result && result.is_error) {
      const errorContent = ToolHelpers.extractResultContent(result);
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${errorContent}\n\`\`\``));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const patchText = input.patchText || '';
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeApplyPatchTool.renderCompactStreaming: part.callID is missing', part);

    const ops = this.parsePatch(patchText);
    const summary = this.buildSummary(ops);
    const details = await this.buildDetails(toolId, summary, input, showDebug, 'Input');

    const opsEl = await this.renderOps(ops);
    if (opsEl) details.appendChild(opsEl);

    return details;
  }
}
