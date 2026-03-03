# LivelyAgentBoard (Agent Information Display)

<lively-import src="../_navigation.html"></lively-import>

**File:** `lively-agent-board.js`

**Purpose:** Display board for agent information and status

**Extends:** `Morph`

---

## Features

- **TODOs** - Display with status and priority-based color coding
- **Tool Usage Statistics** - Track tool calls and execution counts
- **File Operation Summary** - Files read/written with access counts
- **Session Links** - Project focus and file navigation
- **Reusable** - Can be embedded in different AI components
- **Auto-updating** - Can extract data from OpenCode messages

---

## Properties

```javascript
todos                // Array of todo objects
links                // Object with projectFocus URL
toolUsages           // Map<toolName, count>
fileReadCounts       // Map<filePath, count>
fileWriteCounts      // Map<filePath, count>
workingDirectory     // String - current working directory
projectPath          // String - project path for URL shortening
urlBase              // String - base URL for building file links
```

---

## Data Format

### TODOs Array
```javascript
[
  {
    content: "Task description",
    status: "pending" | "in_progress" | "completed" | "cancelled",
    priority: "high" | "medium" | "low"
  }
]
```

**Status Values:**
- `pending` - Not started
- `in_progress` - Currently working on
- `completed` - Finished
- `cancelled` - No longer needed

**Priority Levels:**
- `high` - 🔴 Red
- `medium` - 🟡 Yellow
- `low` - 🟢 Green

### Tool Usages
```javascript
Map {
  'mcp_read' => 11,
  'mcp_write' => 15,
  'bash' => 2,
  'todowrite' => 14
}
```

### File Operations
```javascript
// Read counts
Map {
  '/home/jens/lively4/lively4-core/src/file1.js' => 3,
  '/home/jens/lively4/lively4-core/src/file2.js' => 1
}

// Write counts
Map {
  '/home/jens/lively4/lively4-core/src/newfile.js' => 1,
  '/home/jens/lively4/lively4-core/src/edited.js' => 2
}
```

### Links
```javascript
{
  projectFocus: "http://localhost:9005/lively4-core/src/ai-workspace//index.md"
}
```

---

## API

### TODO Management

```javascript
updateTodos(todos)
  // Update TODOs array and re-render
  // @param {Array} todos - Array of todo objects
```

### Project Context

```javascript
setProjectFocus(path)
  // Set the project focus link
  // @param {string} path - URL or path to project index.md
  
setContext(context)
  // Set working directory, project path, and URL base
  // @param {Object} context
  // @param {string} context.workingDirectory
  // @param {string} context.projectPath
  // @param {string} context.urlBase
  
updateProjectFocus(project)
  // Update from project object
  // @param {Object} project
  // @param {string} project.url - Project URL (optional)
  // @param {string} project.path - Project path
```

### File Operations

```javascript
addFileRead(path)
  // Track file read and increment count
  // @param {string} path - Absolute file path
  
addFileWritten(path)
  // Track file write and increment count
  // @param {string} path - Absolute file path
```

### Tool Usage

```javascript
addToolUsage(toolName)
  // Track tool usage and increment count
  // @param {string} toolName - Name of the tool used
  
getTotalToolUsages()
  // Get total count across all tools
  // @returns {number}
```

### Bulk Update

```javascript
updateFromMessage(message, context)
  // Extract data from OpenCode message and update board
  // Automatically tracks tool usages and file operations
  // @param {Object} message - OpenCode message with parts array
  // @param {Object} context - Optional context (workingDirectory, projectPath, urlBase)
```

**Example:**
```javascript
const message = {
  parts: [
    { name: 'mcp_read', input: { filePath: '/path/to/file.js' } },
    { name: 'mcp_write', input: { filePath: '/path/to/output.js' } }
  ]
};
board.updateFromMessage(message, {
  workingDirectory: '/home/jens/lively4/lively4-core',
  projectPath: 'src/ai-workspace/',
  urlBase: 'http://localhost:9005/lively4-core'
});
```

### Clear Operations

```javascript
clearFileLinks()
  // Clear file read/write counts
  
clearToolUsages()
  // Clear tool usage counts
  
clearAll()
  // Clear all data (todos, links, counts)
```

---

## Usage Examples

### Basic Setup
```javascript
const board = await lively.create('lively-agent-board');

// Set project focus
board.setProjectFocus("src/ai-workspace/index.md");

// Track tool usages
board.addToolUsage("mcp_read");
board.addToolUsage("mcp_write");

// Track file operations (counts increment automatically)
board.addFileRead("path/to/file.js");
board.addFileRead("path/to/file.js"); // Count: 2
board.addFileWritten("path/to/file.js");

// Update TODOs
board.updateTodos([
  { content: "Implement feature", status: "in_progress", priority: "high" },
  { content: "Write tests", status: "pending", priority: "medium" }
]);
```

### OpenCode Integration
```javascript
// Update from OpenCode message automatically
const board = await lively.create('lively-agent-board');

opencodeComponent.addEventListener('message-updated', (evt) => {
  board.updateFromMessage(evt.detail.message, {
    workingDirectory: '/home/jens/lively4/lively4-core',
    projectPath: 'src/ai-workspace/',
    urlBase: 'http://localhost:9005/lively4-core'
  });
});
```

### Embed in Workspace
```javascript
// In lively-ai-workspace
this.agentBoard = await lively.create('lively-agent-board');
this.get('#agent-board-container').appendChild(this.agentBoard);

// Update as messages flow through
this.agentBoard.updateFromMessage(opencodeMsg, this.getContext());
```

---

## Use Cases

- **Live coding sessions** - Track progress and tool usage
- **Debugging** - See what files are being accessed
- **Project overview** - Understand agent focus areas
- **Performance monitoring** - Tool call frequency and patterns

---

## See Also

- [LivelyAiWorkspace](lively-ai-workspace.md) - Embeds agent board
- [LivelyOpencode](lively-opencode.md) - Provides messages for tracking
- [Architecture Overview](../doc/ai-workspace.md)
