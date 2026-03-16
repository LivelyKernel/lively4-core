/*MD
# MessageToolset

Provides tools for voice agent to inspect conversation messages on-demand.
Allows retrieving and searching through message history from all agents.

MD*/

export class MessageToolset {
  constructor(workspace) {
    if (!workspace) {
      throw new Error("MessageToolset requires a workspace reference");
    }
    this.workspace = workspace;

    this.tools = {
      get_recent_messages: {
        definition: {
          type: "function",
          name: "get_recent_messages",
          description: "Retrieve recent messages from the conversation history. " +
                       "Use this to see what the user has been discussing with code agents " +
                       "or to catch up on recent activity. Returns formatted messages with source and content.",
          parameters: {
            type: "object",
            properties: {
              count: {
                type: "number",
                description: "Number of recent messages to retrieve (default: 10, max: 50)"
              },
              filter_agent: {
                type: "string",
                enum: ["all", "user", "scribe", "vox", "system"],
                description: "Filter by message source (default: 'all'). 'scribe' is the code agent, 'vox' is the voice agent."
              },
              include_tool_calls: {
                type: "boolean",
                description: "Include tool call details in messages (default: false)"
              }
            }
          }
        },
        execute: async (args) => {
          return await this.getRecentMessages(args);
        }
      },

      search_messages: {
        definition: {
          type: "function",
          name: "search_messages",
          description: "Search through message history for specific content. " +
                       "Useful for finding when something was discussed or what was said about a topic. " +
                       "Returns matching messages with context.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query text to find in message content"
              },
              max_results: {
                type: "number",
                description: "Maximum results to return (default: 5, max: 20)"
              }
            },
            required: ["query"]
          }
        },
        execute: async (args) => {
          return await this.searchMessages(args);
        }
      },

      get_message_by_id: {
        definition: {
          type: "function",
          name: "get_message_by_id",
          description: "Retrieve the complete details of a specific message by its ID. " +
                       "Returns everything available about the message including internal reasoning steps, " +
                       "tool call outputs, timestamps, and all meta-information. Useful for detailed inspection " +
                       "of specific messages.",
          parameters: {
            type: "object",
            properties: {
              message_id: {
                type: "string",
                description: "The unique ID of the message to retrieve"
              }
            },
            required: ["message_id"]
          }
        },
        execute: async (args) => {
          return await this.getMessageById(args);
        }
      }
    };
  }

  /**
   * Get recent messages from conversation history
   */
  async getRecentMessages(args) {
    try {
      const count = Math.min(args.count || 10, 50);
      const filterAgent = args.filter_agent || 'all';
      const includeTools = args.include_tool_calls || false;

      // Get messages from workspace conversation history
      const allMessages = await this.workspace.getConversationHistory();

      // Filter by agent if requested
      let filtered = allMessages;
      if (filterAgent !== 'all') {
        filtered = allMessages.filter(msg =>
          this.getMessageSource(msg) === filterAgent
        );
      }

      // Take most recent
      const recent = filtered.slice(-count);

      // Format for display
      const formatted = this.formatMessages(recent, includeTools);

      return {
        success: true,
        message_count: formatted.length,
        total_messages: allMessages.length,
        messages: formatted
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve messages: ${error.message}`
      };
    }
  }

  /**
   * Search messages for specific content
   */
  async searchMessages(args) {
    try {
      const query = args.query.toLowerCase();
      const maxResults = Math.min(args.max_results || 5, 20);

      const allMessages = await this.workspace.getConversationHistory();

      // Search in message content
      const matches = allMessages
        .map((msg, index) => ({
          msg,
          index,
          content: this.getMessageContent(msg)
        }))
        .filter(item => item.content.toLowerCase().includes(query))
        .slice(-maxResults);

      const formatted = matches.map(item => {
        const msg = this.formatMessages([item.msg], true)[0];
        // Add context: position in conversation
        msg.position = `${item.index + 1} of ${allMessages.length}`;
        return msg;
      });

      return {
        success: true,
        query: args.query,
        matches_found: formatted.length,
        messages: formatted
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search messages: ${error.message}`
      };
    }
  }

  /**
   * Get complete details of a specific message by its ID
   */
  async getMessageById(args) {
    try {
      const messageId = args.message_id;
      const allMessages = await this.workspace.getConversationHistory();

      // Find message by ID - check different ID fields depending on message type
      const message = allMessages.find(msg => {
        // OpenCode messages: info.id
        if (msg.info && msg.info.id === messageId) return true;
        
        // Realtime messages: item_id or id
        if (msg.item_id === messageId) return true;
        if (msg.id === messageId) return true;
        
        return false;
      });

      if (!message) {
        return {
          success: false,
          error: `Message with ID '${messageId}' not found in conversation history`
        };
      }

      // Return the complete message with all details
      const result = {
        success: true,
        message_id: messageId,
        source: this.getMessageSource(message),
        full_message: message
      };

      // Add parsed sections for easier reading
      result.parsed = {
        role: message.role || message.info?.role,
        timestamp: message.timestamp || message.localTimestamp || message.info?.time?.created,
        content: this.getMessageContent(message)
      };

      // Extract internal reasoning (thinking) if available
      if (message.parts && Array.isArray(message.parts)) {
        const thinkingParts = message.parts.filter(p => p.type === 'thinking');
        if (thinkingParts.length > 0) {
          result.parsed.internal_reasoning = thinkingParts.map(p => p.text);
        }

        // Extract tool calls with full details
        const toolParts = message.parts.filter(p => p.type === 'tool' || p.type === 'tool_use');
        if (toolParts.length > 0) {
          result.parsed.tool_calls = toolParts.map(tc => ({
            name: tc.name,
            input: tc.input,
            output: tc.state?.output,
            status: tc.state?.status,
            full_details: tc
          }));
        }

        // Extract all part types for reference
        result.parsed.part_types = message.parts.map(p => p.type);
      }

      // Extract tool calls from realtime/anthropic format
      if (message.tool_calls && Array.isArray(message.tool_calls)) {
        result.parsed.tool_calls = message.tool_calls.map(tc => ({
          name: tc.function?.name || tc.name,
          arguments: tc.function?.arguments || tc.args,
          full_details: tc
        }));
      }

      // Add metadata
      result.metadata = {
        event_source: message.eventSource,
        has_parts: !!message.parts,
        parts_count: message.parts ? message.parts.length : 0,
        has_tool_calls: !!(message.tool_calls || (message.parts && message.parts.some(p => p.type === 'tool' || p.type === 'tool_use'))),
        has_reasoning: !!(message.parts && message.parts.some(p => p.type === 'thinking'))
      };

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve message: ${error.message}`
      };
    }
  }

  /**
   * Determine the source agent of a message
   */
  getMessageSource(message) {
    // OpenCode messages have eventSource
    if (message.eventSource === 'opencode') {
      const role = message.info?.role || message.role;
      return role === 'user' ? 'user' : 'scribe';
    }

    // Realtime messages
    if (message.eventSource === 'realtime' || message.item_id) {
      const role = message.role;
      return role === 'user' ? 'user' : 'vox';
    }

    // Fallback: check role
    if (message.role === 'user') return 'user';
    if (message.role === 'assistant') return 'system';
    if (message.role === 'tool') return 'system';

    return 'system';
  }

  /**
   * Extract text content from various message formats
   */
  getMessageContent(message) {
    // OpenCode format: {info, parts: [{type: 'text', text: '...'}]}
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join('\n');
    }

    // Realtime format: {content: '...'}
    if (typeof message.content === 'string') {
      return message.content;
    }

    // Anthropic format: {content: [{type: 'text', text: '...'}]}
    if (Array.isArray(message.content)) {
      return message.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');
    }

    // Fallback
    return JSON.stringify(message);
  }

  /**
   * Format messages for display
   */
  formatMessages(messages, includeTools) {
    return messages.map(msg => {
      const timestamp = msg.timestamp || msg.localTimestamp || msg.info?.time || new Date().toISOString();
      const content = this.getMessageContent(msg);

      const formatted = {
        source: this.getMessageSource(msg),
        timestamp: new Date(timestamp).toISOString(),
        content: content.length > 500 ? content.substring(0, 500) + '...' : content,
        content_length: content.length
      };

      // Add tool calls if requested and available
      if (includeTools) {
        // OpenCode tool format
        if (msg.parts && Array.isArray(msg.parts)) {
          const toolParts = msg.parts.filter(p => p.type === 'tool' || p.type === 'tool_use');
          if (toolParts.length > 0) {
            formatted.tool_calls = toolParts.map(tc => ({
              name: tc.name,
              status: tc.state?.status,
              has_output: !!tc.state?.output
            }));
          }
        }

        // Realtime/Anthropic tool format
        if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
          formatted.tool_calls = msg.tool_calls.map(tc => ({
            name: tc.function?.name || tc.name,
            args: tc.function?.arguments || tc.args
          }));
        }
      }

      return formatted;
    });
  }

  getDefinitions() {
    return Object.values(this.tools).map(tool => tool.definition);
  }

  async execute(toolName, args) {
    const tool = this.tools[toolName];
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    return await tool.execute.call(this, args);
  }
}
