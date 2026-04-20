import * as ToolHelpers from '../chat-tool-helpers.js';

/**
 * Universal base class for all tool renderers.
 *
 * Provides:
 *   - parsePart()          normalizes streaming/non-streaming data structures
 *   - createMarkdownEl()   shared factory for lively-markdown elements
 *   - buildDetails()       builds a <details class="compact-tool-call"> wrapper
 *   - renderToolUse        delegates to render() with isStreaming=false
 *   - renderToolResult     returns null (already rendered in renderToolUse)
 *   - renderToolStreaming  delegates to render() with isStreaming=true
 *                          when status === 'completed', otherwise returns null
 *
 * Subclasses must implement:
 *   - matches(part) -> boolean
 *   - async render(part, result, showDebug, isStreaming) -> HTMLElement
 */
export class OpenCodeBaseTool {

  matches(/*part*/) { return false; }

  /**
   * Main rendering hook that subclasses override.
   * Use this.parsePart(part, result) to extract normalized data.
   * 
   * @param {object} part - The tool use part
   * @param {object} result - The tool result (null for streaming)
   * @param {boolean} showDebug - Whether to show debug information
   * @param {boolean} isStreaming - True if rendering streaming format
   * @returns {HTMLElement} The rendered element
   */
  async render(/*part, result, showDebug, isStreaming*/) { return null; }

  // ── shared helpers ───────────────────────────────────────────────────────

  /**
   * Parse part data from either streaming or non-streaming format.
   * Normalizes the different data structures into a single data object.
   * 
   * @param {object} part - The tool use part (streaming or non-streaming)
   * @param {object} result - The tool result (null for streaming)
   * @returns {object} data object with: input, output, toolId, isError
   */
  parsePart(part, result) {
    const data = {};
    const isStreamingFormat = part.state !== undefined;
    
    data.input = isStreamingFormat ? (part.state?.input || {}) : (part.input || {});
    data.output = isStreamingFormat 
      ? (part.state?.output || '') 
      : (result ? ToolHelpers.extractResultContent(result) : '');
    data.toolId = isStreamingFormat ? part.callID : part.id;
    data.isError = result?.is_error || false;
    
    return data;
  }

  /**
   * Create an initialized lively-markdown element with content set.
   */
  async createMarkdownEl(markdownText) {
    const md = await lively.create('lively-markdown');
    md.setAttribute('preserve-whitespace', '');
    await md.setContent(markdownText);
    return md;
  }

  /**
   * Create a <pre><code> element with safely escaped text.
   * Prefer this over fenced code blocks in markdown when the content may
   * contain HTML tags (e.g. grep/read output from source files), since
   * lively-markdown renders with html:true and textContent always escapes.
   */
  makeCodeBlock(text) {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = text;
    pre.appendChild(code);
    return pre;
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
    return this.render(part, result, component.showDebug, false);
  }

  renderToolResult(/*part, component*/) {
    return null; // already rendered in renderToolUse
  }

  async renderToolStreaming(part, component) {
    if (part.state?.status === 'completed') {
      return this.render(part, null, component.showDebug, true);
    }
    return null; // fall back to generic renderer
  }
}
