/*MD
# WorkspaceToolset

Tools requiring AI workspace reference.
Provides OpenCode agent integration (send tasks, check status, manage sessions).

MD*/

import { BasicToolset } from './basic-toolset.js';

/**
 * WorkspaceToolset - Tools requiring AI workspace reference
 * Provides OpenCode agent integration (send tasks, check status, manage sessions)
 */
export class WorkspaceToolset {
  constructor(workspace) {
    if (!workspace) {
      throw new Error("WorkspaceToolset requires a workspace reference");
    }
    this.workspace = workspace;

    this.tools = {
      // send_user_task: {
      //   definition: {
      //     type: "function",
      //     name: "send_user_task",
      //     description: "Send a task by the user to the system.",
      //     parameters: {
      //       type: "object",
      //       properties: {
      //         task: {
      //           type: "string",
      //           description: "The coding task or message. Be specific about what the user wanted to do."
      //         }
      //       },
      //       required: ["task"]
      //     }
      //   },
      //   execute: async (args) => {
      //     const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      //       return {
      //         success: true,
      //         response: args.task,
      //         immediate: true,
      //         requestId: requestId
      //       };
          
      //   }
      // },
      send_opencode_task: {
        definition: {
          type: "function",
          name: "send_opencode_task",
          description: "Send a coding task or message to the OpenCode agent (Claude Code). For quick queries (like 'what is 3+4'), the response is returned immediately. For longer tasks, you'll be notified automatically when complete.",
          parameters: {
            type: "object",
            properties: {
              task: {
                type: "string",
                description: "The coding task or message to send to the agent. Be specific about what you want the agent to do."
              }
            },
            required: ["task"]
          }
        },
        execute: async (args) => {
          const audioChat = lively.query(document.body, "openai-realtime-chat");

          // Generate unique request ID for tracking
          const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Send task with request ID
          const sendResult = await this.workspace.sendMessageToOpenCode(args.task, requestId);

          if (!sendResult.success) {
            return sendResult;
          }

          // Wait up to 5 seconds for a quick response
          const response = await this.waitForRequestResponse(requestId, 5000);

          if (response) {
            // Got immediate response! Return it directly
            let responseContent = BasicToolset.getResponseContent(response);
            return {
              success: true,
              response:  responseContent,
              immediate: true,
              requestId: requestId
            };
          } else {
            // Long-running task - set flag for event-based relay
            if (audioChat) {
              audioChat.waitingForAgentReply = true;
              audioChat.pendingTask = args.task;
              audioChat.pendingRequestId = requestId;
              this.workspace.setRequestAudioWaiting(requestId, true);
            }
            return {
              success: true,
              message: "Task sent to coding agent. Working on it now.",
              immediate: false,
              requestId: requestId
            };
          }
        }
      },
      /*
      get_opencode_status: {
        definition: {
          type: "function",
          name: "get_opencode_status",
          description: "Get the current status of the OpenCode coding agent. Check if it's idle, working, or blocked, and see what task it's currently working on. Returns real-time cached status (no API calls, instant response).",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        },
        execute: async (args) => {
          // First check if audio chat component has cached status
          const audioChat = lively.query(document.body, "openai-realtime-chat");

          if (audioChat && audioChat.agentStatus) {
            // Return cached status from audio chat component (free, no token cost)
            return {
              success: true,
              status: audioChat.agentStatus,
              lastUpdate: audioChat.lastAgentUpdate,
              eventHistory: audioChat.agentEventHistory,
              source: 'cached'
            };
          }

          // Fallback to workspace query if audio chat not available
          return this.workspace.getOpenCodeStatus();
        }
      },

      get_opencode_history: {
        definition: {
          type: "function",
          name: "get_opencode_history",
          description: "Get the conversation history from the current OpenCode session. See what messages have been exchanged between user and agent.",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        },
        execute: async (args) => {
          return await this.workspace.getOpenCodeHistory();
        }
      },

      create_opencode_session: {
        definition: {
          type: "function",
          name: "create_opencode_session",
          description: "Create a new OpenCode session with a specific title. Use this to start a fresh conversation with the coding agent.",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Title for the new session (e.g., 'Add search feature', 'Fix login bug')"
              }
            },
            required: ["title"]
          }
        },
        execute: async (args) => {
          return await this.workspace.createOpenCodeSession(args.title);
        }
      },

      list_opencode_sessions: {
        definition: {
          type: "function",
          name: "list_opencode_sessions",
          description: "List all available OpenCode sessions. See past and current coding sessions.",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        },
        execute: async (args) => {
          return this.workspace.getOpenCodeSessions();
        }
      }*/
    };
  }

  /**
   * Wait for a request response with timeout
   */
  async waitForRequestResponse(requestId, timeoutMs) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Poll every 100ms

      // Check if request has been completed
      const response = this.workspace.getRequestResponse(requestId);

      if (response) {
        return response; // Got the response!
      }
    }

    return null; // Timeout - no response yet
  }

  /**
   * Get all function definitions in OpenAI format
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
    // Bind workspace context to execute method
    return await tool.execute.call(this, args);
  }
}
