import Terminal from 'src/client/terminal.js';
import moment from 'src/external/moment.js';

/*
 * Claude Sessions API
 * Shared utilities for loading and analyzing Claude Code session files
 * Used by lively-claude-statistics and lively-claude-session components
 */

export default class ClaudeSessionsAPI {
  
  static _terminal = null;
  
  // Get shared terminal instance
  static getTerminal() {
    if (!this._terminal) {
      this._terminal = new Terminal({
        url: lively4url,
        cwd: "/lively4-core"
      });
    }
    return this._terminal;
  }
  
  // Session Discovery Methods
  
  /**
   * Discover Claude session files in ~/.claude/projects
   * @param {string} projectName - Optional project name to filter by
   * @returns {Array} Array of session file objects with metadata
   */
  static async discoverSessions(projectName = null) {
    const terminal = this.getTerminal();
    
    // Build find command based on project filter
    let command;
    
    if (projectName && projectName.trim() !== '') {
      // Filter to specific project - show all .jsonl files in that project
      command = `find ~/.claude/projects/${projectName} -type f -name '*.jsonl' -printf '%TY-%Tm-%TdT%TH:%TM:%TS\t%s\t%p\n' | sort -r`;
    } else {
      // Show all projects - original pattern for lively4-core compatibility
      command = `find ~/.claude/projects -type f -name '*.jsonl' -path '*-lively4-core/*' -printf '%TY-%Tm-%TdT%TH:%TM:%TS\t%s\t%p\n' | sort -r`;
    }
    
    const result = await terminal.run(command);
    
    if (result.error) {
      throw new Error(result.stderr || result.error.message);
    }
    
    const sessionFiles = result.stdout.trim().split('\n').filter(line => line.trim()).map(ea => {
      var parts = ea.split("\t");
      const path = parts[2];
      const fileName = path.split('/').pop();
      const sessionId = fileName.replace('.jsonl', '');
      
      return {
        modified: parts[0], 
        sizeBytes: parseInt(parts[1]) || 0, 
        path: path,
        sessionId: sessionId
      };
    });
    
    return sessionFiles;
  }
  
  /**
   * Load and parse content of a JSONL session file
   * @param {string} sessionPath - Path to the session file
   * @returns {Array} Array of parsed message objects
   */
  static async loadSessionContent(sessionPath) {
    const terminal = this.getTerminal();
    
    // Read the JSONL file content
    const command = `cat "${sessionPath}"`;
    const result = await terminal.run(command);
    
    if (result.error) {
      throw new Error(result.stderr || result.error.message);
    }
    
    // Parse JSONL content (each line is a separate JSON object)
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());
    const messages = [];
    
    for (let i = 0; i < lines.length; i++) {
      try {
        const message = JSON.parse(lines[i]);
        messages.push(message);
      } catch (parseError) {
        console.warn(`Failed to parse line ${i + 1}:`, parseError, lines[i]);
      }
    }
    
    return messages;
  }
  
  // Cost Calculation & Token Analysis Methods
  
  // Claude Sonnet 4 Pricing (per million tokens)
  static PRICING = {
    baseInput: 3.00,      // $3 / MTok
    cacheWrite5m: 3.75,   // $3.75 / MTok (5 minute cache writes)
    cacheWrite1h: 6.00,   // $6 / MTok (1 hour cache writes)  
    cacheHit: 0.30,       // $0.30 / MTok (cache hits & refreshes)
    output: 15.00         // $15 / MTok
  };

  /**
   * Calculate actual dollar cost for token usage
   * @param {Object} usage - Token usage object with input/output/cache tokens
   * @returns {Object} Cost breakdown in dollars
   */
  static calculateDollarCost(usage) {
    const input = usage.input_tokens || 0;
    const output = usage.output_tokens || 0;
    const cacheRead = usage.cache_read_input_tokens || 0;
    const cacheWrite = usage.cache_creation_input_tokens || 0;
    
    // Convert tokens to millions for pricing calculation
    const inputCost = (input / 1000000) * this.PRICING.baseInput;
    const outputCost = (output / 1000000) * this.PRICING.output;
    const cacheReadCost = (cacheRead / 1000000) * this.PRICING.cacheHit;
    // Assume cache writes are 5m cache writes (more common case)
    const cacheWriteCost = (cacheWrite / 1000000) * this.PRICING.cacheWrite5m;
    
    const totalCost = inputCost + outputCost + cacheReadCost + cacheWriteCost;
    
    return {
      inputCost,
      outputCost,
      cacheReadCost,
      cacheWriteCost,
      totalCost
    };
  }

  /**
   * Calculate estimated cost for a token usage object
   * Based on research: cache reads ~0.1x, cache creation ~1.25x, regular input 1x, output ~3x
   * @param {Object} usage - Token usage object with input/output/cache tokens
   * @returns {number} Estimated relative cost
   */
  static calculateEstimatedCost(usage) {
    const inputCost = (usage.input_tokens || 0) * 1.0;
    const cacheReadCost = (usage.cache_read_input_tokens || 0) * 0.1;
    const cacheCreationCost = (usage.cache_creation_input_tokens || 0) * 1.25;
    const outputCost = (usage.output_tokens || 0) * 3.0;
    
    return inputCost + cacheReadCost + cacheCreationCost + outputCost;
  }
  
  /**
   * Calculate comprehensive token statistics for a collection of messages
   * @param {Array} messages - Array of session message objects
   * @returns {Object} Token statistics including totals, averages, and estimated costs
   */
  static calculateTokenStatistics(messages) {
    let totalInput = 0;
    let totalOutput = 0;
    let totalCacheRead = 0;
    let totalCacheCreation = 0;
    let messagesWithTokens = 0;
    let totalEstimatedCost = 0;
    let totalDollarCost = 0;

    messages.forEach(sessionEntry => {
      const message = sessionEntry.message || sessionEntry;
      if (message.usage) {
        const input = message.usage.input_tokens || 0;
        const output = message.usage.output_tokens || 0;
        const cacheRead = message.usage.cache_read_input_tokens || 0;
        const cacheCreation = message.usage.cache_creation_input_tokens || 0;
        
        totalInput += input;
        totalOutput += output;
        totalCacheRead += cacheRead;
        totalCacheCreation += cacheCreation;
        messagesWithTokens++;
        
        // Calculate estimated relative cost
        const messageCost = this.calculateEstimatedCost({
          input_tokens: input,
          output_tokens: output,
          cache_read_input_tokens: cacheRead,
          cache_creation_input_tokens: cacheCreation
        });
        totalEstimatedCost += messageCost;
        
        // Calculate actual dollar cost
        const dollarCosts = this.calculateDollarCost({
          input_tokens: input,
          output_tokens: output,
          cache_read_input_tokens: cacheRead,
          cache_creation_input_tokens: cacheCreation
        });
        totalDollarCost += dollarCosts.totalCost;
      }
    });

    const avgInput = messagesWithTokens > 0 ? Math.round(totalInput / messagesWithTokens) : 0;
    const avgOutput = messagesWithTokens > 0 ? Math.round(totalOutput / messagesWithTokens) : 0;
    const avgCost = messagesWithTokens > 0 ? Math.round(totalEstimatedCost / messagesWithTokens) : 0;
    const avgDollarCost = messagesWithTokens > 0 ? totalDollarCost / messagesWithTokens : 0;
    const totalRegular = totalInput + totalOutput;
    const totalCache = totalCacheRead + totalCacheCreation;

    return {
      totalInput,
      totalOutput,
      totalCacheRead,
      totalCacheCreation,
      totalRegular,
      totalCache,
      totalEstimatedCost,
      totalDollarCost,
      avgInput,
      avgOutput,
      avgCost,
      avgDollarCost,
      messagesWithTokens
    };
  }
  
  /**
   * Process raw session data into comprehensive analysis object
   * @param {Object} sessionFile - Session file metadata
   * @param {Array} messages - Array of parsed messages
   * @returns {Object} Processed session data with statistics and progression
   */
  static processSessionData(sessionFile, messages) {
    const costProgression = [];
    let totalCost = 0;
    
    // Find date range
    const timestamps = messages
      .map(m => m.timestamp)
      .filter(t => t)
      .sort();
    
    const dateRange = {
      start: timestamps.length > 0 ? moment(timestamps[0]).toDate() : null,
      end: timestamps.length > 0 ? moment(timestamps[timestamps.length - 1]).toDate() : null
    };
    
    // Calculate thinking time first and store per message
    const messageThinkingTimes = new Map(); // actualIndex -> thinking time in ms
    
    for (let i = 1; i < messages.length; i++) {
      const currentMsg = messages[i];
      const prevMsg = messages[i - 1];
      
      if (currentMsg.timestamp && prevMsg.timestamp && currentMsg.message?.usage) {
        const prevRole = prevMsg.message?.role || prevMsg.role;
        const currentRole = currentMsg.message?.role || currentMsg.role;
        
        if (prevRole === 'user' && currentRole === 'assistant') {
          const thinkingDuration = moment(currentMsg.timestamp).diff(moment(prevMsg.timestamp));
          if (thinkingDuration > 0 && thinkingDuration < 300000) {
            messageThinkingTimes.set(i, thinkingDuration);
          }
        }
      }
    }
    
    // Process each message for visualization (including user messages for pattern)
    messages.forEach((sessionEntry, index) => {
      const message = sessionEntry.message || sessionEntry;
      const isUserMessage = (sessionEntry.type === 'user' && !sessionEntry.toolUseResult);
      
      if (message.usage) {
        // Assistant message with token usage
        const usage = message.usage;
        const messageCost = this.calculateEstimatedCost(usage);
        
        const costBreakdown = {
          inputCost: (usage.input_tokens || 0) * 1.0,
          outputCost: (usage.output_tokens || 0) * 3.0,
          cacheReadCost: (usage.cache_read_input_tokens || 0) * 0.1,
          cacheWriteCost: (usage.cache_creation_input_tokens || 0) * 1.25
        };
        
        costProgression.push({
          messageIndex: index + 1, // Use actual JSONL line number (1-based)
          originalIndex: index,
          uuid: sessionEntry.uuid,
          timestamp: sessionEntry.timestamp ? moment(sessionEntry.timestamp).toDate() : null,
          totalCost: messageCost,
          costBreakdown: costBreakdown,
          thinkingTime: messageThinkingTimes.get(index) || 0,
          isUserMessage: false, // This is an assistant message
          sessionEntry: sessionEntry,
          tokens: {
            input: usage.input_tokens || 0,
            output: usage.output_tokens || 0,
            cacheRead: usage.cache_read_input_tokens || 0,
            cacheWrite: usage.cache_creation_input_tokens || 0
          }
        });
        
        totalCost += messageCost;
      } else if (isUserMessage) {
        // User message - add as empty box for pattern visualization
        costProgression.push({
          messageIndex: index + 1, // Use actual JSONL line number (1-based)
          originalIndex: index,
          uuid: sessionEntry.uuid,
          timestamp: sessionEntry.timestamp ? moment(sessionEntry.timestamp).toDate() : null,
          totalCost: 0,
          costBreakdown: {
            inputCost: 0,
            outputCost: 0,
            cacheReadCost: 0,
            cacheWriteCost: 0
          },
          thinkingTime: 0,
          isUserMessage: true, // Mark as user message for special rendering
          sessionEntry: sessionEntry,
          tokens: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0
          }
        });
      }
    });
    
    // Filter assistant messages for statistics (exclude user messages)
    const assistantMessages = costProgression.filter(msg => !msg.isUserMessage);
    
    // Calculate total thinking time from stored per-message data (assistant only)
    const totalThinkingTime = assistantMessages.reduce((sum, msg) => sum + (msg.thinkingTime || 0), 0);
    const thinkingTimeCount = assistantMessages.filter(msg => msg.thinkingTime > 0).length;
    const avgThinkingTime = thinkingTimeCount > 0 ? totalThinkingTime / thinkingTimeCount : 0;
    
    // Calculate escalation ratio (assistant messages only)
    const firstQuarter = assistantMessages.slice(0, Math.max(1, Math.ceil(assistantMessages.length / 4)));
    const lastQuarter = assistantMessages.slice(-Math.max(1, Math.ceil(assistantMessages.length / 4)));
    
    const avgEarly = firstQuarter.length > 0 ? firstQuarter.reduce((sum, m) => sum + m.totalCost, 0) / firstQuarter.length : 0;
    const avgLate = lastQuarter.length > 0 ? lastQuarter.reduce((sum, m) => sum + m.totalCost, 0) / lastQuarter.length : 0;
    const escalationRatio = avgEarly > 0 ? avgLate / avgEarly : 1;
    
    return {
      sessionId: sessionFile.sessionId,
      filePath: sessionFile.path,
      modificationTime: sessionFile.modified, // File modification timestamp
      dateRange: dateRange,
      messageCount: messages.length,
      messagesWithTokens: assistantMessages.length, // Only count assistant messages with tokens
      totalCost: totalCost,
      avgCost: assistantMessages.length > 0 ? totalCost / assistantMessages.length : 0, // Average based on assistant messages only
      escalationRatio: escalationRatio,
      totalThinkingTime: totalThinkingTime, // Total AI thinking time in milliseconds
      avgThinkingTime: avgThinkingTime, // Average AI thinking time in milliseconds
      thinkingTimeCount: thinkingTimeCount, // Number of AI responses measured
      costProgression: costProgression, // Includes both user and assistant messages for visualization
      sizeBytes: sessionFile.sizeBytes
    };
  }
  
  // Utility Methods
  
  /**
   * Format numbers for display (e.g., 15000 -> "15k")
   * @param {number} num - Number to format
   * @returns {string} Formatted number string
   */
  static formatNumber(num) {
    if (num >= 10000) {
      return Math.round(num / 1000) + 'k';
    }
    return Math.round(num).toString();
  }
  
  /**
   * Format dollar amount for display
   * @param {number} amount - Dollar amount
   * @returns {string} Formatted dollar string
   */
  static formatDollarAmount(amount) {
    if (amount >= 1) {
      return `$${amount.toFixed(2)}`;
    } else if (amount >= 0.01) {
      return `$${amount.toFixed(3)}`;
    } else if (amount >= 0.001) {
      return `$${amount.toFixed(4)}`;
    } else if (amount > 0) {
      return `$${(amount * 1000).toFixed(2)}m`; // Show as millidollars for very small amounts
    } else {
      return '$0.00';
    }
  }
  
  /**
   * Format file size in bytes to human readable KB
   * @param {number} sizeBytes - File size in bytes
   * @returns {string} Formatted size string
   */
  static formatFileSize(sizeBytes) {
    const sizeKB = Math.round(sizeBytes / 1024);
    return `${sizeKB} KB`;
  }
  
  /**
   * Format duration in milliseconds to human readable string
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} Formatted duration string
   */
  static formatDuration(milliseconds) {
    if (milliseconds < 1000) {
      return `${Math.round(milliseconds)}ms`;
    }
    const seconds = milliseconds / 1000;
    if (seconds < 60) {
      return `${Math.round(seconds * 10) / 10}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  /**
   * Extract session ID from file path
   * @param {string} path - File path
   * @returns {string} Session ID
   */
  static extractSessionId(path) {
    const fileName = path.split('/').pop();
    return fileName.replace('.jsonl', '');
  }
  
  /**
   * Load project list from ~/.claude/projects
   * @returns {Array} Array of project objects with name and path
   */
  static async loadProjects() {
    try {
      const terminal = this.getTerminal();
      
      // Discover all project directories under ~/.claude/projects
      const command = `find ~/.claude/projects -maxdepth 1 -type d -not -path ~/.claude/projects | sort`;
      const result = await terminal.run(command);
      
      if (result.error) {
        console.warn('Failed to load projects:', result.stderr || result.error.message);
        return [];
      }
      
      const projectPaths = result.stdout.trim().split('\n').filter(line => line.trim());
      return projectPaths.map(path => {
        const dirName = path.split('/').pop();
        return {
          name: dirName,
          path: path
        };
      });
      
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }
}