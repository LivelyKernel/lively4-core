/*MD
# CompositeToolset

Combines multiple toolsets into unified interface.
Allows components to compose different tool capabilities as needed.

MD*/
export class CompositeToolset {
  constructor(...toolsets) {
    this.toolsets = toolsets;
  }

  getDefinitions() {
    return this.toolsets.flatMap(toolset => toolset.getDefinitions());
  }

  async execute(toolName, args) {
    for (const toolset of this.toolsets) {
      if (toolset.tools && toolset.tools[toolName]) {
        return await toolset.execute(toolName, args);
      }
    }
    throw new Error(`Unknown tool: ${toolName}`);
  }
}
