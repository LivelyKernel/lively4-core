import * as ToolHelpers from '../chat-tool-helpers.js';

/**
 * Base class for Vox (voice agent) tool renderers.
 * 
 * Similar to OpenCodeBaseTool but adapted for the vox message structure:
 * - Messages have role='tool' with metadata containing tool information
 * - Tool calls: metadata = { type: 'function_call', functionName, call_id, arguments }
 * - Tool results: metadata = { type: 'function_call_output', call_id, output }
 * 
 * Subclasses must implement:
 *   - matches(messageObj) -> boolean
 *   - async renderToolCall(messageObj, showDebug) -> HTMLElement
 *   - async renderToolResult(messageObj, showDebug) -> HTMLElement
 */
export class VoxBaseTool {

  matches(/*messageObj*/) { return false; }

  async renderToolCall(/*messageObj, showDebug*/) { return null; }

  async renderToolResult(/*messageObj, showDebug*/) { return null; }

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
   * Create a <pre><code> element with safely escaped text.
   */
  makeCodeBlock(text) {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = text;
    pre.appendChild(code);
    return pre;
  }

  /**
   * Build a <details class="compact-tool-call"> with summary text and optional debug info.
   */
  async buildDetails(toolId, summaryText, input, showDebug, debugLabel = 'Arguments') {
    const details = <details class="compact-tool-call" {...(toolId ? {"data-tool-id": toolId} : {})}>
      <summary>{summaryText}</summary>
    </details>;

    if (showDebug && input) {
      details.appendChild(await this.createMarkdownEl(
        `**${debugLabel}:**\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``
      ));
    }

    return details;
  }
}
