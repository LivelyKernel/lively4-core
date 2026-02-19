import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

const SERVER_URL = 'http://localhost:9100';

// Renderer for Question tool (question, mcp_question)
//
// States:
//  pending   → input is empty, return null → generic fallback
//  running   → question is awaiting user input → render interactive UI
//  completed → user answered → render compact answered summary
//
// Input:  { questions: [{ question, header, options: [{label, description}], multiple, custom }] }
// Output: "User has answered your questions: "q"="answer", ..."
export class OpenCodeQuestionTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'question' || toolName === 'mcp_question';
  }

  // ── Streaming renderer entry-point ─────────────────────────────────────

  async renderToolStreaming(part, component) {
    const status = part.state?.status;

    if (status === 'completed') {
      return this.renderCompactStreaming(part, component.showDebug);
    }

    if (status === 'running') {
      const questions = part.state?.input?.questions || [];
      if (questions.length === 0) return null; // not fully populated yet
      return this.renderInteractiveQuestion(part, questions);
    }

    return null; // pending / error → generic fallback
  }

  // ── Interactive question UI ─────────────────────────────────────────────

  async renderInteractiveQuestion(part, questions) {
    const callID = part.callID;

    // Per-question answer state
    const selectedAnswers = questions.map(() => new Set());
    const customTexts     = questions.map(() => '');

    const container = document.createElement('div');
    container.className = 'question-tool-interactive';

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qBlock = document.createElement('div');
      qBlock.className = 'question-block';

      // Header
      if (q.header) {
        const header = document.createElement('div');
        header.className = 'question-header';
        header.textContent = q.header;
        qBlock.appendChild(header);
      }

      // Question text
      const questionText = document.createElement('div');
      questionText.className = 'question-text';
      questionText.textContent = q.question;
      qBlock.appendChild(questionText);

      // Option buttons
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'question-options';

      for (const opt of (q.options || [])) {
        const btn = document.createElement('button');
        btn.className = 'question-option';
        btn.textContent = opt.label;
        if (opt.description) btn.title = opt.description;

        btn.addEventListener('click', () => {
          if (q.multiple) {
            // Toggle for multi-select
            if (selectedAnswers[i].has(opt.label)) {
              selectedAnswers[i].delete(opt.label);
              btn.classList.remove('selected');
            } else {
              selectedAnswers[i].add(opt.label);
              btn.classList.add('selected');
            }
          } else {
            // Single-select: clear others
            selectedAnswers[i].clear();
            selectedAnswers[i].add(opt.label);
            optionsDiv.querySelectorAll('.question-option')
              .forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            // Clear custom input when an option is clicked
            const ci = qBlock.querySelector('.question-custom-input');
            if (ci) { ci.value = ''; customTexts[i] = ''; }
          }
        });

        optionsDiv.appendChild(btn);
      }
      qBlock.appendChild(optionsDiv);

      // Custom text input (enabled by default, opt-out with custom: false)
      if (q.custom !== false) {
        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.className = 'question-custom-input';
        customInput.placeholder = 'Type your own answer...';
        customInput.addEventListener('input', (evt) => {
          customTexts[i] = evt.target.value;
          if (customTexts[i].trim() && !q.multiple) {
            // Typing clears option selections for single-select
            selectedAnswers[i].clear();
            optionsDiv.querySelectorAll('.question-option')
              .forEach(b => b.classList.remove('selected'));
          }
        });
        qBlock.appendChild(customInput);
      }

      container.appendChild(qBlock);
    }

    // Action buttons row
    const actionsRow = document.createElement('div');
    actionsRow.className = 'question-actions';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'question-submit';
    submitBtn.textContent = 'Submit';

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'question-dismiss';
    dismissBtn.textContent = 'Dismiss (stops session)';

    actionsRow.appendChild(submitBtn);
    actionsRow.appendChild(dismissBtn);
    container.appendChild(actionsRow);

    // Submit handler
    submitBtn.addEventListener('click', async () => {
      const answers = questions.map((_q, i) => {
        const selected = [...selectedAnswers[i]];
        const custom   = customTexts[i]?.trim();
        if (custom) selected.push(custom);
        return selected.length > 0 ? selected : [''];
      });
      await this._submitReply(callID, answers, container, submitBtn);
    });

    // Dismiss handler
    dismissBtn.addEventListener('click', async () => {
      if (!confirm('Dismiss this question? This will stop the current session.')) return;
      await this._submitReject(callID, container);
    });

    return container;
  }

  async _submitReply(callID, answers, container, submitBtn) {
    try {
      // Resolve que_... ID by matching callID in the pending list
      const pendingResp = await fetch(`${SERVER_URL}/question`);
      const pending = await pendingResp.json();
      const match = pending.find(r => r.tool?.callID === callID);

      if (!match) {
        lively.notify('Question is no longer pending (already answered?)');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      const resp = await fetch(`${SERVER_URL}/question/${match.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });

      if (resp.ok) {
        container.innerHTML = '<em class="question-submitted">Answer submitted, waiting for agent...</em>';
      } else {
        lively.error(`Failed to submit answer: ${resp.status}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    } catch (err) {
      console.error('Error submitting question reply:', err);
      lively.error('Error submitting answer: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  }

  async _submitReject(callID, container) {
    try {
      const pendingResp = await fetch(`${SERVER_URL}/question`);
      const pending = await pendingResp.json();
      const match = pending.find(r => r.tool?.callID === callID);

      if (!match) {
        lively.notify('Question is no longer pending');
        return;
      }

      const resp = await fetch(`${SERVER_URL}/question/${match.id}/reject`, {
        method: 'POST'
      });

      if (resp.ok) {
        container.innerHTML = '<em class="question-submitted">Question dismissed — session stopped.</em>';
      } else {
        lively.error(`Failed to dismiss: ${resp.status}`);
      }
    } catch (err) {
      console.error('Error rejecting question:', err);
      lively.error('Error dismissing: ' + err.message);
    }
  }

  // ── Completed state renderer ────────────────────────────────────────────

  /**
   * Parse answers from the output string.
   * Format: 'User has answered your questions: "q1"="a1", "q2"="a2"'
   */
  parseAnswers(output) {
    if (!output) return {};
    const answers = {};
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
