import * as pluginBabel7 from "src/external/babel/plugin-babel7.js"

var babel7 =  window.lively4babel
var babel =  babel7.babel


import {expect} from 'src/external/chai.js'

async function transformCompareAndEval(originalSource, transformedSource, evaluationResult, debug) {
    var result = await pluginBabel7.transformSourceForTest(originalSource)
    if (debug) {
      debugger
    }
    if (transformedSource) { 
      expect(result.code).to.equal(transformedSource);
    } 
    expect(eval(result.code)).to.equal(evaluationResult);
}


describe('Babel7', function() {
  it('compute 3+4', async () => {
    await transformCompareAndEval("3 + 4;", "3 + 4;", 7)
  });
  
  it('2**3', async () => {
    await transformCompareAndEval("2**3", "2 ** 3;", 8)
  });
  
  xit('Optional chaining', async () => {
    await transformCompareAndEval("var a = {b:3}; a?.b", "x", 3, true)
  });
  
});