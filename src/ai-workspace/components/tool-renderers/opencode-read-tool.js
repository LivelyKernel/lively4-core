import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for Read tool (mcp_read, read_file, read)
// Displays file reads in a compact <details> block with syntax highlighting
export class OpenCodeReadTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'mcp_read' ||
           toolName === 'read_file' ||
           toolName === 'read';
  }

  async render(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    const filePath = data.input.filePath || data.input.path || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const rangeInfo = ToolHelpers.generateRangeInfo(data.input);
    const language = ToolHelpers.detectLanguage(fileName);
    const content = ToolHelpers.parseReadToolContent(data.output);

    if (!data.toolId) {
      console.warn('OpenCodeReadTool: toolId is missing', part);
    }

    const debugLabel = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(data.toolId, `📖 ${fileName}${rangeInfo}`, data.input, showDebug, debugLabel);

    if (content) {
      const label = showDebug ? '**Output:**\n' : '';
      details.appendChild(await this.createMarkdownEl(`${label}\`\`\`${language}\n${content}\n\`\`\``));
    }

    return details;
  }
}
