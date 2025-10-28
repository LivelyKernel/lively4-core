import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyChatMessage extends Morph {
  async initialize() {
    this.windowTitle = "Chat Message";

    // Store message data
    this._isExpanded = this._isExpanded || false;

    // Get references to elements
    this.debugHeader = this.get("#debugHeader");
    this.contentDiv = this.get("#content");
    this.markdown = this.get("lively-markdown");
    this.expandIndicator = this.get("#expandIndicator");

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

  
  onInspect() {
    lively.openInspector(this._messageData)
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
      this.debugHeader.classList.add('hidden');
      this.get("#inspect").classList.add('hidden')
      return;
    }
    this.debugHeader.classList.remove('hidden');
    this.get("#inspect").classList.remove('hidden')
    this.debugHeader.innerHTML = ["role", "type", "timestamp", "source", "streamType"]
      .filter(ea => messageObj[ea])
      .map(ea => `<span class="debug-item"><span class="debug-label">${ea}</span> ${messageObj[ea]}</span>`)
      .join(' | ');
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
  }
}
