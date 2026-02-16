import * as ToolHelpers from '../chat-tool-helpers.js';

// Renderer for Read tool (mcp_read, read_file, read)
// Displays file reads in a compact <details> block with syntax highlighting
export const OpenCodeReadTool = {
  name: 'ReadTool',
  
  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_read' || 
           toolName === 'read_file' || 
           toolName === 'read';
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
  
  renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const filePath = input.filePath || input.path || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const rangeInfo = ToolHelpers.generateRangeInfo(input);
    const toolId = part.id || Math.random().toString(36).substr(2, 9);
    const language = ToolHelpers.detectLanguage(fileName);
    const rawContent = ToolHelpers.extractResultContent(result);
    const content = ToolHelpers.parseReadToolContent(rawContent);
    
    // Build details block
    let html = `<details class="compact-tool-call" data-tool-id="${toolId}">
  <summary>📖 ${fileName}${rangeInfo}</summary>
  
`;
    
    // In debug mode, show input arguments
    if (showDebug) {
      html += `**Full path:** \`${filePath}\`

**Arguments:**
\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\`

`;
    }
    
    // Show output content (always, even in normal mode)
    if (content) {
      if (!showDebug) {
        // In normal mode, show content directly with syntax highlighting
        html += `\`\`\`${language}\n${content}\n\`\`\`\n`;
      } else {
        // In debug mode, label it as output
        html += `**Output:**\n\`\`\`${language}\n${content}\n\`\`\`\n`;
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
    const filePath = input.filePath || input.path || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const rangeInfo = ToolHelpers.generateRangeInfo(input);
    const toolId = part.callID || Math.random().toString(36).substr(2, 9);
    const language = ToolHelpers.detectLanguage(fileName);
    const content = ToolHelpers.parseReadToolContent(output);
    
    // Build details block
    let html = `<details class="compact-tool-call" data-tool-id="${toolId}">
  <summary>📖 ${fileName}${rangeInfo}</summary>
  
`;
    
    // In debug mode, show input arguments
    if (showDebug) {
      html += `**Full path:** \`${filePath}\`

**Input:**
\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\`

`;
    }
    
    // Show output content (always, even in normal mode)
    if (content) {
      if (!showDebug) {
        // In normal mode, show content directly with syntax highlighting
        html += `\`\`\`${language}\n${content}\n\`\`\`\n`;
      } else {
        // In debug mode, label it as output
        html += `**Output:**\n\`\`\`${language}\n${content}\n\`\`\`\n`;
      }
    }
    
    html += `</details>

`;
    return html;
  }
};
