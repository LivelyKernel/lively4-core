/*MD
# OpenAI Audio Chat Tools

Tool definitions and handlers for OpenAI function calling in the audio chat component.
Organized as simple toolset classes that can be composed based on component needs.

**Architecture:**
- **BasicToolset**: Self-contained tools with no dependencies (time, notifications, component operations)
- **WorkspaceToolset**: Tools requiring AI workspace reference (OpenCode integration)
- **CompositeToolset**: Combines multiple toolsets into unified interface
- Tools are defined with OpenAI-compatible function schemas
- Simple async handlers that return results directly
- Independent from MCP protocol (no special context or formatting)

**Usage:**
```javascript
// Pure audio chat - basic tools only
const toolset = new BasicToolset();

// Workspace-integrated - basic + workspace tools
const basicTools = new BasicToolset();
const workspaceTools = new WorkspaceToolset(workspaceComponent);
const toolset = new CompositeToolset(basicTools, workspaceTools);
```

MD*/

/**
 * BasicToolset - Self-contained tools with no dependencies
 * Provides time, notifications, component operations, and code evaluation
 */
export class BasicToolset {
  constructor() {
    this.tools = {
      get_current_time: {
        definition: {
          type: "function",
          name: "get_current_time",
          description: "Get the current time in a specified timezone",
          parameters: {
            type: "object",
            properties: {
              timezone: {
                type: "string",
                description: "IANA timezone name (e.g., 'America/New_York', 'Europe/London'). Defaults to 'UTC'.",
                enum: ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo", "America/Los_Angeles"]
              }
            },
            required: []
          }
        },
        execute: async (args) => {
          const timezone = args.timezone || "UTC";

          try {
            const now = new Date();
            const timeString = now.toLocaleString("en-US", {
              timeZone: timezone,
              dateStyle: 'full',
              timeStyle: 'long'
            });

            return {
              success: true,
              timezone,
              time: timeString,
              message: `Current time in ${timezone}: ${timeString}`
            };
          } catch (error) {
            return {
              success: false,
              error: `Invalid timezone: ${timezone}. Please use IANA timezone names.`
            };
          }
        }
      },

      open_component: {
        definition: {
          type: "function",
          name: "open_component",
          description: "Open a Lively4 component in a window. Use this to open tools like 'lively-drawboard', 'lively-code-mirror', 'lively-container', etc.",
          parameters: {
            type: "object",
            properties: {
              component_name: {
                type: "string",
                description: "The name of the component to open (e.g., 'lively-drawboard', 'lively-code-mirror')"
              }
            },
            required: ["component_name"]
          }
        },
        execute: async (args) => {
          const componentName = args.component_name;

          try {
            await lively.openComponentInWindow(componentName);
            return {
              success: true,
              component: componentName,
              message: `Successfully opened ${componentName}`
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to open component "${componentName}": ${error.message}`
            };
          }
        }
      },

      evaluate_code: {
        definition: {
          type: "function",
          name: "evaluate_code",
          description: "Execute JavaScript code in the Lively4 environment and return the result. Use this to perform calculations, interact with the system, or test code snippets.",
          parameters: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "The JavaScript code to evaluate"
              }
            },
            required: ["code"]
          }
        },
        execute: async (args) => {
          const code = args.code;

          try {
            // Use eval in the global context for simple evaluation
            const result = await eval(code);

            // Convert result to string
            let resultString;
            if (typeof result === 'object') {
              try {
                resultString = JSON.stringify(result, null, 2);
              } catch (jsonError) {
                resultString = String(result);
              }
            } else if (result === undefined) {
              resultString = 'undefined';
            } else {
              resultString = String(result);
            }

            return {
              success: true,
              result: resultString,
              message: `Code executed successfully. Result: ${resultString}`
            };
          } catch (error) {
            return {
              success: false,
              error: `Execution error: ${error.message}`,
              code
            };
          }
        }
      },

      create_notification: {
        definition: {
          type: "function",
          name: "create_notification",
          description: "Display a notification message to the user. Use this to provide feedback or important information.",
          parameters: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "The notification message to display"
              },
              type: {
                type: "string",
                description: "The type of notification (success, error, warn, notify)",
                enum: ["success", "error", "warn", "notify"]
              }
            },
            required: ["message"]
          }
        },
        execute: async (args) => {
          const message = args.message;
          const type = args.type || "notify";

          const validTypes = ['success', 'error', 'warn', 'notify'];
          if (!validTypes.includes(type)) {
            return {
              success: false,
              error: `Invalid notification type: ${type}. Must be one of: ${validTypes.join(', ')}`
            };
          }

          lively[type](message);

          return {
            success: true,
            type,
            message: `Displayed ${type} notification: "${message}"`
          };
        }
      }
    };
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
    return await tool.execute(args);
  }
}

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
            return {
              success: true,
              response: response.content,
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
      }
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

/**
 * CompositeToolset - Combines multiple toolsets into unified interface
 * Allows components to compose different tool capabilities as needed
 */
export class CompositeToolset {
  constructor(...toolsets) {
    this.toolsets = toolsets;
  }

  /**
   * Get all function definitions from all toolsets
   */
  getDefinitions() {
    return this.toolsets.flatMap(toolset => toolset.getDefinitions());
  }

  /**
   * Execute a tool by searching through all toolsets
   */
  async execute(toolName, args) {
    for (const toolset of this.toolsets) {
      if (toolset.tools && toolset.tools[toolName]) {
        return await toolset.execute(toolName, args);
      }
    }
    throw new Error(`Unknown tool: ${toolName}`);
  }
}

// ===================================================================
// Backward Compatibility Exports
// ===================================================================

/**
 * Legacy flat Tools object - maintained for backward compatibility
 * @deprecated Use BasicToolset and WorkspaceToolset classes instead
 */
export const Tools = (() => {
  const basic = new BasicToolset();
  // Note: Workspace tools require workspace reference, so they're omitted here
  // Components should use the class-based API instead
  return basic.tools;
})();

/**
 * Legacy function to get all definitions
 * @deprecated Use toolset.getDefinitions() instead
 */
export function getFunctionDefinitions() {
  const basic = new BasicToolset();
  return basic.getDefinitions();
}

/**
 * Legacy function to execute a tool
 * @deprecated Use toolset.execute() instead
 */
export async function executeTool(toolName, args) {
  const basic = new BasicToolset();
  return await basic.execute(toolName, args);
}
