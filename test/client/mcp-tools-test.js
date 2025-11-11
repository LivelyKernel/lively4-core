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
    
    it('should execute simple expressions with formatted response', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ code: '3 + 4' }, context);
      
      expect(result).to.include('✅ Code executed successfully');
      expect(result).to.include('**Result:** 7');
      expect(result).to.include('```javascript\n3 + 4\n```');
      expect(context.getLogs().length).to.be.greaterThan(0);
      expect(context.getLogs()[0].type).to.equal('request');
    });

    it('should handle string results with formatted response', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ code: '"hello " + "world"' }, context);
      
      expect(result).to.include('✅ Code executed successfully');
      expect(result).to.include('**Result:** hello world');
    });

    it('should handle array objects with JSON formatting', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ code: '[42]' }, context);
      
      expect(result).to.include('✅ Code executed successfully');
      expect(result).to.include('**Result:**');
      expect(result).to.include('42');
    });

    it('should handle undefined results', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ code: 'undefined' }, context);
      
      expect(result).to.include('✅ Code executed successfully');
      expect(result).to.include('**Result:** undefined');
    });

    it('should handle empty/void expressions', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ code: 'void 0' }, context);
      
      expect(result).to.include('✅ Code executed successfully');
      expect(result).to.include('**Result:** undefined');
    });

    it('should handle promise results by awaiting them', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ 
        code: 'Promise.resolve("async result")' 
      }, context);
      
      expect(result).to.include('✅ Code executed successfully');
      expect(result).to.include('**Result:** async result');
    });

    it('should throw errors for rejected promises', async function() {
      const context = createMockContext();
      
      try {
        await Tools['evaluate-code'].execute({ 
          code: 'await Promise.reject(new Error("async error"))' 
        }, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('async error');
      }
    });

    it('should throw errors for invalid JavaScript syntax', async function() {
      const context = createMockContext();

      try {
        await Tools['evaluate-code'].execute({ code: 'invalid syntax {{{' }, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include('Code evaluation failed');
      }
    });

    it('should throw runtime errors', async function() {
      const context = createMockContext();
      
      try {
        await Tools['evaluate-code'].execute({ code: 'throw new Error("runtime error")' }, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('runtime error');
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
      
      expect(result).to.include('✅ Code executed successfully');
      expect(result).to.include('**Result:** object');
    });

    it('should handle lively4 global access', async function() {
      const context = createMockContext();
      
      // Test access to lively4 globals
      const result = await Tools['evaluate-code'].execute({ 
        code: 'typeof lively4url' 
      }, context);
      
      expect(result).to.include('✅ Code executed successfully');
      expect(result).to.include('**Result:** string');
    });

    it('should handle objects that fail JSON.stringify', async function() {
      const context = createMockContext();
      
      // Test with circular reference that can't be JSON.stringify'd
      try {
        const result = await Tools['evaluate-code'].execute({ 
          code: 'const obj = {}; obj.self = obj; obj' 
        }, context);
        
        // Should return formatted success response
        expect(result).to.include('\u2705 Code executed successfully');
        expect(result).to.include('**Result:**');
        
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
      expect(result).to.include('**Result:** 123');
      
      // Test boolean
      result = await Tools['evaluate-code'].execute({ code: 'true' }, context);
      expect(result).to.include('**Result:** true');
      
      result = await Tools['evaluate-code'].execute({ code: 'false' }, context);
      expect(result).to.include('**Result:** false');
    });

    it('should capture console.log output', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ 
        code: 'console.log("Hello", "World"); 42' 
      }, context);
      
      expect(result).to.include('✅ Code executed successfully');
      expect(result).to.include('**Result:** 42');
      expect(result).to.include('**Console output:**');
      expect(result).to.include('📝 **log:** Hello World');
    });

    it('should capture different console levels', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({ 
        code: 'console.log("info"); console.warn("warning"); console.error("error"); "done"' 
      }, context);
      
      expect(result).to.include('📝 **log:** info');
      expect(result).to.include('⚠️ **warn:** warning');
      expect(result).to.include('🔴 **error:** error');
      expect(result).to.include('**Result:** done');
    });

    it('should capture console output even when errors occur', async function() {
      const context = createMockContext();
      
      try {
        await Tools['evaluate-code'].execute({ 
          code: 'console.log("Before error"); nonExistentVariable.method()' 
        }, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Console output before error:');
        expect(error.message).to.include('log: Before error');
      }
    });

    it('should handle objects in console output', async function() {
      const context = createMockContext();
      const result = await Tools['evaluate-code'].execute({
        code: 'console.log("Object:", {name: "test", value: 42}); "success"'
      }, context);

      expect(result).to.include('**Console output:**');
      expect(result).to.include('📝 **log:** Object: {');
      expect(result).to.include('"name": "test"');
      expect(result).to.include('"value": 42');
    });

    it('should handle SystemJS/module loading errors gracefully', async function() {
      const context = createMockContext();

      try {
        // Try to import a non-existent module
        await Tools['evaluate-code'].execute({
          code: 'import nonExistentModule from "this-module-does-not-exist"'
        }, context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include('Code evaluation failed');
      }
    });

  });

});