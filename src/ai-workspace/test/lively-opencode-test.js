import { testWorld, loadComponent } from 'test/templates/templates-fixture.js';
import { expect } from 'src/external/chai.js';

/*MD
# OpenCode Chat Component Tests

Tests for event replay and message handling in lively-opencode component.

## Test Data Generation Helpers

These helpers create minimal event structures based on real OpenCode chat events,
stripped down to only essential fields (no system prompts, tokens, etc).
MD*/

// Helper: Create SSE event wrapper
const evt = (timestamp, type, properties) => ({
  timestamp,
  type: 'sse',
  sessionId: 'test-session',
  data: { type, properties }
});

// Helper: Create message.updated event properties
const msgUpdated = (id, role, created, parentID = null) => {
  const info = {
    id,
    sessionID: 'test-session',
    role,
    time: { created }
  };

  if (parentID) {
    info.parentID = parentID;
  }

  return { info };
};

// Helper: Create message.part.updated event properties
const partUpdated = (messageID, partId, type, text = undefined) => {
  const part = {
    id: partId,
    sessionID: 'test-session',
    messageID,
    type
  };

  if (text !== undefined) {
    part.text = text;
  }

  return { part };
};

// Helper: Create session.idle event properties
const sessionIdle = () => ({
  sessionID: 'test-session'
});

/*MD
## Test Event Sequences

Based on real OpenCode chat data but simplified for testing.
Each sequence represents a complete interaction flow.
MD*/

const testEvents = {
  // Simple greeting: user says "hi", assistant responds with streaming text
  simpleGreeting: [
    // User message created
    evt(0, 'message.updated', msgUpdated('msg_user_1', 'user', 1763398419999)),
    evt(0, 'message.part.updated', partUpdated('msg_user_1', 'prt_user_1', 'text', 'hi')),

    // Assistant message created and streams response
    evt(10, 'message.updated', msgUpdated('msg_asst_1', 'assistant', 1763398420007, 'msg_user_1')),
    evt(200, 'message.part.updated', partUpdated('msg_asst_1', 'prt_asst_1', 'text', 'Hi')),
    evt(400, 'message.part.updated', partUpdated('msg_asst_1', 'prt_asst_1', 'text', 'Hi Jens!')),
    evt(600, 'message.part.updated', partUpdated('msg_asst_1', 'prt_asst_1', 'text', 'Hi Jens! How can I help you')),
    evt(800, 'message.part.updated', partUpdated('msg_asst_1', 'prt_asst_1', 'text', 'Hi Jens! How can I help you with your coding tasks today?')),

    // Session becomes idle
    evt(1000, 'session.idle', sessionIdle())
  ],

  // Multi-turn conversation: verify message ordering and roles
  multiTurn: [
    // Turn 1: User asks question
    evt(0, 'message.updated', msgUpdated('msg_user_1', 'user', 1000)),
    evt(0, 'message.part.updated', partUpdated('msg_user_1', 'prt_u1', 'text', 'What is 2+2?')),

    // Turn 1: Assistant responds
    evt(100, 'message.updated', msgUpdated('msg_asst_1', 'assistant', 1100, 'msg_user_1')),
    evt(200, 'message.part.updated', partUpdated('msg_asst_1', 'prt_a1', 'text', '2+2 equals 4.')),
    evt(300, 'session.idle', sessionIdle()),

    // Turn 2: User follows up
    evt(1000, 'message.updated', msgUpdated('msg_user_2', 'user', 2000)),
    evt(1000, 'message.part.updated', partUpdated('msg_user_2', 'prt_u2', 'text', 'Thanks!')),

    // Turn 2: Assistant responds
    evt(1100, 'message.updated', msgUpdated('msg_asst_2', 'assistant', 2100, 'msg_user_2')),
    evt(1200, 'message.part.updated', partUpdated('msg_asst_2', 'prt_a2', 'text', 'You are welcome!')),
    evt(1300, 'session.idle', sessionIdle())
  ],

  // Edge case: Empty message that gets filled in by parts
  emptyToFilled: [
    // Message created with no parts
    evt(0, 'message.updated', msgUpdated('msg_user_1', 'user', 1000)),

    // Parts added later
    evt(100, 'message.part.updated', partUpdated('msg_user_1', 'prt_u1', 'text', 'Hello')),
    evt(200, 'message.part.updated', partUpdated('msg_user_1', 'prt_u1', 'text', 'Hello there'))
  ]
};

/*MD
## Test Suite
MD*/

describe('OpenCode Chat Event Replay', () => {
  let component;
  let savedState;

  beforeEach(async () => {
    // Save global static state before tests
    const LivelyOpencode = (await System.import('src/ai-workspace/components/lively-opencode.js')).default;
    savedState = {
      sharedServerTerminal: LivelyOpencode.sharedServerTerminal,
      sharedServerRunning: LivelyOpencode.sharedServerRunning,
      connectToServer: LivelyOpencode.prototype.connectToServer,
      loadSessions: LivelyOpencode.prototype.loadSessions,
      disconnectFromServer: LivelyOpencode.prototype.disconnectFromServer
    };

    // Stub server connection methods at prototype level to prevent ANY server interaction
    LivelyOpencode.prototype.connectToServer = function() { /* no-op */ };
    LivelyOpencode.prototype.loadSessions = function() { /* no-op */ };
    LivelyOpencode.prototype.disconnectFromServer = function() { /* no-op */ };

    // Now create component normally - it will use stubbed methods
    component = await lively.create('lively-opencode');

    // Save instance state
    savedState.eventSource = component.eventSource;
    savedState.connected = component.connected;
    savedState.shouldReconnect = component.shouldReconnect;

    // Setup replay mode with test session - MUST be isolated from server
    component._replayMode = true;
    component.messagesUI = false; // Disable UI rendering in tests (data-only testing)
    component.shouldReconnect = false; // Prevent reconnection attempts
    component.connected = false; // Not connected to server

    // Ensure no event source exists
    if (component.eventSource  && component.eventSource.close) {
      component.eventSource.close();  
    }
    component.eventSource = null;

    // Setup test session
    component.currentSession = {
      id: 'test-session',
      title: 'Test Session',
      created_at: new Date().toISOString()
    };
    component.messages.set('test-session', []);
    component.temporaryMessages.set('test-session', []);

    // Wait for any pending async operations to complete
    await lively.sleep(10);
  });

  afterEach(async () => {
    if (component) {
      // Restore instance state
      component._replayMode = false;
      component.shouldReconnect = savedState.shouldReconnect;
      component.connected = savedState.connected;

      // Clean up test component
      if (component.parentElement) {
        component.remove();
      }
    }

    // Restore global static state and prototype methods
    const LivelyOpencode = (await System.import('src/ai-workspace/components/lively-opencode.js')).default;
    LivelyOpencode.sharedServerTerminal = savedState.sharedServerTerminal;
    LivelyOpencode.sharedServerRunning = savedState.sharedServerRunning;
    LivelyOpencode.prototype.connectToServer = savedState.connectToServer;
    LivelyOpencode.prototype.loadSessions = savedState.loadSessions;
    LivelyOpencode.prototype.disconnectFromServer = savedState.disconnectFromServer;
  });

  describe('Message Creation from Events', () => {
    it('should create messages with correct roles', async () => {
      // Replay simple greeting events
      for (const event of testEvents.simpleGreeting) {
        await component.handleEvent(event.data, event.sessionId);
      }

      const messages = component.messages.get('test-session');

      expect(messages).to.have.length(2);
      expect(messages[0].info.role).to.equal('user');
      expect(messages[0].info.id).to.equal('msg_user_1');
      expect(messages[1].info.role).to.equal('assistant');
      expect(messages[1].info.id).to.equal('msg_asst_1');
    });

    it('should preserve parent message references', async () => {
      for (const event of testEvents.simpleGreeting) {
        await component.handleEvent(event.data, event.sessionId);
      }

      const messages = component.messages.get('test-session');
      const assistantMsg = messages[1];

      expect(assistantMsg.info.parentID).to.equal('msg_user_1');
    });

    it('should handle multi-turn conversations with correct ordering', async () => {
      for (const event of testEvents.multiTurn) {
        await component.handleEvent(event.data, event.sessionId);
      }

      const messages = component.messages.get('test-session');

      expect(messages).to.have.length(4);
      expect(messages[0].info.role).to.equal('user');
      expect(messages[1].info.role).to.equal('assistant');
      expect(messages[2].info.role).to.equal('user');
      expect(messages[3].info.role).to.equal('assistant');
    });
  });

  describe('Message Part Updates', () => {
    it('should build text incrementally from streaming events', async () => {
      const streamingEvents = testEvents.simpleGreeting.filter(e =>
        e.data.type === 'message.updated' || e.data.type === 'message.part.updated'
      );

      for (const event of streamingEvents) {
        await component.handleEvent(event.data, event.sessionId);
      }

      const messages = component.messages.get('test-session');
      const assistantMsg = messages[1];
      const textPart = assistantMsg.parts.find(p => p.type === 'text');

      expect(textPart).to.exist;
      expect(textPart.text).to.equal('Hi Jens! How can I help you with your coding tasks today?');
    });

    it('should create empty message then add parts', async () => {
      for (const event of testEvents.emptyToFilled) {
        await component.handleEvent(event.data, event.sessionId);
      }

      const messages = component.messages.get('test-session');

      expect(messages).to.have.length(1);
      expect(messages[0].parts).to.have.length(1);
      expect(messages[0].parts[0].text).to.equal('Hello there');
    });

    it('should update existing part when same part ID streams multiple times', async () => {
      // Create message
      await component.handleEvent(
        evt(0, 'message.updated', msgUpdated('msg_1', 'assistant', 1000)).data,
        'test-session'
      );

      // Add initial text
      await component.handleEvent(
        evt(100, 'message.part.updated', partUpdated('msg_1', 'part_1', 'text', 'Hello')).data,
        'test-session'
      );

      // Update same part
      await component.handleEvent(
        evt(200, 'message.part.updated', partUpdated('msg_1', 'part_1', 'text', 'Hello world')).data,
        'test-session'
      );

      const messages = component.messages.get('test-session');
      const msg = messages[0];

      // Should have only 1 part (updated, not duplicated)
      expect(msg.parts).to.have.length(1);
      expect(msg.parts[0].text).to.equal('Hello world');
    });

    it('should handle race condition when part arrives before message', async () => {
      // Simulate the race condition: part update arrives before message.updated
      // This happens when events arrive within 1-2ms of each other

      // Part arrives FIRST (this used to cause the part to be lost)
      await component.handleEvent(
        evt(0, 'message.part.updated', partUpdated('msg_race', 'part_1', 'text', 'Hello from racing part')).data,
        'test-session'
      );

      // Message arrives AFTER
      await component.handleEvent(
        evt(1, 'message.updated', msgUpdated('msg_race', 'user', 1000)).data,
        'test-session'
      );

      const messages = component.messages.get('test-session');
      const msg = messages.find(m => m.info.id === 'msg_race');

      // Message should exist with correct role
      expect(msg).to.exist;
      expect(msg.info.role).to.equal('user');

      // Part that arrived early should be preserved (not lost)
      expect(msg.parts).to.have.length(1);
      expect(msg.parts[0].type).to.equal('text');
      expect(msg.parts[0].text).to.equal('Hello from racing part');
    });
  });

  describe('Session State Management', () => {
    it('should handle session.idle events', async () => {
      component._replayMode = false; // Test live mode behavior
      // Simulate that the session was actively generating (as markSessionBusy would do)
      component.generatingSessions.add('test-session');
      component.isGenerating = true;

      await component.handleEvent(
        evt(0, 'session.idle', sessionIdle()).data,
        'test-session'
      );

      expect(component.isGenerating).to.equal(false);
    });
  });

  describe('Replay Mode Isolation', () => {
    it('should not capture events during replay', async () => {
      const initialCaptureLength = component.getCapturedEvents().length;

      component._replayMode = true;
      await component.handleEvent(
        evt(0, 'message.updated', msgUpdated('msg_1', 'user', 1000)).data,
        'test-session'
      );

      expect(component.getCapturedEvents()).to.have.length(initialCaptureLength);
    });

    it('should capture events during normal operation', async () => {
      component._replayMode = false;
      component.currentSession = { id: 'test-session' };

      const initialLength = component.getCapturedEvents().length;

      await component.handleEvent(
        evt(0, 'message.updated', msgUpdated('msg_1', 'user', 1000)).data,
        'test-session'
      );

      expect(component.getCapturedEvents().length).to.be.greaterThan(initialLength);
    });
  });

  describe('Incremental UI Updates', () => {
    it('should NOT call displayMessages during event streaming', async () => {
      // First create the messages (message.updated events)
      await component.handleEvent(
        evt(0, 'message.updated', msgUpdated('msg_user_1', 'user', 1763398419999)).data,
        'test-session'
      );
      await component.handleEvent(
        evt(10, 'message.updated', msgUpdated('msg_asst_1', 'assistant', 1763398420007, 'msg_user_1')).data,
        'test-session'
      );

      // Clear debug log after message creation
      const debugLog = component.get('#debugLog');
      if (debugLog) debugLog.textContent = '';

      // Track displayMessages calls via logging
      const initialLog = debugLog ? debugLog.textContent : '';

      // Now replay streaming part.updated events (should use incremental updates, not full redisplay)
      const partEvents = [
        evt(0, 'message.part.updated', partUpdated('msg_user_1', 'prt_user_1', 'text', 'hi')),
        evt(200, 'message.part.updated', partUpdated('msg_asst_1', 'prt_asst_1', 'text', 'Hi')),
        evt(400, 'message.part.updated', partUpdated('msg_asst_1', 'prt_asst_1', 'text', 'Hi Jens!')),
        evt(600, 'message.part.updated', partUpdated('msg_asst_1', 'prt_asst_1', 'text', 'Hi Jens! How can I help you')),
        evt(800, 'message.part.updated', partUpdated('msg_asst_1', 'prt_asst_1', 'text', 'Hi Jens! How can I help you with your coding tasks today?'))
      ];

      for (const event of partEvents) {
        await component.handleEvent(event.data, event.sessionId);
      }

      const finalLog = debugLog ? debugLog.textContent : '';
      const displayMessagesCallCount = (finalLog.substring(initialLog.length).match(/\[opencode\] displayMessages/g) || []).length;

      // Should be 0 - no full redisplay during streaming
      expect(displayMessagesCallCount).to.equal(0, `displayMessages should not be called during streaming updates, but was called ${displayMessagesCallCount} times`);
    });

    it('should maintain correct message data without full redisplay', async () => {
      // Process all events without displayMessages
      for (const event of testEvents.simpleGreeting) {
        await component.handleEvent(event.data, event.sessionId);
      }

      // Verify data structure is correct
      const messages = component.messages.get('test-session');
      const assistantMsg = messages[1];
      const textPart = assistantMsg.parts.find(p => p.type === 'text');

      expect(textPart.text).to.equal('Hi Jens! How can I help you with your coding tasks today?');
    });

    it('should clear temporary messages when server message arrives', async () => {
      // Start fresh - clear the empty array from beforeEach
      component.temporaryMessages.delete('test-session');

      // Add a temporary user message (simulating sending a message)
      const tempMsg = component.createOpenCodeMessage('user', [
        { type: 'text', text: 'hi' }
      ]);
      component.temporaryMessages.set('test-session', [tempMsg]);

      // Verify it was set correctly
      const tempBefore = component.temporaryMessages.get('test-session');
      expect(tempBefore).to.exist;
      expect(tempBefore).to.have.length(1);

      // Now server responds with message.updated (which should clear temp messages)
      await component.handleEvent(
        evt(0, 'message.updated', msgUpdated('msg_user_1', 'user', 1763398419999)).data,
        'test-session'
      );

      // Temporary messages should be cleared (Map.delete removes the key)
      // Check if the key was deleted OR if the array is empty
      const tempAfter = component.temporaryMessages.get('test-session');
      expect(tempAfter).to.be.undefined;

      // But server message should be in messages array
      const messages = component.messages.get('test-session');
      expect(messages).to.have.length(1);
      expect(messages[0].info.id).to.equal('msg_user_1');
    });

    it('should accumulate events across sessions when switching', async () => {
      // Seed events for the first session via captureEvent (temporarily disable replay guard)
      component._replayMode = false;
      component.captureEvent('sse', {}, 'test-session');
      component.captureEvent('sse', {}, 'test-session');
      component._replayMode = true;

      expect(component.getCapturedEvents('test-session')).to.have.length(2);

      // Switch to a different session
      const newSession = {
        id: 'new-session',
        title: 'New Session',
        created_at: new Date().toISOString()
      };

      await component.selectSession(newSession);

      // Events from the first session are still retained
      expect(component.getCapturedEvents('test-session')).to.have.length(2);
      // New session has no events yet
      expect(component.getCapturedEvents('new-session')).to.have.length(0);
      expect(component.currentSession.id).to.equal('new-session');
    });
  });

  describe('Agent Board Updates', () => {
    let mockBoard;

    beforeEach(() => {
      // Create mock board with tracking
      mockBoard = {
        filesRead: [],
        filesWritten: [],
        toolUsages: [],
        workingDirectory: null,
        projectPath: null,
        urlBase: null,
        addFileRead(path) {
          if (!this.filesRead.includes(path)) {
            this.filesRead.push(path);
          }
        },
        addFileWritten(path) {
          if (!this.filesWritten.includes(path)) {
            this.filesWritten.push(path);
          }
        },
        addToolUsage(toolName) {
          this.toolUsages.push(toolName);
        },
        setContext(context) {
          this.workingDirectory = context.workingDirectory;
          this.projectPath = context.projectPath;
          this.urlBase = context.urlBase;
        },
        updateFromMessage(message, context) {
          // Delegate to the board's actual implementation logic
          if (context) {
            this.setContext(context);
          }
          
          const parts = message.parts || [];
          for (const part of parts) {
            const toolName = part.name || part.tool;
            if (!toolName) continue;
            
            this.addToolUsage(toolName);
            
            const input = part.input || part.state?.input || {};
            const filePath = input.filePath || input.path;
            
            if (!filePath) continue;
            
            if (toolName === 'mcp_read' || toolName === 'read_file' || toolName === 'read') {
              this.addFileRead(filePath);
            }
            
            if (toolName === 'mcp_write' || toolName === 'write_file' || toolName === 'write' || 
                toolName === 'mcp_edit' || toolName === 'edit') {
              this.addFileWritten(filePath);
            }
          }
        },
        clearFileLinks() {
          this.filesRead = [];
          this.filesWritten = [];
        },
        clearAll() {
          this.filesRead = [];
          this.filesWritten = [];
          this.toolUsages = [];
        }
      };

      // Stub get('#agentBoard') to return our mock
      const originalGet = component.get.bind(component);
      component.get = function(selector) {
        if (selector === '#agentBoard') {
          return mockBoard;
        }
        return originalGet(selector);
      };
    });

    it('should update board with Read tool usage', () => {
      const message = {
        info: { id: 'msg_1', role: 'assistant' },
        parts: [
          {
            type: 'tool_use',
            name: 'mcp_read',
            input: { filePath: '/path/to/file.js' }
          }
        ]
      };

      component.updateBoardWithFileOperations(message);

      expect(mockBoard.filesRead).to.deep.equal(['/path/to/file.js']);
      expect(mockBoard.filesWritten).to.be.empty;
    });

    it('should update board with Write tool usage', () => {
      const message = {
        info: { id: 'msg_1', role: 'assistant' },
        parts: [
          {
            type: 'tool_use',
            name: 'mcp_write',
            input: { filePath: '/path/to/output.js' }
          }
        ]
      };

      component.updateBoardWithFileOperations(message);

      expect(mockBoard.filesRead).to.be.empty;
      expect(mockBoard.filesWritten).to.deep.equal(['/path/to/output.js']);
    });

    it('should update board with Edit tool usage', () => {
      const message = {
        info: { id: 'msg_1', role: 'assistant' },
        parts: [
          {
            type: 'tool_use',
            name: 'mcp_edit',
            input: { filePath: '/path/to/edit.js' }
          }
        ]
      };

      component.updateBoardWithFileOperations(message);

      expect(mockBoard.filesRead).to.be.empty;
      expect(mockBoard.filesWritten).to.deep.equal(['/path/to/edit.js']);
    });

    it('should update board with both Read and Write tools', () => {
      const message = {
        info: { id: 'msg_1', role: 'assistant' },
        parts: [
          {
            type: 'tool_use',
            name: 'mcp_read',
            input: { filePath: '/path/to/input.js' }
          },
          {
            type: 'tool_use',
            name: 'mcp_write',
            input: { filePath: '/path/to/output.js' }
          }
        ]
      };

      component.updateBoardWithFileOperations(message);

      expect(mockBoard.filesRead).to.deep.equal(['/path/to/input.js']);
      expect(mockBoard.filesWritten).to.deep.equal(['/path/to/output.js']);
    });

    it('should handle tool state input format', () => {
      const message = {
        info: { id: 'msg_1', role: 'assistant' },
        parts: [
          {
            type: 'tool',
            tool: 'mcp_read',
            state: {
              input: { filePath: '/path/to/stateful.js' }
            }
          }
        ]
      };

      component.updateBoardWithFileOperations(message);

      expect(mockBoard.filesRead).to.deep.equal(['/path/to/stateful.js']);
    });

    it('should scan all messages in a session', () => {
      const messages = [
        {
          info: { id: 'msg_1', role: 'assistant' },
          parts: [
            { type: 'tool_use', name: 'mcp_read', input: { filePath: '/file1.js' } }
          ]
        },
        {
          info: { id: 'msg_2', role: 'assistant' },
          parts: [
            { type: 'tool_use', name: 'mcp_write', input: { filePath: '/file2.js' } }
          ]
        }
      ];

      component.messages.set('test-session', messages);
      component.updateBoardWithAllMessages('test-session');

      expect(mockBoard.filesRead).to.deep.equal(['/file1.js']);
      expect(mockBoard.filesWritten).to.deep.equal(['/file2.js']);
    });

    it('should handle alternative tool names', () => {
      const message = {
        info: { id: 'msg_1', role: 'assistant' },
        parts: [
          { type: 'tool_use', name: 'read_file', input: { path: '/read.js' } },
          { type: 'tool_use', name: 'write_file', input: { path: '/write.js' } }
        ]
      };

      component.updateBoardWithFileOperations(message);

      expect(mockBoard.filesRead).to.deep.equal(['/read.js']);
      expect(mockBoard.filesWritten).to.deep.equal(['/write.js']);
    });

    it('should set board context with working directory and project info', () => {
      // Setup component state
      component.workingDirectory = '/home/jens/lively4/lively4-core';
      component.currentProject = { path: 'src/ai-workspace' };

      const message = {
        info: { id: 'msg_1', role: 'assistant' },
        parts: [
          { type: 'tool_use', name: 'mcp_read', input: { filePath: '/file.js' } }
        ]
      };

      component.updateBoardWithFileOperations(message);

      expect(mockBoard.workingDirectory).to.equal('/home/jens/lively4/lively4-core');
      expect(mockBoard.projectPath).to.equal('src/ai-workspace');
    });
  });
});
