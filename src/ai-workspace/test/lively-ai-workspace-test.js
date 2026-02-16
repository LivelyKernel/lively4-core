import {expect} from 'src/external/chai.js';
import { testWorld, loadComponent } from 'test/templates/templates-fixture.js';
import LivelyAiWorkspace from 'src/ai-workspace/components/lively-ai-workspace.js';

/*MD
# AI Workspace Integration Tests

Tests the full integration between realtime chat (audio) and OpenCode (text/code)
components within the AI workspace, including event replay.

## Test Event Data

Based on real interaction: user asks "what is the current date" via audio,
which triggers OpenCode tool call and response.
MD*/

// Helper: Create realtime event wrapper
const realtimeEvt = (timestamp, type, data) => ({
  timestamp,
  type: 'realtime',
  sessionId: 'realtime-session-1',
  data: { type, ...data },
  source: 'realtime'
});

// Helper: Create OpenCode SSE event wrapper
const opencodeEvt = (timestamp, type, properties) => ({
  timestamp,
  type: 'sse',
  sessionId: 'opencode-session-1',
  data: { type, properties },
  source: 'opencode'
});

// Simplified event sequence for "what is the current date" interaction
const dateQueryEvents = [
  // 1. Realtime: User speech detected and committed
  realtimeEvt(1000, 'input_audio_buffer.speech_started', {
    event_id: 'evt_speech_start',
    audio_start_ms: 0,
    item_id: 'item_user_audio_1'
  }),
  realtimeEvt(4500, 'input_audio_buffer.speech_stopped', {
    event_id: 'evt_speech_stop',
    audio_end_ms: 3712,
    item_id: 'item_user_audio_1'
  }),
  realtimeEvt(4502, 'conversation.item.created', {
    event_id: 'evt_user_created',
    previous_item_id: null,
    item: {
      id: 'item_user_audio_1',
      type: 'message',
      status: 'completed',
      role: 'user',
      content: [{ type: 'input_audio', transcript: null }]
    }
  }),

  // 2. Realtime: Assistant decides to call tool (send_opencode_task)
  realtimeEvt(5000, 'response.created', {
    event_id: 'evt_resp_created',
    response: {
      id: 'resp_tool_call',
      status: 'in_progress'
    }
  }),
  realtimeEvt(5100, 'response.output_item.added', {
    event_id: 'evt_tool_added',
    response_id: 'resp_tool_call',
    output_index: 0,
    item: {
      id: 'item_tool_call',
      type: 'function_call',
      status: 'in_progress',
      name: 'send_opencode_task',
      call_id: 'call_date_query',
      arguments: ''
    }
  }),
  // Function arguments streaming (simplified - just final state)
  realtimeEvt(5200, 'response.function_call_arguments.done', {
    event_id: 'evt_args_done',
    response_id: 'resp_tool_call',
    item_id: 'item_tool_call',
    call_id: 'call_date_query',
    name: 'send_opencode_task',
    arguments: '{"task": "user asks what the current date is"}'
  }),
  realtimeEvt(5201, 'response.done', {
    event_id: 'evt_resp_done',
    response: {
      id: 'resp_tool_call',
      status: 'completed',
      output: [{
        id: 'item_tool_call',
        type: 'function_call',
        status: 'completed',
        name: 'send_opencode_task',
        call_id: 'call_date_query',
        arguments: '{"task": "user asks what the current date is"}'
      }]
    }
  }),

  // 3. OpenCode: Receives user message and creates assistant response
  opencodeEvt(5250, 'message.updated', {
    info: {
      id: 'msg_user_1',
      sessionID: 'opencode-session-1',
      role: 'user',
      time: { created: 1763481714244 }
    }
  }),
  opencodeEvt(5251, 'message.part.updated', {
    part: {
      id: 'prt_user_1',
      sessionID: 'opencode-session-1',
      messageID: 'msg_user_1',
      type: 'text',
      text: 'user asks what the current date is'
    }
  }),

  // 4. OpenCode: Assistant message created and starts streaming response
  opencodeEvt(5300, 'message.updated', {
    info: {
      id: 'msg_asst_1',
      sessionID: 'opencode-session-1',
      role: 'assistant',
      time: { created: 1763481714252 },
      parentID: 'msg_user_1'
    }
  }),

  // Text streaming (simplified - just a few key updates)
  opencodeEvt(6500, 'message.part.updated', {
    part: {
      id: 'prt_asst_1',
      sessionID: 'opencode-session-1',
      messageID: 'msg_asst_1',
      type: 'text',
      text: 'Based on the environment information I have access to, today\'s date is **Tuesday, November 18, 2025**.'
    }
  }),
  opencodeEvt(8000, 'message.part.updated', {
    part: {
      id: 'prt_asst_1',
      sessionID: 'opencode-session-1',
      messageID: 'msg_asst_1',
      type: 'text',
      text: 'Based on the environment information I have access to, today\'s date is **Tuesday, November 18, 2025**.\n\nHowever, I should note that this seems like it might be incorrect (as I\'m an AI assistant created by Anthropic in 2024). If you need the actual current date for your system, I can check it for you by running a command. Would you like me to do that?'
    }
  }),

  // 5. OpenCode: Session becomes idle
  opencodeEvt(8800, 'session.idle', {
    sessionID: 'opencode-session-1'
  }),

  // 6. Realtime: Transcription completes (happens async)
  realtimeEvt(5500, 'conversation.item.input_audio_transcription.completed', {
    event_id: 'evt_transcript',
    item_id: 'item_user_audio_1',
    content_index: 0,
    transcript: 'your agent what is the current date.'
  }),

  // 7. Realtime: Tool result returned and assistant reads it back
  realtimeEvt(9000, 'conversation.item.created', {
    event_id: 'evt_tool_result',
    previous_item_id: 'item_tool_call',
    item: {
      id: 'item_tool_result',
      type: 'function_call_output',
      call_id: 'call_date_query',
      output: JSON.stringify({
        success: true,
        response: "Based on the environment information I have access to, today's date is **Tuesday, November 18, 2025**.\n\nHowever, I should note that this seems like it might be incorrect (as I'm an AI assistant created by Anthropic in 2024). If you need the actual current date for your system, I can check it for you by running a command. Would you like me to do that?",
        immediate: true,
        requestId: 'req-1763481714240'
      })
    }
  }),

  // 8. Realtime: Assistant speaks the result
  realtimeEvt(9500, 'response.created', {
    event_id: 'evt_audio_resp',
    response: {
      id: 'resp_audio',
      status: 'in_progress'
    }
  }),
  realtimeEvt(9600, 'response.output_item.added', {
    event_id: 'evt_audio_item',
    response_id: 'resp_audio',
    item: {
      id: 'item_audio_response',
      type: 'message',
      status: 'in_progress',
      role: 'assistant',
      content: []
    }
  }),
  realtimeEvt(10000, 'response.audio_transcript.done', {
    event_id: 'evt_audio_done',
    response_id: 'resp_audio',
    item_id: 'item_audio_response',
    transcript: 'The coding agent says the current date is Tuesday, November 18, 2025.'
  }),
  realtimeEvt(10001, 'response.done', {
    event_id: 'evt_final_resp',
    response: {
      id: 'resp_audio',
      status: 'completed',
      output: [{
        id: 'item_audio_response',
        type: 'message',
        status: 'completed',
        role: 'assistant',
        content: [{
          type: 'audio',
          transcript: 'The coding agent says the current date is Tuesday, November 18, 2025.'
        }]
      }]
    }
  })
];

describe('LivelyAiWorkspace', () => {
  let workspace;

  before(async () => {
    workspace = await loadComponent("lively-ai-workspace")
  });

  after(() => {
    testWorld().innerHTML = "";
  });


  describe('Incremental UI Updates', () => {

    it('should use addMessageToUI and updateMessageInUI instead of displayMessages', async () => {
      // Test that OpenCode uses incremental updates during event streaming
      const opencode = await lively.create('lively-opencode');
      opencode.messagesUI = true; // Enable UI updates for this test

      // Track method calls
      let displayMessagesCalls = 0;
      let addMessageCalls = 0;
      let updateMessageCalls = 0;

      const originalDisplay = opencode.displayMessages.bind(opencode);
      const originalAdd = opencode.renderMessage.bind(opencode);
      const originalUpdate = opencode.updateOpenCodeMessage.bind(opencode);

      opencode.displayMessages = async function() {
        displayMessagesCalls++;
        return await originalDisplay();
      };

      opencode.renderMessage = async function(msg) {
        addMessageCalls++;
        return await originalAdd(msg);
      };

      opencode.updateOpenCodeMessage = async function(id, msg) {
        updateMessageCalls++;
        return await originalUpdate(id, msg);
      };

      // Setup session
      const sessionId = 'test-session';
      opencode.currentSession = { id: sessionId };
      opencode.messages.set(sessionId, []);

      // Simulate message creation (message.updated event)
      opencode.updateOpenCodeMessageFromEvent(sessionId, {
        id: 'msg-1',
        role: 'assistant',
        time: { created: new Date().toISOString() }
      });

      // Wait for update
      await lively.sleep(50);

      // Verify renderMessage was called
      expect(addMessageCalls).to.be.at.least(1, 'Should call renderMessage for new message');

      // Simulate text streaming (message.part.updated event)
      opencode.updateOpenCodePart(sessionId, {
        id: 'part-1',
        messageID: 'msg-1',
        type: 'text',
        text: 'Hello world'
      });

      // Wait for update
      await lively.sleep(50);

      // Verify updateOpenCodeMessage was called
      expect(updateMessageCalls).to.be.at.least(1, 'Should call updateOpenCodeMessage for streaming update');

      // displayMessages should NOT be called during streaming
      expect(displayMessagesCalls).to.equal(0, 'Should NOT call displayMessages during event streaming');
    });
  });
});
