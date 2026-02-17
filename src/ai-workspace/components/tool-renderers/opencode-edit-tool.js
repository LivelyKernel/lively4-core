import * as ToolHelpers from '../chat-tool-helpers.js';
import diff from 'src/external/diff-match-patch.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for Edit tool (mcp_edit, edit_file, edit)
// Displays file edits inline using diff-match-patch, showing only changed regions
export class OpenCodeEditTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_edit' ||
           toolName === 'edit_file' ||
           toolName === 'edit';
  }

  /**
   * Generate an inline-diff DOM element using diff-match-patch.
   * diff_prettyHtml() returns an HTML string, which we inject via innerHTML.
   * @returns {HTMLElement}
   */
  generateInlineDiffEl(oldString, newString) {
    try {
      if (oldString === undefined || oldString === null) oldString = '';
      if (newString === undefined || newString === null) newString = '';

      const dmp = new diff.diff_match_patch();
      const diffs = dmp.diff_main(oldString, newString);
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
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeEditTool.renderCompact: part.id is missing', part);

    const oldString = input.oldString || '';
    const newString = input.newString || '';
    const replaceAll = input.replaceAll || false;

    const details = await this.buildDetails(
      toolId, `✏️ ${fileName}${replaceAll ? ' (replace all)' : ''}`, input, showDebug
    );

    details.appendChild(await this.createMarkdownEl('**Changes:**'));
    details.appendChild(this.generateInlineDiffEl(oldString, newString));

    if (result) {
      if (result.is_error) {
        const errorContent = ToolHelpers.extractResultContent(result);
        details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${errorContent}\n\`\`\``));
      } else if (showDebug) {
        details.appendChild(await this.createMarkdownEl('✅ Edit applied successfully'));
      }
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const filePath = input.filePath || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeEditTool.renderCompactStreaming: part.callID is missing', part);

    const oldString = input.oldString || '';
    const newString = input.newString || '';
    const replaceAll = input.replaceAll || false;

    const details = await this.buildDetails(
      toolId, `✏️ ${fileName}${replaceAll ? ' (replace all)' : ''}`, input, showDebug, 'Input'
    );

    details.appendChild(await this.createMarkdownEl('**Changes:**'));
    details.appendChild(this.generateInlineDiffEl(oldString, newString));

    if (output && showDebug) {
      details.appendChild(await this.createMarkdownEl(`**Output:**\n\`\`\`\n${output}\n\`\`\``));
    }

    return details;
  }
}
