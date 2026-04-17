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
   * Build a markdown bullet for a single todo item.
   */
  todoRow(todo) {
    const icon = this.statusIcon(todo.status);
    const content = todo.status === 'cancelled'
      ? `~~${todo.content}~~`
      : todo.content;
    const priority = todo.priority ? ` *(${todo.priority})*` : '';
    return `- ${icon} ${content}${priority}`;
  }

  /**
   * Render todo list as a compact markdown summary.
   * Returns a markdown string.
   */
  renderTodosMd(todos) {
    if (!todos || todos.length === 0) return '*No todos*';

    return todos.map(t => this.todoRow(t)).join('\n');
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

  buildSummaryText(todos) {
    const summary = this.summarizeTodos(todos);
    return `📋 todowrite${summary ? ` — ${summary}` : ''}`;
  }

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const todos = input.todos || [];
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeTodoWriteTool.renderCompact: part.id is missing', part);

    const summaryText = this.buildSummaryText(todos);
    const details = await this.buildDetails(toolId, summaryText, input, showDebug);
    details.open = true;
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
    const details = await this.buildDetails(toolId, summaryText, input, showDebug, 'Input');
    details.open = true;
    details.appendChild(await this.createMarkdownEl(this.renderTodosMd(todos)));

    return details;
  }
}
