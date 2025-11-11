import {expect} from 'src/external/chai.js';
import {
  BasicToolset,
  WorkspaceToolset,
  CompositeToolset,
  parseLively4EvaluateOutput,
  getResponseContent
} from 'src/components/tools/openai-realtime-chat-tools.js';


describe('openai-realtime-chat-tools', () => {

  describe('parseLively4EvaluateOutput', () => {
    it('should parse output with result and console output', () => {
      const output = `evaluate-code successful in 31ms:
**Result:** {"foo": "bar"}

**Console output:** Hello world`;

      const parsed = parseLively4EvaluateOutput(output);
      expect(parsed).to.deep.equal({
        result: '{"foo": "bar"}',
        consoleOutput: 'Hello world'
      });
    });

    it('should parse output with only result', () => {
      const output = `evaluate-code successful in 31ms:
**Result:** undefined`;

      const parsed = parseLively4EvaluateOutput(output);
      expect(parsed).to.deep.equal({
        result: 'undefined',
        consoleOutput: null
      });
    });

    it('should parse output with multiline result', () => {
      const output = `evaluate-code successful in 31ms:
**Result:** {
  "title": "AI Workspace",
  "position": {
    "x": 100,
    "y": 200
  }
}`;

      const parsed = parseLively4EvaluateOutput(output);
      expect(parsed.result).to.include('"title": "AI Workspace"');
      expect(parsed.result).to.include('"x": 100');
    });

    it('should return null when no result or console output found', () => {
      const output = `Some random text without markers`;

      const parsed = parseLively4EvaluateOutput(output);
      expect(parsed).to.be.null;
    });

    it('should parse output with only console output', () => {
      const output = `evaluate-code successful:
**Console output:** console.log output here`;

      const parsed = parseLively4EvaluateOutput(output);
      expect(parsed).to.deep.equal({
        result: null,
        consoleOutput: 'console.log output here'
      });
    });
  });


  describe('getResponseContent', () => {
    it('should return empty string for null response', () => {
      expect(getResponseContent(null)).to.equal('');
    });

    it('should return empty string for response without parts', () => {
      expect(getResponseContent({})).to.equal('');
    });

    it('should extract text from text parts', () => {
      const response = {
        parts: [
          { type: 'text', text: 'Hello world' }
        ]
      };

      expect(getResponseContent(response)).to.equal('Hello world');
    });

    it('should extract multiple text parts', () => {
      const response = {
        parts: [
          { type: 'text', text: 'First text' },
          { type: 'text', text: 'Second text' }
        ]
      };

      expect(getResponseContent(response)).to.equal('First text\nSecond text');
    });

    it('should extract string tool_result content', () => {
      const response = {
        parts: [
          { type: 'tool_result', content: 'Tool output here' }
        ]
      };

      expect(getResponseContent(response)).to.equal('Tool result: Tool output here');
    });

    it('should extract array tool_result content', () => {
      const response = {
        parts: [
          {
            type: 'tool_result',
            content: [
              { type: 'text', text: 'First block' },
              { type: 'text', text: 'Second block' }
            ]
          }
        ]
      };

      expect(getResponseContent(response)).to.equal('Tool result: First block\nSecond block');
    });

    it('should include full tool output with text and code', () => {
      const response = {
        "parts": [
          {
            "type": "text",
            "text": "Running calculation:"
          },
          {
            "type": "tool",
            "tool": "lively4_evaluate_code",
            "state": {
              "status": "completed",
              "output": "evaluate-code successful in 31ms:\n\n✅ Code executed successfully:\n```javascript\n2 + 2;\n```\n**Result:** undefined"
            }
          }
        ]
      };

      const content = getResponseContent(response);

      // Should include the text part
      expect(content).to.include("Running calculation:");

      // Should include the FULL output (not just parsed pieces)
      expect(content).to.include("evaluate-code successful");
      expect(content).to.include("Code executed successfully");
      expect(content).to.include("**Result:** undefined");
      expect(content).to.include("2 + 2");
    });

    it('should include full raw output for all tool types', () => {
      const response = {
        parts: [
          {
            type: 'tool',
            tool: 'lively4_evaluate_code',
            state: {
              status: 'completed',
              output: `evaluate-code successful:
**Result:** 42

**Console output:** Debug: calculation complete`
            }
          }
        ]
      };

      const content = getResponseContent(response);
      // Should include the FULL raw output, not parse it
      expect(content).to.equal(`evaluate-code successful:
**Result:** 42

**Console output:** Debug: calculation complete`);
    });

    it('should include raw output for any tool', () => {
      const response = {
        parts: [
          {
            type: 'tool',
            tool: 'some_other_tool',
            state: {
              status: 'completed',
              output: 'Tool output with details'
            }
          }
        ]
      };

      const content = getResponseContent(response);
      expect(content).to.equal('Tool output with details');
    });

    it('should skip step-start and step-finish parts', () => {
      const response = {
        parts: [
          { type: 'step-start' },
          { type: 'text', text: 'Hello' },
          { type: 'step-finish' }
        ]
      };

      expect(getResponseContent(response)).to.equal('Hello');
    });

    it('should skip tool parts without completed status', () => {
      const response = {
        parts: [
          {
            type: 'tool',
            tool: 'some_tool',
            state: { status: 'pending' }
          }
        ]
      };

      expect(getResponseContent(response)).to.equal('');
    });

    it('should handle mixed content types', () => {
      const response = {
        parts: [
          { type: 'text', text: 'Starting calculation' },
          {
            type: 'tool',
            tool: 'lively4_evaluate_code',
            state: {
              status: 'completed',
              output: 'evaluate-code successful:\n**Result:** 42'
            }
          },
          { type: 'text', text: 'Calculation complete' }
        ]
      };

      const content = getResponseContent(response);
      expect(content).to.equal('Starting calculation\nevaluate-code successful:\n**Result:** 42\nCalculation complete');
    });
  });


  describe('BasicToolset', () => {
    let toolset;

    beforeEach(() => {
      toolset = new BasicToolset();
    });

    it('should provide tool definitions', () => {
      const definitions = toolset.getDefinitions();
      expect(definitions).to.be.an('array');
      expect(definitions.length).to.be.greaterThan(0);

      const evaluateCode = definitions.find(d => d.name === 'evaluate_code');
      expect(evaluateCode).to.exist;
      expect(evaluateCode.type).to.equal('function');
    });

    it('should execute evaluate_code tool with simple result', async () => {
      const result = await toolset.execute('evaluate_code', { code: '2 + 2' });
      expect(result.success).to.be.true;
      expect(result.result).to.equal('4');
    });

    it('should execute evaluate_code tool with object result', async () => {
      const result = await toolset.execute('evaluate_code', {
        code: 'JSON.stringify({foo: "bar"})'
      });
      expect(result.success).to.be.true;
      expect(result.result).to.include('"foo"');
    });

    it('should handle evaluate_code errors', async () => {
      const result = await toolset.execute('evaluate_code', {
        code: 'throw new Error("test error")'
      });
      expect(result.success).to.be.false;
      expect(result.error).to.include('test error');
    });

    it('should handle undefined result', async () => {
      const result = await toolset.execute('evaluate_code', {
        code: 'undefined'
      });
      expect(result.success).to.be.true;
      expect(result.result).to.equal('undefined');
    });

    it('should throw error for unknown tool', async () => {
      try {
        await toolset.execute('nonexistent_tool', {});
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Unknown tool');
      }
    });
  });


  describe('WorkspaceToolset', () => {
    it('should require workspace reference', () => {
      expect(() => new WorkspaceToolset()).to.throw('requires a workspace reference');
    });

    it('should accept workspace reference', () => {
      const mockWorkspace = {};
      const toolset = new WorkspaceToolset(mockWorkspace);
      expect(toolset.workspace).to.equal(mockWorkspace);
    });

    it('should provide tool definitions', () => {
      const mockWorkspace = {};
      const toolset = new WorkspaceToolset(mockWorkspace);
      const definitions = toolset.getDefinitions();

      expect(definitions).to.be.an('array');
      const taskTool = definitions.find(d => d.name === 'send_opencode_task');
      expect(taskTool).to.exist;
    });
  });


  describe('CompositeToolset', () => {
    let basicToolset;
    let mockWorkspace;
    let workspaceToolset;
    let compositeToolset;

    beforeEach(() => {
      basicToolset = new BasicToolset();
      mockWorkspace = {
        sendMessageToOpenCode: async () => ({ success: true }),
        getRequestResponse: () => null
      };
      workspaceToolset = new WorkspaceToolset(mockWorkspace);
      compositeToolset = new CompositeToolset(basicToolset, workspaceToolset);
    });

    it('should combine definitions from multiple toolsets', () => {
      const definitions = compositeToolset.getDefinitions();

      expect(definitions).to.be.an('array');
      expect(definitions.length).to.be.greaterThan(1);

      const hasBasicTool = definitions.some(d => d.name === 'evaluate_code');
      const hasWorkspaceTool = definitions.some(d => d.name === 'send_opencode_task');

      expect(hasBasicTool).to.be.true;
      expect(hasWorkspaceTool).to.be.true;
    });

    it('should execute tools from basic toolset', async () => {
      const result = await compositeToolset.execute('evaluate_code', { code: '5 + 5' });
      expect(result.success).to.be.true;
      expect(result.result).to.equal('10');
    });

    it('should throw error for unknown tool', async () => {
      try {
        await compositeToolset.execute('nonexistent_tool', {});
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Unknown tool');
      }
    });
  });
});
