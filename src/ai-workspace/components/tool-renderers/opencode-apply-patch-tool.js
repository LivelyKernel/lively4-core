import * as ToolHelpers from '../chat-tool-helpers.js';
import LivelyOpencode from '../lively-opencode.js';
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

  async toRelativePath(filePath) {
    let relativePath = filePath || '';

    const mapping = LivelyOpencode.getKnownPathUrlMapping();
    if (mapping?.localRoot && relativePath.startsWith(mapping.localRoot)) {
      relativePath = relativePath.slice(mapping.localRoot.length);
    }

    return relativePath.replace(/^\/+/, '');
  }

  async createPatchedMarkdownEl(markdownText) {
    const md = await this.createMarkdownEl(markdownText);
    lively.html.fixLinks([md.shadowRoot], undefined, path => lively.openBrowser(path));
    return md;
  }

  async formatFileLink(filePath) {
    const fileName = ToolHelpers.getFileName(filePath);
    const fileUrl = await LivelyOpencode.filePathToUrl(filePath, {
      workingDirectory: LivelyOpencode.sharedWorkingDirectory,
      lazyLoadMapping: false
    });
    const fallbackUrl = `/${await this.toRelativePath(filePath)}`;
    return `[${fileName}](${fileUrl || fallbackUrl})`;
  }

  async sanitizePatchText(patchText) {
    if (!patchText) return patchText;

    const mapping = LivelyOpencode.getKnownPathUrlMapping();
    const localRoot = mapping?.localRoot;
    if (!localRoot) return patchText;
    return patchText
      .split(`${localRoot}/`).join('')
      .split(localRoot).join('');
  }

  async renderOps(ops) {
    if (!ops.length) return null;
    const rows = await Promise.all(ops.map(async ({ op, path, dest }) => {
      const icon = this.opIcon(op);
      const source = await this.formatFileLink(path);
      const detail = dest ? ` → ${await this.formatFileLink(dest)}` : '';
      return `- ${icon} ${source}${detail}`;
    }));
    return this.createPatchedMarkdownEl(rows.join('\n'));
  }

  async buildPatchBlock(patchText) {
    if (!patchText) return null;
    return this.createPatchedMarkdownEl(`\`\`\`diff\n${await this.sanitizePatchText(patchText)}\n\`\`\``);
  }

  async render(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    const patchText = data.input.patchText || '';

    if (!data.toolId) {
      console.warn('OpenCodeApplyPatchTool: toolId is missing', part);
    }

    const ops = this.parsePatch(patchText);
    const summary = this.buildSummary(ops);
    const debugLabel = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(data.toolId, summary, data.input, showDebug, debugLabel);
    details.open = true;

    const opsEl = await this.renderOps(ops);
    if (opsEl) details.appendChild(opsEl);

    const patchBlock = await this.buildPatchBlock(patchText);
    if (patchBlock) details.appendChild(patchBlock);

    if (data.isError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${data.output}\n\`\`\``));
    }

    return details;
  }
}
