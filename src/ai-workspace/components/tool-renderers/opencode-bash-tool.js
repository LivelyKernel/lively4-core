import * as ToolHelpers from '../chat-tool-helpers.js';

// Renderer for Bash tool (mcp_bash, bash)
// Displays bash command execution in a compact <details> block
export const OpenCodeBashTool = {
  name: 'BashTool',
  
  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_bash' || toolName === 'bash';
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
   * Truncate output to max number of lines
   * @param {string} output - Full command output
   * @param {number} maxLines - Maximum lines to show (default: 5)
   * @returns {Object} {truncated: string, originalLineCount: number, wasTruncated: boolean}
   */
  truncateOutput(output, maxLines = 5) {
    if (!output) return { truncated: '', originalLineCount: 0, wasTruncated: false };
    
    const lines = output.split('\n');
    const originalLineCount = lines.length;
    
    if (lines.length <= maxLines) {
      return { truncated: output, originalLineCount, wasTruncated: false };
    }
    
    // Take first maxLines lines
    const truncated = lines.slice(0, maxLines).join('\n');
    return { truncated, originalLineCount, wasTruncated: true };
  },
  
  renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const command = input.command || 'unknown';
    const description = input.description || '';
    const workdir = input.workdir || '';
    const toolId = part.id || Math.random().toString(36).substr(2, 9);
    const rawOutput = ToolHelpers.extractResultContent(result);
    
    // Truncate to 5 lines for preview, 50 lines for details
    const { truncated: preview, originalLineCount, wasTruncated } = this.truncateOutput(rawOutput, 5);
    const { truncated: detailsOutput } = this.truncateOutput(rawOutput, 50);
    
    let html = '';
    
    // Default view: description + 5 lines of output
    html += `**🔧 ${description || command}**\n\n`;
    if (preview) {
      html += `\`\`\`\n${preview}\n\`\`\`\n\n`;
    }
    
    // Details: description + command + 50 lines
    if (wasTruncated || showDebug) {
      html += `<details class="compact-tool-call" data-tool-id="${toolId}">\n`;
      html += `  <summary>Show more (${originalLineCount} lines total)</summary>\n\n`;
      html += `\`$ ${command}\`\n\n`;
      
      if (workdir) {
        html += `*Working directory: \`${workdir}\`*\n\n`;
      }
      
      if (detailsOutput) {
        html += `\`\`\`\n${detailsOutput}\n\`\`\`\n\n`;
      }
      
      html += `</details>\n\n`;
    }
    
    // Check for errors in result
    if (result && result.is_error) {
      html += `**⚠️ Command failed with error**\n\n`;
    }
    
    return html;
  },
  
  renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const command = input.command || 'unknown';
    const description = input.description || '';
    const workdir = input.workdir || '';
    const toolId = part.callID || Math.random().toString(36).substr(2, 9);
    
    // Truncate to 5 lines for preview, 50 lines for details
    const { truncated: preview, originalLineCount, wasTruncated } = this.truncateOutput(output, 5);
    const { truncated: detailsOutput } = this.truncateOutput(output, 50);
    
    let html = '';
    
    // Default view: description + 5 lines of output
    html += `**🔧 ${description || command}**\n\n`;
    if (preview) {
      html += `\`\`\`\n${preview}\n\`\`\`\n\n`;
    }
    
    // Details: description + command + 50 lines
    if (wasTruncated || showDebug) {
      html += `<details class="compact-tool-call" data-tool-id="${toolId}">\n`;
      html += `  <summary>Show more (${originalLineCount} lines total)</summary>\n\n`;
      html += `\`$ ${command}\`\n\n`;
      
      if (workdir) {
        html += `*Working directory: \`${workdir}\`*\n\n`;
      }
      
      if (detailsOutput) {
        html += `\`\`\`\n${detailsOutput}\n\`\`\`\n\n`;
      }
      
      html += `</details>\n\n`;
    }
    
    return html;
  }
};
