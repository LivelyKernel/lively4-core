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
