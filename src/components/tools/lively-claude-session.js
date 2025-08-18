import Morph from 'src/components/widgets/lively-morph.js';
import Terminal from 'src/client/terminal.js';

/*
 * Claude Session Viewer
 * Loads and displays Claude Code session files from ~/.claude/ in JSONL format
 * Sister component to lively-claude-code for viewing conversation history
 */

export default class LivelyClaudeSession extends Morph {

  async initialize() {
    this.windowTitle = "Claude Session Viewer";
    
    // Initialize UI references
    this.sessionSelect = this.get("#sessionSelect");
    this.refreshBtn = this.get("#refreshBtn");
    this.sessionInfo = this.get("#sessionInfo");
    this.messageContainer = this.get("#messageContainer");
    this.loadingIndicator = this.get("#loadingIndicator");
    this.errorDisplay = this.get("#errorDisplay");
    
    // Initialize terminal for file operations
    this.terminal = new Terminal({
      url: lively4url,
      cwd: "/lively4-core"
    });
    
    this.registerButtons();
    
    if (this.sessionSelect) {
      this.sessionSelect.addEventListener('change', () => this.onSessionSelectChange());
    }
    
    if (this._availableSessions) {
      this.populateSessionDropdown(this._availableSessions);
    } else {
      await this.loadAvailableSessions();
    }
    
    if (this._currentSessionEntries && this._currentSessionPath) {
      this.sessionSelect.value = this._currentSessionPath;
      this.updateSessionInfo(this._currentSessionPath, this._currentSessionEntries.length);
      await this.displayMessages(this._currentSessionEntries);
    } else {
      await this.loadPersistedSession();
    }
  }

  async onRefreshButton() {
    await this.loadAvailableSessions();
  }

  async onSessionSelectChange() {
    const selectedSession = this.sessionSelect.value;
    if (selectedSession) {
      // Persist the selected session
      this.setAttribute('selected-session', selectedSession);
      await this.loadSession(selectedSession);
    }
  }

  async loadAvailableSessions() {
    try {
      this.showLoading("Loading available sessions...");
      
      // List all .jsonl files in ~/.claude/projects/*lively4-core/
      const command = `find ~/.claude/projects -type f -name '*.jsonl' -path '*-lively4-core/*' -printf '%TY-%Tm-%TdT%TH:%TM:%TS\t%p\n' | sort -r`;
      
      const result = await this.terminal.run(command);
      
      if (result.error) {
        throw new Error(result.stderr || result.error.message);
      }
      
      const sessionFiles = result.stdout.trim().split('\n').filter(line => line.trim()).map(ea => {
        var pair = ea.split("\t")
        return {modified: pair[0], path: pair[1]}
      });
      

      this._availableSessions = sessionFiles;     

      this.populateSessionDropdown(sessionFiles);
      
      this.hideLoading();
      
      if (sessionFiles.length === 0) {
        this.showError("No Claude session files found in ~/.claude/projects/*lively4-core/");
      }
      
    } catch (error) {
      this.showError(`Failed to load sessions: ${error.message}`);
    }
  }

  populateSessionDropdown(sessionFiles) {
    // Clear existing options
    this.sessionSelect.innerHTML = '<option value="">Select a session...</option>';
    
    // Add session options
    sessionFiles.forEach(sessionFile => {
      debugger
      if (sessionFile.path.endsWith('.jsonl')) {
        const fileName = sessionFile.path.split('/').pop();
        const sessionId = fileName.replace('.jsonl', '');
        const option = document.createElement('option');
        option.value = sessionFile.path;
        option.textContent = `${sessionFile.modified} ${sessionId.substring(0, 8)}...`;
        option.title = sessionFile.path; // Full path in tooltip
        this.sessionSelect.appendChild(option);
      }
    });
  }

  async loadPersistedSession() {
    const persistedSession = this.getAttribute('selected-session');
    if (persistedSession && this.sessionSelect) {
      // Check if the persisted session still exists in the options
      const option = Array.from(this.sessionSelect.options).find(opt => opt.value === persistedSession);
      if (option) {
        this.sessionSelect.value = persistedSession;
        await this.loadSession(persistedSession);
      } else {
        // Session no longer exists, clear the attribute
        this.removeAttribute('selected-session');
      }
    }
  }

  async loadSession(sessionPath) {
    try {
      this.showLoading("Loading session content...");
      this.clearMessages();
      
      // Read the JSONL file content
      const command = `cat "${sessionPath}"`;
      const result = await this.terminal.run(command);
      
      if (result.error) {
        throw new Error(result.stderr || result.error.message);
      }
      
      // Parse JSONL content (each line is a separate JSON object)
      const lines = result.stdout.trim().split('\n').filter(line => line.trim());
      const messages = [];
      
      for (let i = 0; i < lines.length; i++) {
        try {
          const message = JSON.parse(lines[i]);
          messages.push(message);
        } catch (parseError) {
          console.warn(`Failed to parse line ${i + 1}:`, parseError, lines[i]);
        }
      }
      
      // Store current session path for migration
      this._currentSessionPath = sessionPath;
      
      // Update session info
      this.updateSessionInfo(sessionPath, messages.length);
      
      // Display messages
      await this.displayMessages(messages);
      
      this.hideLoading();
      
    } catch (error) {
      this.showError(`Failed to load session: ${error.message}`);
    }
  }

  updateSessionInfo(sessionPath, messageCount) {
    const fileName = sessionPath.split('/').pop();
    const sessionId = fileName.replace('.jsonl', '');
    
    this.sessionInfo.innerHTML = `
      <div class="session-id-display">
        <span class="session-label">Session:</span>
        <span class="session-id" title="${sessionId}">${sessionId.substring(0, 12)}...</span>
      </div>
      <div class="message-count">${messageCount} messages</div>
    `;
  }

  async displayMessages(messages) {
    this.clearMessages();
    
    // Store the session entries for migration and inspect buttons
    this._currentSessionEntries = messages;
    
    messages.forEach((message, index) => {
      const messageElement = this.createMessageElement(message, index);
      this.messageContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  createMessageElement(sessionEntry, index) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.setAttribute('data-index', index);
    
    // Extract the actual message from the session entry
    const message = sessionEntry.message || sessionEntry;
    
    // Determine message type and role from the session entry or message
    let role = sessionEntry.type || message.role || 'unknown';
    
    // Special handling for tool results
    if (sessionEntry.toolUseResult || (message.content && Array.isArray(message.content) && message.content.some(c => c.type === 'tool_result'))) {
      role = 'toolUseResult';
    }
    
    const type = message.type || sessionEntry.type || 'message';
    
    messageDiv.classList.add(`message-${role}`);
    messageDiv.classList.add(`type-${type}`);
    
    // Create message header
    const header = document.createElement('div');
    header.className = 'message-header';
    
    const leftSection = document.createElement('div');
    leftSection.className = 'message-header-left';
    
    const roleSpan = document.createElement('span');
    roleSpan.className = 'message-role';
    roleSpan.textContent = this.formatRole(role);
    leftSection.appendChild(roleSpan);
    
    // Add session metadata
    if (sessionEntry.sessionId && sessionEntry.sessionId !== sessionEntry.uuid) {
      const sessionSpan = document.createElement('span');
      sessionSpan.className = 'message-session';
      sessionSpan.textContent = `Session: ${sessionEntry.sessionId.substring(0, 8)}...`;
      sessionSpan.title = sessionEntry.sessionId;
      leftSection.appendChild(sessionSpan);
    }
    
    // Add model info for assistant messages
    if (role === 'assistant' && message.model) {
      const modelSpan = document.createElement('span');
      modelSpan.className = 'message-model';
      modelSpan.textContent = message.model;
      leftSection.appendChild(modelSpan);
    }
    
    // Use timestamp from session entry or message
    const timestamp = sessionEntry.timestamp || message.timestamp;
    if (timestamp) {
      const timeSpan = document.createElement('span');
      timeSpan.className = 'message-time';
      timeSpan.textContent = new Date(timestamp).toLocaleTimeString();
      leftSection.appendChild(timeSpan);
    }
    
    header.appendChild(leftSection);
    
    // Add inspect button
    const inspectBtn = document.createElement('button');
    inspectBtn.className = 'inspect-btn';
    inspectBtn.innerHTML = '<i class="fa fa-search" aria-hidden="true"></i>';
    inspectBtn.title = 'Inspect message object';
    inspectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      lively.openInspector(sessionEntry);
    });
    header.appendChild(inspectBtn);
    
    messageDiv.appendChild(header);
    
    // Create message content
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Special handling for toolUseResult messages
    if (role === 'toolUseResult') {
      content.classList.add('tool-result-content');
      
      // For toolUseResult, show the actual tool output more prominently
      if (message.content) {
        if (Array.isArray(message.content)) {
          message.content.forEach(part => {
            if (part.type === 'tool_result') {
              const resultDiv = document.createElement('div');
              resultDiv.className = 'tool-output-display';
              
              // Handle tool_result content properly
              let displayContent = '';
              if (part.content) {
                if (Array.isArray(part.content)) {
                  // Extract text from nested content array
                  const textParts = part.content.map(subPart => {
                    if (subPart.type === 'text') {
                      return subPart.text;
                    }
                    return JSON.stringify(subPart, null, 2);
                  }).join('\n\n');
                  displayContent = textParts;
                } else if (typeof part.content === 'string') {
                  displayContent = part.content;
                } else {
                  displayContent = JSON.stringify(part.content, null, 2);
                }
              } else if (part.text) {
                displayContent = part.text;
              } else {
                displayContent = JSON.stringify(part, null, 2);
              }
              
              resultDiv.innerHTML = `<pre><code>${this.escapeHtml(displayContent)}</code></pre>`;
              content.appendChild(resultDiv);
            } else if (part.type === 'text') {
              const resultDiv = document.createElement('div');
              resultDiv.className = 'tool-output-display';
              resultDiv.innerHTML = `<pre><code>${this.escapeHtml(part.text)}</code></pre>`;
              content.appendChild(resultDiv);
            }
          });
        } else if (typeof message.content === 'string') {
          const resultDiv = document.createElement('div');
          resultDiv.className = 'tool-output-display';
          resultDiv.innerHTML = `<pre><code>${this.escapeHtml(message.content)}</code></pre>`;
          content.appendChild(resultDiv);
        } else {
          const resultDiv = document.createElement('div');
          resultDiv.className = 'tool-output-display';
          resultDiv.innerHTML = `<pre><code>${JSON.stringify(message.content, null, 2)}</code></pre>`;
          content.appendChild(resultDiv);
        }
      }
      
      // Show tool metadata from the session entry or message content
      const metaDiv = document.createElement('div');
      metaDiv.className = 'tool-metadata';
      let hasMetadata = false;
      
      // Extract tool info from tool_result content
      if (message.content && Array.isArray(message.content)) {
        const toolResult = message.content.find(c => c.type === 'tool_result');
        if (toolResult && toolResult.tool_use_id) {
          metaDiv.innerHTML += `<span class="tool-id-meta">Tool Use ID: ${toolResult.tool_use_id}</span>`;
          hasMetadata = true;
        }
      }
      
      // Show additional toolUseResult metadata if available
      if (sessionEntry.toolUseResult) {
        const result = sessionEntry.toolUseResult;
        if (result.newTodos || result.oldTodos) {
          metaDiv.innerHTML += `<span class="tool-type-meta">Todo Update</span>`;
          hasMetadata = true;
        }
      }
      
      if (hasMetadata) {
        content.insertBefore(metaDiv, content.firstChild);
      }
    } else {
      // Regular message content handling
      if (message.content) {
        if (Array.isArray(message.content)) {
          // Handle multi-part content
          message.content.forEach(part => {
            const partDiv = document.createElement('div');
            partDiv.className = 'content-part';
            
            if (part.type === 'text') {
              partDiv.innerHTML = this.formatTextContent(part.text);
            } else if (part.type === 'tool_use') {
              partDiv.innerHTML = this.formatToolUse(part);
              partDiv.classList.add('tool-use-part');
            } else if (part.type === 'tool_result') {
              partDiv.innerHTML = this.formatToolResult(part);
              partDiv.classList.add('tool-result-part');
            } else if (part.type === 'thinking') {
              partDiv.innerHTML = this.formatThinking(part);
              partDiv.classList.add('thinking-part');
            } else {
              partDiv.innerHTML = `<pre>${JSON.stringify(part, null, 2)}</pre>`;
            }
            
            content.appendChild(partDiv);
          });
        } else if (typeof message.content === 'string') {
          content.innerHTML = this.formatTextContent(message.content);
        } else {
          content.innerHTML = `<pre>${JSON.stringify(message.content, null, 2)}</pre>`;
        }
      }
    }
    
    // Handle tool calls and results
    if (message.tool_calls) {
      const toolCallsDiv = document.createElement('div');
      toolCallsDiv.className = 'tool-calls';
      message.tool_calls.forEach(toolCall => {
        toolCallsDiv.appendChild(this.createToolCallElement(toolCall));
      });
      content.appendChild(toolCallsDiv);
    }
    
    messageDiv.appendChild(content);
    
    return messageDiv;
  }

  formatRole(role) {
    const roleMap = {
      'user': '👤 User',
      'assistant': '🤖 Assistant', 
      'system': '⚙️ System',
      'tool': '🔧 Tool',
      'toolUseResult': '🔧 Tool Result'
    };
    return roleMap[role] || `❓ ${role}`;
  }

  formatTextContent(text) {
    // Basic text formatting - convert newlines to breaks and preserve whitespace
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  formatToolUse(toolUse) {
    return `
      <div class="tool-use">
        <div class="tool-name">🔧 ${toolUse.name}</div>
        <div class="tool-id">ID: ${toolUse.id}</div>
        <div class="tool-input">
          <details>
            <summary>Input</summary>
            ${this.formatToolInput(toolUse.input)}
          </details>
        </div>
      </div>
    `;
  }
  
  formatToolInput(input) {
    if (!input || typeof input !== 'object') {
      return `<pre><code>${JSON.stringify(input, null, 2)}</code></pre>`;
    }
    
    let html = '<div class="tool-input-formatted">';
    
    for (const [key, value] of Object.entries(input)) {
      html += `<div class="input-parameter">`;
      html += `<div class="parameter-name">${this.escapeHtml(key)}:</div>`;
      html += `<div class="parameter-value">`;
      
      if (typeof value === 'string' && (key === 'content' || key === 'file_path' || key === 'command')) {
        // Special handling for content, file paths, and commands
        if (key === 'content' && value.includes('\n')) {
          // Render content with proper line breaks
          html += `<pre class="formatted-content"><code>${this.escapeHtml(value)}</code></pre>`;
        } else if (key === 'file_path') {
          // Style file paths specially
          html += `<code class="file-path">${this.escapeHtml(value)}</code>`;
        } else if (key === 'command') {
          // Style commands specially
          html += `<code class="command">${this.escapeHtml(value)}</code>`;
        } else {
          html += `<pre><code>${this.escapeHtml(value)}</code></pre>`;
        }
      } else if (typeof value === 'object') {
        html += `<pre><code>${JSON.stringify(value, null, 2)}</code></pre>`;
      } else {
        html += `<code>${this.escapeHtml(String(value))}</code>`;
      }
      
      html += `</div></div>`;
    }
    
    html += '</div>';
    return html;
  }

  formatToolResult(toolResult) {
    return `
      <div class="tool-result">
        <div class="tool-id">Tool Result: ${toolResult.tool_use_id}</div>
        <div class="tool-output">
          <details>
            <summary>Output</summary>
            <pre><code>${typeof toolResult.content === 'string' ? toolResult.content : JSON.stringify(toolResult.content, null, 2)}</code></pre>
          </details>
        </div>
      </div>
    `;
  }

  formatThinking(thinking) {
    const thinkingText = thinking.thinking || '';
    const hasSignature = thinking.signature ? true : false;
    
    return `
      <div class="thinking-block">
        <div class="thinking-header">
          <span class="thinking-label">🤔 Thinking</span>
          ${hasSignature ? '<span class="thinking-verified">✓ Verified</span>' : ''}
        </div>
        <details class="thinking-details">
          <summary>Show Claude's internal reasoning</summary>
          <div class="thinking-content">
            <pre><code>${this.escapeHtml(thinkingText)}</code></pre>
            ${hasSignature ? `<div class="thinking-signature" title="Cryptographic signature for thinking verification">Signature: ${thinking.signature.substring(0, 50)}...</div>` : ''}
          </div>
        </details>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  createToolCallElement(toolCall) {
    const div = document.createElement('div');
    div.className = 'tool-call';
    div.innerHTML = `
      <div class="tool-call-header">
        <span class="tool-name">🔧 ${toolCall.function?.name || toolCall.name || 'Unknown Tool'}</span>
        <span class="tool-id">${toolCall.id || ''}</span>
      </div>
      <div class="tool-call-args">
        <details>
          <summary>Arguments</summary>
          <pre><code>${JSON.stringify(toolCall.function?.arguments || toolCall.arguments || {}, null, 2)}</code></pre>
        </details>
      </div>
    `;
    return div;
  }

  clearMessages() {
    this.messageContainer.innerHTML = '';
  }

  showLoading(message = "Loading...") {
    this.loadingIndicator.textContent = message;
    this.loadingIndicator.style.display = 'block';
    this.errorDisplay.style.display = 'none';
  }

  hideLoading() {
    this.loadingIndicator.style.display = 'none';
  }

  showError(message) {
    this.errorDisplay.textContent = message;
    this.errorDisplay.style.display = 'block';
    this.loadingIndicator.style.display = 'none';
  }

  livelyExample() {
    // This will be called when the component is opened as an example
    // The component will automatically load available sessions
  }

  livelyMigrate(other) {
    // Only copy data, don't manipulate DOM or setup event listeners
    if (other.terminal) {
      this.terminal = other.terminal;
    }
    
    // Copy the session entries data
    if (other._currentSessionEntries) {
      this._currentSessionEntries = other._currentSessionEntries;
    }
    
    // Copy the current session path for restoration
    if (other._currentSessionPath) {
      this._currentSessionPath = other._currentSessionPath;
    }
    
    // Copy available sessions list
    if (other._availableSessions) {
      this._availableSessions = other._availableSessions;
    }
  }
  
  reattachInspectButtons() {
    // Re-attach inspect button event listeners after migration
    const inspectButtons = this.messageContainer.querySelectorAll('.inspect-btn');
    inspectButtons.forEach((btn) => {
      const messageElement = btn.closest('.message');
      if (messageElement) {
        const dataIndex = parseInt(messageElement.getAttribute('data-index'));
        const sessionEntry = this._currentSessionEntries[dataIndex];
        
        if (sessionEntry) {
          // Remove any existing listeners and add new one
          const newBtn = btn.cloneNode(true);
          newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            lively.openInspector(sessionEntry);
          });
          btn.parentNode.replaceChild(newBtn, btn);
        }
      }
    });
  }
}