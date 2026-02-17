import * as ToolHelpers from '../chat-tool-helpers.js';

// Renderer for Bash tool (mcp_bash, bash)
// Displays bash command execution in a compact <details> block
export const OpenCodeBashTool = {
  name: 'BashTool',
  
  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_bash' || toolName === 'bash';
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
    
    const truncated = lines.slice(0, maxLines).join('\n');
    return { truncated, originalLineCount, wasTruncated: true };
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
    const command = input.command || 'unknown';
    const description = input.description || '';
    const workdir = input.workdir || '';
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeBashTool.renderCompact: part.id is missing, data-tool-id will not be set', part);
    const rawOutput = ToolHelpers.extractResultContent(result);
    
    const { truncated: preview, originalLineCount, wasTruncated } = this.truncateOutput(rawOutput, 5);
    const { truncated: detailsOutput } = this.truncateOutput(rawOutput, 50);
    const hasError = result && result.is_error;

    const container = <div class="tool-bash" {...(toolId ? {"data-tool-id": toolId} : {})}></div>;

    container.appendChild(await this.createMarkdownEl(`**🔧 ${description || command}**`));

    if (preview) {
      container.appendChild(await this.createMarkdownEl(`\`\`\`\n${preview}\n\`\`\``));
    }

    if (wasTruncated || showDebug) {
      const detailsMd = [`\`$ ${command}\``];
      if (workdir) detailsMd.push(`*Working directory: \`${workdir}\`*`);
      if (detailsOutput) detailsMd.push(`\`\`\`\n${detailsOutput}\n\`\`\``);

      const details = <details class="compact-tool-call" {...(toolId ? {"data-tool-id": toolId} : {})}>
        <summary>Show more ({originalLineCount} lines total)</summary>
      </details>;
      details.appendChild(await this.createMarkdownEl(detailsMd.join('\n\n')));
      container.appendChild(details);
    }

    if (hasError) {
      container.appendChild(await this.createMarkdownEl('**⚠️ Command failed with error**'));
    }

    return container;
  },
  
  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const command = input.command || 'unknown';
    const description = input.description || '';
    const workdir = input.workdir || '';
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeBashTool.renderCompactStreaming: part.callID is missing, data-tool-id will not be set', part);
    
    const { truncated: preview, originalLineCount, wasTruncated } = this.truncateOutput(output, 5);
    const { truncated: detailsOutput } = this.truncateOutput(output, 50);

    const container = <div class="tool-bash" {...(toolId ? {"data-tool-id": toolId} : {})}></div>;

    container.appendChild(await this.createMarkdownEl(`**🔧 ${description || command}**`));

    if (preview) {
      container.appendChild(await this.createMarkdownEl(`\`\`\`\n${preview}\n\`\`\``));
    }

    if (wasTruncated || showDebug) {
      const detailsMd = [`\`$ ${command}\``];
      if (workdir) detailsMd.push(`*Working directory: \`${workdir}\`*`);
      if (detailsOutput) detailsMd.push(`\`\`\`\n${detailsOutput}\n\`\`\``);

      const details = <details class="compact-tool-call" {...(toolId ? {"data-tool-id": toolId} : {})}>
        <summary>Show more ({originalLineCount} lines total)</summary>
      </details>;
      details.appendChild(await this.createMarkdownEl(detailsMd.join('\n\n')));
      container.appendChild(details);
    }

    return container;
  }
};
