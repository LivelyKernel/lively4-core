import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';

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
    let message = args.map(ea => "" + ea).join(" ")
    const debugLog = this.get('#debugLog');
    if (!debugLog) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const li = document.createElement('li');
    li.textContent = `[${timestamp}] ${message}`;

    debugLog.appendChild(li);

    // Auto-scroll to bottom
    debugLog.scrollTop = debugLog.scrollHeight;
  }

  /**
   * Clear all log entries
   */
  onClearLogButton() {
    this.clearDebugLog()
  }
  
  clearDebugLog() {
    const debugLog = this.get('#debugLog');
    if (debugLog) {
      debugLog.innerHTML = '';
    }
  }

  /**
   * Setup input handling for Enter to send pattern
   * @param {string} inputSelector - CSS selector for input element
   * @param {Function} sendHandler - Handler to call on send (e.g., this.onSendButton)
   */
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

  /**
   * Scroll container to bottom with optional force
   * @param {HTMLElement} container - Container to scroll
   * @param {boolean} force - Force scroll even if not at bottom
   * @param {number} delay - Delay in ms before scrolling (default 10)
   */
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

  /**
   * Check if container is scrolled near bottom
   * @param {HTMLElement} container - Container to check
   * @param {number} threshold - Distance from bottom in pixels (default 50)
   */
  isAtBottom(container, threshold = 50) {
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return (scrollHeight - scrollTop - clientHeight) < threshold;
  }

  /**
   * Generate checkbox icon for context menu toggle items
   * @param {boolean} state - Checked state
   * @returns {string} HTML icon string
   */
  generateToggleIcon(state) {
    return state
      ? '<i class="fa fa-check-square-o" aria-hidden="true"></i>'
      : '<i class="fa fa-square-o" aria-hidden="true"></i>';
  }

  /*MD ## Event Capture and Replay System MD*/

  /**
   * Capture an event for later replay
   * Subclasses should call this method to record events during normal operation
   *
   * @param {string} type - Event type identifier (e.g., 'sse', 'realtime', 'workspace')
   * @param {object} data - Event data to capture
   * @param {string} sessionId - Session/conversation identifier
   */
  captureEvent(type, data, sessionId) {
    if (this._replayMode) return; // Don't capture during replay

    this._eventCapture.push({
      timestamp: Date.now(),
      type: type,
      sessionId: sessionId,
      data: data
    });
  }

  /**
   * Export chat history to clipboard in JSONL format
   * Subclasses can override to customize export format or add metadata
   */
  async exportChatHistory() {
    if (this._eventCapture.length === 0) {
      lively.warn("No events to export");
      return;
    }

    // Convert to JSONL (one JSON per line)
    const jsonl = this._eventCapture.map(event => JSON.stringify(event)).join('\n');

    await navigator.clipboard.writeText(jsonl);
    lively.success(`Copied ${this._eventCapture.length} events to clipboard`);
  }

  /**
   * Export shortened chat history to clipboard in JSONL format
   * Strips out verbose system prompts and long instruction fields
   */
  async exportChatHistoryShortened() {
    if (this._eventCapture.length === 0) {
      lively.warn("No events to export");
      return;
    }

    // Convert to JSONL with compacted data
    const jsonl = this._eventCapture.map(event => {
      // Deep clone to avoid mutating original
      const compacted = JSON.parse(JSON.stringify(event));

      // Compact the data field if it exists
      if (compacted.data) {
        this.compactEventData(compacted.data);
      }

      return JSON.stringify(compacted);
    }).join('\n');

    await navigator.clipboard.writeText(jsonl);
    lively.success(`Copied ${this._eventCapture.length} compacted events to clipboard`);
  }

  /**
   * Compact event data by removing verbose instruction fields (mutates in place)
   * Keeps all messages and content, just removes system prompts
   * @param {object} data - Event data object (will be mutated)
   */
  compactEventData(data) {
    if (!data || typeof data !== 'object') return;

    // Remove verbose instruction fields from session configuration
    // These appear in session.created and session.updated events from OpenAI
    if (data.session?.instructions) {
      const instructions = data.session.instructions;
      data.session.instructions = `[${instructions.length} chars]`;
    }

    // Also compact tools array if very large (keep count but not full definitions)
    if (data.session?.tools && Array.isArray(data.session.tools) && data.session.tools.length > 0) {
      const toolCount = data.session.tools.length;
      data.session.tools = `[${toolCount} tools]`;
    }
  }

  /**
   * Import and replay events from clipboard
   * Expects JSONL format (one JSON per line)
   */
  async replayEventsFromClipboard() {
    const jsonl = await navigator.clipboard.readText();

    if (!jsonl || jsonl.trim().length === 0) {
      lively.warn("Clipboard is empty");
      return;
    }

    try {
      const lines = jsonl.split('\n').filter(line => line.trim());
      const events = lines.map(line => JSON.parse(line));

      if (events.length === 0) {
        lively.warn("No events found in clipboard");
        return;
      }

      lively.notify(`Replaying ${events.length} events...`);
      this.replayEventsFromArray(events);
    } catch (error) {
      lively.error(`Failed to parse clipboard data: ${error.message}`);
    }
  }

  /**
   * Replay events from an array with preserved timing
   * Subclasses should override to implement specific replay logic
   *
   * @param {Array} events - Array of event objects
   * @param {string} sessionId - Optional session ID to replay into (creates new if null)
   */
  replayEventsFromArray(events, sessionId = null) {
    throw new Error('Subclass must implement replayEventsFromArray()');
  }

  /**
   * Clear event capture buffer
   * Useful when starting a new session or switching contexts
   */
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

    const menuItems = [
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
      ["Copy Chat History", () => this.exportChatHistory()],
      ["Copy Chat History (shortened)", () => this.exportChatHistoryShortened()],
      ["Paste and Replay Chat History", () => this.replayEventsFromClipboard()],
    ];

    // Allow subclass to add more items
    const customItems = this.getContextMenuItems();
    if (customItems && customItems.length > 0) {
      menuItems.push(...customItems);
    }

    const menu = new ContextMenu(this, menuItems);
    menu.openIn(document.body, evt, this);
    return true;
  }

  /**
   * Override in subclass to add component-specific context menu items
   * @returns {Array} Array of menu item arrays
   */
  getContextMenuItems() {
    return [];
  }
  
  livelyMigrate(other) {
     this.showDebug = other.showDebug
    
  }
  
}
