# Voice Agent File Editing Tools Plan

**Target Agent:** Vox (openai-realtime-chat)  
**Integration Point:** VoiceToolset (new toolset class)  
**Design Principles:** Voice-friendly, conversational, safe, visually confirmed

## Executive Summary

This plan outlines a comprehensive set of file editing tools specifically designed for voice interaction in the AI Workspace. Unlike the existing `send_opencode_task` delegation model (which sends entire tasks to Scribe), these tools allow Vox to perform direct file operations with voice-optimized workflows, immediate visual feedback, and conversational context management.

## Architecture Overview

```
openai-realtime-chat (Vox)
├── CompositeToolset
│   ├── BasicToolset (evaluate_code, time, etc.)
│   ├── WorkspaceToolset (send_opencode_task)
│   └── VoiceToolset (NEW - voice-optimized file operations)
│       ├── File Reading Tools
│       ├── File Editing Tools
│       ├── File Search Tools
│       ├── File Management Tools
│       └── Context Management Tools
```

### Design Rationale

**Why dedicated voice tools instead of just delegating to Scribe?**

1. **Immediacy**: Voice users expect quick feedback for simple operations (read a file, check if file exists)
2. **Conversational Flow**: "Show me that file" → immediate display vs. "Let me ask Scribe to show you that file" → wait → relay response
3. **Visual Confirmation**: Voice users benefit from immediate visual feedback in the UI
4. **Context Continuity**: Voice conversations build context ("that file", "the last one") that shouldn't be broken by delegation
5. **Scribe is for Complex Tasks**: Reserve Scribe for multi-step coding tasks, systematic refactoring, test-driven development

**When to use Voice Tools vs. Scribe:**
- **Voice Tools**: Quick reads, simple edits, file checks, navigation, conversational references
- **Scribe**: Multi-file refactoring, systematic changes, test-driven development, complex analysis

## Reference: Existing OpenCode Tools

Scribe (via Claude Code MCP server) already has comprehensive file tools:

### File Operations
- `mcp_read` - Read files (with offset/limit for large files)
- `mcp_write` - Write entire files
- `mcp_edit` - Edit files (oldString/newString replacement)
- `mcp_glob` - Find files by glob pattern
- `mcp_grep` - Search file contents by regex

### Code Operations
- `mcp_bash` - Execute shell commands
- `mcp_task` - Launch subagents for complex tasks
- `mcp_lively4_evaluate-code` - Execute code in browser
- `mcp_lively4_run-tests` - Run tests
- LSP tools for code intelligence

**Key Insight:** Voice tools should provide a **simpler, voice-optimized interface** to similar capabilities, optimized for conversation rather than systematic coding.

## Tool Categories

### 1. File Reading Tools

#### `read_file_voice`
**Purpose:** Quick file inspection with voice-friendly output

**Parameters:**
- `path` (string, required): File path (supports relative paths from current context)
- `section` (string, optional): "start", "end", or "around line X"
- `lines` (number, optional): How many lines to show (default: 20)

**Voice Examples:**
- "Show me the openai-realtime-chat.js file"
- "Read the first 10 lines of that file"
- "Show me around line 50 in basic-toolset.js"

**Output Format:**
```
📄 openai-realtime-chat.js (lines 1-20 of 450)

[Syntax-highlighted code display]

💬 "This shows the class definition and initialization method. Would you like to see more?"
```

**Implementation Notes:**
- Uses `lively.files.loadFile()` for content
- Maintains "last read file" context
- Renders using existing `opencode-read-tool` renderer
- For large files, automatically shows summary + first section

---

#### `peek_file_structure`
**Purpose:** Get high-level overview of file structure (classes, functions, exports)

**Parameters:**
- `path` (string, required): File path

**Voice Examples:**
- "What's in the workspace-toolset file?"
- "Show me the structure of lively-chat.js"

**Output Format:**
```
📋 Structure of lively-chat.js:

Classes:
  - LivelyChat extends Morph

Methods:
  - initialize()
  - connectedCallback()
  - captureEvent(event)
  - saveConversation()
  [+12 more methods]

Exports:
  - default class LivelyChat
```

**Implementation:**
- Simple regex parsing for class/function/export detection
- OR delegate to Scribe's LSP tools for accurate parsing
- Useful for quick orientation before reading details

---

#### `list_recent_files`
**Purpose:** Show files recently read or edited in this conversation

**Parameters:**
- `limit` (number, optional): Max files to show (default: 10)

**Voice Examples:**
- "What files have we looked at?"
- "Show recent files"

**Output:**
```
📚 Recent Files (last 30 minutes):

1. ✏️ src/ai-workspace/components/openai-realtime-chat.js (edited 2 min ago)
2. 👁️ src/ai-workspace/components/realtime-chat-tools/basic-toolset.js (read 5 min ago)
3. ✏️ src/ai-workspace/doc/vox-file-tools-plan.md (edited 8 min ago)
```

**Implementation:**
- Tracks file operations in conversation context
- Stored in component state (not persisted)
- Enables conversational references

---

### 2. File Editing Tools

#### `edit_file_voice`
**Purpose:** Make targeted edits with voice-friendly confirmation

**Parameters:**
- `path` (string, required): File path
- `old_text` (string, required): Text to replace (can be approximate for voice dictation)
- `new_text` (string, required): Replacement text
- `fuzzy_match` (boolean, optional): Allow approximate matching (default: true for voice)

**Voice Examples:**
- "Change 'hello world' to 'hello Lively4' in that file"
- "In openai-realtime-chat.js, replace the old API endpoint with the new one"

**Output Format:**
```
✏️ Edit: openai-realtime-chat.js

📝 Changes:
[Diff visualization showing old vs new]

✅ Edit applied successfully
💬 "I've updated the API endpoint. Would you like to test it?"
```

**Safety Features:**
- Shows diff before applying (unless `auto_apply: true`)
- Fuzzy matching for voice dictation errors
- Undo capability via conversation history
- Warns if match is ambiguous

---

#### `append_to_file`
**Purpose:** Add content to end of file (common for voice workflows)

**Parameters:**
- `path` (string, required): File path
- `content` (string, required): Content to append
- `section` (string, optional): "end" (default), "after line X", "before line Y"

**Voice Examples:**
- "Add a new method called handleVoiceCommand to lively-chat.js"
- "Append this TODO to the file: 'TODO: Add voice confirmation'"

**Output:**
```
➕ Appended to lively-chat.js

📝 Added 15 lines at line 450

✅ Success
💬 "I've added the handleVoiceCommand method. Ready to test!"
```

---

#### `quick_fix`
**Purpose:** Apply common quick fixes voice users might request

**Parameters:**
- `path` (string, required): File path
- `fix_type` (string, required): "add_import", "remove_import", "add_method", "fix_typo", "add_comment"
- `details` (object, varies by fix_type)

**Voice Examples:**
- "Add an import for BasicToolset to that file"
- "Fix the typo 'recieve' in openai-realtime-chat.js"
- "Add a comment explaining what this method does"

**Supported Quick Fixes:**
1. **add_import**: `{ module: "path/to/module.js", name: "ClassName" }`
2. **remove_import**: `{ name: "ClassName" }`
3. **add_method**: `{ name: "methodName", async: true/false, params: ["arg1", "arg2"] }`
4. **fix_typo**: `{ wrong: "recieve", correct: "receive" }`
5. **add_comment**: `{ location: "line X" or "before method Y", text: "comment text" }`

---

### 3. File Search Tools

#### `find_files_voice`
**Purpose:** Natural language file finding

**Parameters:**
- `query` (string, required): Natural description or pattern
- `where` (string, optional): Directory hint (default: project root)

**Voice Examples:**
- "Find files related to tools"
- "Where's the file that handles realtime chat?"
- "Show me all the test files"

**Implementation:**
- Combines glob patterns with fuzzy matching
- Uses `lively.files.walkDir()` for scanning
- Ranks results by relevance
- Remembers search context

**Output:**
```
🔍 Found 5 files matching "tools":

1. src/ai-workspace/components/realtime-chat-tools/basic-toolset.js
2. src/ai-workspace/components/realtime-chat-tools/workspace-toolset.js
3. src/ai-workspace/components/realtime-chat-tools/composite-toolset.js
4. src/ai-workspace/components/tool-renderers/opencode-base-tool.js
5. src/client/mcp-tools.js

💬 "I found 5 files. Which one would you like to see?"
```

---

#### `search_in_files`
**Purpose:** Search file contents with voice-friendly results

**Parameters:**
- `query` (string, required): Text to search for
- `file_pattern` (string, optional): Limit to files matching pattern
- `context_lines` (number, optional): Lines of context (default: 2)

**Voice Examples:**
- "Find where we use 'send_opencode_task'"
- "Search for 'evaluate_code' in the toolset files"

**Output:**
```
🔎 Found 'send_opencode_task' in 3 files:

1. workspace-toolset.js:19
   > send_opencode_task: {
   
2. openai-realtime-chat.js:234
   > await this.executeTool('send_opencode_task', { task: message });
   
3. doc/ai-workspace.md:45
   > The `send_opencode_task` tool delegates coding tasks to Scribe.

💬 "Found 3 matches. Would you like to see any of these files?"
```

---

### 4. File Management Tools

#### `create_file_voice`
**Purpose:** Create new files with conversational workflow

**Parameters:**
- `path` (string, required): File path
- `content` (string, optional): Initial content
- `template` (string, optional): "component", "test", "doc", "empty"

**Voice Examples:**
- "Create a new file called voice-toolset.js"
- "Make a new component called lively-voice-recorder"
- "Create a test file for the voice toolset"

**Templates:**
1. **component**: Lively4 component template (HTML + JS)
2. **test**: Mocha test file template
3. **doc**: Markdown documentation template
4. **empty**: Empty file

**Safety:**
- Checks if file exists first
- Confirms before overwriting
- Offers to open in editor after creation

---

#### `rename_file_voice`
**Purpose:** Rename/move files with safety checks

**Parameters:**
- `old_path` (string, required): Current path
- `new_path` (string, required): New path

**Voice Examples:**
- "Rename workspace-toolset.js to voice-workspace-toolset.js"
- "Move that file to the components directory"

**Safety:**
- Checks for existing file at destination
- Updates imports/references (via Scribe delegation for complex cases)
- Confirms before execution

---

#### `delete_file_voice`
**Purpose:** Delete files with strong safety confirmation

**Parameters:**
- `path` (string, required): File to delete

**Voice Examples:**
- "Delete that temp file"
- "Remove old-component.js"

**Safety:**
- **Always requires explicit confirmation** (uses question tool)
- Shows file size and last modified date
- Option to move to trash instead of delete
- Cannot delete files modified in last 5 minutes without double confirmation

---

### 5. Context Management Tools

#### `set_working_file`
**Purpose:** Explicitly set the current working file for conversational references

**Parameters:**
- `path` (string, required): File to set as working file

**Voice Examples:**
- "Work on openai-realtime-chat.js"
- "Switch to the voice toolset file"

**Context Benefits:**
- Enables references like "this file", "that file", "here"
- Subsequent operations default to working file
- Shows working file in UI indicator

---

#### `get_file_context`
**Purpose:** Get current file context state

**Voice Examples:**
- "What file am I working on?"
- "Show me the current context"

**Output:**
```
📍 Current File Context:

Working File: src/ai-workspace/components/openai-realtime-chat.js
Last Read: src/ai-workspace/components/realtime-chat-tools/basic-toolset.js (2 min ago)
Last Edited: src/ai-workspace/doc/vox-file-tools-plan.md (5 min ago)

Recent Files (5):
  1. openai-realtime-chat.js
  2. basic-toolset.js
  3. workspace-toolset.js
  4. vox-file-tools-plan.md
  5. lively-chat.js
```

---

### 6. Navigation & Visualization Tools

#### `open_file_in_editor`
**Purpose:** Open file in Lively4 editor/container

**Parameters:**
- `path` (string, required): File to open
- `line` (number, optional): Jump to specific line

**Voice Examples:**
- "Open that file in the editor"
- "Show me line 150 in the editor"

**Implementation:**
- Uses `fetch("edit://path/to/file")`
- Can open multiple files side-by-side
- Highlights specific lines if requested

---

#### `show_file_diff`
**Purpose:** Compare file versions or changes

**Parameters:**
- `path` (string, required): File to compare
- `compare_to` (string, optional): "last_save", "git_head", or specific file path

**Voice Examples:**
- "Show me what changed in that file"
- "Compare this to the git version"

**Implementation:**
- Uses diff-match-patch library
- Visual diff display
- Useful for reviewing changes before committing

---

## User Flow Examples

### Example 1: Voice-Driven File Reading

**User:** "Show me the realtime chat component"

**Vox Actions:**
1. Calls `find_files_voice({ query: "realtime chat component" })`
2. Finds `openai-realtime-chat.js`
3. Calls `read_file_voice({ path: "...", section: "start", lines: 30 })`
4. Displays syntax-highlighted code

**Vox Response:** "Here's the openai-realtime-chat component. It's a 450-line file. I'm showing the first 30 lines with the class definition and initialization. Would you like to see a specific section?"

---

### Example 2: Voice-Guided Editing

**User:** "Add a new method called handleVoiceInterrupt to that file"

**Vox Actions:**
1. Recognizes "that file" = working file (openai-realtime-chat.js)
2. Calls `append_to_file({ path: "...", content: "async handleVoiceInterrupt() { ... }" })`
3. Shows diff of changes
4. Applies edit

**Vox Response:** "I've added the handleVoiceInterrupt method at line 380. It's an async method that will handle voice interruptions. Would you like me to add any specific logic to it?"

**User:** "Yes, make it call stopAudio first"

**Vox Actions:**
1. Calls `edit_file_voice({ path: "...", old_text: "async handleVoiceInterrupt() {", new_text: "async handleVoiceInterrupt() {\n    await this.stopAudio();", fuzzy_match: true })`
2. Shows updated diff

**Vox Response:** "Done! The method now calls stopAudio first. Ready to test?"

---

### Example 3: Complex Task Delegation

**User:** "Refactor all the toolset files to use a common base class"

**Vox Reasoning:**
- This is a multi-file, systematic refactoring task
- Requires code analysis, testing, careful planning
- **Perfect for Scribe, not voice tools**

**Vox Actions:**
1. Calls `send_opencode_task({ task: "Refactor all toolset files in src/ai-workspace/components/realtime-chat-tools/ to use a common base class. Extract shared functionality, ensure tests pass, follow existing patterns." })`
2. Waits for Scribe to complete

**Vox Response:** "This is a complex refactoring task. I've asked Scribe to handle it. He'll analyze the toolset files, create a base class, and refactor them systematically. I'll let you know when it's done."

*[5 minutes later, Scribe completes]*

**Vox Response:** "Scribe finished the refactoring! He created a BaseToolset class and refactored all 3 toolset files. All tests are passing. Would you like me to summarize the changes?"

---

### Example 4: Voice-Friendly File Search

**User:** "Where do we handle tool execution?"

**Vox Actions:**
1. Calls `search_in_files({ query: "execute.*tool", file_pattern: "**/*toolset*.js" })`
2. Finds matches in multiple files
3. Ranks by relevance

**Vox Response:** "Tool execution is handled in several places:
- BasicToolset.execute() at line 145 - executes basic tools
- WorkspaceToolset.execute() at line 96 - executes workspace tools  
- CompositeToolset.execute() at line 87 - routes to appropriate toolset

The main routing logic is in CompositeToolset. Would you like to see that file?"

---

## Implementation Roadmap

### Phase 1: Core Reading Tools (Week 1)
**Goal:** Enable voice-driven file browsing

**Tasks:**
1. Create `VoiceToolset` class extending toolset pattern
2. Implement `read_file_voice` with context tracking
3. Implement `find_files_voice` with fuzzy matching
4. Implement `list_recent_files` with conversation state
5. Add visual renderers for voice tool outputs
6. Test with voice commands

**Success Criteria:**
- Voice user can ask to see files and get immediate results
- Conversational references ("that file") work correctly
- Visual feedback is clear and immediate

---

### Phase 2: Simple Editing Tools (Week 2)
**Goal:** Enable voice-driven simple edits

**Tasks:**
1. Implement `append_to_file` for adding content
2. Implement `edit_file_voice` with fuzzy matching
3. Implement `quick_fix` for common patterns
4. Add diff visualization for edits
5. Add undo/redo capability
6. Test editing workflows

**Success Criteria:**
- Voice user can make simple edits without typing
- Fuzzy matching handles voice dictation errors
- Visual diff confirmation works well
- Safety checks prevent accidental overwrites

---

### Phase 3: File Management Tools (Week 3)
**Goal:** Enable voice-driven file operations

**Tasks:**
1. Implement `create_file_voice` with templates
2. Implement `rename_file_voice` with safety
3. Implement `delete_file_voice` with confirmation
4. Add file operation undo capability
5. Test safety mechanisms
6. Integration with git operations

**Success Criteria:**
- Voice user can create/rename/delete files safely
- Confirmation flows work conversationally
- No accidental data loss
- Git integration works smoothly

---

### Phase 4: Advanced Features (Week 4)
**Goal:** Polish and advanced capabilities

**Tasks:**
1. Implement `peek_file_structure` with LSP integration
2. Implement `show_file_diff` with git comparison
3. Implement `open_file_in_editor` with jump-to-line
4. Add multi-file operation support
5. Optimize for large files (lazy loading, streaming)
6. Performance tuning and caching

**Success Criteria:**
- Voice workflows feel natural and efficient
- Performance is acceptable for large codebases
- Edge cases handled gracefully
- User testing shows positive feedback

---

### Phase 5: Integration & Polish (Week 5)
**Goal:** Seamless Vox ↔ Scribe handoff

**Tasks:**
1. Define clear handoff criteria (when to delegate to Scribe)
2. Implement intelligent delegation (detect complex tasks)
3. Add conversation history persistence
4. Polish visual feedback and error messages
5. Documentation and examples
6. User testing and iteration

**Success Criteria:**
- Clear boundaries between voice tools and Scribe tools
- Handoff is seamless and explained to user
- Conversation context preserved across sessions
- Documentation is complete and helpful

---

## Technical Architecture Details

### VoiceToolset Class Structure

```javascript
export class VoiceToolset {
  constructor(realtimeChat) {
    this.realtimeChat = realtimeChat; // Reference to openai-realtime-chat component
    this.fileContext = new FileContext(); // Manages working file, recent files, etc.
    
    this.tools = {
      read_file_voice: { definition: {...}, execute: async (args) => {...} },
      edit_file_voice: { definition: {...}, execute: async (args) => {...} },
      find_files_voice: { definition: {...}, execute: async (args) => {...} },
      // ... more tools
    };
  }
  
  getDefinitions() {
    return Object.values(this.tools).map(tool => tool.definition);
  }
  
  async execute(toolName, args) {
    const tool = this.tools[toolName];
    if (!tool) throw new Error(`Unknown tool: ${toolName}`);
    
    // Update file context before executing
    this.fileContext.beforeToolExecution(toolName, args);
    
    const result = await tool.execute.call(this, args);
    
    // Update file context after executing
    this.fileContext.afterToolExecution(toolName, args, result);
    
    return result;
  }
}
```

---

### FileContext State Management

```javascript
class FileContext {
  constructor() {
    this.workingFile = null; // Current working file
    this.recentFiles = []; // Array of {path, operation, timestamp}
    this.maxRecentFiles = 20;
  }
  
  setWorkingFile(path) {
    this.workingFile = path;
    this.addToRecent(path, 'set_working');
  }
  
  addToRecent(path, operation) {
    this.recentFiles.unshift({
      path,
      operation, // 'read', 'edit', 'create', 'delete', etc.
      timestamp: Date.now()
    });
    
    // Keep only recent entries
    if (this.recentFiles.length > this.maxRecentFiles) {
      this.recentFiles = this.recentFiles.slice(0, this.maxRecentFiles);
    }
  }
  
  resolveFileReference(ref) {
    // Handle conversational references
    if (ref === 'this' || ref === 'current' || ref === 'working') {
      return this.workingFile;
    }
    
    if (ref === 'that' || ref === 'previous' || ref === 'last') {
      return this.recentFiles[0]?.path;
    }
    
    // Try to match recent file by name fragment
    const match = this.recentFiles.find(f => 
      f.path.toLowerCase().includes(ref.toLowerCase())
    );
    
    return match?.path || ref; // Fall back to literal path
  }
  
  beforeToolExecution(toolName, args) {
    // Resolve file references in arguments
    if (args.path) {
      args.path = this.resolveFileReference(args.path);
    }
  }
  
  afterToolExecution(toolName, args, result) {
    // Track file operations
    if (result.success && args.path) {
      const operation = this.getOperationFromToolName(toolName);
      this.addToRecent(args.path, operation);
      
      // Update working file for certain operations
      if (['read_file_voice', 'edit_file_voice'].includes(toolName)) {
        this.setWorkingFile(args.path);
      }
    }
  }
  
  getOperationFromToolName(toolName) {
    const map = {
      read_file_voice: 'read',
      edit_file_voice: 'edit',
      create_file_voice: 'create',
      delete_file_voice: 'delete',
      append_to_file: 'edit',
      // ... more mappings
    };
    return map[toolName] || 'unknown';
  }
}
```

---

### Tool Output Rendering

Voice tools should produce rich, visual outputs that integrate with existing tool renderers:

```javascript
// Example: read_file_voice output
{
  success: true,
  tool: 'read_file_voice',
  path: 'src/ai-workspace/components/openai-realtime-chat.js',
  content: '// file content...',
  metadata: {
    totalLines: 450,
    shownLines: [1, 30],
    language: 'javascript',
    size: '15.2 KB'
  },
  voiceResponse: "Here's the openai-realtime-chat component. It's a 450-line file. I'm showing the first 30 lines.",
  visualRenderer: 'voice-read-tool' // Custom renderer for voice tool outputs
}
```

The `voiceResponse` field provides the conversational response for text-to-speech, while the visual data drives the UI rendering.

---

### Integration with OpenAI Realtime API

Tools are registered with the OpenAI Realtime API via function definitions:

```javascript
// In openai-realtime-chat.js
async initializeTools() {
  const composite = new CompositeToolset(this.workspace);
  
  // Add VoiceToolset to composite
  const voiceToolset = new VoiceToolset(this);
  composite.addToolset('voice', voiceToolset);
  
  // Register all tool definitions with OpenAI
  const allDefinitions = composite.getDefinitions();
  for (const def of allDefinitions) {
    await this.addTool(def);
  }
}

async executeTool(toolName, args) {
  // Route to appropriate toolset
  const composite = this.getCompositeToolset();
  const result = await composite.execute(toolName, args);
  
  // Render visual output
  await this.renderToolOutput(toolName, args, result);
  
  // Return voice response for TTS
  return result.voiceResponse || result.message || 'Done.';
}
```

---

### Safety and Confirmation Flows

For destructive operations, use the question tool pattern:

```javascript
// Example: delete_file_voice implementation
async execute_delete_file(args) {
  const { path } = args;
  
  // Get file info
  const stats = await lively.files.stats(path);
  const size = (stats.size / 1024).toFixed(1) + ' KB';
  const modified = new Date(stats.modified).toLocaleString();
  
  // Check if recently modified (last 5 minutes)
  const recentlyModified = (Date.now() - stats.modified) < 5 * 60 * 1000;
  
  // Ask for confirmation
  const question = {
    type: 'confirm',
    message: `Delete ${path}?\n\nSize: ${size}\nLast modified: ${modified}${recentlyModified ? '\n⚠️ Modified recently!' : ''}`,
    options: [
      { label: 'Delete', value: 'delete', destructive: true },
      { label: 'Move to Trash', value: 'trash', default: true },
      { label: 'Cancel', value: 'cancel' }
    ]
  };
  
  const answer = await this.realtimeChat.askQuestion(question);
  
  if (answer === 'cancel') {
    return { success: false, message: 'Deletion cancelled.' };
  }
  
  if (answer === 'trash') {
    // Move to .trash directory
    const trashPath = lively.files.directory(path) + '.trash/' + lively.files.name(path);
    await lively.files.moveFile(path, trashPath);
    return { success: true, message: `Moved to trash: ${trashPath}`, voiceResponse: 'Moved to trash.' };
  }
  
  // Delete permanently
  await fetch(path, { method: 'DELETE' });
  return { success: true, message: `Deleted: ${path}`, voiceResponse: 'File deleted.' };
}
```

---

## Performance Considerations

### Lazy Loading for Large Files

```javascript
async execute_read_file_voice(args) {
  const { path, section = 'start', lines = 20 } = args;
  
  // First, check file size
  const stats = await lively.files.stats(path);
  const isLarge = stats.size > 100 * 1024; // 100 KB
  
  if (isLarge) {
    // Load only requested section
    const { offset, limit } = this.calculateOffset(section, lines, stats);
    const content = await this.loadFileSection(path, offset, limit);
    
    return {
      success: true,
      path,
      content,
      metadata: {
        totalLines: stats.lines,
        shownLines: [offset, offset + limit],
        truncated: true
      },
      voiceResponse: `Showing ${section} section of ${lively.files.name(path)}. This is a large file with ${stats.lines} lines.`
    };
  } else {
    // Load entire file
    const content = await lively.files.loadFile(path);
    const allLines = content.split('\n');
    const shownContent = this.extractSection(allLines, section, lines);
    
    return {
      success: true,
      path,
      content: shownContent.join('\n'),
      metadata: {
        totalLines: allLines.length,
        shownLines: this.getShownLineNumbers(section, lines, allLines.length)
      },
      voiceResponse: `Here's ${lively.files.name(path)}.`
    };
  }
}
```

---

### Caching for Frequent Operations

```javascript
class VoiceToolset {
  constructor(realtimeChat) {
    this.realtimeChat = realtimeChat;
    this.fileContext = new FileContext();
    this.cache = new Map(); // Simple in-memory cache
  }
  
  async loadFileWithCache(path) {
    // Check cache
    const cached = this.cache.get(path);
    if (cached && (Date.now() - cached.timestamp < 60000)) { // 1 minute TTL
      return cached.content;
    }
    
    // Load from filesystem
    const content = await lively.files.loadFile(path);
    
    // Update cache
    this.cache.set(path, {
      content,
      timestamp: Date.now()
    });
    
    return content;
  }
  
  invalidateCache(path) {
    this.cache.delete(path);
  }
}
```

---

## Testing Strategy

### Unit Tests

Test individual tools in isolation:

```javascript
describe('VoiceToolset', () => {
  describe('read_file_voice', () => {
    it('should read file start section', async () => {
      const toolset = new VoiceToolset(mockRealtimeChat);
      const result = await toolset.execute('read_file_voice', {
        path: 'test/fixtures/sample.js',
        section: 'start',
        lines: 10
      });
      
      expect(result.success).to.be.true;
      expect(result.metadata.shownLines).to.deep.equal([1, 10]);
    });
    
    it('should handle conversational file references', async () => {
      const toolset = new VoiceToolset(mockRealtimeChat);
      
      // First, read a file
      await toolset.execute('read_file_voice', { path: 'test/fixtures/sample.js' });
      
      // Now reference "that file"
      const result = await toolset.execute('read_file_voice', {
        path: 'that',
        section: 'end'
      });
      
      expect(result.path).to.include('sample.js');
    });
  });
});
```

---

### Integration Tests

Test voice workflows end-to-end:

```javascript
describe('Voice File Editing Workflow', () => {
  it('should support natural voice editing flow', async () => {
    const workspace = await openAIWorkspace();
    const vox = workspace.realtimeComponent;
    
    // Simulate voice commands
    await vox.processVoiceCommand("Show me the basic-toolset file");
    expect(vox.lastToolCalled).to.equal('read_file_voice');
    
    await vox.processVoiceCommand("Add a new method called testMethod");
    expect(vox.lastToolCalled).to.equal('append_to_file');
    
    await vox.processVoiceCommand("What files have we looked at?");
    expect(vox.lastToolCalled).to.equal('list_recent_files');
  });
});
```

---

### Voice Command Tests

Test fuzzy matching and natural language understanding:

```javascript
describe('FileContext', () => {
  it('should resolve conversational references', () => {
    const context = new FileContext();
    
    context.setWorkingFile('src/components/lively-chat.js');
    
    expect(context.resolveFileReference('this')).to.equal('src/components/lively-chat.js');
    expect(context.resolveFileReference('current')).to.equal('src/components/lively-chat.js');
    expect(context.resolveFileReference('working')).to.equal('src/components/lively-chat.js');
  });
  
  it('should match file names by fragment', () => {
    const context = new FileContext();
    
    context.addToRecent('src/ai-workspace/components/openai-realtime-chat.js', 'read');
    context.addToRecent('src/ai-workspace/components/basic-toolset.js', 'read');
    
    expect(context.resolveFileReference('realtime')).to.include('realtime-chat.js');
    expect(context.resolveFileReference('toolset')).to.include('toolset.js');
  });
});
```

---

## Documentation Requirements

### User Documentation

1. **Voice Command Guide** - Examples of natural voice commands for each tool
2. **Conversational Patterns** - How to refer to files, chain operations, etc.
3. **When to Use Voice vs. Scribe** - Clear guidance on tool selection
4. **Safety Features** - Explanation of confirmations, undo, etc.

### Developer Documentation

1. **VoiceToolset API** - Complete API reference
2. **Adding New Tools** - How to extend the toolset
3. **Tool Renderer Guide** - Creating visual renderers for tool outputs
4. **FileContext Guide** - Managing conversation state

### Example Documentation Entry

```markdown
## read_file_voice

Read a file with voice-optimized output and context tracking.

**Voice Commands:**
- "Show me [filename]"
- "Read the first 10 lines of [filename]"
- "What's in [filename]?"
- "Show me that file" (references last file mentioned)

**Parameters:**
- `path` (string, required): File path or conversational reference
- `section` (string, optional): "start", "end", "around line X"
- `lines` (number, optional): How many lines to show (default: 20)

**Returns:**
- Syntax-highlighted code display
- File metadata (size, total lines, shown range)
- Conversational response for TTS

**Examples:**

*Simple read:*
User: "Show me basic-toolset.js"
Vox: [displays first 20 lines] "Here's the BasicToolset. It's 152 lines total."

*Specific section:*
User: "Read the end of that file"
Vox: [displays last 20 lines] "Here's the end of the file, showing the execute method."

*Context reference:*
User: "Show me openai-realtime-chat.js"
Vox: [displays file]
User: "Now show me around line 150"
Vox: [displays lines 140-160] "Showing lines 140-160, centered on line 150."
```

---

## Open Questions & Future Enhancements

### Open Questions

1. **Multi-file Operations**: How to handle voice commands that affect multiple files?
   - Example: "Add this import to all toolset files"
   - Consider delegating to Scribe for batch operations

2. **Error Recovery**: How to handle voice dictation errors gracefully?
   - Fuzzy matching threshold tuning
   - "Did you mean...?" suggestions
   - Learn from corrections

3. **Long Operations**: How to handle operations that take >5 seconds?
   - Progress indicators
   - Ability to interrupt/cancel
   - Background processing with notifications

4. **File Watching**: Should voice tools watch files for external changes?
   - Cache invalidation strategy
   - Notification of external edits
   - Conflict resolution

### Future Enhancements

1. **Multi-file Refactoring**: Voice-initiated refactoring with Scribe delegation
   - Example: "Rename this method across all files"
   - Scribe does the work, Vox provides conversational interface

2. **Code Generation**: Voice-driven code scaffolding
   - "Create a new tool called X that does Y"
   - Template-based generation with voice parameters

3. **Git Integration**: Voice commands for git operations
   - "Commit these changes with message X"
   - "Show me what changed since last commit"
   - Delegate complex git operations to Scribe

4. **Collaborative Editing**: Multi-user voice editing sessions
   - Voice-driven pair programming
   - Conflict resolution via conversation
   - Shared context across sessions

5. **Learning from Usage**: Improve tool selection based on patterns
   - Learn which operations user prefers voice for
   - Suggest voice shortcuts for common workflows
   - Personalized tool recommendations

6. **Voice Macros**: Record and replay voice command sequences
   - "Remember this sequence as 'setup new component'"
   - "Run the setup new component macro"
   - Share macros across team

---

## Summary

This plan provides a comprehensive foundation for voice-optimized file editing in the AI Workspace. By creating dedicated voice tools that complement (rather than replace) the powerful Scribe agent, we enable:

1. **Fast, conversational file operations** for quick reads, simple edits, and navigation
2. **Intelligent delegation to Scribe** for complex, multi-step coding tasks
3. **Natural voice interaction** with fuzzy matching, context awareness, and confirmations
4. **Visual feedback** that works seamlessly with voice interaction
5. **Safe file operations** with appropriate confirmations and undo capability

The implementation roadmap provides a structured 5-week path to delivery, with clear milestones and success criteria for each phase.

**Next Steps:**
1. Review and refine this plan with stakeholders
2. Create initial VoiceToolset class structure
3. Implement Phase 1 (Core Reading Tools)
4. Iterate based on user testing and feedback
