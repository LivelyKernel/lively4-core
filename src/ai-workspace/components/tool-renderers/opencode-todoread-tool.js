import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for TodoRead tool (todoread)
// Same visual style as TodoWrite but read-only (no input shown).
// Output is a JSON array of todo items.
export class OpenCodeTodoReadTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'todoread';
  }

  statusIcon(status) {
    switch (status) {
      case 'completed':   return '✅';
      case 'in_progress': return '🔄';
      case 'cancelled':   return '~~';
      default:            return '⬜';
    }
  }

  todoRow(todo) {
    const icon = this.statusIcon(todo.status);
    const content = todo.status === 'cancelled' ? `~~${todo.content}~~` : todo.content;
    const priority = todo.priority ? ` *(${todo.priority})*` : '';
    return `| ${icon} | ${content}${priority} |`;
  }

  renderTodosMd(todos) {
    if (!todos || todos.length === 0) return '*No todos*';
    const rows = todos.map(t => this.todoRow(t));
    return `| | Task |\n|---|---|\n${rows.join('\n')}`;
  }

  summarizeTodos(todos) {
    if (!todos || todos.length === 0) return '';
    const counts = {};
    for (const t of todos) counts[t.status] = (counts[t.status] || 0) + 1;
    const parts = [];
    if (counts.completed)   parts.push(`${counts.completed} completed`);
    if (counts.in_progress) parts.push(`${counts.in_progress} in progress`);
    if (counts.pending)     parts.push(`${counts.pending} pending`);
    if (counts.cancelled)   parts.push(`${counts.cancelled} cancelled`);
    return parts.join(', ');
  }

  parseTodos(rawOutput) {
    if (!rawOutput) return [];
    try {
      return JSON.parse(rawOutput);
    } catch {
      return [];
    }
  }

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeTodoReadTool.renderCompact: part.id is missing', part);

    const rawOutput = ToolHelpers.extractResultContent(result);
    const todos = this.parseTodos(rawOutput);
    const summary = this.summarizeTodos(todos);
    const summaryText = `📋 todoread${summary ? ` — ${summary}` : ''}`;

    const details = await this.buildDetails(toolId, summaryText, input, showDebug);
    details.appendChild(await this.createMarkdownEl(this.renderTodosMd(todos)));

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const output = state.output || '';
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeTodoReadTool.renderCompactStreaming: part.callID is missing', part);

    const todos = this.parseTodos(output);
    const summary = this.summarizeTodos(todos);
    const summaryText = `📋 todoread${summary ? ` — ${summary}` : ''}`;

    const details = await this.buildDetails(toolId, summaryText, {}, showDebug, 'Input');
    details.appendChild(await this.createMarkdownEl(this.renderTodosMd(todos)));

    return details;
  }
}
