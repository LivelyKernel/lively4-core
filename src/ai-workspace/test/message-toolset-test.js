import {expect} from 'src/external/chai.js';
import { MessageToolset } from 'src/ai-workspace/components/realtime-chat-tools/message-toolset.js';

describe('MessageToolset', () => {

  let workspace, toolset;

  beforeEach(async () => {
    // Create a mock workspace with conversation history
    workspace = {
      opencodeComponent: {
        getMessages: () => [
          {
            eventSource: 'opencode',
            info: { id: 'msg_opencode_001', role: 'user', time: '2024-01-01T10:00:00Z' },
            parts: [{ type: 'text', text: 'Please fix the bug in login.js' }],
            timestamp: '2024-01-01T10:00:00Z'
          },
          {
            eventSource: 'opencode',
            info: { id: 'msg_opencode_002', role: 'assistant', time: '2024-01-01T10:01:00Z' },
            parts: [
              { type: 'text', text: 'I will fix the bug' },
              { type: 'thinking', text: 'First I need to analyze the login.js file' },
              { type: 'tool', name: 'mcp_edit', input: { filePath: 'login.js' }, state: { status: 'completed', output: 'File updated' } }
            ],
            timestamp: '2024-01-01T10:01:00Z'
          }
        ]
      },
      realtimeComponent: {
        conversation: [
          {
            eventSource: 'realtime',
            item_id: 'msg_realtime_001',
            role: 'user',
            content: 'What is the status?',
            timestamp: '2024-01-01T10:02:00Z'
          },
          {
            eventSource: 'realtime',
            item_id: 'msg_realtime_002',
            role: 'assistant',
            content: 'The bug has been fixed',
            timestamp: '2024-01-01T10:03:00Z'
          }
        ]
      },
      getConversationHistory: async function() {
        let allMessages = [];
        if (this.realtimeComponent && this.realtimeComponent.conversation) {
          const realtimeMessages = this.realtimeComponent.conversation.map(msg => ({
            ...msg,
            eventSource: 'realtime'
          }));
          allMessages.push(...realtimeMessages);
        }
        if (this.opencodeComponent) {
          const opencodeMessages = this.opencodeComponent.getMessages().map(msg => ({
            ...msg,
            eventSource: 'opencode'
          }));
          allMessages.push(...opencodeMessages);
        }
        allMessages.sort((a, b) => {
          const timeA = a.timestamp || a.localTimestamp || a.info?.time || 0;
          const timeB = b.timestamp || b.localTimestamp || b.info?.time || 0;
          return new Date(timeA) - new Date(timeB);
        });
        return allMessages;
      }
    };

    toolset = new MessageToolset(workspace);
  });

  describe('construct', () => {
    it('should require workspace reference', () => {
      expect(() => new MessageToolset()).to.throw('MessageToolset requires a workspace reference');
    });

    it('should initialize with workspace', () => {
      expect(toolset.workspace).to.equal(workspace);
    });

    it('should define get_recent_messages tool', () => {
      expect(toolset.tools.get_recent_messages).to.exist;
      expect(toolset.tools.get_recent_messages.definition).to.exist;
      expect(typeof toolset.tools.get_recent_messages.execute).to.equal('function');
    });

    it('should define search_messages tool', () => {
      expect(toolset.tools.search_messages).to.exist;
      expect(toolset.tools.search_messages.definition).to.exist;
      expect(typeof toolset.tools.search_messages.execute).to.equal('function');
    });

    it('should define get_message_by_id tool', () => {
      expect(toolset.tools.get_message_by_id).to.exist;
      expect(toolset.tools.get_message_by_id.definition).to.exist;
      expect(typeof toolset.tools.get_message_by_id.execute).to.equal('function');
    });
  });

  describe('getDefinitions', () => {
    it('should return array of tool definitions', () => {
      const definitions = toolset.getDefinitions();
      expect(definitions).to.be.an('array');
      expect(definitions.length).to.equal(3);
      expect(definitions[0].name).to.equal('get_recent_messages');
      expect(definitions[1].name).to.equal('search_messages');
      expect(definitions[2].name).to.equal('get_message_by_id');
    });
  });

  describe('getMessageSource', () => {
    it('should identify user messages from opencode', () => {
      const msg = { eventSource: 'opencode', info: { role: 'user' } };
      expect(toolset.getMessageSource(msg)).to.equal('user');
    });

    it('should identify scribe messages from opencode', () => {
      const msg = { eventSource: 'opencode', info: { role: 'assistant' } };
      expect(toolset.getMessageSource(msg)).to.equal('scribe');
    });

    it('should identify user messages from realtime', () => {
      const msg = { eventSource: 'realtime', role: 'user' };
      expect(toolset.getMessageSource(msg)).to.equal('user');
    });

    it('should identify vox messages from realtime', () => {
      const msg = { eventSource: 'realtime', role: 'assistant' };
      expect(toolset.getMessageSource(msg)).to.equal('vox');
    });

    it('should handle messages with item_id as realtime', () => {
      const msg = { item_id: 'msg_123', role: 'user' };
      expect(toolset.getMessageSource(msg)).to.equal('user');
    });
  });

  describe('getMessageContent', () => {
    it('should extract text from opencode parts format', () => {
      const msg = {
        parts: [
          { type: 'text', text: 'First part' },
          { type: 'text', text: 'Second part' }
        ]
      };
      expect(toolset.getMessageContent(msg)).to.equal('First part\nSecond part');
    });

    it('should extract text from realtime string format', () => {
      const msg = { content: 'Hello world' };
      expect(toolset.getMessageContent(msg)).to.equal('Hello world');
    });

    it('should extract text from anthropic array format', () => {
      const msg = {
        content: [
          { type: 'text', text: 'First block' },
          { type: 'text', text: 'Second block' }
        ]
      };
      expect(toolset.getMessageContent(msg)).to.equal('First block\nSecond block');
    });

    it('should handle empty parts array', () => {
      const msg = { parts: [] };
      expect(toolset.getMessageContent(msg)).to.equal('');
    });
  });

  describe('getRecentMessages', () => {
    it('should retrieve default count of messages', async () => {
      const result = await toolset.getRecentMessages({});
      expect(result.success).to.be.true;
      expect(result.messages).to.be.an('array');
      expect(result.messages.length).to.equal(4); // All test messages
    });

    it('should limit message count', async () => {
      const result = await toolset.getRecentMessages({ count: 2 });
      expect(result.success).to.be.true;
      expect(result.messages.length).to.equal(2);
    });

    it('should enforce max count of 50', async () => {
      const result = await toolset.getRecentMessages({ count: 100 });
      expect(result.success).to.be.true;
      expect(result.messages.length).to.be.at.most(50);
    });

    it('should filter by user agent', async () => {
      const result = await toolset.getRecentMessages({ filter_agent: 'user' });
      expect(result.success).to.be.true;
      expect(result.messages.every(m => m.source === 'user')).to.be.true;
    });

    it('should filter by scribe agent', async () => {
      const result = await toolset.getRecentMessages({ filter_agent: 'scribe' });
      expect(result.success).to.be.true;
      expect(result.messages.every(m => m.source === 'scribe')).to.be.true;
    });

    it('should filter by vox agent', async () => {
      const result = await toolset.getRecentMessages({ filter_agent: 'vox' });
      expect(result.success).to.be.true;
      expect(result.messages.every(m => m.source === 'vox')).to.be.true;
    });

    it('should include tool calls when requested', async () => {
      const result = await toolset.getRecentMessages({ 
        filter_agent: 'scribe', 
        include_tool_calls: true 
      });
      expect(result.success).to.be.true;
      const messageWithTool = result.messages.find(m => m.tool_calls);
      expect(messageWithTool).to.exist;
      expect(messageWithTool.tool_calls[0].name).to.equal('mcp_edit');
    });

    it('should return message count and total', async () => {
      const result = await toolset.getRecentMessages({});
      expect(result.message_count).to.be.a('number');
      expect(result.total_messages).to.be.a('number');
      expect(result.message_count).to.be.at.most(result.total_messages);
    });
  });

  describe('searchMessages', () => {
    it('should find messages containing query text', async () => {
      const result = await toolset.searchMessages({ query: 'bug' });
      expect(result.success).to.be.true;
      expect(result.messages).to.be.an('array');
      expect(result.messages.length).to.be.greaterThan(0);
      expect(result.messages[0].content.toLowerCase()).to.include('bug');
    });

    it('should be case insensitive', async () => {
      const result = await toolset.searchMessages({ query: 'BUG' });
      expect(result.success).to.be.true;
      expect(result.messages.length).to.be.greaterThan(0);
    });

    it('should return empty array when no matches', async () => {
      const result = await toolset.searchMessages({ query: 'nonexistent' });
      expect(result.success).to.be.true;
      expect(result.messages).to.be.an('array');
      expect(result.messages.length).to.equal(0);
    });

    it('should limit results to max_results', async () => {
      const result = await toolset.searchMessages({ query: 'the', max_results: 1 });
      expect(result.success).to.be.true;
      expect(result.messages.length).to.be.at.most(1);
    });

    it('should enforce max of 20 results', async () => {
      const result = await toolset.searchMessages({ query: 'the', max_results: 100 });
      expect(result.success).to.be.true;
      expect(result.messages.length).to.be.at.most(20);
    });

    it('should include position in conversation', async () => {
      const result = await toolset.searchMessages({ query: 'bug' });
      expect(result.success).to.be.true;
      if (result.messages.length > 0) {
        expect(result.messages[0].position).to.be.a('string');
        expect(result.messages[0].position).to.match(/\d+ of \d+/);
      }
    });

    it('should return query and matches_found', async () => {
      const result = await toolset.searchMessages({ query: 'bug' });
      expect(result.query).to.equal('bug');
      expect(result.matches_found).to.be.a('number');
      expect(result.matches_found).to.equal(result.messages.length);
    });
  });

  describe('getMessageById', () => {
    it('should retrieve opencode message by info.id', async () => {
      const result = await toolset.getMessageById({ message_id: 'msg_opencode_001' });
      expect(result.success).to.be.true;
      expect(result.message_id).to.equal('msg_opencode_001');
      expect(result.source).to.equal('user');
      expect(result.full_message).to.exist;
      expect(result.full_message.info.id).to.equal('msg_opencode_001');
    });

    it('should retrieve realtime message by item_id', async () => {
      const result = await toolset.getMessageById({ message_id: 'msg_realtime_001' });
      expect(result.success).to.be.true;
      expect(result.message_id).to.equal('msg_realtime_001');
      expect(result.source).to.equal('user');
      expect(result.full_message).to.exist;
      expect(result.full_message.item_id).to.equal('msg_realtime_001');
    });

    it('should return error for non-existent message ID', async () => {
      const result = await toolset.getMessageById({ message_id: 'nonexistent_id' });
      expect(result.success).to.be.false;
      expect(result.error).to.include('not found');
    });

    it('should include parsed content', async () => {
      const result = await toolset.getMessageById({ message_id: 'msg_opencode_001' });
      expect(result.success).to.be.true;
      expect(result.parsed).to.exist;
      expect(result.parsed.content).to.equal('Please fix the bug in login.js');
      expect(result.parsed.role).to.equal('user');
      expect(result.parsed.timestamp).to.exist;
    });

    it('should extract internal reasoning (thinking parts)', async () => {
      const result = await toolset.getMessageById({ message_id: 'msg_opencode_002' });
      expect(result.success).to.be.true;
      expect(result.parsed.internal_reasoning).to.exist;
      expect(result.parsed.internal_reasoning).to.be.an('array');
      expect(result.parsed.internal_reasoning[0]).to.equal('First I need to analyze the login.js file');
    });

    it('should extract tool calls with full details', async () => {
      const result = await toolset.getMessageById({ message_id: 'msg_opencode_002' });
      expect(result.success).to.be.true;
      expect(result.parsed.tool_calls).to.exist;
      expect(result.parsed.tool_calls).to.be.an('array');
      expect(result.parsed.tool_calls.length).to.equal(1);
      expect(result.parsed.tool_calls[0].name).to.equal('mcp_edit');
      expect(result.parsed.tool_calls[0].input).to.exist;
      expect(result.parsed.tool_calls[0].output).to.equal('File updated');
      expect(result.parsed.tool_calls[0].status).to.equal('completed');
      expect(result.parsed.tool_calls[0].full_details).to.exist;
    });

    it('should list all part types', async () => {
      const result = await toolset.getMessageById({ message_id: 'msg_opencode_002' });
      expect(result.success).to.be.true;
      expect(result.parsed.part_types).to.exist;
      expect(result.parsed.part_types).to.deep.equal(['text', 'thinking', 'tool']);
    });

    it('should include metadata', async () => {
      const result = await toolset.getMessageById({ message_id: 'msg_opencode_002' });
      expect(result.success).to.be.true;
      expect(result.metadata).to.exist;
      expect(result.metadata.event_source).to.equal('opencode');
      expect(result.metadata.has_parts).to.be.true;
      expect(result.metadata.parts_count).to.equal(3);
      expect(result.metadata.has_tool_calls).to.be.true;
      expect(result.metadata.has_reasoning).to.be.true;
    });

    it('should handle realtime messages without parts', async () => {
      const result = await toolset.getMessageById({ message_id: 'msg_realtime_002' });
      expect(result.success).to.be.true;
      expect(result.metadata.has_parts).to.be.false;
      expect(result.metadata.parts_count).to.equal(0);
      expect(result.parsed.content).to.equal('The bug has been fixed');
    });
  });

  describe('execute', () => {
    it('should execute get_recent_messages', async () => {
      const result = await toolset.execute('get_recent_messages', { count: 5 });
      expect(result.success).to.be.true;
      expect(result.messages).to.be.an('array');
    });

    it('should execute search_messages', async () => {
      const result = await toolset.execute('search_messages', { query: 'bug' });
      expect(result.success).to.be.true;
      expect(result.messages).to.be.an('array');
    });

    it('should execute get_message_by_id', async () => {
      const result = await toolset.execute('get_message_by_id', { message_id: 'msg_opencode_001' });
      expect(result.success).to.be.true;
      expect(result.full_message).to.exist;
    });

    it('should throw error for unknown tool', async () => {
      try {
        await toolset.execute('unknown_tool', {});
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Unknown tool');
      }
    });
  });

  describe('formatMessages', () => {
    it('should truncate long content', () => {
      const longMsg = {
        eventSource: 'realtime',
        role: 'user',
        content: 'a'.repeat(600),
        timestamp: '2024-01-01T10:00:00Z'
      };
      const formatted = toolset.formatMessages([longMsg], false);
      expect(formatted[0].content.length).to.equal(503); // 500 + '...'
      expect(formatted[0].content_length).to.equal(600);
    });

    it('should preserve short content', () => {
      const shortMsg = {
        eventSource: 'realtime',
        role: 'user',
        content: 'Short message',
        timestamp: '2024-01-01T10:00:00Z'
      };
      const formatted = toolset.formatMessages([shortMsg], false);
      expect(formatted[0].content).to.equal('Short message');
      expect(formatted[0].content_length).to.equal(13);
    });

    it('should include timestamp and source', () => {
      const msg = {
        eventSource: 'realtime',
        role: 'user',
        content: 'Test',
        timestamp: '2024-01-01T10:00:00Z'
      };
      const formatted = toolset.formatMessages([msg], false);
      expect(formatted[0].source).to.equal('user');
      expect(formatted[0].timestamp).to.be.a('string');
    });
  });

  describe('integration with workspace', () => {
    it('should retrieve conversation history from workspace', async () => {
      const result = await toolset.getRecentMessages({});
      expect(result.success).to.be.true;
      expect(result.total_messages).to.equal(4); // 2 from opencode + 2 from realtime
    });

    it('should handle messages sorted by time', async () => {
      const result = await toolset.getRecentMessages({});
      expect(result.success).to.be.true;
      // Messages should be in chronological order
      for (let i = 1; i < result.messages.length; i++) {
        const prevTime = new Date(result.messages[i - 1].timestamp);
        const currTime = new Date(result.messages[i].timestamp);
        expect(currTime >= prevTime).to.be.true;
      }
    });
  });
});
