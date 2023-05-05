import { expect } from 'src/external/chai.js';

import {
  generateLocationMap,
  astForCode,
  codeForAst,
  assignIds,
} from "src/babylonian-programming-editor/utils/ast.js";


// COPIED from Babely7
function deepClone(value, cache) {
  if (value !== null) {
    if (cache.has(value)) return cache.get(value);
    let cloned;
    if (Array.isArray(value)) {
      cloned = new Array(value.length);
      for (let i = 0; i < value.length; i++) {
        cloned[i] = typeof value[i] !== "object" ? value[i] : deepClone(value[i], cache);
      }
    } else {
      cloned = {};
      const keys = Object.keys(value);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        cloned[key] = typeof value[key] !== "object" ? value[key] : deepClone(value[key], cache);
      }
    }
    cache.set(value, cloned);
    return cloned;
  }
  return value;
}



describe("Babylonian-Programming", function() {
  describe("AST", function() {
    describe("generateLocationMap", function() {
      xit("should parse again", function() {
        var code = `var a = 3`
        const ast = assignIds(astForCode(code));
        generateLocationMap(ast);
        debugger
        ast._locationMap
        
        let loadableCode = codeForAst(ast);
        expect(loadableCode).to.be.defined
      })

      it("should deepClone", function() {
        var code = `var a = 3`
        const ast = assignIds(astForCode(code));
        generateLocationMap(ast);
        ast._locationMap
        debugger
        deepClone(ast._locationMap, new Map())
      })
    })
  })
})
