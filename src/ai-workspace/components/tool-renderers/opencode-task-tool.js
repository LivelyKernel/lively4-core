import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for mcp_task tool (subagent/Task calls)
// Displays task calls with status, input, and output in a compact collapsible block
export class OpenCodeTaskTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_task' || toolName === 'task';
  }

  /**
   * Extract the task_result content from the output string.
   * The output contains a task_id line and a <task_result>...</task_result> block.
   */
  parseOutput(output) {
    if (!output) return { taskId: null, result: '' };

    const taskIdMatch = output.match(/task_id:\s*(\S+)/);
    const taskId = taskIdMatch ? taskIdMatch[1] : null;

    const resultMatch = output.match(/<task_result>([\s\S]*?)<\/task_result>/);
    const result = resultMatch ? resultMatch[1].trim() : output.trim();

    return { taskId, result };
  }

  /**
   * Build the summary label shown in <summary>.
   */
  buildSummaryText(input, status) {
    const description = input.description || input.prompt?.slice(0, 60) || 'task';
    const statusIcon = status === 'completed' ? '✅' :
                       status === 'error' ? '❌' : '🔧';
    return `${statusIcon} task: ${description}`;
  }

  truncate(text, max = 80) {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }

  buildRunningSummaryText(state) {
    const input = state.input || {};
    const firstPromptLine = input.prompt?.trim().split('\n').find(line => line.trim());
    const description = this.truncate(state.title || input.description || firstPromptLine || 'task');
    const subagentType = input.subagent_type ? ` (${input.subagent_type})` : '';
    const statusLabel = state.status === 'pending' ? 'queued' : 'spawning';
    return `🔧 task${subagentType} ${statusLabel}: ${description}`;
  }

  buildInlineSummary(summaryText) {
    const container = document.createElement('div');
    container.className = 'compact-tool-inline compact-task-spawn';
    container.textContent = summaryText;
    return container;
  }

  async renderToolStreaming(part, component) {
    const state = part.state || {};
    const status = state.status;

    if (status === 'running' || status === 'pending') {
      const summaryText = this.buildRunningSummaryText(state);

      if (!component.showDebug) {
        return this.buildInlineSummary(summaryText);
      }

      const input = state.input || {};
      const details = await this.buildDetails(part.callID, summaryText, input, true, 'Input');
      details.appendChild(await this.createMarkdownEl(`**Status:** ${status}`));
      return details;
    }

    return super.renderToolStreaming(part, component);
  }

  async renderCompact(part, result, showDebug) {
    return this._renderShared(part, result, showDebug, false);
  }

  async renderCompactStreaming(part, showDebug) {
    return this._renderShared(part, null, showDebug, true);
  }

  async _renderShared(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    const input = data.input;

    if (!data.toolId) {
      console.warn('OpenCodeTaskTool: toolId is missing', part);
    }

    const { taskId, result: parsedResult } = this.parseOutput(data.output);
    const status = isStreaming ? 'completed' : (data.isError ? 'error' : (data.output ? 'completed' : 'pending'));

    const summaryText = this.buildSummaryText(input, status);
    const details = await this.buildDetails(data.toolId, summaryText, input, false);

    // Status line
    details.appendChild(await this.createMarkdownEl(`**Status:** ${status}`));

    // Input block
    const inputFields = {};
    if (input.description) inputFields.description = input.description;
    if (input.subagent_type) inputFields.subagent_type = input.subagent_type;
    if (input.prompt) inputFields.prompt = input.prompt;
    if (Object.keys(inputFields).length > 0 || showDebug) {
      details.appendChild(await this.createMarkdownEl(
        `**Input:**\n\`\`\`json\n${JSON.stringify(Object.keys(inputFields).length > 0 ? inputFields : input, null, 2)}\n\`\`\``
      ));
    }

    // Output block
    if (parsedResult) {
      details.appendChild(await this.createMarkdownEl(`**Output:**\n\n${parsedResult}`));
    }

    if (taskId && showDebug) {
      details.appendChild(await this.createMarkdownEl(`*Task ID: ${taskId}*`));
    }

    if (!isStreaming && data.isError) {
      details.appendChild(await this.createMarkdownEl('**⚠️ Task failed with error**'));
    }

    return details;
  }
}
