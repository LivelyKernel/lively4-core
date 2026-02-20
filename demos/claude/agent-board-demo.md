# Agent Board Demo

This demonstrates the lively-agent-board component that visualizes TODOs and session links from opencode sessions.

## Basic Example

<script>
import "src/ai-workspace/components/lively-agent-board.js";

const board = await lively.create("lively-agent-board");
board.style.width = "600px";
board.style.height = "500px";
board.style.display = "block";
board.style.border = "1px solid #ccc";

// Set project focus
board.setProjectFocus("src/ai-workspace/index.md");

// Add file operations
board.addFileRead("src/ai-workspace/components/lively-agent-board.js");
board.addFileRead("src/ai-workspace/components/lively-opencode.js");
board.addFileWritten("src/ai-workspace/components/lively-agent-board.html");
board.addFileWritten("src/ai-workspace/components/lively-agent-board.js");

// Add example TODOs
board.updateTodos([
  { content: "Implement feature X", status: "in_progress", priority: "high" },
  { content: "Fix bug in parser", status: "pending", priority: "high" },
  { content: "Add tests for new API", status: "pending", priority: "medium" },
  { content: "Update documentation", status: "completed", priority: "low" },
  { content: "Refactor old code", status: "cancelled", priority: "low" }
]);

return board;
</script>

## OpenCode Integration

The board is integrated into lively-opencode as a tab alongside Debug Logs:

1. Open lively-opencode
2. Select a session that has TODOs
3. Click the "Board" tab in the right panel
4. TODOs for the current session will be displayed
5. TODOs update in real-time when the AI agent modifies them

## Data Format

TODOs come from the opencode server at `/session/:sessionID/todo`:

```json
[
  {
    "content": "Task description",
    "status": "pending|in_progress|completed|cancelled",
    "priority": "high|medium|low"
  }
]
```

## Features

**Session Links:**
- Project Focus with editable index.md link
- Files read during session (browse:// links)
- Files written during session (edit:// links)

**TODOs:**
- Grouped by status (In Progress, Pending, Completed, Cancelled)
- Color-coded by priority (high=red, medium=orange, low=blue)
- Status icons (⊙ in progress, ☐ pending, ✓ completed, ✗ cancelled)
- Auto-updates via todo.updated events from opencode server
