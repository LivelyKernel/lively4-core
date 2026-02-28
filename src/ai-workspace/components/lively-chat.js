import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import { analyzeJSONL, generateStatsTree } from 'src/client/utils/stats.js';

/*MD
# Lively Chat Base Class

Shared superclass for AI-related chat components:
- lively-ai-workspace
- openai-realtime-chat
- lively-opencode

This base class provides common functionality and styles for chat interfaces.

## Shared Properties

- `messagesUI` - Show/hide message display pane
- `sessionUI` - Show/hide session management UI
- `showDebug` - Show debug annotations in messages

## Shared Methods

- `setupInputHandling(inputSelector)` - Configure Enter to send pattern
- `scrollToBottom(container, force)` - Scroll container to bottom
- `generateToggleIcon(state)` - Generate checkbox icon for context menu
- `createBaseContextMenu()` - Base context menu items

## Extension Points

Override these methods in subclasses to customize behavior:
- `getContextMenuItems()` - Add component-specific menu items

MD*/

export default class LivelyChat extends Morph {

  /*MD ## Initialization MD*/

  initialize() {

    // IMPORTANT: Preserve event capture across live updates
    // Map<sessionId, event[]> - accumulates across sessions, survives livelyMigrate
    this._eventCapture = this._eventCapture || new Map();
    this._replayMode = this._replayMode || false;
    this._seekInProgress = this._seekInProgress || false;
    this._savedStateBeforeReplay = this._savedStateBeforeReplay || null;

    // Event source identifier (override in subclasses)
    this.eventSource = this.eventSource || null;

    // Message rendering state (unified across all chat components)
    // Use || pattern to handle race conditions where methods are called before initialize() completes
    this.chatMessages = this.chatMessages || new Map();           // messageId -> widget element
    this.pendingUpdates = this.pendingUpdates || new Map();       // messageId -> array of updates that arrived early
    this.renderingMessages = this.renderingMessages || new Set(); // messageIds currently being rendered
  }

  /**
   * CENTRALIZED DATABASE WRITE GUARD - Inherited by all chat components
   *
   * This is the SINGLE SOURCE OF TRUTH for database write permissions.
   * All subclasses (openai-realtime-chat, lively-opencode, lively-ai-workspace)
   * MUST use this method before ANY database write operation.
   *
   * DO NOT override in subclasses unless you have a very good reason.
   * DO NOT add duplicate guards in subclasses - use this inherited method.
   *
   * @returns {boolean} true if database writes are allowed, false if blocked (replay mode)
   */
  canWriteToDatabase() {
    // Block ALL database writes during replay mode
    return !this._replayMode;
  }

  /**
   * Enable replay mode - blocks database writes and prepares for event replay
   * Override in subclasses to add component-specific replay setup
   * @returns {string|null} Optional session ID for artificial replay session
   */
  enableReplay() {
    // Save current state before entering replay mode
    this._savedStateBeforeReplay = this.saveStateBeforeReplay();

    this._replayMode = true;
    this.log('[replay] Replay mode enabled - database writes blocked');
    return null;  // Subclasses can return artificial session ID
  }

  /**
   * Save state before replay to restore later
   * Override in subclasses to save component-specific state
   */
  saveStateBeforeReplay() {
    // Base class has no state to save
    // Subclasses like workspace should override this
    return null;
  }

  /**
   * Restore state after replay ends
   * Override in subclasses to restore component-specific state
   */
  async restoreStateAfterReplay() {
    // Base class has no state to restore
    // Subclasses like workspace should override this
  }

  /**
   * Disable replay mode - re-enables database writes and normal operation
   * Override in subclasses to add component-specific cleanup
   */
  disableReplay() {
    this._replayMode = false;
    this.log('[replay] Replay mode disabled - database writes enabled');
  }

  /*MD ## Custom Events MD*/

  dispatchMessageEvent(name, data) {
    this.dispatchEvent(new CustomEvent(name, {
        detail: data,
        bubbles: true,
        composed: true
      }));
  }
  
  /*MD ## Shared Properties MD*/

  set messagesUI(value) {
    // Control whether messages are rendered in the UI
    // Default (undefined/true) renders messages normally
    // Set to false to disable UI rendering (e.g., when embedded in workspace)
    if (value === false || value === "false") {
      this.setAttribute("messages-ui", "false");
    } else if (value === true || value === "true") {
      this.setAttribute("messages-ui", "true");
    } else {
      this.removeAttribute("messages-ui");
    }
  }

  get messagesUI() {
    const attr = this.getAttribute("messages-ui");
    if (attr === "false") return false;
    return true; // default is visible
  }

  set sessionUI(value) {
    // Control whether session management UI is shown
    // Default (undefined/true) shows the session panel
    // Set to false to hide when embedded or managed externally
    if (value === false || value === "false") {
      this.setAttribute("session-ui", "false");
    } else if (value === true || value === "true") {
      this.setAttribute("session-ui", "true");
    } else {
      this.removeAttribute("session-ui");
    }
  }

  get sessionUI() {
    const attr = this.getAttribute("session-ui");
    if (attr === "false") return false;
    return true; // default is visible
  }

  set loggingUI(value) {
    // Control whether logging panel is shown
    // Default (undefined/true) shows the logging panel
    // Set to false to hide when embedded or managed externally
    if (value === false || value === "false") {
      this.setAttribute("logging-ui", "false");
    } else if (value === true || value === "true") {
      this.setAttribute("logging-ui", "true");
    } else {
      this.removeAttribute("logging-ui");
    }
  }

  get loggingUI() {
    const attr = this.getAttribute("logging-ui");
    if (attr === "false") return false;
    return true; // default is visible
  }

  set showDebug(value) {
    // Control whether debug annotations are shown in messages
    this._showDebug = value;
    // Also control debug log panel visibility
    this.setAttribute("hide-debug-log", value ? "false" : "true");
    // Update existing messages if messages container exists
    this.updateMessagesDebugState();
  }

  get showDebug() {
    return this._showDebug || false;
  }

  /*MD ## Shared Utility Methods MD*/

  /**
   * Update debug state on all existing message elements
   * Subclasses should override to target correct container
   */
  updateMessagesDebugState() {
    // Override in subclass with specific container selector
  }

  /*MD ## Message Rendering - Shared Logic MD*/

  /**
   * Render a chat message widget and track it (SINGLE SOURCE OF TRUTH)
   * 
   * This method handles message rendering with support for:
   * - Simple messages (realtime voice chat)
   * - Complex streaming with race conditions (OpenCode SSE)
   * - Buffering for parts that arrive before message creation
   * - Late updates that arrive during rendering
   * 
   * The complexity here solves real streaming problems:
   * 1. Parts can arrive via SSE before the message.created event
   * 2. Updates can arrive while setOpenCodeMessage() is still running (async)
   * 3. Multiple components render into same container (workspace)
   * 
   * @param {Object} message - Message object (OpenCode format or simple {role, content})
   * @param {string} messageId - Unique message ID for tracking
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container to append to (defaults to this.messagesContainer)
   * @param {boolean} options.enableBuffering - Enable race condition protection (default: true)
   * @param {Object} options.metadata - Metadata passed to setOpenCodeMessage (e.g., {source, streamType})
   * @returns {HTMLElement} The created message widget
   */
  async renderChatMessage(message, messageId, options = {}) {
    const {
      container = this.messagesContainer,
      enableBuffering = true,
      metadata = null
    } = options;
    
    if (!container) return null;

    // Step 1: Pre-render buffering (for streaming with race conditions)
    if (enableBuffering && messageId) {
      this.renderingMessages.add(messageId);

      // IMPORTANT: Merge any buffered parts that arrived before message creation
      // This happens when SSE sends parts before message.created event
      if (this.pendingUpdates.has(messageId)) {
        const pending = this.pendingUpdates.get(messageId);
        this.log(`[chat] merging ${pending.length} buffered parts into message before rendering`);
        
        // Merge parts from all buffered updates
        for (const bufferedMsg of pending) {
          if (bufferedMsg.parts && message.parts) {
            for (const part of bufferedMsg.parts) {
              // Only add if not already present
              if (!message.parts.find(p => p.id === part.id)) {
                message.parts.push(part);
              }
            }
          }
        }
        
        // Clear pending updates since we've merged them
        this.pendingUpdates.delete(messageId);
      }
    }

    // Step 2: Create widget
    const widget = await lively.create('lively-chat-message');

    // Step 3: Append to DOM IMMEDIATELY to preserve message order
    // CRITICAL: Must happen before async setOpenCodeMessage() call
    // Otherwise messages can appear out of order when streaming
    container.appendChild(widget);
    
    // Step 4: Track element IMMEDIATELY after creation
    // This prevents race conditions where part updates arrive before rendering completes
    if (messageId) {
      this.chatMessages.set(messageId, widget);
    }

    // Step 5: Set content (auto-detect format and call appropriate method)
    if (message.info && message.parts) {
      // OpenCode format: {info: {id, role, time}, parts: [...]}
      await widget.setOpenCodeMessage(message, metadata);
    } else {
      // Simple format: {role, content} or {role, content, item_id, ...}
      await widget.setMessage(message);
    }
    
    // Apply debug state from parent
    widget.showDebug = this.showDebug;

    // Step 6: Post-render handling (for streaming with race conditions)
    if (enableBuffering && messageId) {
      this.log(`[chat] renderMessage complete for ${messageId}`);
      this.renderingMessages.delete(messageId);

      // Check if new updates arrived while we were rendering (after merge but during render)
      if (this.pendingUpdates.has(messageId)) {
        const pending = this.pendingUpdates.get(messageId);
        this.log(`[chat] applying ${pending.length} updates that arrived during rendering`);
        
        // Apply only the latest update (it contains all the current parts)
        const latestUpdate = pending[pending.length - 1];
        if (latestUpdate.info && latestUpdate.parts) {
          await widget.setOpenCodeMessage(latestUpdate, metadata);
        } else {
          await widget.setMessage(latestUpdate);
        }
        
        this.pendingUpdates.delete(messageId);
      }
    }
    
    // Step 7: Scroll to bottom (unless batching)
    if (!this._batchRendering) {
      this.scrollToBottom(container);
    }
    
    return widget;
  }

  /**
   * Log a debug message to the debug log panel (if present)
   * @param {string} message - The message to log
   */
  log(...args) {
    const debugLog = this.get('#debugLog');
    if (!debugLog) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const li = <li><span class="timestamp" style="color:gray">[{timestamp}] </span></li>;
    

    for(let ea of args) {
      if (ea instanceof HTMLElement) {
        li.appendChild(ea) 
      } else  if (_.isObject(ea)) {
        li.appendChild(<a click={() => lively.openInspector(ea)}>{ea} </a>)
      } else {
        li.appendChild(<span>{ea} </span>)
      }
    }
    
    debugLog.appendChild(li);

    // Auto-scroll to bottom
    debugLog.scrollTop = debugLog.scrollHeight;
    
    return li
  }
  
  onClearLogButton() {
    this.clearDebugLog()
  }
  
  clearDebugLog() {
    const debugLog = this.get('#debugLog');
    if (debugLog) {
      debugLog.innerHTML = '';
    }
  }

  setupInputHandling(inputSelector, sendHandler) {
    const input = this.get(inputSelector);
    if (input) {
      input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter' && !evt.shiftKey) {
          evt.preventDefault();
          sendHandler.call(this);
        }
      });
    }
  }

  scrollToBottom(container, force = false, delay = 10) {
    if (!container) return;

    const shouldScroll = force || this.isAtBottom(container);
    if (shouldScroll) {
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, delay);
    }
  }

  isAtBottom(container, threshold = 50) {
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return (scrollHeight - scrollTop - clientHeight) < threshold;
  }

  generateToggleIcon(state) {
    return state
      ? '<i class="fa fa-check-square-o" aria-hidden="true"></i>'
      : '<i class="fa fa-square-o" aria-hidden="true"></i>';
  }

  /*MD ## Event Capture and Replay System MD*/
  captureEvent(type, data, sessionId) {
    if (this._replayMode) return; // Don't capture during replay

    if (!this._eventCapture.has(sessionId)) {
      this._eventCapture.set(sessionId, []);
    }
    this._eventCapture.get(sessionId).push({
      timestamp: Date.now(),
      type: type,
      sessionId: sessionId,
      source: this.eventSource,
      data: data
    });
  }

  // For restoring events from DB into the Map (bypasses replay guard)
  addCapturedEvent(event) {
    const sessionId = event.sessionId;
    if (!this._eventCapture.has(sessionId)) {
      this._eventCapture.set(sessionId, []);
    }
    this._eventCapture.get(sessionId).push(event);
  }

  // Returns events for one session, or all sessions flattened and sorted by timestamp
  getCapturedEvents(sessionId = null) {
    if (sessionId !== null) {
      return this._eventCapture.get(sessionId) || [];
    }
    const all = [];
    for (const events of this._eventCapture.values()) {
      all.push(...events);
    }
    return all.sort((a, b) => a.timestamp - b.timestamp);
  }

  get capturedEventCount() {
    let total = 0;
    for (const events of this._eventCapture.values()) {
      total += events.length;
    }
    return total;
  }

  compactEvents(array) {
    return array.map(event => {
      const compacted = JSON.parse(JSON.stringify(event));
      if (compacted.data) {
        this.compactEventData(compacted.data);
      }
      return compacted})
  }
  
  async exportChatHistory(compactEvents) {
    // Filter to current session if available, so selecting a session and copying gives that session's events
    const sessionId = this.currentSession?.id ?? null;
    var events = this.getCapturedEvents(sessionId)
    if (compactEvents) events = this.compactEvents(events)
    
    let jsonl =  events.map(event => JSON.stringify(event)).join('\n');

    await navigator.clipboard.writeText(jsonl);
    lively.success(`Copied ${events.length} events to clipboard`);
  }

  async exportChatHistoryShortened() {
    return this.exportChatHistory(true)
  }

  _getEventsForExport() {
    const sessionId = this.currentSession?.id ?? null;
    return this.getCapturedEvents(sessionId);
  }

  _generateJSONL(compact = false) {
    const events = this._getEventsForExport();
    return events.map(event => {
      if (!compact) return JSON.stringify(event);
      const compacted = JSON.parse(JSON.stringify(event));
      if (compacted.data) this.compactEventData(compacted.data);
      return JSON.stringify(compacted);
    }).join('\n');
  }

  async _exportStatistics({ compact = false, tree = false } = {}) {
    const events = this._getEventsForExport();

    if (events.length === 0) {
      lively.warn("No events to analyze");
      return;
    }

    const jsonl = this._generateJSONL(compact);
    const stats = analyzeJSONL(jsonl);
    const output = tree ? generateStatsTree(stats, 1) : JSON.stringify(stats, null, 2);

    await navigator.clipboard.writeText(output);

    const mode = compact ? "shortened " : "";
    const format = tree ? "tree" : "statistics";
    lively.success(`Copied ${mode}${format} for ${events.length} events to clipboard`);
  }

  async exportChatStatistics() {
    return this._exportStatistics({ compact: false, tree: false });
  }

  async exportChatStatisticsTree() {
    return this._exportStatistics({ compact: false, tree: true });
  }

  async exportChatStatisticsShortened() {
    return this._exportStatistics({ compact: true, tree: false });
  }

  async exportChatStatisticsTreeShortened() {
    return this._exportStatistics({ compact: true, tree: true });
  }

  /**
   * Compact event data by removing verbose instruction fields (mutates in place)
   * Optimized for both realtime and opencode event formats
   * Keeps all messages and meaningful content, just removes system prompts and large configs
   * @param {object} data - Event data object (will be mutated)
   */
  compactEventData(data) {
    if (!data || typeof data !== 'object') return;

    // === AI Workspace / Claude API compaction ===

    // Remove large system prompts (appears in properties.info.system)
    if (data.info?.system && Array.isArray(data.info.system)) {
      delete data.info.system;
    }
    if (data.properties?.info?.system && Array.isArray(data.properties.info.system)) {
      delete data.properties.info.system;
    }

    // === Realtime API compaction ===

    // Remove verbose instruction fields from session configuration
    // These appear in session.created and session.updated events from OpenAI
    if (data.session?.instructions) {
      const instructions = data.session.instructions;
      data.session.instructions = `[${instructions.length} chars]`;
    }

    // Compact tools array if present (keep count but not full definitions)
    if (data.session?.tools && Array.isArray(data.session.tools) && data.session.tools.length > 0) {
      const toolCount = data.session.tools.length;
      const toolNames = data.session.tools.map(t => t.name).join(', ');
      data.session.tools = `[${toolCount} tools: ${toolNames}]`;
    }

    // Compact modalities array (just show count and types)
    if (data.session?.modalities && Array.isArray(data.session.modalities)) {
      data.session.modalities = `[${data.session.modalities.join(', ')}]`;
    }
    if (data.response?.modalities && Array.isArray(data.response.modalities)) {
      data.response.modalities = `[${data.response.modalities.join(', ')}]`;
    }

    // Compact turn detection config (not needed in shortened version)
    if (data.session?.turn_detection) {
      const td = data.session.turn_detection;
      data.session.turn_detection = `[${td.type}, threshold: ${td.threshold}]`;
    }

    // Compact output array in responses (keep length but not full content)
    if (data.response?.output && Array.isArray(data.response.output)) {
      const outputCount = data.response.output.length;
      const roles = data.response.output.map(o => o.role).filter(Boolean).join(', ');
      data.response.output = `[${outputCount} items: ${roles || 'n/a'}]`;
    }

    // Keep audio transcript deltas but mark obfuscation as compacted
    if (data.obfuscation && typeof data.obfuscation === 'string') {
      // Obfuscation strings are meaningless for analysis - just note their presence
      data.obfuscation = '[obfuscated]';
    }

    // Compact rate limits to just show remaining/limit
    if (data.rate_limits && Array.isArray(data.rate_limits)) {
      data.rate_limits = data.rate_limits.map(rl => ({
        name: rl.name,
        remaining: rl.remaining,
        limit: rl.limit
      }));
    }

    // === OpenCode compaction ===

    // OpenCode may have different verbose fields - add compaction as needed
    // (Currently OpenCode events are relatively compact, but we can expand this)

    // Compact large tool outputs if present
    if (data.tool_output && typeof data.tool_output === 'string' && data.tool_output.length > 500) {
      data.tool_output = `[${data.tool_output.length} chars] ${data.tool_output.substring(0, 100)}...`;
    }
  }

  async replayEventsFromClipboard() {
    const jsonl = await navigator.clipboard.readText();

    if (!jsonl || jsonl.trim().length === 0) {
      lively.warn("Clipboard is empty");
      return;
    }

    const lines = jsonl.split('\n').filter(line => line.trim());
    const events = lines.map(line => JSON.parse(line));

    if (events.length === 0) {
      lively.warn("No events found in clipboard");
      return;
    }

    lively.notify(`Loading ${events.length} events for replay...`);

    // Populate _eventCapture so getCapturedEvents() returns these events.
    // This lets the replay UI (lively-chat-replay) read and display them,
    // and lets all replay controls (step, seek, rewind, play) work correctly.
    this.loadEventsForReplay(events);

    // Open the replay UI in paused mode — user drives playback from there.
    await this.openReplayUI();
  }

  replayMessageEvent(event, replaySessionId) {
    // subclass responsibility
  }

  clearEventCapture() {
    this._eventCapture = new Map();
    // Also clear any capture deduplication tracking
    if (this._capturedItemIds) {
      this._capturedItemIds.clear();
    }
  }

  /**
   * Populate _eventCapture from an events array so the replay UI can read them
   * via getCapturedEvents().  Override in subclasses (e.g. workspace) to
   * distribute events to the correct child component by event.source.
   * @param {Array} events - Array of event objects (from clipboard or database)
   */
  loadEventsForReplay(events) {
    this.clearEventCapture();
    events.forEach(event => this.addCapturedEvent(event));
  }

  /*MD ## Replay Controls MD*/

  /**
   * Create replay control UI using Lively JSX
   * Shows pause/resume, stop, speed control, and progress indicator
   * @returns {HTMLElement} The replay controls element
   */
  createReplayControls() {
    const controls = <div id="replayControls" class="replay-controls">
      <button id="replayPauseButton" click={evt => this.onReplayPauseButton(evt)}>⏸️ Pause</button>
      <button id="replayStopButton" click={evt => this.onReplayStopButton(evt)}>⏹️ Stop</button>
      <select id="replaySpeedSelect" change={evt => this.onReplaySpeedChange(evt)}>
        <option value="1">1x</option>
        <option value="2">2x</option>
        <option value="5">5x</option>
        <option value="0">Instant</option>
      </select>
      <span id="replayProgress">0/0 events</span>
    </div>;
    return controls;
  }

  /**
   * Show replay controls in the replayControlsPlaceholder
   * All subclasses should have a #replayControlsPlaceholder element in their template
   */
  showReplayControls() {
    // Skip if workspace is controlling replay
    if (this._suppressReplayControls) return;

    // Remove existing controls if present
    this.hideReplayControls();

    // Create and insert controls into placeholder
    const controls = this.createReplayControls();
    const placeholder = this.get('#replayControlsPlaceholder');

    if (placeholder) {
      placeholder.appendChild(controls);
    } else {
      console.warn('[LivelyChat] No #replayControlsPlaceholder found in template');
    }
  }

  /**
   * Hide and remove replay controls from DOM
   */
  hideReplayControls() {
    const controls = this.get('#replayControls');
    if (controls) {
      controls.remove();
    }
  }

  /**
   * Update replay progress indicator
   * @param {number} current - Current event index
   * @param {number} total - Total number of events
   */
  updateReplayProgress(current, total) {
    const progress = this.get('#replayProgress');
    if (progress) {
      progress.textContent = `${current}/${total} events`;
    }
  }

  /**
   * Handle pause/resume button click
   */
  onReplayPauseButton(evt) {
    this._replayPaused = !this._replayPaused;

    // Update button label
    const btn = this.get('#replayPauseButton');
    if (btn) {
      btn.textContent = this._replayPaused ? '▶️ Resume' : '⏸️ Pause';
    }

    this.log(`[replay] ${this._replayPaused ? 'Paused' : 'Resumed'}`);
  }

  /**
   * Handle stop button click
   */
  onReplayStopButton(evt) {
    this.stopReplay();
    lively.notify('Replay stopped');
  }

  /**
   * Handle speed change
   * @param {Event} evt - Change event from select element
   */
  onReplaySpeedChange(evt) {
    this._replaySpeed = parseFloat(evt.target.value);
    const speedText = this._replaySpeed === 0 ? 'Instant' : `${this._replaySpeed}x`;
    this.log(`[replay] Speed changed to ${speedText}`);
  }

  /**
   * Stop replay and clean up
   * Cancels all pending timeouts and exits replay mode
   * @param {Object} options - Options for stopping replay
   * @param {boolean} options.keepUIOpen - If true, keep replay UI window open for reuse
   */
  async stopReplay({ keepUIOpen = false } = {}) {
    // Guard: Don't stop if not in replay mode or already stopping
    if (!this._replayMode || this._stoppingReplay) {
      return;
    }

    this._stoppingReplay = true;

    try {
      // Clear all pending timeouts
      if (this._replayTimeouts) {
        this._replayTimeouts.forEach(id => clearTimeout(id));
        this._replayTimeouts = [];
      }

      // Clear single timeout if present
      if (this._replayTimeout) {
        clearTimeout(this._replayTimeout);
        this._replayTimeout = null;
      }

      // Exit replay mode
      this._replayMode = false;
      this._replayPaused = false;
      this._replayCurrentEvent = -1;

      // Hide controls
      this.hideReplayControls();

      // Close replay UI if open (unless keepUIOpen is true)
      if (this._replayUI && !keepUIOpen) {
        const container = lively.findWindow(this._replayUI);
        if (container) {
          container.remove();
        }
        this._replayUI = null;
      }

      // Restore saved state (like workspace/session)
      if (this._savedStateBeforeReplay) {
        await this.restoreStateAfterReplay();
        this._savedStateBeforeReplay = null;
      }

      this.log('[replay] Stopped');
    } finally {
      this._stoppingReplay = false;
    }
  }

  /*MD ## New Replay UI Methods MD*/

  /**
   * Open the replay UI component in a separate window
   * Starts replay in paused/manual mode
   * Positions window on top of the chat window
   */
  async openReplayUI() {
    const replayUI = await lively.create('lively-chat-replay');
    replayUI.setChatComponent(this);

    // Start in paused/manual mode
    this.enableReplay();
    this._replayPaused = true;
    this._replayCurrentEvent = -1;  // Will increment to 0 on first step

    // Listen for commands from UI
    replayUI.addEventListener('replay-command', (evt) => {
      this.onReplayCommand(evt.detail);
    });

    const container = await lively.openInWindow(replayUI);

    // Set window size
    if (container && container.extent) {
      container.extent = lively.pt(600, 800);
    }

    // Position window on top of chat window
    const chatWindow = lively.findWindow(this);
    if (chatWindow && container) {
      const chatPos = lively.getPosition(chatWindow);
      const chatSize = lively.getExtent(chatWindow);

      // Position replay window centered on top of chat window
      const replaySize = lively.pt(600, 800);
      const centeredPos = chatPos.addPt(lively.pt(
        (chatSize.x - replaySize.x) / 2,
        Math.max(20, (chatSize.y - replaySize.y) / 2)
      ));

      lively.setPosition(container, centeredPos);

      // Bring to front
      container.style.zIndex = Math.max(
        ...[...document.querySelectorAll('lively-window')].map(w => parseInt(w.style.zIndex) || 0)
      ) + 1;
    }

    this._replayUI = replayUI;
    return replayUI;
  }

  /**
   * Handle commands from replay UI
   * @param {Object} command - Command object with action and optional data
   */
  onReplayCommand({ action, data }) {
    switch (action) {
      case 'step-forward':
        this.stepForwardOneEvent();
        break;
      case 'play':
        this.resumeAutoReplay();
        break;
      case 'pause':
        this.pauseReplay();
        break;
      case 'rewind':
        this.rewindReplay();
        break;
      case 'stop':
        this.stopReplay();
        break;
      case 'set-speed':
        this._replaySpeed = parseFloat(data.speed) || 1;
        this.log(`[replay] Speed changed to ${this._replaySpeed === 0 ? 'Instant' : this._replaySpeed + 'x'}`);
        break;
      case 'seek':
        this.seekToEvent(data.targetIndex);
        break;
    }
  }

  /**
   * Step forward one single event instantly (manual stepping)
   */
  stepForwardOneEvent() {
    if (!this._replayMode) return;

    // Use getCapturedEvents() to support workspace merged events
    const events = this.getCapturedEvents();
    const currentIndex = (this._replayCurrentEvent === undefined || this._replayCurrentEvent === null) ? -1 : this._replayCurrentEvent;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= events.length) {
      return;
    }

    const event = events[nextIndex];

    // Replay this single event INSTANTLY
    this.replayMessageEvent(event);

    // Update current position
    this._replayCurrentEvent = nextIndex;
    this.updateReplayProgress(nextIndex + 1, events.length);
  }

  /**
   * Resume auto replay with timing from current position
   */
  resumeAutoReplay() {
    if (!this._replayMode) return;

    // Use getCapturedEvents() to support workspace merged events
    const events = this.getCapturedEvents();
    const currentIndex = (this._replayCurrentEvent === undefined || this._replayCurrentEvent === null) ? -1 : this._replayCurrentEvent;

    // Unpause
    this._replayPaused = false;

    // Schedule remaining events with timing from current position
    const remainingEvents = events.slice(currentIndex + 1);

    if (remainingEvents.length === 0) {
      this.log('[replay] No more events to replay');
      return;
    }

    // Use current event's timestamp (or first event if at start)
    const previousTimestamp = currentIndex >= 0 ? events[currentIndex].timestamp : events[0].timestamp;
    this.scheduleEventFromIndex(currentIndex + 1, previousTimestamp);

    this.log('[replay] Resumed auto replay');
  }

  /**
   * Pause auto replay (can then step manually)
   */
  pauseReplay() {
    this._replayPaused = true;

    // Clear pending timeout to stop auto progression
    if (this._replayTimeout) {
      clearTimeout(this._replayTimeout);
      this._replayTimeout = null;
    }

    this.log('[replay] Paused');
  }

  /**
   * Rewind replay to the beginning
   * Completely resets UI state like switching to a fresh empty session
   */
  rewindReplay() {
    // Pause if playing
    this._replayPaused = true;

    // Clear all pending timeouts
    if (this._replayTimeout) {
      clearTimeout(this._replayTimeout);
      this._replayTimeout = null;
    }
    if (this._replayTimeouts) {
      this._replayTimeouts.forEach(id => clearTimeout(id));
      this._replayTimeouts = [];
    }

    // Reset to beginning
    this._replayCurrentEvent = -1;

    // Clean up session state (recursively cleans child components too)
    this.cleanupSession();

    // Update progress display
    const events = this.getCapturedEvents();
    this.updateReplayProgress(0, events.length);

    this.log('[replay] Rewound to start');
  }

  /**
   * Seek to a specific event index (instant replay)
   * @param {number} targetIndex - Target event index to seek to
   */
  async seekToEvent(targetIndex) {
    if (!this._replayMode) return;

    // Prevent overlapping seek operations
    if (this._seekInProgress) {
      this.log(`[replay] Seek already in progress, ignoring request`);
      return;
    }

    this._seekInProgress = true;

    try {
      const events = this.getCapturedEvents();
      const currentIndex = (this._replayCurrentEvent === undefined || this._replayCurrentEvent === null) ? -1 : this._replayCurrentEvent;

      // Validate target
      if (targetIndex < 0 || targetIndex >= events.length) {
        return;
      }

      // If seeking backward, use rewindReplay() for proper cleanup
      if (targetIndex < currentIndex) {
        this.rewindReplay();
        // rewindReplay() already pauses and resets to -1
      } else {
        // Forward seek: just pause
        this._replayPaused = true;
        if (this._replayTimeout) {
          clearTimeout(this._replayTimeout);
          this._replayTimeout = null;
        }
      }

      // Replay all events from start (or current) to target
      // Wait for each event's UI creation to complete before next one
      const startIndex = targetIndex < currentIndex ? 0 : currentIndex + 1;
      for (let i = startIndex; i <= targetIndex; i++) {
        await this.replayMessageEvent(events[i]);
      }

      // Update position
      this._replayCurrentEvent = targetIndex;
      this.updateReplayProgress(targetIndex + 1, events.length);

      this.log(`[replay] Seeked to event ${targetIndex + 1}/${events.length}`);
    } finally {
      this._seekInProgress = false;
    }
  }

  /**
   * Schedule events from a specific index with timing
   * @param {number} index - Event index to start from
   * @param {number} previousTimestamp - Timestamp of previous event (or start time)
   */
  scheduleEventFromIndex(index, previousTimestamp) {
    // Use getCapturedEvents() to support workspace merged events
    const events = this.getCapturedEvents();
    if (this._replayPaused || index >= events.length) return;

    const event = events[index];
    // Calculate delay from PREVIOUS event, not from start
    const delay = this.calculateDelay(event.timestamp - previousTimestamp);

    this._replayTimeout = setTimeout(() => {
      if (this._replayPaused) return;  // Check again before replaying

      this.replayMessageEvent(event);
      this._replayCurrentEvent = index;
      this.updateReplayProgress(index + 1, events.length);

      // Schedule next event, using CURRENT event timestamp as reference
      this.scheduleEventFromIndex(index + 1, event.timestamp);
    }, delay);
  }

  /**
   * Calculate delay for an event based on speed setting
   * @param {number} timeDelta - Time difference in milliseconds
   * @returns {number} Delay in milliseconds adjusted for speed
   */
  calculateDelay(timeDelta) {
    const speed = parseFloat(this._replaySpeed) || 1;
    if (speed === 0) return 0;  // Instant
    return timeDelta / speed;
  }

  /*MD ## Context Menu Support MD*/

  /**
   * Create base context menu items common to all chat components
   * Subclasses can override getContextMenuItems() to add more items
   */
  createBaseContextMenu(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const menuItems = this.getContextMenuItems();
    const menu = new ContextMenu(this, menuItems);
    menu.openIn(document.body, evt, this);
    return true;
  }

  /**
   * Override in subclass to add component-specific context menu items
   * @returns {Array} Array of menu item arrays
   */
  getContextMenuItems() {
    return  [
      ["Copy", () => {
        const selection = window.getSelection().toString();
        if (selection) {
          navigator.clipboard.writeText(selection);
          lively.notify("Copied", "Selection copied to clipboard");
        }
      }],
      [" Debug", () => {
        this.showDebug = !this.showDebug;
      }, "", this.generateToggleIcon(this.showDebug)],
      ["Copy Chat History", () => this.exportChatHistoryShortened()],
      ["Copy Chat Statistics", () => this.exportChatStatisticsTreeShortened()],
      ["Open Replay UI", () => this.openReplayUI()],
      ["Paste and Replay Chat History", () => this.replayEventsFromClipboard()],
    ];
  }
  
 
  /**
   * Clean up session state when switching sessions or rewinding replay
   * Override in subclasses to add component-specific cleanup
   */
  cleanupSession() {
    // Stop and remove all audio elements
    const audioElements = this.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
      audio.remove();
    });

    // Clear temporary UI indicators
    const temporaryElements = this.querySelectorAll('.thinking, .loading, .streaming');
    temporaryElements.forEach(el => el.remove());
  }
  
  livelyMigrate(other) {
    this.showDebug = other.showDebug;
    this._eventCapture = other._eventCapture || new Map();
    
    // Preserve message rendering state across hot reloads
    this.chatMessages = other.chatMessages || new Map();
    this.pendingUpdates = other.pendingUpdates || new Map();
    this.renderingMessages = other.renderingMessages || new Set();
  }
  
}
