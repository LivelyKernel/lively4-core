import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for TodoWrite tool (mcp_todowrite)
// Displays a todo list with status icons and priority badges
export class OpenCodeTodoWriteTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_todowrite' || toolName === 'todowrite';
  }

  /**
   * Map a todo status to an icon.
   */
  statusIcon(status) {
    switch (status) {
      case 'completed':  return '✅';
      case 'in_progress': return '🔄';
      case 'cancelled':  return '~~';
      default:           return '⬜';  // pending
    }
  }

  /**
   * Build a markdown table row for a single todo item.
   */
  todoRow(todo) {
    const icon = this.statusIcon(todo.status);
    const content = todo.status === 'cancelled'
      ? `~~${todo.content}~~`
      : todo.content;
    const priority = todo.priority ? ` *(${todo.priority})*` : '';
    return `| ${icon} | ${content}${priority} |`;
  }

  /**
   * Render todo list as a compact markdown summary.
   * Returns a markdown string.
   */
  renderTodosMd(todos) {
    if (!todos || todos.length === 0) return '*No todos*';

    const rows = todos.map(t => this.todoRow(t));
    return `| | Task |\n|---|---|\n${rows.join('\n')}`;
  }

  /**
   * Build summary line: "X completed, Y in progress, Z pending"
   */
  summarizeTodos(todos) {
    if (!todos || todos.length === 0) return '';
    const counts = {};
    for (const t of todos) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    const parts = [];
    if (counts.completed)  parts.push(`${counts.completed} completed`);
    if (counts.in_progress) parts.push(`${counts.in_progress} in progress`);
    if (counts.pending)    parts.push(`${counts.pending} pending`);
    if (counts.cancelled)  parts.push(`${counts.cancelled} cancelled`);
    return parts.join(', ');
  }

  /**
   * Return an inline todo label when there is exactly one single-line todo.
   * Example: "✅ Ship fix (high)".
   */
  inlineTodoLabel(todos) {
    if (!Array.isArray(todos) || todos.length !== 1) return '';

    const todo = todos[0] || {};
    const rawContent = typeof todo.content === 'string' ? todo.content.trim() : '';
    const isOneLiner = rawContent && rawContent.split('\n').length === 1;
    if (!isOneLiner) return '';

    const icon = this.statusIcon(todo.status);
    const content = todo.status === 'cancelled' ? `~~${rawContent}~~` : rawContent;
    const priority = todo.priority ? ` (${todo.priority})` : '';
    return `${icon} ${content}${priority}`;
  }

  buildSummaryText(todos) {
    const inlineTodo = this.inlineTodoLabel(todos);
    if (inlineTodo) return `📋 todowrite — ${inlineTodo}`;

    const summary = this.summarizeTodos(todos);
    return `📋 todowrite${summary ? ` — ${summary}` : ''}`;
  }

  buildInlineSummary(summaryText) {
    const container = document.createElement('div');
    container.className = 'compact-tool-inline';
    container.textContent = summaryText;
    return container;
  }

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const todos = input.todos || [];
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeTodoWriteTool.renderCompact: part.id is missing', part);

    const summaryText = this.buildSummaryText(todos);

    if (this.inlineTodoLabel(todos) && !showDebug) {
      return this.buildInlineSummary(summaryText);
    }

    const details = await this.buildDetails(toolId, summaryText, input, showDebug);
    details.appendChild(await this.createMarkdownEl(this.renderTodosMd(todos)));

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const todos = input.todos || [];
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeTodoWriteTool.renderCompactStreaming: part.callID is missing', part);

    const summaryText = this.buildSummaryText(todos);

    if (this.inlineTodoLabel(todos) && !showDebug) {
      return this.buildInlineSummary(summaryText);
    }

    const details = await this.buildDetails(toolId, summaryText, input, showDebug, 'Input');
    details.appendChild(await this.createMarkdownEl(this.renderTodosMd(todos)));

    return details;
  }
}
