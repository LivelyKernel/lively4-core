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

  // ── Main rendering hook ────────────

  async render(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);

    if (!data.toolId) {
      console.warn(`${this.constructor.name}.render: toolId is missing`, part);
    }

    const summaryText = `${this.getIcon()} ${this.getSummary(data.input, data.output)}`;
    const debugLabel  = isStreaming ? 'Input' : 'Arguments';
    const details = await this.buildDetails(data.toolId, summaryText, data.input, showDebug, debugLabel);

    const bodyEls = await this.renderBody(data.input, data.output, showDebug);
    for (const el of bodyEls) {
      details.appendChild(el);
    }

    return details;
  }
}
