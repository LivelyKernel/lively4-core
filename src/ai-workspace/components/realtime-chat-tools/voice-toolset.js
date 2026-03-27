/*MD
# VoiceToolset

Voice-optimized file operations for the AI Workspace voice agent (Vox).
Provides direct file reading with conversational interface and context awareness.

Phase 1 Implementation: read_file_voice only
Future phases will add editing, searching, and management tools.

MD*/

import { FileContext } from './voice-file-context.js';

export class VoiceToolset {
  constructor(realtimeChat) {
    if (!realtimeChat) {
      throw new Error("VoiceToolset requires a realtimeChat reference");
    }
    
    this.realtimeChat = realtimeChat;
    this.fileContext = new FileContext();
    this.cache = new Map(); // Simple in-memory cache for file contents
    
    this.tools = {
      read_file_voice: {
        definition: {
          type: "function",
          name: "read_file_voice",
          description: "Read a file with voice-optimized output. Supports conversational file references like 'that file' or 'this one'. Shows syntax-highlighted code with metadata. Use this for quick file inspection during voice conversations.",
          parameters: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "File path (absolute or relative) or conversational reference ('this', 'that', 'last', 'current', or file name fragment like 'realtime')"
              },
              section: {
                type: "string",
                description: "Which section to show: 'start' (default), 'end', or 'around'",
                enum: ["start", "end", "around"]
              },
              lines: {
                type: "number",
                description: "How many lines to show (default: 30 for voice-friendly output)"
              },
              line_number: {
                type: "number",
                description: "Specific line number when section is 'around'. Shows context around this line."
              }
            },
            required: ["path"]
          }
        },
        execute: async (args) => this.execute_read_file_voice(args)
      },
      
      list_recent_files: {
        definition: {
          type: "function",
          name: "list_recent_files",
          description: "Show files recently read or edited in this conversation. Useful for remembering context and referring back to files.",
          parameters: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of files to show (default: 10)"
              }
            }
          }
        },
        execute: async (args) => this.execute_list_recent_files(args)
      }
    };
  }
  
  /**
   * Get tool definitions for OpenAI Realtime API
   */
  getDefinitions() {
    return Object.values(this.tools).map(tool => tool.definition);
  }
  
  /**
   * Execute a tool by name
   */
  async execute(toolName, args) {
    const tool = this.tools[toolName];
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    
    // Update file context before executing
    this.fileContext.beforeToolExecution(toolName, args);
    
    try {
      const result = await tool.execute.call(this, args);
      
      // Update file context after executing
      this.fileContext.afterToolExecution(toolName, args, result);
      
      return result;
    } catch (error) {
      console.error(`[VoiceToolset] Error executing ${toolName}:`, error);
      return {
        success: false,
        error: error.message,
        voiceResponse: `Sorry, I couldn't ${toolName.replace('_', ' ')}. ${error.message}`
      };
    }
  }
  
  /**
   * Execute read_file_voice tool
   */
  async execute_read_file_voice(args) {
    const { 
      path, 
      section = 'start', 
      lines = 30, 
      line_number 
    } = args;
    
    try {
      // Resolve path (already done by beforeToolExecution, but args.path is now resolved)
      const resolvedPath = path;
      
      // Check if path looks valid (absolute or relative)
      if (!resolvedPath) {
        return {
          success: false,
          error: "No file specified",
          voiceResponse: "I couldn't find which file you're referring to. Could you specify the file path?"
        };
      }
      
      // Load file content
      const content = await lively.files.loadFile(resolvedPath);
      const allLines = content.split('\n');
      const totalLines = allLines.length;
      
      // Determine which lines to show
      const { startLine, endLine, shownContent } = this.extractSection(
        allLines, 
        section, 
        lines, 
        line_number
      );
      
      // Get file metadata
      const fileName = lively.files.name(resolvedPath);
      const fileExt = lively.files.extension(fileName);
      const size = (content.length / 1024).toFixed(1) + ' KB';
      
      // Create voice-friendly response
      let voiceResponse = `Here's ${fileName}. `;
      if (totalLines > lines) {
        voiceResponse += `It's ${totalLines} lines total. `;
        if (section === 'start') {
          voiceResponse += `Showing the first ${endLine - startLine + 1} lines.`;
        } else if (section === 'end') {
          voiceResponse += `Showing the last ${endLine - startLine + 1} lines.`;
        } else if (section === 'around' && line_number) {
          voiceResponse += `Showing lines around line ${line_number}.`;
        }
      } else {
        voiceResponse += `It's ${totalLines} lines.`;
      }
      
      return {
        success: true,
        tool: 'read_file_voice',
        path: resolvedPath,
        content: shownContent,
        metadata: {
          fileName,
          fileExt,
          size,
          totalLines,
          shownLines: [startLine, endLine],
          truncated: totalLines > lines
        },
        voiceResponse,
        visualRenderer: 'opencode-read-tool' // Reuse existing renderer
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error.message}`,
        voiceResponse: `Sorry, I couldn't read ${lively.files.name(path)}. ${error.message}`
      };
    }
  }
  
  /**
   * Extract section of lines from file
   */
  extractSection(allLines, section, lines, line_number) {
    const totalLines = allLines.length;
    let startLine, endLine;
    
    if (section === 'start') {
      startLine = 0;
      endLine = Math.min(lines - 1, totalLines - 1);
    } else if (section === 'end') {
      startLine = Math.max(0, totalLines - lines);
      endLine = totalLines - 1;
    } else if (section === 'around' && line_number) {
      // Show context around specific line
      const halfLines = Math.floor(lines / 2);
      startLine = Math.max(0, line_number - halfLines - 1); // -1 because line_number is 1-indexed
      endLine = Math.min(totalLines - 1, startLine + lines - 1);
    } else {
      // Default to start
      startLine = 0;
      endLine = Math.min(lines - 1, totalLines - 1);
    }
    
    const shownLines = allLines.slice(startLine, endLine + 1);
    
    // Add line numbers (1-indexed for display)
    const shownContent = shownLines
      .map((line, idx) => `${startLine + idx + 1}: ${line}`)
      .join('\n');
    
    return {
      startLine: startLine + 1, // Return 1-indexed for display
      endLine: endLine + 1,
      shownContent
    };
  }
  
  /**
   * Execute list_recent_files tool
   */
  async execute_list_recent_files(args) {
    const { limit = 10 } = args;
    
    const recentFiles = this.fileContext.getRecentFiles(limit);
    
    if (recentFiles.length === 0) {
      return {
        success: true,
        tool: 'list_recent_files',
        files: [],
        voiceResponse: "We haven't looked at any files yet in this conversation."
      };
    }
    
    // Format file list
    const fileList = recentFiles.map((f, idx) => {
      const fileName = lively.files.name(f.path);
      const timeSince = this.getTimeSince(f.timestamp);
      const icon = f.operation === 'edit' ? '✏️' : f.operation === 'read' ? '👁️' : '📄';
      return `${idx + 1}. ${icon} ${fileName} (${f.operation}, ${timeSince} ago)`;
    }).join('\n');
    
    const voiceResponse = recentFiles.length === 1
      ? `We've looked at one file: ${lively.files.name(recentFiles[0].path)}`
      : `We've looked at ${recentFiles.length} files recently. The most recent is ${lively.files.name(recentFiles[0].path)}.`;
    
    return {
      success: true,
      tool: 'list_recent_files',
      files: recentFiles,
      fileList,
      voiceResponse
    };
  }
  
  /**
   * Get human-readable time since timestamp
   */
  getTimeSince(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }
  
  /**
   * Clear context (useful for testing)
   */
  clearContext() {
    this.fileContext.clear();
    this.cache.clear();
  }
}
