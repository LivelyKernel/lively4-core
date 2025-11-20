import { expect, should } from 'src/external/chai.js';
import { MockEvent, createHTML, testWorld, loadComponent } from 'test/templates/templates-fixture.js';


describe('AI Workspace Transcript Display', function() {
  this.timeout(10000);

  let workspace;
  let replayData;

  before(async () => {
    // Load replay data
    replayData = [{
        "timestamp": 1763547636363,
        "type": "realtime",
        "sessionId": "80f2df1c-6133-4b2c-8133-ec5e355743c4",
        "data": { "type": "input_audio_buffer.speech_started", "event_id": "event_CdZaTqiduSuiNAlNS6aPb", "audio_start_ms": 0, "item_id": "item_CdZaTMhe2YGaZuCgNx1Mb" },
        "source": "realtime"
      },
      {
        "timestamp": 1763547637743,
        "type": "realtime",
        "sessionId": "80f2df1c-6133-4b2c-8133-ec5e355743c4",
        "data": { "type": "input_audio_buffer.speech_stopped", "event_id": "event_CdZaVGlaH3E3c8TZXwBrp", "audio_end_ms": 1664, "item_id": "item_CdZaTMhe2YGaZuCgNx1Mb" },
        "source": "realtime"
      },
      {
        "timestamp": 1763547638398,
        "type": "realtime",
        "sessionId": "80f2df1c-6133-4b2c-8133-ec5e355743c4",
        "data": {
          "type": "conversation.item.input_audio_transcription.delta",
          "event_id": "event_CdZaWX1tQYetl7w62mOpr",
          "item_id": "item_CdZaTMhe2YGaZuCgNx1Mb",
          "content_index": 0,
          "delta": "How are you?",
          "obfuscation": "3rB0"
        },
        "source": "realtime"
      },
      {
        "timestamp": 1763547638399,
        "type": "realtime",
        "sessionId": "80f2df1c-6133-4b2c-8133-ec5e355743c4",
        "data": {
          "type": "conversation.item.input_audio_transcription.completed",
          "event_id": "event_CdZaWGhS0LgiFkMQvaA1I",
          "item_id": "item_CdZaTMhe2YGaZuCgNx1Mb",
          "content_index": 0,
          "transcript": "How are you?",
          "usage": { "type": "duration", "seconds": 2 }
        },
        "source": "realtime"
      }
    ];
  });

  beforeEach(async () => {
    workspace = await loadComponent("lively-ai-workspace")
    await workspace.initialize();

  });
  
  afterEach(() => {
    testWorld().innerHTML = "";

  });


  it('should have realtime component embedded', () => {
    expect(workspace.realtimeComponent).to.exist;
    expect(workspace.realtimeComponent.tagName.toLowerCase()).to.equal('openai-realtime-chat');
  });

  it('should have shared messages pane', () => {
    expect(workspace.sharedMessagesPane).to.exist;
    expect(workspace.sharedMessagesPane.id).to.equal('sharedMessagesPane');
  });

  it('should have ContextJS hooks active', () => {
    expect(workspace.LivelyAIWorkspaceLayer).to.exist;
    expect(workspace.LivelyAIWorkspaceLayer.isGlobal()).to.be.true;
  });

  it('should have messagesUI disabled on realtime component', () => {
    expect(workspace.realtimeComponent.messagesUI).to.be.false;
  });

  describe('Live Message Creation', () => {

    it('should create live user message element on speech_started', async () => {
      const rt = workspace.realtimeComponent;

      // Simulate speech_started event
      await rt.handleRealtimeMessage({
        type: "input_audio_buffer.speech_started",
        audio_start_ms: 0,
        item_id: "test_item_1"
      });

      // Check that currentLiveUserMessageElement was created
      expect(rt.currentLiveUserMessageElement).to.exist;
      expect(rt.currentLiveUserMessageElement.tagName.toLowerCase()).to.equal('lively-chat-message');

      // Check that workspace's live shared message was created
      expect(workspace.currentLiveSharedMessageElement).to.exist;
      expect(workspace.currentLiveSharedMessageRole).to.equal('user');

      // Check that it's in the shared pane
      const messagesInPane = workspace.sharedMessagesPane.querySelectorAll('lively-chat-message');
      expect(messagesInPane.length).to.be.greaterThan(0);
    });

    it('should update live user message with transcript delta', async () => {
      const rt = workspace.realtimeComponent;

      // First create the live message
      await rt.handleRealtimeMessage({
        type: "input_audio_buffer.speech_started",
        audio_start_ms: 0,
        item_id: "test_item_2"
      });

      const liveElement = workspace.currentLiveSharedMessageElement;
      expect(liveElement).to.exist;

      // Now send transcript delta
      await rt.handleRealtimeMessage({
        type: "conversation.item.input_audio_transcription.delta",
        item_id: "test_item_2",
        content_index: 0,
        delta: "How are you?"
      });

      // Wait for update to propagate
      await lively.sleep(0)
      let content = liveElement.shadowRoot.querySelector('.content');
      expect(content).to.not.be.null();
      expect(content.textContent).to.include('How are you?');
      expect(content.textContent).to.not.include('_Listening..._');
    });

    it('should finalize message on transcription completed', async () => {
      const rt = workspace.realtimeComponent;

      // Create live message
      await rt.handleRealtimeMessage({
        type: "input_audio_buffer.speech_started",
        audio_start_ms: 0,
        item_id: "test_item_3"
      });

      // Send delta
      await rt.handleRealtimeMessage({
        type: "conversation.item.input_audio_transcription.delta",
        item_id: "test_item_3",
        content_index: 0,
        delta: "Test transcript"
      });

      // Send completed
      await rt.handleRealtimeMessage({
        type: "conversation.item.input_audio_transcription.completed",
        item_id: "test_item_3",
        content_index: 0,
        transcript: "Test transcript"
      });
      
      await lively.sleep(0)

      // Check that message is still in shared pane
      const messagesInPane = workspace.sharedMessagesPane.querySelectorAll('lively-chat-message');
      expect(messagesInPane.length).to.be.greaterThan(0);

      // Check that the last message has the correct content
      const lastMessage = messagesInPane[messagesInPane.length - 1];
      
      const content = lastMessage.shadowRoot.querySelector('.content');
      expect(content.textContent).to.include('Test transcript');
    });

    it('should NOT clear currentLiveSharedMessageElement on saveMessageToDb', async () => {
      const rt = workspace.realtimeComponent;

      // Create live message
      await rt.handleRealtimeMessage({
        type: "input_audio_buffer.speech_started",
        audio_start_ms: 0,
        item_id: "test_item_4"
      });

      const liveElementBefore = workspace.currentLiveSharedMessageElement;
      expect(liveElementBefore).to.not.be.undefined();

      // Simulate message save
      await rt.saveMessageToDb({
        role: 'user',
        content: 'Test message',
        timestamp: Date.now()
      });

      // Check that element is NOT cleared (this was the bug!)
      const liveElementAfter = workspace.currentLiveSharedMessageElement;
      expect(liveElementAfter).to.exist;
      expect(liveElementAfter).to.equal(liveElementBefore);
    });
  });

  describe('Full Replay Test', () => {
    it('should correctly display user transcript from replay data', async () => {
      const rt = workspace.realtimeComponent;

      // Replay the events
      for (const event of replayData) {
        await rt.handleRealtimeMessage(event.data);
        // Small delay to allow async operations
        await await lively.sleep(10)
      }
      await lively.sleep(0)
      
      // Check that shared pane has the message
      const messagesInPane = workspace.sharedMessagesPane.querySelectorAll('lively-chat-message');
      expect(messagesInPane.length).to.equal(3);
        
      var found = ""
      // Find user message
      let foundUserMessage = false;
      for (const msg of messagesInPane) {
        const content = msg.shadowRoot.querySelector('.content');
        
        found += "Message: " + content.textContent + "\n"
        if (content && content.textContent.includes('How are you?')) {
          foundUserMessage = true;
          
          break;
        }
      }

      expect(foundUserMessage, 'no messages found in: ' + found).to.be.true;
    });
  });
});
