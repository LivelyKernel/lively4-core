import * as ToolHelpers from '../chat-tool-helpers.js';

// Generic fallback renderer for all tools
// Always matches - should be registered last
export const OpenCodeGenericTool = {
  name: 'GenericTool',
  
  matches(part) {
    return true;
  },

  /**
   * Create an initialized lively-markdown element with content set.
   */
  async createMarkdownEl(markdownText) {
    const md = await lively.create('lively-markdown');
    await md.setContent(markdownText);
    return md;
  },
  
  async renderToolUse(part, component) {
    const container = <div class="tool-generic tool-use"></div>;
    container.appendChild(await this.createMarkdownEl(`### 🔧 Tool Call: ${part.name}`));
    if (part.input && Object.keys(part.input).length > 0) {
      container.appendChild(await this.createMarkdownEl(
        `**Arguments:**\n\`\`\`json\n${JSON.stringify(part.input, null, 2)}\n\`\`\``
      ));
    }
    if (part.id) {
      container.appendChild(await this.createMarkdownEl(`*Call ID: ${part.id}*`));
    }
    return container;
  },
  
  async renderToolResult(part, component) {
    const container = <div class="tool-generic tool-result"></div>;

    const header = part.is_error ? '### ↩️ Tool Result\n\n**⚠️ Error:**' : '### ↩️ Tool Result';
    container.appendChild(await this.createMarkdownEl(header));

    // Normalize content to a string
    let content = '';
    if (typeof part.content === 'string') {
      content = part.content;
    } else if (Array.isArray(part.content)) {
      content = part.content
        .map(block => {
          if (block.type === 'text') return block.text;
          if (block.type === 'image') return '[Image]';
          return JSON.stringify(block);
        })
        .join('\n');
    } else {
      content = JSON.stringify(part.content);
    }

    // Format content in a code block
    let codeMd;
    if (content.includes('```')) {
      codeMd = content;
    } else {
      try {
        const parsed = JSON.parse(content);
        codeMd = `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
      } catch (e) {
        codeMd = `\`\`\`\n${content}\n\`\`\``;
      }
    }
    container.appendChild(await this.createMarkdownEl(codeMd));

    if (part.tool_use_id) {
      container.appendChild(await this.createMarkdownEl(`*Tool Use ID: ${part.tool_use_id}*`));
    }
    return container;
  },
  
  async renderToolStreaming(part, component) {
    const toolName = part.tool || 'Tool';
    const status = part.state?.status || 'unknown';
    const state = part.state || {};
    
    const container = <div class="tool-generic tool-streaming"></div>;

    container.appendChild(await this.createMarkdownEl(`### 🔧 ${toolName}\n\n**Status:** ${status}`));

    // Input block
    if (state.input && Object.keys(state.input).length > 0) {
      let inputMd;
      if (toolName === 'lively4_evaluate_code' && state.input.code) {
        inputMd = `**Code:**\n\`\`\`javascript\n${state.input.code.trim()}\n\`\`\``;
      } else {
        inputMd = `**Input:**\n\`\`\`json\n${JSON.stringify(state.input, null, 2)}\n\`\`\``;
      }
      container.appendChild(await this.createMarkdownEl(inputMd));
    }

    // Output block (only when completed)
    if (status === 'completed' && state.output) {
      if (toolName === 'lively4_evaluate_code') {
        const parsed = ToolHelpers.parseLively4EvaluateOutput(state.output);
        if (parsed) {
          const outputParts = [];
          if (parsed.result) outputParts.push(`**Result:**\n\`\`\`\n${parsed.result}\n\`\`\``);
          if (parsed.consoleOutput) outputParts.push(`**Console output:**\n\`\`\`\n${parsed.consoleOutput}\n\`\`\``);
          if (outputParts.length) container.appendChild(await this.createMarkdownEl(outputParts.join('\n\n')));
        } else {
          container.appendChild(await this.createMarkdownEl(`**Output:**\n${state.output}`));
        }
      } else {
        container.appendChild(await this.createMarkdownEl(`**Output:**\n\`\`\`\n${state.output}\n\`\`\``));
      }
    }

    // Debug: timing + call ID
    if (component.showDebug) {
      const debugParts = [];
      if (state.time) {
        debugParts.push(`*Duration: ${state.time.end - state.time.start}ms*`);
      }
      if (part.callID) {
        debugParts.push(`*Call ID: ${part.callID}*`);
      }
      if (debugParts.length) {
        container.appendChild(await this.createMarkdownEl(debugParts.join('\n\n')));
      }
    }
    
    return container;
  }
};
