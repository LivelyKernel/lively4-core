System.register([], function(_export, _context) {
return {
  setters: [],
  execute: async function() {
/*MD # Custom Babel7 Plugin for SystemJS MD*/
var bootLog = self.lively4bootlog || function() {} // Performance Benchmark

/*globals exports module require */


// disable SystemJS runtime detection

// System._loader.loadedTranspilerRuntime = true; // #TODO ??? what in new version?

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
  comments: true,
  babel7: true,
  babel7level: "moduleOptionsNon"
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

async function translate(load, traceOpts) {
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


  // set output module format
  // (in builder we output modules as esm)
  if (!load.metadata.format || load.metadata.format == 'detect' || load.metadata.format == 'esm')
    load.metadata.format = outputESM ? 'esm' : 'register';

  load.metadata.sourceMap = output.map;

  return output.code;
};

_export("translate", translate)
globalThis.lively4babelTranslate = translate

/*MD 
# Babel 7

MD*/

/* BABEL 7 COMES HERE*/
var babel7 = window.lively4babel // for reevaluating...
var babel7babel = babel7 ? babel7.babel : undefined


var babel7promise


async function loadBabel7() {
  if (!babel7promise) 
  babel7promise = new Promise(async (resolve) => {
    var code = await fetch(lively4url +"/src/external/babel/babel7.js").then(r => r.text())
    resolve(eval(code))
  }) 
  return babel7promise
}

async function pluginBabel7_transformSource(load, babelOptions, config, pluginLoader) {

  async function bootstrap_import(modulePath) {

    /*MD ## Native hard to work on escape to native modules MD*/
    var normalized = System.normalizeSync(modulePath, module.id)


    // return System.import(...rest)
  }

  // special case: use native loading for base babel7
  // we are stupid and unsure about everything #TODO
  // await eval(`import('${lively4url + "/src/external/babel/babel7.js"}')`)
  await loadBabel7()
  
  babel7 = window.lively4babel
  babel7babel = babel7.babel

  var output = await transformSource(load, babelOptions, config)

  return output
}


var babelPluginSyntaxJSX

async function loadPlugins() {

  // await load Babel7
   // const babelPluginSyntaxJSX2 = await loadPlugin('babel-plugin-jsx-lively')
   babelPluginSyntaxJSX = await importDefaultOf('babel-plugin-syntax-jsx')
  
}
_export("loadPlugins", loadPlugins)

if (!babelPluginSyntaxJSX) {
  loadPlugins()  
}


// some plugins will break the AST!
function eslintPlugins() {
  var result = [
    babel7.babelPluginSyntaxClassProperties,
    babel7.babelPluginSyntaxFunctionBind,
    babel7.babelPluginProposalDoExpressions,
    // babel7.babelPluginTransformReactJsx
  ];
  
  // #TODO #Warning here we have code that needs to be sync, but has async dependencies...
  // current solution: add the optional async stuff later when it is done and hope for the best
  // and allow code that is aware of this to laod the async plugins *loadPlugins* 
  if (babelPluginSyntaxJSX) {
    result.push(babelPluginSyntaxJSX)
  }
  return result  
}
_export("eslintPlugins", eslintPlugins)

async function basePlugins() {
  // babelPluginSyntaxJSX = await loadPlugin('babel-plugin-jsx-lively')
  
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
    [await importDefaultOf('babel-plugin-sample-data-bindings'), {
      executedIn: "file"
    }],
    [await importDefaultOf('babel-plugin-active-expression-rewriting'), {
      executedIn: "file"
    }],
    [await importDefaultOf('babel-plugin-active-expression-proxies'), {
      executedIn: "file"
    }], // #TODO make optional again
    await importDefaultOf('babel-plugin-constraint-connectors-active-expression'),
    await importDefaultOf('babel-plugin-constraint-connectors'),
    await importDefaultOf('babel-plugin-polymorphic-identifiers'),
    await importDefaultOf('babel-plugin-databindings'),
    await importDefaultOf('babel-plugin-databindings-post-process'),
  ]
}


async function doitPlugins() {
  return [
    await importDefaultOf('babel-plugin-locals'),
    await importDefaultOf('babel-plugin-doit-result'),
    await importDefaultOf('babel-plugin-doit-this-ref'),
  ]
}

async function importDefaultOf(name) {
  // we hope this recursion is fine, because these modules should only depend on more basic stuff
  const mod = await System.import(name);
  return mod.default;
}

async function defaultPlugins(options = {}) {

  var result = await basePlugins()

  if (!options.noCustomPlugins) {
    result.push(await importDefaultOf('babel-plugin-var-recorder'))
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
    [await importDefaultOf('babel-plugin-rp19-jsx'), {
      executedIn: 'file'
    }],
    [await importDefaultOf('babel-plugin-jsx-lively'), {
      executedIn: 'file'
    }],
    babel7.babelPluginProposalDoExpressions,
    await importDefaultOf('babel-plugin-transform-function-bind'),
    await importDefaultOf('babel-plugin-syntax-async-generators'),
    await importDefaultOf('babel-plugin-syntax-object-rest-spread'),
    await importDefaultOf('babel-plugin-syntax-class-properties'),
    await importDefaultOf('babel-plugin-locals'), // #TODO: remove this plugin from here
    await importDefaultOf('babel-plugin-var-recorder'),
    await importDefaultOf('babel-plugin-system-activity-tracer'),
  ]
  if (!options.fortesting) {
    result.push(babel7.babelPluginProposalDynamicImport)
    result.push([babel7.babelPluginTransformModulesSystemJS, {
      allowTopLevelThis: true
    }])
  }
  return result
}
_export("babel7liveES7Plugins", babel7liveES7Plugins)

// aexprViaDirective
async function aexprViaDirectivePlugins(options = {}) {
  var result = [
    await importDefaultOf('babel-plugin-constraint-connectors-active-expression'),
    await importDefaultOf('babel-plugin-constraint-connectors'),
    await importDefaultOf('babel-plugin-polymorphic-identifiers'),
    [await importDefaultOf('babel-plugin-rp19-jsx'), {
      executedIn: 'file'
    }],
    [await importDefaultOf('babel-plugin-jsx-lively'), {
      executedIn: 'file'
    }],
    babel7.babelPluginProposalDoExpressions,
    // 'babel-plugin-transform-do-expressions',
    await importDefaultOf('babel-plugin-transform-function-bind'),
    await importDefaultOf('babel-plugin-syntax-async-generators'),
    await importDefaultOf('babel-plugin-syntax-object-rest-spread'),
    await importDefaultOf('babel-plugin-syntax-class-properties'),
    await importDefaultOf('babel-plugin-var-recorder'),
    [await importDefaultOf('babel-plugin-ILA'), {
      executedIn: 'file'
    }],
    [await importDefaultOf('babel-plugin-sample-data-bindings'), {
      executedIn: 'file'
    }],
    [await importDefaultOf('babel-plugin-databindings'), {
      executedIn: 'file'
    }],
    [await importDefaultOf('babel-plugin-active-expression-rewriting'), {
      enableViaDirective: true,
      executedIn: 'file'
    }],
    [await importDefaultOf('babel-plugin-databindings-post-process'), {
      executedIn: 'file'
    }],
    [await importDefaultOf('babel-plugin-active-expression-proxies'), {
      executedIn: 'file'
    }],
    await importDefaultOf('babel-plugin-system-activity-tracer'),
  ]
  if (!options.fortesting) {
    result.push(babel7.babelPluginProposalDynamicImport)
    result.push([babel7.babelPluginTransformModulesSystemJS, {
      allowTopLevelThis: true
    }])
  }
  return result
}
_export("aexprViaDirectivePlugins", aexprViaDirectivePlugins)

// workspace
async function workspacePlugins(options = {}) {
  // console.log("workspacePlugins")
  var result = [
    // lively4url + '/demos/swe/debugging-plugin.js',
  ]
  result.push(...[
    // Demo Plugin / belongs to @onsetsu
    // (await System.import(lively4url + '/demos/swe/debugging-plugin.js')).default,
    [await importDefaultOf('babel-plugin-constraint-connectors-active-expression'), {
      executedIn: 'workspace'
    }],
    [await importDefaultOf('babel-plugin-constraint-connectors'), {
      executedIn: 'workspace'
    }],
    [await importDefaultOf('babel-plugin-polymorphic-identifiers'), {
      executedIn: 'workspace'
    }],
    [await importDefaultOf('babel-plugin-rp19-jsx'), {
      executedIn: 'workspace'
    }],
    [await importDefaultOf('babel-plugin-jsx-lively'), {
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

    await importDefaultOf('babel-plugin-transform-function-bind'),
    await importDefaultOf('babel-plugin-syntax-async-generators'),
    await importDefaultOf('babel-plugin-syntax-object-rest-spread'),
    await importDefaultOf('babel-plugin-syntax-class-properties')
  ])


  result.push(...await doitPlugins())
  
  result.push(await importDefaultOf('babel-plugin-var-recorder'))
  
  if (localStorage.getItem("DisableAExpWorkspace") !== "true") {
    result.push([await importDefaultOf('babel-plugin-ILA'), {
        executedIn: 'file'
      }])
    result.push([await importDefaultOf('babel-plugin-sample-data-bindings'), {
        executedIn: 'file'
      }])
    result.push([await importDefaultOf('babel-plugin-databindings'), {
        executedIn: 'file'
      }])
    result.push([await importDefaultOf('babel-plugin-active-expression-rewriting'), {
        executedIn: 'workspace'
      }])
    result.push([await importDefaultOf('babel-plugin-databindings-post-process'), {
        executedIn: 'file'
      }])
    result.push([await importDefaultOf('babel-plugin-active-expression-proxies'), {
      executedIn: 'workspace'
    }])
  }
  if (!options.fortesting) {
    result.push(babel7.babelPluginProposalDynamicImport)
    result.push([babel7.babelPluginTransformModulesSystemJS, {
      allowTopLevelThis: true
    }])
  }
  return result
}
_export("workspacePlugins", workspacePlugins)

const stage3SyntaxFlags= [
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
  'topLevelAwait',
  'doExpressions'
];


const allSyntaxFlags = [
  "asyncDoExpressions",
  "asyncGenerators",
  "bigInt",
  "classPrivateMethods",
  "classPrivateProperties",
  "classProperties",
  "classStaticBlock",
  "decimal",
  "decoratorAutoAccessors",
  "decorators",
  "decorators",
  "destructuringPrivate",
  "doExpressions",
  "dynamicImport",
  "explicitResourceManagement",
  "exportDefaultFrom",
  "exportNamespaceFrom",
  // "flow",
  // "flowComments",
  "functionBind",
  "functionSent",
  "importAssertions",
  "importReflection",
  "jsx",
  "logicalAssignment",
  "moduleBlocks",
  "moduleStringNames",
  "nullishCoalescingOperator",
  "numericSeparator",
  "objectRestSpread",
  "optionalCatchBinding",
  "optionalChaining",
  "partialApplication",
  ["pipelineOperator", {proposal: "smart"}],
  "privateIn",
  "recordAndTuple",
  "regexpUnicodeSets",
  "throwExpressions",
  "topLevelAwait",
  "typescript",
  // "v8intrinsic"
]
_export("allSyntaxFlags", allSyntaxFlags)

function parseForAST(code) {
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
      plugins: allSyntaxFlags,
      errorRecovery: true,
      ranges: true,
      tokens: true, // TODO Performance warning in migration guide
    },
    plugins: []
  })
}
_export("parseForAST", parseForAST)

// this has to be in sync, e.g. eslint hands it down... 
function parseForASTForESLint(code) {
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
      plugins: allSyntaxFlags,
      errorRecovery: true,
      ranges: true,
      tokens: true, // TODO Performance warning in migration guide
    },
    plugins: eslintPlugins()
  })
}
_export("parseForASTForESLint", parseForASTForESLint)

async function transformSourceForTestWithPlugins(source, plugins) {
  var output
  let stage3Syntax = stage3SyntaxFlags
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
_export("transformSourceForTestWithPlugins", transformSourceForTestWithPlugins)

async function transformSourceForTest(source, noCustomPlugins) {
  var allPlugins = await defaultPlugins({
    livelyworkspace: false,
    fortesting: true,
    noCustomPlugins: noCustomPlugins,
  })
  return transformSourceForTestWithPlugins(source, allPlugins)
}
_export("transformSourceForTest", transformSourceForTest)


async function transformSource(load, babelOptions, config) {
  var output
  var allPlugins = []
  var stage3Syntax = []
  
  // console.log(`transformSource ${config.filename} ${babelOptions.babel7level}`)

  if (babelOptions.babel7level == "moduleOptionsNon") {
    allPlugins.push(babel7.babelPluginProposalDynamicImport)
    allPlugins.push([babel7.babelPluginTransformModulesSystemJS, {
      allowTopLevelThis: true
    }])

  } else if (babelOptions.babel7level == "liveES7") {
    allPlugins.push(...await babel7liveES7Plugins())
  } else if (babelOptions.babel7level == "aexprViaDirective") {
    allPlugins.push(...await aexprViaDirectivePlugins())
    stage3Syntax = stage3SyntaxFlags
  } else if (babelOptions.babel7level == "workspace") {
    allPlugins.push(...await workspacePlugins())
  } else if (babelOptions.babel7level == "pluginExplorer") {
    allPlugins.push(babel7.babelPluginProposalDynamicImport)
    allPlugins.push([babel7.babelPluginTransformModulesSystemJS, {
      allowTopLevelThis: true
    }])
    for (var ea of babelOptions.babel7plugins) {
      allPlugins.push((await System.import(ea)).default) 
    }
  } else {
    // fall back
    allPlugins = await defaultPlugins({
      livelyworkspace: babelOptions.livelyworkspace && !config.fortesting,
      fortesting: config.fortesting
    })
    stage3Syntax = stage3SyntaxFlags
  }


  try {
    output = babel7babel.transform(load.source, {
      filename: config.filename,
      sourceMaps: 'inline', // true 
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
_export("transformSource", transformSource)
  
}}    
});