# LivelyChatSessions (Session Management)

<lively-import src="../_navigation.html"></lively-import>

**File:** `lively-chat-sessions.js`

**Purpose:** Session management component for AI chat interfaces

**Extends:** `Morph`

---

## Features

- Multi-select session support
- Context menu for session operations
- Active session tracking
- Visual indicators for selected/active sessions

---

## Properties

```javascript
selectedSessions     // Array of selected session IDs
activeSessionId      // Currently active session ID
sessions             // Array of session objects
```

---

## Session Operations

### Context Menu Actions

- **Switch Session** - Activate selected session
- **Delete Session** - Remove session(s)
- **Rename Session** - Edit session title
- **Export Session** - Export conversation history

---

## Events

Dispatches custom events for parent components:

```javascript
'session-switch'     // User switched to different session
'session-delete'     // User deleted session(s)
'session-rename'     // User renamed session
```

---

## Usage

```javascript
const sessions = await lively.create('lively-chat-sessions');
sessions.sessions = await this.listSessions();
sessions.activeSessionId = this.currentSessionId;

// Listen for events
lively.addEventListener('sessionSwitch', sessions, 'session-switch', 
  evt => this.switchSession(evt.detail.sessionId));
```

---

## See Also

- [LivelyChat](lively-chat.md) - Base class for chat components
- [LivelyAiWorkspace](lively-ai-workspace.md) - Uses sessions for workspace management
