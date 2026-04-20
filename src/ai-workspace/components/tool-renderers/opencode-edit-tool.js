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
   * Parse edit-specific input parameters and add them to the data object.
   * Mutates the data object by adding: filePath, fileName, oldString, newString, replaceAll
   */
  parseEditInput(data) {
    data.filePath = data.input.filePath || 'unknown';
    data.fileName = ToolHelpers.getFileName(data.filePath);
    data.oldString = data.input.oldString || '';
    data.newString = data.input.newString || '';
    data.replaceAll = data.input.replaceAll || false;
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

  async render(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    this.parseEditInput(data);

    if (!data.toolId) {
      console.warn('OpenCodeEditTool: toolId is missing', part);
    }

    const debugLabel = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(
      data.toolId, 
      `✏️ ${data.fileName}${data.replaceAll ? ' (replace all)' : ''}`, 
      data.input, 
      showDebug,
      debugLabel
    );

    details.appendChild(await this.createMarkdownEl('**Changes:**'));
    details.appendChild(this.generateInlineDiffEl(data.oldString, data.newString));

    if (data.isError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${data.output}\n\`\`\``));
    } else if (data.output && showDebug) {
      details.appendChild(await this.createMarkdownEl(`**Output:**\n\`\`\`\n${data.output}\n\`\`\``));
    } else if (!isStreaming && result && !data.isError && showDebug) {
      details.appendChild(await this.createMarkdownEl('✅ Edit applied successfully'));
    }

    return details;
  }
}
