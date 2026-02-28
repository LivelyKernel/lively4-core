/*MD
# CompositeToolset

Combines multiple toolsets into unified interface.
Allows components to compose different tool capabilities as needed.

MD*/

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
