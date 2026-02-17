import * as ToolHelpers from '../chat-tool-helpers.js';

/**
 * Universal base class for all tool renderers.
 *
 * Provides:
 *   - createMarkdownEl()   shared factory for lively-markdown elements
 *   - buildDetails()       builds a <details class="compact-tool-call"> wrapper
 *   - renderToolUse        delegates to this.renderCompact(part, result, showDebug)
 *   - renderToolResult     returns null (already rendered in renderToolUse)
 *   - renderToolStreaming   delegates to this.renderCompactStreaming(part, showDebug)
 *                          when status === 'completed', otherwise returns null
 *
 * Subclasses must implement:
 *   - matches(part) -> boolean
 *   - async renderCompact(part, result, showDebug) -> HTMLElement
 *   - async renderCompactStreaming(part, showDebug) -> HTMLElement
 */
export class OpenCodeBaseTool {

  matches(/*part*/) { return false; }

  async renderCompact(/*part, result, showDebug*/) { return null; }

  async renderCompactStreaming(/*part, showDebug*/) { return null; }

  // ── shared helpers ───────────────────────────────────────────────────────

  /**
   * Create an initialized lively-markdown element with content set.
   */
  async createMarkdownEl(markdownText) {
    const md = await lively.create('lively-markdown');
    await md.setContent(markdownText);
    return md;
  }

  /**
   * Build a <details class="compact-tool-call"> with summary text and an
   * optional debug block showing the raw input as JSON.
   *
   * @param {string}  toolId       data-tool-id attribute value (or falsy)
   * @param {string}  summaryText  text inside <summary>
   * @param {object}  input        raw input object
   * @param {boolean} showDebug    whether to append the debug JSON block
   * @param {string}  debugLabel   'Arguments' or 'Input'
   * @returns {HTMLElement} the <details> element
   */
  async buildDetails(toolId, summaryText, input, showDebug, debugLabel = 'Arguments') {
    const details = <details class="compact-tool-call" {...(toolId ? {"data-tool-id": toolId} : {})}>
      <summary>{summaryText}</summary>
    </details>;

    if (showDebug) {
      details.appendChild(await this.createMarkdownEl(
        `**${debugLabel}:**\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``
      ));
    }

    return details;
  }

  // ── standard renderer protocol ───────────────────────────────────────────

  async renderToolUse(part, component) {
    const result = component.toolResultById[part.id];
    return this.renderCompact(part, result, component.showDebug);
  }

  renderToolResult(/*part, component*/) {
    return null; // already rendered in renderToolUse
  }

  async renderToolStreaming(part, component) {
    if (part.state?.status === 'completed') {
      return this.renderCompactStreaming(part, component.showDebug);
    }
    return null; // fall back to generic renderer
  }
}
