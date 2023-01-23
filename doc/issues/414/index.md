# babel7 migration #414


- [x] make CodeMirror use babel7 as needed. 
  - [x] for syntax checking
  - [x] for linting
- [ ] make our plugins work with babel 7
- [ ] refactor and cleanup `src/external/babel/plugin-babel6.js`
- [ ] migrate to latest SystemJS
- https://github.com/systemjs/systemjs-babel
- [x] establish a second new system js world inside of lively as upgrade strategy
- [x] [run demos that use babel7](browse://demos/babel7/index.md)
- [ ] remove duplication
  - <edit://src/client/syntax.js>
  - <edit://src/external/babel/plugin-babel7.js>
  - <edit://src/external/eslint/eslint-parser.js>
- [ ] customize systemjs-babel.js to use new babel7
- [ ] refactor and adapt all our meta tools
  - [ ] babylonian programming editor
  - [ ] AST explorer / plugin writing tool
- [ ] boot without babel5 loaded
- [ ] remove babel5


## Workspace with Babel7 API  

```javascript

import babelPluginJsxLively from "src/client/reactive/reactive-jsx/babel-plugin-jsx-lively-babel7.js"
import "src/external/babel/babel7.js"

var babel7 =  window.lively4babel
var babel =  babel7.babel

// var src = `var a = {b:3}; a.b`
var src = `var a = {b:3}; a?.b`

let plugins = [
  babel7.babelPluginProposalExportDefaultFrom,
  babel7.babelPluginProposalExportNamespaceFrom,
  babel7.babelPluginSyntaxClassProperties,
  // babel7.babelPluginSyntaxFunctionBind,
  babel7.babelPluginProposalDoExpressions,
  babel7.babelPluginNumericSeparator,
  babel7.babelPluginProposalDynamicImport,
  babel7.babelPluginProposalFunctionBind,
  babel7.babelPluginTransformModulesSystemJS,
  babelPluginJsxLively
];

let stage3Syntax = [
  'asyncGenerators', 
  'classProperties', 
  'classPrivateProperties', 
  'classPrivateMethods',
  'dynamicImport',
  'importMeta',
  'nullishCoalescingOperator',
  'numericSeparator',
  'optionalCatchBinding',
  'optionalChaining',
  'objectRestSpread', 
  'topLevelAwait'];

let syntaxPlugins
let result

result.ast

;(async () => {
  syntaxPlugins = (await Promise.all([
      'babel-plugin-syntax-jsx',
      'babel-plugin-syntax-async-generators',
      'babel-plugin-syntax-do-expressions',
      'babel-plugin-syntax-function-bind',
      'babel-plugin-syntax-class-properties',
      'babel-plugin-syntax-object-rest-spread'
    ]
      .map(syntaxPlugin => System.import(syntaxPlugin))))
      .map(m => m.default);


   result = await babel.transform(src, {
          filename: undefined,
          sourceMaps: false,
          ast: true,
          compact: false,
          sourceType: 'module',
          parserOpts: {
            plugins: stage3Syntax,
            errorRecovery: true
          },
          plugins: plugins
          
          // babelrc: false,
          // plugins: plugins,
          // presets: [],
          // filename: undefined,
          // sourceFileName: undefined,
          // moduleIds: false,
          // sourceMaps: false,
          // compact: false,
          // comments: true,
          // code: true,
          // ast: true,
          // resolveModuleSource: undefined
        })
  
  result
})()      

```

# Notes

- New SystemJS + Babel7 + Typescript works

### New SystemJS + Babel7 and Babel6

- Webpack Core....
- a) webpack all additional plugins separately
- b) include all transformations in webpack and expose them as needed...
- Idee: look systemjs-babel project... 
  - lots of webpacking
    - expose core and plugsins
  - configure -> MOVE to runtime
  - overwriting systemjs.fetch -> MOVE TO Runtime
    - incl. transpile etc.
- make Babel6 available in new SystemJS... 
- rewrite boot.js 
- rewrite lively.js to use new systemjs
  - e.g. undloading and (re-)loading of modules
- what about systemjs.config



### Old SystemJS + Babel6 ... with addition of Babel7

- webpack Babel7 and plugins
- customize old systemjs config to OPTIONALY use new Babel7 
  - 
  
  
  
