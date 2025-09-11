import { expect } from 'src/external/chai.js';
import {
  ClaudeMessage,
  ClaudeUserMessage,
  ClaudeAgentMessage,
  ClaudeToolCall,
  ClaudeToolResponse,
  ClaudeConversation
} from 'src/client/claude-sessions.js';

// Test data based on provided examples
const testMessages = {
  userMessage: {
    "parentUuid": null,
    "isSidechain": false,
    "userType": "external",
    "cwd": "/home/jens/lively4/claude",
    "sessionId": "b5fa1595-804c-4d97-b0ee-d2580aae09d5",
    "version": "1.0.77",
    "gitBranch": "",
    "type": "user",
    "message": {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "how well does claude code work with screen window management?"
        }
      ]
    },
    "uuid": "41bbc158-010e-4d3e-bcb6-317848a0c328",
    "timestamp": "2025-08-13T08:53:30.440Z"
  },

  agentTextMessage: {
    "parentUuid": "41bbc158-010e-4d3e-bcb6-317848a0c328",
    "isSidechain": false,
    "userType": "external",
    "cwd": "/home/jens/lively4/claude",
    "sessionId": "b5fa1595-804c-4d97-b0ee-d2580aae09d5",
    "version": "1.0.77",
    "gitBranch": "",
    "type": "assistant",
    "timestamp": "2025-08-13T08:53:30.440Z",
    "message": {
      "id": "msg_01AP44B9eDCL3963XS9FDjEJ",
      "type": "message",
      "role": "assistant",
      "model": "claude-sonnet-4-20250514",
      "content": [
        {
          "type": "text",
          "text": "I'll check the Claude Code documentation to see what information is available about screen window management."
        }
      ],
      "stop_reason": null,
      "stop_sequence": null,
      "usage": {
        "input_tokens": 3,
        "cache_creation_input_tokens": 455,
        "cache_read_input_tokens": 14246,
        "output_tokens": 3,
        "service_tier": "standard"
      }
    },
    "requestId": "req_011CS1fLoSy744PPQTNrWByL",
    "uuid": "9d2c294a-8271-4cb1-83cd-5eea2ef62b56"
  },

  agentToolCallMessage: {
    "parentUuid": "9d2c294a-8271-4cb1-83cd-5eea2ef62b56",
    "isSidechain": false,
    "userType": "external",
    "cwd": "/home/jens/lively4/claude",
    "sessionId": "b5fa1595-804c-4d97-b0ee-d2580aae09d5",
    "version": "1.0.77",
    "gitBranch": "",
    "type": "assistant",
    "timestamp": "2025-08-13T08:53:30.440Z",
    "message": {
      "id": "msg_01AP44B9eDCL3963XS9FDjEJ",
      "type": "message",
      "role": "assistant",
      "model": "claude-sonnet-4-20250514",
      "content": [
        {
          "type": "tool_use",
          "id": "toolu_01DarDZn8V22jchFA4Gz3WDx",
          "name": "WebFetch",
          "input": {
            "url": "https://docs.anthropic.com/en/docs/claude-code/overview",
            "prompt": "What does the documentation say about screen window management, terminal multiplexers, or working with multiple windows/panes?"
          }
        }
      ],
      "stop_reason": null,
      "stop_sequence": null,
      "usage": {
        "input_tokens": 3,
        "cache_creation_input_tokens": 455,
        "cache_read_input_tokens": 14246,
        "output_tokens": 129,
        "service_tier": "standard"
      }
    },
    "requestId": "req_011CS1fLoSy744PPQTNrWByL",
    "uuid": "a961b74f-6df1-43a1-b2b9-5d8d2c6de1c8"
  },

  toolResponseMessage: {
    "parentUuid": "a961b74f-6df1-43a1-b2b9-5d8d2c6de1c8",
    "isSidechain": false,
    "userType": "external",
    "cwd": "/home/jens/lively4/claude",
    "sessionId": "b5fa1595-804c-4d97-b0ee-d2580aae09d5",
    "version": "1.0.77",
    "gitBranch": "",
    "type": "user",
    "message": {
      "role": "user",
      "content": [
        {
          "tool_use_id": "toolu_01DarDZn8V22jchFA4Gz3WDx",
          "type": "tool_result",
          "content": "After carefully reviewing the provided documentation, I did not find any specific content about screen window management, terminal multiplexers, or working with multiple windows/panes. The document appears to be an overview of Claude Code, Anthropic's agentic coding tool, but does not discuss terminal window management techniques."
        }
      ]
    },
    "uuid": "1f8e1bf9-ca6c-4e1f-b0a1-605e48f461ac",
    "timestamp": "2025-08-13T08:53:30.440Z",
    "toolUseResult": {
      "bytes": 2091188,
      "code": 200,
      "codeText": "OK",
      "result": "After carefully reviewing the provided documentation, I did not find any specific content about screen window management, terminal multiplexers, or working with multiple windows/panes. The document appears to be an overview of Claude Code, Anthropic's agentic coding tool, but does not discuss terminal window management techniques.",
      "durationMs": 5483,
      "url": "https://docs.anthropic.com/en/docs/claude-code/overview"
    }
  }
};

describe('Claude Sessions Message Classes', () => {

  describe('ClaudeMessage (Base Class)', () => {
    let message;

    beforeEach(() => {
      message = new ClaudeMessage(testMessages.userMessage);
    });

    it('should initialize basic properties correctly', () => {
      expect(message.uuid).to.equal('41bbc158-010e-4d3e-bcb6-317848a0c328');
      expect(message.sessionId).to.equal('b5fa1595-804c-4d97-b0ee-d2580aae09d5');
      expect(message.type).to.equal('user');
      expect(message.parentUuid).to.be.null;
      expect(message.timestamp).to.be.instanceof(Date);
    });

    it('should provide role property', () => {
      expect(message.role).to.equal('user');
    });

    it('should provide content property', () => {
      expect(message.content).to.be.an('array');
      expect(message.content).to.have.length(1);
    });

    it('should detect sidechain correctly', () => {
      expect(message.isSidechain).to.be.false;
    });

    it('should extract text content from array format', () => {
      const textContent = message.getTextContent();
      expect(textContent).to.equal('how well does claude code work with screen window management?');
    });

    it('should handle string content', () => {
      const rawWithStringContent = {
        ...testMessages.userMessage,
        message: {
          role: 'user',
          content: 'Simple string content'
        }
      };
      const msgWithString = new ClaudeMessage(rawWithStringContent);
      expect(msgWithString.getTextContent()).to.equal('Simple string content');
    });

    it('should return empty string for no content', () => {
      const rawWithNoContent = {
        ...testMessages.userMessage,
        message: { role: 'user' }
      };
      const msgWithNoContent = new ClaudeMessage(rawWithNoContent);
      expect(msgWithNoContent.getTextContent()).to.equal('');
    });
  });

  describe('ClaudeUserMessage', () => {
    let userMessage;

    beforeEach(() => {
      userMessage = new ClaudeUserMessage(testMessages.userMessage);
    });

    it('should inherit from ClaudeMessage', () => {
      expect(userMessage).to.be.instanceof(ClaudeMessage);
      expect(userMessage).to.be.instanceof(ClaudeUserMessage);
    });

    it('should identify non-tool responses correctly', () => {
      expect(userMessage.isToolResponse).to.be.false;
      expect(userMessage.toolUseResult).to.be.undefined;
    });

    it('should not find tool use ID for regular user message', () => {
      expect(userMessage.getToolUseId()).to.be.null;
    });
  });

  describe('ClaudeAgentMessage', () => {
    let agentMessage;

    beforeEach(() => {
      agentMessage = new ClaudeAgentMessage(testMessages.agentTextMessage);
    });

    it('should inherit from ClaudeMessage', () => {
      expect(agentMessage).to.be.instanceof(ClaudeMessage);
      expect(agentMessage).to.be.instanceof(ClaudeAgentMessage);
    });

    it('should have usage information', () => {
      const usage = agentMessage.getUsage();
      expect(usage).to.exist;
      expect(usage.input_tokens).to.equal(3);
      expect(usage.output_tokens).to.equal(3);
      expect(usage.cache_read_input_tokens).to.equal(14246);
    });

    it('should have request ID', () => {
      expect(agentMessage.requestId).to.equal('req_011CS1fLoSy744PPQTNrWByL');
    });

    it('should not have tool calls for text-only message', () => {
      expect(agentMessage.hasToolCalls).to.be.false;
      expect(agentMessage.getToolCalls()).to.be.empty;
      expect(agentMessage.isOnlyToolCalls).to.be.false;
    });

    describe('with tool calls', () => {
      let toolCallMessage;

      beforeEach(() => {
        toolCallMessage = new ClaudeAgentMessage(testMessages.agentToolCallMessage);
      });

      it('should detect tool calls correctly', () => {
        expect(toolCallMessage.hasToolCalls).to.be.true;
        expect(toolCallMessage.isOnlyToolCalls).to.be.true;
      });

      it('should extract tool calls', () => {
        const toolCalls = toolCallMessage.getToolCalls();
        expect(toolCalls).to.have.length(1);
        expect(toolCalls[0].id).to.equal('toolu_01DarDZn8V22jchFA4Gz3WDx');
        expect(toolCalls[0].name).to.equal('WebFetch');
        expect(toolCalls[0].input.url).to.equal('https://docs.anthropic.com/en/docs/claude-code/overview');
      });
    });
  });

  describe('ClaudeToolCall', () => {
    let toolCall;

    beforeEach(() => {
      const agentMsg = new ClaudeAgentMessage(testMessages.agentToolCallMessage);
      const toolCallData = agentMsg.getToolCalls()[0];
      toolCall = new ClaudeToolCall(testMessages.agentToolCallMessage, toolCallData);
    });

    it('should inherit from ClaudeAgentMessage', () => {
      expect(toolCall).to.be.instanceof(ClaudeAgentMessage);
      expect(toolCall).to.be.instanceof(ClaudeToolCall);
    });

    it('should provide tool-specific properties', () => {
      expect(toolCall.toolName).to.equal('WebFetch');
      expect(toolCall.toolId).to.equal('toolu_01DarDZn8V22jchFA4Gz3WDx');
      expect(toolCall.toolInput).to.deep.equal({
        "url": "https://docs.anthropic.com/en/docs/claude-code/overview",
        "prompt": "What does the documentation say about screen window management, terminal multiplexers, or working with multiple windows/panes?"
      });
    });
  });

  describe('ClaudeToolResponse', () => {
    let toolResponse;

    beforeEach(() => {
      toolResponse = new ClaudeToolResponse(testMessages.toolResponseMessage);
    });

    it('should inherit from ClaudeUserMessage', () => {
      expect(toolResponse).to.be.instanceof(ClaudeUserMessage);
      expect(toolResponse).to.be.instanceof(ClaudeToolResponse);
    });

    it('should identify as tool response', () => {
      expect(toolResponse.isToolResponse).to.be.true;
      expect(toolResponse.toolUseResult).to.exist;
    });

    it('should extract tool use ID', () => {
      expect(toolResponse.toolUseId).to.equal('toolu_01DarDZn8V22jchFA4Gz3WDx');
      expect(toolResponse.getToolUseId()).to.equal('toolu_01DarDZn8V22jchFA4Gz3WDx');
    });

    it('should extract result content', () => {
      const resultContent = toolResponse.getResultContent();
      expect(resultContent).to.include('After carefully reviewing the provided documentation');
    });

    it('should have tool use result data', () => {
      const result = toolResponse.toolUseResult;
      expect(result.code).to.equal(200);
      expect(result.durationMs).to.equal(5483);
      expect(result.url).to.equal('https://docs.anthropic.com/en/docs/claude-code/overview');
    });
  });

  describe('ClaudeConversation', () => {
    let conversation;
    let rawMessages;

    beforeEach(() => {
      rawMessages = [
        testMessages.userMessage,
        testMessages.agentTextMessage,
        testMessages.agentToolCallMessage,
        testMessages.toolResponseMessage
      ];
      conversation = new ClaudeConversation('test-session');
    });

    it('should initialize with session ID', () => {
      expect(conversation.sessionId).to.equal('test-session');
      expect(conversation.messages).to.be.empty;
      expect(conversation.messageMap).to.be.instanceof(Map);
    });

    it('should add messages correctly', () => {
      const userMsg = new ClaudeUserMessage(testMessages.userMessage);
      conversation.addMessage(userMsg);
      
      expect(conversation.messages).to.have.length(1);
      expect(conversation.messageMap.get(userMsg.uuid)).to.equal(userMsg);
    });

    it('should retrieve messages by UUID', () => {
      const userMsg = new ClaudeUserMessage(testMessages.userMessage);
      conversation.addMessage(userMsg);
      
      const retrieved = conversation.getMessage('41bbc158-010e-4d3e-bcb6-317848a0c328');
      expect(retrieved).to.equal(userMsg);
    });

    it('should filter messages by type', () => {
      const userMsg = new ClaudeUserMessage(testMessages.userMessage);
      const agentMsg = new ClaudeAgentMessage(testMessages.agentTextMessage);
      conversation.addMessage(userMsg);
      conversation.addMessage(agentMsg);

      const userMessages = conversation.getMessagesByType('user');
      expect(userMessages).to.have.length(1);
      expect(userMessages[0]).to.equal(userMsg);

      const agentMessages = conversation.getMessagesByType('assistant');
      expect(agentMessages).to.have.length(1);
      expect(agentMessages[0]).to.equal(agentMsg);
    });

    it('should get user and agent messages', () => {
      const userMsg = new ClaudeUserMessage(testMessages.userMessage);
      const agentMsg = new ClaudeAgentMessage(testMessages.agentTextMessage);
      const toolResponse = new ClaudeToolResponse(testMessages.toolResponseMessage);
      
      conversation.addMessage(userMsg);
      conversation.addMessage(agentMsg);
      conversation.addMessage(toolResponse);

      const userMessages = conversation.getUserMessages();
      expect(userMessages).to.have.length(2); // userMsg and toolResponse
      expect(userMessages).to.include(userMsg);
      expect(userMessages).to.include(toolResponse);

      const agentMessages = conversation.getAgentMessages();
      expect(agentMessages).to.have.length(1);
      expect(agentMessages[0]).to.equal(agentMsg);
    });

    it('should build conversation thread', () => {
      // Add messages in order to build parent-child relationships
      const messages = ClaudeConversation.parseMessages(rawMessages);
      messages.forEach(msg => conversation.addMessage(msg));

      // Get thread starting from the tool response (last message)
      const thread = conversation.getThread('1f8e1bf9-ca6c-4e1f-b0a1-605e48f461ac');
      
      expect(thread).to.have.length(4); // All messages in the thread
      expect(thread[0].uuid).to.equal('41bbc158-010e-4d3e-bcb6-317848a0c328'); // Root message
      expect(thread[3].uuid).to.equal('1f8e1bf9-ca6c-4e1f-b0a1-605e48f461ac'); // End message
    });

    describe('Static Methods', () => {
      it('should parse individual messages correctly', () => {
        const userMsg = ClaudeConversation.parseMessage(testMessages.userMessage);
        expect(userMsg).to.be.instanceof(ClaudeUserMessage);
        
        const agentMsg = ClaudeConversation.parseMessage(testMessages.agentTextMessage);
        expect(agentMsg).to.be.instanceof(ClaudeAgentMessage);
        
        const toolResponse = ClaudeConversation.parseMessage(testMessages.toolResponseMessage);
        expect(toolResponse).to.be.instanceof(ClaudeToolResponse);
        expect(toolResponse.isToolResponse).to.be.true;
      });

      it('should parse array of messages', () => {
        const parsed = ClaudeConversation.parseMessages(rawMessages);
        
        expect(parsed).to.have.length(4);
        expect(parsed[0]).to.be.instanceof(ClaudeUserMessage);
        expect(parsed[1]).to.be.instanceof(ClaudeAgentMessage);
        expect(parsed[2]).to.be.instanceof(ClaudeAgentMessage);
        expect(parsed[3]).to.be.instanceof(ClaudeToolResponse);
      });

      it('should create conversation from raw messages', () => {
        const conv = ClaudeConversation.fromRawMessages(rawMessages, 'test-session');
        
        expect(conv.sessionId).to.equal('test-session');
        expect(conv.messages).to.have.length(4);
        expect(conv.messageMap.size).to.equal(4);
        
        // Check that all messages are properly typed
        expect(conv.getUserMessages()).to.have.length(2);
        expect(conv.getAgentMessages()).to.have.length(2);
      });

      it('should handle unknown message types with fallback', () => {
        const unknownMessage = {
          ...testMessages.userMessage,
          type: 'unknown'
        };
        
        const parsed = ClaudeConversation.parseMessage(unknownMessage);
        expect(parsed).to.be.instanceof(ClaudeMessage);
        expect(parsed).not.to.be.instanceof(ClaudeUserMessage);
        expect(parsed).not.to.be.instanceof(ClaudeAgentMessage);
      });
    });
  });

  describe('Session Tracking', () => {
    it('should track which sessions a message appears in', () => {
      const message = new ClaudeUserMessage(testMessages.userMessage);
      
      expect(message.sessionCount).to.equal(1);
      expect(message.getSessionIds()).to.deep.equal(['b5fa1595-804c-4d97-b0ee-d2580aae09d5']);
      expect(message.appearsInSession('b5fa1595-804c-4d97-b0ee-d2580aae09d5')).to.be.true;
      expect(message.appearsInSession('other-session')).to.be.false;
      
      // Add to another session
      message.addToSession('session-2', { 
        timestamp: '2025-08-14T10:00:00.000Z',
        additionalInfo: 'test'
      });
      
      expect(message.sessionCount).to.equal(2);
      expect(message.getSessionIds()).to.include('session-2');
      expect(message.appearsInSession('session-2')).to.be.true;
      
      // Verify session data
      const sessionData = message.getSessionData('session-2');
      expect(sessionData.sessionId).to.equal('session-2');
      expect(sessionData.additionalInfo).to.equal('test');
    });
  });

  describe('Cross-Session Conversation Deduplication', () => {
    let session1Messages, session2Messages;
    
    beforeEach(() => {
      // Session 1: Contains only the first message
      session1Messages = [testMessages.userMessage];
      
      // Session 2: Contains duplicate of first message + new message  
      session2Messages = [
        testMessages.userMessage,  // Duplicate from session 1
        testMessages.agentTextMessage  // New message
      ];
    });
    
    it('should deduplicate messages across sessions', () => {
      const sessionDataArray = [
        { sessionId: 'session-1', rawMessages: session1Messages },
        { sessionId: 'session-2', rawMessages: session2Messages }
      ];
      
      const conversation = ClaudeConversation.fromMultipleSessions(sessionDataArray, 'test-conversation');
      
      // Should have only 2 unique messages (userMessage + agentTextMessage)
      expect(conversation.messages).to.have.length(2);
      
      const userMsg = conversation.getMessage('41bbc158-010e-4d3e-bcb6-317848a0c328');
      const agentMsg = conversation.getMessage('9d2c294a-8271-4cb1-83cd-5eea2ef62b56');
      
      expect(userMsg).to.exist;
      expect(agentMsg).to.exist;
      
      // The user message should appear in both sessions
      expect(userMsg.sessionCount).to.equal(2);
      expect(userMsg.getSessionIds()).to.include('session-1');
      expect(userMsg.getSessionIds()).to.include('session-2');
      expect(userMsg.appearsInSession('session-1')).to.be.true;
      expect(userMsg.appearsInSession('session-2')).to.be.true;
      
      // The agent message should only appear in session-2
      expect(agentMsg.sessionCount).to.equal(1);
      expect(agentMsg.getSessionIds()).to.deep.equal(['session-2']);
      expect(agentMsg.appearsInSession('session-1')).to.be.false;
      expect(agentMsg.appearsInSession('session-2')).to.be.true;
    });
    
    it('should preserve session metadata for duplicated messages', () => {
      const sessionDataArray = [
        { sessionId: 'session-1', rawMessages: session1Messages },
        { sessionId: 'session-2', rawMessages: session2Messages }
      ];
      
      const conversation = ClaudeConversation.fromMultipleSessions(sessionDataArray);
      const userMsg = conversation.getMessage('41bbc158-010e-4d3e-bcb6-317848a0c328');
      
      // Should have session data for both sessions
      const session1Data = userMsg.getSessionData('session-1');
      const session2Data = userMsg.getSessionData('session-2');
      
      expect(session1Data).to.exist;
      expect(session2Data).to.exist;
      expect(session1Data.sessionId).to.equal('session-1');
      expect(session2Data.sessionId).to.equal('session-2');
    });
    
    it('should handle complex conversation spanning multiple sessions', () => {
      // Create a more complex scenario:
      // Session 1: [userMessage, agentTextMessage]
      // Session 2: [userMessage, agentTextMessage, agentToolCallMessage] 
      // Session 3: [agentTextMessage, agentToolCallMessage, toolResponseMessage]
      
      const complexSession1 = [testMessages.userMessage, testMessages.agentTextMessage];
      const complexSession2 = [testMessages.userMessage, testMessages.agentTextMessage, testMessages.agentToolCallMessage];
      const complexSession3 = [testMessages.agentTextMessage, testMessages.agentToolCallMessage, testMessages.toolResponseMessage];
      
      const sessionDataArray = [
        { sessionId: 'complex-1', rawMessages: complexSession1 },
        { sessionId: 'complex-2', rawMessages: complexSession2 },
        { sessionId: 'complex-3', rawMessages: complexSession3 }
      ];
      
      const conversation = ClaudeConversation.fromMultipleSessions(sessionDataArray);
      
      // Should have 4 unique messages total
      expect(conversation.messages).to.have.length(4);
      
      const userMsg = conversation.getMessage('41bbc158-010e-4d3e-bcb6-317848a0c328');
      const agentTextMsg = conversation.getMessage('9d2c294a-8271-4cb1-83cd-5eea2ef62b56');
      const toolCallMsg = conversation.getMessage('a961b74f-6df1-43a1-b2b9-5d8d2c6de1c8');
      const toolResponseMsg = conversation.getMessage('1f8e1bf9-ca6c-4e1f-b0a1-605e48f461ac');
      
      // Verify session distribution
      expect(userMsg.sessionCount).to.equal(2); // complex-1, complex-2
      expect(agentTextMsg.sessionCount).to.equal(3); // complex-1, complex-2, complex-3  
      expect(toolCallMsg.sessionCount).to.equal(2); // complex-2, complex-3
      expect(toolResponseMsg.sessionCount).to.equal(1); // complex-3
      
      expect(userMsg.getSessionIds()).to.deep.equal(['complex-1', 'complex-2']);
      expect(agentTextMsg.getSessionIds()).to.include.members(['complex-1', 'complex-2', 'complex-3']);
      expect(toolCallMsg.getSessionIds()).to.deep.equal(['complex-2', 'complex-3']);
      expect(toolResponseMsg.getSessionIds()).to.deep.equal(['complex-3']);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete conversation flow', () => {
      const rawMessages = [
        testMessages.userMessage,
        testMessages.agentTextMessage,
        testMessages.agentToolCallMessage,
        testMessages.toolResponseMessage
      ];

      const conversation = ClaudeConversation.fromRawMessages(rawMessages, 'integration-test');
      
      // Verify conversation structure
      expect(conversation.messages).to.have.length(4);
      
      // Test message relationships
      const userMsg = conversation.getMessage('41bbc158-010e-4d3e-bcb6-317848a0c328');
      const textResponse = conversation.getMessage('9d2c294a-8271-4cb1-83cd-5eea2ef62b56');
      const toolCall = conversation.getMessage('a961b74f-6df1-43a1-b2b9-5d8d2c6de1c8');
      const toolResponse = conversation.getMessage('1f8e1bf9-ca6c-4e1f-b0a1-605e48f461ac');
      
      expect(userMsg.parentUuid).to.be.null; // Root message
      expect(textResponse.parentUuid).to.equal(userMsg.uuid);
      expect(toolCall.parentUuid).to.equal(textResponse.uuid);
      expect(toolResponse.parentUuid).to.equal(toolCall.uuid);
      
      // Test content extraction
      expect(userMsg.getTextContent()).to.include('screen window management');
      expect(textResponse.getTextContent()).to.include('Claude Code documentation');
      expect(toolCall.hasToolCalls).to.be.true;
      expect(toolResponse.isToolResponse).to.be.true;
      
      // Test usage information
      expect(textResponse.getUsage().output_tokens).to.equal(3);
      expect(toolCall.getUsage().output_tokens).to.equal(129);
    });
  });
});