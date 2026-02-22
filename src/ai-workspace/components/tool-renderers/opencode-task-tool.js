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

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeTaskTool.renderCompact: part.id is missing', part);

    const rawOutput = ToolHelpers.extractResultContent(result);
    const { taskId, result: parsedResult } = this.parseOutput(rawOutput);
    const hasError = result && result.is_error;
    const status = hasError ? 'error' : (rawOutput ? 'completed' : 'pending');

    const summaryText = this.buildSummaryText(input, status);
    const details = await this.buildDetails(toolId, summaryText, input, false);

    // Status line
    const statusLine = `**Status:** ${status}`;
    details.appendChild(await this.createMarkdownEl(statusLine));

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

    if (hasError) {
      details.appendChild(await this.createMarkdownEl('**⚠️ Task failed with error**'));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeTaskTool.renderCompactStreaming: part.callID is missing', part);

    const { taskId, result: parsedResult } = this.parseOutput(output);
    const summaryText = this.buildSummaryText(input, 'completed');

    const details = await this.buildDetails(toolId, summaryText, input, false, 'Input');

    // Status line
    details.appendChild(await this.createMarkdownEl('**Status:** completed'));

    // Input block
    const inputFields = {};
    if (input.description) inputFields.description = input.description;
    if (input.subagent_type) inputFields.subagent_type = input.subagent_type;
    if (input.prompt) inputFields.prompt = input.prompt;
    details.appendChild(await this.createMarkdownEl(
      `**Input:**\n\`\`\`json\n${JSON.stringify(Object.keys(inputFields).length > 0 ? inputFields : input, null, 2)}\n\`\`\``
    ));

    // Output block
    if (parsedResult) {
      details.appendChild(await this.createMarkdownEl(`**Output:**\n\n${parsedResult}`));
    }

    if (taskId && showDebug) {
      details.appendChild(await this.createMarkdownEl(`*Task ID: ${taskId}*`));
    }

    return details;
  }
}
