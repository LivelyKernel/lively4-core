# Voice File Tools - Quick Reference Outline

**See full plan:** [vox-file-tools-plan.md](vox-file-tools-plan.md)

## Tool Categories Overview

### 1. File Reading Tools 📖
- **read_file_voice** - Quick file inspection with voice-friendly output
- **peek_file_structure** - High-level overview (classes, functions, exports)
- **list_recent_files** - Show recently accessed files in conversation

**Voice Examples:**
- "Show me openai-realtime-chat.js"
- "What's in that file?"
- "What files have we looked at?"

---

### 2. File Editing Tools ✏️
- **edit_file_voice** - Targeted edits with fuzzy matching
- **append_to_file** - Add content to file (end or specific location)
- **quick_fix** - Common quick fixes (add import, fix typo, add comment)

**Voice Examples:**
- "Change 'hello' to 'hello world' in that file"
- "Add a method called handleVoiceCommand"
- "Add an import for BasicToolset"

---

### 3. File Search Tools 🔍
- **find_files_voice** - Natural language file finding
- **search_in_files** - Search file contents with context

**Voice Examples:**
- "Find files related to tools"
- "Search for 'send_opencode_task'"

---

### 4. File Management Tools 📁
- **create_file_voice** - Create new files with templates
- **rename_file_voice** - Rename/move files with safety checks
- **delete_file_voice** - Delete files with strong confirmation

**Voice Examples:**
- "Create a new component called lively-voice-recorder"
- "Rename that file to new-name.js"
- "Delete old-component.js"

---

### 5. Context Management Tools 📍
- **set_working_file** - Set current working file
- **get_file_context** - Show current context state

**Voice Examples:**
- "Work on openai-realtime-chat.js"
- "What file am I working on?"

---

### 6. Navigation Tools 🧭
- **open_file_in_editor** - Open in Lively4 editor
- **show_file_diff** - Compare versions

**Voice Examples:**
- "Open that file in the editor"
- "Show me what changed"

---

## Architecture

```
VoiceToolset (new)
├── FileContext (conversation state)
│   ├── workingFile
│   ├── recentFiles
│   └── resolveFileReference()
│
├── File Reading Tools
│   ├── read_file_voice
│   ├── peek_file_structure
│   └── list_recent_files
│
├── File Editing Tools
│   ├── edit_file_voice
│   ├── append_to_file
│   └── quick_fix
│
├── File Search Tools
│   ├── find_files_voice
│   └── search_in_files
│
├── File Management Tools
│   ├── create_file_voice
│   ├── rename_file_voice
│   └── delete_file_voice
│
├── Context Management Tools
│   ├── set_working_file
│   └── get_file_context
│
└── Navigation Tools
    ├── open_file_in_editor
    └── show_file_diff
```

---

## Voice Tools vs. Scribe Decision Matrix

| Operation | Use Voice Tools | Delegate to Scribe |
|-----------|----------------|-------------------|
| Read a file | ✅ Yes | ❌ Overkill |
| Edit single line | ✅ Yes | ❌ Overkill |
| Find a file | ✅ Yes | ❌ Overkill |
| Multi-file refactoring | ❌ Too complex | ✅ Yes |
| Systematic changes | ❌ Too complex | ✅ Yes |
| Test-driven development | ❌ Too complex | ✅ Yes |
| Quick typo fix | ✅ Yes | ❌ Overkill |
| Add import statement | ✅ Yes (quick_fix) | ❌ Overkill |
| Rename method across files | ❌ Too complex | ✅ Yes |
| Create new component | ✅ Yes (template) | ⚠️ Either works |
| Complex code analysis | ❌ Too complex | ✅ Yes |

**Rule of Thumb:**
- **Single file, simple operation** → Voice Tools
- **Multiple files, systematic changes** → Scribe
- **Quick reads/checks** → Voice Tools
- **Requires testing/validation** → Scribe

---

## Key Features

### Conversational File References
Voice tools understand natural references:
- "this file" / "current file" → working file
- "that file" / "last file" → most recently accessed
- "the realtime file" → fuzzy match to "openai-realtime-chat.js"

### Context Tracking
FileContext maintains:
- Current working file
- Recent files (last 20)
- Operation history (read, edit, create, delete)
- Timestamps for recency-based suggestions

### Safety Mechanisms
- Confirmation for destructive operations
- Extra confirmation for recently modified files
- Visual diff before applying edits
- Undo capability via conversation history
- Move to trash instead of delete

### Visual Feedback
- Syntax-highlighted code display
- Diff visualization for edits
- File metadata (size, lines, language)
- Progress indicators for long operations
- Clear success/error messages

---

## Implementation Phases

### Phase 1: Core Reading (Week 1)
- read_file_voice
- find_files_voice
- list_recent_files
- FileContext basics

### Phase 2: Simple Editing (Week 2)
- append_to_file
- edit_file_voice
- quick_fix
- Diff visualization

### Phase 3: File Management (Week 3)
- create_file_voice
- rename_file_voice
- delete_file_voice
- Safety confirmations

### Phase 4: Advanced Features (Week 4)
- peek_file_structure
- show_file_diff
- open_file_in_editor
- Performance optimization

### Phase 5: Integration & Polish (Week 5)
- Intelligent delegation logic
- Conversation history persistence
- Documentation
- User testing

---

## Example Voice Workflow

**Scenario:** User wants to add a new voice command handler

**Conversation:**

👤 User: "Show me the realtime chat component"

🤖 Vox: [calls read_file_voice] "Here's openai-realtime-chat.js. It's 450 lines. Showing the class definition and initialization."

👤 User: "Add a method called handleVoiceInterrupt"

🤖 Vox: [calls append_to_file] "I've added the handleVoiceInterrupt method at line 380. Would you like me to add any logic to it?"

👤 User: "Yes, make it call stopAudio first"

🤖 Vox: [calls edit_file_voice] "Done! The method now calls stopAudio. Ready to test?"

👤 User: "Actually, let me see what we changed"

🤖 Vox: [calls show_file_diff] "Here's the diff showing your changes..."

👤 User: "Looks good. Now have Scribe write tests for this method"

🤖 Vox: [calls send_opencode_task] "I've asked Scribe to write tests for handleVoiceInterrupt. He's working on it now..."

---

## Integration with Existing Tools

### Uses Existing Infrastructure
- `lively.files.*` API for file operations
- Existing tool renderers (opencode-read-tool, etc.)
- CompositeToolset pattern for tool composition
- OpenAI Realtime API for voice interaction

### Complements Existing Tools
- **BasicToolset**: evaluate_code, time, notifications
- **WorkspaceToolset**: send_opencode_task (Scribe delegation)
- **VoiceToolset**: NEW - voice-optimized file operations

### Renderer Integration
Voice tools produce outputs compatible with existing renderers:
- opencode-read-tool for file reads
- opencode-edit-tool for edits (diff visualization)
- opencode-write-tool for file creation
- Custom voice-specific renderers where needed

---

## Technical Details

### VoiceToolset Class
```javascript
export class VoiceToolset {
  constructor(realtimeChat) {
    this.realtimeChat = realtimeChat;
    this.fileContext = new FileContext();
    this.cache = new Map();
    this.tools = { /* tool definitions */ };
  }
  
  getDefinitions() { /* returns OpenAI function definitions */ }
  async execute(toolName, args) { /* executes tool, updates context */ }
}
```

### FileContext Class
```javascript
class FileContext {
  constructor() {
    this.workingFile = null;
    this.recentFiles = [];
  }
  
  resolveFileReference(ref) { /* "that file" → actual path */ }
  setWorkingFile(path) { /* update working file */ }
  addToRecent(path, operation) { /* track file operation */ }
}
```

### Tool Output Format
```javascript
{
  success: true,
  tool: 'read_file_voice',
  path: 'src/components/openai-realtime-chat.js',
  content: '// file content...',
  metadata: { totalLines: 450, shownLines: [1, 30] },
  voiceResponse: "Here's the file...", // For TTS
  visualRenderer: 'voice-read-tool' // UI renderer
}
```

---

## Next Steps

1. **Review Plan**: Get feedback from stakeholders
2. **Prototype**: Implement read_file_voice as proof-of-concept
3. **User Testing**: Test with actual voice commands
4. **Iterate**: Refine based on feedback
5. **Phase 1 Implementation**: Complete core reading tools
6. **Expand**: Add editing, management, advanced features

---

## Questions to Resolve

1. **Multi-file operations**: How to handle voice commands affecting multiple files?
2. **Error recovery**: Best approach for voice dictation errors?
3. **Long operations**: Progress indicators and cancellation?
4. **File watching**: Should tools watch for external changes?
5. **Git integration**: How deep should git integration go?

---

**See full details in:** [vox-file-tools-plan.md](vox-file-tools-plan.md)
