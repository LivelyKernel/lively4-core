import * as pluginBabel7 from "src/plugin-babel.js"

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
  await it("base "+ name, async () => {
     await transformCompareAndEval(originalSource, transformedSource, evaluationResult, debug, true)
  });
  await it("lively plugins "+ name, async () => {
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

describe('Babel7 x', async function() {
  await testTransformCompareAndEval("3+4", "3 + 4;", undefined, 7)
  await testTransformCompareAndEval("new operators ", "2**3", undefined, 8)
  await testTransformCompareAndEval("optional chaining ", "var a = {b:3}; a?.b", undefined, 3, true)
  
  await it("aexpr onChange analysis mode ", async () => {
    await transformCompareAndEval(`
      var a = 3
      var b = 0
      aexpr(() => a).onChange( () => b++);
      a = 4;
      b
    `,undefined, 1, false)
  })
  
  // known to fail, because aexpr proxies does not support variables
  await xit("aexpr onChange proxies #KnownToFail", async () => {
    await transformCompareAndEval(`
'use proxies for aexprs'
      var a = 3
      var b = 0
      aexpr(() => a).onChange( () => b++);
      a = 4;
      b
    `, undefined, 1, false)
  })
  

  await it("aexpr onChange member ", async () => {
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
})

describe('Babel7 liveES7', async function() {
    it("computes 3+4", async () => {
    var originalCode = `3 + 4`
    var evaluationResult = 7
    
    var plugins = await pluginBabel7.babel7liveES7Plugins({fortesting: true})
    var result = await pluginBabel7.transformSourceForTestWithPlugins(originalCode, plugins)
    var code = result.code
    expect(eval(code)).to.equal(evaluationResult);
    
  })
});

describe('Babel7 aexprViaDirective', async function() {
    it("computes 3+4", async () => {
    var originalCode = `3 + 4`
    var evaluationResult = 7
    
    var plugins = await pluginBabel7.aexprViaDirectivePlugins({fortesting: true})
    var result = await pluginBabel7.transformSourceForTestWithPlugins(originalCode, plugins)
    var code = result.code
    expect(eval(code)).to.equal(evaluationResult);
    
  })
});

describe('Babel7 workspace', async function() {
    it("computes 3+4", async () => {
    var originalCode = `3 + 4`
    var evaluationResult = 7
    
    var plugins = await pluginBabel7.workspacePlugins({fortesting: false})
    var result = await pluginBabel7.transformSourceForTestWithPlugins(originalCode, plugins)
    var code = result.code
    
    /*MD 
it should look like this:
<style> pre  {
background-color:lightgray
}
</style>

```javascript 
// added space to break regex dectection in module
S ystem.register([], function (_export, _context) {
      "use strict";
      
      var __SystemJSRewritingHack, __result__;
      return {
        setters: [],
        execute: function () {
          __SystemJSRewritingHack = {};
          _recorder_._file_js = _recorder_._file_js || {};
          _export("__result__", __result__ = 3 + 4);
          _export("__result__", __result__);
        }
      };
    }););'
``` 

OK, here we mock hart #SystemJS, since the other way would be to insert ourselves into SystemJS as we did with workspaces...
but we just want to test the transformation code, and not the module loading itself
MD*/
    
     // expect(code).to.equal("xxx")
    

    var preMockSystemJS = `
var _mod;
var _exports = {}
var System = {
  register: function(deps, func) {
    _mod = func(function _export(key, value) { _exports[key] = value}, {})
  }
};`
    var postMockSystemJS = `
;_mod.execute(); _exports.__result__
`
    expect(eval(preMockSystemJS + code + postMockSystemJS)).to.equal(evaluationResult);
    
  })
});






   
   