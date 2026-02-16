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
  
  renderToolUse(part, component) {
    const result = component.toolResultById[part.id];
    return this.renderCompact(part, result, component.showDebug);
  },
  
  renderToolResult(part, component) {
    return null; // Skip - already rendered in tool_use
  },
  
  renderToolStreaming(part, component) {
    if (part.state?.status === 'completed') {
      return this.renderCompactStreaming(part, component.showDebug);
    }
    return undefined; // Fall back to generic renderer
  },
  
  /**
   * Generate inline diff HTML using diff-match-patch
   * @param {string} oldString - Original text
   * @param {string} newString - New text
   * @returns {string} HTML string with inline diff
   */
  generateInlineDiff(oldString, newString) {
    try {
      // Handle missing or invalid inputs
      if (oldString === undefined || oldString === null) oldString = '';
      if (newString === undefined || newString === null) newString = '';
      
      const dmp = new diff.diff_match_patch();
      
      // Generate character-level diffs for inline highlighting
      const diffs = dmp.diff_main(oldString, newString);
      dmp.diff_cleanupSemantic(diffs); // Optimize for human readability
      
      // Use built-in prettyHtml - simple and effective!
      const html = dmp.diff_prettyHtml(diffs);
      
      // Wrap in styled container
      return `<div class="inline-diff">${html}</div>`;
    } catch (error) {
      console.error('generateInlineDiff error:', error);
      return `<div class="inline-diff"><em>Error generating diff: ${error.message}</em></div>`;
    }
  },
  

  
  renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const filePath = input.filePath || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const toolId = part.id || Math.random().toString(36).substr(2, 9);
    
    const oldString = input.oldString || '';
    const newString = input.newString || '';
    const replaceAll = input.replaceAll || false;
    
    // Generate inline diff
    const diffHtml = this.generateInlineDiff(oldString, newString);
    
    // Build details block
    let html = `<details class="compact-tool-call" data-tool-id="${toolId}">
  <summary>✏️ ${fileName}${replaceAll ? ' (replace all)' : ''}</summary>
  
`;
    
    // In debug mode, show full path and input
    if (showDebug) {
      html += `**Full path:** \`${filePath}\`

**Arguments:**
\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\`

`;
    }
    
    // Show inline diff
    html += `**Changes:**

${diffHtml}

`;
    
    // Show result status if available
    if (result) {
      const isError = result.is_error;
      if (isError) {
        const errorContent = ToolHelpers.extractResultContent(result);
        html += `**⚠️ Error:**
\`\`\`
${errorContent}
\`\`\`

`;
      } else if (showDebug) {
        html += `✅ Edit applied successfully

`;
      }
    }
    
    html += `</details>

`;
    return html;
  },
  
  renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const filePath = input.filePath || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const toolId = part.callID || Math.random().toString(36).substr(2, 9);
    
    const oldString = input.oldString || '';
    const newString = input.newString || '';
    const replaceAll = input.replaceAll || false;
    
    // Generate inline diff
    const diffHtml = this.generateInlineDiff(oldString, newString);
    
    // Build details block
    let html = `<details class="compact-tool-call" data-tool-id="${toolId}">
  <summary>✏️ ${fileName}${replaceAll ? ' (replace all)' : ''}</summary>
  
`;
    
    // In debug mode, show input
    if (showDebug) {
      html += `**Full path:** \`${filePath}\`

**Input:**
\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\`

`;
    }
    
    // Show inline diff
    html += `**Changes:**

${diffHtml}

`;
    
    // Show output if available
    if (output && showDebug) {
      html += `**Output:**
\`\`\`
${output}
\`\`\`

`;
    }
    
    html += `</details>

`;
    return html;
  }
};
