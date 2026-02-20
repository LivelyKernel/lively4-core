import Morph from 'src/components/widgets/lively-morph.js';

/*MD
# Lively Agent Board

Display board for agent-related information like TODOs, tasks, and other session data.

**Features:**
- Display TODOs grouped by status
- Priority-based color coding
- Reusable across different AI components (lively-opencode, lively-ai-workspace)

**Usage:**
```javascript
const board = await lively.create("lively-agent-board");
board.updateTodos(todosArray);
```

**Data Format:**
```javascript
[
  {
    content: "Task description",
    status: "pending|in_progress|completed|cancelled",
    priority: "high|medium|low"
  }
]
```
MD*/

export default class LivelyAgentBoard extends Morph {
  async initialize() {
    this.windowTitle = "Agent Board";
    this.todos = [];
  }

  /**
   * Update the TODO list display
   * @param {Array} todos - Array of TODO items from server
   */
  updateTodos(todos) {
    this.todos = todos || [];
    this.render();
  }

  /**
   * Render the board content
   */
  render() {
    const content = this.get('#content');
    if (!content) return;

    if (!this.todos || this.todos.length === 0) {
      content.innerHTML = '<div class="empty-message">No TODOs for this session</div>';
      return;
    }

    // Group TODOs by status
    const grouped = {
      in_progress: [],
      pending: [],
      completed: [],
      cancelled: []
    };

    this.todos.forEach(todo => {
      const status = todo.status || 'pending';
      if (grouped[status]) {
        grouped[status].push(todo);
      }
    });

    // Build HTML
    let html = '';

    // Status order and icons
    const statusConfig = {
      in_progress: { label: 'In Progress', icon: '⊙' },
      pending: { label: 'Pending', icon: '☐' },
      completed: { label: 'Completed', icon: '✓' },
      cancelled: { label: 'Cancelled', icon: '✗' }
    };

    Object.keys(statusConfig).forEach(status => {
      const items = grouped[status];
      if (items.length === 0) return;

      const config = statusConfig[status];
      html += `
        <div class="board-section">
          <div class="board-section-title">
            ${config.label} (${items.length})
          </div>
      `;

      items.forEach(todo => {
        html += `
          <div class="todo-item priority-${todo.priority || 'medium'}">
            <span class="todo-status-icon">${config.icon}</span>
            <span class="todo-content">${this.escapeHtml(todo.content)}</span>
            <div class="todo-meta">priority: ${todo.priority || 'medium'}</div>
          </div>
        `;
      });

      html += `</div>`;
    });

    content.innerHTML = html;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Example for testing
   */
  livelyExample() {
    this.updateTodos([
      { content: "Implement feature X", status: "in_progress", priority: "high" },
      { content: "Fix bug in parser", status: "pending", priority: "high" },
      { content: "Add tests for new API", status: "pending", priority: "medium" },
      { content: "Update documentation", status: "completed", priority: "low" },
      { content: "Refactor old code", status: "cancelled", priority: "low" }
    ]);
  }
}
