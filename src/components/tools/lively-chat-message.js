import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyChatMessage extends Morph {
  async initialize() {
    this.windowTitle = "Chat Message";

    // Store message data
    this._messageData = this._messageData || null;
    this._isExpanded = this._isExpanded || false;

    // Get references to elements
    this.debugHeader = this.get("#debugHeader");
    this.contentDiv = this.get("#content");
    this.markdown = this.get("lively-markdown");
    this.expandIndicator = this.get("#expandIndicator");

    // Setup click handler for tool messages
    this.addEventListener('click', (evt) => this.onMessageClick(evt));
  }

  /**
   * Set or update the message content from a JSON object
   * @param {Object} messageObj - Message data object
   * @param {string} messageObj.role - Message role (user/assistant/tool)
   * @param {string} messageObj.content - Message content text
   * @param {string} [messageObj.source] - Source of message (audio/code)
   * @param {string} [messageObj.streamType] - Stream type (realtime/opencode)
   * @param {number} [messageObj.sequence] - Message sequence number
   * @param {string} [messageObj.type] - Message type
   * @param {string} [messageObj.timestamp] - ISO timestamp or timestamp number
   * @param {Object} [messageObj.metadata] - Additional metadata
   * @param {string} [messageObj.sessionId] - Session identifier
   * @param {string} [messageObj.conversationId] - Conversation identifier
   * @param {string} [messageObj.colorMode] - Color mode ('default' or 'voice-proxy')
   */
  async setMessage(messageObj) {
    if (!messageObj) {
      console.warn("setMessage called with null/undefined message");
      return;
    }

    this._messageData = messageObj;

    // Set attributes for styling
    if (messageObj.role) {
      this.setAttribute('role', messageObj.role);
    }
    if (messageObj.source) {
      this.setAttribute('source', messageObj.source);
    }
    if (messageObj.streamType) {
      this.setAttribute('stream-type', messageObj.streamType);
    }
    if (messageObj.colorMode) {
      this.setAttribute('color-mode', messageObj.colorMode);
    }

    // Apply horizontal positioning class
    this.applyPositioning(messageObj);

    // Render debug header
    this.renderDebugHeader(messageObj);

    // Render content
    await this.renderContent(messageObj);
  }

  /**
   * Apply horizontal positioning based on role and source
   * - User (audio) → left
   * - Assistant (audio) → mid-left
   * - User/tool (code) → mid-right
   * - Assistant (code) → right
   */
  applyPositioning(messageObj) {
    // Remove all existing position classes
    this.classList.remove('position-left', 'position-mid-left', 'position-mid-right', 'position-right');

    const role = messageObj.role;
    const source = messageObj.source;

    if (source === 'audio') {
      if (role === 'user') {
        this.classList.add('position-left');
      } else if (role === 'assistant') {
        this.classList.add('position-mid-left');
      } else if (role === 'tool') {
        this.classList.add('position-mid-left'); // Tool messages from audio go mid-left
      }
    } else if (source === 'code') {
      if (role === 'user' || role === 'tool') {
        this.classList.add('position-mid-right');
      } else if (role === 'assistant') {
        this.classList.add('position-right');
      }
    }
  }

  /**
   * Render the debug header with message metadata
   */
  renderDebugHeader(messageObj) {
    const showDebug = this.getAttribute('show-debug') !== 'false';

    if (!showDebug) {
      this.debugHeader.classList.add('hidden');
      return;
    }

    this.debugHeader.classList.remove('hidden');

    const parts = [];

    // Sequence number
    if (messageObj.sequence !== undefined) {
      parts.push(`<span class="debug-item"><span class="debug-label">#</span>${messageObj.sequence}</span>`);
    }

    // Role
    if (messageObj.role) {
      parts.push(`<span class="debug-item"><span class="debug-label">role:</span> ${messageObj.role}</span>`);
    }

    // Type
    if (messageObj.type) {
      parts.push(`<span class="debug-item"><span class="debug-label">type:</span> ${messageObj.type}</span>`);
    }

    // Timestamp
    if (messageObj.timestamp) {
      const timeStr = this.formatTimestamp(messageObj.timestamp);
      parts.push(`<span class="debug-item"><span class="debug-label">ts:</span> ${timeStr}</span>`);
    }

    // Source
    if (messageObj.source) {
      parts.push(`<span class="debug-item"><span class="debug-label">source:</span> ${messageObj.source}</span>`);
    }

    // Stream type
    if (messageObj.streamType) {
      parts.push(`<span class="debug-item"><span class="debug-label">stream:</span> ${messageObj.streamType}</span>`);
    }

    // Session/Conversation IDs (abbreviated)
    if (messageObj.sessionId) {
      const shortId = messageObj.sessionId.substring(0, 8);
      parts.push(`<span class="debug-item"><span class="debug-label">session:</span> ${shortId}...</span>`);
    }
    if (messageObj.conversationId) {
      const shortId = messageObj.conversationId.substring(0, 8);
      parts.push(`<span class="debug-item"><span class="debug-label">conv:</span> ${shortId}...</span>`);
    }

    // Metadata (if present and not empty)
    if (messageObj.metadata && Object.keys(messageObj.metadata).length > 0) {
      const metaStr = JSON.stringify(messageObj.metadata);
      const shortMeta = metaStr.length > 50 ? metaStr.substring(0, 47) + '...' : metaStr;
      parts.push(`<span class="debug-item"><span class="debug-label">meta:</span> ${this.escapeHtml(shortMeta)}</span>`);
    }

    this.debugHeader.innerHTML = parts.join(' | ');
  }

  /**
   * Render the message content
   */
  async renderContent(messageObj) {
    let content = messageObj.content || '';

    // Format user messages with quotes (matching current behavior)
    if (messageObj.role === 'user') {
      content = `"${content}"`;
    }

    // For tool messages, create structured display
    if (messageObj.role === 'tool' && messageObj.metadata) {
      content = this.formatToolMessage(messageObj);
    }

    // Set markdown content
    if (this.markdown) {
      await this.markdown.setContent(content);
    }

    // For tool messages, check if content is long and should be collapsible
    if (messageObj.role === 'tool') {
      this.updateExpandState();
    }
  }

  /**
   * Format tool message with structured information
   */
  formatToolMessage(messageObj) {
    const metadata = messageObj.metadata || {};
    const type = messageObj.type || 'tool';

    let formatted = '';

    // Tool Use (function call)
    if (type === 'tool_use' && metadata.toolName) {
      formatted += `### 🔧 Tool Call: ${metadata.toolName}\n\n`;

      if (metadata.input && Object.keys(metadata.input).length > 0) {
        formatted += '**Arguments:**\n```json\n';
        formatted += JSON.stringify(metadata.input, null, 2);
        formatted += '\n```\n';
      }

      if (metadata.toolId) {
        formatted += `\n*Call ID: ${metadata.toolId}*\n`;
      }
    }
    // Tool Result
    else if (type === 'tool_result') {
      formatted += `### ↩️ Tool Result\n\n`;

      if (metadata.isError) {
        formatted += '**⚠️ Error:**\n';
      }

      // Try to parse and format the content
      const content = messageObj.content || '';

      // Check if content looks like it has markdown code blocks already
      if (content.includes('```')) {
        formatted += content;
      } else {
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(content);
          formatted += '```json\n';
          formatted += JSON.stringify(parsed, null, 2);
          formatted += '\n```\n';
        } catch (e) {
          // Not JSON, show as plain text in code block
          formatted += '```\n';
          formatted += content;
          formatted += '\n```\n';
        }
      }

      if (metadata.toolId) {
        formatted += `\n*Call ID: ${metadata.toolId}*\n`;
      }
    }
    // Live tool execution
    else if (type === 'tool_live') {
      formatted += `### 🔧 ${metadata.toolName || 'Tool'}\n\n`;
      formatted += `**Status:** ${metadata.state || 'unknown'}\n`;

      if (metadata.callId) {
        formatted += `\n*Call ID: ${metadata.callId}*\n`;
      }
    }
    // Function call from realtime API
    else if (metadata.type === 'function_call' && metadata.functionName) {
      formatted += `### 🔧 Function Call: ${metadata.functionName}\n\n`;

      if (metadata.arguments) {
        formatted += '**Arguments:**\n```json\n';
        formatted += JSON.stringify(metadata.arguments, null, 2);
        formatted += '\n```\n';
      }

      if (metadata.call_id) {
        formatted += `\n*Call ID: ${metadata.call_id}*\n`;
      }
    }
    // Function call output from realtime API
    else if (metadata.type === 'function_call_output') {
      formatted += `### ↩️ Function Result\n\n`;

      if (metadata.output) {
        formatted += '```json\n';
        formatted += JSON.stringify(metadata.output, null, 2);
        formatted += '\n```\n';
      }

      if (metadata.call_id) {
        formatted += `\n*Call ID: ${metadata.call_id}*\n`;
      }
    }
    // Fallback: use original content
    else {
      formatted = messageObj.content || '';
    }

    return formatted;
  }

  /**
   * Update expand/collapse state for tool messages
   */
  updateExpandState() {
    if (!this.contentDiv || !this.expandIndicator) return;

    // Check if content is taller than collapsed height
    const contentHeight = this.contentDiv.scrollHeight;
    const isLong = contentHeight > 100;

    if (isLong) {
      if (!this._isExpanded) {
        this.contentDiv.classList.add('collapsed');
        this.expandIndicator.style.display = 'block';
        this.expandIndicator.textContent = '▼ Click to expand';
      } else {
        this.contentDiv.classList.remove('collapsed');
        this.expandIndicator.style.display = 'block';
        this.expandIndicator.textContent = '▲ Click to collapse';
      }
    } else {
      // Content is short, no need for expand/collapse
      this.contentDiv.classList.remove('collapsed');
      this.expandIndicator.style.display = 'none';
    }
  }

  /**
   * Handle click on message
   */
  onMessageClick(evt) {
    // Only handle clicks on tool messages
    if (this._messageData && this._messageData.role === 'tool') {
      this._isExpanded = !this._isExpanded;
      this.updateExpandState();
      evt.stopPropagation();
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    try {
      const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);

      // Format as HH:MM:SS.mmm
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const millis = String(date.getMilliseconds()).padStart(3, '0');

      return `${hours}:${minutes}:${seconds}.${millis}`;
    } catch (e) {
      return String(timestamp);
    }
  }

  /**
   * Escape HTML for safe rendering
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get the current message data
   */
  getMessageData() {
    return this._messageData;
  }

  /**
   * Example usage
   */
  async livelyExample() {
    this.style.border = "1px solid gray";
    this.style.padding = "10px";

    await this.setMessage({
      role: 'user',
      content: 'Hello, this is a test message!',
      source: 'audio',
      streamType: 'realtime',
      sequence: 1,
      type: 'message',
      timestamp: Date.now(),
      metadata: { test: true }
    });
  }

  /**
   * Handle live migration during development
   */
  livelyMigrate(other) {
    this._messageData = other._messageData;
    this._isExpanded = other._isExpanded;
  }
}
