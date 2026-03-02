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
              }
            },
            required: ["task"]
          }
        },
        execute: async (args) => {
          const audioChat = lively.query(document.body, "openai-realtime-chat");

          const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const sendResult = await this.workspace.sendMessageToOpenCode(args.task, requestId);

          if (!sendResult.success) {
            return sendResult;
          }

          const response = await this.waitForRequestResponse(requestId, 5000);

          if (response) {
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
