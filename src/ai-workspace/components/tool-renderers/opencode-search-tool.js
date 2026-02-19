import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

/**
 * Intermediate base class for search-style tool renderers (grep, glob, etc.)
 * that render as a <details> block driven by getSummary() + renderBody().
 *
 * Extends OpenCodeBaseTool — inherits createMarkdownEl, buildDetails,
 * and the standard renderToolUse / renderToolResult / renderToolStreaming.
 *
 * Subclasses must implement:
 *   - matches(part) -> boolean
 *   - getSummary(input, output) -> string   short label for the <summary> line
 *   - async renderBody(input, output, showDebug) -> HTMLElement[]
 *       elements to append inside the <details> after the optional debug block
 *
 * Subclasses may override:
 *   - getIcon() -> string   emoji prefix (default '🔍')
 */
export class OpenCodeSearchTool extends OpenCodeBaseTool {

  getIcon() { return '🔍'; }

  getSummary(/*input, output*/) { return ''; }

  async renderBody(/*input, output, showDebug*/) { return []; }

  // ── renderCompact / renderCompactStreaming via shared dispatch ────────────

  async renderCompact(part, result, showDebug) {
    return this._renderCompactDetails(part, result, showDebug, false);
  }

  async renderCompactStreaming(part, showDebug) {
    return this._renderCompactDetails(part, null, showDebug, true);
  }

  async _renderCompactDetails(part, result, showDebug, isStreaming) {
    const input  = isStreaming ? (part.state?.input  || {}) : (part.input || {});
    const output = isStreaming ? (part.state?.output || '') : ToolHelpers.extractResultContent(result);
    const toolId = isStreaming ? part.callID : part.id;

    if (!toolId) {
      console.warn(`${this.constructor.name}._renderCompactDetails: toolId is missing`, part);
    }

    const summaryText = `${this.getIcon()} ${this.getSummary(input, output)}`;
    const debugLabel  = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(toolId, summaryText, input, showDebug, debugLabel);

    const bodyEls = await this.renderBody(input, output, showDebug);
    for (const el of bodyEls) {
      details.appendChild(el);
    }

    return details;
  }
}
