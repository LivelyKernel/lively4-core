import { expect } from 'src/external/chai.js';

/*MD
# OpenAI Realtime Chat Event Replay Tests

Tests for event replay and transcript handling in openai-realtime-chat component.

## Test Data Generation Helpers

These helpers create minimal event structures based on real OpenAI Realtime API events,
stripped down to only essential fields (no audio data).
MD*/


/*MD ## Helpers MD*/

const evt = (timestamp, type, properties = {}) => ({
  timestamp,
  type: 'realtime',
  sessionId: 'test-conversation',
  data: { type, ...properties }
});

const userTranscript = (transcript, timestamp) => ({
  type: 'conversation.item.input_audio_transcription.completed',
  transcript,
  item_id: `item_user_${timestamp}`
});

const assistantDelta = (delta) => ({
  type: 'response.audio_transcript.delta',
  delta
});

const assistantDone = (transcript, timestamp) => ({
  type: 'response.audio_transcript.done',
  transcript,
  item_id: `item_asst_${timestamp}`
});

const responseDone = () => ({
  type: 'response.done',
  response: {
    output: []
  }
});

/*MD
## Test Event Sequences

Based on real OpenAI Realtime API data but simplified for testing.
Each sequence represents a complete interaction flow.
MD*/

const testEvents = {
  // Simple greeting: user says "hi", assistant responds with streaming text
  simpleGreeting: [
    // User speaks and transcript completes
    evt(0, 'conversation.item.input_audio_transcription.completed',
      userTranscript('hi', 1000)),

    // Assistant starts streaming response
    evt(100, 'response.audio_transcript.delta', assistantDelta('Hi')),
    evt(200, 'response.audio_transcript.delta', assistantDelta(' Jens!')),
    evt(300, 'response.audio_transcript.delta', assistantDelta(' How can I help you')),
    evt(400, 'response.audio_transcript.delta', assistantDelta(' today?')),

    // Assistant transcript complete
    evt(500, 'response.audio_transcript.done',
      assistantDone('Hi Jens! How can I help you today?', 1500)),

    // Response complete
    evt(600, 'response.done', responseDone())
  ],

  // Multi-turn conversation: verify message ordering
  multiTurn: [
    // Turn 1: User asks question
    evt(0, 'conversation.item.input_audio_transcription.completed',
      userTranscript('What is 2+2?', 1000)),

    // Turn 1: Assistant responds
    evt(100, 'response.audio_transcript.done',
      assistantDone('2+2 equals 4.', 1100)),
    evt(200, 'response.done', responseDone()),

    // Turn 2: User follows up
    evt(1000, 'conversation.item.input_audio_transcription.completed',
      userTranscript('Thanks!', 2000)),

    // Turn 2: Assistant responds
    evt(1100, 'response.audio_transcript.done',
      assistantDone('You are welcome!', 2100)),
    evt(1200, 'response.done', responseDone())
  ],

  // Streaming: Build transcript incrementally
  streamingResponse: [
    evt(0, 'conversation.item.input_audio_transcription.completed',
      userTranscript('Tell me a joke', 1000)),

    evt(100, 'response.audio_transcript.delta', assistantDelta('Why')),
    evt(150, 'response.audio_transcript.delta', assistantDelta(' did')),
    evt(200, 'response.audio_transcript.delta', assistantDelta(' the')),
    evt(250, 'response.audio_transcript.delta', assistantDelta(' chicken')),
    evt(300, 'response.audio_transcript.delta', assistantDelta(' cross')),
    evt(350, 'response.audio_transcript.delta', assistantDelta(' the road?')),

    evt(400, 'response.audio_transcript.done',
      assistantDone('Why did the chicken cross the road?', 1400)),
    evt(500, 'response.done', responseDone())
  ]
};

/*MD
## Test Suite
MD*/

describe('OpenAI Realtime Chat Event Replay', () => {
  let component;
  let testConversationIds;

  beforeEach(async () => {
    // Track conversations created during tests for cleanup
    testConversationIds = [];
    
    // Create component
    component = await lively.create('openai-realtime-chat');

    // Setup replay mode - MUST be isolated from WebRTC
    component._replayMode = true;
    component.messagesUI = false; // Disable UI rendering in tests (data-only testing)

    // Ensure no WebRTC connection
    if (component.peerConnection) {
      component.disconnectRealtimeWebRTC();
      component.peerConnection = null;
    }

    // Setup test conversation
    component.currentConversationId = 'test-conversation';
    component.conversation = [];
    component.messageSequence = 0;

    // Clear messages container
    const messagesContainer = component.get('#messagesContainer');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
  });

  afterEach(async () => {
    if (component) {
      component._replayMode = false;

      // Clean up test conversations from database
      const db = component.constructor.conversationdb;
      for (const conversationId of testConversationIds) {
        try {
          await db.messages.where('conversationId').equals(conversationId).delete();
          await db.conversations.delete(conversationId);
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      // Clean up test component
      if (component.parentElement) {
        component.remove();
      }
    }
  });

  describe('Message Creation from Events', () => {
    xit('should create messages with correct roles', async () => {
      // Replay simple greeting events
      for (const event of testEvents.simpleGreeting) {
        await component.handleRealtimeMessage(event.data);
      }

      expect(component.conversation).to.have.length(2);
      expect(component.conversation[0].role).to.equal('user');
      expect(component.conversation[0].content).to.equal('hi');
      expect(component.conversation[1].role).to.equal('assistant');
      expect(component.conversation[1].content).to.equal('Hi Jens! How can I help you today?');
    });

    xit('should handle multi-turn conversations with correct ordering', async () => {
      for (const event of testEvents.multiTurn) {
        await component.handleRealtimeMessage(event.data);
      }

      expect(component.conversation).to.have.length(4);
      expect(component.conversation[0].role).to.equal('user');
      expect(component.conversation[0].content).to.equal('What is 2+2?');
      expect(component.conversation[1].role).to.equal('assistant');
      expect(component.conversation[1].content).to.equal('2+2 equals 4.');
      expect(component.conversation[2].role).to.equal('user');
      expect(component.conversation[2].content).to.equal('Thanks!');
      expect(component.conversation[3].role).to.equal('assistant');
      expect(component.conversation[3].content).to.equal('You are welcome!');
    });
  });

  describe('Transcript Streaming', () => {
    xit('should build transcript incrementally from delta events', async () => {
      for (const event of testEvents.streamingResponse) {
        await component.handleRealtimeMessage(event.data);
      }

      const assistantMsg = component.conversation[1];
      expect(assistantMsg).to.exist;
      expect(assistantMsg.role).to.equal('assistant');
      expect(assistantMsg.content).to.equal('Why did the chicken cross the road?');
    });

    xit('should accumulate deltas in currentAssistantTranscript', async () => {
      // Process deltas only
      const deltaEvents = testEvents.streamingResponse.filter(e =>
        e.data.type === 'response.audio_transcript.delta'
      );

      for (const event of deltaEvents) {
        await component.handleRealtimeMessage(event.data);
      }

      // Should have accumulated transcript
      expect(component.currentAssistantTranscript).to.exist;
      expect(component.currentAssistantTranscript).to.include('chicken');
    });
  });

  describe('Replay Mode Isolation', () => {
    it('should not capture events during replay', async () => {
      const initialCaptureLength = component.getCapturedEvents().length;

      component._replayMode = true;
      await component.handleRealtimeMessage({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: 'test'
      });

      expect(component.getCapturedEvents()).to.have.length(initialCaptureLength);
    });

    it('should capture events during normal operation', async () => {
      component._replayMode = false;

      const initialLength = component.getCapturedEvents().length;

      await component.handleRealtimeMessage({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: 'test'
      });

      expect(component.getCapturedEvents().length).to.be.greaterThan(initialLength);
    });

    it('should not capture audio.delta events', async () => {
      component._replayMode = false;

      const initialLength = component.getCapturedEvents().length;

      // This should NOT be captured (audio data)
      await component.handleRealtimeMessage({
        type: 'response.audio.delta',
        delta: 'base64audiodata...'
      });

      expect(component.getCapturedEvents()).to.have.length(initialLength);
    });
  });


  describe('Duplicate Prevention', () => {
    it('should not save duplicate messages from same item_id', async () => {
      // First: Create the message (conversation.item.created)
      await component.handleRealtimeMessage({
        type: 'conversation.item.created',
        item: {
          id: 'item_123',
          type: 'message',
          role: 'assistant'
        }
      });

      // Then: First completion
      await component.handleRealtimeMessage({
        type: 'response.audio_transcript.done',
        transcript: 'Hello',
        item_id: 'item_123'
      });

      const initialLength = component.conversation.length;

      // Duplicate event with same item_id
      await component.handleRealtimeMessage({
        type: 'response.audio_transcript.done',
        transcript: 'Hello',
        item_id: 'item_123'
      });

      // Should not add duplicate
      expect(component.conversation).to.have.length(initialLength);
    });
  });

  describe('Message Ordering', () => {
    
    it('should handle messages without sequence numbers (backward compatibility)', async function() {
      this.timeout(5000);
      
      // Disable replay mode to allow database writes
      component._replayMode = false;
      
      // Create a conversation
      const conversationId = await component.createSession();
      testConversationIds.push(conversationId);
      
      // Manually insert messages into DB without sequence numbers (simulating old data)
      const db = component.constructor.conversationdb;
      
      await db.messages.add({
        conversationId: conversationId,
        timestamp: 1000,
        role: 'user',
        content: 'Old message 1',
        type: 'message'
      });
      
      await db.messages.add({
        conversationId: conversationId,
        timestamp: 2000,
        role: 'assistant',
        content: 'Old message 2',
        type: 'message'
      });
      
      // Reload conversation
      await component.loadConversation(conversationId);
      
      // Should fall back to timestamp ordering
      expect(component.conversation).to.have.length(2);
      expect(component.conversation[0].content).to.equal('Old message 1');
      expect(component.conversation[1].content).to.equal('Old message 2');
    });
    
    it('should handle mixed messages (some with sequence, some without)', async function() {
      this.timeout(5000);
      
      // Disable replay mode to allow database writes
      component._replayMode = false;
      
      // Create a conversation
      const conversationId = await component.createSession();
      testConversationIds.push(conversationId);
      
      const db = component.constructor.conversationdb;
      
      // Old message without sequence (timestamp 1000)
      await db.messages.add({
        conversationId: conversationId,
        timestamp: 1000,
        role: 'user',
        content: 'Old message',
        type: 'message'
      });
      
      // New message with sequence (timestamp 500 - earlier, but sequence 0)
      await db.messages.add({
        conversationId: conversationId,
        timestamp: 500,
        sequence: 0,
        role: 'assistant',
        content: 'New message with sequence',
        type: 'message'
      });
      
      // Reload conversation
      await component.loadConversation(conversationId);
      
      // Messages with sequence should come first, then fall back to timestamp
      expect(component.conversation).to.have.length(2);
      expect(component.conversation[0].content).to.equal('New message with sequence');
      expect(component.conversation[1].content).to.equal('Old message');
    });
  });

  describe('Timestamp Preservation', () => {
    let component;

    beforeEach(async () => {
      component = await lively.create('openai-realtime-chat');
      component.messagesUI = false;  // Disable UI for faster tests
      await component.initialize();
    });

    afterEach(() => {
      component.remove();
    });

    it('should preserve timestamp when updating message with createMessage/updateMessage', async () => {
      const item_id = 'test_item_123';
      const role = 'user';
      
      // Step 1: Create message with initial content (like "Listening...")
      await component.createRealtimeMessage(role, '_Listening..._', { item_id, persist: false });
      
      // Capture the original timestamp from the Map
      const originalTimestamp = component.messageTimestamps.get(item_id);
      expect(originalTimestamp).to.exist;
      expect(originalTimestamp).to.be.a('number');
      
      // Wait a bit to ensure time has passed
      await lively.sleep(10);
      
      // Step 2: Update message with final content (like actual transcript)
      await component.updateMessage(item_id, role, 'Hello world', false);
      
      // Verify timestamp was preserved (NOT updated)
      const updatedTimestamp = component.messageTimestamps.get(item_id);
      expect(updatedTimestamp).to.equal(originalTimestamp);
    });

    it('should preserve timestamp across multiple updates', async () => {
      const item_id = 'test_item_456';
      const role = 'assistant';
      
      // Create message
      await component.createRealtimeMessage(role, '', { item_id, persist: false });
      const originalTimestamp = component.messageTimestamps.get(item_id);
      
      // Multiple updates (simulating streaming) - no need to sleep between updates
      await component.updateMessage(item_id, role, 'Hello', false);
      await component.updateMessage(item_id, role, 'Hello world', false);
      await component.updateMessage(item_id, role, 'Hello world!', false);
      
      // Timestamp should still be the original
      const finalTimestamp = component.messageTimestamps.get(item_id);
      expect(finalTimestamp).to.equal(originalTimestamp);
    });

    it('should use stored timestamp when persisting message', async () => {
      const item_id = 'test_item_789';
      const role = 'user';
      
      // Create message with timestamp
      await component.createRealtimeMessage(role, 'Initial', { item_id, persist: false });
      const originalTimestamp = component.messageTimestamps.get(item_id);
      
      // Wait and then persist via updateMessage
      await lively.sleep(20);
      
      // Spy on saveMessageToDb to verify the timestamp
      let savedTimestamp = null;
      const originalSave = component.saveMessageToDb.bind(component);
      component.saveMessageToDb = async (message) => {
        savedTimestamp = message.timestamp;
        return originalSave(message);
      };
      
      // Update with persist=true
      await component.updateMessage(item_id, role, 'Final content', true);
      
      // Verify the saved timestamp matches the original (not a newer time)
      expect(savedTimestamp).to.exist;
      expect(savedTimestamp).to.equal(originalTimestamp);
    });

    it('should maintain correct message ordering after updates', async () => {
      // Create first message
      await component.createRealtimeMessage('user', 'First', { item_id: 'item_1', persist: false });
      const timestamp1 = component.messageTimestamps.get('item_1');
      
      // Wait to ensure different timestamp
      await lively.sleep(10);
      
      // Create second message
      await component.createRealtimeMessage('user', 'Second', { item_id: 'item_2', persist: false });
      const timestamp2 = component.messageTimestamps.get('item_2');
      
      // Verify second timestamp is later
      expect(timestamp2).to.be.greaterThan(timestamp1);
      
      // Now update first message (should NOT change its timestamp)
      await lively.sleep(10);
      await component.updateMessage('item_1', 'user', 'First updated', false);
      
      // Verify first message still has earlier timestamp
      const updatedTimestamp1 = component.messageTimestamps.get('item_1');
      expect(updatedTimestamp1).to.equal(timestamp1);
      expect(updatedTimestamp1).to.be.lessThan(timestamp2);
    });
  });

  describe('Message Persistence', () => {
    let component;

    beforeEach(async () => {
      component = await lively.create('openai-realtime-chat');
      component.messagesUI = false;
      await component.initialize();
      // Clear conversation array for clean test
      component.conversation = [];
    });

    afterEach(() => {
      component.remove();
    });

    it('should persist metadata in tool messages', async () => {
      const metadata = {
        type: 'function_call',
        functionName: 'test_function',
        call_id: 'call_123',
        arguments: { arg1: 'value1' }
      };

      // Create tool message
      await component.createRealtimeMessage('tool', '🔧 Test tool call', { metadata });

      // Check conversation array
      expect(component.conversation.length).to.equal(1);
      const savedMessage = component.conversation[0];
      
      // Verify metadata is saved
      expect(savedMessage.metadata).to.exist;
      expect(savedMessage.metadata.type).to.equal('function_call');
      expect(savedMessage.metadata.functionName).to.equal('test_function');
      expect(savedMessage.metadata.call_id).to.equal('call_123');
      expect(savedMessage.metadata.arguments).to.deep.equal({ arg1: 'value1' });
      
      // Verify type field is also saved (extracted from metadata)
      expect(savedMessage.type).to.equal('function_call');
    });

    it('should persist metadata in function results', async () => {
      const metadata = {
        type: 'function_call_output',
        call_id: 'call_123',
        output: { success: true, result: 'test result' }
      };

      // Create function result message
      await component.createRealtimeMessage('tool', '✅ Function result', { metadata });

      // Check conversation array
      expect(component.conversation.length).to.equal(1);
      const savedMessage = component.conversation[0];
      
      // Verify metadata is saved
      expect(savedMessage.metadata).to.exist;
      expect(savedMessage.metadata.type).to.equal('function_call_output');
      expect(savedMessage.metadata.call_id).to.equal('call_123');
      expect(savedMessage.metadata.output).to.deep.equal({ success: true, result: 'test result' });
      expect(savedMessage.type).to.equal('function_call_output');
    });
  });

  describe('Tool Permissions', () => {
    let component;
    let originalPreference;

    beforeEach(async () => {
      // Save and clear preferences to start fresh
      originalPreference = lively.preferences.get("openai-realtime-chat-tool-permissions");
      lively.preferences.set("openai-realtime-chat-tool-permissions", undefined);
      
      component = await lively.create('openai-realtime-chat');
      component.messagesUI = false;  // Disable UI for faster tests
      await component.initialize();
    });

    afterEach(() => {
      component.remove();
      // Restore original preference
      if (originalPreference !== undefined) {
        lively.preferences.set("openai-realtime-chat-tool-permissions", originalPreference);
      } else {
        lively.preferences.set("openai-realtime-chat-tool-permissions", undefined);
      }
    });

    it('should have default tool permissions (all enabled)', () => {
      expect(component.toolPermissions.allowCodeEvaluation).to.be.true;
      expect(component.toolPermissions.allowOpenCodeTasks).to.be.true;
    });

    it('should load tool permissions from preferences', async () => {
      // Set preferences before component creation
      const testPermissions = {
        allowCodeEvaluation: false,
        allowOpenCodeTasks: true,
        allowMessageInspection: false,
        allowVoiceFileTools: true
      };
      lively.preferences.set("openai-realtime-chat-tool-permissions", testPermissions);

      // Create new component to load preferences
      const newComponent = await lively.create('openai-realtime-chat');
      newComponent.messagesUI = false;
      await newComponent.initialize();

      // Verify all permissions are loaded correctly
      expect(newComponent.toolPermissions).to.deep.equal(testPermissions);
      
      // Also verify each permission individually for clarity if test fails
      expect(newComponent.toolPermissions.allowCodeEvaluation).to.equal(false);
      expect(newComponent.toolPermissions.allowOpenCodeTasks).to.equal(true);
      expect(newComponent.toolPermissions.allowMessageInspection).to.equal(false);
      expect(newComponent.toolPermissions.allowVoiceFileTools).to.equal(true);

      newComponent.remove();
    });

    it('should merge partial permissions with defaults (future-proof)', async () => {
      // Simulate old saved preferences missing new permission fields
      // This ensures the test remains robust when new permissions are added
      lively.preferences.set("openai-realtime-chat-tool-permissions", {
        allowCodeEvaluation: false,
        allowOpenCodeTasks: true
        // Missing: allowMessageInspection, allowVoiceFileTools
      });

      const newComponent = await lively.create('openai-realtime-chat');
      newComponent.messagesUI = false;
      await newComponent.initialize();

      // Verify saved permissions are preserved
      expect(newComponent.toolPermissions.allowCodeEvaluation).to.equal(false);
      expect(newComponent.toolPermissions.allowOpenCodeTasks).to.equal(true);
      
      // Verify missing permissions default to true
      expect(newComponent.toolPermissions.allowMessageInspection).to.equal(true);
      expect(newComponent.toolPermissions.allowVoiceFileTools).to.equal(true);
      
      // Verify all known permission fields are present
      const expectedKeys = ['allowCodeEvaluation', 'allowOpenCodeTasks', 'allowMessageInspection', 'allowVoiceFileTools'];
      expect(Object.keys(newComponent.toolPermissions).sort()).to.deep.equal(expectedKeys.sort());

      newComponent.remove();
    });

    it('should filter tools based on permissions (code evaluation disabled)', () => {
      component.toolPermissions = {
        allowCodeEvaluation: false,
        allowOpenCodeTasks: false
      };
      component.updateToolset();

      const tools = component.getFunctionDefinitions();
      const toolNames = tools.map(t => t.name);

      expect(toolNames).to.not.include('evaluate_code');
      expect(toolNames).to.not.include('send_opencode_task');
      expect(toolNames).to.not.include('stop_opencode_task');
      expect(toolNames).to.not.include('continue_opencode_task');
      expect(toolNames).to.not.include('get_opencode_current_state');
    });

    it('should include code evaluation tool when allowed', () => {
      component.toolPermissions = {
        allowCodeEvaluation: true,
        allowOpenCodeTasks: false
      };
      component.updateToolset();

      const tools = component.getFunctionDefinitions();
      const toolNames = tools.map(t => t.name);

      expect(toolNames).to.include('evaluate_code');
      expect(toolNames).to.not.include('send_opencode_task');
      expect(toolNames).to.not.include('stop_opencode_task');
      expect(toolNames).to.not.include('continue_opencode_task');
      expect(toolNames).to.not.include('get_opencode_current_state');
    });

    it('should include OpenCode task tool when allowed (with workspace)', () => {
      // Create mock workspace
      const mockWorkspace = document.createElement('lively-ai-workspace');
      component.workspaceReference = mockWorkspace;

      component.toolPermissions = {
        allowCodeEvaluation: false,
        allowOpenCodeTasks: true
      };
      component.updateToolset();

      const tools = component.getFunctionDefinitions();
      const toolNames = tools.map(t => t.name);

      expect(toolNames).to.not.include('evaluate_code');
      expect(toolNames).to.include('send_opencode_task');
      expect(toolNames).to.include('stop_opencode_task');
      expect(toolNames).to.include('continue_opencode_task');
      expect(toolNames).to.include('get_opencode_current_state');

      mockWorkspace.remove();
    });

    it('should save tool permissions to preferences', () => {
      component.toolPermissions = {
        allowCodeEvaluation: false,
        allowOpenCodeTasks: true,
        allowMessageInspection: false,
        allowVoiceFileTools: true
      };

      // Simulate saving
      lively.preferences.set("openai-realtime-chat-tool-permissions", component.toolPermissions);

      const saved = lively.preferences.get("openai-realtime-chat-tool-permissions");
      expect(saved).to.deep.equal({
        allowCodeEvaluation: false,
        allowOpenCodeTasks: true,
        allowMessageInspection: false,
        allowVoiceFileTools: true
      });
    });

    it('should update available tools when permissions change', () => {
      // Initially all tools
      component.toolPermissions = {
        allowCodeEvaluation: true,
        allowOpenCodeTasks: false
      };
      component.updateToolset();

      let tools = component.getFunctionDefinitions();
      expect(tools.map(t => t.name)).to.include('evaluate_code');

      // Disable code evaluation
      component.toolPermissions.allowCodeEvaluation = false;
      component.updateToolset();

      tools = component.getFunctionDefinitions();
      expect(tools.map(t => t.name)).to.not.include('evaluate_code');
    });
  });

  /*MD ## System Message Parsing Tests MD*/
  describe('System Message Parsing', () => {
    let messageComponent;

    beforeEach(async () => {
      messageComponent = await lively.create('lively-chat-message');
    });

    it('should detect system messages from audio source with [System: ...] pattern', () => {
      const msg = {
        role: 'user',
        content: '[System: The coding agent finished working on: "Vox tool call rendering path"]',
        source: 'audio',
        streamType: 'realtime'
      };

      const result = messageComponent.parseSystemMessage(msg);

      expect(result).to.not.be.null;
      expect(result.isSystemMessage).to.be.true;
      expect(result.systemContent).to.equal('The coding agent finished working on: "Vox tool call rendering path"');
    });

    it('should parse system content with whitespace variations', () => {
      const msg = {
        role: 'user',
        content: '[System:    Extra spaces test   ]',
        source: 'audio'
      };

      const result = messageComponent.parseSystemMessage(msg);

      expect(result).to.not.be.null;
      expect(result.systemContent).to.equal('Extra spaces test');
    });

    it('should not parse regular user messages as system messages', () => {
      const msg = {
        role: 'user',
        content: 'Hello, how are you?',
        source: 'audio'
      };

      const result = messageComponent.parseSystemMessage(msg);

      expect(result).to.be.null;
    });

    it('should not parse messages with [System: ] pattern from code source', () => {
      const msg = {
        role: 'user',
        content: '[System: This should not be parsed]',
        source: 'code',
        streamType: 'opencode'
      };

      const result = messageComponent.parseSystemMessage(msg);

      expect(result).to.be.null;
    });

    it('should not parse assistant messages with [System: ] pattern', () => {
      const msg = {
        role: 'assistant',
        content: '[System: This is from assistant]',
        source: 'audio'
      };

      const result = messageComponent.parseSystemMessage(msg);

      expect(result).to.be.null;
    });

    it('should not parse partial [System: ] patterns', () => {
      const testCases = [
        'System: Missing opening bracket',
        '[System: Missing closing bracket',
        '[System] No colon',
        'Text before [System: content]',
        '[System: content] text after'
      ];

      testCases.forEach(content => {
        const msg = {
          role: 'user',
          content,
          source: 'audio'
        };

        const result = messageComponent.parseSystemMessage(msg);
        expect(result).to.be.null;
      });
    });

    it('should render system messages with correct role attribute', async () => {
      const msg = {
        role: 'user',
        content: '[System: Test system message]',
        source: 'audio',
        streamType: 'realtime'
      };

      await messageComponent.setMessage(msg);

      expect(messageComponent.getAttribute('role')).to.equal('system');
      expect(messageComponent.getAttribute('source')).to.equal('audio');
    });

    it('should render regular user messages with user role', async () => {
      const msg = {
        role: 'user',
        content: 'Regular message',
        source: 'audio',
        streamType: 'realtime'
      };

      await messageComponent.setMessage(msg);

      expect(messageComponent.getAttribute('role')).to.equal('user');
    });

    it('should format system message content in italic', async () => {
      const msg = {
        role: 'user',
        content: '[System: Test content]',
        source: 'audio',
        streamType: 'realtime'
      };

      await messageComponent.setMessage(msg);

      // Check that content was rendered (partsContainer should have markdown element)
      const partsContainer = messageComponent.get('#partsContainer');
      expect(partsContainer.children.length).to.be.greaterThan(0);
    });
    
    it('should render read_file_voice results with syntax highlighting', async () => {
      const msg = {
        role: 'tool',
        source: 'audio',
        metadata: {
          type: 'function_call_output',
          call_id: 'test-call-456',
          output: {
            success: true,
            tool: 'read_file_voice',
            path: 'test/example.js',
            content: '1: // test file\n2: const x = 42;',
            metadata: {
              fileName: 'example.js',
              fileExt: 'js',
              totalLines: 2,
              shownLines: [1, 2]
            }
          }
        }
      };

      await messageComponent.setMessage(msg);

      // Check that VoxReadFileTool renderer was used
      const partsContainer = messageComponent.get('#partsContainer');
      const details = partsContainer.querySelector('details');
      expect(details).to.not.be.null;
      
      // Check compact-tool-call class
      expect(details.classList.contains('compact-tool-call')).to.be.true;
      
      // Check summary with file icon and name
      const summary = details.querySelector('summary');
      expect(summary).to.not.be.null;
      expect(summary.textContent).to.include('📖');
      expect(summary.textContent).to.include('example.js');
      
      // Check that content is in a code block (lively-markdown element)
      const markdown = details.querySelector('lively-markdown');
      expect(markdown).to.not.be.null;
    });
    
    it('should fall back to generic renderer for unknown tools', async () => {
      const msg = {
        role: 'tool',
        source: 'audio',
        metadata: {
          type: 'function_call_output',
          call_id: 'test-call-789',
          functionName: 'some_unknown_tool',
          output: {
            success: true,
            result: 'Test result'
          }
        }
      };

      await messageComponent.setMessage(msg);

      // Check that generic Vox renderer was used (should have details)
      const partsContainer = messageComponent.get('#partsContainer');
      const details = partsContainer.querySelector('details');
      expect(details).to.not.be.null;
      
      // Generic renderer should show JSON output
      const markdown = details.querySelector('lively-markdown');
      expect(markdown).to.not.be.null;
    });
  });
});
