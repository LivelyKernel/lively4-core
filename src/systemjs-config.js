/*MD # Shared SystemJS Config 

Used both by:
- <edit://src/client/boot.js>
- <edit://src/worker/livelyworker.js>

MD*/

if (globalThis.window) {
  globalThis.window.SystemJS = System
}

var global = typeof self !== 'undefined' ? self : global;
var systemJSPrototype = global.System.constructor.prototype;

/*globals lively4babelTranslate globalThis */

/*MD ## Detect Formats MD*/



// var leadingCommentAndMetaRegEx = /^(\s*\/\*[^\*]*(\*(?!\/)[^\*]*)*\*\/|\s*\/\/[^\n]*|\s*"[^"]+"\s*;?|\s*'[^']+'\s*;?)*\s*/;

// function detectRegisterFormat(source) {
//   var leadingCommentAndMeta = source.match(leadingCommentAndMetaRegEx);
//   return leadingCommentAndMeta && source.substr(leadingCommentAndMeta[0].length, 15) === 'System.register';
// }

var cjsRequireRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF."'])require\s*\(\s*("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')\s*\)/g;

// AMD Module Format Detection RegEx
// define([.., .., ..], ...)
// define(varName); || define(function(require, exports) {}); || define({})
var amdRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF.])define\s*\(\s*("[^"]+"\s*,\s*|'[^']+'\s*,\s*)?\s*(\[(\s*(("[^"]+"|'[^']+')\s*,|\/\/.*\r?\n|\/\*(.|\s)*?\*\/))*(\s*("[^"]+"|'[^']+')\s*,?)?(\s*(\/\/.*\r?\n|\/\*(.|\s)*?\*\/))*\s*\]|function\s*|{|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*\))/;

/// require('...') || exports[''] = ... || exports.asd = ... || module.exports = ...
var cjsExportsRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF.])(exports\s*(\[['"]|\.)|module(\.exports|\['exports'\]|\["exports"\])\s*(\[['"]|[=,\.]))/;
// used to support leading #!/usr/bin/env in scripts as supported in Node

function detectLegacyFormat (source) {
  if (!source  || !source.match) return
  
  
  if (source.match(amdRegEx)) {
    if (source.match(/\nexport /g)) return // emergency fallback for e.g. codemirror6/external/codemirror.bundle.js
    return 'amd';
  }
  

  cjsExportsRegEx.lastIndex = 0;
  cjsRequireRegEx.lastIndex = 0;
  if (cjsRequireRegEx.exec(source) || cjsExportsRegEx.exec(source))
    return 'cjs';

  // global is the fallback format
  return 'global';
}




function isWorkspace(load) {
  return load.name.match(WORKSPACE_REGEX)
}


const WORKSPACE_REGEX = /^\/?workspace(async)?((js)|(ts))?:/

// export async function locate(load) {
//   // does the resolving relative workspace urls belong here? 
//   // it does not seem to work, but we have to do it here... because of transitive relative urls... etc... and we do want to get the same reference of existing modules...
 
//     // console.log('WORKSPACE LOADER locate', load.address);
  
//    if(isWorkspace(load)) {
//       var id = parseId(load);
//       var m = id.match(/^([^/]+\/)(.*)$/)
//       var baseId = m[1]
//       var targetModule = m[2]

//       if (targetModule.match(/\.js$/)) {
//         return new URL(lively4url).protocol + "//" + targetModule // we stripped the HTTP(S) earlier...
//       }
//     }
//   return 
// }





/*MD # Babel Plugin MD*/

// #important
async function systemFetch(url, options) {

   let loadMock = {
    name: url,
    address: url,
    metadata: System.getMeta(url.toString().replace(/\?.*/,""))
  }

   
  function parseId(load) {
    return decodeURI(load.name.replace(WORKSPACE_REGEX, ''));
  }
   
  let source

  if(isWorkspace(loadMock)) {
    var id = parseId(loadMock);
    source = self.lively4workspaces.get(loadMock.name);
    if (!source) {
      // we have a relative url that resolved to a real url...

      if (!loadMock.address.match(WORKSPACE_REGEX)) {
        return fetch.call(this, loadMock);        
      }
    }

    if (!source) {
      throw new Error("workspace loader: no code for " + id)
    }
  } else {
    source = await fetch(url, options).then(function (res) {
      if (!res.ok || jsonCssWasmContentType.test(res.headers.get('content-type'))) {
        return res;
      }
      return res.text()
    })      
  }

  loadMock.source = source
  if (!System.orignalSources) System.orignalSources = new Map();
  System.orignalSources.set(url, source)
  
  
  if (registerRegEx.test(source)) {
    return new Response(new Blob([source], { type: 'application/javascript' }));
  }

  var format = detectLegacyFormat(source)

  if (format == "amd") {
    source = "let define = globalThis.amdDefine;" + source
    return new Response(new Blob([source], { type: 'application/javascript' }));
  }

 
  if (loadMock.metadata.norewriting)  {
    return new Response(new Blob([source], { type: 'application/javascript' }));
  }

  let transformedCode
  try {
    // console.log("tranform code: " + url, System.getMeta(url))
    try {
      transformedCode = await lively4babelTranslate(loadMock)
    } catch(e) {
      console.error("ERROR transforming " + url, e)
    }
    // if (url.match(/preload/)) {
    //   debugger
    // }
  } catch(err) {
    debugger
    throw err
  }

  const code = transformedCode
  return new Response(new Blob([code], { type: 'application/javascript' })); 
}
systemJSPrototype.fetch = systemFetch




systemJSPrototype.shouldFetch = function () {
  return true;
};

var jsonCssWasmContentType = /^(application\/json|application\/wasm|text\/css)(;|$)/;
var registerRegEx = /System\s*\.\s*register\s*\(\s*(\[[^\]]*\])\s*,\s*\(?function\s*\(\s*([^\),\s]+\s*(,\s*([^\),\s]+)\s*)?\s*)?\)/;



// #Snippet This is how to hook into "instatiate":

// var originalInstantiate = systemJSPrototype.instantiate.originalFunction || systemJSPrototype.instantiate
// systemJSPrototype.instantiate = async function (url, firstParentUrl) {
//   // before
//   // window.define = window.amdDefine
//   console.log("instantiate BEFORE " + url)
//   var result = await systemJSPrototype.instantiate.originalFunction.call(this, url, firstParentUrl)
//   console.log("instantiate AFTER " + url)
//   // after
//   // window.define = null
//   return result
// };
// systemJSPrototype.instantiate.originalFunction = originalInstantiate


/*MD # SystemJS Legacy MD*/
function systemConfig(conf) {
  if(!this._config) this._config = {meta: {}}

  if (conf.meta){
    extend(this._config.meta, conf.meta);
  }
  
  if (conf.map) {
    System.addImportMap({imports: conf.map}, lively4url + "/")
  }
  // if (conf.paths) {
  //   System.addImportMap({scopes: conf.paths}, lively4url + "/")
  // }
  
}

systemJSPrototype.config = systemConfig

// hack: get Registry... there is only on object hidden...
systemJSPrototype.getRegistry = function() {
  return this[Object.getOwnPropertySymbols(this)[0]]
}

systemJSPrototype.getSource = function(url) {
  if (!System.orignalSources) return
  return System.orignalSources.get(url)
}


function wrapSystemJSLoad(o, map) {
  // data structure is recusive
  if (map.has(o.id)) return map.get(o.id)
  var wrapped =  {
      load: o,
      get id() {return this.load.id},
      get importerSetters(){return this.load.i},
      get namespace(){return this.load.n},
      get meta(){return this.load.m},
      get instantiatePromise(){return this.load.I},
      get linkPromise(){return this.load.L},
      get hoistedExports(){return this.load.h},
      get executionFunction(){return this.load.e},
      get executionError(){return this.load.er},
      get executionPromise(){return this.load.E},
      get toplevelCompletion(){return this.load.C},
      get parentInstantiator(){return this.load.p},
      get dependencies() {
        return this.dependencyLoadRecords.map(ea => ea.id)
      },
      get dependencyLoadRecords() {
        return (this.load.d || []).map(ea => wrapSystemJSLoad(ea, map));
      }
    }; 
  map.set(o.id, wrapped)
  return wrapped
}

// hack: get Registry... there is only on object hidden...
systemJSPrototype.getDependencies = function() {
  var map = new Map()
  return Object.keys(this.getRegistry()).map(ea => {
    var o = this.getRegistry()[ea]
    // #TODO idea: use getters to get live
    return wrapSystemJSLoad(o, map) 
  })
}


 

systemJSPrototype.getMeta = function(key) {
  var metadata = {}
  setMeta (this._config, key, metadata)
  return metadata.load
}

function createMeta () {
  return {
    extension: '',
    deps: undefined,
    format: undefined,
    loader: undefined,
    scriptLoad: undefined,
    globals: undefined,
    nonce: undefined,
    integrity: undefined,
    sourceMap: undefined,
    exports: undefined,
    encapsulateGlobal: false,
    crossOrigin: undefined,
    cjsRequireDetection: true,
    cjsDeferDepsExecute: false
  };
}

function extendMeta (a, b, prepend) {
  for (var p in b) {
    if (!b.hasOwnProperty(p))
      continue;
    var val = b[p];
    if (a[p] === undefined)
      a[p] = val;
    else if (val instanceof Array && a[p] instanceof Array)
      a[p] = [].concat(prepend ? val : a[p]).concat(prepend ? a[p] : val);
    else if (typeof val == 'object' && val !== null && typeof a[p] == 'object')
      a[p] = extend(extend({}, a[p]), val, prepend);
    else if (!prepend)
      a[p] = val;
  }
}


function extend (a, b, prepend) {
  for (var p in b) {
    if (!b.hasOwnProperty(p))
      continue;
    if (!prepend || a[p] === undefined)
      a[p] = b[p];
  }
  return a;
}

function getMetaMatches (pkgMeta, subPath, matchFn) {
  // wildcard meta
  var wildcardIndex;
  for (var module in pkgMeta) {
    // allow meta to start with ./ for flexibility
    var dotRel = module.substr(0, 2) === './' ? './' : '';
    if (dotRel)
      module = module.substr(2);

    wildcardIndex = module.indexOf('*');
    if (wildcardIndex === -1)
      continue;

    if (module.substr(0, wildcardIndex) === subPath.substr(0, wildcardIndex)
        && module.substr(wildcardIndex + 1) === subPath.substr(subPath.length - module.length + wildcardIndex + 1)) {
      // alow match function to return true for an exit path
      if (matchFn(module, pkgMeta[dotRel + module], module.split('/').length))
        return;
    }
  }
  // exact meta
  var exactMeta = pkgMeta[subPath] && pkgMeta.hasOwnProperty && pkgMeta.hasOwnProperty(subPath) ? pkgMeta[subPath] : pkgMeta['./' + subPath];
  if (exactMeta)
    matchFn(exactMeta, exactMeta, 0);
}

function setMeta (config, key, metadata) {
  metadata.load = metadata.load || createMeta();

  // apply wildcard metas
  var bestDepth = 0;
  var wildcardIndex;
  for (var module in config.meta) {
    wildcardIndex = module.indexOf('*');
    if (wildcardIndex === -1)
      continue;
    if (module.substr(0, wildcardIndex) === key.substr(0, wildcardIndex)
        && module.substr(wildcardIndex + 1) === key.substr(key.length - module.length + wildcardIndex + 1)) {
      var depth = module.split('/').length;
      if (depth > bestDepth)
        bestDepth = depth;
      extendMeta(metadata.load, config.meta[module], bestDepth !== depth);
    }
  }

  // apply exact meta
  if (config.meta[key])
    extendMeta(metadata.load, config.meta[key]);

  // apply package meta
  if (metadata.packageKey) {
    var subPath = key.substr(metadata.packageKey.length + 1);

    var meta = {};
    if (metadata.packageConfig.meta) {
      bestDepth = 0;

      getMetaMatches(metadata.packageConfig.meta, subPath, function (metaPattern, matchMeta, matchDepth) {
        if (matchDepth > bestDepth)
          bestDepth = matchDepth;
        extendMeta(meta, matchMeta, matchDepth && bestDepth > matchDepth);
      });

      extendMeta(metadata.load, meta);
    }

    // format
    if (metadata.packageConfig.format && !metadata.pluginKey)
      metadata.load.format = metadata.load.format || metadata.packageConfig.format;
  }
}





/*MD # System Map MD*/


// setup var recorder object
globalThis._recorder_ = globalThis._recorder_  || {_module_:{}}
globalThis.systemActivity = globalThis.systemActivity || {};

const moduleOptionsNon = {
  babelOptions: {
    plugins: [], 
    isModuleOptionsNon: true,
    babel7: true,
    babel7level: "moduleOptionsNon"
  }
};

const noRewriting = {
  norewriting: true, 
  babelOptions: {
    babel7: false,
  }
};

System.trace = true; // does not work in config




// config for loading babel plugins
System.config({
  baseURL: lively4url + '/', // needed for global refs like "src/client/lively.js", we have to refactor those before disabling this here. #TODO #Discussion
  meta: {
    '*.js': moduleOptionsNon,
  },
  map: {
    "three": "https://unpkg.com/three@latest/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@latest/examples/jsm/",
    "three/fonts/": "https://unpkg.com/three@latest/examples/fonts/",
    
    // #Discussion have to use absolute paths here, because it is not clear what the baseURL is
    'plugin-babel': lively4url + '/src/plugin-babel.js',
    // aexpr support
    
    'active-expression': lively4url + '/src/client/reactive/active-expression/active-expression.js',
    'active-expression-rewriting': lively4url + '/src/client/reactive/active-expression-rewriting/active-expression-rewriting.js',
    'active-expression-proxies': lively4url + '/src/client/reactive/active-expression-proxies/active-expression-proxies.js',
    'babel-plugin-active-expression-rewriting': lively4url + '/src/client/reactive/babel-plugin-active-expression-rewriting/index.js',
    'babel-plugin-ILA': lively4url + '/src/client/reactive/babel-plugin-ILA/index.js',
    'babel-plugin-sample-data-bindings': lively4url + '/src/client/reactive/babel-plugin-sample-data-bindings/sample-data-bindings.js',
    'babel-plugin-databindings': lively4url + '/src/client/reactive/babel-plugin-databindings/index.js',
    'babel-plugin-databindings-post-process': lively4url + '/src/client/reactive/babel-plugin-databindings/post-process.js',    
    'babel-plugin-active-expression-proxies': lively4url + '/src/client/reactive/babel-plugin-active-expression-proxies/index.js',
    'active-expression-frame-based': lively4url + '/src/client/reactive/active-expression-convention/active-expression-frame-based.js',
    'active-group': lively4url + '/src/client/reactive/active-group/select.js',

    // general tracing support
    'babel-plugin-system-activity-tracer': lively4url + '/src/plugins/babel-plugin-system-activity-tracer.js',
    
    // jsx support
    'babel-plugin-syntax-jsx': lively4url + '/src/external/babel-plugin-syntax-jsx.js',
    'babel-plugin-jsx-lively': lively4url + '/src/client/reactive/reactive-jsx/babel-plugin-jsx-lively.js',
    'babel-plugin-rp-jsx': lively4url + '/src/client/reactive/rp-jsx/babel-plugin-rp-jsx.js',
    'reactive-jsx': lively4url + '/src/client/reactive/reactive-jsx/reactive-jsx.js',
    'babel-plugin-rp19-jsx': lively4url + '/src/client/reactive/rp19-jsx/babel-plugin-rp19-jsx.js',
    'rp19-jsx': lively4url + '/src/client/reactive/rp19-jsx/rp19-jsx.js',

    // estree support
    'babel-plugin-estree': lively4url + '/src/external/babel-plugin-estree.js',
    
    // stage 0 support
    'babel-plugin-transform-do-expressions': lively4url + '/src/external/babel-plugin-transform-do-expressions.js',
    'babel-plugin-transform-function-bind': lively4url + '/src/external/babel-plugin-transform-function-bind.js',
    'babel-plugin-syntax-do-expressions': lively4url + '/src/external/babel-plugin-syntax-do-expressions.js',
    'babel-plugin-syntax-function-bind': lively4url + '/src/external/babel-plugin-syntax-function-bind.js',
    'babel-plugin-syntax-async-generators': lively4url + '/src/external/babel-plugin-syntax-async-generators.js',
    'babel-plugin-syntax-object-rest-spread': lively4url + '/src/external/babel-plugin-syntax-object-rest-spread.js',
    'babel-plugin-syntax-class-properties': lively4url + '/src/external/babel-plugin-syntax-class-properties.js',
    
    // support for doits
    'babel-plugin-doit-result': lively4url + '/src/external/babel-plugin-doit-result.js',
    'babel-plugin-doit-this-ref': lively4url + '/src/external/babel-plugin-doit-this-ref.js',
    'babel-plugin-doit-async': lively4url + '/src/external/babel-plugin-doit-async.js',
    'babel-plugin-locals': lively4url + '/src/external/babel-plugin-locals.js',
    'babel-plugin-var-recorder': lively4url + '/src/external/babel-plugin-var-recorder.js',
    'babel-plugin-var-recorder-dev': lively4url + '/src/external/babel-plugin-var-recorder-dev.js',
    'workspace-loader': lively4url + '/src/client/workspace-loader.js',

    // support for polymorphic identifiers
    'babel-plugin-polymorphic-identifiers': lively4url + '/src/client/reactive/babel-plugin-polymorphic-identifiers/babel-plugin-polymorphic-identifiers.js',
    'polymorphic-identifiers': lively4url + '/src/client/reactive/polymorphic-identifiers/polymorphic-identifiers.js',
    'babel-plugin-constraint-connectors': lively4url + '/src/client/reactive/babel-plugin-constraint-connectors/babel-plugin-constraint-connectors.js',
    'babel-plugin-constraint-connectors-active-expression': lively4url + '/src/client/reactive/babel-plugin-constraint-connectors-active-expression/babel-plugin-constraint-connectors-active-expression.js',

    // utils
    'lang': lively4url + '/src/client/lang/lang.js',
    'lang-ext': lively4url + '/src/client/lang/lang-ext.js',
    'lang-zone': lively4url + '/src/client/lang/lang-zone.js',

    // utils
    'utils': lively4url + '/src/client/utils.js',
  },
  trace: true,
})

const liveES7 = {
  babelOptions: {
    plugins: [],
    babel7: true,
    babel7level: "liveES7"
  }
};

const liveTS = {
  babelOptions: {
    plugins: [],
    babel7: true,
    babel7level: "liveTS"
  }
};


const babel7base = {
  babelOptions: {
    babel7: true,
    babel7level: "babel7demo",
    plugins: []
  }
};
const aexprViaDirective = {
  babelOptions: {
    plugins: [],
    babel7: true,
    babel7level: "aexprViaDirective"
  }
};

System.config({
  meta: {
    '*.js': liveES7,    
    '*.mjs': liveES7,
    '*.ts': liveTS,
    'https://unpkg.com/*.js': moduleOptionsNon,
    /* FILE-BASED */
    /* plugins are not transpiled with other plugins, except for SystemJS-internal plugins */
    [lively4url + '/src/plugins/*.js']: moduleOptionsNon,
    [lively4url + '/src/external/babel-plugin-*.js']: moduleOptionsNon,
    [lively4url + '/src/external/babel/babel7-*.js']: moduleOptionsNon,
    [lively4url + '/src/client/ContextJS/src/*.js']: moduleOptionsNon,
    [lively4url + '/src/client/preferences.js']: moduleOptionsNon,
    [lively4url + '/src/external/eslint/*.js']: moduleOptionsNon, 
    [lively4url + '/src/external/lodash/*.js']: noRewriting, 

    ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/*.js']: noRewriting, 
    
    ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf.js']: noRewriting, 
    
    
    [lively4url + '/src/external/jstree/jstree.js']: noRewriting, 
    [lively4url + '/src/external/markdown-it.js']: noRewriting, 
    [lively4url + '/src/external/markdown-it-container.js']: noRewriting, 
    [lively4url + '/src/external/markdown-it-attrs.js']: noRewriting, 

    
    [lively4url + '/src/external/source-map.min.js']: noRewriting, 
    // [lively4url + '/src/external/diff-match-patch.js']: noRewriting, 
    [lively4url + '/src/external/eslint/eslint.js']: noRewriting, 
    ['*/src/external/bibtexParse.js']: noRewriting, 

    [lively4url + "/src/external/*.js"]: moduleOptionsNon,
    
    [lively4url + '/demos/babel7/*.js']: babel7base,
    [lively4url + '/demos/*.js']: aexprViaDirective,
    [lively4url + '/templates/*.js']: aexprViaDirective,
    [lively4url + '/test/*.js']: liveES7,
    /* some tests with aexpr */
    [lively4url + '/test/bindings-test.js']: aexprViaDirective,
    
    // [lively4url + '/*.js']: aexprViaDirective,
    /* default for all .js files (not just lively4) */
    [lively4url + "/src/client/*.js"]: aexprViaDirective,
    [lively4url + "/src/components/*.js"]: aexprViaDirective,

    /* base extensions */
    [lively4url + "/src/client/lang/lang.js"]: moduleOptionsNon,
    [lively4url + "/src/client/lang/lang-ext.js"]: aexprViaDirective,
    
    /* blacklist all projects included for active expressions */
    [lively4url + "/src/client/reactive/*.js"]: liveES7,
    [lively4url + "/src/client/reactive/reactive-jsx/*.js"]: moduleOptionsNon,
    [lively4url + "/src/client/reactive/rp19-jsx/*.js"]: moduleOptionsNon,
    [lively4url + '/src/client/reactive/misc/*.js']: aexprViaDirective,
    [lively4url + '/src/client/reactive/components/basic/*.js']: liveES7,
    [lively4url + '/src/client/reactive/components/rewritten/*.js']: aexprViaDirective,
    /* ... except for the tests */
    [lively4url + '/src/client/reactive/test/*.js']: aexprViaDirective,
    
    /* WORKSPACE */
    'workspace:*': {
      babelOptions: {
        plugins: [],
        babel7: true,
        babel7level: "workspace"
      }
    },
    
    
    
  }
});


/*MD 
 #Cheap #Live #MethoWrapper #Pattern #COP

Otherwise the function will wrap itself again on reevaluation.

MD*/
let orginalResolve = System.constructor.prototype.resolve;
orginalResolve = orginalResolve.originalFunction || orginalResolve

// #important
function systemResolve(id, parentUrl) {
  let result
  try {   
    if (parentUrl && parentUrl.match(/workspace\:/)  &&  id  && id.match(/.*\.((js)|(ts))$/)) {

      if (id.match(/^[a-zA-Z]/)) {
         // Non relative files
         result =  orginalResolve.call(this, id, parentUrl)
      } else {
        var fullId = parentUrl.replace(/[^/]*$/, id)
        var m = fullId.match(/^([^/]+\/)(.*)$/)
        var baseId = m[1]
        var targetModule = m[2]

        if (targetModule.match(/\.((js)|(ts))$/)) {
          var protocoll = new URL(lively4url).protocol 
          if (targetModule.match(/^lively-kernel\.org/)) {
              protocoll = "https:" // accessing lively-kernel from localhost....
          }
          var sourceURL = protocoll + "//" + targetModule 
          result = orginalResolve.call(this, sourceURL)
        }        
      }
    }   
    if (!result) {
      result =  orginalResolve.call(this, id, parentUrl)
    }
  } catch(e) {
    result = orginalResolve.call(this, lively4url + "/" + id, parentUrl) // try harder!
  }
  if (!result) {
     result = orginalResolve.call(this, lively4url + "/" + id, parentUrl) // try harder! new version without exceptions
    
    // throw Error("Unable to resolve  " + id + " in " + parentUrl)
  }
  if (!result) {
    throw Error("Unable to resolve  " + id + " in " + parentUrl)
  }
  
  result  = result.replace(/([^:]\/)\/+/g, "$1"); // remove double slashes 
  
  // #TODO maybe use this browser API to resolve id in parentUrl 
  // #Issue, workspace:// is unknown schema and not handled by browser
  result =  new URL(result).href 
  return result
}
systemResolve.originalFunction = orginalResolve

// Lively4 introduced custom hook to prevent throwing an error
systemJSPrototype.throwUnresolved = function(id, parentUrl) {
  // console.warn("SYSTEMJS could not resolve " + id + " in " + parentUrl)
  // throw new Error("could not resolve " + id + " in " + parentUrl)
  
  return false // do nothing
}


System.constructor.prototype.resolve = systemResolve
System.constructor.prototype.normalizeSync = systemResolve





