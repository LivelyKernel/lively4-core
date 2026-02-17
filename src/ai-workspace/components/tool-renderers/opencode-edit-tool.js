import * as ToolHelpers from '../chat-tool-helpers.js';
import diff from 'src/external/diff-match-patch.js';

// Renderer for Edit tool (mcp_edit, edit_file, edit)
// Displays file edits inline using diff-match-patch, showing only changed regions
export const OpenCodeEditTool = {
  name: 'EditTool',
  
  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_edit' || 
           toolName === 'edit_file' || 
           toolName === 'edit';
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
  },

  /**
   * Create an initialized lively-markdown element with content set.
   */
  async createMarkdownEl(markdownText) {
    const md = await lively.create('lively-markdown');
    await md.setContent(markdownText);
    return md;
  },
  
  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const filePath = input.filePath || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const toolId = part.id || Math.random().toString(36).substr(2, 9);
    
    const oldString = input.oldString || '';
    const newString = input.newString || '';
    const replaceAll = input.replaceAll || false;

    const details = <details class="compact-tool-call" data-tool-id={toolId}>
      <summary>✏️ {fileName}{replaceAll ? ' (replace all)' : ''}</summary>
    </details>;

    if (showDebug) {
      details.appendChild(await this.createMarkdownEl(
        `**Full path:** \`${filePath}\`\n\n**Arguments:**\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``
      ));
    }

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
  },
  
  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const filePath = input.filePath || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const toolId = part.callID || Math.random().toString(36).substr(2, 9);
    
    const oldString = input.oldString || '';
    const newString = input.newString || '';
    const replaceAll = input.replaceAll || false;

    const details = <details class="compact-tool-call" data-tool-id={toolId}>
      <summary>✏️ {fileName}{replaceAll ? ' (replace all)' : ''}</summary>
    </details>;

    if (showDebug) {
      details.appendChild(await this.createMarkdownEl(
        `**Full path:** \`${filePath}\`\n\n**Input:**\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``
      ));
    }

    details.appendChild(await this.createMarkdownEl('**Changes:**'));
    details.appendChild(this.generateInlineDiffEl(oldString, newString));

    if (output && showDebug) {
      details.appendChild(await this.createMarkdownEl(`**Output:**\n\`\`\`\n${output}\n\`\`\``));
    }

    return details;
  }
};
