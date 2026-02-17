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

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const filePath = input.filePath || input.path || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const rangeInfo = ToolHelpers.generateRangeInfo(input);
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeReadTool.renderCompact: part.id is missing', part);
    const language = ToolHelpers.detectLanguage(fileName);
    const rawContent = ToolHelpers.extractResultContent(result);
    const content = ToolHelpers.parseReadToolContent(rawContent);

    const details = await this.buildDetails(toolId, `📖 ${fileName}${rangeInfo}`, input, showDebug);

    if (content) {
      const label = showDebug ? '**Output:**\n' : '';
      details.appendChild(await this.createMarkdownEl(`${label}\`\`\`${language}\n${content}\n\`\`\``));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const filePath = input.filePath || input.path || 'unknown';
    const fileName = ToolHelpers.getFileName(filePath);
    const rangeInfo = ToolHelpers.generateRangeInfo(input);
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeReadTool.renderCompactStreaming: part.callID is missing', part);
    const language = ToolHelpers.detectLanguage(fileName);
    const content = ToolHelpers.parseReadToolContent(output);

    const details = await this.buildDetails(toolId, `📖 ${fileName}${rangeInfo}`, input, showDebug, 'Input');

    if (content) {
      const label = showDebug ? '**Output:**\n' : '';
      details.appendChild(await this.createMarkdownEl(`${label}\`\`\`${language}\n${content}\n\`\`\``));
    }

    return details;
  }
}
