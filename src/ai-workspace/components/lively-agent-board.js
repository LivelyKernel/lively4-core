import Morph from 'src/components/widgets/lively-morph.js';

/*MD
# Lively Agent Board

Display board for agent-related information like TODOs, session links, and other session data.

**Features:**
- Display TODOs grouped by status
- Priority-based color coding
- Session links section showing:
  - Project Focus (index.md link)
  - Files read during session
  - Files written during session
- Reusable across different AI components (lively-opencode, lively-ai-workspace)

**Usage:**
```javascript
const board = await lively.create("lively-agent-board");

// Set project focus
board.setProjectFocus("src/ai-workspace/index.md");

// Add file operations
board.addFileRead("path/to/file.js");
board.addFileWritten("path/to/file.js");

// Update TODOs
board.updateTodos(todosArray);
```

**TODO Data Format:**
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
    this.links = {
      projectFocus: null,
      filesRead: [],
      filesWritten: []
    };
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
   * Set the project focus link
   * @param {string} path - Path to the project focus index.md
   */
  setProjectFocus(path) {
    this.links.projectFocus = path;
    this.render();
  }

  /**
   * Add a file read link
   * @param {string} path - Path to the file that was read
   */
  addFileRead(path) {
    if (!this.links.filesRead.includes(path)) {
      this.links.filesRead.push(path);
      this.render();
    }
  }

  /**
   * Add a file written link
   * @param {string} path - Path to the file that was written
   */
  addFileWritten(path) {
    if (!this.links.filesWritten.includes(path)) {
      this.links.filesWritten.push(path);
      this.render();
    }
  }

  /**
   * Render the board content
   */
  render() {
    const content = this.get('#content');
    if (!content) return;

    // Clear existing content
    content.innerHTML = '';

    // Render Session Links section
    const linksSection = this.renderLinksSection();
    if (linksSection) {
      content.appendChild(linksSection);
    }

    // Render TODOs section
    const todosSection = this.renderTodosSection();
    if (todosSection) {
      content.appendChild(todosSection);
    }

    // Show empty message if no content
    if (!linksSection && !todosSection) {
      content.appendChild(<div class="empty-message">No data to display</div>);
    }
  }

  /**
   * Render the session links section
   */
  renderLinksSection() {
    const hasLinks = this.links.projectFocus || 
                     this.links.filesRead.length > 0 || 
                     this.links.filesWritten.length > 0;

    if (!hasLinks) return null;

    const section = <div class="board-section links-section">
      <div class="board-section-title">Session Links</div>
    </div>;

    // Project Focus
    if (this.links.projectFocus) {
      section.appendChild(
        <div class="link-item">
          <span class="link-icon">📁</span>
          <span class="link-label">Project Focus:</span>
          <a class="link-path" click={() => {
              debugger
              lively.openBrowser(this.links.projectFocus, true)
            }}>
            {this.links.projectFocus}
          </a>
        </div>
      );
    }

    // Files Read
    if (this.links.filesRead.length > 0) {
      section.appendChild(
        <div class="link-group-title">Files Read ({this.links.filesRead.length})</div>
      );
      
      this.links.filesRead.forEach(path => {
        section.appendChild(
          <div class="link-item file-read">
            <span class="link-icon">📖</span>
            <a class="link-path" click={() => lively.openBrowser(path)}>
              {path}
            </a>
          </div>
        );
      });
    }

    // Files Written
    if (this.links.filesWritten.length > 0) {
      section.appendChild(
        <div class="link-group-title">Files Written ({this.links.filesWritten.length})</div>
      );
      
      this.links.filesWritten.forEach(path => {
        section.appendChild(
          <div class="link-item file-written">
            <span class="link-icon">✏️</span>
            <a class="link-path" click={() => lively.openBrowser(path, true)}>
              {path}
            </a>
          </div>
        );
      });
    }

    return section;
  }

  /**
   * Render the TODOs section
   */
  renderTodosSection() {
    if (!this.todos || this.todos.length === 0) return null;

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

    // Status order and icons
    const statusConfig = {
      in_progress: { label: 'In Progress', icon: '⊙' },
      pending: { label: 'Pending', icon: '☐' },
      completed: { label: 'Completed', icon: '✓' },
      cancelled: { label: 'Cancelled', icon: '✗' }
    };

    const container = <div></div>;

    Object.keys(statusConfig).forEach(status => {
      const items = grouped[status];
      if (items.length === 0) return;

      const config = statusConfig[status];
      const section = <div class="board-section">
        <div class="board-section-title">
          {config.label} ({items.length})
        </div>
      </div>;

      items.forEach(todo => {
        section.appendChild(
          <div class={`todo-item priority-${todo.priority || 'medium'}`}>
            <span class="todo-status-icon">{config.icon}</span>
            <span class="todo-content">{todo.content}</span>
            <div class="todo-meta">priority: {todo.priority || 'medium'}</div>
          </div>
        );
      });

      container.appendChild(section);
    });

    return container;
  }

  /**
   * Example for testing
   */
  livelyExample() {
    // Set project focus
    this.setProjectFocus("src/ai-workspace/index.md");
    
    // Add some file reads/writes
    this.addFileRead("src/ai-workspace/components/lively-agent-board.js");
    this.addFileRead("src/ai-workspace/components/lively-opencode.js");
    this.addFileWritten("src/ai-workspace/components/lively-agent-board.html");
    
    // Add TODOs
    this.updateTodos([
      { content: "Implement feature X", status: "in_progress", priority: "high" },
      { content: "Fix bug in parser", status: "pending", priority: "high" },
      { content: "Add tests for new API", status: "pending", priority: "medium" },
      { content: "Update documentation", status: "completed", priority: "low" },
      { content: "Refactor old code", status: "cancelled", priority: "low" }
    ]);
  }
}
