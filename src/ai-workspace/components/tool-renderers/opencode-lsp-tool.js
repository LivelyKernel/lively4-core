import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for LSP tool (lsp) — experimental flag required
// Operations: goToDefinition, findReferences, hover, documentSymbol,
//             workspaceSymbol, goToImplementation, prepareCallHierarchy,
//             incomingCalls, outgoingCalls
// Input: { operation, filePath, line, character }
// Output: structured text (location, symbol list, hover docs)
export class OpenCodeLspTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'lsp';
  }

  operationIcon(op) {
    const icons = {
      goToDefinition:       '→',
      goToImplementation:   '⇒',
      findReferences:       '🔗',
      hover:                'ℹ️',
      documentSymbol:       '📑',
      workspaceSymbol:      '🗂️',
      prepareCallHierarchy: '📞',
      incomingCalls:        '↙️',
      outgoingCalls:        '↗️',
    };
    return icons[op] || '🔍';
  }

  buildSummary(input) {
    const op = input.operation || 'lsp';
    const filePath = input.filePath || '';
    const fileName = ToolHelpers.getFileName(filePath);
    const icon = this.operationIcon(op);
    const loc = (input.line && input.character)
      ? `:${input.line}:${input.character}`
      : '';
    return `${icon} ${op} ${fileName}${loc}`;
  }

  async render(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    
    if (!data.toolId) {
      console.warn('OpenCodeLspTool.render: toolId is missing', part);
    }

    const summary = this.buildSummary(data.input);
    const debugLabel = isStreaming ? 'Input' : undefined;
    const details = await this.buildDetails(data.toolId, summary, data.input, showDebug, debugLabel);

    if (data.output && !data.isError) {
      // Output is usually a list of locations or hover markdown
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${data.output}\n\`\`\``));
    }
    if (data.isError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${data.output}\n\`\`\``));
    }

    return details;
  }
}
