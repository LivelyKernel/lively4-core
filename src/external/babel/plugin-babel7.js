import babelPluginJsxLively from "src/client/reactive/reactive-jsx/babel-plugin-jsx-lively-babel7.js"
import babelPluginActiveExpressionRewriting  from 'src/client/reactive/babel-plugin-active-expression-rewriting/index-babel7.js'

// ['babel-plugin-active-expression-rewriting', {
//         enableViaDirective: true,
//         executedIn: 'file'
//       }],
// ['babel-plugin-databindings-post-process', {
//   executedIn: 'file'
// }],      
// ['babel-plugin-active-expression-proxies', {
//   executedIn: 'file'
// }]

/*MD 

## #Duplication Warning #Babel7

See and update also following places. #TODO refactor this into one place!

- <edit://src/client/syntax.js>
- <edit://src/external/babel/plugin-babel7.js>
- <edit://src/external/eslint/eslint-parser.js>

MD*/


export async function transformSource(load, babelOptions, config) {
    
    var output
    await SystemJS.import("src/external/babel/babel7.js")
    var babel7 = window.lively4babel
    var babel =  babel7.babel

    let plugins = [
      babel7.babelPluginProposalExportDefaultFrom,
      babel7.babelPluginProposalExportNamespaceFrom,
      babel7.babelPluginSyntaxClassProperties,
      // babel7.babelPluginSyntaxFunctionBind,
      babel7.babelPluginNumericSeparator,
      babel7.babelPluginProposalDynamicImport,
      babel7.babelPluginProposalFunctionBind,
      babel7.babelPluginTransformModulesSystemJS,
      babel7.babelPluginProposalDoExpressions,
      babelPluginJsxLively,
      babelPluginActiveExpressionRewriting
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


    try {
      output = babel.transform(load.source, {
        filename: config.filename,
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
      console.log("ERROR transpiling code with babel7:", e)
      throw e
    }
  return output
}
