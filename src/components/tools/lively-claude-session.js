import Morph from 'src/components/widgets/lively-morph.js';
import ClaudeSessionsAPI from 'src/client/claude-sessions.js';
import moment from 'src/external/moment.js';

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
    this.groupToolSequencesCheckbox = this.get("#groupToolSequences");
    
    // Terminal is now managed by ClaudeSessionsAPI
    
    this.registerButtons();
    
    if (this.sessionSelect) {
      this.sessionSelect.addEventListener('change', () => this.onSessionSelectChange());
    }
    
    if (this.groupToolSequencesCheckbox) {
      this.groupToolSequencesCheckbox.addEventListener('change', () => this.onGroupingChanged());
    }
    
    if (this._availableSessions) {
      this.populateSessionDropdown(this._availableSessions);
    } else {
      await this.loadAvailableSessions();
    }
    
    if (this._currentSessionEntries && this._currentSessionPath) {
      this.sessionSelect.value = this._currentSessionPath;
      // Get size information from available sessions
      const sessionFile = this._availableSessions?.find(s => s.path === this._currentSessionPath);
      const sizeBytes = sessionFile?.sizeBytes || null;
      this.updateSessionInfo(this._currentSessionPath, this._currentSessionEntries.length, sizeBytes, this._currentSessionEntries);
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
      
      // Use shared API to discover sessions (null = all projects, focusing on lively4-core)
      const sessionFiles = await ClaudeSessionsAPI.discoverSessions();
      
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
      if (sessionFile.path.endsWith('.jsonl')) {
        const fileName = sessionFile.path.split('/').pop();
        const sessionId = fileName.replace('.jsonl', '');
        const option = document.createElement('option');
        option.value = sessionFile.path;
        const humanTime = moment(sessionFile.modified).fromNow();
        const sizeDisplay = ClaudeSessionsAPI.formatFileSize(sessionFile.sizeBytes);
        option.textContent = `${humanTime} - ${sessionId.substring(0, 8)}... (${sizeDisplay})`;
        option.title = `${sessionFile.path}\nModified: ${sessionFile.modified}\nSize: ${sizeDisplay}`; // Full path, timestamp and size in tooltip
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
      
      // Use shared API to load session content
      const messages = await ClaudeSessionsAPI.loadSessionContent(sessionPath);
      
      // Store current session path for migration
      this._currentSessionPath = sessionPath;
      
      // Get size information from available sessions
      const sessionFile = this._availableSessions?.find(s => s.path === sessionPath);
      const sizeBytes = sessionFile?.sizeBytes || null;
      
      // Update session info
      this.updateSessionInfo(sessionPath, messages.length, sizeBytes, messages);
      
      // Display messages
      await this.displayMessages(messages);
      
      this.hideLoading();
      
    } catch (error) {
      this.showError(`Failed to load session: ${error.message}`);
    }
  }

  updateSessionInfo(sessionPath, messageCount, sizeBytes = null, messages = null) {
    const fileName = sessionPath.split('/').pop();
    const sessionId = fileName.replace('.jsonl', '');
    
    let sizeInfo = '';
    if (sizeBytes !== null) {
      const sizeDisplay = ClaudeSessionsAPI.formatFileSize(sizeBytes);
      sizeInfo = `<div class="file-size">${sizeDisplay}</div>`;
    }
    
    let tokenInfo = '';
    if (messages && messages.length > 0) {
      const stats = ClaudeSessionsAPI.calculateTokenStatistics(messages);
      if (stats.messagesWithTokens > 0) {
        tokenInfo = `
          <div class="token-stats" title="Total: ${ClaudeSessionsAPI.formatNumber(stats.totalInput)}→${ClaudeSessionsAPI.formatNumber(stats.totalOutput)} (${ClaudeSessionsAPI.formatNumber(stats.totalRegular)}) +${ClaudeSessionsAPI.formatNumber(stats.totalCache)}c
Average: ${stats.avgInput}→${stats.avgOutput} per message
Estimated cost: ${ClaudeSessionsAPI.formatNumber(stats.totalEstimatedCost)} units total, ${stats.avgCost} avg per message
${stats.messagesWithTokens} messages with token data">
            <span class="token-total">Σ ${ClaudeSessionsAPI.formatNumber(stats.totalInput)}→${ClaudeSessionsAPI.formatNumber(stats.totalOutput)}</span>
            <span class="token-avg">⌀ ${stats.avgInput}→${stats.avgOutput}</span>
            <span class="token-cost">${ClaudeSessionsAPI.formatNumber(stats.totalEstimatedCost)} tokens</span>
          </div>
        `;
      }
    }
    
    this.sessionInfo.innerHTML = `
      <div class="session-id-display">
        <span class="session-label">Session:</span>
        <span class="session-id" title="${sessionId}">${sessionId.substring(0, 12)}...</span>
      </div>
      <div class="message-count">${messageCount} messages</div>
      ${sizeInfo}
      ${tokenInfo}
    `;
  }

  onGroupingChanged() {
    // Re-render current session with new grouping preference
    if (this._currentSessionEntries) {
      this.displayMessages(this._currentSessionEntries);
    }
  }

  async displayMessages(messages) {
    this.clearMessages();
    
    // Store the session entries for migration and inspect buttons
    this._currentSessionEntries = messages;
    
    // Check if tool sequence grouping is enabled
    const shouldGroupToolSequences = this.groupToolSequencesCheckbox ? this.groupToolSequencesCheckbox.checked : true;
    
    if (shouldGroupToolSequences) {
      // Group messages and detect tool sequences
      const groupedMessages = this.groupToolSequences(messages);
      
      groupedMessages.forEach((group, groupIndex) => {
        if (group.isToolSequence) {
          // Create meta container for tool sequence
          const metaContainer = this.createToolSequenceContainer(group);
          this.messageContainer.appendChild(metaContainer);
          
          // Add individual messages within the meta container
          group.messages.forEach((message, index) => {
            const messageIndex = messages.indexOf(message);
            const messageElement = this.createMessageElement(message, messageIndex);
            metaContainer.appendChild(messageElement);
          });
        } else {
          // Regular message
          const messageElement = this.createMessageElement(group.message, group.index);
          this.messageContainer.appendChild(messageElement);
        }
      });
    } else {
      // Flat rendering - render each message individually without grouping
      messages.forEach((message, index) => {
        const messageElement = this.createMessageElement(message, index);
        this.messageContainer.appendChild(messageElement);
      });
    }
    
    // Scroll to bottom
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  groupToolSequences(messages) {
    const groups = [];
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const msg = message.message || message;
      const role = message.type || msg.role || 'unknown';
      
      // Check if this is a tool use message (assistant making tool calls)
      const isToolUse = role === 'assistant' && msg.content && Array.isArray(msg.content) && 
                        msg.content.some(c => c.type === 'tool_use');
      
      if (isToolUse) {
        // Look ahead for the next message to see if it's a tool result
        const nextMessage = i + 1 < messages.length ? messages[i + 1] : null;
        const isNextToolResult = nextMessage && (
          nextMessage.toolUseResult || 
          (nextMessage.message && nextMessage.message.content && Array.isArray(nextMessage.message.content) && 
           nextMessage.message.content.some(c => c.type === 'tool_result'))
        );
        
        if (isNextToolResult) {
          // Create a tool sequence with this call and its result
          groups.push({
            isToolSequence: true,
            messages: [message, nextMessage],
            toolCalls: this.extractToolCalls(msg)
          });
          // Skip the next message since we've already included it
          i++;
        } else {
          // Tool call without immediate result - treat as individual message
          groups.push({ 
            isToolSequence: false, 
            message: message, 
            index: i 
          });
        }
      } else {
        // Regular message (not a tool call)
        groups.push({ 
          isToolSequence: false, 
          message: message, 
          index: i 
        });
      }
    }
    
    return groups;
  }

  extractToolCalls(message) {
    if (!message.content || !Array.isArray(message.content)) return [];
    
    return message.content
      .filter(c => c.type === 'tool_use')
      .map(c => ({
        name: c.name,
        id: c.id,
        input: c.input,
        displayInfo: this.extractToolDisplayInfo(c)
      }));
  }

  extractToolDisplayInfo(toolCall) {
    const { name, input } = toolCall;
    const info = { details: [] };
    
    switch (name) {
      case 'Edit':
      case 'MultiEdit':
        if (input.file_path) {
          const fileName = input.file_path.split('/').pop();
          info.fileName = fileName;
          info.details.push(`📄 ${fileName}`);
        }
        
        if (name === 'Edit' && input.old_string && input.new_string) {
          const oldSize = input.old_string.length;
          const newSize = input.new_string.length;
          const delta = newSize - oldSize;
          const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
          info.details.push(`📝 ${oldSize}→${newSize} (${deltaStr})`);
        } else if (name === 'MultiEdit' && input.edits) {
          const editCount = input.edits.length;
          info.details.push(`✏️ ${editCount} edit${editCount > 1 ? 's' : ''}`);
        }
        break;
        
      case 'Read':
        if (input.file_path) {
          const fileName = input.file_path.split('/').pop();
          info.fileName = fileName;
          info.details.push(`📖 ${fileName}`);
        }
        if (input.limit) {
          info.details.push(`📊 limit: ${input.limit}`);
        }
        break;
        
      case 'Write':
        if (input.file_path) {
          const fileName = input.file_path.split('/').pop();
          info.fileName = fileName;
          info.details.push(`💾 ${fileName}`);
        }
        if (input.content) {
          const size = input.content.length;
          info.details.push(`📏 ${size} chars`);
        }
        break;
        
      case 'Bash':
        if (input.command) {
          const cmd = input.command.length > 30 ? 
            input.command.substring(0, 30) + '...' : 
            input.command;
          info.details.push(`💻 ${cmd}`);
        }
        break;
        
      case 'Grep':
        if (input.pattern) {
          info.details.push(`🔍 /${input.pattern}/`);
        }
        if (input.glob) {
          info.details.push(`📂 ${input.glob}`);
        }
        break;
        
      case 'Glob':
        if (input.pattern) {
          info.details.push(`🗂️ ${input.pattern}`);
        }
        break;
        
      default:
        // For unknown tools, try to extract common patterns
        if (input.file_path) {
          const fileName = input.file_path.split('/').pop();
          info.details.push(`📄 ${fileName}`);
        }
        if (input.command) {
          const cmd = input.command.length > 20 ? 
            input.command.substring(0, 20) + '...' : 
            input.command;
          info.details.push(`⚙️ ${cmd}`);
        }
        break;
    }
    
    return info;
  }

  createToolSequenceContainer(group) {
    const container = document.createElement('div');
    container.className = 'tool-sequence-meta';
    
    // Create header for the tool sequence
    const header = document.createElement('div');
    header.className = 'tool-sequence-header';
    
    const toolNames = group.toolCalls.map(tc => tc.name).join(', ');
    const toolCount = group.toolCalls.length;
    const messageCount = group.messages.length;
    
    // Collect all display details from tools
    const allDetails = [];
    group.toolCalls.forEach(tc => {
      if (tc.displayInfo && tc.displayInfo.details) {
        allDetails.push(...tc.displayInfo.details);
      }
    });
    
    // Create details section if we have any
    let detailsHtml = '';
    if (allDetails.length > 0) {
      detailsHtml = `
        <div class="tool-sequence-details">
          ${allDetails.map(detail => `<span class="tool-detail">${detail}</span>`).join('')}
        </div>
      `;
    }
    
    header.innerHTML = `
      <div class="tool-sequence-info">
        <span class="tool-sequence-label">🔧 Tool Sequence:</span>
        <span class="tool-sequence-tools">${toolNames}</span>
        <span class="tool-sequence-count">${toolCount} tool${toolCount > 1 ? 's' : ''}, ${messageCount} message${messageCount > 1 ? 's' : ''}</span>
      </div>
      ${detailsHtml}
    `;
    
    container.appendChild(header);
    return container;
  }

  createMessageElement(sessionEntry, index) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.setAttribute('data-index', index);
    
    // Add UUID data attribute for reliable message identification
    if (sessionEntry.uuid) {
      messageDiv.setAttribute('data-uuid', sessionEntry.uuid);
    }
    
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
    
    // Add message index (line number in JSONL)
    const indexSpan = document.createElement('span');
    indexSpan.className = 'message-index';
    indexSpan.textContent = `#${index + 1}`;
    indexSpan.title = `Message index: ${index + 1} (line ${index + 1} in JSONL file)`;
    leftSection.appendChild(indexSpan);

    if (sessionEntry.uuid) {
      const sessionSpan = document.createElement('span');
      sessionSpan.className = 'message-uuid';
      sessionSpan.textContent = `uuid: ${sessionEntry.uuid.substring(0, 8)}`;
      sessionSpan.title = sessionEntry.uuid;
      leftSection.appendChild(sessionSpan);
    }
    
    // Add model info for assistant messages
    if (role === 'assistant' && message.model) {
      const modelSpan = document.createElement('span');
      modelSpan.className = 'message-model';
      modelSpan.textContent = message.model;
      leftSection.appendChild(modelSpan);
    }
    
    // Add token usage info if available
    if (message.usage) {
      const usage = message.usage;
      const tokenSpan = document.createElement('span');
      tokenSpan.className = 'message-tokens';
      
      const inputTokens = usage.input_tokens || 0;
      const outputTokens = usage.output_tokens || 0;
      const cacheReadTokens = usage.cache_read_input_tokens || 0;
      const cacheCreationTokens = usage.cache_creation_input_tokens || 0;
      const totalTokens = inputTokens + outputTokens;
      const estimatedCost = ClaudeSessionsAPI.calculateEstimatedCost(usage);
      
      // Build display text with cache info if present
      let displayText = `${inputTokens}→${outputTokens}`;
      if (cacheReadTokens > 0 || cacheCreationTokens > 0) {
        displayText += ` +${ClaudeSessionsAPI.formatNumber(cacheReadTokens + cacheCreationTokens)}c`;
      }
      displayText += ` (${totalTokens}) tokens ${ClaudeSessionsAPI.formatNumber(estimatedCost)} tokens`;
      
      tokenSpan.textContent = displayText;
      
      // Build detailed tooltip with cost breakdown
      let tooltipText = `Input tokens: ${ClaudeSessionsAPI.formatNumber(inputTokens)} (×1.0 = ${ClaudeSessionsAPI.formatNumber(inputTokens)})\nOutput tokens: ${ClaudeSessionsAPI.formatNumber(outputTokens)} (×3.0 = ${ClaudeSessionsAPI.formatNumber(outputTokens * 3)})`;
      if (cacheReadTokens > 0) {
        tooltipText += `\nCache read tokens: ${ClaudeSessionsAPI.formatNumber(cacheReadTokens)} (×0.1 = ${ClaudeSessionsAPI.formatNumber(cacheReadTokens * 0.1)})`;
      }
      if (cacheCreationTokens > 0) {
        tooltipText += `\nCache creation tokens: ${ClaudeSessionsAPI.formatNumber(cacheCreationTokens)} (×1.25 = ${ClaudeSessionsAPI.formatNumber(cacheCreationTokens * 1.25)})`;
      }
      tooltipText += `\nRegular total: ${ClaudeSessionsAPI.formatNumber(totalTokens)} tokens\nEstimated cost: ${ClaudeSessionsAPI.formatNumber(estimatedCost)} units`;
      
      tokenSpan.title = tooltipText;
      leftSection.appendChild(tokenSpan);
    }
    
    // Use timestamp from session entry or message
    const timestamp = sessionEntry.timestamp || message.timestamp;
    if (timestamp) {
      const timeSpan = document.createElement('span');
      timeSpan.className = 'message-time';
      const date = new Date(timestamp);
      timeSpan.textContent = date.toLocaleTimeString();
      timeSpan.title = `Full timestamp: ${date.toLocaleString()}\nISO: ${timestamp}`;
      leftSection.appendChild(timeSpan);
    }
    
    header.appendChild(leftSection);
    
    // Add button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'message-buttons';
    
    // Add copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<i class="fa fa-copy" aria-hidden="true"></i>';
    copyBtn.title = 'Copy message as JSON';
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyToClipboard(sessionEntry);
    });
    buttonContainer.appendChild(copyBtn);
    
    // Add inspect button
    const inspectBtn = document.createElement('button');
    inspectBtn.className = 'inspect-btn';
    inspectBtn.innerHTML = '<i class="fa fa-search" aria-hidden="true"></i>';
    inspectBtn.title = 'Inspect message object';
    inspectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      lively.openInspector(sessionEntry);
    });
    buttonContainer.appendChild(inspectBtn);
    
    header.appendChild(buttonContainer);
    
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

  async copyToClipboard(sessionEntry) {
    try {
      const jsonString = JSON.stringify(sessionEntry, null, 2);
      await navigator.clipboard.writeText(jsonString);
      
      // Show temporary feedback
      this.showTemporaryMessage('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.showTemporaryMessage('Failed to copy to clipboard', true);
    }
  }

  showTemporaryMessage(message, isError = false) {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.className = `clipboard-notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    
    // Position it at the top of the component
    this.appendChild(notification);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 2000);
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

  showMessage(uuid) {
    // Public helper method to navigate to and highlight a specific message by UUID
    try {
      // Search within the shadow DOM for the message element
      const messageElement = this.shadowRoot.querySelector(`[data-uuid="${uuid}"]`);
      
      if (!messageElement) {
        console.warn(`Message with UUID ${uuid} not found in session viewer`);
        return false;
      }
      
      // Scroll to the message
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add temporary highlight
      const originalBackground = messageElement.style.backgroundColor;
      messageElement.style.backgroundColor = '#ffeb3b';
      messageElement.style.transition = 'background-color 1s';
      
      setTimeout(() => {
        messageElement.style.backgroundColor = originalBackground;
      }, 2000);
      
      console.log(`Successfully navigated to message ${uuid}`);
      return true;
      
    } catch (error) {
      console.error('Failed to show message:', error);
      return false;
    }
  }

  livelyExample() {
    // This will be called when the component is opened as an example
    // The component will automatically load available sessions
  }

  livelyMigrate(other) {
    // Only copy data, don't manipulate DOM or setup event listeners
    // Terminal is now managed by ClaudeSessionsAPI
    
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
    
    // Preserve checkbox state
    if (other.groupToolSequencesCheckbox) {
      const wasChecked = other.groupToolSequencesCheckbox.checked;
      setTimeout(() => {
        if (this.groupToolSequencesCheckbox) {
          this.groupToolSequencesCheckbox.checked = wasChecked;
        }
      }, 10);
    }
  }
  
  reattachInspectButtons() {
    // Re-attach button event listeners after migration
    const inspectButtons = this.messageContainer.querySelectorAll('.inspect-btn');
    const copyButtons = this.messageContainer.querySelectorAll('.copy-btn');
    
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
    
    copyButtons.forEach((btn) => {
      const messageElement = btn.closest('.message');
      if (messageElement) {
        const dataIndex = parseInt(messageElement.getAttribute('data-index'));
        const sessionEntry = this._currentSessionEntries[dataIndex];
        
        if (sessionEntry) {
          // Remove any existing listeners and add new one
          const newBtn = btn.cloneNode(true);
          newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyToClipboard(sessionEntry);
          });
          btn.parentNode.replaceChild(newBtn, btn);
        }
      }
    });
  }
}