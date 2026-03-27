/*MD
# FileContext

Manages conversational file context for voice interactions.
Tracks working file, recent files, and resolves conversational references like "that file".

MD*/

export class FileContext {
  constructor() {
    this.workingFile = null; // Current working file
    this.recentFiles = []; // Array of {path, operation, timestamp}
    this.maxRecentFiles = 20;
  }
  
  /**
   * Set the current working file
   */
  setWorkingFile(path) {
    this.workingFile = path;
    // Don't add to recent here - that's done by the caller with the actual operation type
  }
  
  /**
   * Add file to recent history
   */
  addToRecent(path, operation) {
    // Remove existing entry for this path to avoid duplicates
    this.recentFiles = this.recentFiles.filter(f => f.path !== path);
    
    // Add to front
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
  
  /**
   * Resolve conversational file references to actual paths
   * Examples:
   *   'this', 'current', 'working' -> working file
   *   'that', 'last', 'previous' -> most recent file
   *   'realtime' -> fuzzy match to recent file containing 'realtime'
   */
  resolveFileReference(ref) {
    if (!ref) return null;
    
    const refLower = ref.toLowerCase();
    
    // Handle explicit working file references
    if (refLower === 'this' || refLower === 'current' || refLower === 'working') {
      return this.workingFile;
    }
    
    // Handle recent file references
    if (refLower === 'that' || refLower === 'previous' || refLower === 'last') {
      return this.recentFiles[0]?.path;
    }
    
    // Try to match recent file by name fragment
    const match = this.recentFiles.find(f => 
      f.path.toLowerCase().includes(refLower)
    );
    
    if (match) {
      return match.path;
    }
    
    // Fall back to literal path (could be absolute or relative)
    return ref;
  }
  
  /**
   * Get recent files list
   */
  getRecentFiles(limit = 10) {
    return this.recentFiles.slice(0, limit);
  }
  
  /**
   * Clear context (useful for testing or reset)
   */
  clear() {
    this.workingFile = null;
    this.recentFiles = [];
  }
  
  /**
   * Update context before tool execution
   * Resolves file references in arguments
   */
  beforeToolExecution(toolName, args) {
    if (args.path) {
      const resolvedPath = this.resolveFileReference(args.path);
      if (resolvedPath) {
        args.path = resolvedPath;
      }
    }
  }
  
  /**
   * Update context after tool execution
   * Tracks file operations and updates working file
   */
  afterToolExecution(toolName, args, result) {
    if (result.success && args.path) {
      const operation = this.getOperationFromToolName(toolName);
      this.addToRecent(args.path, operation);
      
      // Update working file for certain operations
      if (['read_file_voice', 'edit_file_voice'].includes(toolName)) {
        this.setWorkingFile(args.path);
      }
    }
  }
  
  /**
   * Map tool names to operation types
   */
  getOperationFromToolName(toolName) {
    const map = {
      read_file_voice: 'read',
      edit_file_voice: 'edit',
      create_file_voice: 'create',
      delete_file_voice: 'delete',
      append_to_file: 'edit',
      find_files_voice: 'search',
      search_in_files: 'search'
    };
    return map[toolName] || 'unknown';
  }
}
