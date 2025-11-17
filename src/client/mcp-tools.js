/*MD 
# MCP Tools

Client-side MCP (Model Context Protocol) tool implementations for Lively4.
These tools are executed in the browser and handle the actual work requested by Claude Code through the MCP protocol.

**Architecture:**
- Each tool follows the exact naming from the MCP protocol specification
- Tools receive arguments and a context object for interacting with the UI component
- Consistent error handling and result serialization across all tools

MD*/

import boundEval from "src/client/bound-eval.js";

/**
 * MCP Tools implementation for Lively4 browser environment
 */
export const Tools = {
  /**
   * Execute JavaScript code in the live Lively4 environment
   * Uses boundEval for proper SystemJS integration and workspace management
   * Returns structured MCP response with result, console output, and error details
   */
  'evaluate-code': {
    metadata: {
      description: "Execute JavaScript code in a Lively4 browser session. If sessionId is not provided, automatically selects an available session.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Target Lively4 session ID (optional - auto-selects if not provided)"
          },
          code: {
            type: "string",
            description: "JavaScript code to evaluate in the live environment"
          },
          timeout: {
            type: "number",
            description: "Timeout in milliseconds (default: 30000)",
            default: 30000
          }
        },
        required: ["code"]
      }
    },

    async execute(args, context) {
      const { code } = args;
      context.logActivity('request', `Evaluating: ${code.substring(0, 50)}${code.length > 50 ? '...' : ''}`);
      
      // Capture console messages
      const consoleMessages = [];
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug
      };
      
      // Override console methods to capture output
      const captureConsole = (level, originalMethod) => {
        console[level] = (...args) => {
          // Call original method to maintain normal browser console behavior
          originalMethod.apply(console, args);
          
          // Capture the message for our response
          const message = args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          }).join(' ');
          
          consoleMessages.push({ level, message });
        };
      };
      
      captureConsole('log', originalConsole.log);
      captureConsole('warn', originalConsole.warn);
      captureConsole('error', originalConsole.error);
      captureConsole('info', originalConsole.info);
      captureConsole('debug', originalConsole.debug);
      
      try {
        let evalResult;
        try {
          // Use boundEval for proper evaluation with SystemJS support
          evalResult = await boundEval(code, this, lively4url + "/");
        } catch (systemError) {
          // Catch any SystemJS or module loading errors
          throw new Error(`Code evaluation failed: ${systemError.message || systemError}`);
        }

        // Check if evaluation resulted in an error
        if (evalResult.isError) {
          const error = evalResult.value;

          // Enhance error message with console output if any
          if (consoleMessages.length > 0) {
            const consoleOutput = consoleMessages.map(({level, message}) => `${level}: ${message}`).join('\n');
            const enhancedMessage = `${error.message}\n\nConsole output before error:\n${consoleOutput}`;
            const enhancedError = new Error(enhancedMessage);
            enhancedError.name = error.name;
            enhancedError.stack = error.stack;
            throw enhancedError;
          }

          throw error;
        }

        // Check for transpilation errors logged to console (Babel parse errors)
        const hasTranspileError = consoleMessages.some(msg =>
          msg.level === 'error' && (
            msg.message.includes('ERROR transpiling') ||
            msg.message.includes('ERROR transforming') ||
            msg.message.includes('BABEL_PARSE_ERROR')
          )
        );

        if (hasTranspileError) {
          const consoleOutput = consoleMessages.map(({level, message}) => `${level}: ${message}`).join('\n');
          throw new Error(`Code evaluation failed: Syntax error during transpilation\n\n${consoleOutput}`);
        }

        let result = evalResult.value;

        // Handle promises by awaiting them
        if (result && typeof result === 'object' && typeof result.then === 'function') {
          try {
            result = await result;
          } catch (promiseError) {
            // Enhance promise error with console output
            if (consoleMessages.length > 0) {
              const consoleOutput = consoleMessages.map(({level, message}) => `${level}: ${message}`).join('\n');
              const enhancedMessage = `Promise rejected: ${promiseError.message}\n\nConsole output before error:\n${consoleOutput}`;
              const enhancedError = new Error(enhancedMessage);
              enhancedError.name = promiseError.name || 'PromiseRejectionError';
              enhancedError.stack = promiseError.stack;
              throw enhancedError;
            }
            throw new Error(`Promise rejected: ${promiseError.message || promiseError}`);
          }
        }
        
        // Convert result to string for display
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
        
        // Return formatted result with console output
        return this.formatExecutionResult({
          success: true,
          result: resultString,
          consoleOutput: consoleMessages,
          code: code
        });
        
      } catch (error) {
        // Re-throw the original error
        throw error;
        
      } finally {
        // Restore original console methods
        Object.assign(console, originalConsole);
      }
    },
    
    /**
     * Serialize error object with full details
     */
    serializeError(error) {
      return {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack || null,
        type: error.constructor?.name || 'Error'
      };
    },
    
    /**
     * Format execution result for MCP response
     */
    formatExecutionResult({ success, result, error, consoleOutput, code }) {
      let output = [];
      
      if (success) {
        output.push(`✅ Code executed successfully:\n\`\`\`javascript\n${code}\n\`\`\``);
        output.push(`**Result:** ${result}`);
      } else {
        output.push(`❌ Code execution failed:\n\`\`\`javascript\n${code}\n\`\`\``);
        output.push(`**Error:** ${error.name}: ${error.message}`);
        
        if (error.stack) {
          // Clean up stack trace for better readability
          const cleanStack = error.stack
            .split('\n')
            .filter(line => !line.includes('workspace:') && !line.includes('SystemJS'))
            .slice(0, 5) // Limit to first 5 relevant lines
            .join('\n');
          
          if (cleanStack.trim()) {
            output.push(`**Stack trace:**\n\`\`\`\n${cleanStack}\n\`\`\``);
          }
        }
      }
      
      // Add console output if any
      if (consoleOutput.length > 0) {
        output.push('\n**Console output:**');
        consoleOutput.forEach(({ level, message }) => {
          const emoji = {
            log: '📝',
            warn: '⚠️',
            error: '🔴',
            info: 'ℹ️',
            debug: '🐛'
          }[level] || '📝';
          
          output.push(`${emoji} **${level}:** ${message}`);
        });
      }
      
      return output.join('\n');
    }
  },

  /**
   * Run tests in a browser session using a persistent test runner
   * Supports filtering tests by pattern and errors-only mode for minimal output
   */
  'run-tests': {
    metadata: {
      description: "Run tests in a Lively4 browser session using a persistent test runner. Can run all tests in a file or filter by pattern. Supports minimal output mode (errors only) to reduce context usage.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Target Lively4 session ID (optional - auto-selects if not provided)"
          },
          testPath: {
            type: "string",
            description: "Path to test file relative to lively4-core (e.g., 'test/client/strings-test.js')"
          },
          grep: {
            type: "string",
            description: "Optional Mocha grep pattern to filter tests by name (e.g., 'toUpperCaseFirst')"
          },
          errorsOnly: {
            type: "boolean",
            description: "If true, only return failed tests to minimize output (default: false)",
            default: false
          }
        },
        required: ["testPath"]
      }
    },

    async execute(args, context) {
      const { testPath, grep, errorsOnly = false } = args;

      context.logActivity('request', `Running tests: ${testPath}${grep ? ` (filtered: ${grep})` : ''}`);

      try {
        // Find or create persistent test runner with MCP label
        let testRunner = await this.findOrCreateTestRunner(context);

        // Import the test runner component to access its methods
        const TestRunner = await System.import('src/components/tools/lively-testrunner.js');

        // Ensure Mocha is loaded and initialized
        if (!window.mocha) {
          context.logActivity('info', 'Loading Mocha...');
          await lively.loadJavaScriptThroughDOM("mochaJS", lively4url + "/src/external/mocha.js", true);
          mocha.setup("bdd");
        }

        // Clear any previous tests
        if (window.mocha && window.mocha.suite) {
          mocha.suite.suites = [];
          mocha.suite.tests = [];
        }

        // Build full test file URL
        const testUrl = lively4url + '/' + testPath.replace(/^\//, '');

        context.logActivity('info', `Loading test file: ${testUrl}`);

        // Reload and import the test module
        await lively.reloadModule(testUrl);
        await System.import(testUrl);

        // Set up grep filter if provided
        if (grep && window.mocha) {
          mocha.grep(grep);
        }

        // Collect test results
        const results = {
          passed: [],
          failed: [],
          startTime: Date.now()
        };

        // Set up custom reporter to capture results
        if (window.mocha) {
          mocha.reporter(function CustomReporter(runner) {
            runner.on('pass', (test) => {
              results.passed.push({
                title: test.fullTitle(),
                duration: test.duration
              });
            });

            runner.on('fail', (test, error) => {
              results.failed.push({
                title: test.fullTitle(),
                duration: test.duration,
                error: {
                  name: error.name || 'Error',
                  message: error.message || String(error),
                  stack: error.stack || null
                }
              });
            });
          });
        }

        context.logActivity('info', 'Executing tests...');

        // Run the tests and wait for completion
        const failures = await new Promise((resolve, reject) => {
          if (!window.mocha) {
            reject(new Error('Mocha not loaded'));
            return;
          }

          try {
            mocha.run((failureCount) => {
              resolve(failureCount);
            });
          } catch (error) {
            reject(error);
          }
        });

        results.endTime = Date.now();
        results.totalDuration = results.endTime - results.startTime;

        context.logActivity('success', `Tests completed: ${results.passed.length} passed, ${results.failed.length} failed`);

        // Format and return results
        return this.formatTestResults(results, errorsOnly, testPath, grep);

      } catch (error) {
        context.logActivity('error', `Test execution failed: ${error.message}`);
        throw new Error(`Failed to run tests: ${error.message}`);
      }
    },

    /**
     * Find existing MCP test runner or create a new one
     */
    async findOrCreateTestRunner(context) {
      // Look for existing test runner with MCP label
      const existingRunners = document.querySelectorAll('lively-testrunner');
      for (let runner of existingRunners) {
        if (runner.getAttribute('data-mcp-label') === 'test-runner') {
          context.logActivity('info', 'Using existing MCP test runner');
          return runner;
        }
      }

      // Create new test runner if none found
      context.logActivity('info', 'Creating new MCP test runner');
      const runner = await lively.openComponentInWindow('lively-testrunner');

      // Label it for future use
      if (runner && runner.tagName === 'LIVELY-TESTRUNNER') {
        runner.setAttribute('data-mcp-label', 'test-runner');
      } else if (runner && runner.childNodes) {
        // If runner is a window, find the actual component inside
        const actualRunner = runner.querySelector('lively-testrunner');
        if (actualRunner) {
          actualRunner.setAttribute('data-mcp-label', 'test-runner');
        }
      }

      return runner;
    },

    /**
     * Format test results for MCP response
     */
    formatTestResults(results, errorsOnly, testPath, grep) {
      const { passed, failed, totalDuration } = results;
      const totalTests = passed.length + failed.length;

      let output = [];

      if (errorsOnly) {
        // Minimal output mode - only show failures
        if (failed.length === 0) {
          output.push(`✅ All ${totalTests} tests passed in ${testPath}`);
          if (grep) {
            output.push(`   Filtered by: ${grep}`);
          }
        } else {
          output.push(`❌ ${failed.length} test${failed.length > 1 ? 's' : ''} failed out of ${totalTests} total`);
          if (grep) {
            output.push(`   Filtered by: ${grep}`);
          }
          output.push('');

          failed.forEach((test, index) => {
            output.push(`**FAILED ${index + 1}:** ${test.title}`);
            output.push(`   ${test.error.name}: ${test.error.message}`);

            // Include first few lines of stack trace
            if (test.error.stack) {
              const stackLines = test.error.stack.split('\n').slice(1, 4);
              if (stackLines.length > 0) {
                output.push('   ```');
                stackLines.forEach(line => output.push(`   ${line.trim()}`));
                output.push('   ```');
              }
            }
            output.push('');
          });
        }
      } else {
        // Full output mode
        output.push(`# Test Results: ${testPath}`);
        if (grep) {
          output.push(`Filtered by: \`${grep}\``);
        }
        output.push('');
        output.push(`✅ ${passed.length} test${passed.length !== 1 ? 's' : ''} passed`);
        output.push(`❌ ${failed.length} test${failed.length !== 1 ? 's' : ''} failed`);
        output.push(`⏱️  Total time: ${totalDuration}ms`);
        output.push('');

        if (failed.length > 0) {
          output.push('## Failures');
          output.push('');

          failed.forEach((test, index) => {
            output.push(`### ${index + 1}. ${test.title}`);
            output.push(`**Duration:** ${test.duration}ms`);
            output.push(`**Error:** ${test.error.name}: ${test.error.message}`);

            if (test.error.stack) {
              output.push('');
              output.push('**Stack trace:**');
              output.push('```');
              output.push(test.error.stack);
              output.push('```');
            }
            output.push('');
          });
        }

        if (passed.length > 0 && failed.length === 0) {
          output.push('## All Tests Passed');
          output.push('');
          passed.forEach((test, index) => {
            output.push(`${index + 1}. ✅ ${test.title} (${test.duration}ms)`);
          });
        }
      }

      return output.join('\n');
    }
  }

};

/**
 * Extract tool definitions with metadata for MCP server discovery
 * @returns {Array} Array of tool definitions with name, description, and inputSchema
 */
export function getToolDefinitions() {
  return Object.keys(Tools).map(name => ({
    name,
    description: Tools[name].metadata.description,
    inputSchema: Tools[name].metadata.inputSchema
  }));
}