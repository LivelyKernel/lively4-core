import {expect} from 'src/external/chai.js';
import {parseModuleSemanticsFromSource} from "src/client/javascript.js"

describe('JavaScript Parameter Extraction', () => {
  
  describe('ClassMethod parameters', () => {
    it('extracts simple parameters', () => {
      const source = 'class Foo { method(a, b, c) {} }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.classes).to.have.lengthOf(1);
      expect(result.classes[0].methods).to.have.lengthOf(1);
      expect(result.classes[0].methods[0].params).to.deep.equal([
        { name: 'a', type: 'simple' },
        { name: 'b', type: 'simple' },
        { name: 'c', type: 'simple' }
      ]);
    });
    
    it('extracts rest parameters', () => {
      const source = 'class Foo { method(first, ...rest) {} }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.classes[0].methods[0].params).to.deep.equal([
        { name: 'first', type: 'simple' },
        { name: 'rest', type: 'rest' }
      ]);
    });
    
    it('extracts default parameters', () => {
      const source = 'class Foo { method(x = 5, y = "hello") {} }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.classes[0].methods[0].params).to.deep.equal([
        { name: 'x', type: 'default', defaultValue: '...' },
        { name: 'y', type: 'default', defaultValue: '...' }
      ]);
    });
    
    it('extracts destructured object parameters', () => {
      const source = 'class Foo { method({x, y, z}) {} }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      const params = result.classes[0].methods[0].params;
      expect(params).to.have.lengthOf(1);
      expect(params[0].name).to.equal('{...}');
      expect(params[0].type).to.equal('destructure');
      expect(params[0].properties).to.deep.equal(['x', 'y', 'z']);
    });
    
    it('extracts destructured array parameters', () => {
      const source = 'class Foo { method([a, b]) {} }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      const params = result.classes[0].methods[0].params;
      expect(params).to.have.lengthOf(1);
      expect(params[0].name).to.equal('[...]');
      expect(params[0].type).to.equal('destructure');
    });
    
    it('handles mixed parameter types', () => {
      const source = 'class Foo { method(a, b = 5, {c, d}, ...rest) {} }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      const params = result.classes[0].methods[0].params;
      expect(params).to.have.lengthOf(4);
      expect(params[0].type).to.equal('simple');
      expect(params[1].type).to.equal('default');
      expect(params[2].type).to.equal('destructure');
      expect(params[3].type).to.equal('rest');
    });
    
    it('handles methods with no parameters', () => {
      const source = 'class Foo { method() {} }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.classes[0].methods[0].params).to.deep.equal([]);
    });
    
    it('extracts parameters from static methods', () => {
      const source = 'class Foo { static method(x, y) {} }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.classes[0].methods[0].static).to.be.true;
      expect(result.classes[0].methods[0].params).to.deep.equal([
        { name: 'x', type: 'simple' },
        { name: 'y', type: 'simple' }
      ]);
    });
    
    it('extracts parameters from getters and setters', () => {
      const source = 'class Foo { get value() {} set value(x) {} }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.classes[0].methods).to.have.lengthOf(2);
      expect(result.classes[0].methods[0].kind).to.equal('get');
      expect(result.classes[0].methods[0].params).to.deep.equal([]);
      expect(result.classes[0].methods[1].kind).to.equal('set');
      expect(result.classes[0].methods[1].params).to.deep.equal([
        { name: 'x', type: 'simple' }
      ]);
    });
    
    it('extracts parameters from constructor', () => {
      const source = 'class Foo { constructor(a, b, c) {} }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.classes[0].methods[0].kind).to.equal('constructor');
      expect(result.classes[0].methods[0].params).to.deep.equal([
        { name: 'a', type: 'simple' },
        { name: 'b', type: 'simple' },
        { name: 'c', type: 'simple' }
      ]);
    });
  });
  
  describe('FunctionDeclaration parameters', () => {
    it('extracts simple parameters from functions', () => {
      const source = 'function myFunc(a, b) { return a + b; }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.functions).to.have.lengthOf(1);
      expect(result.functions[0].name).to.equal('myFunc');
      expect(result.functions[0].params).to.deep.equal([
        { name: 'a', type: 'simple' },
        { name: 'b', type: 'simple' }
      ]);
    });
    
    it('extracts rest parameters from functions', () => {
      const source = 'function myFunc(first, ...args) { return args; }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.functions[0].params).to.deep.equal([
        { name: 'first', type: 'simple' },
        { name: 'args', type: 'rest' }
      ]);
    });
    
    it('extracts default parameters from functions', () => {
      const source = 'function myFunc(x = 10) { return x; }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.functions[0].params).to.deep.equal([
        { name: 'x', type: 'default', defaultValue: '...' }
      ]);
    });
    
    it('extracts destructured parameters from functions', () => {
      const source = 'function myFunc({a, b}, [c, d]) { return a + b + c + d; }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      const params = result.functions[0].params;
      expect(params).to.have.lengthOf(2);
      expect(params[0].type).to.equal('destructure');
      expect(params[0].properties).to.deep.equal(['a', 'b']);
      expect(params[1].type).to.equal('destructure');
    });
    
    it('handles functions with no parameters', () => {
      const source = 'function myFunc() { return 42; }';
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.functions[0].params).to.deep.equal([]);
    });
    
    it('handles multiple function declarations', () => {
      const source = `
        function func1(a, b) {}
        function func2(x, y, z) {}
      `;
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.functions).to.have.lengthOf(2);
      expect(result.functions[0].params).to.have.lengthOf(2);
      expect(result.functions[1].params).to.have.lengthOf(3);
    });
  });
  
  describe('Real-world examples', () => {
    it('handles complex class with multiple methods', () => {
      const source = `
        class FileIndex {
          constructor(name) {
            this.name = name;
          }
          
          addFile(url, name = "", type, size, modified) {
            // implementation
          }
          
          async updateDirectory(baseURL, showProgress = false, ...options) {
            // implementation
          }
          
          static current() {
            return this._current;
          }
        }
      `;
      const result = parseModuleSemanticsFromSource('test.js', source);
      
      expect(result.classes).to.have.lengthOf(1);
      expect(result.classes[0].name).to.equal('FileIndex');
      expect(result.classes[0].methods).to.have.lengthOf(4);
      
      // Constructor
      expect(result.classes[0].methods[0].name).to.equal('constructor');
      expect(result.classes[0].methods[0].params[0].name).to.equal('name');
      
      // addFile
      expect(result.classes[0].methods[1].name).to.equal('addFile');
      expect(result.classes[0].methods[1].params).to.have.lengthOf(5);
      expect(result.classes[0].methods[1].params[1].type).to.equal('default');
      
      // updateDirectory
      expect(result.classes[0].methods[2].name).to.equal('updateDirectory');
      expect(result.classes[0].methods[2].params).to.have.lengthOf(3);
      expect(result.classes[0].methods[2].params[2].type).to.equal('rest');
      
      // static current
      expect(result.classes[0].methods[3].name).to.equal('current');
      expect(result.classes[0].methods[3].static).to.be.true;
      expect(result.classes[0].methods[3].params).to.deep.equal([]);
    });
  });
});
