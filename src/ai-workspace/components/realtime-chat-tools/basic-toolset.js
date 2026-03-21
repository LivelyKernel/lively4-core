/*MD
# BasicToolset

Self-contained tools with no dependencies.
Provides time, notifications, component operations, and code evaluation.
Also includes utility functions for parsing and content extraction.

MD*/

export class BasicToolset {
  /**
   * Parse lively4_evaluate_code structured output
   * Extracts result and console output from formatted tool response
   */
  static parseLively4EvaluateOutput(output) {
    try {
      const resultMatch = output.match(/\*\*Result:\*\*\s*([\s\S]*?)(?:\n\n\*\*Console output:\*\*|$)/);
      const result = resultMatch ? resultMatch[1].trim() : null;

      const consoleMatch = output.match(/\*\*Console output:\*\*\s*([\s\S]*?)$/);
      const consoleOutput = consoleMatch ? consoleMatch[1].trim() : null;

      if (!result && !consoleOutput) {
        return null;
      }

      return { result, consoleOutput };
    } catch (e) {
      console.warn('Failed to parse lively4_evaluate_code output:', e);
      return null;
    }
  }

  /**
   * Extract text and tool outputs from OpenCode response for audio playback
   * Handles text parts, tool_result parts, and tool execution outputs
   */
  static getResponseContent(response) {
    if (!response || !response.parts) {
      return '';
    }

    const parts = [];

    for (const part of response.parts) {
      if (part.type === 'text') {
        // Plain text content
        parts.push(part.text);

      } else if (part.type === 'tool_result') {
        // Tool result from server
        let content = '';
        if (typeof part.content === 'string') {
          content = part.content;
        } else if (Array.isArray(part.content)) {
          content = part.content
            .map(block => block.type === 'text' ? block.text : JSON.stringify(block))
            .join('\n');
        } else {
          content = JSON.stringify(part.content);
        }
        parts.push(`Tool result: ${content}`);

      } else if (part.type === 'tool' && part.state?.status === 'completed' && part.state?.output) {
        // Live tool execution result (streaming) - includes state.output
        // Use full raw output to preserve all context (code, success messages, etc.)
        parts.push(part.state.output);
      }
      // Skip: tool_use (just the call, not result), step-start/finish (metrics)
    }

    return parts.join('\n');
  }

  constructor() {
    this.tools = {
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
            let result;
            try {
              result = await eval(code);
            } catch (evalError) {
              const errorMessage = evalError.message || String(evalError);
              return {
                success: false,
                error: `Execution error: ${errorMessage}`,
                code
              };
            }

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
              message: `Code executed successfully. Result: ${resultString}`,
              code
            };
          } catch (error) {
            // Catch any unexpected errors (e.g., SystemJS, promise issues)
            const errorMessage = error.message || String(error);
            return {
              success: false,
              error: `Code evaluation failed: ${errorMessage}`,
              code
            };
          }
        }
      },
    };
  }

  getDefinitions() {
    return Object.values(this.tools).map(tool => tool.definition);
  }

  async execute(toolName, args) {
    const tool = this.tools[toolName];
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    return await tool.execute(args);
  }
}
