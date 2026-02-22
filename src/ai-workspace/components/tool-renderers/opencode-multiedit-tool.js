import * as ToolHelpers from '../chat-tool-helpers.js';
import diff from 'src/external/diff-match-patch.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for MultiEdit tool (multiedit)
// Displays multiple sequential find-and-replace edits on one file as stacked inline diffs
export class OpenCodeMultiEditTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'multiedit';
  }

  /**
   * Generate an inline-diff DOM element using diff-match-patch.
   */
  generateInlineDiffEl(oldString, newString) {
    try {
      const dmp = new diff.diff_match_patch();
      const diffs = dmp.diff_main(oldString || '', newString || '');
      dmp.diff_cleanupSemantic(diffs);
      const container = <div class="inline-diff"></div>;
      container.innerHTML = dmp.diff_prettyHtml(diffs);
      return container;
    } catch (error) {
      console.error('generateInlineDiffEl error:', error);
      return <div class="inline-diff"><em>Error generating diff: {error.message}</em></div>;
    }
  }

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const filePath = input.filePath || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const edits = input.edits || [];
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeMultiEditTool.renderCompact: part.id is missing', part);

    const hasError = result && result.is_error;
    const summary = `✏️ ${fileName} (${edits.length} edit${edits.length === 1 ? '' : 's'})`;
    const details = await this.buildDetails(toolId, summary, input, showDebug);

    for (const [i, edit] of edits.entries()) {
      if (edits.length > 1) {
        details.appendChild(await this.createMarkdownEl(`**Edit ${i + 1}${edit.replaceAll ? ' (replace all)' : ''}:**`));
      }
      details.appendChild(this.generateInlineDiffEl(edit.oldString || '', edit.newString || ''));
    }

    if (hasError) {
      const errorContent = ToolHelpers.extractResultContent(result);
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${errorContent}\n\`\`\``));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const filePath = input.filePath || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const edits = input.edits || [];
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeMultiEditTool.renderCompactStreaming: part.callID is missing', part);

    const summary = `✏️ ${fileName} (${edits.length} edit${edits.length === 1 ? '' : 's'})`;
    const details = await this.buildDetails(toolId, summary, input, showDebug, 'Input');

    for (const [i, edit] of edits.entries()) {
      if (edits.length > 1) {
        details.appendChild(await this.createMarkdownEl(`**Edit ${i + 1}${edit.replaceAll ? ' (replace all)' : ''}:**`));
      }
      details.appendChild(this.generateInlineDiffEl(edit.oldString || '', edit.newString || ''));
    }

    return details;
  }
}
