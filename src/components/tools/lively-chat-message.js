import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyChatMessage extends Morph {
  async initialize() {
    this.windowTitle = "Chat Message";

    // Store message data
    this._isExpanded = this._isExpanded || false;
    this._showRaw = this._showRaw || false;

    // Get references to elements
    this.debugHeader = this.get("#debugHeader");
    this.contentDiv = this.get("#content");
    this.markdown = this.get("lively-markdown");
    this.expandIndicator = this.get("#expandIndicator");
    this.viewRawButton = this.get("#viewRawButton");
    this.rawDisplay = this.get("#rawDisplay");
    this.rawJson = this.get("#rawJson");

    // Setup click handler for tool messages
    this.addEventListener('click', (evt) => this.onMessageClick(evt));

    this.registerButtons()
    this.setMessage(this._messageData || null)
  }

  get showDebug() {
    return this._showDebug
  }

  
  set showDebug(bool) {
    this._showDebug = bool
    this.renderDebugHeader(this._messageData );
  }

  
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
   * Set message from raw API format (OpenCode API format with info and parts)
   * This is simpler than setMessage() - just store raw data and render parts
   */
  async setRawMessage(rawMessage, options = {}) {
    if (!rawMessage) {
      console.warn("setRawMessage called with null/undefined message");
      return;
    }

    // Store the complete raw message for debugging
    this._rawMessage = rawMessage;
    this._messageData = rawMessage; // Also store as _messageData for compatibility

    const { source = 'code', streamType = 'opencode' } = options;

    // Extract role from info
    const role = rawMessage.info?.role || 'assistant';

    // Set attributes for styling
    this.setAttribute('role', role);
    this.setAttribute('source', source);
    this.setAttribute('stream-type', streamType);

    // Apply horizontal positioning
    this.applyPositioning({ role, source });


    // Render debug header with raw message info
    this.renderRawDebugHeader(rawMessage);

    // Render all parts from the message
    await this.renderRawParts(rawMessage);

    // Update raw display state
    this.updateRawDisplay();
  }


  onInspect() {
    lively.openInspector(this._messageData)
  }

  onViewRawButton() {
    this._showRaw = !this._showRaw;
    this.updateRawDisplay();
  }

  updateRawDisplay() {
    if (!this.rawDisplay || !this.rawJson) return;

    if (this._showRaw && this._rawMessage) {
      this.rawDisplay.style.display = 'block';
      this.rawJson.textContent = JSON.stringify(this._rawMessage, null, 2);
      this.viewRawButton.textContent = 'Hide Raw';
    } else {
      this.rawDisplay.style.display = 'none';
      this.rawJson.textContent = ""
      this.viewRawButton.textContent = 'View Raw';
    }
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
    if (!this.showDebug) {
      this.get("#container").querySelectorAll(".debug").forEach( ea => ea.classList.add('hidden'))
      return;
    }
    this.get("#container").querySelectorAll(".debug").forEach( ea => ea.classList.remove('hidden'))
    this.debugHeader.innerHTML = ["role", "type", "timestamp", "source", "streamType"]
      .filter(ea => messageObj[ea])
      .map(ea => `<span class="debug-item"><span class="debug-label">${ea}</span> ${messageObj[ea]}</span>`)
      .join(' | ');
  }

  /**
   * Render debug header for raw message format
   */
  renderRawDebugHeader(rawMessage) {
    if (!this.showDebug) {
      this.debugHeader.classList.add('hidden');
      this.get("#inspect").classList.add('hidden')
      return;
    }
    this.debugHeader.classList.remove('hidden');
    this.get("#inspect").classList.remove('hidden')

    const info = rawMessage.info || {};
    const parts = rawMessage.parts || [];

    this.debugHeader.innerHTML = [
      `<span class="debug-item"><span class="debug-label">id</span> ${info.id || 'unknown'}</span>`,
      `<span class="debug-item"><span class="debug-label">role</span> ${info.role || 'unknown'}</span>`,
      `<span class="debug-item"><span class="debug-label">parts</span> ${parts.length}</span>`,
      `<span class="debug-item"><span class="debug-label">types</span> ${parts.map(p => p.type).join(', ')}</span>`
    ].join(' | ');
  }

  /**
   * Render all parts from a raw message
   */
  async renderRawParts(rawMessage) {
    const parts = rawMessage.parts || [];
    const info = rawMessage.info || {};

    if (parts.length === 0) {
      this.markdown.setContent('*(empty message)*');
      return;
    }

    // Combine all parts into a single markdown document
    let combinedContent = '';

    for (const part of parts) {
      if (part.type === 'text') {
        // Simple text part
        combinedContent += part.text + '\n\n';
      } else if (part.type === 'tool_use') {
        // Format tool call
        combinedContent += `### 🔧 Tool Call: ${part.name}\n\n`;
        if (part.input && Object.keys(part.input).length > 0) {
          combinedContent += '**Arguments:**\n```json\n';
          combinedContent += JSON.stringify(part.input, null, 2);
          combinedContent += '\n```\n\n';
        }
        if (part.id) {
          combinedContent += `*Call ID: ${part.id}*\n\n`;
        }
      } else if (part.type === 'tool_result') {
        // Format tool result
        combinedContent += `### ↩️ Tool Result\n\n`;
        if (part.is_error) {
          combinedContent += '**⚠️ Error:**\n';
        }

        // Handle different content formats
        let content = '';
        if (typeof part.content === 'string') {
          content = part.content;
        } else if (Array.isArray(part.content)) {
          // Content blocks (text, image, etc.)
          content = part.content
            .map(block => {
              if (block.type === 'text') return block.text;
              if (block.type === 'image') return '[Image]';
              return JSON.stringify(block);
            })
            .join('\n');
        } else {
          content = JSON.stringify(part.content);
        }

        // Format content in code block
        if (content.includes('```')) {
          combinedContent += content + '\n\n';
        } else {
          try {
            const parsed = JSON.parse(content);
            combinedContent += '```json\n';
            combinedContent += JSON.stringify(parsed, null, 2);
            combinedContent += '\n```\n\n';
          } catch (e) {
            combinedContent += '```\n';
            combinedContent += content;
            combinedContent += '\n```\n\n';
          }
        }

        if (part.tool_use_id) {
          combinedContent += `*Tool Use ID: ${part.tool_use_id}*\n\n`;
        }
      } else if (part.type === 'tool') {
        // Temporary tool status (from streaming events)
        const toolName = part.tool || 'Tool';
        const state = part.state?.status || 'unknown';

        combinedContent += `### 🔧 ${toolName}\n\n`;
        combinedContent += `**Status:** ${state}\n\n`;

        if (part.callID) {
          combinedContent += `*Call ID: ${part.callID}*\n\n`;
        }
      } else {
        // Unknown part type - show as JSON
        combinedContent += `### ⚠️ Unknown Part Type: ${part.type}\n\n`;
        combinedContent += '```json\n';
        combinedContent += JSON.stringify(part, null, 2);
        combinedContent += '\n```\n\n';
      }
    }

    // Render the combined content
    if (this.markdown) {
      await this.markdown.setContent(combinedContent.trim());
    }
  }


  async renderContent(messageObj) {
    let content = messageObj.content || '';

    // Format user messages with quotes (matching current behavior)
    if (messageObj.role === 'user') {
      content = `"${content}"`;
    }

    // For tool messages, create structured display
    if (messageObj.role === 'tool' && messageObj.metadata) {
      content = this.formatToolMessage(messageObj);

      // If formatToolMessage returns null, hide this message completely
      if (content === null) {
        this.style.display = 'none';
        return;
      }
    }

    // Show the message (in case it was hidden before)
    this.style.display = '';

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
   * Check if a function call is an internal/local coordination function
   */
  isLocalFunction(functionName) {
    const localFunctions = [
      'send_opencode_task',
      'get_opencode_status',
      'get_opencode_history',
      'create_opencode_session',
      'list_opencode_sessions'
    ];
    return localFunctions.includes(functionName);
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
    // Function call from realtime API - hide if local/internal
    else if (metadata.type === 'function_call' && metadata.functionName) {
      // Hide local coordination functions
      if (this.isLocalFunction(metadata.functionName)) {
        return null; // Signal to hide this message
      }

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
    // Function call output from realtime API - hide if local/internal
    else if (metadata.type === 'function_call_output') {
      // Check if this is output from a local function
      // We need to check the function name from the call_id or store it
      // For now, we'll check if the output references local functions
      if (metadata.functionName && this.isLocalFunction(metadata.functionName)) {
        return null; // Signal to hide this message
      }

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
    this._rawMessage = other._rawMessage;
    this._showRaw = other._showRaw;
  }
}
