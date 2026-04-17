/*MD
# WorkspaceToolset

Tools requiring AI workspace reference.
Provides OpenCode agent integration (send tasks, check status, manage sessions).

MD*/

import { BasicToolset } from './basic-toolset.js';

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
              },
              requestId: {
                type: "string",
                description: "Optional request ID for explicit request-response tracking."
              }
            },
            required: ["task"]
          }
        },
        execute: async (args = {}) => {
          const requestId = args.requestId || this.createRequestId();
          const sendResult = await this.workspace.sendMessageToOpenCode(args.task, requestId);
          return await this.resolveOpenCodeTaskResult(sendResult, {
            task: args.task,
            requestId,
            longTaskMessage: "Task sent to coding agent. Working on it now."
          });
        }
      },
      stop_opencode_task: {
        definition: {
          type: "function",
          name: "stop_opencode_task",
          description: "Stop the coding agent's current generation in the active OpenCode session.",
          parameters: {
            type: "object",
            properties: {
              requestId: {
                type: "string",
                description: "Optional request ID to mark as aborted in workspace tracking."
              }
            }
          }
        },
        execute: async (args = {}) => {
          if (!this.workspace.stopOpenCodeTask) {
            return {
              success: false,
              error: "Workspace stop API not available"
            };
          }
          return await this.workspace.stopOpenCodeTask(args);
        }
      },
      continue_opencode_task: {
        definition: {
          type: "function",
          name: "continue_opencode_task",
          description: "Continue the coding agent in the current session after a stop/interruption.",
          parameters: {
            type: "object",
            properties: {
              instruction: {
                type: "string",
                description: "Optional continuation instruction. If omitted, uses a default continue prompt."
              },
              requestId: {
                type: "string",
                description: "Optional request ID for request-response tracking."
              }
            }
          }
        },
        execute: async (args = {}) => {
          if (!this.workspace.continueOpenCodeTask) {
            return {
              success: false,
              error: "Workspace continue API not available"
            };
          }

          const requestId = args.requestId || this.createRequestId();
          const instruction = args.instruction || "Continue from where you stopped.";
          const continueResult = await this.workspace.continueOpenCodeTask({
            instruction,
            requestId
          });

          return await this.resolveOpenCodeTaskResult(continueResult, {
            task: instruction,
            requestId,
            longTaskMessage: "Continuation sent to coding agent. Working on it now."
          });
        }
      },
      get_opencode_current_state: {
        definition: {
          type: "function",
          name: "get_opencode_current_state",
          description: "Get current OpenCode execution state: connection, session, generation, and request tracking.",
          parameters: {
            type: "object",
            properties: {
              includeHistory: {
                type: "boolean",
                description: "Include recent completed requests summary. Defaults to false."
              },
              includePending: {
                type: "boolean",
                description: "Include pending request list. Defaults to true."
              }
            }
          }
        },
        execute: async (args = {}) => {
          if (this.workspace.getOpenCodeCurrentState) {
            return await this.workspace.getOpenCodeCurrentState(args);
          }

          if (this.workspace.getOpenCodeStatus) {
            const fallbackStatus = await this.workspace.getOpenCodeStatus();
            return {
              success: true,
              state: fallbackStatus,
              fallback: true
            };
          }

          return {
            success: false,
            error: "Workspace state API not available"
          };
        }
      }
    };
  }

  createRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async resolveOpenCodeTaskResult(sendResult, {task, requestId, longTaskMessage}) {
    if (!sendResult?.success) {
      return sendResult || {
        success: false,
        error: 'Failed to send task to coding agent'
      };
    }

    const response = await this.waitForRequestResponse(requestId, 5000);
    if (response) {
      const responseContent = BasicToolset.getResponseContent(response);
      return {
        success: true,
        response: responseContent,
        immediate: true,
        requestId
      };
    }

    // Long-running task - set flag for event-based relay
    const audioChat = lively.query(document.body, "openai-realtime-chat");
    if (audioChat) {
      audioChat.waitingForAgentReply = true;
      audioChat.pendingTask = task;
      audioChat.pendingRequestId = requestId;
      if (this.workspace.setRequestAudioWaiting) {
        this.workspace.setRequestAudioWaiting(requestId, true);
      }
    }

    return {
      success: true,
      message: longTaskMessage,
      immediate: false,
      requestId
    };
  }

  async waitForRequestResponse(requestId, timeoutMs) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Poll every 100ms

      const response = this.workspace.getRequestResponse(requestId);

      if (response) {
        return response;
      }
    }

    return null;
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
