import Terminal from 'src/client/terminal.js';
import moment from 'src/external/moment.js';

/*
 * Claude Sessions API
 * Shared utilities for loading and analyzing Claude Code session files
 * Used by lively-claude-statistics and lively-claude-session components
 */



export class ClaudeMessage {
  constructor(rawMessage) {
    this.raw = rawMessage;
    this.uuid = rawMessage.uuid;
    this.parentUuid = rawMessage.parentUuid;
    this.sessionId = rawMessage.sessionId;
    this.timestamp = rawMessage.timestamp ? new Date(rawMessage.timestamp) : null;
    this.type = rawMessage.type;
    this.message = rawMessage.message;
    
    // Track which sessions this message appears in
    this.sessions = new Set([rawMessage.sessionId]);
    this.sessionData = new Map(); // sessionId -> session metadata
    
    if (rawMessage.sessionId) {
      this.sessionData.set(rawMessage.sessionId, {
        sessionId: rawMessage.sessionId,
        timestamp: this.timestamp,
        raw: rawMessage
      });
    }
  }

  /**
   * Add this message to another session (for cross-session deduplication)
   */
  addToSession(sessionId, sessionMetadata = {}) {
    this.sessions.add(sessionId);
    this.sessionData.set(sessionId, {
      sessionId,
      timestamp: sessionMetadata.timestamp ? new Date(sessionMetadata.timestamp) : this.timestamp,
      raw: sessionMetadata.raw || this.raw,
      ...sessionMetadata
    });
  }

  /**
   * Get all session IDs this message appears in
   */
  getSessionIds() {
    return Array.from(this.sessions);
  }

  /**
   * Check if this message appears in a specific session
   */
  appearsInSession(sessionId) {
    return this.sessions.has(sessionId);
  }

  /**
   * Get metadata for a specific session
   */
  getSessionData(sessionId) {
    return this.sessionData.get(sessionId);
  }

  /**
   * Get the count of sessions this message appears in
   */
  get sessionCount() {
    return this.sessions.size;
  }

  /**
   * Get the role of this message (user, assistant)
   */
  get role() {
    return this.message?.role || this.type;
  }

  /**
   * Get the content of this message
   */
  get content() {
    return this.message?.content;
  }

  /**
   * Check if this is a sidechain message
   */
  get isSidechain() {
    return this.raw.isSidechain || false;
  }

  /**
   * Get text content from message content array
   */
  getTextContent() {
    if (!this.content) return '';
    
    if (Array.isArray(this.content)) {
      const textContent = this.content.find(c => c.type === 'text');
      return textContent?.text || '';
    }
    
    if (typeof this.content === 'string') {
      return this.content;
    }
    
    return '';
  }
}

export class ClaudeUserMessage extends ClaudeMessage {
  constructor(rawMessage) {
    super(rawMessage);
  }

  /**
   * Check if this user message is a tool response
   */
  get isToolResponse() {
    return this.raw.toolUseResult !== undefined;
  }

  /**
   * Get tool response data if this is a tool response
   */
  get toolUseResult() {
    return this.raw.toolUseResult;
  }

  /**
   * Get tool use ID if this is a tool response
   */
  getToolUseId() {
    if (!this.content || !Array.isArray(this.content)) return null;
    
    const toolResult = this.content.find(c => c.type === 'tool_result');
    return toolResult?.tool_use_id || null;
  }
}

export class ClaudeAgentMessage extends ClaudeMessage {
  constructor(rawMessage) {
    super(rawMessage);
    this.usage = rawMessage.message?.usage;
    this.requestId = rawMessage.requestId;
  }

  /**
   * Get token usage information
   */
  getUsage() {
    return this.usage;
  }

  /**
   * Get all tool calls from this message
   */
  getToolCalls() {
    if (!this.content || !Array.isArray(this.content)) return [];
    
    return this.content.filter(c => c.type === 'tool_use').map(toolUse => ({
      id: toolUse.id,
      name: toolUse.name,
      input: toolUse.input
    }));
  }

  /**
   * Check if this message contains tool calls
   */
  get hasToolCalls() {
    return this.getToolCalls().length > 0;
  }

  /**
   * Check if this message has only tool calls (no text content)
   */
  get isOnlyToolCalls() {
    if (!this.content || !Array.isArray(this.content)) return false;
    return this.content.every(c => c.type === 'tool_use');
  }
}

export class ClaudeToolCall extends ClaudeAgentMessage {
  constructor(rawMessage, toolCallData) {
    super(rawMessage);
    this.toolCallData = toolCallData;
  }

  get toolName() {
    return this.toolCallData.name;
  }

  get toolId() {
    return this.toolCallData.id;
  }

  get toolInput() {
    return this.toolCallData.input;
  }
}

export class ClaudeToolResponse extends ClaudeUserMessage {
  constructor(rawMessage) {
    super(rawMessage);
  }

  /**
   * Get the tool use ID this response corresponds to
   */
  get toolUseId() {
    return this.getToolUseId();
  }

  /**
   * Get the result content from tool response
   */
  getResultContent() {
    if (!this.content || !Array.isArray(this.content)) return '';
    
    const toolResult = this.content.find(c => c.type === 'tool_result');
    return toolResult?.content || '';
  }
}

export class ClaudeConversation {
  constructor(sessionId = null) {
    this.sessionId = sessionId;
    this.messages = [];
    this.messageMap = new Map(); // uuid -> message
  }

  /**
   * Add a message to the conversation, handling deduplication across sessions
   */
  addMessage(message) {
    if (message.uuid && this.messageMap.has(message.uuid)) {
      // Message already exists, add session info to existing message
      const existingMessage = this.messageMap.get(message.uuid);
      existingMessage.addToSession(message.sessionId, {
        timestamp: message.timestamp,
        raw: message.raw
      });
    } else {
      // New message
      this.messages.push(message);
      if (message.uuid) {
        this.messageMap.set(message.uuid, message);
      }
    }
  }

  /**
   * Get message by UUID
   */
  getMessage(uuid) {
    return this.messageMap.get(uuid);
  }

  /**
   * Get all messages of a specific type
   */
  getMessagesByType(type) {
    return this.messages.filter(msg => msg.type === type);
  }

  /**
   * Get all user messages
   */
  getUserMessages() {
    return this.messages.filter(msg => msg instanceof ClaudeUserMessage);
  }

  /**
   * Get all agent messages
   */
  getAgentMessages() {
    return this.messages.filter(msg => msg instanceof ClaudeAgentMessage);
  }

  /**
   * Get conversation thread starting from a message UUID
   */
  getThread(startUuid) {
    const thread = [];
    let current = this.getMessage(startUuid);
    
    while (current) {
      thread.unshift(current);
      current = current.parentUuid ? this.getMessage(current.parentUuid) : null;
    }
    
    return thread;
  }

  /**
   * Parse raw messages into typed message objects
   */
  static parseMessages(rawMessages) {
    return rawMessages.map(raw => ClaudeConversation.parseMessage(raw));
  }

  /**
   * Parse a single raw message into appropriate typed object
   */
  static parseMessage(raw) {
    if (raw.type === 'user') {
      if (raw.toolUseResult !== undefined) {
        return new ClaudeToolResponse(raw);
      }
      return new ClaudeUserMessage(raw);
    } else if (raw.type === 'assistant') {
      return new ClaudeAgentMessage(raw);
    }
    
    // Fallback to base message
    return new ClaudeMessage(raw);
  }

  /**
   * Create conversation from raw session messages
   */
  static fromRawMessages(rawMessages, sessionId = null) {
    const conversation = new ClaudeConversation(sessionId);
    const parsedMessages = ClaudeConversation.parseMessages(rawMessages);
    
    parsedMessages.forEach(message => {
      conversation.addMessage(message);
    });
    
    return conversation;
  }

  /**
   * Create conversation from multiple sessions with automatic deduplication
   */
  static fromMultipleSessions(sessionDataArray, conversationId = null) {
    const conversation = new ClaudeConversation(conversationId);
    
    // Process each session's messages
    sessionDataArray.forEach(sessionData => {
      const { sessionId, rawMessages } = sessionData;
      const parsedMessages = ClaudeConversation.parseMessages(rawMessages);
      
      parsedMessages.forEach(message => {
        // Ensure message has the correct sessionId from the session data
        message.sessionId = sessionId;
        message.sessions = new Set([sessionId]);
        message.sessionData = new Map([[sessionId, {
          sessionId,
          timestamp: message.timestamp,
          raw: message.raw
        }]]);
        
        conversation.addMessage(message);
      });
    });
    
    return conversation;
  }
}

export default class ClaudeSessions {
  
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
   * Discover conversations by grouping sessions by their initial message UUID
   * @param {string} projectName - Optional project name to filter by
   * @returns {Array} Array of conversation objects with grouped sessions
   */
  static async discoverConversations(projectName = null) {
    const sessionFiles = await this.discoverSessions(projectName);
    
    // Group sessions by conversation (initial message UUID)
    const conversationMap = new Map(); // initialMessageUUID -> conversation data
    
    for (const sessionFile of sessionFiles) {
      try {
        // Load session content to find the initial message
        const messages = await this.loadSessionContent(sessionFile.path);
        
        if (messages.length === 0) continue;
        
        // Find the root message (first message with no parentUuid or first chronologically)
        let rootMessage = messages.find(msg => !msg.parentUuid) || messages[0];
        const initialMessageUUID = rootMessage.uuid;
        
        if (!initialMessageUUID) continue; // Skip sessions without proper UUIDs
        
        // Get or create conversation group
        if (!conversationMap.has(initialMessageUUID)) {
          conversationMap.set(initialMessageUUID, {
            conversationId: initialMessageUUID,
            title: this.extractConversationTitle(rootMessage),
            sessions: [],
            earliestDate: null,
            latestDate: null,
            latestModificationTime: null
          });
        }
        
        const conversation = conversationMap.get(initialMessageUUID);
        conversation.sessions.push(sessionFile);
        
        // Track date ranges
        const modDate = new Date(sessionFile.modified);
        if (!conversation.latestModificationTime || modDate > new Date(conversation.latestModificationTime)) {
          conversation.latestModificationTime = sessionFile.modified;
        }
        
        if (!conversation.earliestDate || modDate < new Date(conversation.earliestDate)) {
          conversation.earliestDate = sessionFile.modified;
        }
        
        if (!conversation.latestDate || modDate > new Date(conversation.latestDate)) {
          conversation.latestDate = sessionFile.modified;
        }
        
      } catch (error) {
        console.warn(`Failed to process session ${sessionFile.path}:`, error);
        continue;
      }
    }
    
    // Convert map to sorted array (by latest modification time, newest first)
    return Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.latestModificationTime).getTime() - new Date(a.latestModificationTime).getTime());
  }

  /**
   * Extract conversation title from the initial message
   * @param {Object} rootMessage - The root/first message of the conversation
   * @returns {string} Conversation title
   */
  static extractConversationTitle(rootMessage) {
    try {
      // Try to get the content from the first user message
      if (rootMessage.message && rootMessage.message.content) {
        const content = rootMessage.message.content;
        
        // Handle array format (typical Claude format)
        if (Array.isArray(content) && content.length > 0 && content[0].text) {
          const text = content[0].text.trim();
          // Take first line or first 80 characters, whichever is shorter
          const firstLine = text.split('\n')[0];
          return firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine;
        }
        
        // Handle string format
        if (typeof content === 'string') {
          const text = content.trim();
          const firstLine = text.split('\n')[0];
          return firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine;
        }
      }
      
      // Fallback to UUID if we can't extract content
      return `Conversation ${rootMessage.uuid ? rootMessage.uuid.substring(0, 8) : 'Unknown'}`;
      
    } catch (error) {
      return `Conversation ${rootMessage.uuid ? rootMessage.uuid.substring(0, 8) : 'Unknown'}`;
    }
  }
  
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
   * Get session files with message counts (line counts)
   * @param {string} projectName - Optional project name to filter by
   * @returns {Array} Array of session file objects with metadata including messageCount
   */
  static async discoverSessionsWithCounts(projectName = null) {
    const terminal = this.getTerminal();
    
    // Build command to get file info and line counts in one go
    let command;
    
    if (projectName && projectName.trim() !== '') {
      // Get file stats and line counts for specific project
      command = `find ~/.claude/projects/${projectName} -type f -name '*.jsonl' -exec sh -c 'echo "$(stat -c "%Y %s" "$1")\t$(wc -l < "$1")\t$1"' _ {} \\; | sort -nr`;
    } else {
      // Get file stats and line counts for lively4-core project
      command = `find ~/.claude/projects -type f -name '*.jsonl' -path '*-lively4-core/*' -exec sh -c 'echo "$(stat -c "%Y %s" "$1")\t$(wc -l < "$1")\t$1"' _ {} \\; | sort -nr`;
    }
    
    const result = await terminal.run(command);
    
    if (result.error) {
      throw new Error(result.stderr || result.error.message);
    }
    
    const sessionFiles = result.stdout.trim().split('\n').filter(line => line.trim()).map(ea => {
      var parts = ea.split("\t");
      const statParts = parts[0].split(' ');
      const modifiedTimestamp = parseInt(statParts[0]);
      const sizeBytes = parseInt(statParts[1]) || 0;
      const messageCount = parseInt(parts[1]) || 0;
      const path = parts[2];
      const fileName = path.split('/').pop();
      const sessionId = fileName.replace('.jsonl', '');
      
      // Convert timestamp to ISO string format
      const modifiedDate = new Date(modifiedTimestamp * 1000).toISOString();
      
      return {
        modified: modifiedDate,
        sizeBytes: sizeBytes,
        messageCount: messageCount,
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
   * Calculate actual dollar cost for token usage based on Claude Sonnet 4 pricing
   * @param {Object} usage - Token usage object with input/output/cache tokens
   * @returns {Object} Dollar cost breakdown
   */
  static calculateDollarCost(usage) {
    // Claude Sonnet 4 Pricing (per million tokens)
    const pricing = {
      baseInput: 3.00,      // $3 / MTok
      cacheWrite5m: 3.75,   // $3.75 / MTok (5 minute cache writes)
      cacheHit: 0.30,       // $0.30 / MTok (cache hits & refreshes)
      output: 15.00         // $15 / MTok
    };
    
    const input = usage.input_tokens || 0;
    const output = usage.output_tokens || 0;
    const cacheRead = usage.cache_read_input_tokens || 0;
    const cacheWrite = usage.cache_creation_input_tokens || 0;
    
    // Convert tokens to millions for pricing calculation
    const inputCost = (input / 1000000) * pricing.baseInput;
    const outputCost = (output / 1000000) * pricing.output;
    const cacheReadCost = (cacheRead / 1000000) * pricing.cacheHit;
    const cacheWriteCost = (cacheWrite / 1000000) * pricing.cacheWrite5m;
    
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
   * Process conversation data by aggregating all sessions in the conversation
   * @param {Object} conversation - Conversation object with sessions array
   * @returns {Object} Processed conversation data with aggregated statistics and timeline
   */
  static async processConversationData(conversation) {
    const allMessages = [];
    const sessionMessageMap = new Map(); // messageUUID -> sessionInfo
    const messageUUIDSet = new Set(); // Track unique messages
    
    // Collect all messages from all sessions in the conversation
    for (const sessionFile of conversation.sessions) {
      try {
        const sessionMessages = await this.loadSessionContent(sessionFile.path);
        
        for (const message of sessionMessages) {
          if (!message.uuid) continue;
          
          // Track session membership for each message
          sessionMessageMap.set(message.uuid, {
            sessionId: sessionFile.sessionId,
            sessionPath: sessionFile.path,
            sessionModified: sessionFile.modified
          });
          
          // Only add message if we haven't seen this UUID before (deduplication)
          if (!messageUUIDSet.has(message.uuid)) {
            messageUUIDSet.add(message.uuid);
            allMessages.push({
              ...message,
              _sessionInfo: sessionMessageMap.get(message.uuid) // Add session attribution
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to load session ${sessionFile.path}:`, error);
        continue;
      }
    }
    
    // Simple linearization: Sort all messages by timestamp
    allMessages.sort((a, b) => {
      const aTime = new Date(a.timestamp || 0);
      const bTime = new Date(b.timestamp || 0);
      return aTime.getTime() - bTime.getTime();
    });
    
    // Process the linearized conversation as if it were a single session
    const conversationData = this.processSessionData(
      {
        sessionId: conversation.conversationId,
        path: `conversation:${conversation.conversationId}`,
        modified: conversation.latestModificationTime
      }, 
      allMessages
    );
    
    // Enhance with conversation-specific data
    return {
      ...conversationData,
      isConversation: true,
      conversationId: conversation.conversationId,
      title: conversation.title,
      sessionCount: conversation.sessions.length,
      sessionIds: conversation.sessions.map(s => s.sessionId),
      sessionPaths: conversation.sessions.map(s => s.path),
      sessions: conversation.sessions, // Include original session data for latest session lookup
      earliestSessionDate: conversation.earliestDate,
      latestSessionDate: conversation.latestDate,
      sessionMessageMap: sessionMessageMap, // For session boundary visualization
      conversationDateRange: {
        start: new Date(conversation.earliestDate),
        end: new Date(conversation.latestDate)
      }
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
          sessionInfo: sessionEntry._sessionInfo, // Session attribution for conversations
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
          sessionInfo: sessionEntry._sessionInfo, // Session attribution for conversations
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

  /**
   * Get list of Claude project names (flattened directory names)
   * @returns {Array} Array of flattened project directory names
   */
  static async getClaudeProjectNames() {
    try {
      const terminal = this.getTerminal();
      
      // List directory names in ~/.claude/projects
      const command = `ls -1 ~/.claude/projects/ 2>/dev/null | grep -v '^\\.$' | grep -v '^\\.\\.$' || echo ""`;
      const result = await terminal.run(command);
      
      if (result.error && !result.stdout.trim()) {
        console.warn('Failed to get Claude project names:', result.stderr || result.error.message);
        return [];
      }
      
      return result.stdout.trim().split('\n').filter(name => name && !name.startsWith('.'));
    } catch (error) {
      console.error('Failed to get Claude project names:', error);
      return [];
    }
  }

  /**
   * Filter file system directories to only those that have Claude projects
   * @param {Array} directories - Array of directory names from file system
   * @param {string} projectRoot - Root path for projects (e.g., "~/lively4" or "/home/jens/lively4")
   * @returns {Array} Filtered array of directory names that have Claude projects
   */
  static async filterDirectoriesWithClaudeProjects(directories, projectRoot = "~/lively4") {
    try {
      const claudeProjects = await this.getClaudeProjectNames();
      
      if (claudeProjects.length === 0) {
        // If no Claude projects found, return all directories as fallback
        return directories;
      }
      
      // Convert tilde path to absolute path if needed
      let absoluteRoot = projectRoot;
      if (projectRoot.startsWith('~/')) {
        // For now, assume /home/jens as default - could be made more dynamic later
        absoluteRoot = projectRoot.replace('~/', '/home/jens/');
      }
      
      // Filter directories that have corresponding Claude projects
      const filteredDirs = directories.filter(dirName => {
        const fullPath = absoluteRoot + "/" + dirName;
        const flattenedPath = this.flattenPath(fullPath);
        return claudeProjects.includes(flattenedPath);
      });
      
      return filteredDirs.sort(); // Return sorted list
    } catch (error) {
      console.error('Failed to filter directories:', error);
      return directories; // Return all directories as fallback
    }
  }

  /**
   * Convert full path to Claude's flattened format
   * @param {string} projectPath - Full project path
   * @returns {string} Flattened path matching Claude's naming convention
   */
  static flattenPath(projectPath) {
    // Convert full path to Claude's flattened format
    // e.g., "~/lively4/lively4-core" -> "~-lively4-lively4-core"
    return projectPath.replace(/\//g, '-');
  }

  
    // Claude Sonnet 4 Pricing (per million tokens)
  static PRICING = {
    baseInput: 3.00,      // $3 / MTok
    cacheWrite5m: 3.75,   // $3.75 / MTok (5 minute cache writes)
    cacheWrite1h: 6.00,   // $6 / MTok (1 hour cache writes)
    cacheHit: 0.30,       // $0.30 / MTok (cache hits & refreshes)
    output: 15.00         // $15 / MTok
  };

  static calculateDollarCost(tokens) {
    const input = tokens.input || 0;
    const output = tokens.output || 0;
    const cacheRead = tokens.cacheRead || 0;
    const cacheWrite = tokens.cacheWrite || 0;
    
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

  static calculateTotalCostSummary(sessionsToRender) {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheWriteTokens = 0;
    let totalInputCost = 0;
    let totalOutputCost = 0;
    let totalCacheReadCost = 0;
    let totalCacheWriteCost = 0;
    let totalSessions = sessionsToRender.length;
    
    // Use a Set to track processed message UUIDs to avoid double-counting duplicates
    const processedMessageUUIDs = new Set();
    const messageUUIDToSessionMap = new Map(); // Track which session first had each UUID
    let uniqueMessages = 0;
    let duplicateMessages = 0;
    
    // Sort sessions by modification time (oldest first) to prioritize older sessions
    const sortedSessions = [...sessionsToRender].sort((a, b) => {
      const aTime = new Date(a.modificationTime || a.dateRange?.start || 0);
      const bTime = new Date(b.modificationTime || b.dateRange?.start || 0);
      return aTime.getTime() - bTime.getTime(); // Oldest first
    });
    
    // Track sessions that contain duplicates (for visual indication)
    const sessionsWithDuplicates = new Set();
    
    sortedSessions.forEach(sessionData => {
      if (!sessionData || !sessionData.costProgression) return;
      
      let sessionHasDuplicates = false;
      
      sessionData.costProgression.forEach(point => {
        if (!point.isUserMessage && point.tokens && point.uuid) {
          // Check if we've already processed this message UUID
          if (processedMessageUUIDs.has(point.uuid)) {
            duplicateMessages++;
            sessionHasDuplicates = true;
            return; // Skip this message to avoid double-counting
          }
          
          // Mark this UUID as processed and track which session had it first
          processedMessageUUIDs.add(point.uuid);
          messageUUIDToSessionMap.set(point.uuid, sessionData.sessionId || 'unknown');
          uniqueMessages++;
          
          // Accumulate actual token counts
          totalInputTokens += point.tokens.input || 0;
          totalOutputTokens += point.tokens.output || 0;
          totalCacheReadTokens += point.tokens.cacheRead || 0;
          totalCacheWriteTokens += point.tokens.cacheWrite || 0;
          
          // Calculate and accumulate dollar costs
          const dollarCosts = this.calculateDollarCost(point.tokens);
          totalInputCost += dollarCosts.inputCost;
          totalOutputCost += dollarCosts.outputCost;
          totalCacheReadCost += dollarCosts.cacheReadCost;
          totalCacheWriteCost += dollarCosts.cacheWriteCost;
        }
      });
      
      // Mark this session as having duplicates if any were found
      if (sessionHasDuplicates) {
        sessionsWithDuplicates.add(sessionData.sessionId || sessionData.filePath);
      }
    });
    
    const totalDollarCost = totalInputCost + totalOutputCost + totalCacheReadCost + totalCacheWriteCost;
    const totalCacheCost = totalCacheReadCost + totalCacheWriteCost;
    
    return {
      totalSessions,
      uniqueMessages,
      duplicateMessages,
      sessionsWithDuplicates, // Set of session IDs that contain duplicate messages
      totalTokens: {
        input: totalInputTokens,
        output: totalOutputTokens,
        cacheRead: totalCacheReadTokens,
        cacheWrite: totalCacheWriteTokens,
        total: totalInputTokens + totalOutputTokens + totalCacheReadTokens + totalCacheWriteTokens
      },
      totalCosts: {
        input: totalInputCost,
        output: totalOutputCost,
        cacheRead: totalCacheReadCost,
        cacheWrite: totalCacheWriteCost,
        cache: totalCacheCost,
        total: totalDollarCost
      }
    };
  }



  /**
   * Calculate total dollar cost for a session
   * @param {Object} sessionData - Processed session data
   * @returns {number} Total dollar cost for the session
   */
  static calculateSessionDollarCost(sessionData) {
    let totalDollarCost = 0;
    
    sessionData.costProgression.forEach(point => {
      if (!point.isUserMessage && point.tokens) {
        const dollarCosts = this.calculateDollarCost(point.tokens);
        totalDollarCost += dollarCosts.totalCost;
      }
    });
    
    return totalDollarCost;
  }

  static calculateDollarCostForType(tokenCount, costType) {
    const tokens = tokenCount; // This is already weighted token count from the breakdown
    
    // Convert weighted tokens back to actual tokens and apply pricing
    switch (costType) {
      case 'inputCost':
        return (tokens / 1000000) * this.PRICING.baseInput;
      case 'outputCost':
        return ((tokens / 3.0) / 1000000) * this.PRICING.output; // Divide by 3 to get actual tokens
      case 'cacheReadCost':
        return ((tokens / 0.1) / 1000000) * this.PRICING.cacheHit; // Divide by 0.1 to get actual tokens
      case 'cacheWriteCost':
        return ((tokens / 1.25) / 1000000) * this.PRICING.cacheWrite5m; // Divide by 1.25 to get actual tokens
      default:
        return 0;
    }
  }
}