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

  async initialize() {

    // IMPORTANT: Preserve event capture across live updates
    this._eventCapture = this._eventCapture || [];
    this._replayMode = this._replayMode || false;

    // Event source identifier (override in subclasses)
    this.eventSource = this.eventSource || null;
  }
  
  /*MD ## Custom Events MD*/

  dispatchMessageEvent(name, msg) {
    this.dispatchEvent(new CustomEvent(name, {
        detail: msg,
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

    this._eventCapture.push({
      timestamp: Date.now(),
      type: type,
      sessionId: sessionId,
      source: this.eventSource,
      data: data
    });
  }
  
  getCapturedEvents() {
    return this._eventCapture 
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
    var events = this.getCapturedEvents()
    if (compactEvents) events = this.compactEvents(events)
    
    let jsonl =  events.map(event => JSON.stringify(event)).join('\n');

    await navigator.clipboard.writeText(jsonl);
    lively.success(`Copied ${this._eventCapture.length} events to clipboard`);
  }

  async exportChatHistoryShortened() {
    return this.exportChatHistory(true)
  }

  _getEventsForExport() {
    return this._eventCapture || [];
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

    lively.notify(`Replaying ${events.length} events...`);
    this.replayEventsFromArray(events);
   
  }

  replayMessageEvent(event, replaySessionId) {
    // subclass responsibility
  }

  replayEventsFromArray(events, conversationId = null) {
    // Filter to only realtime events
    // const events = events.filter(e => e.type === 'realtime');

    if (events.length === 0) {
      lively.warn("No realtime events found in captured data");
      return;
    }

    this._replayPaused = false;
    this._replaySpeed = 1;
    this._replayTimeouts = [];
    this._replayCurrentEvent = 0;
    this._replayTotalEvents = events.length;
    this._eventCapture = []; // Clear for new capture

    const replaySessionId = this.enableReplay(conversationId);

    // Show replay controls
    this.showReplayControls();

    // Replay events with controllable timing
    let completedEvents = 0;

    this.log(`[realtime] Starting replay of ${events.length} events`);

    const scheduleEvent = (index) => {
      if (index >= events.length) return;

      const event = events[index];

      // Calculate delay from previous event (or 0 for first event)
      let delay = 0;
      if (index > 0) {
        delay = event.timestamp - events[index - 1].timestamp;

        // Apply speed multiplier
        if (this._replaySpeed > 0) {
          delay = delay / this._replaySpeed;
        } else {
          // Instant mode
          delay = 0;
        }
      }

      const timeoutId = setTimeout(async () => {
        // Check if paused - reschedule if needed
        if (this._replayPaused) {
          // Reschedule this event after a short delay and track the timeout ID
          const pauseTimeoutId = setTimeout(() => scheduleEvent(index), 100);
          this._replayTimeouts.push(pauseTimeoutId);
          return;
        }

        // Process the event
        await this.replayMessageEvent(event, replaySessionId);
        completedEvents++;
        this._replayCurrentEvent = completedEvents;

        // Update progress
        this.updateReplayProgress(completedEvents, events.length);

        // Schedule next event
        scheduleEvent(index + 1);

        // Check if complete
        if (completedEvents === events.length) {
          // Disable replay mode (re-enables inputs, keeps artificial session)
          this.disableReplay();

          this.hideReplayControls();
          lively.success(`Replay complete: ${events.length} events processed`);
        }
      }, delay);

      // Store timeout ID for cancellation
      this._replayTimeouts.push(timeoutId);
    };

    // Start replaying first event
    scheduleEvent(0);
  }

  
  clearEventCapture() {
    this._eventCapture = [];
    // Also clear any capture deduplication tracking
    if (this._capturedItemIds) {
      this._capturedItemIds.clear();
    }
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
   */
  stopReplay() {
    // Clear all pending timeouts
    if (this._replayTimeouts) {
      this._replayTimeouts.forEach(id => clearTimeout(id));
      this._replayTimeouts = [];
    }

    // Exit replay mode
    this._replayMode = false;
    this._replayPaused = false;

    // Hide controls
    this.hideReplayControls();

    this.log('[replay] Stopped');
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
      ["Paste and Replay Chat History", () => this.replayEventsFromClipboard()],
    ];
  }
  
 
  cleanupSession() {
    // do nothing
  }
  
  livelyMigrate(other) {
     this.showDebug = other.showDebug
    
  }
  
}
