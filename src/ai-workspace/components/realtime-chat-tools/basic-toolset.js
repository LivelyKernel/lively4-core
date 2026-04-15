/*MD
# BasicToolset

Self-contained tools with no dependencies.
Provides time, notifications, component operations, and code evaluation.
Also includes utility functions for parsing and content extraction.

MD*/

export class BasicToolset {
  /**
   * JSON replacer that converts DOM elements to readable HTML strings
   */
  static jsonReplacer(key, value) {
    if (value instanceof Element) {
      const attrs = Array.from(value.attributes)
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');
      const attrStr = attrs ? ` ${attrs}` : '';
      return `<${value.tagName.toLowerCase()}${attrStr}>`;
    }
    return value;
  }

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
            if (result instanceof Element) {
              // Format DOM elements specially using the replacer
              resultString = BasicToolset.jsonReplacer(null, result);
            } else if (typeof result === 'object') {
              try {
                // Use jsonReplacer to handle nested DOM elements
                resultString = JSON.stringify(result, BasicToolset.jsonReplacer, 2);
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
      list_files_voice: {
        definition: {
          type: "function",
          name: "list_files_voice",
          description: "List files and directories at a given path. Supports recursive listing and filtering. Use this to explore directory contents, find files, or understand project structure.",
          parameters: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Directory path to list (relative or absolute). Use '.' for current directory."
              },
              recursive: {
                type: "boolean",
                description: "If true, recursively list subdirectories. Default: false"
              },
              filter: {
                type: "string",
                description: "Optional glob pattern to filter results (e.g., '*.js', '**/*.md')"
              },
              maxDepth: {
                type: "number",
                description: "Maximum recursion depth when recursive is true. Default: 3"
              },
              includeHidden: {
                type: "boolean",
                description: "Include hidden files (starting with '.'). Default: false"
              }
            },
            required: ["path"]
          }
        },
        execute: async (args) => {
          const path = args.path || '.';
          const recursive = args.recursive || false;
          const filter = args.filter || null;
          const maxDepth = args.maxDepth || 3;
          const includeHidden = args.includeHidden || false;

          try {
            // Helper to match glob patterns with brace expansion support
            const matchesFilter = (name, pattern) => {
              if (!pattern) return true;
              
              // Expand brace patterns: *.{png,jpg} -> [*.png, *.jpg]
              const expandBraces = (pattern) => {
                const braceMatch = pattern.match(/\{([^}]+)\}/);
                if (!braceMatch) return [pattern];
                
                const options = braceMatch[1].split(',').map(s => s.trim());
                const prefix = pattern.slice(0, braceMatch.index);
                const suffix = pattern.slice(braceMatch.index + braceMatch[0].length);
                
                return options.flatMap(opt => expandBraces(prefix + opt + suffix));
              };
              
              const patterns = expandBraces(pattern);
              
              // Convert glob to regex for each expanded pattern
              return patterns.some(pat => {
                // Strip leading **/ (we handle recursion separately)
                pat = pat.replace(/^\*\*\//, '');
                
                // Convert glob wildcards to regex
                const regexPattern = pat
                  .replace(/\./g, '\\.')
                  .replace(/\*\*/g, '.*')  // ** matches anything
                  .replace(/\*/g, '[^/]*')  // * matches anything except /
                  .replace(/\?/g, '.');     // ? matches single char
                
                return new RegExp(`^${regexPattern}$`).test(name);
              });
            };

            // Helper to fetch directory listing
            const fetchDirectory = async (dirPath) => {
              const url = dirPath.startsWith('http') ? dirPath : lively4url + '/' + dirPath.replace(/^\//, '');
              const response = await fetch(url, {
                method: 'OPTIONS'
              });

              if (!response.ok) {
                throw new Error(`Failed to list directory: ${response.statusText}`);
              }

              const data = await response.json();
              return data.contents || [];
            };

            // Recursive file listing
            const listFiles = async (dirPath, currentDepth = 0) => {
              if (recursive && currentDepth >= maxDepth) {
                return { files: [], truncated: true };
              }

              const entries = await fetchDirectory(dirPath);
              const files = [];
              let truncated = false;

              for (const entry of entries) {
                const name = entry.name;
                const isDir = entry.type === 'directory';

                // Filter hidden files
                if (!includeHidden && name.startsWith('.')) {
                  continue;
                }

                // Build relative path
                // For non-recursive, use just the name. For recursive, build full path.
                const relativePath = currentDepth === 0 && !recursive ? name : 
                  (dirPath === '.' ? name : `${dirPath}/${name}`);
                
                // Build full path for directory traversal
                const fullPath = dirPath === '.' ? name : `${dirPath}/${name}`;

                if (isDir) {
                  // Only add directory entry if no filter is specified
                  // When filtering for specific files, we don't want to show empty directories
                  if (!filter) {
                    files.push({
                      name,
                      type: 'directory',
                      relativePath,
                      size: null
                    });
                  }

                  // Recurse into subdirectory if needed
                  if (recursive) {
                    const subResult = await listFiles(fullPath, currentDepth + 1);
                    files.push(...subResult.files);
                    if (subResult.truncated) truncated = true;
                  }
                } else {
                  // Add file entry if it matches filter
                  if (matchesFilter(name, filter)) {
                    files.push({
                      name,
                      type: 'file',
                      relativePath,
                      size: entry.size || null
                    });
                  }
                }
              }

              return { files, truncated };
            };

            const result = await listFiles(path);

            // Count totals
            const totalFiles = result.files.filter(f => f.type === 'file').length;
            const totalDirs = result.files.filter(f => f.type === 'directory').length;

            return {
              success: true,
              tool: 'list_files_voice',
              path,
              files: result.files,
              metadata: {
                totalFiles,
                totalDirs,
                recursive,
                filter: filter || null,
                maxDepth: recursive ? maxDepth : null,
                truncated: result.truncated
              }
            };
          } catch (error) {
            const errorMessage = error.message || String(error);
            return {
              success: false,
              tool: 'list_files_voice',
              error: `Failed to list files: ${errorMessage}`,
              path
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
