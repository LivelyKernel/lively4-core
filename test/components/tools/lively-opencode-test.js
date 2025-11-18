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

  beforeEach(async () => {
    component = await lively.create('lively-opencode');
    await component.initialize();

    // Setup replay mode with test session
    component._replayMode = true;
    component.currentSession = {
      id: 'test-session',
      title: 'Test Session',
      created_at: new Date().toISOString()
    };
    component.messages.set('test-session', []);
    component.temporaryMessages.set('test-session', []);
  });

  afterEach(() => {
    if (component) {
      component._replayMode = false;
    }
  });

  describe('Message Creation from Events', () => {
    it('should create messages with correct roles', async () => {
      // Replay simple greeting events
      for (const event of testEvents.simpleGreeting) {
        component.handleEvent(event.data, event.sessionId);
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
        component.handleEvent(event.data, event.sessionId);
      }

      const messages = component.messages.get('test-session');
      const assistantMsg = messages[1];

      expect(assistantMsg.info.parentID).to.equal('msg_user_1');
    });

    it('should handle multi-turn conversations with correct ordering', async () => {
      for (const event of testEvents.multiTurn) {
        component.handleEvent(event.data, event.sessionId);
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
        component.handleEvent(event.data, event.sessionId);
      }

      const messages = component.messages.get('test-session');
      const assistantMsg = messages[1];
      const textPart = assistantMsg.parts.find(p => p.type === 'text');

      expect(textPart).to.exist;
      expect(textPart.text).to.equal('Hi Jens! How can I help you with your coding tasks today?');
    });

    it('should create empty message then add parts', async () => {
      for (const event of testEvents.emptyToFilled) {
        component.handleEvent(event.data, event.sessionId);
      }

      const messages = component.messages.get('test-session');

      expect(messages).to.have.length(1);
      expect(messages[0].parts).to.have.length(1);
      expect(messages[0].parts[0].text).to.equal('Hello there');
    });

    it('should update existing part when same part ID streams multiple times', async () => {
      // Create message
      component.handleEvent(
        evt(0, 'message.updated', msgUpdated('msg_1', 'assistant', 1000)).data,
        'test-session'
      );

      // Add initial text
      component.handleEvent(
        evt(100, 'message.part.updated', partUpdated('msg_1', 'part_1', 'text', 'Hello')).data,
        'test-session'
      );

      // Update same part
      component.handleEvent(
        evt(200, 'message.part.updated', partUpdated('msg_1', 'part_1', 'text', 'Hello world')).data,
        'test-session'
      );

      const messages = component.messages.get('test-session');
      const msg = messages[0];

      // Should have only 1 part (updated, not duplicated)
      expect(msg.parts).to.have.length(1);
      expect(msg.parts[0].text).to.equal('Hello world');
    });
  });

  describe('Session State Management', () => {
    it('should handle session.idle events', async () => {
      component._replayMode = false; // Test live mode behavior
      component.isGenerating = true;

      component.handleEvent(
        evt(0, 'session.idle', sessionIdle()).data,
        'test-session'
      );

      expect(component.isGenerating).to.equal(false);
    });
  });

  describe('Replay Mode Isolation', () => {
    it('should not capture events during replay', async () => {
      const initialCaptureLength = component._eventCapture.length;

      component._replayMode = true;
      component.handleEvent(
        evt(0, 'message.updated', msgUpdated('msg_1', 'user', 1000)).data,
        'test-session'
      );

      expect(component._eventCapture).to.have.length(initialCaptureLength);
    });

    it('should capture events during normal operation', async () => {
      component._replayMode = false;
      component.currentSession = { id: 'test-session' };

      const initialLength = component._eventCapture.length;

      component.handleEvent(
        evt(0, 'message.updated', msgUpdated('msg_1', 'user', 1000)).data,
        'test-session'
      );

      expect(component._eventCapture.length).to.be.greaterThan(initialLength);
    });
  });
});
