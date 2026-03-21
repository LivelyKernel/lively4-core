# System Message Parsing Test

This file tests the special system message parsing for voice agent messages.

## Test 1: System Message Detection

<script>
import { expect } from 'src/external/chai.js';

// Create a test message component
const messageComponent = await lively.create('lively-chat-message');

// Test message with system pattern
const testMessage = {
  role: 'user',
  content: '[System: The coding agent finished working on: "Vox tool call rendering path"]',
  source: 'audio',
  streamType: 'realtime',
  timestamp: Date.now()
};

// Test parseSystemMessage method
const result = messageComponent.parseSystemMessage(testMessage);

expect(result).to.not.be.null;
expect(result.isSystemMessage).to.be.true;
expect(result.systemContent).to.equal('The coding agent finished working on: "Vox tool call rendering path"');

lively.success("✓ System message parsing works correctly");
result
</script>

## Test 2: Render System Message

<script>
// Create another message component for rendering test
const msgComponent = await lively.create('lively-chat-message');

const systemMsg = {
  role: 'user',
  content: '[System: The coding agent finished working on: "Vox tool call rendering path"]',
  source: 'audio',
  streamType: 'realtime',
  timestamp: Date.now()
};

await msgComponent.setMessage(systemMsg);

// Check that role was changed to 'system'
const roleAttr = msgComponent.getAttribute('role');
lively.notify(`Role attribute: ${roleAttr}`);

msgComponent
</script>

## Test 3: Regular User Message (Should Not Parse as System)

<script>
const regularComponent = await lively.create('lively-chat-message');

const regularMsg = {
  role: 'user',
  content: 'Hello, how are you?',
  source: 'audio',
  streamType: 'realtime',
  timestamp: Date.now()
};

const parseResult = regularComponent.parseSystemMessage(regularMsg);

expect(parseResult).to.be.null;

await regularComponent.setMessage(regularMsg);

// Check that role stays as 'user'
const roleAttr = regularComponent.getAttribute('role');
expect(roleAttr).to.equal('user');

lively.success("✓ Regular messages are not parsed as system messages");
regularComponent
</script>

## Test 4: Code Source Message (Should Not Parse)

<script>
const codeComponent = await lively.create('lively-chat-message');

const codeMsg = {
  role: 'user',
  content: '[System: This should not be parsed]',
  source: 'code',  // Different source - should not parse
  streamType: 'opencode',
  timestamp: Date.now()
};

const parseResult = codeComponent.parseSystemMessage(codeMsg);

expect(parseResult).to.be.null;

await codeComponent.setMessage(codeMsg);

// Check that role stays as 'user'
const roleAttr = codeComponent.getAttribute('role');
expect(roleAttr).to.equal('user');

lively.success("✓ Code source messages with [System: ] pattern are not parsed");
codeComponent
</script>

## Visual Test: Side-by-Side Comparison

<script>
const container = <div style="display: flex; flex-direction: column; gap: 10px; padding: 20px;"></div>;

// System message
const systemMsg = await lively.create('lively-chat-message');
await systemMsg.setMessage({
  role: 'user',
  content: '[System: The coding agent finished working on: "Vox tool call rendering path"]',
  source: 'audio',
  streamType: 'realtime',
  timestamp: Date.now()
});

// Regular user message
const userMsg = await lively.create('lively-chat-message');
await userMsg.setMessage({
  role: 'user',
  content: 'Hello, how are you?',
  source: 'audio',
  streamType: 'realtime',
  timestamp: Date.now()
});

// Assistant message for comparison
const assistantMsg = await lively.create('lively-chat-message');
await assistantMsg.setMessage({
  role: 'assistant',
  content: 'I am doing well, thank you!',
  source: 'audio',
  streamType: 'realtime',
  timestamp: Date.now()
});

container.appendChild(<h3>System Message (parsed from user message)</h3>);
container.appendChild(systemMsg);
container.appendChild(<h3>Regular User Message</h3>);
container.appendChild(userMsg);
container.appendChild(<h3>Assistant Message</h3>);
container.appendChild(assistantMsg);

container
</script>
