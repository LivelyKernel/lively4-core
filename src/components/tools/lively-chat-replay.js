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
    this._selectedIndex = this._selectedIndex || -1;
    this._wasPaused = this._wasPaused !== undefined ? this._wasPaused : true;
    this._sliderDebounceTimeout = this._sliderDebounceTimeout || null;

    // DOM references
    this.eventsList = this.get("#eventsList");
    this.detailsPanel = this.get("#details");
    this.currentIndexDisplay = this.get("#currentIndex");
    this.totalEventsDisplay = this.get("#totalEvents");
    this.speedSelect = this.get("#speedSelect");
    this.positionSlider = this.get("#positionSlider");

    // Setup event listeners
    if (this.speedSelect) {
      this.speedSelect.addEventListener('change', (evt) => this.onSpeedSelectChange(evt));
    }
    if (this.positionSlider) {
      this.positionSlider.addEventListener('input', (evt) => this.onSliderChange(evt));
    }
  }

  // Called when component is added to DOM
  connectedCallback() {
    if (super.connectedCallback) super.connectedCallback();

    // Clear disconnect timeout if reconnected (was just moved, not removed)
    if (this._disconnectTimeout) {
      clearTimeout(this._disconnectTimeout);
      this._disconnectTimeout = null;
    }

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

    // Update slider range
    if (this.positionSlider) {
      this.positionSlider.max = Math.max(0, this._events.length - 1);
      this.positionSlider.value = this._currentIndex;
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

  onSliderChange(evt) {
    const targetIndex = parseInt(evt.target.value);

    // Debounce: clear previous timeout and wait for slider to settle
    if (this._sliderDebounceTimeout) {
      clearTimeout(this._sliderDebounceTimeout);
    }

    // Wait 150ms after last slider movement before triggering seek
    this._sliderDebounceTimeout = setTimeout(() => {
      const currentIndex = this._chatComponent?._replayCurrentEvent || 0;

      if (targetIndex !== currentIndex) {
        this.emitReplayCommand('seek', { targetIndex });
      }

      this._sliderDebounceTimeout = null;
    }, 150);
  }

  onEventClick(index) {
    // Show details in the details panel
    this._selectedIndex = index;
    this.showEventDetails(index);
    this.updateEventItemsSelection();
  }

  showEventDetails(index) {
    if (!this.detailsPanel) return;

    const event = this._events[index];
    if (event) {
      // Display event as formatted JSON
      this.detailsPanel.textContent = JSON.stringify(event, null, 2);
    } else {
      this.detailsPanel.textContent = '';
    }
  }

  updateEventItemsSelection() {
    if (!this.eventsList) return;

    this.eventsList.querySelectorAll('.event-item').forEach((item, i) => {
      item.classList.toggle('selected', i === this._selectedIndex);
    });
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

    // Auto-select current event to show its details while playing/stepping
    this._selectedIndex = index;
    this.showEventDetails(index);

    // Update highlights: replayed events, current event, and selected event
    this.eventsList.querySelectorAll('.event-item').forEach((item, i) => {
      // Mark as replayed if before current index
      item.classList.toggle('replayed', i < index);
      // Mark as current
      item.classList.toggle('current', i === index);
      // Keep selected highlight
      item.classList.toggle('selected', i === this._selectedIndex);
    });

    // Update index display
    if (this.currentIndexDisplay) {
      this.currentIndexDisplay.textContent = index + 1;
    }
    if (this.totalEventsDisplay) {
      this.totalEventsDisplay.textContent = this._events.length;
    }

    // Update slider position
    if (this.positionSlider && this.positionSlider.value != index) {
      this.positionSlider.value = index;
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
    this._selectedIndex = other._selectedIndex;
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

    // Only stop replay if the component is actually being removed, not just moved
    // Use a timeout to check if it's reconnected (moved) vs truly removed
    this._disconnectTimeout = setTimeout(() => {
      // If still not in DOM after 100ms, it's truly removed
      if (!this.isConnected && this._chatComponent && this._chatComponent._replayMode) {
        this._chatComponent.stopReplay();
      }
    }, 100);
  }
}
