import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';


export default class LivelyChatSessions extends Morph {
  async initialize() {
    this.windowTitle = "Chat Sessions";
    this.registerButtons();

    // State
    this._sessions = [];
    this._activeSessionId = null;
    this._selectedSessionIds = new Set();
    this._lastClickedIndex = -1;

    // Configuration
    this._enableMultiSelect = true;
    this._showNewButton = true;
    this._showDeleteButtons = true;
    this._headerTitle = "Sessions";

    // DOM references
    this.sessionsList = this.get("#sessionsList");
    this.headerTitleElement = this.get("#headerTitle");
    this.selectionCountElement = this.get("#selectionCount");
    this.newSessionButton = this.get("#newSessionButton");

    // Event listeners
    this.setupEventListeners();

    // Initial render
    this.updateNewButtonVisibility();
    this.updateHeaderTitle();
    this.render();
  }

  setupEventListeners() {
    // Session list clicks
    this.sessionsList.addEventListener('click', (evt) => this.onSessionsListClick(evt));

    // Context menu using Lively's ContextMenu system
    this.addEventListener('contextmenu', (evt) => this.onContextMenu(evt));
  }

  // Properties with getters/setters
  get sessions() {
    return this._sessions;
  }

  set sessions(value) {
    this._sessions = Array.isArray(value) ? value : [];
    this.render();
  }

  get activeSessionId() {
    return this._activeSessionId;
  }

  set activeSessionId(value) {
    this._activeSessionId = value;
    this.updateActiveState();
  }

  get selectedSessionIds() {
    return Array.from(this._selectedSessionIds);
  }

  set selectedSessionIds(value) {
    this._selectedSessionIds = new Set(Array.isArray(value) ? value : []);
    this.updateSelectionState();
  }

  get enableMultiSelect() {
    return this._enableMultiSelect;
  }

  set enableMultiSelect(value) {
    this._enableMultiSelect = !!value;
  }

  get showNewButton() {
    return this._showNewButton;
  }

  set showNewButton(value) {
    this._showNewButton = !!value;
    this.updateNewButtonVisibility();
  }

  get showDeleteButtons() {
    return this._showDeleteButtons;
  }

  set showDeleteButtons(value) {
    this._showDeleteButtons = !!value;
    this.render();
  }

  get headerTitle() {
    return this._headerTitle;
  }

  set headerTitle(value) {
    this._headerTitle = value || "Sessions";
    this.updateHeaderTitle();
  }

  // UI Update Methods
  updateNewButtonVisibility() {
    if (this.newSessionButton) {
      this.newSessionButton.style.display = this._showNewButton ? 'block' : 'none';
    }
  }

  updateHeaderTitle() {
    if (this.headerTitleElement) {
      this.headerTitleElement.textContent = this._headerTitle;
    }
  }

  updateSelectionCount() {
    if (!this.selectionCountElement) return;

    const count = this._selectedSessionIds.size;
    if (count > 0) {
      this.selectionCountElement.textContent = `(${count} selected)`;
      this.selectionCountElement.style.display = 'inline';
    } else {
      this.selectionCountElement.textContent = '';
      this.selectionCountElement.style.display = 'none';
    }
  }

  updateActiveState() {
    if (!this.sessionsList) return;

    this.sessionsList.querySelectorAll('.session-item').forEach(item => {
      const sessionId = item.dataset.sessionId;
      if (sessionId === this._activeSessionId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  updateSelectionState() {
    if (!this.sessionsList) return;

    const hasSelection = this._selectedSessionIds.size > 0;

    this.sessionsList.querySelectorAll('.session-item').forEach(item => {
      const sessionId = item.dataset.sessionId;

      if (hasSelection) {
        item.classList.add('has-selection');
      } else {
        item.classList.remove('has-selection');
      }

      if (this._selectedSessionIds.has(sessionId)) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    this.updateSelectionCount();
  }

  // Rendering
  render() {
    if (!this.sessionsList) return;

    if (this._sessions.length === 0) {
      this.sessionsList.innerHTML = '<div class="empty-state">No sessions</div>';
      return;
    }

    this.sessionsList.innerHTML = this._sessions.map((session, index) => {
      return this.renderSessionItem(session, index);
    }).join('');

    this.updateActiveState();
    this.updateSelectionState();
  }

  renderSessionItem(session, index) {
    const isActive = session.id === this._activeSessionId;
    const isSelected = this._selectedSessionIds.has(session.id);

    // Format title
    const title = this.formatSessionTitle(session);

    // Format metadata
    const meta = this.formatSessionMeta(session);

    // Delete button
    const deleteButton = this._showDeleteButtons
      ? `<button class="delete" data-action="delete" title="Delete">🗑️</button>`
      : '';

    return `
      <div class="session-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}"
           data-session-id="${session.id}"
           data-index="${index}">
        <div class="session-item-checkbox"></div>
        <div class="session-item-content">
          <div class="session-item-info">
            <div class="session-item-title">${this.escapeHtml(title)}</div>
            <div class="session-item-meta">${meta}</div>
          </div>
          <div class="session-item-actions">
            ${deleteButton}
          </div>
        </div>
      </div>
    `;
  }

  formatSessionTitle(session) {
    // Try different title properties
    return session.title || session.name || `Session ${session.id?.substring(0, 8) || ''}`;
  }

  formatSessionMeta(session) {
    const parts = [];

    // Timestamp
    if (session.timestamp || session.created || session.lastActivityTime) {
      const date = new Date(session.timestamp || session.created || session.lastActivityTime);
      parts.push(this.formatDate(date));
    }

    // Message counts
    if (session.messageCount !== undefined) {
      parts.push(`${session.messageCount} messages`);
    }

    // Audio/code icons (AI workspace specific)
    if (session.audioMessages !== undefined && session.audioMessages > 0) {
      parts.push(`🎤 ${session.audioMessages}`);
    }
    if (session.codeMessages !== undefined && session.codeMessages > 0) {
      parts.push(`💻 ${session.codeMessages}`);
    }

    return parts.join(' • ');
  }

  formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (sessionDate.getTime() === today.getTime()) {
      return `Today ${timeStr}`;
    } else if (sessionDate.getTime() === yesterday.getTime()) {
      return `Yesterday ${timeStr}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Event Handlers
  onSessionsListClick(evt) {
    const sessionItem = evt.target.closest('.session-item');
    if (!sessionItem) return;

    const sessionId = sessionItem.dataset.sessionId;
    const index = parseInt(sessionItem.dataset.index);

    // Check if delete button was clicked
    const deleteButton = evt.target.closest('[data-action="delete"]');
    if (deleteButton) {
      evt.stopPropagation();
      this.deleteSingleSession(sessionId);
      return;
    }

    // Handle selection based on modifier keys
    if (this._enableMultiSelect && (evt.ctrlKey || evt.metaKey)) {
      // Ctrl+Click: Toggle selection
      this.toggleSelection(sessionId);
      this._lastClickedIndex = index;
    } else if (this._enableMultiSelect && evt.shiftKey && this._lastClickedIndex >= 0) {
      // Shift+Click: Range selection
      this.selectRange(this._lastClickedIndex, index);
    } else {
      // Regular click: Select and activate session
      this._selectedSessionIds.clear();
      this.selectSession(sessionId);
      this._lastClickedIndex = index;
    }
  }

  toggleSelection(sessionId) {
    if (this._selectedSessionIds.has(sessionId)) {
      this._selectedSessionIds.delete(sessionId);
    } else {
      this._selectedSessionIds.add(sessionId);
    }
    this.updateSelectionState();
  }

  selectRange(startIndex, endIndex) {
    const [min, max] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

    this._selectedSessionIds.clear();
    for (let i = min; i <= max; i++) {
      if (this._sessions[i]) {
        this._selectedSessionIds.add(this._sessions[i].id);
      }
    }
    this.updateSelectionState();
  }

  selectSession(sessionId) {
    this._activeSessionId = sessionId;
    this.updateActiveState();

    // Dispatch event
    this.dispatchEvent(new CustomEvent('session-selected', {
      detail: { sessionId },
      bubbles: true,
      composed: true
    }));
  }

  deleteSingleSession(sessionId) {
    // Dispatch event
    this.dispatchEvent(new CustomEvent('session-deleted', {
      detail: { sessionId },
      bubbles: true,
      composed: true
    }));
  }

  async deleteSelectedSessions() {
    if (this._selectedSessionIds.size === 0) return;

    const sessionIds = Array.from(this._selectedSessionIds);

    // Confirm deletion
    const count = sessionIds.length;
    const message = count === 1
      ? 'Delete 1 selected session?'
      : `Delete ${count} selected sessions?`;

    if (!await lively.confirm(message)) return;

    // Dispatch event
    this.dispatchEvent(new CustomEvent('sessions-bulk-deleted', {
      detail: { sessionIds },
      bubbles: true,
      composed: true
    }));

    // Clear selection
    this._selectedSessionIds.clear();
    this.updateSelectionState();
  }

  selectAllSessions() {
    this._sessions.forEach(session => {
      this._selectedSessionIds.add(session.id);
    });
    this.updateSelectionState();
  }

  invertSelection() {
    const newSelection = new Set();
    this._sessions.forEach(session => {
      if (!this._selectedSessionIds.has(session.id)) {
        newSelection.add(session.id);
      }
    });
    this._selectedSessionIds = newSelection;
    this.updateSelectionState();
  }

  clearSelection() {
    this._selectedSessionIds.clear();
    this.updateSelectionState();
  }

  selectEmptySessions() {
    this._selectedSessionIds.clear();
    this._sessions.forEach(session => {
      // Consider a session "empty" if it has 0 messages or no activity
      const messageCount = session.messageCount ?? 0;
      const hasNoActivity = session.summary && 
                            session.summary.additions === 0 && 
                            session.summary.deletions === 0;
      
      const isEmpty = messageCount === 0 || hasNoActivity;
      
      if (isEmpty) {
        this._selectedSessionIds.add(session.id);
      }
    });
    this.updateSelectionState();
  }

  loadSelectedSessions() {
    if (this._selectedSessionIds.size === 0) return;

    const sessionIds = Array.from(this._selectedSessionIds);

    // Dispatch event for parent components to handle
    this.dispatchEvent(new CustomEvent('sessions-load-requested', {
      detail: { sessionIds },
      bubbles: true,
      composed: true
    }));
  }

  // Context Menu using Lively's ContextMenu system
  onContextMenu(evt) {
    lively.notify("onContextMenu")
    
    evt.preventDefault();
    evt.stopPropagation();

    const hasSelection = this._selectedSessionIds.size > 0;
    const selectionCount = this._selectedSessionIds.size;
    const activeSession = this._sessions.find(s => s.id === this._activeSessionId);

    let menuItems = [
      [selectionCount > 1 ? `Delete ${selectionCount} Sessions` : "Delete Selected",
       () => this.deleteSelectedSessions(),
       "",
       "",
       hasSelection ? "" : "disabled"],
      [selectionCount > 1 ? `Load ${selectionCount} Sessions` : "Load Selected",
       () => this.loadSelectedSessions(),
       "",
       "",
       hasSelection ? "" : "disabled"],
      ["Inspect",
       async () => {
         const inspector = await lively.openComponentInWindow("lively-inspector");
         inspector.inspect(activeSession);
       },
       "",
       "",
       activeSession ? "" : "disabled"],
      ["---"],
      ["Select All", () => this.selectAllSessions()],
      ["Select Empty", () => this.selectEmptySessions()],
      ["Invert Selection", () => this.invertSelection()],
      ["Clear Selection", () => this.clearSelection(), "", "", hasSelection ? "" : "disabled"]
    ];

    const menu = new ContextMenu(this, menuItems);
    menu.openIn(document.body, evt, this);
  }

  // Button Handlers
  onNewSessionButton() {
    this.dispatchEvent(new CustomEvent('session-created', {
      bubbles: true,
      composed: true
    }));
  }

  // Public API Methods
  addSession(session) {
    if (!session || !session.id) return;
    this._sessions.unshift(session);
    this.render();
  }

  removeSession(sessionId) {
    const index = this._sessions.findIndex(s => s.id === sessionId);
    if (index >= 0) {
      this._sessions.splice(index, 1);
      this._selectedSessionIds.delete(sessionId);
      this.render();
    }
  }

  removeSessions(sessionIds) {
    this._sessions = this._sessions.filter(s => !sessionIds.includes(s.id));
    sessionIds.forEach(id => this._selectedSessionIds.delete(id));
    this.render();
  }

  updateSession(sessionId, updates) {
    const session = this._sessions.find(s => s.id === sessionId);
    if (session) {
      Object.assign(session, updates);
      this.render();
    }
  }

  getSession(sessionId) {
    return this._sessions.find(s => s.id === sessionId);
  }

  livelyMigrate(other) {
    // Preserve state during live updates
    this._sessions = other._sessions || this._sessions;
    this._activeSessionId = other._activeSessionId || this._activeSessionId;
    this._selectedSessionIds = other._selectedSessionIds || this._selectedSessionIds;
  }
}
