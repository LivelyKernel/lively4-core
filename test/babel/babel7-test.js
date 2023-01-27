import * as pluginBabel7 from "src/external/babel/plugin-babel7.js"

var babel7 =  window.lively4babel
var babel =  babel7.babel


import {expect} from 'src/external/chai.js'

async function transformCompareAndEval(originalSource, transformedSource, evaluationResult, debug, noCustomPlugins) {
  var result = await pluginBabel7.transformSourceForTest(originalSource, noCustomPlugins)
    if (debug) {
      debugger
    }
    if (transformedSource) { 
      expect(result.code).to.equal(transformedSource);
    } 
    expect(eval(result.code)).to.equal(evaluationResult);
}


async function testTransformCompareAndEval(name, originalSource, transformedSource, evaluationResult, debug) {
  it("base "+ name, async () => {
     await transformCompareAndEval(originalSource, transformedSource, evaluationResult, debug, true)
  });
  it("lively plugins "+ name, async () => {
     await transformCompareAndEval(originalSource, transformedSource, evaluationResult, debug, false)
  });

}


describe('Babel7', async function() {
  await testTransformCompareAndEval("3+4", "3 + 4;", "3 + 4;", 7)
  await testTransformCompareAndEval("new operators ", "2**3", "2 ** 3;", 8)
  await testTransformCompareAndEval("optional chaining ", "var a = {b:3}; a?.b", undefined, 3, true)
  
});