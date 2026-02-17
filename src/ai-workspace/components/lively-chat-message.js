import Morph from 'src/components/widgets/lively-morph.js';
import * as ToolHelpers from './chat-tool-helpers.js';
import { OpenCodeReadTool } from './tool-renderers/opencode-read-tool.js';
import { OpenCodeEditTool } from './tool-renderers/opencode-edit-tool.js';
import { OpenCodeBashTool } from './tool-renderers/opencode-bash-tool.js';
import { OpenCodeGrepTool } from './tool-renderers/opencode-grep-tool.js';
import { OpenCodeGenericTool } from './tool-renderers/opencode-generic-tool.js';

export default class LivelyChatMessage extends Morph {
  async initialize() {
    this.windowTitle = "Chat Message";

    // Store message data
    this._isExpanded = this._isExpanded || false;
    this._showRaw = this._showRaw || false;

    // Register tool renderers - order matters! Generic should be last (fallback)
    this.toolRenderers = this.toolRenderers || [
      OpenCodeReadTool,
      OpenCodeEditTool,
      OpenCodeBashTool,
      OpenCodeGrepTool,
      // Add more specialized tool renderers here...
      OpenCodeGenericTool,  // Always last - catches everything
    ];

    // Get references to elements
    this.debugHeader = this.get("#debugHeader");
    this.contentDiv = this.get("#content");
    this.partsContainer = this.get("#partsContainer");
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
  
  get hasTools() {   
    return this.getAttribute("has-tools")
  }
  
  async setMessage(messageObj) {
    if (!messageObj) {
      // console.warn("setMessage called with null/undefined message");
      return;
    }

    this._messageData = messageObj;

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

    this.applyPositioning(messageObj);

    this.renderDebugHeader(messageObj);

    await this.renderContent(messageObj);
  }

  /**
   * Set message from OpenCode API format (with info and parts structure)
   * This is simpler than setMessage() - just store opencode message and render parts
   */
  async setOpenCodeMessage(opencodeMessage, options = {}) {
    if (!opencodeMessage) {
      console.warn("setOpenCodeMessage called with null/undefined message");
      return;
    }

    // Store the complete opencode message for debugging
    this._opencodeMessage = opencodeMessage;
    this._messageData = opencodeMessage; // Also store as _messageData for compatibility

    const { source = 'code', streamType = 'opencode' } = options;

    // Extract role from info
    const role = opencodeMessage.info?.role || 'assistant';

    // Check if message contains tool parts
    const parts = opencodeMessage.parts || [];
    const hasTools = parts.some(p =>
      p.type === 'tool' || p.type === 'tool_use' || p.type === 'tool_result'
    );

    this.setAttribute('role', role);
    this.setAttribute('source', source);
    this.setAttribute('stream-type', streamType);
    if (hasTools) {
      this.setAttribute('has-tools', 'true');
    } else {
      this.removeAttribute('has-tools');
    }

    this.applyPositioning({ role, source });


    this.renderOpenCodeDebugHeader(opencodeMessage);
    await this.renderOpenCodeParts(opencodeMessage);
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

    if (this._showRaw && this._opencodeMessage) {
      this.rawDisplay.style.display = 'block';
      this.rawJson.textContent = JSON.stringify(this._opencodeMessage, null, 2);
      this.viewRawButton.textContent = 'Hide Raw';
    } else {
      this.rawDisplay.style.display = 'none';
      this.rawJson.textContent = ""
      this.viewRawButton.textContent = 'View Raw';
    }
  }

  applyPositioning(messageObj) {
    // Remove all existing position classes
    this.classList.remove('position-left', 'position-mid-left', 'position-mid-right', 'position-right');
    this.classList.remove('audio-user', 'audio-tool', 'audio-assistant');
    this.classList.remove('code-user', 'code-tool', 'code-assistant');

    const role = this.role;
    const source = messageObj.source;

    if (source === 'audio') {
      if (role === 'user') {
        this.classList.add('audio-user');
      } else if (role === 'tool') {
        this.classList.add('audio-tool'); 
      } else if (role === 'assistant') {
        this.classList.add('audio-assistant');
      }
    } else if (source === 'code') {
      if (role === 'user') {
        this.classList.add('code-user');
      } else if (role === 'assistant'  && this.hasTools) {
        this.classList.add('code-tool');
      } else if (role === 'assistant') {
        this.classList.add('code-assistant');
      } 
    }
  }

  renderDebugHeader(messageObj) {
    if (!this.showDebug) {
      this.get("#container").querySelectorAll(".debug").forEach( ea => ea.classList.add('hidden'))
      return;
    }
    this.get("#container").querySelectorAll(".debug").forEach( ea => ea.classList.remove('hidden'))
    this.debugHeader.innerHTML = ["role", "type", "timestamp", "source", "streamType"]
      .filter(ea => messageObj[ea])
      .map(ea => {
        const value = ea === 'timestamp' ? this.formatTimestamp(messageObj[ea]) : messageObj[ea];
        return `<span class="debug-item"><span class="debug-label">${ea}</span> ${value}</span>`;
      })
      .join(' | ');
  }

  renderOpenCodeDebugHeader(opencodeMessage) {
    if (!this.showDebug) {
      this.debugHeader.classList.add('hidden');
      this.get("#inspect").classList.add('hidden')
      return;
    }
    this.debugHeader.classList.remove('hidden');
    this.get("#inspect").classList.remove('hidden')

    const info = opencodeMessage.info || {};
    const parts = opencodeMessage.parts || {};

    this.debugHeader.innerHTML = [
      `<span class="debug-item"><span class="debug-label">id</span> ${info.id || 'unknown'}</span>`,
      `<span class="debug-item"><span class="debug-label">role</span> ${info.role || 'unknown'}</span>`,
      `<span class="debug-item"><span class="debug-label">parts</span> ${parts.length}</span>`,
      `<span class="debug-item"><span class="debug-label">types</span> ${parts.map(p => p.type).join(', ')}</span>`
    ].join(' | ');
  }

  /**
   * Create a lively-markdown element, connect it to the DOM so it initializes,
   * then set its content and return it.
   * We use a temporary off-screen container so initialize() runs before setContent.
   */
  async createMarkdownElement(markdownText) {
    const md = await lively.create('lively-markdown');
    await md.setContent(markdownText);
    return md;
  }

  async dispatchToolRender(part, methodName) {
    const renderer = this.toolRenderers.find(r => r.matches(part));
    
    if (renderer && renderer[methodName]) {
      return renderer[methodName](part, this);
    }
    
    console.warn('No renderer matched - is GenericTool registered?', part);
    return null;
  }

  async renderOpenCodeParts(opencodeMessage) {
    const parts = opencodeMessage.parts || [];

    // Clear previous content
    this.partsContainer.innerHTML = '';

    if (parts.length === 0) {
      this.partsContainer.appendChild(await this.createMarkdownElement('*(empty message)*'));
      return;
    }

    // Track tool_use parts to match with tool_results - store on component for renderers to access
    this.toolUseById = {};
    this.toolResultById = {};
    parts.forEach(p => {
      if (p.type === 'tool_use' && p.id) {
        this.toolUseById[p.id] = p;
      }
      if (p.type === 'tool_result' && p.tool_use_id) {
        this.toolResultById[p.tool_use_id] = p;
      }
    });

    for (const part of parts) {
      if (part.type === 'text') {
        // Text part: each gets its own lively-markdown element
        this.partsContainer.appendChild(await this.createMarkdownElement(part.text));
      } else if (part.type === 'reasoning') {
        // Extended thinking block: collapsible, content rendered in lively-markdown
        const details = <details>
          <summary>💭 <em>Thinking...</em></summary>
        </details>;
        details.appendChild(await this.createMarkdownElement(part.text));
        this.partsContainer.appendChild(details);
      } else if (part.type === 'tool_use') {
        const el = await this.dispatchToolRender(part, 'renderToolUse');
        if (el) this.partsContainer.appendChild(el);
      } else if (part.type === 'tool_result') {
        const el = await this.dispatchToolRender(part, 'renderToolResult');
        if (el) this.partsContainer.appendChild(el);
      } else if (part.type === 'tool') {
        const el = await this.dispatchToolRender(part, 'renderToolStreaming');
        if (el) this.partsContainer.appendChild(el);
      } else if (part.type === 'step-start' || part.type === 'step-finish') {
        // Step events - only show in debug mode
        if (this.showDebug) {
          const emoji = part.type === 'step-start' ? '▶️' : '⏹️';
          let md = `### ${emoji} ${part.type}\n\n`;
          if (part.type === 'step-finish' && part.tokens) {
            md += `**Tokens:** input: ${part.tokens.input}, output: ${part.tokens.output}`;
            if (part.tokens.cache?.read) {
              md += `, cache read: ${part.tokens.cache.read}`;
            }
            if (part.cost) {
              md += `, cost: ${part.cost}`;
            }
            md += '\n\n';
          }
          if (part.snapshot) {
            md += `*Snapshot: ${part.snapshot.substring(0, 8)}...*\n\n`;
          }
          this.partsContainer.appendChild(await this.createMarkdownElement(md));
        }
      } else {
        // Unknown part type - show as JSON (only in debug mode)
        if (this.showDebug) {
          const md = `### ⚠️ Unknown Part Type: ${part.type}\n\n\`\`\`json\n${JSON.stringify(part, null, 2)}\n\`\`\`\n\n`;
          this.partsContainer.appendChild(await this.createMarkdownElement(md));
        }
      }
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
    if (this.partsContainer) {
      this.partsContainer.innerHTML = '';
      this.partsContainer.appendChild(await this.createMarkdownElement(content));
    }

    // For tool messages, check if content is long and should be collapsible
    if (messageObj.role === 'tool') {
      this.updateExpandState();
    }
  }

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

  onMessageClick(evt) {
    // Only handle clicks on tool messages
    if (this._messageData && this._messageData.role === 'tool') {
      this._isExpanded = !this._isExpanded;
      this.updateExpandState();
      evt.stopPropagation();
    }
  }

  formatTimestamp(timestamp) {
    try {
      let date;
      
      if (typeof timestamp === 'number') {
        // If timestamp is in seconds (Unix timestamp), convert to milliseconds
        // Unix timestamps in seconds are typically 10 digits (e.g., 1700000000)
        // Timestamps in milliseconds are 13 digits (e.g., 1700000000000)
        const ts = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
        date = new Date(ts);
      } else {
        date = new Date(timestamp);
      }

      // Format as YYYY-MM-DD HH:MM:SS.mmm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const millis = String(date.getMilliseconds()).padStart(3, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${millis}`;
    } catch (e) {
      return String(timestamp);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getMessageData() {
    return this._messageData;
  }

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

  livelyMigrate(other) {
    this._messageData = other._messageData;
    this._isExpanded = other._isExpanded;
    this._opencodeMessage = other._opencodeMessage || other._rawMessage; // Handle old name
    this._showRaw = other._showRaw;
  }
}
