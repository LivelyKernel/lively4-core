# Babel7 Experiments

Based on code of systemjs-babel:

```javascript
// SystemJS.import("src/external/babel/babel7.js")

window.lively4babel
var babel = window.lively4babel.babel

var source = `
// HELLO
var a = Foo?.bar()

// world

`

const plugins = [
  window.lively4babel.babelPluginProposalExportDefaultFrom,
  window.lively4babel.babelPluginProposalExportNamespaceFrom,
  window.lively4babel.babelPluginSyntaxClassProperties,
  window.lively4babel.babelPluginNumericSeparator,
  window.lively4babel.babelPluginProposalDynamicImport,
  window.lively4babel.babelPluginTransformModulesSystemJS,
];

var stage3Syntax = ['asyncGenerators', 'classProperties', 'classPrivateProperties', 'classPrivateMethods', 'dynamicImport', 'importMeta', 'nullishCoalescingOperator', 'numericSeparator', 'optionalCatchBinding', 'optionalChaining', 'objectRestSpread', 'topLevelAwait'];

var url = "test.js";


(new Promise((resolve, reject) => {
  babel.transform(source, {
          filename: "test.js",
          sourceMaps: 'inline',
          ast: false,
          compact: false,
          sourceType: 'module',
          parserOpts: {
            plugins: stage3Syntax,
            errorRecovery: true
          },
          plugins: plugins
        }, function (err, result) {
          if (err)
            return reject(err);
          const code = result.code + '\n//# sourceURL=' + url + '!system';
          // resolve(new Response(new Blob([code], { type: 'application/javascript' })));
          resolve(result.code)
        });
}))

```

Workspace with Error ...

```javascript

// SystemJS.import("http://localhost:9005/lively4-core/src/external/babel7/babel7.js")

window.lively4babel
var babel = window.lively4babel.babel

var source = `
// HELLO
var a = Foo.?bar()

// world

`

const plugins = [
  window.lively4babel.babelPluginProposalExportDefaultFrom,
  window.lively4babel.babelPluginProposalExportNamespaceFrom,
  window.lively4babel.babelPluginSyntaxClassProperties,
  window.lively4babel.babelPluginNumericSeparator,
  window.lively4babel.babelPluginProposalDynamicImport,
  window.lively4babel.babelPluginTransformModulesSystemJS,
];

var stage3Syntax = [
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

var url = "test.js";

var result = "xxx"

var MyE 

try {
  var result = babel.transform(source, {
    filename: "test.js",
    sourceMaps: 'inline',
    ast: false,
    compact: false,
    sourceType: 'module',
    parserOpts: {
      plugins: stage3Syntax,
      errorRecovery: true
    },
    plugins: plugins
  });      
} catch(e) {
  MyE = e
}

// MyE.stack = ""

result

new Promise((resolve, reject) => {
  // throw new Error("E!!!")
  throw MyE
  
  
  resolve("Yeah!")
})


```

