# Test AI Workspace Combined History

This script tests the combined chat history functionality of lively-ai-workspace.

```javascript
// Create workspace
const workspace = await lively.openComponentInWindow('lively-ai-workspace');

// Wait for initialization
await lively.sleep(2000);

console.log('Workspace ID:', workspace.workspaceId);

// Test storing messages from different sources
await workspace.storeMessage({
  source: 'audio',
  streamType: 'realtime',
  role: 'user',
  content: 'Hello from audio chat!',
  type: 'message',
  timestamp: Date.now()
});

await workspace.storeMessage({
  source: 'code',
  streamType: 'opencode',
  role: 'assistant',
  content: 'Hello from code agent! I can help you with that.',
  type: 'text',
  timestamp: Date.now()
});

await workspace.storeMessage({
  source: 'audio',
  streamType: 'realtime',
  role: 'assistant',
  content: 'The code agent says they can help with that.',
  type: 'message',
  timestamp: Date.now()
});

// Test storing events
await workspace.storeEvent({
  source: 'code',
  eventType: 'status_change',
  data: {status: 'working', message: 'Agent started working'}
});

await workspace.storeEvent({
  source: 'code',
  eventType: 'session.idle',
  data: {status: 'idle', message: 'Agent finished task'}
});

// Get all messages
const allMessages = await workspace.getWorkspaceMessages();
console.log('Total messages:', allMessages.length);
console.log('Messages:', allMessages);

// Show timestamp format
if (allMessages.length > 0) {
  const firstMsg = allMessages[0];
  console.log('Timestamp (ISO 8601 with timezone):', firstMsg.timestamp);
  console.log('As Date object:', new Date(firstMsg.timestamp));
  console.log('Sortable as string:', firstMsg.timestamp > '2025-01-01T00:00:00.000Z');
}

// Get messages by source
const audioMessages = await workspace.getMessagesBySource('audio');
const codeMessages = await workspace.getMessagesBySource('code');
console.log('Audio messages:', audioMessages.length);
console.log('Code messages:', codeMessages.length);

// Get all events
const events = await workspace.getWorkspaceEvents();
console.log('Total events:', events.length);
console.log('Events:', events);

// Export full history
const exported = await workspace.exportWorkspaceHistory();
console.log('Export result:', exported);

lively.success('Test complete!', `${allMessages.length} messages, ${events.length} events stored`);

return {
  workspace,
  messages: allMessages,
  events,
  exported
};
```

Click "Run" to test the combined history functionality!
