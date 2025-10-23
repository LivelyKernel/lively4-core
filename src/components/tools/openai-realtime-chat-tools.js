/*MD
# OpenAI Audio Chat Tools

Tool definitions and handlers for OpenAI function calling in the audio chat component.
Each tool includes both the OpenAI function schema and a simple execution handler.

**Architecture:**
- Tools are defined with OpenAI-compatible function schemas
- Simple async handlers that return results directly
- Independent from MCP protocol (no special context or formatting)
- Can evolve independently based on OpenAI chat requirements

MD*/

/**
 * OpenAI Function Calling Tools for Audio Chat
 */
export const Tools = {
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
    async execute(args) {
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
    async execute(args) {
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
    async execute(args) {
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
    async execute(args) {
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
  },

  // ===================================================================
  // OpenCode Workspace Tools
  // ===================================================================

  send_opencode_task: {
    definition: {
      type: "function",
      name: "send_opencode_task",
      description: "Send a coding task or message to the OpenCode agent (Claude Code). Use this to ask the agent to write code, fix bugs, add features, or perform any development task.",
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
    async execute(args) {
      const workspace = lively.query(document.body, "lively-ai-workspace");

      if (!workspace) {
        return {
          success: false,
          error: "AI workspace not found. Please open lively-ai-workspace first."
        };
      }

      const result = await workspace.sendMessageToOpenCode(args.task);
      return result;
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
    async execute(args) {
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
      const workspace = lively.query(document.body, "lively-ai-workspace");

      if (!workspace) {
        return {
          success: false,
          error: "AI workspace not found. Please open lively-ai-workspace first."
        };
      }

      return workspace.getOpenCodeStatus();
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
    async execute(args) {
      const workspace = lively.query(document.body, "lively-ai-workspace");

      if (!workspace) {
        return {
          success: false,
          error: "AI workspace not found. Please open lively-ai-workspace first."
        };
      }

      return await workspace.getOpenCodeHistory();
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
    async execute(args) {
      const workspace = lively.query(document.body, "lively-ai-workspace");

      if (!workspace) {
        return {
          success: false,
          error: "AI workspace not found. Please open lively-ai-workspace first."
        };
      }

      return await workspace.createOpenCodeSession(args.title);
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
    async execute(args) {
      const workspace = lively.query(document.body, "lively-ai-workspace");

      if (!workspace) {
        return {
          success: false,
          error: "AI workspace not found. Please open lively-ai-workspace first."
        };
      }

      return workspace.getOpenCodeSessions();
    }
  }
};

/**
 * Get all function definitions in OpenAI format
 */
export function getFunctionDefinitions() {
  return Object.values(Tools).map(tool => tool.definition);
}

/**
 * Execute a tool by name with given arguments
 */
export async function executeTool(toolName, args) {
  const tool = Tools[toolName];
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  return await tool.execute(args);
}
