# Agent Board & Coordination Architecture

**Design Document for Unified Agent Board and Blackboard System**

**Status:** Design Phase  
**Created:** 2026-02-27  
**Last Updated:** 2026-02-27

---

## Table of Contents

1. [Overview](#overview)
2. [Design Goals](#design-goals)
3. [Architecture](#architecture)
4. [Voice Agent Context Access](#voice-agent-context-access)
5. [Voice Agent File Access](#voice-agent-file-access)
6. [Voice Agent Board Editing](#voice-agent-board-editing)
7. [Blackboard Visualization](#blackboard-visualization)
8. [Data Model](#data-model)
9. [User Interface Design](#user-interface-design)
10. [Implementation Phases](#implementation-phases)
11. [Evaluation Levels & Capability Maturity](#evaluation-levels--capability-maturity)
12. [Open Questions](#open-questions)

---

## Overview

The Agent Board system unifies two concepts:

1. **Agent Board** - Real-time activity tracking (current: `lively-agent-board`)
2. **Coordination Board (Blackboard)** - Shared memory for multi-agent collaboration (current: `workspace.blackboard`)

This document outlines the design for enabling true multi-agent coordination where:

- The voice agent can **see** what the coding agent is doing
- The voice agent can **read** project files and tasks
- The voice agent can **edit** the coordination board
- Users can **visualize** the shared coordination state in real-time

### Current Problems

**Problem 1: Information Silos**
- Voice agent (OpenAI Realtime) only sees its own conversation
- Coding agent (OpenCode/Claude) works independently
- No shared context between agents
- User must manually relay information

**Problem 2: Limited Voice Agent Capabilities**
- Can execute code via `evaluate_code` tool
- Cannot read files from filesystem
- Cannot see coding agent's work
- Cannot contribute to shared project state

**Problem 3: Invisible Blackboard**
- Blackboard exists as JavaScript object only
- No UI visualization of coordination state
- Agent board shows activity, not coordination
- User cannot see what agents are coordinating on

**Problem 4: No Coordination Protocol**
- Agents don't communicate through blackboard
- No structured way to share tasks/notes/context
- Manual handoff between agents
- Lost context during agent switches

---

## Design Goals

### Primary Goals

1. **Transparent Coordination** - Users see what both agents are doing and planning
2. **Context Sharing** - Both agents have access to full conversation and project state
3. **Agent Collaboration** - Agents coordinate through structured blackboard
4. **Real-time Visualization** - UI reflects blackboard state as it changes

### Non-Goals

- Full agent autonomy (user remains in control)
- Complex AI-to-AI protocols (keep simple)
- Real-time voice transcription UI (future enhancement)

---

## Architecture

### Conceptual Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    lively-ai-workspace                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              COORDINATION BLACKBOARD                    │   │
│  │  ┌──────────┬──────────┬────────────┬─────────────┐    │   │
│  │  │  Tasks   │  Notes   │  Context   │  Resources  │    │   │
│  │  └──────────┴──────────┴────────────┴─────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│           ▲                                    ▲                │
│           │ read/write                         │ read/write     │
│           │                                    │                │
│  ┌────────┴────────────┐          ┌───────────┴────────────┐   │
│  │ Voice Agent         │          │ Coding Agent           │   │
│  │ (Realtime Chat)     │◄────────►│ (OpenCode)             │   │
│  │                     │          │                        │   │
│  │ Tools:              │          │ Tools:                 │   │
│  │ • evaluate_code     │          │ • mcp_read/write       │   │
│  │ • read_blackboard   │          │ • mcp_bash/grep/glob   │   │
│  │ • write_blackboard  │          │ • mcp_edit             │   │
│  │ • read_coding_msgs  │          │ • mcp_todowrite        │   │
│  │ • read_tasks_file   │          │ • (all MCP tools)      │   │
│  └─────────────────────┘          └────────────────────────┘   │
│           │                                    │                │
│           └────────────────┬───────────────────┘                │
│                            ▼                                    │
│              ┌─────────────────────────────┐                    │
│              │   Agent Board UI            │                    │
│              │   (Visualizes Blackboard)   │                    │
│              └─────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**lively-ai-workspace (Coordinator)**
- Maintains blackboard state
- Routes messages between agents
- Dispatches blackboard change events
- Persists workspace state to database

**openai-realtime-chat (Voice Agent)**
- Receives enhanced context including coding agent messages
- Has tools to read/write blackboard
- Can read project files via workspace proxy
- Reports activity to blackboard

**lively-opencode (Coding Agent)**
- Already has file access via MCP tools
- Writes TODOs to blackboard via `mcp_todowrite`
- Reports file operations to blackboard
- Reads blackboard for context

**lively-agent-board (Visualization)**
- Displays blackboard state visually
- Shows tasks, notes, context, resources
- Updates in real-time via events
- Interactive (click to edit, navigate, expand)

---

## Voice Agent Context Access

### Goal
Enable voice agent to see all coding agent messages for full context awareness.

### Design: Message Context Injection

**Approach 1: System Message Context (Recommended)**

When voice agent starts or user switches sessions, inject coding agent's conversation as context:

```javascript
// In WorkspaceToolset (realtime-chat-tools/workspace-toolset.js)
async buildSystemContext() {
  const workspace = this.workspace;
  const opencodeComponent = workspace.opencodeComponent;
  
  // Get coding agent messages
  const codingMessages = opencodeComponent.getCapturedEvents()
    .filter(evt => evt.type === 'message')
    .map(evt => this.formatMessageForContext(evt));
  
  // Build context string
  const context = `
CODING AGENT CONVERSATION HISTORY:
${codingMessages.join('\n\n')}

You have full context of what the coding agent has been working on.
Use this information to assist the user.
`;
  
  return context;
}
```

**Approach 2: Tool-Based Access**

Provide explicit tool for voice agent to query coding messages:

```javascript
// New tool: read_coding_messages
{
  name: "read_coding_messages",
  description: "Read messages from the coding agent's conversation. Use this to understand what the coding agent has been working on.",
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Number of recent messages to retrieve (default: 10)"
      },
      filter: {
        type: "string",
        enum: ["all", "user", "assistant", "tool_use"],
        description: "Filter messages by role"
      }
    }
  }
}
```

**Implementation:**

```javascript
// In WorkspaceToolset
async handleReadCodingMessages({ limit = 10, filter = "all" }) {
  const opencodeComponent = this.workspace.opencodeComponent;
  if (!opencodeComponent) {
    return { error: "Coding agent not initialized" };
  }
  
  const messages = opencodeComponent.getCapturedEvents()
    .filter(evt => evt.type === 'message')
    .filter(msg => filter === 'all' || msg.role === filter)
    .slice(-limit)
    .map(msg => ({
      role: msg.role,
      content: this.summarizeMessage(msg),
      timestamp: msg.timestamp,
      tools: msg.parts?.map(p => p.name).filter(Boolean)
    }));
  
  return {
    messages,
    total: messages.length,
    summary: this.generateConversationSummary(messages)
  };
}

summarizeMessage(message) {
  // Summarize long messages to avoid token bloat
  if (message.text && message.text.length > 500) {
    return message.text.substring(0, 500) + "... [truncated]";
  }
  return message.text || "[tool use message]";
}
```

### Recommended Approach

**Hybrid Strategy:**
1. Inject summary context on session start (last 5-10 messages)
2. Provide `read_coding_messages` tool for on-demand deep dive
3. Auto-refresh context when coding agent sends important updates

### Update Frequency

**When to Update Voice Agent Context:**
- On workspace session switch
- After coding agent completes major task
- When user explicitly asks voice agent about coding work
- Every N messages (e.g., every 10) to stay fresh

---

## Voice Agent File Access

### Goal
Allow voice agent to read project files like `tasks.md` for task understanding and coordination.

### Challenge: OpenAI Realtime API Limitations

The voice agent runs in browser and uses OpenAI Realtime API, which:
- Does **not** have direct filesystem access
- Does **not** have MCP tools like `mcp_read`
- **Can** execute JavaScript via `evaluate_code` tool

### Solution: Workspace Proxy Pattern

Create workspace-level tools that voice agent can call, which proxy through to file operations:

```javascript
// New tool: read_project_file
{
  name: "read_project_file",
  description: "Read a file from the current project (e.g., tasks.md, index.md). Use this to understand project context, tasks, and documentation.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Relative path to file within project (e.g., 'tasks.md', 'doc/architecture.md')"
      },
      maxLines: {
        type: "number",
        description: "Maximum number of lines to read (default: 100)"
      }
    },
    required: ["path"]
  }
}
```

**Implementation:**

```javascript
// In WorkspaceToolset (realtime-chat-tools/workspace-toolset.js)
async handleReadProjectFile({ path, maxLines = 100 }) {
  const workspace = this.workspace;
  const opencodeComponent = workspace.opencodeComponent;
  
  // Get current project path
  const projectPath = opencodeComponent?.currentProject?.path;
  if (!projectPath) {
    return { 
      error: "No project focused. Ask user to select a project first.",
      availableProjects: await workspace.getRecentProjectsForWorkingDir()
    };
  }
  
  // Build full path
  const workingDir = opencodeComponent.workingDirectory;
  const fullPath = `${workingDir}/${projectPath}/${path}`;
  
  // Read file via lively.files API
  try {
    const content = await lively.files.loadFile(fullPath);
    const lines = content.split('\n').slice(0, maxLines);
    
    return {
      path,
      fullPath,
      lines: lines.length,
      truncated: content.split('\n').length > maxLines,
      content: lines.join('\n')
    };
  } catch (error) {
    return {
      error: `Failed to read file: ${error.message}`,
      path: fullPath
    };
  }
}
```

### Pre-defined File Shortcuts

For common files, provide convenience tools:

```javascript
// Tool: read_tasks
{
  name: "read_tasks",
  description: "Read the project tasks.md file to see current tasks and priorities.",
  parameters: { type: "object", properties: {} }
}

// Implementation
async handleReadTasks() {
  return this.handleReadProjectFile({ path: "tasks.md" });
}

// Tool: read_project_index
{
  name: "read_project_index", 
  description: "Read the project index.md file for project overview and structure.",
  parameters: { type: "object", properties: {} }
}

// Implementation
async handleReadProjectIndex() {
  return this.handleReadProjectFile({ path: "index.md" });
}
```

### File Write Access (Future)

For now, voice agent should **not** have direct file write access:
- Too risky (accidental overwrites)
- Coding agent is better suited for file operations
- Voice agent can **suggest** edits by writing to blackboard

Later, could add:
```javascript
// Future tool: suggest_file_edit
{
  name: "suggest_file_edit",
  description: "Suggest an edit to a file. This writes to blackboard for coding agent to review.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string" },
      description: { type: "string" },
      reasoning: { type: "string" }
    }
  }
}
```

---

## Voice Agent Board Editing

### Goal
Allow voice agent to create tasks, add notes, and update coordination state on the blackboard.

### Blackboard API

Define clear API for agents to interact with blackboard:

```javascript
// In lively-ai-workspace.js
class BlackboardAPI {
  
  // Tasks
  addTask(title, description, priority = 'medium', source = 'user') {
    const task = {
      id: generateUuid(),
      title,
      description,
      status: 'pending',
      priority, // 'high', 'medium', 'low'
      source, // 'user', 'voice-agent', 'code-agent'
      created: Date.now(),
      updated: Date.now()
    };
    this.blackboard.tasks.push(task);
    this.dispatchBlackboardEvent('task-added', task);
    this.saveBlackboard();
    return task;
  }
  
  updateTaskStatus(taskId, status, source = 'user') {
    const task = this.blackboard.tasks.find(t => t.id === taskId);
    if (!task) return null;
    
    task.status = status; // 'pending', 'in_progress', 'completed', 'cancelled'
    task.updated = Date.now();
    task.updatedBy = source;
    
    this.dispatchBlackboardEvent('task-updated', task);
    this.saveBlackboard();
    return task;
  }
  
  // Notes
  addNote(content, source = 'user', tags = []) {
    const note = {
      id: generateUuid(),
      content,
      source, // 'user', 'voice-agent', 'code-agent'
      tags,
      timestamp: Date.now()
    };
    this.blackboard.notes.push(note);
    this.dispatchBlackboardEvent('note-added', note);
    this.saveBlackboard();
    return note;
  }
  
  // Context
  updateContext(key, value, source = 'user') {
    if (!this.blackboard.context) {
      this.blackboard.context = {};
    }
    this.blackboard.context[key] = {
      value,
      source,
      updated: Date.now()
    };
    this.dispatchBlackboardEvent('context-updated', { key, value });
    this.saveBlackboard();
  }
  
  // Query
  getTasks(filter = {}) {
    let tasks = this.blackboard.tasks || [];
    
    if (filter.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }
    if (filter.priority) {
      tasks = tasks.filter(t => t.priority === filter.priority);
    }
    if (filter.source) {
      tasks = tasks.filter(t => t.source === filter.source);
    }
    
    return tasks;
  }
  
  getNotes(limit = 10) {
    return (this.blackboard.notes || [])
      .slice(-limit)
      .reverse();
  }
  
  getContext() {
    return this.blackboard.context || {};
  }
}
```

### Voice Agent Tools for Blackboard

```javascript
// Tool: add_task_to_board
{
  name: "add_task_to_board",
  description: "Add a new task to the project blackboard. Use this when user mentions work that needs to be done.",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Short task title (e.g., 'Fix streaming bug')"
      },
      description: {
        type: "string",
        description: "Detailed task description"
      },
      priority: {
        type: "string",
        enum: ["high", "medium", "low"],
        description: "Task priority"
      }
    },
    required: ["title", "description"]
  }
}

// Tool: update_task_status
{
  name: "update_task_status",
  description: "Update the status of a task on the blackboard. Use when user indicates work is in progress or completed.",
  parameters: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "Task ID (use read_blackboard to find)"
      },
      status: {
        type: "string",
        enum: ["pending", "in_progress", "completed", "cancelled"]
      }
    },
    required: ["taskId", "status"]
  }
}

// Tool: add_note_to_board
{
  name: "add_note_to_board",
  description: "Add a note to the blackboard. Use for important insights, decisions, or context that should be shared with the coding agent.",
  parameters: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "Note content"
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags (e.g., ['decision', 'bug', 'feature'])"
      }
    },
    required: ["content"]
  }
}

// Tool: read_blackboard
{
  name: "read_blackboard",
  description: "Read the current state of the project blackboard including tasks, notes, and context.",
  parameters: {
    type: "object",
    properties: {
      section: {
        type: "string",
        enum: ["all", "tasks", "notes", "context"],
        description: "Which section to read (default: all)"
      }
    }
  }
}
```

**Implementation:**

```javascript
// In WorkspaceToolset
async handleAddTaskToBoard({ title, description, priority = 'medium' }) {
  const task = this.workspace.blackboardAPI.addTask(
    title, 
    description, 
    priority, 
    'voice-agent'
  );
  
  return {
    success: true,
    task: {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority
    },
    message: `Task added to blackboard: "${title}"`
  };
}

async handleUpdateTaskStatus({ taskId, status }) {
  const task = this.workspace.blackboardAPI.updateTaskStatus(
    taskId, 
    status, 
    'voice-agent'
  );
  
  if (!task) {
    return { 
      success: false, 
      error: "Task not found" 
    };
  }
  
  return {
    success: true,
    task: {
      id: task.id,
      title: task.title,
      status: task.status
    },
    message: `Task "${task.title}" updated to ${status}`
  };
}

async handleAddNoteToBoard({ content, tags = [] }) {
  const note = this.workspace.blackboardAPI.addNote(
    content,
    'voice-agent',
    tags
  );
  
  return {
    success: true,
    note: {
      id: note.id,
      content: note.content,
      timestamp: note.timestamp
    },
    message: "Note added to blackboard"
  };
}

async handleReadBlackboard({ section = 'all' }) {
  const blackboard = this.workspace.blackboard;
  
  if (section === 'tasks' || section === 'all') {
    const tasks = this.workspace.blackboardAPI.getTasks();
    return {
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        source: t.source
      })),
      summary: `${tasks.length} tasks (${tasks.filter(t => t.status === 'in_progress').length} in progress)`
    };
  }
  
  if (section === 'notes' || section === 'all') {
    const notes = this.workspace.blackboardAPI.getNotes(10);
    return {
      notes: notes.map(n => ({
        content: n.content,
        source: n.source,
        tags: n.tags,
        timestamp: n.timestamp
      })),
      summary: `${notes.length} recent notes`
    };
  }
  
  if (section === 'context' || section === 'all') {
    const context = this.workspace.blackboardAPI.getContext();
    return {
      context,
      summary: Object.keys(context).join(', ')
    };
  }
}
```

### User Confirmation for Critical Operations

For safety, some operations should require user confirmation:

```javascript
async handleAddTaskToBoard({ title, description, priority }) {
  // Check if user wants confirmation for voice-initiated tasks
  if (this.workspace.settings.confirmVoiceTasks) {
    // Use question tool to ask user
    const response = await this.useQuestion({
      question: `Voice agent wants to add task: "${title}". Allow?`,
      options: ["Yes", "No", "Yes and don't ask again"]
    });
    
    if (response === "No") {
      return { success: false, message: "User declined" };
    }
    
    if (response === "Yes and don't ask again") {
      this.workspace.settings.confirmVoiceTasks = false;
    }
  }
  
  // Proceed with adding task
  // ...
}
```

---

## Blackboard Visualization

### Goal
Make blackboard state visible and interactive in the agent board UI.

### UI Design: Unified Agent Board

Transform `lively-agent-board` from activity tracker to full blackboard visualizer:

```
┌─ Agent Board ──────────────────────────────────────────┐
│ 📁 PROJECT CONTEXT                                     │
│   src/ai-workspace/                                    │
│   📋 tasks.md • 📖 index.md                           │
│                                                        │
│ ✓ TASKS (5 total, 2 in progress)                      │
│   ├─ High Priority                                    │
│   │  ⊙ Fix streaming bug (in_progress) 🎙️           │
│   │     Added by: voice-agent, 2m ago                │
│   │     Context: User reported final message missing │
│   │  ☐ Update agent board UI (pending) 💻           │
│   │     Added by: code-agent, 15m ago                │
│   ├─ Medium Priority                                  │
│   │  ☐ Add tests for blackboard (pending) 💻        │
│   └─ [▼] Completed (2)                               │
│                                                        │
│ 📝 NOTES (3 recent)                                    │
│   🎙️ "User confirmed task approach" (voice, 5m ago)  │
│   💻 "Tests passing after refactor" (code, 12m ago)  │
│   👤 "Focus on streaming first" (user, 18m ago)      │
│   [Show all notes...]                                 │
│                                                        │
│ 🧠 SHARED CONTEXT                                      │
│   Current Focus: Streaming message rendering          │
│   Active Files: lively-opencode.js (×5 reads)        │
│   Key Concepts: event-capture, message-widgets        │
│                                                        │
│ 📊 SESSION ACTIVITY [▼]                               │
│   ├─ Tool Usage: 42 calls (mcp_read×15, ...)        │
│   ├─ Files: 17 reads, 5 writes                       │
│   └─ Duration: 45 minutes                             │
│                                                        │
│ 🎤 AGENT STATUS                                        │
│   Voice: Listening • Last: "What's next?" (30s ago)  │
│   Code: Idle • Last: Updated tests (2m ago)          │
└────────────────────────────────────────────────────────┘
```

### Visual Language

**Source Icons:**
- 👤 User-created
- 🎙️ Voice agent
- 💻 Code agent

**Status Icons:**
- ⊙ In Progress (animated pulse)
- ☐ Pending
- ✓ Completed
- ✗ Cancelled

**Priority Colors:**
- 🔴 High priority (red border)
- 🟡 Medium priority (yellow border)
- 🔵 Low priority (blue border)

**Interactive Elements:**
- Click task → expand details, show history
- Click file → open in browser
- Click note → show full content
- Drag task → reorder priority
- Right-click → context menu (edit, delete, assign)

### Real-time Updates

Board updates via custom events:

```javascript
// In lively-ai-workspace.js
dispatchBlackboardEvent(type, data) {
  this.dispatchEvent(new CustomEvent('blackboard-update', {
    detail: { type, data },
    bubbles: true
  }));
}

// In lively-agent-board.js
connectedCallback() {
  super.connectedCallback();
  
  // Listen for blackboard updates
  lively.addEventListener('blackboard-updates', this, 'blackboard-update', 
    evt => this.handleBlackboardUpdate(evt.detail)
  );
}

handleBlackboardUpdate({ type, data }) {
  switch(type) {
    case 'task-added':
      this.addTaskToUI(data);
      break;
    case 'task-updated':
      this.updateTaskInUI(data);
      break;
    case 'note-added':
      this.addNoteToUI(data);
      break;
    case 'context-updated':
      this.updateContextInUI(data);
      break;
  }
}

// Incremental UI updates (NOT full re-render)
addTaskToUI(task) {
  const taskSection = this.get('#tasksSection');
  const priorityGroup = this.get(`#priority-${task.priority}`);
  
  const taskElement = this.createTaskElement(task);
  priorityGroup.appendChild(taskElement);
  
  // Animate entrance
  taskElement.style.animation = 'slideIn 0.3s ease-out';
}

updateTaskInUI(task) {
  const existingElement = this.get(`[data-task-id="${task.id}"]`);
  if (!existingElement) return;
  
  // Update status icon
  const icon = existingElement.get('.task-status-icon');
  icon.textContent = this.getStatusIcon(task.status);
  
  // Update classes
  existingElement.className = `task-item priority-${task.priority} status-${task.status}`;
  
  // Flash to indicate change
  existingElement.style.animation = 'flash 0.5s ease-out';
}
```

### Persistence

Blackboard state persists to workspace database:

```javascript
// In lively-ai-workspace.js
async saveBlackboard() {
  if (!this.workspaceId) return;
  
  const workspace = await this.getWorkspace(this.workspaceId);
  workspace.blackboard = this.blackboard;
  workspace.lastActivityTime = Date.now();
  
  await LivelyAiWorkspace.historydb.workspaces.put(workspace);
}

async loadBlackboard() {
  if (!this.workspaceId) return;
  
  const workspace = await this.getWorkspace(this.workspaceId);
  if (workspace.blackboard) {
    this.blackboard = workspace.blackboard;
    this.renderBlackboard();
  }
}
```

---

## Data Model

### Blackboard Schema

```javascript
{
  // Tasks - Structured work items
  tasks: [
    {
      id: string,              // UUID
      title: string,           // Short title
      description: string,     // Full description
      status: enum,           // 'pending' | 'in_progress' | 'completed' | 'cancelled'
      priority: enum,         // 'high' | 'medium' | 'low'
      source: enum,           // 'user' | 'voice-agent' | 'code-agent'
      created: timestamp,     // Creation time
      updated: timestamp,     // Last update time
      updatedBy: string,      // Who updated
      assignedTo: string,     // Optional: which agent
      tags: string[],         // Optional: categorization
      relatedFiles: string[], // Optional: associated files
      parentId: string        // Optional: for subtasks
    }
  ],
  
  // Notes - Unstructured observations
  notes: [
    {
      id: string,
      content: string,        // Note text (markdown supported)
      source: enum,          // 'user' | 'voice-agent' | 'code-agent'
      tags: string[],        // Categorization
      timestamp: timestamp,
      references: [          // Links to tasks, files, messages
        { type: string, id: string }
      ]
    }
  ],
  
  // Context - Shared state
  context: {
    currentFocus: {
      value: string,         // What we're working on now
      source: string,
      updated: timestamp
    },
    activeFiles: {
      value: string[],       // Files being worked on
      source: string,
      updated: timestamp
    },
    keyConcepts: {
      value: string[],       // Important concepts/patterns
      source: string,
      updated: timestamp
    },
    // Arbitrary key-value pairs
    [key]: {
      value: any,
      source: string,
      updated: timestamp
    }
  },
  
  // Resources - File operations, links
  resources: {
    filesRead: Map<path, count>,
    filesWritten: Map<path, count>,
    externalLinks: [
      { url: string, description: string, added: timestamp }
    ]
  },
  
  // Coordination - Agent status
  coordination: {
    voiceAgent: {
      status: enum,          // 'idle' | 'listening' | 'speaking' | 'processing'
      lastActivity: timestamp,
      currentTask: string    // Task ID if working on one
    },
    codeAgent: {
      status: enum,          // 'idle' | 'working' | 'waiting'
      lastActivity: timestamp,
      currentTask: string
    }
  },
  
  // Metadata
  lastUpdate: timestamp,
  version: number           // Schema version for migrations
}
```

### Database Schema Updates

Extend workspace database to store blackboard:

```javascript
static get historydb() {
  var db = new Dexie("lively-ai-workspace-history");
  db.version(8).stores({  // Increment version
    workspaces: 'id, timestamp, lastActivityTime, title, conversationId, opencodeSessionId',
  }).upgrade(function(trans) {
    // Initialize blackboard for existing workspaces
    trans.workspaces.toCollection().modify(workspace => {
      if (!workspace.blackboard) {
        workspace.blackboard = {
          tasks: [],
          notes: [],
          context: {},
          resources: {},
          coordination: {},
          lastUpdate: Date.now(),
          version: 1
        };
      }
    });
  });
  return db;
}
```

---

## User Interface Design

### Board Layout

```html
<template id="lively-agent-board">
  <div id="boardContainer">
    
    <!-- Project Context Section -->
    <div class="board-section context-section">
      <div class="section-header">
        📁 Project Context
      </div>
      <div class="context-content">
        <div class="project-path" id="projectPath">
          <!-- e.g., src/ai-workspace/ -->
        </div>
        <div class="project-files" id="projectFiles">
          <!-- Quick links to key files -->
        </div>
      </div>
    </div>
    
    <!-- Tasks Section -->
    <div class="board-section tasks-section">
      <div class="section-header">
        ✓ Tasks
        <span class="task-summary" id="taskSummary">
          <!-- e.g., "5 total, 2 in progress" -->
        </span>
      </div>
      
      <div class="tasks-content">
        <!-- Grouped by priority -->
        <div class="priority-group" id="priority-high">
          <div class="priority-header">High Priority</div>
          <div class="task-list">
            <!-- Task items -->
          </div>
        </div>
        
        <div class="priority-group" id="priority-medium">
          <div class="priority-header">Medium Priority</div>
          <div class="task-list"></div>
        </div>
        
        <div class="priority-group" id="priority-low">
          <div class="priority-header">Low Priority</div>
          <div class="task-list"></div>
        </div>
        
        <div class="priority-group collapsed" id="priority-completed">
          <div class="priority-header collapsible">
            Completed (0)
          </div>
          <div class="task-list"></div>
        </div>
      </div>
    </div>
    
    <!-- Notes Section -->
    <div class="board-section notes-section">
      <div class="section-header">
        📝 Notes
        <span class="note-count" id="noteCount">
          <!-- e.g., "3 recent" -->
        </span>
      </div>
      <div class="notes-content" id="notesContent">
        <!-- Note items -->
      </div>
      <button class="show-all-notes" id="showAllNotesButton">
        Show all notes...
      </button>
    </div>
    
    <!-- Shared Context Section -->
    <div class="board-section context-section">
      <div class="section-header">
        🧠 Shared Context
      </div>
      <div class="context-content" id="sharedContext">
        <!-- Key-value context items -->
      </div>
    </div>
    
    <!-- Session Activity Section (collapsible) -->
    <div class="board-section activity-section collapsed">
      <div class="section-header collapsible">
        📊 Session Activity
      </div>
      <div class="activity-content" id="activityContent">
        <!-- Tool usage stats, file operations -->
      </div>
    </div>
    
    <!-- Agent Status Section -->
    <div class="board-section status-section">
      <div class="section-header">
        🎤 Agent Status
      </div>
      <div class="status-content">
        <div class="agent-status voice-status">
          <span class="agent-label">Voice:</span>
          <span class="agent-state" id="voiceAgentState">Idle</span>
        </div>
        <div class="agent-status code-status">
          <span class="agent-label">Code:</span>
          <span class="agent-state" id="codeAgentState">Idle</span>
        </div>
      </div>
    </div>
    
  </div>
</template>
```

### Task Item Template

```javascript
createTaskElement(task) {
  const sourceIcon = {
    'user': '👤',
    'voice-agent': '🎙️',
    'code-agent': '💻'
  }[task.source] || '•';
  
  const statusIcon = {
    'pending': '☐',
    'in_progress': '⊙',
    'completed': '✓',
    'cancelled': '✗'
  }[task.status];
  
  const element = <div 
    class={`task-item priority-${task.priority} status-${task.status}`}
    data-task-id={task.id}
  >
    <div class="task-header">
      <span class="task-status-icon">{statusIcon}</span>
      <span class="task-title">{task.title}</span>
      <span class="task-source-icon">{sourceIcon}</span>
    </div>
    <div class="task-meta">
      Added by: {task.source}, {this.formatTimestamp(task.created)}
    </div>
    <div class="task-description collapsed">
      {task.description}
    </div>
    <div class="task-actions">
      <button class="task-action" click={() => this.expandTask(task.id)}>
        Details
      </button>
      <button class="task-action" click={() => this.updateTaskStatus(task.id)}>
        Update
      </button>
    </div>
  </div>;
  
  return element;
}
```

### Styling Enhancements

```css
/* Task items with priority borders */
.task-item.priority-high {
  border-left: 4px solid #ff4444;
}

.task-item.priority-medium {
  border-left: 4px solid #ffaa00;
}

.task-item.priority-low {
  border-left: 4px solid #4444ff;
}

/* Status-based styling */
.task-item.status-in_progress .task-status-icon {
  animation: pulse 1.5s ease-in-out infinite;
}

.task-item.status-completed {
  opacity: 0.6;
  text-decoration: line-through;
}

/* Source icons */
.task-source-icon {
  font-size: 14px;
  margin-left: auto;
}

/* Collapsible sections */
.section-header.collapsible {
  cursor: pointer;
  user-select: none;
}

.section-header.collapsible:hover {
  background: rgba(0, 0, 0, 0.05);
}

.board-section.collapsed .task-list,
.board-section.collapsed .activity-content,
.board-section.collapsed .notes-content {
  display: none;
}

/* Animations */
@keyframes slideIn {
  from {
    transform: translateX(-10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes flash {
  0%, 100% { background: transparent; }
  50% { background: rgba(74, 144, 226, 0.2); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Basic blackboard data structure and API

- [ ] Define blackboard schema
- [ ] Implement BlackboardAPI class in workspace
- [ ] Add blackboard persistence to database
- [ ] Create basic blackboard events
- [ ] Update agent board to display blackboard tasks
- [ ] Manual testing with direct API calls

**Deliverables:**
- `lively-ai-workspace.js` with BlackboardAPI
- Updated database schema (v8)
- Agent board displays blackboard tasks
- Tasks persist across sessions

### Phase 2: Voice Agent Read Access (Week 2)

**Goal:** Voice agent can see coding agent's work

- [ ] Implement `read_coding_messages` tool
- [ ] Implement `read_project_file` tool
- [ ] Add shortcuts: `read_tasks`, `read_project_index`
- [ ] Update WorkspaceToolset with new handlers
- [ ] Test voice agent can query coding history
- [ ] Test voice agent can read project files

**Deliverables:**
- 3 new tools in WorkspaceToolset
- Voice agent can answer "what did the coding agent do?"
- Voice agent can answer "what are our current tasks?"

### Phase 3: Voice Agent Write Access (Week 3)

**Goal:** Voice agent can add to blackboard

- [ ] Implement `add_task_to_board` tool
- [ ] Implement `add_note_to_board` tool
- [ ] Implement `update_task_status` tool
- [ ] Implement `read_blackboard` tool
- [ ] Add optional user confirmation dialog
- [ ] Test voice agent creating tasks
- [ ] Test tasks appear in UI immediately

**Deliverables:**
- 4 blackboard manipulation tools
- Voice agent can create/update tasks
- Real-time UI updates when voice agent acts

### Phase 4: Enhanced Visualization (Week 4)

**Goal:** Beautiful, interactive board UI

- [ ] Redesign agent board layout
- [ ] Add priority grouping
- [ ] Add source icons (user/voice/code)
- [ ] Add collapsible sections
- [ ] Add task detail expansion
- [ ] Add interactive elements (click, drag)
- [ ] Polish animations and transitions
- [ ] Add context menu actions

**Deliverables:**
- Polished agent board UI
- Interactive task management
- Visual indicators for agent activity

### Phase 5: Coding Agent Integration (Week 5)

**Goal:** Coding agent writes to blackboard

- [ ] Make `mcp_todowrite` write to blackboard
- [ ] Coding agent reads blackboard for context
- [ ] File operations update blackboard resources
- [ ] Test bi-directional coordination
- [ ] Voice agent sees code agent's tasks
- [ ] Code agent sees voice agent's notes

**Deliverables:**
- Both agents coordinate via blackboard
- Full circular information flow
- Context shared between agents

### Phase 6: Advanced Features (Week 6+)

**Goal:** Power user features

- [ ] Task assignment to specific agents
- [ ] Subtasks and task hierarchies
- [ ] Note threading and references
- [ ] Search and filter blackboard
- [ ] Export blackboard as markdown
- [ ] Blackboard history/timeline view
- [ ] Voice commands for board navigation
- [ ] Agent-to-agent handoff protocol

**Deliverables:**
- Advanced blackboard features
- Enhanced coordination capabilities
- Production-ready system

---

## Evaluation Levels & Capability Maturity

This section defines a progressive capability model for the AI workspace, describing how agent autonomy and coordination evolve across different maturity levels. Each level builds upon the previous, enabling increasingly sophisticated multi-agent collaboration.

### Overview: Capability Progression

The AI workspace operates at different **evaluation levels** that determine:
- How agents communicate with each other
- What users can observe and control
- Which capabilities require permission
- The degree of agent autonomy

These levels serve as both a **development roadmap** and a **configuration system** allowing users to choose their preferred level of agent autonomy.

---

### Level 1: Basic Command-Response (Current State)

**Description:** Agents work independently, communicating only through explicit user mediation.

**Characteristics:**
- Voice agent and code agent operate in separate silos
- No direct agent-to-agent communication
- User manually relays information between agents
- Each agent only sees its own conversation history
- No shared context or coordination state

**Communication Flow:**
```
User → Voice Agent → User → Code Agent → User
  ↑                                        ↓
  └────────────────────────────────────────┘
           (Manual information transfer)
```

**Technical Implementation:**
- Two independent conversation streams
- No blackboard or shared state
- No cross-agent tool access
- User is the sole coordinator

**Limitations:**
- Inefficient: user must repeat context
- Error-prone: information loss in translation
- No multi-agent synergy
- Context fragmentation

**Current Status:** ✅ **Implemented** (baseline)

---

### Level 2: Transparent Coordination (Target for Initial Implementation)

**Description:** Agents can see each other's work through a shared blackboard, but all actions remain visible to the user.

**Characteristics:**
- Shared blackboard visualized in UI
- Voice agent can read coding agent's messages
- Voice agent can read project files (via workspace proxy)
- Both agents can write to blackboard (tasks, notes, context)
- User sees all agent activity in real-time
- User maintains full oversight and control

**Communication Flow:**
```
        ┌──────────────────────┐
        │   User Interface     │
        │  (Full Visibility)   │
        └──────────────────────┘
                  ↓ ↑
         ┌────────┴─────────┐
         │   BLACKBOARD     │
         │  (Shared State)  │
         └────────┬─────────┘
            ↓     ↑     ↑     ↓
    Voice Agent  Code Agent
         (read/write)
```

**Technical Implementation:**
- Blackboard data structure in workspace
- Event-driven updates to agent board UI
- Voice agent tools: `read_coding_messages`, `read_project_file`, `add_task_to_board`, `add_note_to_board`
- Code agent writes TODOs to blackboard
- Real-time UI visualization of all changes

**Benefits:**
- Context sharing between agents
- Reduced user coordination burden
- Visible collaboration state
- Agents can build on each other's work

**User Experience:**
- User sees everything agents do
- Can intervene at any time
- Clear attribution (user/voice/code icons)
- Real-time board updates

**Current Status:** 🚧 **In Design** (this document)

---

### Level 3: Interactive Capability Requests

**Description:** Code agent can request additional capabilities or user decisions through structured prompts.

**Characteristics:**
- Code agent can ask user questions mid-task
- Code agent can request permissions (file access, API calls, etc.)
- Permission requests show in UI with approve/deny controls
- Voice agent CANNOT grant permissions on behalf of user
- User retains veto power over all agent actions
- Audit log of all permission grants/denials

**Communication Flow:**
```
User Interface
    ↓ (monitors)
Blackboard ← → Voice Agent
    ↑ ↓            ↓ (reads)
Code Agent ─────→ Permission Request Dialog
    ↑                       ↓
    └───────(awaits)────────┘
                ↓
            User Decision
```

**Permission System Design:**

**Permission Types:**
- **File Write** - Modify specific files or directories
- **File Delete** - Remove files
- **Execute Command** - Run shell commands (git, npm, etc.)
- **Network Access** - API calls, external requests
- **Database Modification** - Alter workspace/project data
- **System Configuration** - Change settings, preferences

**Permission Request Format:**
```javascript
{
  type: "permission_request",
  id: "perm_123",
  capability: "file_write",
  resource: "/path/to/file.js",
  reason: "Need to implement new feature X",
  requestedBy: "code-agent",
  timestamp: Date.now(),
  preview: {
    action: "edit",
    oldContent: "...",
    newContent: "..."
  }
}
```

**UI Permission Dialog:**
```
┌─ Permission Request ────────────────────────┐
│                                             │
│  Code agent wants to:                       │
│  ✏️ Write to file: src/components/foo.js   │
│                                             │
│  Reason: Implement feature X as requested   │
│                                             │
│  Preview:                                   │
│  + function newFeature() { ... }            │
│  - // TODO: implement this                  │
│                                             │
│  [Show Full Diff]                           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ☐ Remember this decision for this  │   │
│  │   file during this session          │   │
│  │ ☐ Always allow writes to this dir  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│     [Approve]  [Deny]  [Ask Me Later]      │
└─────────────────────────────────────────────┘
```

**Why Voice Agent Cannot Grant Permissions:**
- **Security**: Voice input is less deliberate than visual confirmation
- **Verification**: User needs to see what they're approving
- **Audit**: Visual approval creates clearer audit trail
- **Misunderstanding**: Voice commands more prone to misinterpretation
- **Critical Actions**: File deletion, system changes require explicit consent

**Exception:** Voice agent can request user approval verbally, which triggers the UI dialog:
```
Voice: "The code agent needs permission to modify foo.js. 
        A dialog is now showing - please review and approve."
```

**Question Tool Enhancement:**

The existing `mcp_question` tool (used by code agent) is extended to support capability requests:

```javascript
// Current: Simple questions
mcp_question({
  question: "Should I continue with approach A or B?",
  options: ["Approach A", "Approach B"]
})

// New: Capability requests
mcp_question({
  question: "Request permission to write to src/components/foo.js",
  type: "permission_request",
  capability: "file_write",
  resource: "src/components/foo.js",
  preview: { ... },
  options: ["Approve", "Deny", "Ask Me Later"]
})
```

**Technical Implementation:**
- Extend question tool to handle permission requests
- Create permission dialog UI component
- Implement permission store with session/persistent scopes
- Add audit log for permissions
- Voice agent gets notification when permission granted/denied

**Benefits:**
- Code agent can work more autonomously
- User maintains control over critical actions
- Clear permission model prevents accidents
- Audit trail for security and debugging

**Current Status:** 📋 **Planned** (Phase 6+)

---

### Level 4: Role-Switching & Advanced File Access (Future)

**Description:** Voice agent gains direct file read/write capabilities, with dynamic role-switching between agents based on task complexity.

**Characteristics:**
- Voice agent can read files directly (not just via proxy)
- Voice agent can write files (with user permission)
- Smart task routing: voice agent handles simple tasks, delegates complex ones
- Role reversal: voice agent as primary, code agent as specialist
- Dynamic capability negotiation between agents

**Communication Flow:**
```
         User (High-Level Goals)
              ↓
    ┌─────────┴──────────┐
    │  Voice Agent       │ ← Primary Interface
    │  (Orchestrator)    │
    └──┬─────────────┬───┘
       │ simple      │ complex
       ↓             ↓
  Execute        Code Agent
  Directly       (Specialist)
       ↓             ↓
    ┌──────────────────┐
    │    Blackboard    │
    └──────────────────┘
```

**Capability Evolution:**

**Voice Agent Gains:**
- `read_file(path)` - Direct file system access
- `write_file(path, content)` - Direct file writing (with permission)
- `edit_file(path, changes)` - File modifications
- `execute_simple_command(cmd)` - Safe shell commands

**Task Routing Logic:**
```javascript
class WorkspaceOrchestrator {
  async routeTask(userRequest) {
    const complexity = this.analyzeComplexity(userRequest);
    const requiredTools = this.analyzeRequiredTools(userRequest);
    
    if (complexity === 'simple' && this.voiceAgentCanHandle(requiredTools)) {
      // Voice agent handles directly
      return this.voiceAgent.execute(userRequest);
    } else {
      // Delegate to code agent
      return this.codeAgent.execute(userRequest);
    }
  }
  
  analyzeComplexity(request) {
    // Heuristics:
    // - Single file operation → simple
    // - Multiple steps → complex
    // - Requires analysis → complex
    // - User query → simple
  }
}
```

**Example Scenarios:**

**Scenario 1: Simple Query (Voice Agent Direct)**
```
User: "What's in tasks.md?"
Voice: [reads file directly]
       "The tasks file contains 5 items: ..."
```

**Scenario 2: Complex Refactoring (Delegate to Code)**
```
User: "Refactor the agent board to use composition pattern"
Voice: "This is complex. Delegating to code agent..."
       [Writes task to blackboard]
       [Code agent picks up and executes]
```

**Scenario 3: Collaborative Work (Both Agents)**
```
User: "Find all TODOs and create tasks for them"
Voice: [Scans files, finds TODOs]
       "Found 12 TODOs. Creating tasks..."
       [Writes tasks to blackboard]
Code:  [Picks up tasks]
       "I can implement TODO items 1, 3, 5 automatically.
        Others need design decisions."
```

**Permission Model for Voice Agent File Access:**

Voice agent file operations require same permission system as code agent:
- User approves file write capabilities
- Per-file or per-directory permissions
- Revocable at any time
- Audit log of all file operations

**Why This is Advanced:**
- More complex coordination logic
- Higher security considerations
- Requires robust error handling
- Needs smart task routing

**Current Status:** 💡 **Research** (evaluate feasibility)

---

### Level 5: Multi-Agent Parallel Collaboration (Far Future)

**Description:** Multiple specialized agents work simultaneously on different tasks, coordinating through blackboard.

**Characteristics:**
- 3+ agents active simultaneously
- Parallel task execution
- Specialized agent roles (UI specialist, backend specialist, tester, etc.)
- Shared blackboard with conflict resolution
- User oversees multiple parallel workstreams

**Agent Roles:**
```
User (Project Manager)
    ↓
┌───┴──────────────────────────────────┐
│         BLACKBOARD                   │
│   (Central Coordination)             │
└─┬────────┬────────────┬──────────┬───┘
  ↓        ↓            ↓          ↓
Voice    Code         UI        Test
Agent    Agent      Agent      Agent
  ↓        ↓            ↓          ↓
Simple   Complex   Frontend   QA/Verify
Tasks    Tasks    Changes    Changes
```

**Coordination Patterns:**

**1. Parallel Independent Tasks**
```
User: "Implement feature X while fixing bug Y"
Blackboard:
  Task 1: Implement feature X → Code Agent A
  Task 2: Fix bug Y → Code Agent B
Both execute simultaneously, update blackboard independently
```

**2. Pipeline Pattern**
```
User: "Create new component and add tests"
Workflow:
  UI Agent → Creates component structure
            ↓
  Code Agent → Implements logic
            ↓
  Test Agent → Writes tests
            ↓
  All Done → Report to user
```

**3. Review Pattern**
```
Code Agent A: Implements feature
              ↓
Code Agent B: Reviews code, suggests improvements
              ↓
User: Approves or requests changes
```

**Conflict Resolution:**

**Scenario: Two agents modify same file**
```
Agent A: Wants to modify lines 10-20 of foo.js
Agent B: Wants to modify lines 15-30 of foo.js

Blackboard: Detects conflict
            ↓
Resolution Options:
1. Sequential: A then B (or B then A)
2. Merge: Combine if non-overlapping
3. Escalate: Ask user to choose
4. Retry: One agent waits, retries after other completes
```

**Technical Challenges:**
- Resource locking (files, tasks)
- Deadlock prevention
- Priority scheduling
- Load balancing across agents
- Cost management (API usage)

**Benefits:**
- Massive productivity boost
- Specialized expertise per agent
- Parallel execution saves time
- Handles complex multi-faceted projects

**Risks:**
- Coordination overhead
- Potential conflicts and race conditions
- Cost explosion (multiple API calls)
- Complexity hard to debug

**Current Status:** 🔮 **Speculative** (research topic)

---

### Configuration System

Allow users to select their preferred evaluation level:

**UI Setting:**
```
┌─ AI Workspace Settings ─────────────────────┐
│                                             │
│  Evaluation Level:                          │
│  ● Level 1: Basic (manual coordination)    │
│  ○ Level 2: Transparent (shared context)   │
│  ○ Level 3: Interactive (permission system)│
│  ○ Level 4: Advanced (role-switching)      │
│  ○ Level 5: Multi-Agent (experimental)     │
│                                             │
│  [?] What do these mean?                    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Level 2 Features:                  │   │
│  │  ✓ Agents share blackboard          │   │
│  │  ✓ Voice sees code agent work       │   │
│  │  ✓ Voice can edit board             │   │
│  │  ✓ Real-time visualization          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│     [Apply]  [Reset to Default]            │
└─────────────────────────────────────────────┘
```

**Feature Gates:**
```javascript
class WorkspaceConfig {
  constructor(level) {
    this.level = level;
  }
  
  canVoiceReadCodeMessages() {
    return this.level >= 2;
  }
  
  canVoiceEditBlackboard() {
    return this.level >= 2;
  }
  
  canCodeRequestPermissions() {
    return this.level >= 3;
  }
  
  canVoiceWriteFiles() {
    return this.level >= 4;
  }
  
  canMultiAgentParallel() {
    return this.level >= 5;
  }
}
```

---

### Visual Documentation: Diagrams Needed

**Note:** Future versions of this document should include visual diagrams to illustrate:

**Diagram 1: Evaluation Level Progression**
- Flow chart showing capability evolution from Level 1 → 5
- Each level as a layer building on previous
- Visual representation of increasing autonomy
- Tool: draw.io or mermaid diagram

**Diagram 2: Agent Communication Patterns**
- Side-by-side comparison of communication flows per level
- Arrows showing data/message flow
- User interaction points highlighted
- Permission gates marked

**Diagram 3: Permission System Architecture**
- Request/approval flow
- UI components involved
- Database/storage of permission state
- Audit log integration

**Diagram 4: Multi-Agent Coordination (Level 5)**
- Multiple agents around central blackboard
- Task assignment and execution flows
- Conflict resolution decision tree
- Parallel execution timeline

**Diagram 5: UI Layout per Level**
- Agent board appearance at each level
- New UI elements added per level
- User control surfaces
- Information visibility zones

**Suggested Format:**
- **Draw.io** for detailed architecture diagrams
- **Mermaid** for sequence/flow diagrams (embeddable in markdown)
- **Figma** for UI mockups (if detailed design needed)

**Placement:**
- Inline in this document after each level description
- Separate `diagrams/` folder with SVG exports
- Interactive diagrams in Lively4 (future: live diagram components)

**Creation Plan:**
- Phase 1: Sketch rough diagrams on paper/whiteboard
- Phase 2: Create digital versions in draw.io
- Phase 3: Export as SVG and embed in markdown
- Phase 4: Create interactive versions in Lively4

---

### Migration Path

**How to Progress Between Levels:**

**Level 1 → Level 2:**
1. Implement blackboard data structure
2. Add voice agent read tools
3. Add voice agent write tools
4. Create agent board visualization
5. Enable feature gates for Level 2

**Level 2 → Level 3:**
1. Extend question tool for permissions
2. Create permission dialog UI
3. Implement permission store
4. Add audit logging
5. Update code agent to request permissions

**Level 3 → Level 4:**
1. Research voice agent file access patterns
2. Implement task routing logic
3. Add complexity analysis heuristics
4. Create role-switching coordinator
5. Extend permission system for voice agent

**Level 4 → Level 5:**
1. Design multi-agent architecture
2. Implement conflict resolution system
3. Create agent specialization roles
4. Build parallel task executor
5. Extensive testing and safety measures

Each migration is **gated by user decision** - workspace won't auto-upgrade without consent.

---

### Evaluation Criteria

**How to measure success at each level:**

**Level 1 Metrics:**
- Baseline: user satisfaction, task completion time
- Serves as control for comparison

**Level 2 Metrics:**
- Reduced user coordination effort (time spent relaying info)
- Increased context awareness (agents don't repeat questions)
- User satisfaction with transparency

**Level 3 Metrics:**
- Permission requests granted vs denied ratio
- User confidence in agent decisions
- Time saved by agent autonomy vs time lost to permission dialogs

**Level 4 Metrics:**
- Task routing accuracy (simple correctly routed to voice)
- Voice agent task completion rate
- User satisfaction with primary agent choice

**Level 5 Metrics:**
- Parallel task throughput
- Conflict rate and resolution time
- Cost per task (API usage)
- User perceived productivity gain

---

### Security & Safety Considerations

**Per Level:**

**Level 1:** ✅ Safe (fully manual)

**Level 2:** ⚠️ Low Risk
- Agents can read but not execute changes independently
- Blackboard writes are reversible
- Full user visibility

**Level 3:** ⚠️ Medium Risk
- Permission system mitigates risk
- User retains veto power
- Requires good UX to prevent "permission fatigue"

**Level 4:** ⚠️ High Risk
- Voice agent file access requires robust permission system
- More opportunities for mistakes
- Need extensive testing and safeguards

**Level 5:** 🚨 Very High Risk
- Complex coordination hard to debug
- Parallel execution increases error surface
- Cost can escalate rapidly
- Should only be available to advanced users

**Mitigation Strategies:**
- Start at Level 1, explicit opt-in for higher levels
- Comprehensive audit logging at all levels
- Easy rollback/undo mechanisms
- "Panic button" to stop all agents
- Cost limits and monitoring
- Sandbox environments for testing

---

## Open Questions

### Technical Questions

1. **Event Ordering**: How to ensure blackboard updates are atomic and consistently ordered?
   - Use transaction IDs?
   - Queue updates?
   - Optimistic UI with rollback?

2. **Conflict Resolution**: What if both agents update same task simultaneously?
   - Last-write-wins?
   - Version vectors?
   - Manual merge?

3. **Context Size**: How much coding history to inject into voice agent context?
   - Last N messages?
   - Smart summarization?
   - Semantic search for relevance?

4. **Performance**: Will real-time updates cause UI lag?
   - Debounce rapid updates?
   - Virtual scrolling for large task lists?
   - Incremental rendering?

5. **Security**: Should voice agent have unrestricted file read access?
   - Whitelist specific files?
   - User approval for sensitive files?
   - Sandbox voice agent more strictly?

### UX Questions

1. **User Control**: How much should user be involved in blackboard edits?
   - Auto-confirm voice agent tasks?
   - Always require approval?
   - Smart prompts for important changes?

2. **Visual Clutter**: With two agents adding content, will board become overwhelming?
   - Auto-collapse low-priority sections?
   - Smart filtering?
   - Separate tabs for agent vs user tasks?

3. **Task Ownership**: Should tasks be assigned to specific agents?
   - Auto-assign based on who created?
   - User manually assigns?
   - Agents negotiate?

4. **Notification**: How to alert user to important blackboard changes?
   - Toast notifications?
   - Highlight new items?
   - Audio cues?

5. **History**: Should users see full edit history of blackboard?
   - Git-like diff view?
   - Timeline visualization?
   - Undo capability?

### Design Questions

1. **Scope**: Should blackboard be workspace-scoped or project-scoped?
   - Per workspace (current session)?
   - Per project (persistent)?
   - Hybrid (inherit from project, customize per workspace)?

2. **Hierarchy**: Should we support nested tasks and subtasks?
   - Flat list easier to visualize
   - Hierarchy more structured
   - Start flat, add hierarchy later?

3. **Schema Evolution**: How to handle blackboard schema changes?
   - Version number in data?
   - Migration functions?
   - Backward compatibility?

4. **Integration**: Should blackboard sync with external task systems?
   - Export to GitHub Issues?
   - Import from tasks.md?
   - Two-way sync?

5. **Coordination Protocol**: Do we need formal agent communication protocol?
   - Simple blackboard sufficient?
   - Message passing between agents?
   - Request/response pattern?

---

## Related Documents

- [AI Workspace Architecture](architecture.md)
- [AI Workspace Tasks](ai-workspace-tasks.md)
- [Refactoring Guide](refactoring.md)
- [Realtime Chat Toolsets](../components/realtime-chat-tools/)
- [Lively Agent Board](../components/lively-agent-board.js)

---

## Changelog

**2026-02-27:** Initial design document created
