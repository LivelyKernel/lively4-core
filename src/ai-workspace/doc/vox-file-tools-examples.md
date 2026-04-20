# Voice File Tools - Code Examples

Concrete implementation examples for the Voice File Tools.

## VoiceToolset Class Implementation

```javascript
/*MD
# VoiceToolset

Voice-optimized file editing tools for the AI Workspace voice agent (Vox).
Provides direct file operations with conversational interface and context awareness.

MD*/

import { FileContext } from './voice-file-context.js';

export class VoiceToolset {
  constructor(realtimeChat) {
    if (!realtimeChat) {
      throw new Error("VoiceToolset requires a realtimeChat reference");
    }
    
    this.realtimeChat = realtimeChat;
    this.fileContext = new FileContext();
    this.cache = new Map(); // Simple in-memory cache
    
    this.tools = {
      read_file_voice: {
        definition: {
          type: "function",
          name: "read_file_voice",
          description: "Read a file with voice-optimized output. Supports conversational file references like 'that file' or 'this one'. Shows syntax-highlighted code with context.",
          parameters: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "File path or conversational reference ('this', 'that', 'last', 'current', or file name fragment)"
              },
              section: {
                type: "string",
                description: "Which section to show: 'start', 'end', or 'around line X'",
                enum: ["start", "end", "around"]
              },
              lines: {
                type: "number",
                description: "How many lines to show (default: 20)"
              },
              line_number: {
                type: "number",
                description: "Specific line number for 'around' section"
              }
            },
            required: ["path"]
          }
        },
        execute: async (args) => this.execute_read_file_voice(args)
      },
      
      edit_file_voice: {
        definition: {
          type: "function",
          name: "edit_file_voice",
          description: "Make targeted edits to a file. Uses fuzzy matching to handle voice dictation errors. Shows diff before applying.",
          parameters: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "File path or conversational reference"
              },
              old_text: {
                type: "string",
                description: "Text to replace (approximate match allowed)"
              },
              new_text: {
                type: "string",
                description: "Replacement text"
              },
              fuzzy_match: {
                type: "boolean",
                description: "Allow approximate matching for voice dictation errors (default: true)"
              }
            },
            required: ["path", "old_text", "new_text"]
          }
        },
        execute: async (args) => this.execute_edit_file_voice(args)
      },
      
      find_files_voice: {
        definition: {
          type: "function",
          name: "find_files_voice",
          description: "Find files using natural language description. Searches by file name, path components, and content.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Natural language description of files to find (e.g., 'files related to tools', 'the realtime chat component')"
              },
              where: {
                type: "string",
                description: "Directory hint to narrow search (optional, default: project root)"
              },
              limit: {
                type: "number",
                description: "Maximum results to return (default: 10)"
              }
            },
            required: ["query"]
          }
        },
        execute: async (args) => this.execute_find_files_voice(args)
      },
      
      append_to_file: {
        definition: {
          type: "function",
          name: "append_to_file",
          description: "Add content to a file. Can append to end or insert at specific location.",
          parameters: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "File path or conversational reference"
              },
              content: {
                type: "string",
                description: "Content to add"
              },
              location: {
                type: "string",
                description: "'end' (default), 'after line X', or 'before line Y'"
              }
            },
            required: ["path", "content"]
          }
        },
        execute: async (args) => this.execute_append_to_file(args)
      },
      
      list_recent_files: {
        definition: {
          type: "function",
          name: "list_recent_files",
          description: "Show files recently read or edited in this conversation. Useful for remembering context.",
          parameters: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum files to show (default: 10)"
              }
            }
          }
        },
        execute: async (args) => this.execute_list_recent_files(args)
      },
      
      set_working_file: {
        definition: {
          type: "function",
          name: "set_working_file",
          description: "Explicitly set the current working file. Subsequent references to 'this file' or 'current file' will use this.",
          parameters: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "File path to set as working file"
              }
            },
            required: ["path"]
          }
        },
        execute: async (args) => this.execute_set_working_file(args)
      }
    };
  }
  
  getDefinitions() {
    return Object.values(this.tools).map(tool => tool.definition);
  }
  
  async execute(toolName, args) {
    const tool = this.tools[toolName];
    if (!tool) {
      throw new Error(`Unknown voice tool: ${toolName}`);
    }
    
    // Resolve file references before executing
    this.fileContext.beforeToolExecution(toolName, args);
    
    try {
      const result = await tool.execute.call(this, args);
      
      // Update context after successful execution
      this.fileContext.afterToolExecution(toolName, args, result);
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        voiceResponse: `Sorry, I encountered an error: ${error.message}`
      };
    }
  }
  
  // ========== Tool Implementations ==========
  
  async execute_read_file_voice(args) {
    const { path, section = 'start', lines = 20, line_number } = args;
    
    try {
      // Load file (with caching)
      const content = await this.loadFileWithCache(path);
      const allLines = content.split('\n');
      const totalLines = allLines.length;
      
      // Determine which section to show
      let { startLine, endLine, description } = this.calculateSection(
        section, 
        line_number, 
        lines, 
        totalLines
      );
      
      // Extract section
      const shownLines = allLines.slice(startLine - 1, endLine);
      const shownContent = shownLines.join('\n');
      
      // Detect language for syntax highlighting
      const fileName = lively.files.name(path);
      const language = this.detectLanguage(fileName);
      
      // Generate voice response
      const voiceResponse = this.generateReadVoiceResponse(
        fileName, 
        totalLines, 
        startLine, 
        endLine, 
        description
      );
      
      return {
        success: true,
        tool: 'read_file_voice',
        path,
        content: shownContent,
        metadata: {
          fileName,
          totalLines,
          shownLines: [startLine, endLine],
          language,
          size: content.length
        },
        voiceResponse,
        visualRenderer: 'voice-read-tool'
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error.message}`,
        voiceResponse: `Sorry, I couldn't read ${lively.files.name(path)}. ${error.message}`
      };
    }
  }
  
  async execute_edit_file_voice(args) {
    const { path, old_text, new_text, fuzzy_match = true } = args;
    
    try {
      // Load current content
      const content = await lively.files.loadFile(path);
      
      // Find match (exact or fuzzy)
      const match = fuzzy_match 
        ? this.fuzzyFindText(content, old_text)
        : content.includes(old_text) ? old_text : null;
      
      if (!match) {
        return {
          success: false,
          error: `Could not find text to replace in ${path}`,
          voiceResponse: `I couldn't find the text you want to change in ${lively.files.name(path)}. Could you try rephrasing?`
        };
      }
      
      // Check for multiple matches
      const matchCount = (content.match(new RegExp(this.escapeRegex(match), 'g')) || []).length;
      if (matchCount > 1) {
        return {
          success: false,
          error: `Found ${matchCount} matches. Please provide more context to identify the specific occurrence.`,
          voiceResponse: `I found ${matchCount} places where that text appears. Can you give me more context so I know which one to change?`
        };
      }
      
      // Apply edit
      const newContent = content.replace(match, new_text);
      
      // Save file
      await lively.files.saveFile(path, newContent);
      
      // Invalidate cache
      this.cache.delete(path);
      
      // Generate diff for visualization
      const diff = this.generateDiff(match, new_text);
      
      return {
        success: true,
        tool: 'edit_file_voice',
        path,
        oldText: match,
        newText: new_text,
        diff,
        voiceResponse: `Done! I've updated ${lively.files.name(path)}.`,
        visualRenderer: 'voice-edit-tool'
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to edit file: ${error.message}`,
        voiceResponse: `Sorry, I couldn't edit the file. ${error.message}`
      };
    }
  }
  
  async execute_find_files_voice(args) {
    const { query, where = lively4url, limit = 10 } = args;
    
    try {
      // Search for files
      const allFiles = await lively.files.walkDir(where);
      
      // Score and rank files by relevance
      const scored = allFiles.map(file => ({
        path: file,
        score: this.scoreFileRelevance(file, query)
      }));
      
      // Sort by score and take top results
      const results = scored
        .filter(f => f.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(f => f.path);
      
      if (results.length === 0) {
        return {
          success: true,
          results: [],
          voiceResponse: `I couldn't find any files matching "${query}". Try a different search term?`
        };
      }
      
      // Generate voice response
      const voiceResponse = results.length === 1
        ? `I found one file: ${lively.files.name(results[0])}`
        : `I found ${results.length} files matching "${query}". The top match is ${lively.files.name(results[0])}.`;
      
      return {
        success: true,
        tool: 'find_files_voice',
        query,
        results,
        voiceResponse,
        visualRenderer: 'voice-find-tool'
      };
      
    } catch (error) {
      return {
        success: false,
        error: `File search failed: ${error.message}`,
        voiceResponse: `Sorry, I couldn't search for files. ${error.message}`
      };
    }
  }
  
  async execute_append_to_file(args) {
    const { path, content, location = 'end' } = args;
    
    try {
      // Load current content
      const currentContent = await lively.files.loadFile(path);
      const lines = currentContent.split('\n');
      
      // Determine insertion point
      let insertIndex;
      if (location === 'end') {
        insertIndex = lines.length;
      } else if (location.startsWith('after line ')) {
        const lineNum = parseInt(location.replace('after line ', ''));
        insertIndex = lineNum;
      } else if (location.startsWith('before line ')) {
        const lineNum = parseInt(location.replace('before line ', ''));
        insertIndex = lineNum - 1;
      }
      
      // Insert content
      const contentLines = content.split('\n');
      lines.splice(insertIndex, 0, ...contentLines);
      
      // Save file
      const newContent = lines.join('\n');
      await lively.files.saveFile(path, newContent);
      
      // Invalidate cache
      this.cache.delete(path);
      
      return {
        success: true,
        tool: 'append_to_file',
        path,
        location,
        insertedLines: contentLines.length,
        atLine: insertIndex + 1,
        voiceResponse: `Added ${contentLines.length} lines to ${lively.files.name(path)} at line ${insertIndex + 1}.`,
        visualRenderer: 'voice-append-tool'
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to append content: ${error.message}`,
        voiceResponse: `Sorry, I couldn't add that content. ${error.message}`
      };
    }
  }
  
  async execute_list_recent_files(args) {
    const { limit = 10 } = args;
    
    const recentFiles = this.fileContext.getRecentFiles(limit);
    
    if (recentFiles.length === 0) {
      return {
        success: true,
        files: [],
        voiceResponse: "We haven't looked at any files yet in this conversation."
      };
    }
    
    const voiceResponse = `We've looked at ${recentFiles.length} files recently. The most recent is ${lively.files.name(recentFiles[0].path)}.`;
    
    return {
      success: true,
      tool: 'list_recent_files',
      files: recentFiles,
      voiceResponse,
      visualRenderer: 'voice-recent-files-tool'
    };
  }
  
  async execute_set_working_file(args) {
    const { path } = args;
    
    // Check if file exists
    const exists = await lively.files.exists(path);
    if (!exists) {
      return {
        success: false,
        error: `File does not exist: ${path}`,
        voiceResponse: `I couldn't find ${lively.files.name(path)}. Are you sure it exists?`
      };
    }
    
    this.fileContext.setWorkingFile(path);
    
    return {
      success: true,
      tool: 'set_working_file',
      path,
      voiceResponse: `Working on ${lively.files.name(path)}.`,
      visualRenderer: 'voice-working-file-tool'
    };
  }
  
  // ========== Helper Methods ==========
  
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
  
  calculateSection(section, line_number, lines, totalLines) {
    if (section === 'start') {
      return {
        startLine: 1,
        endLine: Math.min(lines, totalLines),
        description: 'start'
      };
    }
    
    if (section === 'end') {
      return {
        startLine: Math.max(1, totalLines - lines + 1),
        endLine: totalLines,
        description: 'end'
      };
    }
    
    if (section === 'around' && line_number) {
      const halfLines = Math.floor(lines / 2);
      return {
        startLine: Math.max(1, line_number - halfLines),
        endLine: Math.min(totalLines, line_number + halfLines),
        description: `around line ${line_number}`
      };
    }
    
    // Default to start
    return {
      startLine: 1,
      endLine: Math.min(lines, totalLines),
      description: 'start'
    };
  }
  
  detectLanguage(fileName) {
    const ext = lively.files.extension(fileName);
    const languageMap = {
      'js': 'javascript',
      'html': 'html',
      'css': 'css',
      'md': 'markdown',
      'json': 'json',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'sh': 'bash'
    };
    return languageMap[ext] || 'text';
  }
  
  generateReadVoiceResponse(fileName, totalLines, startLine, endLine, description) {
    if (totalLines <= 20) {
      return `Here's ${fileName}. It's ${totalLines} lines total.`;
    }
    
    if (description === 'start') {
      return `Here's the start of ${fileName}. Showing lines ${startLine} to ${endLine} of ${totalLines} total.`;
    }
    
    if (description === 'end') {
      return `Here's the end of ${fileName}. Showing lines ${startLine} to ${endLine} of ${totalLines} total.`;
    }
    
    return `Showing lines ${startLine} to ${endLine} of ${fileName}.`;
  }
  
  fuzzyFindText(content, searchText) {
    // Simple fuzzy matching: normalize whitespace and case
    const normalizeText = (text) => text.trim().toLowerCase().replace(/\s+/g, ' ');
    
    const normalizedSearch = normalizeText(searchText);
    const contentLines = content.split('\n');
    
    // Try exact match first
    if (content.includes(searchText)) {
      return searchText;
    }
    
    // Try normalized match on each line
    for (const line of contentLines) {
      if (normalizeText(line) === normalizedSearch) {
        return line.trim();
      }
    }
    
    // Try substring match with normalized text
    for (const line of contentLines) {
      if (normalizeText(line).includes(normalizedSearch)) {
        return line.trim();
      }
    }
    
    return null;
  }
  
  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  generateDiff(oldText, newText) {
    // Simple inline diff representation
    return {
      old: oldText,
      new: newText,
      type: 'inline'
    };
  }
  
  scoreFileRelevance(filePath, query) {
    // Simple relevance scoring based on:
    // - File name contains query terms (high weight)
    // - Path components contain query terms (medium weight)
    // - Exact matches (highest weight)
    
    const fileName = lively.files.name(filePath).toLowerCase();
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);
    
    let score = 0;
    
    // Exact file name match
    if (fileName === queryLower) {
      score += 100;
    }
    
    // File name contains entire query
    if (fileName.includes(queryLower)) {
      score += 50;
    }
    
    // File name contains query terms
    for (const term of queryTerms) {
      if (fileName.includes(term)) {
        score += 10;
      }
    }
    
    // Path contains query terms
    const pathLower = filePath.toLowerCase();
    for (const term of queryTerms) {
      if (pathLower.includes(term)) {
        score += 5;
      }
    }
    
    return score;
  }
}
```

---

## FileContext Class Implementation

```javascript
/*MD
# FileContext

Manages conversation context for voice file operations.
Tracks working file, recent files, and resolves conversational references.

MD*/

export class FileContext {
  constructor() {
    this.workingFile = null;
    this.recentFiles = []; // Array of {path, operation, timestamp}
    this.maxRecentFiles = 20;
  }
  
  setWorkingFile(path) {
    this.workingFile = path;
    this.addToRecent(path, 'set_working');
  }
  
  getWorkingFile() {
    return this.workingFile;
  }
  
  addToRecent(path, operation) {
    // Remove duplicate if exists
    this.recentFiles = this.recentFiles.filter(f => f.path !== path);
    
    // Add to front
    this.recentFiles.unshift({
      path,
      operation,
      timestamp: Date.now()
    });
    
    // Keep only recent entries
    if (this.recentFiles.length > this.maxRecentFiles) {
      this.recentFiles = this.recentFiles.slice(0, this.maxRecentFiles);
    }
  }
  
  getRecentFiles(limit = 10) {
    return this.recentFiles.slice(0, limit);
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
    const refLower = ref.toLowerCase();
    const match = this.recentFiles.find(f => {
      const fileName = lively.files.name(f.path).toLowerCase();
      return fileName.includes(refLower) || f.path.toLowerCase().includes(refLower);
    });
    
    if (match) {
      return match.path;
    }
    
    // Fall back to literal path
    return ref;
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
      if (['read_file_voice', 'edit_file_voice', 'append_to_file'].includes(toolName)) {
        this.setWorkingFile(args.path);
      }
    }
  }
  
  getOperationFromToolName(toolName) {
    const map = {
      read_file_voice: 'read',
      edit_file_voice: 'edit',
      append_to_file: 'edit',
      create_file_voice: 'create',
      delete_file_voice: 'delete',
      set_working_file: 'set_working'
    };
    return map[toolName] || 'unknown';
  }
}
```

---

## Integration with OpenAI Realtime Chat

```javascript
// In openai-realtime-chat.js

import { CompositeToolset } from './realtime-chat-tools/composite-toolset.js';
import { VoiceToolset } from './realtime-chat-tools/voice-toolset.js';

export default class OpenaiRealtimeChat extends LivelyChat {
  
  async initializeTools() {
    // Create composite toolset with all tool categories
    const composite = new CompositeToolset(this.workspace);
    
    // Add voice toolset
    const voiceToolset = new VoiceToolset(this);
    composite.addToolset('voice', voiceToolset);
    
    this.compositeToolset = composite;
    
    // Register all tool definitions with OpenAI
    const allDefinitions = composite.getDefinitions();
    for (const def of allDefinitions) {
      await this.addTool(def);
    }
    
    console.log(`Registered ${allDefinitions.length} tools with OpenAI Realtime API`);
  }
  
  async handleToolCall(toolCall) {
    const { name, arguments: args } = toolCall;
    
    try {
      // Execute tool via composite toolset
      const result = await this.compositeToolset.execute(name, JSON.parse(args));
      
      // Render visual output
      await this.renderToolOutput(name, result);
      
      // Return result to OpenAI
      return {
        success: true,
        output: result.voiceResponse || result.message || 'Done.'
      };
      
    } catch (error) {
      console.error(`Tool execution failed: ${name}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async renderToolOutput(toolName, result) {
    if (!result.visualRenderer) return;
    
    // Delegate to tool renderer
    const renderer = this.getToolRenderer(result.visualRenderer);
    const outputEl = await renderer.render(result);
    
    // Append to chat UI
    this.appendToChat(outputEl);
  }
}
```

---

## Usage Examples

### Example 1: Reading a File

**Voice Command:** "Show me the realtime chat component"

**Tool Call:**
```javascript
{
  name: "find_files_voice",
  arguments: {
    query: "realtime chat component"
  }
}
```

**Result:**
```javascript
{
  success: true,
  tool: 'find_files_voice',
  query: 'realtime chat component',
  results: [
    'src/ai-workspace/components/openai-realtime-chat.js',
    'src/ai-workspace/components/openai-realtime-chat.html'
  ],
  voiceResponse: "I found 2 files. The top match is openai-realtime-chat.js."
}
```

**Follow-up Voice Command:** "Read that file"

**Tool Call:**
```javascript
{
  name: "read_file_voice",
  arguments: {
    path: "that",  // Resolved to 'src/ai-workspace/components/openai-realtime-chat.js'
    section: "start",
    lines: 30
  }
}
```

**Result:**
```javascript
{
  success: true,
  tool: 'read_file_voice',
  path: 'src/ai-workspace/components/openai-realtime-chat.js',
  content: '// File content here...',
  metadata: {
    fileName: 'openai-realtime-chat.js',
    totalLines: 450,
    shownLines: [1, 30],
    language: 'javascript',
    size: 15234
  },
  voiceResponse: "Here's the start of openai-realtime-chat.js. Showing lines 1 to 30 of 450 total."
}
```

---

### Example 2: Editing a File

**Voice Command:** "Add a method called handleVoiceInterrupt to that file"

**Tool Call:**
```javascript
{
  name: "append_to_file",
  arguments: {
    path: "that",  // Resolved to last read file
    content: "async handleVoiceInterrupt() {\n    // TODO: Implement voice interrupt handling\n  }",
    location: "end"
  }
}
```

**Result:**
```javascript
{
  success: true,
  tool: 'append_to_file',
  path: 'src/ai-workspace/components/openai-realtime-chat.js',
  location: 'end',
  insertedLines: 3,
  atLine: 451,
  voiceResponse: "Added 3 lines to openai-realtime-chat.js at line 451."
}
```

**Follow-up Voice Command:** "Make it call stopAudio first"

**Tool Call:**
```javascript
{
  name: "edit_file_voice",
  arguments: {
    path: "current",
    old_text: "async handleVoiceInterrupt() {\n    // TODO: Implement voice interrupt handling",
    new_text: "async handleVoiceInterrupt() {\n    await this.stopAudio();\n    // TODO: Implement voice interrupt handling",
    fuzzy_match: true
  }
}
```

**Result:**
```javascript
{
  success: true,
  tool: 'edit_file_voice',
  path: 'src/ai-workspace/components/openai-realtime-chat.js',
  oldText: "async handleVoiceInterrupt() {\n    // TODO: Implement",
  newText: "async handleVoiceInterrupt() {\n    await this.stopAudio();\n    // TODO: Implement",
  diff: { old: '...', new: '...', type: 'inline' },
  voiceResponse: "Done! I've updated openai-realtime-chat.js."
}
```

---

### Example 3: Context Management

**Voice Command:** "What files have we looked at?"

**Tool Call:**
```javascript
{
  name: "list_recent_files",
  arguments: {
    limit: 10
  }
}
```

**Result:**
```javascript
{
  success: true,
  tool: 'list_recent_files',
  files: [
    { path: 'src/ai-workspace/components/openai-realtime-chat.js', operation: 'edit', timestamp: 1710345600000 },
    { path: 'src/ai-workspace/components/realtime-chat-tools/basic-toolset.js', operation: 'read', timestamp: 1710345300000 },
    { path: 'src/ai-workspace/doc/vox-file-tools-plan.md', operation: 'create', timestamp: 1710345000000 }
  ],
  voiceResponse: "We've looked at 3 files recently. The most recent is openai-realtime-chat.js."
}
```

---

### Example 4: Delegation to Scribe

**Voice Command:** "Refactor all toolset files to use a common base class"

**Vox's Reasoning:**
- Multi-file operation → Complex
- Requires code analysis → Complex
- Needs testing → Requires Scribe

**Tool Call:**
```javascript
{
  name: "send_opencode_task",
  arguments: {
    task: "Refactor all toolset files in src/ai-workspace/components/realtime-chat-tools/ to use a common base class. Extract shared functionality (getDefinitions, execute pattern). Ensure all tests pass. Follow existing component patterns."
  }
}
```

**Vox's Response:** "This is a complex refactoring task. I've asked Scribe to handle it. He'll analyze the toolset files, create a base class, and refactor them systematically. I'll let you know when it's done."

---

## Tool Renderer Examples

### Voice Read Tool Renderer

```javascript
// In src/ai-workspace/components/tool-renderers/voice-read-tool.js

import { OpenCodeBaseTool } from './opencode-base-tool.js';
import * as ToolHelpers from '../chat-tool-helpers.js';

export class VoiceReadTool extends OpenCodeBaseTool {
  
  matches(result) {
    return result.tool === 'read_file_voice' || result.visualRenderer === 'voice-read-tool';
  }
  
  async render(part, result, showDebug, isStreaming) {
    const { path, content, metadata } = result;
    const { fileName, totalLines, shownLines, language } = metadata;
    
    const rangeInfo = totalLines > shownLines[1] 
      ? ` (lines ${shownLines[0]}-${shownLines[1]} of ${totalLines})`
      : '';
    
    const toolId = `voice-read-${Date.now()}`;
    
    const details = await this.buildDetails(
      toolId, 
      `📖 ${fileName}${rangeInfo}`, 
      { path }, 
      false // showDebug
    );
    
    // Add syntax-highlighted content
    const codeBlock = await this.createMarkdownEl(
      `\`\`\`${language}\n${content}\n\`\`\``
    );
    details.appendChild(codeBlock);
    
    // Add navigation hints if file is large
    if (totalLines > shownLines[1]) {
      const hint = await this.createMarkdownEl(
        `*💡 Tip: Say "show me the end" or "show me around line X" to see other sections*`
      );
      details.appendChild(hint);
    }
    
    return details;
  }
}
```

---

### Voice Edit Tool Renderer

```javascript
// In src/ai-workspace/components/tool-renderers/voice-edit-tool.js

import { OpenCodeEditTool } from './opencode-edit-tool.js';

export class VoiceEditTool extends OpenCodeEditTool {
  
  matches(result) {
    return result.tool === 'edit_file_voice' || result.visualRenderer === 'voice-edit-tool';
  }
  
  async render(part, result, showDebug, isStreaming) {
    const { path, oldText, newText, diff } = result;
    const fileName = lively.files.name(path);
    
    const toolId = `voice-edit-${Date.now()}`;
    
    const details = await this.buildDetails(
      toolId,
      `✏️ ${fileName}`,
      { path },
      false
    );
    
    // Show diff
    details.appendChild(await this.createMarkdownEl('**Changes:**'));
    details.appendChild(this.generateInlineDiffEl(oldText, newText));
    
    // Success indicator
    details.appendChild(await this.createMarkdownEl('✅ Edit applied successfully'));
    
    return details;
  }
}
```

---

## Test Examples

```javascript
// In src/ai-workspace/test/voice-toolset-test.js

import { VoiceToolset } from '../components/realtime-chat-tools/voice-toolset.js';
import { FileContext } from '../components/realtime-chat-tools/voice-file-context.js';

describe('VoiceToolset', () => {
  let toolset;
  let mockRealtimeChat;
  
  beforeEach(() => {
    mockRealtimeChat = {
      workspace: null,
      appendToChat: () => {}
    };
    toolset = new VoiceToolset(mockRealtimeChat);
  });
  
  describe('read_file_voice', () => {
    it('should read file start section', async () => {
      const result = await toolset.execute('read_file_voice', {
        path: 'test/fixtures/sample.js',
        section: 'start',
        lines: 10
      });
      
      expect(result.success).to.be.true;
      expect(result.metadata.shownLines).to.deep.equal([1, 10]);
      expect(result.voiceResponse).to.include('sample.js');
    });
    
    it('should handle conversational file references', async () => {
      // First read
      await toolset.execute('read_file_voice', {
        path: 'test/fixtures/sample.js',
        section: 'start'
      });
      
      // Reference "that file"
      const result = await toolset.execute('read_file_voice', {
        path: 'that',
        section: 'end'
      });
      
      expect(result.path).to.include('sample.js');
    });
  });
  
  describe('edit_file_voice', () => {
    it('should edit file with exact match', async () => {
      const testFile = 'test/fixtures/editable.js';
      
      const result = await toolset.execute('edit_file_voice', {
        path: testFile,
        old_text: 'function hello()',
        new_text: 'async function hello()',
        fuzzy_match: false
      });
      
      expect(result.success).to.be.true;
      
      // Verify change
      const content = await lively.files.loadFile(testFile);
      expect(content).to.include('async function hello()');
    });
    
    it('should handle fuzzy matching', async () => {
      const testFile = 'test/fixtures/editable.js';
      
      const result = await toolset.execute('edit_file_voice', {
        path: testFile,
        old_text: 'FUNCTION   HELLO  (  )', // Messy voice dictation
        new_text: 'async function hello()',
        fuzzy_match: true
      });
      
      expect(result.success).to.be.true;
    });
  });
  
  describe('find_files_voice', () => {
    it('should find files by natural language query', async () => {
      const result = await toolset.execute('find_files_voice', {
        query: 'realtime chat'
      });
      
      expect(result.success).to.be.true;
      expect(result.results.length).to.be.greaterThan(0);
      expect(result.results[0]).to.include('realtime');
    });
  });
});

describe('FileContext', () => {
  let context;
  
  beforeEach(() => {
    context = new FileContext();
  });
  
  it('should resolve "this" to working file', () => {
    context.setWorkingFile('src/components/test.js');
    
    expect(context.resolveFileReference('this')).to.equal('src/components/test.js');
    expect(context.resolveFileReference('current')).to.equal('src/components/test.js');
  });
  
  it('should resolve "that" to last recent file', () => {
    context.addToRecent('file1.js', 'read');
    context.addToRecent('file2.js', 'read');
    
    expect(context.resolveFileReference('that')).to.equal('file2.js');
    expect(context.resolveFileReference('last')).to.equal('file2.js');
  });
  
  it('should match file by name fragment', () => {
    context.addToRecent('src/ai-workspace/components/openai-realtime-chat.js', 'read');
    
    expect(context.resolveFileReference('realtime')).to.include('realtime-chat.js');
    expect(context.resolveFileReference('openai')).to.include('openai-realtime-chat.js');
  });
  
  it('should track file operations', () => {
    context.addToRecent('file1.js', 'read');
    context.addToRecent('file2.js', 'edit');
    context.addToRecent('file3.js', 'create');
    
    const recent = context.getRecentFiles(10);
    
    expect(recent).to.have.length(3);
    expect(recent[0].path).to.equal('file3.js');
    expect(recent[0].operation).to.equal('create');
  });
});
```

---

## Summary

These code examples demonstrate:

1. **VoiceToolset Class** - Complete implementation with all core tools
2. **FileContext Class** - Context management and reference resolution
3. **Integration** - How voice tools integrate with OpenAI Realtime Chat
4. **Tool Renderers** - Visual output rendering
5. **Test Cases** - Comprehensive test coverage
6. **Usage Examples** - Real-world voice interaction scenarios

The implementation provides a foundation for natural, conversational file operations optimized for voice interaction while maintaining safety, context awareness, and visual feedback.
