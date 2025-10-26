# AI Workspace Combined Chat History

## Overview

The lively-ai-workspace now has a **unified chat history system** that captures and stores all messages from both the OpenAI Realtime Chat (audio) and the OpenCode Agent (code) streams into a single, queryable database.

## Architecture

### Database Schema

The system uses **Dexie (IndexedDB)** with database name `lively-ai-workspace-history`:

**Tables:**
1. **workspaces** - Top-level workspace sessions
   - `id` (primary key)
   - `timestamp` (creation time)
   - `lastActivityTime` (last message/event time)
   - `title` (workspace title)

2. **messages** - All messages from both streams
   - `id` (auto-increment primary key)
   - `workspaceId` (foreign key to workspaces)
   - `timestamp` (ISO 8601 format with timezone, e.g., "2025-10-23T15:24:50.712Z")
   - `source` ('audio' or 'code')
   - `streamType` ('realtime' or 'opencode')
   - `role` ('user', 'assistant', 'tool')
   - `content` (message text)
   - `type` (message type, e.g., 'message', 'function_call', 'text')
   - `metadata` (source-specific metadata)
   - `conversationId` (for audio messages)
   - `sessionId` (for code agent messages)
   - `sequence` (message sequence number)

3. **events** - All events from both streams
   - `id` (auto-increment primary key)
   - `workspaceId` (foreign key to workspaces)
   - `timestamp` (ISO 8601 format with timezone, e.g., "2025-10-23T15:24:50.712Z")
   - `eventType` (e.g., 'status_change', 'session.idle')
   - `source` ('audio' or 'code')
   - `data` (event-specific data)

### Message Capture

**Audio Chat (OpenAI Realtime):**
- Hooks into `saveMessageToDb()` method
- Captures: user messages, assistant responses, tool calls, function calls
- Preserves: conversation ID, sequence numbers, metadata

**Code Agent (OpenCode):**
- Hooks into `addMessage()` method
- Captures: user requests, assistant responses
- Preserves: session ID, timestamps

**Events:**
- Captures status changes from both components
- Tracks: working/idle state, session changes, errors

## API

### Storage Methods

```javascript
// Store a message
await workspace.storeMessage({
  source: 'audio',           // 'audio' or 'code'
  streamType: 'realtime',    // 'realtime' or 'opencode'
  role: 'user',              // 'user', 'assistant', 'tool'
  content: 'Message text',
  type: 'message',           // message type
  metadata: {...},           // optional metadata
  conversationId: 'uuid',    // for audio messages
  sessionId: 'uuid',         // for code messages
  sequence: 42,              // optional sequence number
  timestamp: Date.now()
});

// Store an event
await workspace.storeEvent({
  source: 'code',
  eventType: 'status_change',
  data: {status: 'working', message: 'Agent started working'}
});
```

### Query Methods

```javascript
// Get all messages for this workspace
const messages = await workspace.getWorkspaceMessages();

// Get messages filtered by source
const audioMessages = await workspace.getMessagesBySource('audio');
const codeMessages = await workspace.getMessagesBySource('code');

// Get all events
const events = await workspace.getWorkspaceEvents();

// Export complete history
const exported = await workspace.exportWorkspaceHistory();
// Returns: {success, workspace, messages, events, exportTime}
```

### UI Features

**Buttons in workspace header:**
- **View History** - Shows a summary of messages and events in a new window
- **Export History** - Exports full data as JSONL (JSON Lines) to clipboard
- **Blackboard** - Shows real-time coordination state
- **Clear** - Clears blackboard (history is preserved)

## Use Cases

### 1. Analysis & Visualization

Export the complete history and analyze:
- Message flow between audio and code streams
- Response times and latencies
- Tool call patterns
- User interaction patterns

### 2. Debugging

- Track complete conversation context
- See when agent started/stopped working
- Correlate audio requests with code agent responses
- Identify missed handoffs or communication issues

### 3. Training Data

- Export real-world conversational coding sessions
- Analyze successful vs unsuccessful interactions
- Build better prompts and coordination strategies

### 4. Session Replay

- Reconstruct complete interaction history
- Understand user intent across both channels
- Validate that coordination worked correctly

## Example: Viewing History

```javascript
// Open workspace
const workspace = await lively.openComponentInWindow('lively-ai-workspace');

// Use it for a while (send messages via audio and code agent)...

// View summary
workspace.onViewHistoryButton(); // or click "View History" button

// Export to clipboard
workspace.onExportHistoryButton(); // or click "Export History" button

// Parse exported JSONL
const lines = clipboardText.split('\n');
const data = lines.map(line => JSON.parse(line));
const workspace = data.find(d => d.type === 'workspace');
const messages = data.filter(d => d.type === 'message');
const events = data.filter(d => d.type === 'event');
```

## Data Format (JSONL Export)

Each line is a JSON object with a `type` field:

**Workspace:**
```json
{"type":"workspace","id":"uuid","timestamp":"2025-10-23T15:24:50.712Z","lastActivityTime":"2025-10-23T15:24:50.712Z","title":"Workspace..."}
```

**Message:**
```json
{"type":"message","id":1,"workspaceId":"uuid","timestamp":"2025-10-23T15:24:50.712Z","source":"audio","streamType":"realtime","role":"user","content":"Hello","metadata":{...}}
```

**Event:**
```json
{"type":"event","id":1,"workspaceId":"uuid","timestamp":"2025-10-23T15:24:50.712Z","eventType":"status_change","source":"code","data":{...}}
```

## Technical Notes

### Timestamp Format

All timestamps are stored in **ISO 8601 format** with UTC timezone:
- Format: `"2025-10-23T15:24:50.712Z"`
- The 'Z' suffix indicates UTC timezone
- ISO 8601 strings sort correctly lexicographically (no need for numeric timestamps!)

Benefits:
- **Human-readable** - immediately understand when something happened
- **Timezone-aware** - UTC timezone is explicit
- **Sortable** - lexicographic sort works correctly for chronological order
- **Standard** - ISO 8601 is the international standard
- **Compatible** - works with `new Date(timestamp)` in JavaScript

Example:
```javascript
const msg = messages[0];
console.log(msg.timestamp);           // "2025-10-23T15:24:50.712Z"
console.log(new Date(msg.timestamp)); // Date object
console.log(msg.timestamp > "2025-10-23T15:00:00.000Z"); // true - string comparison works!
```

### Message Interception

The system uses method overriding (aspect-oriented programming) to intercept messages:

```javascript
// For OpenCode
const originalAddMessage = this.opencodeComponent.addMessage.bind(...);
this.opencodeComponent.addMessage = (sessionId, role, content) => {
  originalAddMessage(sessionId, role, content); // Call original
  this.storeMessage({...}); // Capture to unified history
};

// For Realtime Chat
const originalSaveMessage = this.realtimeComponent.saveMessageToDb.bind(...);
this.realtimeComponent.saveMessageToDb = async (message) => {
  await originalSaveMessage(message); // Call original
  await this.storeMessage({...}); // Capture to unified history
};
```

This ensures:
- No modification to component code required
- Original storage still works
- Unified history captures everything

### Workspace Persistence

Workspaces are automatically:
- Created on first use
- Restored on component reload (via `livelyMigrate`)
- Updated on activity (messages/events)

Old workspaces are kept for historical analysis.

## Future Enhancements

Potential improvements:
- Timeline visualization of messages and events
- Search/filter interface for history
- Export to different formats (CSV, JSON, Markdown)
- Session replay UI
- Analytics dashboard (response times, message counts, etc.)
- Integration with journal entries
- Automatic backup to file system

## Testing

See [test-ai-workspace-history.md](edit://demos/claude/test-ai-workspace-history.md) for a complete test script.

Run tests:
```bash
npm run test-single test/components/tools/lively-ai-workspace-test.js
```
