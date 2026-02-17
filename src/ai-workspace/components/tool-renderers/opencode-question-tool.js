import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for Question tool (question, mcp_question)
// Renders each question with its answer options and the user's selected answer(s).
// Input:  { questions: [{ question, header, options: [{label, description}], multiple }] }
// Output: "User has answered your questions: "q"="answer", ..."
export class OpenCodeQuestionTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'question' || toolName === 'mcp_question';
  }

  /**
   * Parse answers from the output string.
   * Format: 'User has answered your questions: "q1"="a1", "q2"="a2"'
   */
  parseAnswers(output) {
    if (!output) return {};
    const answers = {};
    // Each pair: "question text"="answer text"
    const re = /"([^"]+)"="([^"]*)"/g;
    let m;
    while ((m = re.exec(output)) !== null) {
      answers[m[1]] = m[2];
    }
    return answers;
  }

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const questions = input.questions || [];
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeQuestionTool.renderCompact: part.id is missing', part);

    const rawOutput = ToolHelpers.extractResultContent(result);
    const answers = this.parseAnswers(rawOutput);
    const count = questions.length;
    const summary = `❓ ${count} question${count === 1 ? '' : 's'}`;

    const details = await this.buildDetails(toolId, summary, input, showDebug);

    for (const q of questions) {
      const answer = answers[q.question] || '*(unanswered)*';
      const headerLabel = q.header ? `**${q.header}**\n\n` : '';
      const questionMd = `${headerLabel}${q.question}\n\n→ **${answer}**`;
      details.appendChild(await this.createMarkdownEl(questionMd));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const questions = input.questions || [];
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeQuestionTool.renderCompactStreaming: part.callID is missing', part);

    const answers = this.parseAnswers(output);
    const count = questions.length;
    const summary = `❓ ${count} question${count === 1 ? '' : 's'}`;

    const details = await this.buildDetails(toolId, summary, input, showDebug, 'Input');

    for (const q of questions) {
      const answer = answers[q.question] || '*(unanswered)*';
      const headerLabel = q.header ? `**${q.header}**\n\n` : '';
      const questionMd = `${headerLabel}${q.question}\n\n→ **${answer}**`;
      details.appendChild(await this.createMarkdownEl(questionMd));
    }

    return details;
  }
}
