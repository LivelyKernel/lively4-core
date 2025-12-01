import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyChatReplay extends Morph {
  async initialize() {
    this.windowTitle = "Replay Events";
    this.registerButtons();
    lively.html.registerKeys(this);

    // Component references (preserve during migration)
    this._chatComponent = this._chatComponent || null;
    this._events = this._events || [];
    this._currentIndex = this._currentIndex || -1;
    this._wasPaused = this._wasPaused !== undefined ? this._wasPaused : true;

    // DOM references
    this.eventsList = this.get("#eventsList");
    this.currentIndexDisplay = this.get("#currentIndex");
    this.totalEventsDisplay = this.get("#totalEvents");
    this.speedSelect = this.get("#speedSelect");

    // Setup event listeners
    if (this.speedSelect) {
      this.speedSelect.addEventListener('change', (evt) => this.onSpeedSelectChange(evt));
    }
  }

  // Called when component is added to DOM
  connectedCallback() {
    if (super.connectedCallback) super.connectedCallback();

    // Start observer if we have a chat component
    if (this._chatComponent && !this._stateObserver) {
      this.startObservingReplayState();
    }
  }

  setChatComponent(chatComponent) {
    this._chatComponent = chatComponent;
    this.loadEvents();
    this.startObservingReplayState();
  }

  loadEvents() {
    if (!this._chatComponent) return;

    // Get captured events from chat component
    this._events = this._chatComponent.getCapturedEvents();
    this.renderEventsList();
  }

  renderEventsList() {
    if (!this.eventsList) return;

    // Clear existing items
    this.eventsList.innerHTML = '';

    // Render each event as a <li> with two lines
    this._events.forEach((event, index) => {
      const li = document.createElement('li');
      li.className = 'event-item';
      li.dataset.index = index;

      // Line 1: [index] timestamp | type | source
      const line1 = document.createElement('div');
      line1.className = 'event-line1';

      const timestamp = new Date(event.timestamp).toLocaleTimeString();
      line1.innerHTML = `
        <span class="event-index">[${index}]</span>
        <span class="event-timestamp">${timestamp}</span> |
        <span class="event-type">${event.type}</span> |
        <span class="event-source">${event.source}</span>
      `;

      // Line 2: Brief preview
      const line2 = document.createElement('div');
      line2.className = 'event-line2';
      line2.textContent = this.getEventPreview(event);

      li.appendChild(line1);
      li.appendChild(line2);

      // Click handler - open inspector
      li.addEventListener('click', () => this.onEventClick(index));

      this.eventsList.appendChild(li);
    });

    // Update counter
    if (this.totalEventsDisplay) {
      this.totalEventsDisplay.textContent = this._events.length;
    }
  }

  getEventPreview(event) {
    // Extract preview text from event data
    if (!event.data) return '(no data)';

    // For realtime events
    if (event.type === 'response.done' && event.data.response) {
      const output = event.data.response.output;
      if (output && output.length > 0) {
        const firstOutput = output[0];
        if (firstOutput.content && firstOutput.content.length > 0) {
          const content = firstOutput.content[0];
          if (content.transcript) {
            return content.transcript.substring(0, 100);
          }
          if (content.text) {
            return content.text.substring(0, 100);
          }
        }
      }
    }

    // For conversation item events
    if (event.type === 'conversation.item.created' && event.data.item) {
      const item = event.data.item;
      if (item.content && item.content.length > 0) {
        const content = item.content[0];
        if (content.transcript) {
          return content.transcript.substring(0, 100);
        }
        if (content.text) {
          return content.text.substring(0, 100);
        }
      }
    }

    // For opencode events
    if (event.data.message && event.data.message.content) {
      return event.data.message.content.substring(0, 100);
    }

    // For session events
    if (event.type === 'session.created' || event.type === 'session.updated') {
      return `Session: ${event.data.session?.id || 'unknown'}`;
    }

    // Fallback: show event type
    return event.type;
  }

  // Button handlers
  onPlayPauseButton() {
    if (!this._chatComponent) return;

    const isPaused = this._chatComponent._replayPaused;
    this.emitReplayCommand(isPaused ? 'play' : 'pause');
  }

  onStepForwardButton() {
    this.emitReplayCommand('step-forward');
  }

  onRewindButton() {
    this.emitReplayCommand('rewind');
  }

  onStopButton() {
    this.emitReplayCommand('stop');
  }

  onSpeedSelectChange(evt) {
    const speed = evt.target.value;
    this.emitReplayCommand('set-speed', { speed });
  }

  onEventClick(index) {
    // Just inspect, don't jump to event
    this.showEventDetails(index);
  }

  showEventDetails(index) {
    const event = this._events[index];
    if (event) {
      lively.openInspector(event);
    }
  }

  updatePlayPauseButton() {
    const btn = this.get('#playPauseButton');
    if (!btn || !this._chatComponent) return;

    const isPaused = this._chatComponent._replayPaused;
    btn.textContent = isPaused ? '▶ Play' : '⏸ Pause';
  }

  emitReplayCommand(action, data = {}) {
    this.dispatchEvent(new CustomEvent('replay-command', {
      detail: { action, data },
      bubbles: true,
      composed: true
    }));
  }

  // State Observation
  startObservingReplayState() {
    // Clear any existing observer
    if (this._stateObserver) {
      clearInterval(this._stateObserver);
    }

    this._stateObserver = setInterval(() => {
      if (!this._chatComponent) return;

      // Observe current event position
      const currentIndex = this._chatComponent._replayCurrentEvent || 0;
      if (currentIndex !== this._currentIndex) {
        this._currentIndex = currentIndex;
        this.updateHighlight(currentIndex);
      }

      // Observe play/pause state
      const isPaused = this._chatComponent._replayPaused;
      if (isPaused !== this._wasPaused) {
        this._wasPaused = isPaused;
        this.updatePlayPauseButton();
      }
    }, 100);
  }

  updateHighlight(index) {
    // Ensure observer is running
    if (!this._stateObserver && this._chatComponent) {
      this.startObservingReplayState();
    }

    if (!this.eventsList) return;

    // Remove previous highlight
    this.eventsList.querySelectorAll('.event-item').forEach((item, i) => {
      item.classList.toggle('current', i === index);
    });

    // Update index display
    if (this.currentIndexDisplay) {
      this.currentIndexDisplay.textContent = index + 1;
    }
    if (this.totalEventsDisplay) {
      this.totalEventsDisplay.textContent = this._events.length;
    }

    // Auto-scroll to keep current event visible
    const currentItem = this.eventsList.querySelector('.event-item.current');
    if (currentItem) {
      currentItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // Cleanup and migration
  livelyMigrate(other) {
    // Stop old observer
    if (other._stateObserver) {
      clearInterval(other._stateObserver);
      other._stateObserver = null;
    }

    // Copy state
    this._chatComponent = other._chatComponent;
    this._events = other._events;
    this._currentIndex = other._currentIndex;
    this._wasPaused = other._wasPaused;

    // Restart observer after migration
    if (this._chatComponent) {
      // Delay slightly to ensure DOM is ready
      setTimeout(() => {
        if (!this._stateObserver) {
          this.startObservingReplayState();
        }
      }, 100);
    }
  }

  disconnectedCallback() {
    // Stop observer when component is removed from DOM
    if (this._stateObserver) {
      clearInterval(this._stateObserver);
      this._stateObserver = null;
    }
  }
}
