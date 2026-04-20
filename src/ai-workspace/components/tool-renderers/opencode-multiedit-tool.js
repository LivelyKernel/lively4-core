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

  async render(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    const filePath = data.input.filePath || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const edits = data.input.edits || [];

    if (!data.toolId) {
      console.warn('OpenCodeMultiEditTool: toolId is missing', part);
    }

    const summary = `✏️ ${fileName} (${edits.length} edit${edits.length === 1 ? '' : 's'})`;
    const debugLabel = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(data.toolId, summary, data.input, showDebug, debugLabel);

    for (const [i, edit] of edits.entries()) {
      if (edits.length > 1) {
        details.appendChild(await this.createMarkdownEl(`**Edit ${i + 1}${edit.replaceAll ? ' (replace all)' : ''}:**`));
      }
      details.appendChild(this.generateInlineDiffEl(edit.oldString || '', edit.newString || ''));
    }

    if (data.isError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${data.output}\n\`\`\``));
    }

    return details;
  }
}
