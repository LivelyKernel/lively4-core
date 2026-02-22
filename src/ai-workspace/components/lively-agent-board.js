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
    // Context for building URLs and shortening paths
    this.workingDirectory = null;
    this.projectPath = null;
    this.urlBase = null;
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
   * Set context for URL building and path shortening
   * @param {Object} context - { workingDirectory, projectPath, urlBase }
   */
  setContext(context) {
    this.workingDirectory = context.workingDirectory;
    this.projectPath = context.projectPath;
    this.urlBase = context.urlBase;
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
   * Clear all file links (reads and writes)
   */
  clearFileLinks() {
    this.links.filesRead = [];
    this.links.filesWritten = [];
    this.render();
  }

  /**
   * Clear everything (TODOs and file links)
   */
  clearAll() {
    this.todos = [];
    this.links.projectFocus = null;
    this.links.filesRead = [];
    this.links.filesWritten = [];
    this.render();
  }

  /**
   * Build a full URL for opening a file in browser
   * @param {string} filePath - Absolute file path
   * @returns {string} Full URL for lively.openBrowser
   */
  buildFileUrl(filePath) {
    if (!this.urlBase || !this.workingDirectory) {
      // No context - return path as-is
      return filePath;
    }

    // Remove working directory prefix to get relative path
    let relativePath = filePath;
    if (filePath.startsWith(this.workingDirectory)) {
      relativePath = filePath.substring(this.workingDirectory.length);
      // Remove leading slash if present
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }
    }

    // Build full URL
    const base = this.urlBase.endsWith('/') ? this.urlBase : this.urlBase + '/';
    return base + relativePath;
  }

  /**
   * Shorten a file path for display by removing working directory and project path prefixes
   * @param {string} filePath - Absolute file path
   * @returns {string} Shortened path for display
   */
  shortenPath(filePath) {
    let displayPath = filePath;

    // Remove working directory prefix
    if (this.workingDirectory && filePath.startsWith(this.workingDirectory)) {
      displayPath = filePath.substring(this.workingDirectory.length);
      // Remove leading slash
      if (displayPath.startsWith('/')) {
        displayPath = displayPath.substring(1);
      }
    }

    // Remove project path prefix if it exists
    if (this.projectPath && displayPath.startsWith(this.projectPath)) {
      displayPath = displayPath.substring(this.projectPath.length);
      // Remove leading slash
      if (displayPath.startsWith('/')) {
        displayPath = displayPath.substring(1);
      }
    }

    return displayPath;
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
          <a class="link-path" click={() => {
              debugger
              lively.openBrowser(this.links.projectFocus, true)
            }} title={this.links.projectFocus}>
            Project Focus
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
        const url = this.buildFileUrl(path);
        const displayPath = this.shortenPath(path);
        section.appendChild(
          <div class="link-item file-read">
            <span class="link-icon">📖</span>
            <a class="link-path" click={() => lively.openBrowser(url, true)} title={path}>
              {displayPath}
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
        const url = this.buildFileUrl(path);
        const displayPath = this.shortenPath(path);
        section.appendChild(
          <div class="link-item file-written">
            <span class="link-icon">✏️</span>
            <a class="link-path" click={() => lively.openBrowser(url, true)} title={path}>
              {displayPath}
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
    // Set context for URL building and path shortening
    this.setContext({
      workingDirectory: '/home/jens/lively4/lively4-core',
      projectPath: 'src/ai-workspace',
      urlBase: 'http://localhost:9005/lively4-core'
    });
    
    // Set project focus
    this.setProjectFocus("src/ai-workspace/index.md");
    
    // Add some file reads/writes with full paths
    // These will be shortened to just the relative path within the project
    this.addFileRead("/home/jens/lively4/lively4-core/src/ai-workspace/components/lively-agent-board.js");
    this.addFileRead("/home/jens/lively4/lively4-core/src/ai-workspace/components/lively-opencode.js");
    this.addFileWritten("/home/jens/lively4/lively4-core/src/ai-workspace/components/lively-agent-board.html");
    this.addFileWritten("/home/jens/lively4/lively4-core/src/ai-workspace/test/lively-agent-board-test.js");
    
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
