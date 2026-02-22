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

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeLspTool.renderCompact: part.id is missing', part);

    const rawOutput = ToolHelpers.extractResultContent(result);
    const hasError = result && result.is_error;
    const summary = this.buildSummary(input);

    const details = await this.buildDetails(toolId, summary, input, showDebug);

    if (rawOutput && !hasError) {
      // Output is usually a list of locations or hover markdown
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${rawOutput}\n\`\`\``));
    }
    if (hasError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${rawOutput}\n\`\`\``));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeLspTool.renderCompactStreaming: part.callID is missing', part);

    const summary = this.buildSummary(input);
    const details = await this.buildDetails(toolId, summary, input, showDebug, 'Input');

    if (output) {
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${output}\n\`\`\``));
    }

    return details;
  }
}
