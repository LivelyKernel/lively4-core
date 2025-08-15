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
   */
  'evaluate-code': {
    async execute(args, context) {
      const { code } = args;
      context.logActivity('request', `Evaluating: ${code.substring(0, 50)}${code.length > 50 ? '...' : ''}`);
      
      try {
        // Use boundEval for proper evaluation with SystemJS support
        const evalResult = await boundEval(code, this, lively4url + "/");
        
        // Check if evaluation resulted in an error
        if (evalResult.isError) {
          throw evalResult.value;
        }
        
        let result = evalResult.value;
        
        // Convert result to string for transmission
        if (typeof result === 'object') {
          result = JSON.stringify(result, null, 2);
        } else if (result === undefined) {
          result = 'undefined';
        } else {
          result = String(result);
        }
        
        return result;
        
      } catch (error) {
        // Propagate the error so it gets handled by the calling code
        throw error;
      }
    }
  },

};