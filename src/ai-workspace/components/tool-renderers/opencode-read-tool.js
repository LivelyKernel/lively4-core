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
   * Create an initialized lively-markdown element with content set.
   */
  async createMarkdownEl(markdownText) {
    const md = await lively.create('lively-markdown');
    await md.setContent(markdownText);
    return md;
  },
  
  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const filePath = input.filePath || input.path || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const rangeInfo = ToolHelpers.generateRangeInfo(input);
    const toolId = part.id || Math.random().toString(36).substr(2, 9);
    const language = ToolHelpers.detectLanguage(fileName);
    const rawContent = ToolHelpers.extractResultContent(result);
    const content = ToolHelpers.parseReadToolContent(rawContent);

    const details = <details class="compact-tool-call" data-tool-id={toolId}>
      <summary>📖 {fileName}{rangeInfo}</summary>
    </details>;

    if (showDebug) {
      details.appendChild(await this.createMarkdownEl(
        `**Full path:** \`${filePath}\`\n\n**Arguments:**\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``
      ));
    }

    if (content) {
      const label = showDebug ? '**Output:**\n' : '';
      details.appendChild(await this.createMarkdownEl(`${label}\`\`\`${language}\n${content}\n\`\`\``));
    }

    return details;
  },
  
  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const filePath = input.filePath || input.path || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const rangeInfo = ToolHelpers.generateRangeInfo(input);
    const toolId = part.callID || Math.random().toString(36).substr(2, 9);
    const language = ToolHelpers.detectLanguage(fileName);
    const content = ToolHelpers.parseReadToolContent(output);

    const details = <details class="compact-tool-call" data-tool-id={toolId}>
      <summary>📖 {fileName}{rangeInfo}</summary>
    </details>;

    if (showDebug) {
      details.appendChild(await this.createMarkdownEl(
        `**Full path:** \`${filePath}\`\n\n**Input:**\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``
      ));
    }

    if (content) {
      const label = showDebug ? '**Output:**\n' : '';
      details.appendChild(await this.createMarkdownEl(`${label}\`\`\`${language}\n${content}\n\`\`\``));
    }

    return details;
  }
};
