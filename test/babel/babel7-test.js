import * as pluginBabel7 from "src/external/babel/plugin-babel7.js"

var babel7 =  window.lively4babel
var babel =  babel7.babel


import {expect} from 'src/external/chai.js'
import { getLocal as _getLocal } from "active-expression-rewriting"
import { setLocal as _setLocal } from "active-expression-rewriting"
import { getGlobal as _getGlobal } from "active-expression-rewriting"

import { aexpr as _aexpr } from "active-expression-rewriting"
import { aexpr as _aexprProxies } from "active-expression-proxies";

import { wrap as _wrap } from "active-expression-proxies"
import { setMember as _setMember } from "active-expression-rewriting"
import { getMember as _getMember } from "active-expression-rewriting"
import { traceMember as _traceMember } from "active-expression-rewriting"

self.lively4ae = {_getLocal,_setLocal,_getGlobal,_aexpr,_wrap,_setMember,_getMember,_aexprProxies,_traceMember }


async function transformCompareAndEval(originalSource, transformedSource, evaluationResult, debug, noCustomPlugins) {
  var result = await pluginBabel7.transformSourceForTest(originalSource, noCustomPlugins)
    if (debug) {
      debugger
    }
    var code = result.code
    if (!noCustomPlugins) {
      code = fixAEInfrastructureForTesting(code) // #Hack, we need to rewrite import statements until we have import statements...
    }
    if (transformedSource) { 
      expect(code).to.equal(transformedSource);
    } 
    expect(eval(code)).to.equal(evaluationResult);
}



async function testTransformCompareAndEval(name, originalSource, transformedSource, evaluationResult, debug) {
  it("base "+ name, async () => {
     await transformCompareAndEval(originalSource, transformedSource, evaluationResult, debug, true)
  });
  it("lively plugins "+ name, async () => {
     await transformCompareAndEval(originalSource, transformedSource, evaluationResult, debug, false)
  });

}

function fixAEInfrastructureForTesting(source) {
  return source
    .replace(`import { getLocal as _getLocal } from "active-expression-rewriting"`, `const _getLocal = self.lively4ae._getLocal`)
    .replace(`import { setLocal as _setLocal } from "active-expression-rewriting"`, `const _setLocal = self.lively4ae._setLocal`)
    .replace(`import { aexpr as _aexpr } from "active-expression-rewriting"`, `const _aexpr = self.lively4ae._aexpr`)
    .replace(`import { aexpr as _aexpr } from "active-expression-proxies";`, `const _aexpr = self.lively4ae._aexprProxies`)
    .replace(`import { getGlobal as _getGlobal } from "active-expression-rewriting"`, `const _getGlobal = self.lively4ae._getGlobal`) 
    .replace(`import { wrap as _wrap } from "active-expression-proxies"`, `const _wrap = self.lively4ae._wrap`) 
    .replace(`import { setMember as _setMember } from "active-expression-rewriting"`, `const _setMember = self.lively4ae._setMember`) 
    .replace(`import { getMember as _getMember } from "active-expression-rewriting"`, `const _getMember = self.lively4ae._getMember`) 
    .replace(`import { traceMember as _traceMember } from "active-expression-rewriting"`, `const _traceMember = self.lively4ae._traceMember`) 


}



describe('Babel7', async function() {
  await testTransformCompareAndEval("3+4", "3 + 4;", undefined, 7)
  await testTransformCompareAndEval("new operators ", "2**3", undefined, 8)
  await testTransformCompareAndEval("optional chaining ", "var a = {b:3}; a?.b", undefined, 3, true)
  
  it("aexpr onChange analysis mode ", async () => {
    await transformCompareAndEval(`
      var a = 3
      var b = 0
      aexpr(() => a).onChange( () => b++);
      a = 4;
      b
    `,undefined, 1, false)
  })
  
  // known to fail, because aexpr proxies does not support variables
  xit("aexpr onChange proxies #KnownToFail", async () => {
    await transformCompareAndEval(`
'use proxies for aexprs'
      var a = 3
      var b = 0
      aexpr(() => a).onChange( () => b++);
      a = 4;
      b
    `, undefined, 1, false)
  })
  

  it("aexpr onChange member ", async () => {
    await transformCompareAndEval(`
      var a = {x:3}
      var b = 0
      aexpr(() => a.x).onChange( () => b++);
      a.x = 4;
      b
    `, undefined, 1, false)
  })
    
  
 it("aexpr onChange member proxies ", async () => {
    await transformCompareAndEval(`
'use proxies for aexprs'
      var a = {x:3}
      var b = 0
      aexpr(() => a.x).onChange( () => b++);
      a.x = 4;
      b
    `, undefined, 1, false)
  })
  
});