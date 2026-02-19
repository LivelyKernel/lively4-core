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

  beforeEach(async () => {
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

    // Clear responses container
    if (component.responses) {
      component.responses.innerHTML = '';
    }
  });

  afterEach(async () => {
    if (component) {
      component._replayMode = false;

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

  describe('Full Replay Engine', () => {
    xit('should replay entire conversation with timing', function(done) {
      this.timeout(2000); // Allow time for replay timing

      const events = testEvents.simpleGreeting;

      // Start replay
      component._replayMode = false; // Allow capture for verification
      component.replayEventsFromArray(events);

      // Check after replay should complete (events span 600ms + buffer)
      setTimeout(() => {
        expect(component.conversation.length).to.be.greaterThan(0);
        expect(component.conversation[0].role).to.equal('user');
        done();
      }, 800);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should not save duplicate messages from same item_id', async () => {
      // First completion
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
});
