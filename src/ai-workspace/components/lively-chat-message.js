import Morph from 'src/components/widgets/lively-morph.js';
import { computeCost } from 'src/client/claude/claude-pricing.js';
import * as ToolHelpers from './chat-tool-helpers.js';
// File / filesystem tools
import { OpenCodeReadTool } from './tool-renderers/opencode-read-tool.js';
import { OpenCodeWriteTool } from './tool-renderers/opencode-write-tool.js';
import { OpenCodeEditTool } from './tool-renderers/opencode-edit-tool.js';
import { OpenCodeMultiEditTool } from './tool-renderers/opencode-multiedit-tool.js';
import { OpenCodeApplyPatchTool } from './tool-renderers/opencode-apply-patch-tool.js';
import { OpenCodeGlobTool } from './tool-renderers/opencode-glob-tool.js';
import { OpenCodeGrepTool } from './tool-renderers/opencode-grep-tool.js';
import { OpenCodeLsTool } from './tool-renderers/opencode-ls-tool.js';
// Execution
import { OpenCodeBashTool } from './tool-renderers/opencode-bash-tool.js';
import { OpenCodeBatchTool } from './tool-renderers/opencode-batch-tool.js';
// Web
import { OpenCodeWebFetchTool } from './tool-renderers/opencode-webfetch-tool.js';
import { OpenCodeWebSearchTool } from './tool-renderers/opencode-websearch-tool.js';
import { OpenCodeCodeSearchTool } from './tool-renderers/opencode-codesearch-tool.js';
// Agent / workflow
import { OpenCodeTaskTool } from './tool-renderers/opencode-task-tool.js';
import { OpenCodePlanTool } from './tool-renderers/opencode-plan-tool.js';
import { OpenCodeQuestionTool } from './tool-renderers/opencode-question-tool.js';
import { OpenCodeSkillTool } from './tool-renderers/opencode-skill-tool.js';
// Session / state
import { OpenCodeTodoWriteTool } from './tool-renderers/opencode-todowrite-tool.js';
import { OpenCodeTodoReadTool } from './tool-renderers/opencode-todoread-tool.js';
// Dev intelligence
import { OpenCodeLspTool } from './tool-renderers/opencode-lsp-tool.js';
// Lively4 MCP tools
import { OpenCodeRunTestsTool } from './tool-renderers/opencode-run-tests-tool.js';
import { OpenCodeInspectTestsTool } from './tool-renderers/opencode-inspect-tests-tool.js';
import { OpenCodeEvaluateCodeTool } from './tool-renderers/opencode-evaluate-code-tool.js';
// Internal / fallback
import { OpenCodeInvalidTool } from './tool-renderers/opencode-invalid-tool.js';
import { OpenCodeGenericTool } from './tool-renderers/opencode-generic-tool.js';
// Vox (voice agent) tool renderers
import { VoxEvaluateCodeTool } from './tool-renderers/vox-evaluate-code-tool.js';
import { VoxReadFileTool } from './tool-renderers/vox-read-file-tool.js';
import { VoxListFilesTool } from './tool-renderers/vox-list-files-tool.js';
import { VoxGenericTool } from './tool-renderers/vox-generic-tool.js';

export default class LivelyChatMessage extends Morph {
  async initialize() {
    this.windowTitle = "Chat Message";

    // Store message data
    this._showRaw = this._showRaw || false;

    // Register OpenCode tool renderers - order matters! Generic should be last (fallback)
    this.toolRenderers = this.toolRenderers || [
      // File / filesystem
      new OpenCodeReadTool(),
      new OpenCodeWriteTool(),
      new OpenCodeEditTool(),
      new OpenCodeMultiEditTool(),
      new OpenCodeApplyPatchTool(),
      new OpenCodeGlobTool(),
      new OpenCodeGrepTool(),
      new OpenCodeLsTool(),
      // Execution
      new OpenCodeBashTool(),
      new OpenCodeBatchTool(),
      // Web
      new OpenCodeWebFetchTool(),
      new OpenCodeWebSearchTool(),
      new OpenCodeCodeSearchTool(),
      // Agent / workflow
      new OpenCodeTaskTool(),
      new OpenCodePlanTool(),
      new OpenCodeQuestionTool(),
      new OpenCodeSkillTool(),
      // Session / state
      new OpenCodeTodoWriteTool(),
      new OpenCodeTodoReadTool(),
      // Dev intelligence
      new OpenCodeLspTool(),
      // Lively4 MCP tools
      new OpenCodeRunTestsTool(),
      new OpenCodeInspectTestsTool(),
      new OpenCodeEvaluateCodeTool(),
      // Internal / fallback (always last)
      new OpenCodeInvalidTool(),
      new OpenCodeGenericTool(),
    ];

    // Register Vox (voice agent) tool renderers - separate code path from OpenCode
    // Order matters - more specific renderers first, generic last
    this.voxToolRenderers = this.voxToolRenderers || [
      new VoxReadFileTool(),
      new VoxListFilesTool(),
      new VoxEvaluateCodeTool(),
      new VoxGenericTool(), // Fallback - always last
    ];

    // Get references to elements
    this.debugHeader = this.get("#debugHeader");
    this.contentDiv = this.get("#content");
    this.partsContainer = this.get("#partsContainer");
    this.viewRawButton = this.get("#viewRawButton");
    this.rawDisplay = this.get("#rawDisplay");
    this.rawJson = this.get("#rawJson");
    this.usageStatsEl = this.get("#usageStats");

    this.registerButtons()
    if (this._opencodeMessage) {
      this.setOpenCodeMessage(this._opencodeMessage);
    } else {
      this.setMessage(this._messageData || null);
    }
  }

  get showDebug() {
    return this._showDebug
  }

  
  set showDebug(bool) {
    this._showDebug = bool;
    if (this._opencodeMessage) {
      this.renderOpenCodeDebugHeader(this._opencodeMessage);
    } else {
      this.renderDebugHeader(this._messageData);
    }
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
   * Append a tool result to an existing tool call message.
   * Used for linking function_call_output to function_call in realtime chat.
   * 
   * Strategy: Replace the entire details block with a new one showing code + result
   * (like OpenCode bash tool - one details block total, not two)
   * 
   * @param {Object} resultData - Message data for the function_call_output
   */
  async appendToolResult(resultData) {
    const metadata = resultData.metadata || {};
    const output = metadata.output || {};
    
    // Try to use vox tool renderer to create complete result block
    let resultElement = null;
    if (resultData.source === 'audio' && this.voxToolRenderers) {
      const renderer = this.voxToolRenderers.find(r => r.matches(resultData));
      if (renderer) {
        // Render complete result (code + result in one details block)
        resultElement = await renderer.renderToolResult(resultData, this.showDebug);
        
        // REPLACE the existing details block (not append)
        if (this.partsContainer && resultElement) {
          const existingDetails = this.partsContainer.querySelector('details');
          if (existingDetails) {
            existingDetails.replaceWith(resultElement);
          } else {
            // No existing details - just add it
            this.partsContainer.appendChild(resultElement);
          }
        }
        
        // Update raw display and return early
        if (this._messageData) {
          if (!this._messageData._appendedResults) {
            this._messageData._appendedResults = [];
          }
          this._messageData._appendedResults.push(resultData);
          this.updateRawDisplay();
        }
        return;
      }
    }
    
    // Fallback to generic text formatting if no renderer matched
    const divider = document.createElement('div');
    divider.style.marginTop = '8px';
    divider.style.paddingTop = '8px';
    divider.style.borderTop = '1px solid rgba(128,128,128,0.2)';
    
    const resultContent = document.createElement('div');
    resultContent.className = 'tool-result-appended';
    
    // Format result text
    let resultText = '';
    if (output.error || !output.success) {
      resultText = `↩️ **Error:** ${output.error || 'Unknown error'}`;
    } else {
      // Show compact result
      if (output.response !== undefined) {
        resultText = `↩️ **Result:** ${output.response}`;
      } else if (output.result !== undefined) {
        const resultStr = typeof output.result === 'object' 
          ? JSON.stringify(output.result)
          : String(output.result);
        resultText = `↩️ **Result:** ${resultStr}`;
      } else if (output.message) {
        resultText = `↩️ **Result:** ${output.message}`;
      } else {
        resultText = `↩️ **Result:** ${JSON.stringify(output)}`;
      }
    }
    
    // Render as markdown
    const resultEl = await this.createMarkdownElement(resultText);
    resultContent.appendChild(resultEl);
    
    // Append to partsContainer (fallback path - append, don't replace)
    if (this.partsContainer) {
      this.partsContainer.appendChild(divider);
      this.partsContainer.appendChild(resultContent);
    }
    
    // Update raw display to include result
    if (this._messageData) {
      // Store result metadata for debugging
      if (!this._messageData._appendedResults) {
        this._messageData._appendedResults = [];
      }
      this._messageData._appendedResults.push(resultData);
      this.updateRawDisplay();
    }
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

    // Support both opencode format (_opencodeMessage) and legacy format (_messageData)
    const dataToShow = this._opencodeMessage || this._messageData;
    
    if (this._showRaw && dataToShow) {
      this.rawDisplay.style.display = 'block';
      this.rawJson.textContent = JSON.stringify(dataToShow, null, 2);
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
    this.classList.remove('audio-user', 'audio-tool', 'audio-assistant', 'audio-system');
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
      } else if (role === 'system') {
        this.classList.add('audio-system');
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
    const usageStats = this.get("#usageStats");
    if (!this.showDebug) {
      this.debugHeader.classList.add('hidden');
      this.get("#inspect").classList.add('hidden')
      this.get("#viewRawButton").classList.add('hidden')
      if (usageStats) usageStats.classList.add('hidden');
      return;
    }
    this.debugHeader.classList.remove('hidden');
    this.get("#inspect").classList.remove('hidden')
    this.get("#viewRawButton").classList.remove('hidden')

    const info = opencodeMessage.info || {};
    const parts = opencodeMessage.parts || [];

    // Get timestamp - prefer localTimestamp (numeric) over info.time.created (ISO string)
    const timestamp = opencodeMessage.localTimestamp || info.time?.created;
    const timestampHtml = timestamp 
      ? `<span class="debug-item"><span class="debug-label">timestamp</span> ${this.formatTimestamp(timestamp)}</span>`
      : '';

    this.debugHeader.innerHTML = [
      `<span class="debug-item"><span class="debug-label">id</span> ${info.id || 'unknown'}</span>`,
      `<span class="debug-item"><span class="debug-label">role</span> ${info.role || 'unknown'}</span>`,
      timestampHtml,
      `<span class="debug-item"><span class="debug-label">parts</span> ${parts.length}</span>`,
      `<span class="debug-item"><span class="debug-label">types</span> ${parts.map(p => p.type).join(', ')}</span>`
    ].filter(s => s).join(' | ');

    // Render usage statistics panel (only for assistant messages with token data)
    if (usageStats) {
      this.renderUsageStats(usageStats, info);
    }
  }

  renderUsageStats(el, info) {
    const tokens = info.tokens;
    const cost = info.cost;
    const time = info.time;

    // Only show if there's at least role info (i.e. it's a real message)
    if (!info.role) {
      el.classList.add('hidden');
      return;
    }

    el.classList.remove('hidden');

    const rows = [];

    // Model (short form)
    if (info.modelID) {
      const shortModel = info.modelID.replace('claude-', '').replace(/-2025\d*/, '');
      rows.push(`<div class="stat-row"><span class="stat-label">model</span><span class="stat-value">${shortModel}</span></div>`);
    }

    // Timing: show elapsed if still streaming, final duration if complete
    if (time?.created) {
      if (time.completed) {
        const durationSec = ((time.completed - time.created) / 1000).toFixed(1);
        rows.push(`<div class="stat-row stat-section"><span class="stat-label">time</span><span class="stat-value">${durationSec}s</span></div>`);
      } else {
        const elapsedSec = ((Date.now() - time.created) / 1000).toFixed(1);
        rows.push(`<div class="stat-row stat-section"><span class="stat-label">time</span><span class="stat-value">~${elapsedSec}s</span></div>`);
      }
    }

    // Tokens - show all defined values including zeros during streaming
    if (tokens) {
      if (tokens.input !== undefined) {
        rows.push(`<div class="stat-row"><span class="stat-label">in</span><span class="stat-value">${tokens.input.toLocaleString()}</span></div>`);
      }
      if (tokens.output !== undefined) {
        rows.push(`<div class="stat-row"><span class="stat-label">out</span><span class="stat-value">${tokens.output.toLocaleString()}</span></div>`);
      }
      if (tokens.reasoning !== undefined && tokens.reasoning > 0) {
        rows.push(`<div class="stat-row"><span class="stat-label">think</span><span class="stat-value">${tokens.reasoning.toLocaleString()}</span></div>`);
      }
      if (tokens.cache?.read !== undefined) {
        rows.push(`<div class="stat-row"><span class="stat-label">c.read</span><span class="stat-value">${tokens.cache.read.toLocaleString()}</span></div>`);
      }
      if (tokens.cache?.write !== undefined) {
        rows.push(`<div class="stat-row"><span class="stat-label">c.write</span><span class="stat-value">${tokens.cache.write.toLocaleString()}</span></div>`);
      }
      if (tokens.total !== undefined) {
        rows.push(`<div class="stat-row"><span class="stat-label">total</span><span class="stat-value">${tokens.total.toLocaleString()}</span></div>`);
      }
    }

    // Finish reason
    if (info.finish) {
      rows.push(`<div class="stat-row stat-section"><span class="stat-label">finish</span><span class="stat-value">${info.finish}</span></div>`);
    }

    // Cost: compute from token usage via claude-pricing.js (info.cost from OpenCode is often 0)
    // Rendered as a prominent second row at the bottom of the panel
    if (tokens && info.modelID) {
      // Strip date suffix from modelID: "claude-sonnet-4-5-20250929" -> "claude-sonnet-4-5"
      const modelKey = info.modelID.replace(/-\d{8}$/, '');
      const usage = {};
      if (tokens.input !== undefined) usage.baseInput = tokens.input;
      if (tokens.output !== undefined) usage.output = tokens.output;
      if (tokens.cache?.read !== undefined) usage.cacheHit = tokens.cache.read;
      if (tokens.cache?.write !== undefined) usage.cacheWrite5m = tokens.cache.write;
      const computed = computeCost(modelKey, usage);
      if (computed !== null) {
        rows.push(`<div class="cost-display">$${computed.toFixed(4)}</div>`);
      }
    }

    el.innerHTML = rows.join('');
  }

  /**
   * Create a lively-markdown element, connect it to the DOM so it initializes,
   * then set its content and return it.
   * We use a temporary off-screen container so initialize() runs before setContent.
   */
  async createMarkdownElement(markdownText) {
    const md = await lively.create('lively-markdown');
    try {
      await md.setContent(markdownText);
    } catch (error) {
      // If markdown rendering fails (e.g., script error), show error instead of breaking message
      console.error('[lively-chat-message] Markdown rendering error:', error);
      const errorMd = await lively.create('lively-markdown');
      await errorMd.setContent(`**⚠️ Markdown Rendering Error**\n\n\`\`\`\n${error.message || error}\n\`\`\``);
      return errorMd;
    }
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

  renderStepEvent(part) {
    if (!this.showDebug) {
      return null;
    }
    
    const container = document.createElement('div');
    container.className = 'step-event';
    
    if (part.type === 'step-start') {
      const emoji = '▶️';
      let text = `${emoji} Step started`;
      
      if (part.snapshot) {
        text += ` (snapshot: ${part.snapshot.substring(0, 8)})`;
      }
      
      container.textContent = text;
      container.style.cssText = 'color: #666; font-size: 11px; font-style: italic; margin: 4px 0; padding: 2px 0;';
      
    } else if (part.type === 'step-finish') {
      const emoji = '⏹️';
      const tokens = part.tokens || {};
      const parts = [];
      
      if (tokens.input !== undefined || tokens.output !== undefined) {
        const inStr = tokens.input !== undefined ? `${tokens.input.toLocaleString()}` : '?';
        const outStr = tokens.output !== undefined ? `${tokens.output.toLocaleString()}` : '?';
        parts.push(`${inStr}→${outStr} tokens`);
      }
      
      if (tokens.reasoning && tokens.reasoning > 0) {
        parts.push(`${tokens.reasoning.toLocaleString()} thinking`);
      }
      
      if (tokens.cache?.read && tokens.cache.read > 0) {
        parts.push(`${tokens.cache.read.toLocaleString()} cached`);
      }
      
      if (part.cost && part.cost > 0) {
        parts.push(`$${part.cost.toFixed(4)}`);
      }
      
      const text = parts.length > 0 
        ? `${emoji} Step complete: ${parts.join(', ')}`
        : `${emoji} Step complete`;
      
      container.textContent = text;
      container.style.cssText = 'color: #666; font-size: 11px; font-style: italic; margin: 4px 0; padding: 2px 0;';
      
      if (part.snapshot) {
        const debug = document.createElement('span');
        debug.textContent = ` (snapshot: ${part.snapshot.substring(0, 8)})`;
        debug.style.cssText = 'color: #999; font-size: 10px;';
        container.appendChild(debug);
      }
    }
    
    return container;
  }

  async renderOpenCodeParts(opencodeMessage) {
    const parts = opencodeMessage.parts || [];

    // Clear previous content
    this.partsContainer.innerHTML = '';

    // Show message-level error if present (e.g. MessageAbortedError, APIError)
    // Must happen before the empty-parts early return so errors are always shown
    const msgError = opencodeMessage.info?.error;
    if (msgError) {
      this.setAttribute('has-error', 'true');
      const name = msgError.name || 'Error';
      const detail = msgError.data?.message || '';
      const statusCode = msgError.data?.statusCode;
      const isRetryable = msgError.data?.isRetryable;
      let md = `**⚠️ ${name}${detail ? `: ${detail}` : ''}**`;
      if (statusCode) md += ` (HTTP ${statusCode})`;
      if (isRetryable === false) md += ` — not retryable`;
      else if (isRetryable === true) md += ` — retryable`;
      this.partsContainer.appendChild(await this.createMarkdownElement(md));
    } else {
      this.removeAttribute('has-error');
    }

    if (parts.length === 0) {
      if (!msgError) {
        this.partsContainer.appendChild(await this.createMarkdownElement('*...*'));
      }
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
        // Detect injected project focus block in user messages
        // New format: message first, then <system-reminder>...</system-reminder>
        // Legacy format: [lively4:project]...[/lively4:project]\n\nrest of message
        
        // Try new format first
        const REMINDER_START = '<system-reminder>';
        const REMINDER_END = '</system-reminder>';
        const ri = part.text.indexOf(REMINDER_START);
        const re = part.text.indexOf(REMINDER_END);

        if (ri !== -1 && re !== -1 && ri < re) {
          const beforeReminder = part.text.slice(0, ri).trim();
          const reminderText = part.text.slice(ri + REMINDER_START.length, re).trim();
          const afterReminder = part.text.slice(re + REMINDER_END.length).trim();

          // Render user message first
          if (beforeReminder) {
            this.partsContainer.appendChild(await this.createMarkdownElement(beforeReminder));
          }

          // Render system reminder as collapsible block
          const details = document.createElement('details');
          details.className = 'system-reminder-block';
          const summary = document.createElement('summary');
          const em = document.createElement('em');
          em.textContent = 'Project Focus';
          summary.appendChild(em);
          details.appendChild(summary);
          details.appendChild(await this.createMarkdownElement(reminderText));
          this.partsContainer.appendChild(details);

          // Render any content after reminder
          if (afterReminder) {
            this.partsContainer.appendChild(await this.createMarkdownElement(afterReminder));
          }
        } else {
          // Try legacy format for backward compatibility
          const PROJ_START = '[lively4:project]';
          const PROJ_END = '[/lively4:project]';
          const pi = part.text.indexOf(PROJ_START);
          const pe = part.text.indexOf(PROJ_END);

          if (pi !== -1 && pe !== -1 && pi < pe) {
            const projText = part.text.slice(pi + PROJ_START.length, pe).trim();
            const rest = part.text.slice(pe + PROJ_END.length).trim();

            const details = document.createElement('details');
            details.className = 'project-context-block';
            const summary = document.createElement('summary');
            const em = document.createElement('em');
            em.textContent = 'Project Focus';
            summary.appendChild(em);
            details.appendChild(summary);
            details.appendChild(await this.createMarkdownElement(projText));
            this.partsContainer.appendChild(details);

            if (rest) {
              this.partsContainer.appendChild(await this.createMarkdownElement(rest));
            }
          } else {
            // No special formatting - render as normal text
            this.partsContainer.appendChild(await this.createMarkdownElement(part.text));
          }
        }
      } else if (part.type === 'reasoning') {
        // Extended thinking block: for one-liners, show inline; for multi-line, show collapsible
        const isOneLiner = !part.text.includes('\n') || part.text.trim().split('\n').length === 1;
        
        if (isOneLiner) {
          // Single line: display inline beside indicator
          const container = document.createElement('div');
          container.style.cssText = 'display: inline-flex; align-items: center; gap: 8px; margin: 4px 0; white-space: nowrap;';
          
          const indicator = document.createElement('span');
          indicator.innerHTML = '💭 <em>Thinking...</em>';
          
          const content = document.createElement('span');
          content.style.cssText = 'font-size: 11px; color: #666;';
          content.textContent = part.text.trim();
          
          container.appendChild(indicator);
          container.appendChild(content);
          this.partsContainer.appendChild(container);
        } else {
          // Multi-line: collapsible details element
          const details = <details>
            <summary>💭 <em>Thinking...</em></summary>
          </details>;
          details.appendChild(await this.createMarkdownElement(part.text));
          this.partsContainer.appendChild(details);
        }
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
        // Step events - render as compact one-liners with key information
        const el = this.renderStepEvent(part);
        if (el) this.partsContainer.appendChild(el);
      } else {
        // Unknown part type - show as JSON (only in debug mode)
        if (this.showDebug) {
          const md = `### ⚠️ Unknown Part Type: ${part.type}\n\n\`\`\`json\n${JSON.stringify(part, null, 2)}\n\`\`\`\n\n`;
          this.partsContainer.appendChild(await this.createMarkdownElement(md));
        }
      }
    }
  }


  /**
   * Detect if a message contains a system-like pattern: [System: ...]
   * These are technically user messages but contain system information
   * @param {Object} messageObj - Message object to check
   * @returns {Object|null} - Parsed system info or null if not a system message
   */
  parseSystemMessage(messageObj) {
    // Only check user messages from audio source (voice agent)
    if (messageObj.role !== 'user' || messageObj.source !== 'audio') {
      return null;
    }

    const content = messageObj.content || '';
    const systemPattern = /^\[System:\s*(.+)\]$/;
    const match = content.match(systemPattern);
    
    if (match) {
      return {
        isSystemMessage: true,
        systemContent: match[1].trim()
      };
    }
    
    return null;
  }

  async renderContent(messageObj) {
    let content = messageObj.content || '';

    // Check if this is a special system message from voice agent
    const systemInfo = this.parseSystemMessage(messageObj);
    if (systemInfo) {
      await this.renderSystemMessage(systemInfo.systemContent, messageObj);
      return;
    }

    // Format user messages with quotes (matching current behavior)
    if (messageObj.role === 'user') {
      content = `"${content}"`;
    }

    // For vox (voice agent) tool messages, use dedicated vox tool renderers
    if (messageObj.role === 'tool' && messageObj.source === 'audio' && messageObj.metadata) {
      await this.renderVoxToolMessage(messageObj);
      return;
    }

    // For other tool messages, create structured display (legacy path)
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
  }

  /**
   * Render a system message with special styling
   * @param {string} systemContent - The system message content
   * @param {Object} originalMessage - Original message object for metadata
   */
  async renderSystemMessage(systemContent, originalMessage) {
    // Change role attribute to 'system' for proper styling
    this.setAttribute('role', 'system');
    this.setAttribute('source', 'audio');
    
    // Apply positioning for system messages
    this.applyPositioning({ role: 'system', source: 'audio' });

    // Show the message
    this.style.display = '';

    // Render system content in italic style
    const formattedContent = `*${systemContent}*`;

    // Set markdown content
    if (this.partsContainer) {
      this.partsContainer.innerHTML = '';
      this.partsContainer.appendChild(await this.createMarkdownElement(formattedContent));
    }
  }

  /**
   * Render vox (voice agent) tool messages using dedicated vox tool renderers.
   * This provides a separate rendering path from OpenCode tools while matching the style.
   */
  async renderVoxToolMessage(messageObj) {
    const metadata = messageObj.metadata || {};
    
    // Check if this is a local/internal function that should be hidden
    const functionName = metadata.functionName || '';
    if (this.isLocalFunction(functionName)) {
      this.style.display = 'none';
      return;
    }

    // Show the message
    this.style.display = '';

    // Clear previous content
    if (this.partsContainer) {
      this.partsContainer.innerHTML = '';
    }

    // Find matching renderer
    const renderer = this.voxToolRenderers.find(r => r.matches(messageObj));
    
    if (!renderer) {
      console.warn('No vox renderer matched for message:', messageObj);
      // Fallback to old formatToolMessage
      const content = this.formatToolMessage(messageObj);
      if (content && this.partsContainer) {
        this.partsContainer.appendChild(await this.createMarkdownElement(content));
      }
      return;
    }

    // Render using the appropriate method based on message type
    let element = null;
    if (metadata.type === 'function_call') {
      element = await renderer.renderToolCall(messageObj, this.showDebug);
    } else if (metadata.type === 'function_call_output') {
      element = await renderer.renderToolResult(messageObj, this.showDebug);
    }

    // Append rendered element
    if (element && this.partsContainer) {
      this.partsContainer.appendChild(element);
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
    this._opencodeMessage = other._opencodeMessage || other._rawMessage; // Handle old name
    this._showRaw = other._showRaw;
  }
}
