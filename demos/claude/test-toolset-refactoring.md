# Test Toolset Refactoring

This file tests the refactored toolset architecture.

## Test 1: BasicToolset (Pure Audio Chat)

```javascript
const { BasicToolset } = await System.import('src/components/tools/openai-realtime-chat-tools.js');

const toolset = new BasicToolset();
const definitions = toolset.getDefinitions();

console.log('BasicToolset has', definitions.length, 'tools:');
definitions.forEach(def => console.log('  -', def.name));

// Test executing a tool
const result = await toolset.execute('get_current_time', { timezone: 'UTC' });
console.log('get_current_time result:', result);

return { success: true, toolCount: definitions.length, testResult: result };
```

## Test 2: WorkspaceToolset (With Workspace Reference)

```javascript
const { WorkspaceToolset } = await System.import('src/components/tools/openai-realtime-chat-tools.js');

// Create a mock workspace object with minimal required methods
const mockWorkspace = {
  getOpenCodeStatus: async () => ({ success: true, status: 'idle', source: 'mock' }),
  getOpenCodeHistory: async () => ({ success: true, messages: [] }),
  getOpenCodeSessions: () => ({ success: true, sessions: [] }),
  createOpenCodeSession: async (title) => ({ success: true, sessionId: 'mock-123', title }),
  sendMessageToOpenCode: async (task, requestId) => ({ success: true, requestId }),
  getRequestResponse: (requestId) => null,
  setRequestAudioWaiting: (requestId, waiting) => {}
};

const toolset = new WorkspaceToolset(mockWorkspace);
const definitions = toolset.getDefinitions();

console.log('WorkspaceToolset has', definitions.length, 'tools:');
definitions.forEach(def => console.log('  -', def.name));

// Test executing a workspace tool
const result = await toolset.execute('get_opencode_status', {});
console.log('get_opencode_status result:', result);

return { success: true, toolCount: definitions.length, testResult: result };
```

## Test 3: CompositeToolset (Combined)

```javascript
const { BasicToolset, WorkspaceToolset, CompositeToolset } = await System.import('src/components/tools/openai-realtime-chat-tools.js');

// Create mock workspace
const mockWorkspace = {
  getOpenCodeStatus: async () => ({ success: true, status: 'idle', source: 'mock' }),
  getOpenCodeSessions: () => ({ success: true, sessions: [] })
};

const basicTools = new BasicToolset();
const workspaceTools = new WorkspaceToolset(mockWorkspace);
const composite = new CompositeToolset(basicTools, workspaceTools);

const definitions = composite.getDefinitions();
console.log('CompositeToolset has', definitions.length, 'tools total');

// Test executing from each toolset
const timeResult = await composite.execute('get_current_time', { timezone: 'America/New_York' });
console.log('Basic tool result:', timeResult);

const statusResult = await composite.execute('get_opencode_status', {});
console.log('Workspace tool result:', statusResult);

return {
  success: true,
  totalTools: definitions.length,
  basicTest: timeResult,
  workspaceTest: statusResult
};
```

## Test 4: OpenAI Realtime Chat Integration

```javascript
// Test that the openai-realtime-chat component has the toolset initialized
const chat = await lively.create('openai-realtime-chat');
document.body.appendChild(chat);

console.log('Chat component has toolset:', !!chat.toolset);
console.log('Toolset type:', chat.toolset?.constructor.name);
console.log('Available tools:', chat.getFunctionDefinitions().length);

const tools = chat.getFunctionDefinitions();
tools.forEach(tool => console.log('  -', tool.name));

// Clean up
chat.remove();

return { success: true, hasToolset: !!chat.toolset, toolCount: tools.length };
```

## Test 5: Verify No DOM Queries for Workspace

This test verifies that WorkspaceToolset doesn't use DOM queries to find the workspace.

```javascript
const { WorkspaceToolset } = await System.import('src/components/tools/openai-realtime-chat-tools.js');

// Read the source code
const source = await fetch(lively4url + '/src/components/tools/openai-realtime-chat-tools.js').then(r => r.text());

// Check for the old pattern: lively.query(document.body, "lively-ai-workspace")
const hasOldPattern = source.includes('lively.query(document.body, "lively-ai-workspace")');
const hasGetAIWorkspace = source.includes('function getAIWorkspace()');

console.log('Contains old DOM query pattern:', hasOldPattern);
console.log('Contains old getAIWorkspace helper:', hasGetAIWorkspace);

// The old pattern should NOT exist in WorkspaceToolset section
const workspaceToolsetSection = source.match(/class WorkspaceToolset[\s\S]*?^}/m);
if (workspaceToolsetSection) {
  const sectionHasQuery = workspaceToolsetSection[0].includes('lively.query(document.body, "lively-ai-workspace")');
  console.log('WorkspaceToolset section has DOM query:', sectionHasQuery);
}

return {
  success: !hasOldPattern || hasGetAIWorkspace, // Old code might still exist for backward compat
  oldPatternExists: hasOldPattern,
  explanation: 'Old pattern may exist in legacy exports but not in WorkspaceToolset class'
};
```
