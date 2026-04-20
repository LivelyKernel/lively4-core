import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for Plan tools (plan_enter, plan_exit)
// These are mode-switch prompts — they ask the user a yes/no question
// about switching between plan agent and build agent.
// Output: the user's answer ("Yes" or "No") or blank if unanswered.
export class OpenCodePlanTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'plan_enter' || toolName === 'plan_exit';
  }

  /**
   * Determine the mode transition from the tool name.
   */
  modeLabel(toolName) {
    if (toolName === 'plan_enter') return { from: 'build', to: 'plan', icon: '📋' };
    if (toolName === 'plan_exit')  return { from: 'plan',  to: 'build', icon: '🔨' };
    return { from: '?', to: '?', icon: '🔄' };
  }

  /**
   * Parse the answer from the output.
   * Output contains the question result text after the user answered.
   */
  parseAnswer(output) {
    if (!output) return null;
    if (output.includes('"Yes"') || output.toLowerCase().includes('yes')) return 'Yes';
    if (output.includes('"No"') || output.toLowerCase().includes('no')) return 'No';
    return null;
  }

  async renderCompact(part, result, showDebug) {
    return this._renderShared(part, result, showDebug, false);
  }

  async renderCompactStreaming(part, showDebug) {
    return this._renderShared(part, null, showDebug, true);
  }

  async _renderShared(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    const toolName = part.name || part.tool || '';

    if (!data.toolId) {
      console.warn('OpenCodePlanTool: toolId is missing', part);
    }

    const { from, to, icon } = this.modeLabel(toolName);
    const answer = this.parseAnswer(data.output);
    const switched = answer === 'Yes';

    const summaryText = switched
      ? `${icon} switched to ${to} agent`
      : `${icon} ${answer ? `stayed in ${from} agent` : `plan mode prompt`}`;

    const debugLabel = isStreaming ? 'Input' : 'Arguments';
    const inputForDebug = isStreaming ? {} : data.input;
    const details = await this.buildDetails(data.toolId, summaryText, inputForDebug, showDebug, debugLabel);

    if (answer) {
      const actionMd = switched
        ? `Switched from **${from}** → **${to}** agent`
        : `Remained in **${from}** agent`;
      details.appendChild(await this.createMarkdownEl(actionMd));
    }

    return details;
  }
}
