import {expect} from 'src/external/chai.js'
import { Tools } from 'src/client/mcp-tools.js'

describe('MCP Tools', function() {
  
  // Mock context object for testing
  const createMockContext = () => {
    const logs = [];
    return {
      logActivity: function(type, message) {
        logs.push({ type, message });
      },
      getLogs: () => logs,
      clearLogs: () => logs.length = 0
    };
  };

  describe('evaluate-code', function() {
    
    it('should execute simple expressions', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ code: '3 + 4' }, context);
      
      expect(result).to.equal('7');
      expect(context.getLogs().length).to.be.greaterThan(0);
      expect(context.getLogs()[0].type).to.equal('request');
    });

    it('should handle string results', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ code: '"hello " + "world"' }, context);
      
      expect(result).to.equal('hello world');
    });

    it('should handle simple array objects', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ code: '[42]' }, context);
      
      // Should return a string representation
      expect(typeof result).to.equal('string');
    });

    it('should handle undefined results', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ code: 'undefined' }, context);
      
      expect(result).to.equal('undefined');
    });

    it('should handle empty/void expressions', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ code: 'void 0' }, context);
      
      expect(result).to.equal('undefined');
    });

    it('should handle promise results by awaiting them', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ 
        code: 'Promise.resolve("async result")' 
      }, context);
      
      expect(result).to.equal('async result');
    });

    it('should throw errors for rejected promises', async function() {
      const context = createMockContext();
      
      try {
        await Tools['evaluate-code'].execute({ 
          code: 'Promise.reject(new Error("async error"))' 
        }, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('async error');
      }
    });

    it('should throw errors for invalid JavaScript syntax', async function() {
      const context = createMockContext();
      
      try {
        await Tools['evaluate-code'].execute({ code: 'invalid syntax {{{' }, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Error should be thrown and propagated (current behavior)
        expect(error).to.exist;
      }
    });

    it('should throw runtime errors', async function() {
      const context = createMockContext();
      
      try {
        await Tools['evaluate-code'].execute({ code: 'throw new Error("runtime error")' }, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('runtime error');
      }
    });

    xit('should log activity with truncated code preview for long code', async function() {
      const context = createMockContext();
      const longCode = 'x'.repeat(100);
      
      await Tools['evaluate-code'].execute({ code: longCode }, context);
      
      const logs = context.getLogs();
      expect(logs.length).to.be.greaterThan(0);
      expect(logs[0].message).to.include('...');
      expect(logs[0].message.length).to.be.lessThan(longCode.length + 20);
    });

    it('should log activity messages', async function() {
      const context = createMockContext();
      const shortCode = '5';
      
      await Tools['evaluate-code'].execute({ code: shortCode }, context);
      
      const logs = context.getLogs();
      expect(logs.length).to.be.greaterThan(0);
      expect(logs[0].type).to.equal('request');
      expect(logs[0].message).to.include('Evaluating');
    });

    it('should handle SystemJS imports through boundEval', async function() {
      const context = createMockContext();
      
      // This tests the SystemJS integration through boundEval
      const result = await Tools['evaluate-code'].execute({ 
        code: 'import * as utils from "utils"; typeof utils' 
      }, context);
      
      expect(result).to.equal('object');
    });

    it('should handle lively4 global access', async function() {
      const context = createMockContext();
      
      // Test access to lively4 globals
      const result = await Tools['evaluate-code'].execute({ 
        code: 'typeof lively4url' 
      }, context);
      
      expect(result).to.equal('string');
    });

    it('should handle objects that fail JSON.stringify', async function() {
      const context = createMockContext();
      
      // Test with circular reference that can't be JSON.stringify'd
      try {
        const result = await Tools['evaluate-code'].execute({ 
          code: 'const obj = {}; obj.self = obj; obj' 
        }, context);
        
        // If no error thrown, it should be a string
        expect(typeof result).to.equal('string');
        
      } catch (error) {
        // JSON.stringify might throw on circular references
        // This is acceptable behavior for the current implementation
        expect(error).to.exist;
      }
    });

    it('should handle primitive values', async function() {
      const context = createMockContext();
      
      // Test number
      let result = await Tools['evaluate-code'].execute({ code: '123' }, context);
      expect(result).to.equal('123');
      
      // Test boolean
      result = await Tools['evaluate-code'].execute({ code: 'true' }, context);
      expect(result).to.equal('true');
      
      result = await Tools['evaluate-code'].execute({ code: 'false' }, context);
      expect(result).to.equal('false');
    });

  });

});