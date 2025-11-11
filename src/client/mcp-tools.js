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

};