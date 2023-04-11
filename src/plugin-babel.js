/*MD # Custom Babel7 Plugin for SystemJS MD*/
var bootLog = self.lively4bootlog || function() {} // Performance Benchmark

/*globals exports module require */

var modularHelpersPath = System.decanonicalize('./babel-helpers/', module.id);
var externalHelpersPath = System.decanonicalize('./babel-helpers.js', module.id);

if (modularHelpersPath.substr(modularHelpersPath.length - 3, 3) == '.js')
  modularHelpersPath = modularHelpersPath.substr(0, modularHelpersPath.length - 3);

// in builds we want to embed canonical names to helpers
if (System.getCanonicalName) {
  modularHelpersPath = System.getCanonicalName(modularHelpersPath);
  externalHelpersPath = System.getCanonicalName(externalHelpersPath);
}


// disable SystemJS runtime detection
SystemJS._loader.loadedTranspilerRuntime = true;

function prepend(a, b) {
  for (var p in b)
    if (!(p in a))
      a[p] = b[p];
  return a;
}

/*
 * babelOptions:
 *   modularRuntime: true / false (whether to use babel-runtime or babel/external-helpers respectively)
 *   sourceMaps: true / false (defaults to true)
 *   es2015: true / false (defaults to true)
 *   stage3: true / false (defaults to true)
 *   stage2: true / false (defaults to true)
 *   stage1: true / false (defaults to false)
 *   plugins: array of custom plugins (objects or module name strings)
 *   presets: array of custom presets (objects or module name strings)
 *   compact: as in Babel
 *   comments: as in Babel
 *
 * babelOptions can be set at SystemJS.babelOptions OR on the metadata object for a given module
 */
var defaultBabelOptions = {
  modularRuntime: true,
  sourceMaps: true,
  es2015: true,
  stage3: true,
  stage2: true,
  stage1: false,
  compact: false,
  comments: true
};

var DebugKey = "LayersXXXX.js"
var DebugId = "" + Math.random()

function debugOnKey(key) {
  if (key && (key + "").match(DebugKey)) {
    debugger
  }
}

function debugIsClient() {
  return self && self.constructor && self.constructor.name == "Window"
}

var LoggingEnabled = false;

function debugLog(...args) {

  if (LoggingEnabled && debugIsClient()) {
    console.log(...args)
  } else {
    // don't log worker....
  }
}


var debugBabelOptions = []

exports.translate = async function(load, traceOpts) {
  var cacheKey = load.name
  var key = load.name
  
  debugLog("[plugin-babel] plugin-babel transform " + DebugId, load.name)

  // we need babel7 also for some cached files?
  // await eval(`import('${lively4url + "/src/external/babel/babel7.js"}')`)

  // we don't transpile anything other than CommonJS or ESM
  if (load.metadata.format == 'global' || load.metadata.format == 'amd' || load.metadata.format == 'json')
    throw new TypeError('plugin-babel cannot transpile ' + load.metadata.format + ' modules. Ensure "' + load.name +
      '" is configured not to use this loader.');

  var loader = this;
  var pluginLoader = loader.pluginLoader || loader;

  // we only output ES modules when running in the builder
  var outputESM = traceOpts ? traceOpts.outputESM : loader.builder;

  var babelOptions = {};

  
  if (load.metadata.babelOptions)
    prepend(babelOptions, load.metadata.babelOptions);

  if (loader.babelOptions)
    prepend(babelOptions, loader.babelOptions);

  prepend(babelOptions, defaultBabelOptions);

  debugBabelOptions.push(babelOptions)

  
  if (babelOptions.modularRuntime) {
    if (load.metadata.format == 'cjs')
      throw new TypeError(
        'plugin-babel does not support modular runtime for CJS module transpilations. Set babelOptions.modularRuntime: false if needed.'
      );
  } else {
    if (load.metadata.format == 'cjs')
      load.source = 'var babelHelpers = require("' + externalHelpersPath + '");' + load.source;
    else
      load.source = 'import babelHelpers from "' + externalHelpersPath + '";' + load.source;
  }
  var startTransform = performance.now()
  let cachedInputCode, cachedOutputCode, cachedOutputMap
  var useCache

  // now we get dirty... both indexDB and caches API are pretty slow... so fuck it, we hack around their limiations! Do you hear me chrome god, we are going to fuck with you!
  // #Idea: preload everything into memory.... and bulk store the transpilation results after boot  
  if (self.lively4transpilationCache && !System.forceRetranspilation) {
    var cached = self.lively4transpilationCache.cache.get(key)
    if (cached) {

      if (load.source == cached.input) {

        debugLog("[plugin-babel] USE CACHE " + key)
        useCache = true

        cachedInputCode = cached.input
        cachedOutputCode = cached.output
        cachedOutputMap = cached.map
      } else {
        debugLog("[plugin-babel] Input changed... " + key)
      }
    } else {
      debugLog("[plugin-babel] NOT IN CACHE " + key)
    }
  }

  if (cachedOutputCode) {
    debugLog("plugin babel use cache: " + load.name)
    if (cachedInputCode == load.source) {
      try {
        output = {
          code: cachedOutputCode,
          map: cachedOutputMap
        }
      } catch (e) {
        console.warn("something went wrong... while loading cache " + e)
        output = undefined
      }
    } else {
      debugLog("[plugin-babel] cachedInputCode does not match load.source " + key)
    }
  } else {
    debugLog("[plugin-babel] no cachedOutputCode for " + key)
  }

  // debugLog(`cached output = `, output);
  debugOnKey("https://lively-kernel.org/lively4/lively4-jens/src/client/files.js")

  if (!output) {
    if (useCache) {
      console.warn("USED CACHE but not output... this should not happen!")
      debugger
    }

    debugLog(`[plugin-babel] update needed: ` + cacheKey);
    var config = {
      filename: load.address 
    }
    window.lively4lastSystemJSBabelConfig = Object.assign({}, config) // for debugging and AST Explorer

    var output
    if (babelOptions.babel7) {
      output = await pluginBabel7_transformSource(load, babelOptions, config, pluginLoader)
    } else {
      throw new Error("Babel6 is not supported any more")
      // output = babel.transform(load.source, config);
    }

    var cache = {
      input: load.source,
      output: output.code,
      map: output.map
    }

    if (self.lively4transpilationCache) {
      self.lively4transpilationCache.update(cacheKey, cache)
    }

    if (!self.babelTransformTimer) self.babelTransformTimer = []
    self.babelTransformTimer.push({
      name: load.name,
      size: load.source.length,
      time: (performance.now() - startTransform)
    })
  }

  var performanceTime = performance.now() - startTransform;
  if (cachedOutputCode) {
    debugLog("[plugin-babel] CACHED output " + performanceTime + "ms")
  } else {
    debugLog("[plugin-babel] UPDATE transformed " + load.name + " in " + performanceTime + "ms")
  }
  bootLog(load.name, Date.now(), cachedOutputCode ? "cached" : "transpiled", performanceTime)

  // add babelHelpers as a dependency for non-modular runtime
  if (!babelOptions.modularRuntime)
    load.metadata.deps.push(externalHelpersPath);

  // set output module format
  // (in builder we output modules as esm)
  if (!load.metadata.format || load.metadata.format == 'detect' || load.metadata.format == 'esm')
    load.metadata.format = outputESM ? 'esm' : 'register';

  load.metadata.sourceMap = output.map;

  return output.code;
};


/*MD 
# Babel 7

MD*/

/* BABEL 7 COMES HERE*/
var babel7 = window.lively4babel // for reevaluating...
var babel7babel = babel7 ? babel7.babel : undefined

async function pluginBabel7_transformSource(load, babelOptions, config, pluginLoader) {


  async function bootstrap_import(modulePath) {

    /*MD ## babel6 transpile bootstrap MD*/
    // return pluginLoader.normalize(modulePath, module.id)
    //      .then(function(normalized) {
    //        // #TODO #Bootstrap alternative mini SystemJS to resolve recursion problems...
    //        return pluginLoader.load(normalized)
    //          .then(function() {
    //            var result = pluginLoader.get(normalized)['default'];
    //            result.livelyLocation = normalized // #Hack #Lively4  rember the URL so, we can use it in AST Explorer
    //            return result
    //          });
    // })


    /*MD ## Native hard to work on escape to native modules MD*/
    var normalized = System.normalizeSync(modulePath, module.id)


    // return System.import(...rest)
  }

  // special case: use native loading for base babel7
  // we are stupid and unsure about everything #TODO
  await eval(`import('${lively4url + "/src/external/babel/babel7.js"}')`)

  babel7 = window.lively4babel
  babel7babel = babel7.babel

  var output = await transformSource(load, babelOptions, config)

  return output
}


var babelPluginSyntaxJSX

async function loadPlugins() {

  // await load Babel7
  // babelPluginSyntaxJSX = await loadPlugin('babelPluginJsxLively')
}
exports.loadPlugins = loadPlugins

// some plugins will break the AST!
function eslintPlugins() {
  var result = [
    babel7.babelPluginSyntaxClassProperties,
    babel7.babelPluginSyntaxFunctionBind,
    babel7.babelPluginProposalDoExpressions,
    babel7.babelPluginTransformReactJsx
  ];
  
  // #TODO #Warning here we have code that needs to be sync, but has async dependencies...
  // current solution: add the optional async stuff later when it is done and hope for the best
  // and allow code that is aware of this to laod the async plugins *loadPlugins* 
  // if (babelPluginSyntaxJSX) {
  //   result.push(babelPluginSyntaxJSX)
  // } else {
  //    loadPlugin('babelPluginJsxLively').then(plugin => {
  //      babelPluginSyntaxJSX = plugin 
  //    })
  // }
  return result  
}
exports.eslintPlugins = eslintPlugins

async function basePlugins() {
  // babelPluginSyntaxJSX = await loadPlugin('babelPluginJsxLively')
  
  return [
    babel7.babelPluginProposalExportDefaultFrom,
    babel7.babelPluginProposalExportNamespaceFrom,
    babel7.babelPluginSyntaxClassProperties,
    // babel7.babelPluginSyntaxFunctionBind,
    babel7.babelPluginProposalDoExpressions,
    babel7.babelPluginNumericSeparator,
    babel7.babelPluginProposalFunctionBind,
    babel7.babelPluginProposalOptionalChaining,
    // babelPluginSyntaxJSX
  ];
}


async function livelyPlugins() {
  return [
    [await loadPlugin('babelPluginActiveExpressionRewriting'), {
      executedIn: "file"
    }],
    [await loadPlugin('babelPluginActiveExpressionProxies'), {
      executedIn: "file"
    }], // #TODO make optional again
    await loadPlugin('babelPluginConstraintConnectorsActiveExpression'),
    await loadPlugin('babelPluginConstraintConnectors'),
    await loadPlugin('babelPluginPolymorphicIdentifiers'),
    await loadPlugin('babelPluginDatabindings'),
    await loadPlugin('babelPluginDatabindingsPostProcess'),
  ]
}


async function doitPlugins() {
  return [
    await loadPlugin('babelPluginLocals'),
    await loadPlugin('babelPluginDoitResult'),
    await loadPlugin('babelPluginDoitThisRef'),
  ]
}

async function loadPlugin(name) {
  var mapping = {
    babelPluginJsxLively: "src/client/reactive/reactive-jsx/babel-plugin-jsx-lively.js",
    babelPluginConstraintConnectorsActiveExpression: 'src/client/reactive/babel-plugin-constraint-connectors-active-expression/babel-plugin-constraint-connectors-active-expression.js',
    babelPluginConstraintConnectors: 'src/client/reactive/babel-plugin-constraint-connectors/babel-plugin-constraint-connectors.js',
    babelPluginPolymorphicIdentifiers: 'src/client/reactive/babel-plugin-polymorphic-identifiers/babel-plugin-polymorphic-identifiers.js',
    babelPluginRp19JSX: 'src/client/reactive/rp19-jsx/babel-plugin-rp19-jsx.js',
    babelPluginILA: 'src/client/reactive/babel-plugin-ILA/index.js',
    babelPluginDatabindings: 'src/client/reactive/babel-plugin-databindings/index.js',
    babelPluginActiveExpressionRewriting: 'src/client/reactive/babel-plugin-active-expression-rewriting/index.js',
    babelPluginDatabindingsPostProcess: 'src/client/reactive/babel-plugin-databindings/post-process.js',
    babelPluginActiveExpressionProxies: 'src/client/reactive/babel-plugin-active-expression-proxies/index.js',
    babelPluginTransformFunctionBind: 'src/external/babel-plugin-transform-function-bind.js',
    babelPluginSyntaxAsyncGenerators: 'src/external/babel-plugin-syntax-async-generators.js',
    babelPluginSyntaxObjectRestSpread: 'src/external/babel-plugin-syntax-object-rest-spread.js',
    babelPluginSyntaxClassProperties: 'src/external/babel-plugin-syntax-class-properties.js',
    babelPluginVarRecorder: 'src/external/babel-plugin-var-recorder.js',
    babelPluginLocals: 'src/external/babel-plugin-locals.js',
    babelPluginDoitResult: 'src/external/babel-plugin-doit-result.js',
    babelPluginDoitThisRef: 'src/external/babel-plugin-doit-this-ref.js',
    babelPluginSyntaxJSX: 'src/external/babel-plugin-syntax-jsx.js',
  }

  var path = mapping[name]
  if (!path) {
    throw new Error('we are very sad')
  }
  var mod = await System.import(path) // we hope this recursion is fine, because these modules should only depend on more basic stuff

  return mod.default
}

async function defaultPlugins(options = {}) {

  var result = await basePlugins()

  if (!options.noCustomPlugins) {
    result.push(await loadPlugin('babelPluginVarRecorder'))
    result.push(...await livelyPlugins())
  }

  if (options.livelyworkspace) {
    result.push(...await doitPlugins())
  }

  if (!options.fortesting) {
    result.push(babel7.babelPluginProposalDynamicImport)
    result.push([babel7.babelPluginTransformModulesSystemJS, {
      allowTopLevelThis: true
    }])
  }
  return result
}

// babel7liveES7
async function babel7liveES7Plugins(options = {}) {
  var result = [
    [await loadPlugin('babelPluginRp19JSX'), {
      executedIn: 'file'
    }],
    [await loadPlugin('babelPluginJsxLively'), {
      executedIn: 'file'
    }],
    babel7.babelPluginProposalDoExpressions,
    await loadPlugin('babelPluginTransformFunctionBind'),
    await loadPlugin('babelPluginSyntaxAsyncGenerators'),
    await loadPlugin('babelPluginSyntaxObjectRestSpread'),
    await loadPlugin('babelPluginSyntaxClassProperties'),
    await loadPlugin('babelPluginLocals'), // #TODO: remove this plugin from here
    await loadPlugin('babelPluginVarRecorder')
  ]
  if (!options.fortesting) {
    result.push(babel7.babelPluginProposalDynamicImport)
    result.push([babel7.babelPluginTransformModulesSystemJS, {
      allowTopLevelThis: true
    }])
  }
  return result
}
exports.babel7liveES7Plugins = babel7liveES7Plugins

// aexprViaDirective
async function aexprViaDirectivePlugins(options = {}) {
  var result = [
    await loadPlugin('babelPluginConstraintConnectorsActiveExpression'),
    await loadPlugin('babelPluginConstraintConnectors'),
    await loadPlugin('babelPluginPolymorphicIdentifiers'),
    [await loadPlugin('babelPluginRp19JSX'), {
      executedIn: 'file'
    }],
    [await loadPlugin('babelPluginJsxLively'), {
      executedIn: 'file'
    }],
    babel7.babelPluginProposalDoExpressions,
    // 'babel-plugin-transform-do-expressions',
    await loadPlugin('babelPluginTransformFunctionBind'),
    await loadPlugin('babelPluginSyntaxAsyncGenerators'),
    await loadPlugin('babelPluginSyntaxObjectRestSpread'),
    await loadPlugin('babelPluginSyntaxClassProperties'),
    await loadPlugin('babelPluginVarRecorder'),
    [await loadPlugin('babelPluginILA'), {
      executedIn: 'file'
    }],
    [await loadPlugin('babelPluginDatabindings'), {
      executedIn: 'file'
    }],
    [await loadPlugin('babelPluginActiveExpressionRewriting'), {
      enableViaDirective: true,
      executedIn: 'file'
    }],
    [await loadPlugin('babelPluginDatabindingsPostProcess'), {
      executedIn: 'file'
    }],
    [await loadPlugin('babelPluginActiveExpressionProxies'), {
      executedIn: 'file'
    }]
  ]
  if (!options.fortesting) {
    result.push(babel7.babelPluginProposalDynamicImport)
    result.push([babel7.babelPluginTransformModulesSystemJS, {
      allowTopLevelThis: true
    }])
  }
  return result
}
exports.aexprViaDirectivePlugins = aexprViaDirectivePlugins

// workspace
async function workspacePlugins(options = {}) {
  var result = [
    // lively4url + '/demos/swe/debugging-plugin.js',
  ]
  result.push(...[
    // Demo Plugin / belongs to @onsetsu
    // (await System.import(lively4url + '/demos/swe/debugging-plugin.js')).default,
    [await loadPlugin('babelPluginConstraintConnectorsActiveExpression'), {
      executedIn: 'workspace'
    }],
    [await loadPlugin('babelPluginConstraintConnectors'), {
      executedIn: 'workspace'
    }],
    [await loadPlugin('babelPluginPolymorphicIdentifiers'), {
      executedIn: 'workspace'
    }],
    [await loadPlugin('babelPluginRp19JSX'), {
      executedIn: 'workspace'
    }],
    [await loadPlugin('babelPluginJsxLively'), {
      executedIn: 'workspace'
    }]
  ])

  result.push(...[
    babel7.babelPluginProposalExportDefaultFrom,
    babel7.babelPluginProposalExportNamespaceFrom,
    babel7.babelPluginSyntaxClassProperties,
    // babel7.babelPluginSyntaxFunctionBind,
    babel7.babelPluginProposalDoExpressions,
    babel7.babelPluginNumericSeparator,
    babel7.babelPluginProposalFunctionBind,
    babel7.babelPluginProposalOptionalChaining,

    await loadPlugin('babelPluginTransformFunctionBind'),
    await loadPlugin('babelPluginSyntaxAsyncGenerators'),
    await loadPlugin('babelPluginSyntaxObjectRestSpread'),
    await loadPlugin('babelPluginSyntaxClassProperties')
  ])


  result.push(...await doitPlugins())
  result.push(...[
    await loadPlugin('babelPluginVarRecorder'),
    [await loadPlugin('babelPluginILA'), {
      executedIn: 'file'
    }],
    [await loadPlugin('babelPluginDatabindings'), {
      executedIn: 'file'
    }],
    [await loadPlugin('babelPluginActiveExpressionRewriting'), {
      executedIn: 'workspace'
    }],
    [await loadPlugin('babelPluginDatabindingsPostProcess'), {
      executedIn: 'file'
    }],
    [await loadPlugin('babelPluginActiveExpressionProxies'), {
      executedIn: 'workspace'
    }]
  ])
  if (!options.fortesting) {
    result.push(babel7.babelPluginProposalDynamicImport)
    result.push([babel7.babelPluginTransformModulesSystemJS, {
      allowTopLevelThis: true
    }])
  }
  return result
}
exports.workspacePlugins = workspacePlugins

function stage3SyntaxFlags() {
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
    'topLevelAwait'
  ];
}

// this has to be in sync, e.g. eslint hands it down... 
function parseForAST(code, options) {
  return babel7babel.transform(code, {
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

exports.parseForAST = parseForAST

function parseToCheckSyntax(source, options = {}) {
  var result = babel7babel.transform(source, {
    filename: undefined,
    sourceMaps: false,
    ast: false,
    compact: false,
    sourceType: 'module',
    parserOpts: {
      plugins: stage3SyntaxFlags(),
      errorRecovery: true
    },
    plugins: options.plugins ||  eslintPlugins()
  })
  return result.ast;
}
exports.parseToCheckSyntax = parseToCheckSyntax


async function transformSourceForTestWithPlugins(source, plugins) {
  var output
  let stage3Syntax = stage3SyntaxFlags()
  try {
    output = babel7babel.transform(source, {
      filename: "file.js",
      sourceMaps: undefined,
      ast: false,
      compact: false,
      sourceType: 'module',
      parserOpts: {
        plugins: stage3Syntax,
        errorRecovery: true
      },
      plugins: plugins
    });
  } catch (e) {
    console.log("ERROR transpiling code with babel7:", e)
    throw e
  }
  return output
}
exports.transformSourceForTestWithPlugins = transformSourceForTestWithPlugins

async function transformSourceForTest(source, noCustomPlugins) {
  var allPlugins = await defaultPlugins({
    livelyworkspace: false,
    fortesting: true,
    noCustomPlugins: noCustomPlugins,
  })
  return transformSourceForTestWithPlugins(source, allPlugins)
}
exports.transformSourceForTest = transformSourceForTest


async function transformSource(load, babelOptions, config) {
  var output
  var allPlugins = []
  var stage3Syntax = []
  
  console.log(`transformSource ${config.filename} ${babelOptions.babel7level}`)

  if (babelOptions.babel7level == "moduleOptionsNon") {
    allPlugins.push(babel7.babelPluginProposalDynamicImport)
    allPlugins.push([babel7.babelPluginTransformModulesSystemJS, {
      allowTopLevelThis: true
    }])

  } else if (babelOptions.babel7level == "liveES7") {
    allPlugins.push(...await babel7liveES7Plugins())
  } else if (babelOptions.babel7level == "aexprViaDirective") {
    allPlugins.push(...await aexprViaDirectivePlugins())
    stage3Syntax = stage3SyntaxFlags()
  } else if (babelOptions.babel7level == "workspace") {
    allPlugins.push(...await workspacePlugins())
  } else {
    // fall back
    allPlugins = await defaultPlugins({
      livelyworkspace: babelOptions.livelyworkspace && !config.fortesting,
      fortesting: config.fortesting
    })
    stage3Syntax = stage3SyntaxFlags()
  }


  try {
    output = babel7babel.transform(load.source, {
      filename: config.filename,
      sourceMaps: true, // true 
      ast: false,
      compact: false,
      sourceType: 'module',
      parserOpts: {
        plugins: stage3Syntax,
        errorRecovery: true
      },
      plugins: allPlugins
    });
  } catch (e) {

    console.log(`ERROR transpiling ${config.filename } with babel7:`, e)
    throw e
  }
  return output
}
exports.transformSource = transformSource
