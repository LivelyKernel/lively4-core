import Morph from 'src/components/widgets/lively-morph.js';

/*MD
# Lively Agent Board

Display board for agent-related information like TODOs, session links, tool usage statistics, and file operations.

**Features:**
- Display TODOs grouped by status
- Priority-based color coding
- Tool usage statistics:
  - Count of each tool used during session
  - Total tool usage count
  - File operation summary (total reads/writes)
- Session links section showing:
  - Project Focus (direct file or directory index.md)
  - Project Tasks (conditional - only for directory-based projects)
  - Files read during session (with read counts)
  - Files written during session (with write counts)
- Reusable across different AI components (lively-opencode, lively-ai-workspace)
- Smart handling of file-based vs directory-based project focus

**Usage:**
```javascript
const board = await lively.create("lively-agent-board");

// Set project focus with project object
board.updateProjectFocus({
  path: 'src/ai-workspace',
  url: 'http://localhost:9005/lively4-core/src/ai-workspace/',
  name: 'ai-workspace',
  isFile: false, // true if focusing on a direct file (not a directory)
  indexContent: '# AI Workspace\n...'
});

// Track tool usages
board.addToolUsage("mcp_read");
board.addToolUsage("mcp_write");

// Add file operations (counts are tracked automatically)
board.addFileRead("path/to/file.js");
board.addFileRead("path/to/file.js"); // Read again - count increments
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
      projectFocus: null
    };
    this.toolUsages = new Map();
    this.fileReadCounts = new Map();
    this.fileWriteCounts = new Map();
    this.workingDirectory = null;
    this.projectPath = null;
    this.urlBase = null;
    this.currentProject = null; // Store full project object
  }

  updateTodos(todos) {
    this.todos = todos || [];
    this.render();
  }

  setProjectFocus(path) {
    this.links.projectFocus = path;
    this.render();
  }

  setContext(context) {
    this.workingDirectory = context.workingDirectory;
    this.projectPath = context.projectPath;
    this.urlBase = context.urlBase;
    this.render();
  }

  addFileRead(path) {
    const count = this.fileReadCounts.get(path) || 0;
    this.fileReadCounts.set(path, count + 1);
    this.render();
  }

  addFileWritten(path) {
    const count = this.fileWriteCounts.get(path) || 0;
    this.fileWriteCounts.set(path, count + 1);
    this.render();
  }

  addToolUsage(toolName) {
    const count = this.toolUsages.get(toolName) || 0;
    this.toolUsages.set(toolName, count + 1);
    this.render();
  }

  /**
   * Update board from an OpenCode message.
   * Scans message parts for tool uses and tracks file operations.
   * 
   * @param {Object} message - OpenCode message object with parts array
   * @param {Object} context - Optional context for URL building and path shortening
   * @param {string} context.workingDirectory - Current working directory
   * @param {string} context.projectPath - Project path for URL shortening
   * @param {string} context.urlBase - Base URL for building file links
   */
  updateFromMessage(message, context) {
    if (!message) return;
    
    // Update context if provided
    if (context) {
      this.setContext(context);
    }
    
    const parts = message.parts || [];
    
    for (const part of parts) {
      const toolName = part.name || part.tool;
      if (!toolName) continue;
      
      // Track all tool usages
      this.addToolUsage(toolName);
      
      // Track file operations specifically
      const input = part.input || part.state?.input || {};
      const filePath = input.filePath || input.path;
      
      if (!filePath) continue;
      
      // Check for Read tools
      if (toolName === 'mcp_read' || toolName === 'read_file' || toolName === 'read') {
        this.addFileRead(filePath);
      }
      
      // Check for Write tools  
      if (toolName === 'mcp_write' || toolName === 'write_file' || toolName === 'write' || 
          toolName === 'mcp_edit' || toolName === 'edit') {
        this.addFileWritten(filePath);
      }
    }
  }

  /**
   * Update project focus from a project object.
   * 
   * @param {Object} project - Project object with url, path, and isFile flag
   * @param {string} project.url - Project URL (optional)
   * @param {string} project.path - Project path
   * @param {boolean} project.isFile - True if the project is a direct file (not a directory)
   */
  updateProjectFocus(project) {
    if (!project) {
      this.currentProject = null;
      this.links.projectFocus = null;
      this.render();
      return;
    }
    
    // Store full project object for later use (e.g., tasks link)
    this.currentProject = project;
    
    // Build project focus URL
    let focusUrl;
    if (project.isFile) {
      // Project is already a file - use it directly
      focusUrl = project.url || project.path;
    } else {
      // Project is a directory - append index.md
      focusUrl = project.url 
        ? project.url + 'index.md' 
        : `${project.path}/index.md`;
    }
    
    this.setProjectFocus(focusUrl);
  }

  /**
   * Get total number of tool usages across all tools
   * @returns {number}
   */
  getTotalToolUsages() {
    let total = 0;
    for (const count of this.toolUsages.values()) {
      total += count;
    }
    return total;
  }

  clearFileLinks() {
    this.fileReadCounts.clear();
    this.fileWriteCounts.clear();
    this.render();
  }

  clearToolUsages() {
    this.toolUsages.clear();
    this.render();
  }

  clearAll() {
    this.todos = [];
    this.links.projectFocus = null;
    this.fileReadCounts.clear();
    this.fileWriteCounts.clear();
    this.toolUsages.clear();
    this.render();
  }

  /**
   * Update board by pulling data directly from an OpenCode component.
   * This is the OO approach - the board knows what it needs and fetches it itself.
   * 
   * @param {LivelyOpencode} opencodeComponent - The OpenCode component to pull data from
   */
  async updateFromOpenCode(opencodeComponent) {
    if (!opencodeComponent) return;
    
    const session = opencodeComponent.currentSession;
    if (!session) {
      // No session - clear board
      this.clearAll();
      return;
    }
    
    // Set context for URL building and path shortening
    this.setContext({
      workingDirectory: opencodeComponent.workingDirectory,
      projectPath: opencodeComponent.currentProject?.path,
      urlBase: opencodeComponent.loadProjectUrlBase()
    });
    
    // Clear file operations before loading new session data
    this.fileReadCounts.clear();
    this.fileWriteCounts.clear();
    this.toolUsages.clear();
    
    // Pull and update TODOs
    const todos = await opencodeComponent.fetchTodosForSession(session.id);
    this.updateTodos(todos);
    
    // Pull and update project focus
    if (opencodeComponent.currentProject) {
      this.updateProjectFocus(opencodeComponent.currentProject);
    } else {
      this.links.projectFocus = null;
    }
    
    // Pull messages and scan for file operations
    const messages = opencodeComponent.messages.get(session.id);
    if (messages) {
      for (const message of messages) {
        this.updateFromMessage(message, {
          workingDirectory: this.workingDirectory,
          projectPath: this.projectPath,
          urlBase: this.urlBase
        });
      }
    }
    
    // Final render with all data
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

    // Render Tool Usage Statistics section (at the bottom)
    const statsSection = this.renderStatsSection();
    if (statsSection) {
      content.appendChild(statsSection);
    }

    // Show empty message if no content
    if (!statsSection && !linksSection && !todosSection) {
      content.appendChild(<div class="empty-message">No data to display</div>);
    }
  }

  /**
   * Render the statistics section showing tool usages and file operation counts
   */
  renderStatsSection() {
    const hasStats = this.toolUsages.size > 0 || 
                     this.fileReadCounts.size > 0 || 
                     this.fileWriteCounts.size > 0;

    if (!hasStats) return null;

    const section = <div class="board-section stats-section">
      <div class="board-section-title">Session Statistics</div>
    </div>;

    // Tool Usage Stats
    if (this.toolUsages.size > 0) {
      const totalToolUsages = this.getTotalToolUsages();
      section.appendChild(
        <div class="stat-group">
          <div class="stat-group-header">Tool Usage (Total: {totalToolUsages})</div>
        </div>
      );

      // Sort tools by usage count (descending)
      const sortedTools = Array.from(this.toolUsages.entries())
        .sort((a, b) => b[1] - a[1]);

      sortedTools.forEach(([toolName, count]) => {
        section.appendChild(
          <div class="stat-item">
            <span class="stat-name">{toolName}</span>
            <span class="stat-count">{count}</span>
          </div>
        );
      });
    }

    // File Read/Write Summary
    const totalReads = Array.from(this.fileReadCounts.values())
      .reduce((sum, count) => sum + count, 0);
    const totalWrites = Array.from(this.fileWriteCounts.values())
      .reduce((sum, count) => sum + count, 0);

    if (totalReads > 0 || totalWrites > 0) {
      section.appendChild(
        <div class="stat-group">
          <div class="stat-group-header">File Operations</div>
        </div>
      );

      if (totalReads > 0) {
        section.appendChild(
          <div class="stat-item">
            <span class="stat-name">Total Reads</span>
            <span class="stat-count">{totalReads} ({this.fileReadCounts.size} files)</span>
          </div>
        );
      }

      if (totalWrites > 0) {
        section.appendChild(
          <div class="stat-item">
            <span class="stat-name">Total Writes</span>
            <span class="stat-count">{totalWrites} ({this.fileWriteCounts.size} files)</span>
          </div>
        );
      }
    }

    return section;
  }

  renderLinksSection() {
    const filesRead = Array.from(this.fileReadCounts.keys());
    const filesWritten = Array.from(this.fileWriteCounts.keys());
    
    const hasLinks = this.links.projectFocus || 
                     filesRead.length > 0 || 
                     filesWritten.length > 0;

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
              lively.openBrowser(this.links.projectFocus, true)
            }} title={this.links.projectFocus}>
            Project Focus
          </a>
        </div>
      );
    }

    // Project Tasks - only show for directory-based projects
    if (this.currentProject && !this.currentProject.isFile) {
      const tasksPath = this.currentProject.path + '/tasks.md';
      const tasksUrl = this.currentProject.url 
        ? this.currentProject.url + 'tasks.md'
        : tasksPath;
      
      section.appendChild(
        <div class="link-item">
          <span class="link-icon">📋</span>
          <a class="link-path" click={() => {
              lively.openBrowser(tasksUrl, true)
            }} title={tasksPath}>
            Project Tasks
          </a>
        </div>
      );
    }

    // Files Read
    if (filesRead.length > 0) {
      section.appendChild(
        <div class="link-group-title">Files Read ({filesRead.length})</div>
      );
      
      filesRead.forEach(path => {
        const url = this.buildFileUrl(path);
        const displayPath = this.shortenPath(path);
        const readCount = this.fileReadCounts.get(path) || 0;
        const linkItem = <div class="link-item file-read">
          <span class="link-icon">📖</span>
          <a class="link-path" click={() => lively.openBrowser(url, true)} title={path}>
            {displayPath}
          </a>
        </div>;
        
        if (readCount > 1) {
          linkItem.appendChild(<span class="file-count">×{readCount}</span>);
        }
        
        section.appendChild(linkItem);
      });
    }

    // Files Written
    if (filesWritten.length > 0) {
      section.appendChild(
        <div class="link-group-title">Files Written ({filesWritten.length})</div>
      );
      
      filesWritten.forEach(path => {
        const url = this.buildFileUrl(path);
        const displayPath = this.shortenPath(path);
        const writeCount = this.fileWriteCounts.get(path) || 0;
        const linkItem = <div class="link-item file-written">
          <span class="link-icon">✏️</span>
          <a class="link-path" click={() => lively.openBrowser(url, true)} title={path}>
            {displayPath}
          </a>
        </div>;
        
        if (writeCount > 1) {
          linkItem.appendChild(<span class="file-count">×{writeCount}</span>);
        }
        
        section.appendChild(linkItem);
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
    
    // Set project focus using proper project object
    this.updateProjectFocus({
      path: 'src/ai-workspace',
      url: 'http://localhost:9005/lively4-core/src/ai-workspace/',
      name: 'ai-workspace',
      isFile: false,
      indexContent: '# AI Workspace\n\nExample project...'
    });
    
    // Add some tool usages (simulating AI agent activity)
    this.addToolUsage('mcp_read');
    this.addToolUsage('mcp_read');
    this.addToolUsage('mcp_read');
    this.addToolUsage('mcp_write');
    this.addToolUsage('mcp_write');
    this.addToolUsage('mcp_edit');
    this.addToolUsage('mcp_bash');
    this.addToolUsage('mcp_glob');
    this.addToolUsage('mcp_grep');
    this.addToolUsage('mcp_grep');
    
    // Add some file reads/writes with full paths
    // These will be shortened to just the relative path within the project
    // Multiple reads/writes of same file to demonstrate counts
    this.addFileRead("/home/jens/lively4/lively4-core/src/ai-workspace/components/lively-agent-board.js");
    this.addFileRead("/home/jens/lively4/lively4-core/src/ai-workspace/components/lively-agent-board.js"); // Read again
    this.addFileRead("/home/jens/lively4/lively4-core/src/ai-workspace/components/lively-opencode.js");
    this.addFileWritten("/home/jens/lively4/lively4-core/src/ai-workspace/components/lively-agent-board.html");
    this.addFileWritten("/home/jens/lively4/lively4-core/src/ai-workspace/components/lively-agent-board.html"); // Write again
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
