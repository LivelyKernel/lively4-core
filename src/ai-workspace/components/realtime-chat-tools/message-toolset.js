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
