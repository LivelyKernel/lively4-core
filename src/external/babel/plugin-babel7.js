// Babel7 is not loaded using the module system, because it is part of the systemjs module loading itself
// import "src/external/babel/babel7.js"

var babel7 =  window.lively4babel
var babel =  babel7.babel

import babelPluginJsxLively from "src/client/reactive/reactive-jsx/babel-plugin-jsx-lively-babel7.js"

import babelPluginConstraintConnectorsActiveExpression from 'src/client/reactive/babel-plugin-constraint-connectors-active-expression/babel-plugin-constraint-connectors-active-expression.js'
import babelPluginConstraintConnectors from 'src/client/reactive/babel-plugin-constraint-connectors/babel-plugin-constraint-connectors.js'
import babelPluginPolymorphicIdentifiers from 'src/client/reactive/babel-plugin-polymorphic-identifiers/babel-plugin-polymorphic-identifiers.js'
import babelPluginRp19JSX from 'src/client/reactive/rp19-jsx/babel-plugin-rp19-jsx.js'
import babelPluginILA from 'src/client/reactive/babel-plugin-ILA/index.js'
import babelPluginDatabindings from 'src/client/reactive/babel-plugin-databindings/index.js'
import babelPluginActiveExpressionRewriting from 'src/client/reactive/babel-plugin-active-expression-rewriting/index-babel7.js'
import babelPluginDatabindingsPostProcess from 'src/client/reactive/babel-plugin-databindings/post-process.js'
import babelPluginActiveExpressionProxies from 'src/client/reactive/babel-plugin-active-expression-proxies/index-babel7.js'
import babelPluginTransformFunctionBind from 'src/external/babel-plugin-transform-function-bind.js'

import babelPluginSyntaxAsyncGenerators from 'src/external/babel-plugin-syntax-async-generators.js'
import babelPluginSyntaxObjectRestSpread from 'src/external/babel-plugin-syntax-object-rest-spread.js'
import babelPluginSyntaxClassProperties from 'src/external/babel-plugin-syntax-class-properties.js'

import babelPluginVarRecorder from 'src/external/babel-plugin-var-recorder-babel7.js'
import babelPluginLocals from 'src/external/babel-plugin-locals.js'
import babelPluginDoitResult from 'src/external/babel-plugin-doit-result.js'
import babelPluginDoitThisRef from 'src/external/babel-plugin-doit-this-ref.js'
import babelPluginSyntaxJSX from 'babel-plugin-syntax-jsx'



// moduleOptionsNon

// babel7liveES7
// liveES7:
      // ['babel-plugin-rp19-jsx', {
      //   executedIn: 'file'
      // }],
      // ['babel-plugin-jsx-lively', {
      //   executedIn: 'file'
      // }],
      // 'babel-plugin-transform-do-expressions',
      // 'babel-plugin-transform-function-bind',
      // 'babel-plugin-syntax-async-generators',
      // 'babel-plugin-syntax-object-rest-spread',
      // 'babel-plugin-syntax-class-properties',
      // 'babel-plugin-locals', // #TODO: remove this plugin from here
      // 'babel-plugin-var-recorder'

// aexprViaDirective
      // 'babel-plugin-constraint-connectors-active-expression',
      // 'babel-plugin-constraint-connectors',
      // 'babel-plugin-polymorphic-identifiers',
      // ['babel-plugin-rp19-jsx', {
      //   executedIn: 'file'
      // }],
      // ['babel-plugin-jsx-lively', {
      //   executedIn: 'file'
      // }],
      // 'babel-plugin-transform-do-expressions',
      // 'babel-plugin-transform-function-bind',
      // 'babel-plugin-syntax-async-generators',
      // 'babel-plugin-syntax-object-rest-spread',
      // 'babel-plugin-syntax-class-properties',
      // 'babel-plugin-var-recorder',
      // ['babel-plugin-ILA', {
      //   executedIn: 'file'
      // }],
      // ['babel-plugin-databindings', {
      //   executedIn: 'file'
      // }],      
      // ['babel-plugin-active-expression-rewriting', {
      //   enableViaDirective: true,
      //   executedIn: 'file'
      // }],
      // ['babel-plugin-databindings-post-process', {
      //   executedIn: 'file'
      // }],      
      // ['babel-plugin-active-expression-proxies', {
      //   executedIn: 'file'
      // }]


// workspace:
      // lively4url + '/demos/swe/debugging-plugin.js',
      // ['babel-plugin-constraint-connectors-active-expression', {
      //   executedIn: 'workspace'
      // }],
      // ['babel-plugin-constraint-connectors', {
      //   executedIn: 'workspace'
      // }],
      // ['babel-plugin-polymorphic-identifiers', {
      //   executedIn: 'workspace'
      // }],
      // ['babel-plugin-rp19-jsx', {
      //   executedIn: 'workspace'
      // }],
      // ['babel-plugin-jsx-lively', {
      //   executedIn: 'workspace'
      // }],
      // 'babel-plugin-transform-do-expressions',
      // 'babel-plugin-transform-function-bind',
      // 'babel-plugin-syntax-async-generators',
      // 'babel-plugin-syntax-object-rest-spread',
      // 'babel-plugin-syntax-class-properties',
      // 'babel-plugin-locals',
      // 'babel-plugin-doit-result',
      // 'babel-plugin-doit-this-ref',
      // 'babel-plugin-var-recorder',
      // ['babel-plugin-ILA', {
      //   executedIn: 'file'
      // }],
      // ['babel-plugin-databindings', {
      //   executedIn: 'file'
      // }],
      // ['babel-plugin-active-expression-rewriting', {
      //   executedIn: 'workspace'
      // }],
      // ['babel-plugin-databindings-post-process', {
      //   executedIn: 'file'
      // }],
      // ['babel-plugin-active-expression-proxies', {
      //   executedIn: 'workspace'
      // }]





// some plugins will break the AST!
export function eslintPlugins() {
  return  [
    babel7.babelPluginSyntaxClassProperties,
    babel7.babelPluginSyntaxFunctionBind,
    babel7.babelPluginProposalDoExpressions,
    babelPluginSyntaxJSX
  ];
}


export function basePlugins() {
  return  [
    babel7.babelPluginProposalExportDefaultFrom,
    babel7.babelPluginProposalExportNamespaceFrom,
    babel7.babelPluginSyntaxClassProperties,
    // babel7.babelPluginSyntaxFunctionBind,
    babel7.babelPluginProposalDoExpressions,
    babel7.babelPluginNumericSeparator,
    babel7.babelPluginProposalFunctionBind,
    babel7.babelPluginProposalOptionalChaining,
    babelPluginJsxLively
  ];
}

export function livelyPlugins() {
  return [
      [babelPluginActiveExpressionRewriting, {
        executedIn: "file"
      }],
      [babelPluginActiveExpressionProxies, {
        executedIn: "file"
      }], // #TODO make optional again
      babelPluginConstraintConnectorsActiveExpression,
      babelPluginConstraintConnectors,
      babelPluginPolymorphicIdentifiers,
      babelPluginDatabindings,
      babelPluginDatabindingsPostProcess,
    ]
}

export function doitPlugins() {
  return [
    babelPluginLocals,
    babelPluginDoitResult,
    babelPluginDoitThisRef,
  ]
}

export function plugins(options={}) {
  var result = basePlugins()
  
  if (!options.noCustomPlugins) {
    result.push(babelPluginVarRecorder)
    result.push(...livelyPlugins())
  }

  if (options.livelyworkspace) {
    result.push(...doitPlugins())
  }
  
  if (!options.fortesting) {
    result.push(babel7.babelPluginProposalDynamicImport)
    result.push([babel7.babelPluginTransformModulesSystemJS, {
      allowTopLevelThis:  true
    }])      
  }
  return result
}

export function stage3SyntaxFlags() {
  return [
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
}

export function parseForAST(code, options) {
  return babel.transform(code, {
    filename: undefined,
    sourceMaps: false,
    compact: false,
    sourceType: 'module',
    moduleIds: false,
    comments: true,
    code: true,
    ast: true,
    parserOpts: {
      plugins: stage3SyntaxFlags(),
      errorRecovery: true,
      ranges: true,
      tokens: true, // TODO Performance warning in migration guide
    },
    plugins: eslintPlugins()
  })  
}

export function parseToCheckSyntax(source, options={}) {
  var result = babel.transform(source, {
    filename: undefined,
    sourceMaps: false,
    ast: false,
    compact: false,
    sourceType: 'module',
    parserOpts: {
      plugins: stage3SyntaxFlags(),
      errorRecovery: true
    },
    plugins: options.plugins || basePlugins()
  })
  return result.ast;
}




export async function transformSourceForTest(source, noCustomPlugins) {   
    var output
    var allPlugins = plugins({
      livelyworkspace: false,
      fortesting: true,
      noCustomPlugins: noCustomPlugins,
    })  
    let stage3Syntax = stage3SyntaxFlags()

    try {
      output = babel.transform(source, {
        filename: "foobar.js",
        sourceMaps: undefined,
        ast: false,
        compact: false,
        sourceType: 'module',
        parserOpts: {
          plugins: stage3Syntax,
          errorRecovery: true
        },
        plugins: allPlugins
      });      
    } catch(e) {
      console.log("ERROR transpiling code with babel7:", e)
      throw e
    }
  return output
}


export async function transformSource(load, babelOptions, config) {   
    var output
    var allPlugins = plugins({
      livelyworkspace: babelOptions.livelyworkspace && !config.fortesting,
      fortesting: config.fortesting
    })  
    let stage3Syntax = stage3SyntaxFlags()

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
        plugins: allPlugins
      });      
    } catch(e) {
      console.log("ERROR transpiling code with babel7:", e)
      throw e
    }
  return output
}
