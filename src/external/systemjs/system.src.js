/*
 * SystemJS v0.20.0-alpha.1
 */
(function () {
'use strict';


  /* logging */
  
// localStorage["logSystemJS"] = true
// delete localStorage["logSystemJS"] 
  
function livelyLog(...rest) {
  if (self.localStorage && self.localStorage["logSystemJS"] == "true") {
    console.log(self.lively4stamp, ...rest)  
  }
}

var livelyBootLog = self.lively4bootlog || function() {} // Performance Benchmark

var livelyGroupTimes = {} 
var livelyGroupTree = {} 

function livelyGroupPrint(entry, visited = new Set()) {
  if (visited.has(entry.key)) return
  visited.add(entry.key)
  console.group(entry.label + " " + entry.key) 
  entry.children.forEach(ea => {
    livelyGroupPrint(ea, visited)
  })
  console.groupEnd() 
}

function livelyGroupStart(label, key, parentKey) {
  var entry = {label: label, key: key, parent: parent, children: []}
  if (key) {
    livelyGroupTree[key] = entry
    var parent = livelyGroupTree[parentKey]
    if (parent) parent.children.push(entry)
  }
    
  
  if (self.localStorage && self.localStorage["logSystemJS"]) {
    livelyGroupTimes[label + key] = performance.now()
  }
}

function livelyGroupEnd(label, key, parent) {
  if (self.localStorage && self.localStorage["logSystemJS"] == "true") {
    console.log(label + " " + key +" time: "  + ((performance.now() - livelyGroupTimes[label + key]) / 1000).toFixed(3) + "s" + " parent: " + parent)

    var parentEntry = livelyGroupTree[parent];
    if (!parentEntry) {
      console.log("tree!!!")
      livelyGroupPrint(livelyGroupTree[key])
    }
  }
}
  
/*
 * Environment
 */
var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
var isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
var isWindows = typeof process !== 'undefined' && typeof process.platform === 'string' && process.platform.match(/^win/);

var global$1 = typeof self !== 'undefined' ? self : global;
/*
 * Simple Symbol() shim
 */
var hasSymbol = typeof Symbol !== 'undefined';
function createSymbol (name) {
  //return hasSymbol ? Symbol() : '@@' + name;
  return '@@' + name; // #Hack for debugging
}

/*
 * Environment baseURI
 */
var baseURI;

// environent baseURI detection
if (typeof document != 'undefined' && document.getElementsByTagName) {
  baseURI = document.baseURI;

  if (!baseURI) {
    var bases = document.getElementsByTagName('base');
    baseURI = bases[0] && bases[0].href || window.location.href;
  }
}
else if (typeof location != 'undefined') {
  baseURI = location.href;
}

// sanitize out the hash and querystring
if (baseURI) {
  baseURI = baseURI.split('#')[0].split('?')[0];
  baseURI = baseURI.substr(0, baseURI.lastIndexOf('/') + 1);
}
else if (typeof process != 'undefined' && process.cwd) {
  baseURI = 'file://' + (isWindows ? '/' : '') + process.cwd();
  if (isWindows)
    baseURI = baseURI.replace(/\\/g, '/');
}
else {
  throw new TypeError('No environment baseURI');
}

// ensure baseURI has trailing "/"
if (baseURI[baseURI.length - 1] !== '/')
  baseURI += '/';

/*
 * LoaderError with chaining for loader stacks
 */
var errArgs = new Error(0, '_').fileName == '_';
function addToError (childErr, newMessage) {
  // Convert file:/// URLs to paths in Node
  if (!isBrowser)
    newMessage = newMessage.replace(isWindows ? /file:\/\/\//g : /file:\/\//g, '');

  var message = (childErr.message || childErr) + '\n  ' + newMessage;

  var err;
  if (errArgs && childErr.fileName)
    err = new Error(message, childErr.fileName, childErr.lineNumber);
  else
    err = new Error(message);


  var stack = childErr.originalErr ? childErr.originalErr.stack : childErr.stack;

  if (isNode)
    // node doesn't show the message otherwise
    err.stack = message + '\n  ' + stack;
  else
    err.stack = stack;

  err.originalErr = childErr.originalErr || childErr;

  return err;
}

/*
 * Optimized URL normalization assuming a syntax-valid URL parent
 */
function resolveUrlToParentIfNotPlain (relUrl, parentUrl) {

  function throwResolveError () {
    throw new RangeError('Unable to resolve "' + relUrl + '" to ' + parentUrl);
  }

  var protocolIndex = relUrl.indexOf(':');
  if (protocolIndex !== -1) {
    if (isNode) {
      // Windows filepath compatibility (unique to SystemJS, not in URL spec at all)
      // C:\x becomes file:///c:/x (we don't support C|\x)
      if (relUrl[1] === ':' && relUrl[2] === '\\' && relUrl[0].match(/[a-z]/i) && parentUrl.substr(0, 5) === 'file:')
        return 'file:///' + relUrl.replace(/\\/g, '/');
    }
    return relUrl;
  }

  var parentProtocol = parentUrl && parentUrl.substr(0, parentUrl.indexOf(':') + 1);

  // protocol-relative
  if (relUrl[0] === '/' && relUrl[1] === '/') {
    if (!parentProtocol)
      throwResolveError();
    return parentProtocol + relUrl;
  }
  // relative-url
  else if (relUrl[0] === '.' && (relUrl[1] === '/' || relUrl[1] === '.' && (relUrl[2] === '/' || relUrl.length === 2) || relUrl.length === 1)
      || relUrl[0] === '/') {
    var parentIsPlain = !parentProtocol || parentUrl[parentProtocol.length] !== '/';

    // read pathname from parent if a URL
    // pathname taken to be part after leading "/"
    var pathname;
    if (parentIsPlain) {
      // resolving to a plain parent -> skip standard URL prefix, and treat entire parent as pathname
      if (parentUrl === undefined)
        throwResolveError();
      pathname = parentUrl;
    }
    else if (parentUrl[parentProtocol.length + 1] === '/') {
      // resolving to a :// so we need to read out the auth and host
      if (parentProtocol !== 'file:') {
        pathname = parentUrl.substr(parentProtocol.length + 2);
        pathname = pathname.substr(pathname.indexOf('/') + 1);
      }
      else {
        pathname = parentUrl.substr(8);
      }
    }
    else {
      // resolving to :/ so pathname is the /... part
      pathname = parentUrl.substr(parentProtocol.length + 1);
    }

    if (relUrl[0] === '/') {
      if (parentIsPlain)
        throwResolveError();
      else
        return parentUrl.substr(0, parentUrl.length - pathname.length - 1) + relUrl;
    }

    // join together and split for removal of .. and . segments
    // looping the string instead of anything fancy for perf reasons
    // '../../../../../z' resolved to 'x/y' is just 'z' regardless of parentIsPlain
    var segmented = pathname.substr(0, pathname.lastIndexOf('/') + 1) + relUrl;

    var output = [];
    var segmentIndex = undefined;

    for (var i = 0; i < segmented.length; i++) {
      // busy reading a segment - only terminate on '/'
      if (segmentIndex !== undefined) {
        if (segmented[i] === '/') {
          output.push(segmented.substr(segmentIndex, i - segmentIndex + 1));
          segmentIndex = undefined;
        }
        continue;
      }

      // new segment - check if it is relative
      if (segmented[i] === '.') {
        // ../ segment
        if (segmented[i + 1] === '.' && (segmented[i + 2] === '/' || i === segmented.length - 2)) {
          output.pop();
          i += 2;
        }
        // ./ segment
        else if (segmented[i + 1] === '/' || i === segmented.length - 1) {
          i += 1;
        }
        else {
          // the start of a new segment as below
          segmentIndex = i;
          continue;
        }

        // this is the plain URI backtracking error (../, package:x -> error)
        if (parentIsPlain && output.length === 0)
          throwResolveError();

        // trailing . or .. segment
        if (i === segmented.length)
          output.push('');
        continue;
      }

      // it is the start of a new segment
      segmentIndex = i;
    }
    // finish reading out the last segment
    if (segmentIndex !== undefined)
      output.push(segmented.substr(segmentIndex, segmented.length - segmentIndex));

    return parentUrl.substr(0, parentUrl.length - pathname.length) + output.join('');
  }

  // plain name -> return undefined
}

var isWorker = typeof window == 'undefined' && typeof self != 'undefined' && typeof importScripts != 'undefined';

var scriptSrc;

// Promise detection and error message
if (typeof Promise === 'undefined')
  throw new Error('SystemJS requires a global Promise polyfill to be set before loading.');

if (typeof document !== 'undefined') {
  var scripts = document.getElementsByTagName('script');
  var curScript = scripts[scripts.length - 1];
  if (document.currentScript && (curScript.defer || curScript.async))
    curScript = document.currentScript;

  scriptSrc = curScript.src;
}
// worker
else if (typeof importScripts !== 'undefined') {
  try {
    throw new Error('_');
  }
  catch (e) {
    e.stack.replace(/(?:at|@).*(http.+):[\d]+:[\d]+/, function(m, url) {
      scriptSrc = url;
    });
  }
}
// node
else if (typeof __filename !== 'undefined') {
  scriptSrc = __filename;
}

// include the node require since we're overriding it
var nodeRequire;
if (typeof require !== 'undefined' && typeof process !== 'undefined' && !process.browser)
  nodeRequire = require;

function warn$1 (msg, force) {
  if (force || this.warnings && typeof console !== 'undefined' && console.warn)
    console.warn(msg);
}

var parentModuleContext;
function loadNodeModule (key, baseURL) {
  if (key[0] === '.')
    throw new Error('Node module ' + key + ' can\'t be loaded as it is not a package require.');

  if (!parentModuleContext) {
    var Module = this._nodeRequire('module');
    var base = baseURL.substr(isWindows ? 8 : 7);
    parentModuleContext = new Module(base);
    parentModuleContext.paths = Module._nodeModulePaths(base);
  }
  return parentModuleContext.require(key);
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

// meta first-level extends where:
// array + array appends
// object + object extends
// other properties replace
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

function workerImport (src, resolve, reject) {
  try {
    importScripts(src);
  }
  catch (e) {
    reject(e);
  }
  resolve();
}

var curSystem;
var curRequire;
var supportsScriptLoad = (isBrowser || isWorker) && typeof navigator !== 'undefined' && navigator.userAgent && !navigator.userAgent.match(/MSIE (9|10).0/);

function scriptLoad (src, crossOrigin, integrity, resolve, reject) {
  // percent encode just "#" for HTTP requests
  src = src.replace(/#/g, '%23');

  // subresource integrity is not supported in web workers
  if (isWorker)
    return workerImport(src, resolve, reject);

  // if scriptLoad
  curSystem = global$1.System;
  curRequire = global$1.require;

  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.charset = 'utf-8';
  script.async = true;

  if (crossOrigin)
    script.crossOrigin = crossOrigin;
  if (integrity)
    script.integrity = integrity;

  script.addEventListener('load', load, false);
  script.addEventListener('error', error, false);

  script.src = src;
  document.head.appendChild(script);

  function load () {
    resolve();
    cleanup();
  }

  // note this does not catch execution errors
  function error (err) {
    cleanup();
    reject(new Error('Fetching ' + src));
  }

  function cleanup () {
    global$1.System = curSystem;
    global$1.require = curRequire;
    script.removeEventListener('load', load, false);
    script.removeEventListener('error', error, false);
    document.head.removeChild(script);
  }
}

function readMemberExpression (p, value) {
  var pParts = p.split('.');
  while (pParts.length)
    value = value[pParts.shift()];
  return value;
}

function getMapMatch (map, name) {
  var bestMatch, bestMatchLength = 0;

  for (var p in map) {
    if (name.substr(0, p.length) === p && (name.length === p.length || name[p.length] === '/')) {
      var curMatchLength = p.split('/').length;
      if (curMatchLength <= bestMatchLength)
        continue;
      bestMatch = p;
      bestMatchLength = curMatchLength;
    }
  }

  return bestMatch;
}

var hasBuffer = typeof Buffer !== 'undefined';
try {
  if (hasBuffer && new Buffer('a').toString('base64') !== 'YQ==')
    hasBuffer = false;
}
catch (e) {
  hasBuffer = false;
}

var sourceMapPrefix = '\n//# sourceMapping' + 'URL=data:application/json;base64,';
function inlineSourceMap (sourceMapString) {
  if (hasBuffer)
    return sourceMapPrefix + new Buffer(sourceMapString).toString('base64');
  else if (typeof btoa !== 'undefined')
    return sourceMapPrefix + btoa(unescape(encodeURIComponent(sourceMapString)));
  else
    return '';
}

function getSource(source, sourceMap, address, wrap) {
  var lastLineIndex = source.lastIndexOf('\n');

  if (sourceMap) {
    if (typeof sourceMap != 'object')
      throw new TypeError('load.metadata.sourceMap must be set to an object.');

    sourceMap = JSON.stringify(sourceMap);
  }

  return (wrap ? '(function(System, SystemJS) {' : '') + source + (wrap ? '\n})(System, System);' : '')
      // adds the sourceURL comment if not already present
      + (source.substr(lastLineIndex, 15) != '\n//# sourceURL='
        ? '\n//# sourceURL=' + address + (sourceMap ? '!transpiled' : '') : '')
      // add sourceMappingURL if load.metadata.sourceMap is set
      + (sourceMap && inlineSourceMap(sourceMap) || '');
}

var callCounter = 0;
function preExec (loader) {
  if (callCounter++ == 0)
    curSystem = global$1.System;
  global$1.System = global$1.SystemJS = loader;
}
function postExec () {
  if (--callCounter == 0)
    global$1.System = global$1.SystemJS = curSystem;
}

var supportsScriptExec = false;
if (isBrowser && typeof document != 'undefined' && document.getElementsByTagName) {
  if (!(window.chrome && window.chrome.extension || navigator.userAgent.match(/^Node\.js/)))
    supportsScriptExec = true;
}

// script execution via injecting a script tag into the page
// this allows CSP nonce to be set for CSP environments
var head;
function scriptExec(loader, source, sourceMap, address, nonce) {
  if (!head)
    head = document.head || document.body || document.documentElement;

  var script = document.createElement('script');
  script.text = getSource(source, sourceMap, address, false);
  var onerror = window.onerror;
  var e;
  window.onerror = function(_e) {
    e = addToError(_e, 'Evaluating ' + address);
    if (onerror)
      onerror.apply(this, arguments);
  }
  preExec(loader);

  if (nonce)
    script.setAttribute('nonce', nonce);

  head.appendChild(script);
  head.removeChild(script);
  postExec();
  window.onerror = onerror;
  if (e)
    return e;
}

var vm;
var useVm;

function evaluate (loader, source, sourceMap, address, integrity, nonce, noWrap) {
  if (!source)
    return;
  if (nonce && supportsScriptExec)
    return scriptExec(loader, source, sourceMap, address, nonce);
  try {
    preExec(loader);
    // global scoped eval for node (avoids require scope leak)
    if (!vm && loader._nodeRequire) {
      vm = loader._nodeRequire('vm');
      useVm = vm.runInThisContext("typeof System !== 'undefined' && System") === loader;
    }
    if (useVm)
      vm.runInThisContext(getSource(source, sourceMap, address, !noWrap), { filename: address + (sourceMap ? '!transpiled' : '') });
    else
      (0, eval)(getSource(source, sourceMap, address, !noWrap));
    postExec();
  }
  catch (e) {
    postExec();
    return e;
  }
}

// RegEx adjusted from https://github.com/jbrantly/yabble/blob/master/lib/yabble.js#L339
var cjsRequireRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF."'])require\s*\(\s*("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')\s*\)/g;

/*
 * Simple Array values shim
 */
function arrayValues (arr) {
  if (arr.values)
    return arr.values();

  if (typeof Symbol === 'undefined' || !Symbol.iterator)
    throw new Error('Cannot return values iterator unless Symbol.iterator is defined');

  var iterable = {};
  iterable[Symbol.iterator] = function () {
    var keys = Object.keys(arr);
    var keyIndex = 0;
    return {
      next: function () {
        if (keyIndex < keys.length)
          return {
            value: arr[keys[keyIndex++]],
            done: false
          };
        else
          return {
            value: undefined,
            done: true
          };
      }
    };
  };
  return iterable;
}

/*
 * 3. Reflect.Loader
 *
 * We skip the entire native internal pipeline, just providing the bare API
 */
// 3.1.1
function Loader (baseKey) {
  this.key = baseKey || baseURI;
  this.registry = new Registry();
}
// 3.3.1
Loader.prototype.constructor = Loader;
// 3.3.2
Loader.prototype.import = Loader.prototype.load = function (key, parent) {
  if (typeof key !== 'string')
    throw new TypeError('Loader import method must be passed a module key string');
  // custom resolveInstantiate combined hook for better perf
  return Promise.resolve(this[RESOLVE_INSTANTIATE](key, parent || this.key))
  //.then(Module.evaluate)
  .catch(function (err) {
    throw addToError(err, 'Loading ' + key + (parent ? ' from ' + parent : ''));
  });
};
// 3.3.3
var RESOLVE$1 = Loader.resolve = createSymbol('resolve');

/*
 * Combined resolve / instantiate hook
 *
 * Not in current reduced spec, but necessary to separate RESOLVE from RESOLVE + INSTANTIATE as described
 * in the spec notes of this repo to ensure that loader.resolve doesn't instantiate when not wanted.
 *
 * We implement RESOLVE_INSTANTIATE as a single hook instead of a separate INSTANTIATE in order to avoid
 * the need for double registry lookups as a performance optimization.
 */
var RESOLVE_INSTANTIATE = Loader.resolveInstantiate = createSymbol('resolveInstantiate');

// default resolveInstantiate is just to call resolve and then get from the registry
// this provides compatibility for the resolveInstantiate optimization
Loader.prototype[RESOLVE_INSTANTIATE] = function (key, parent) {
  var loader = this;
  return this.resolve(key, parent)
  .then(function (resolved) {
    var module = loader.registry.get(resolved);
    if (!module)
      throw new Error('Resolve did not define the "' + resolved + '" module into the registry.');
    return module;
  });
};

Loader.prototype[RESOLVE$1] = function () {
  throw new TypeError('No loader resolve hook implementation provided.');
};

Loader.prototype.resolve = function (key, parent) {
  var loader = this;
  return Promise.resolve()
  .then(function() {
    return loader[RESOLVE$1](key, parent);
  })
  .then(function (resolvedKey) {
    if (resolvedKey === undefined)
      throw new RangeError('No resolution found.');
    return resolvedKey;
  })
  .catch(function (err) {
    throw addToError(err, 'Resolving ' + key + (parent ? ' to ' + parent : ''));
  });
};

// 3.3.4 (import without evaluate)
// this is not documented because the use of deferred evaluation as in Module.evaluate is not
// documented, as it is not considered a stable feature to be encouraged
// Loader.prototype.load may well be deprecated if this stays disabled
/* Loader.prototype.load = function (key, parent) {
  return Promise.resolve(this[RESOLVE_INSTANTIATE](key, parent || this.key))
  .catch(function (err) {
    throw addToError(err, 'Loading ' + key + (parent ? ' from ' + parent : ''));
  });
}; */

/*
 * 4. Registry
 *
 * Instead of structuring through a Map, just use a dictionary object
 * We throw for construction attempts so this doesn't affect the public API
 *
 * Registry has been adjusted to use Namespace objects over ModuleStatus objects
 * as part of simplifying loader API implementation
 */
var iteratorSupport = typeof Symbol !== 'undefined' && Symbol.iterator;
function Registry() {
  this._registry = {};
}
// 4.4.1
Registry.prototype.constructor = function () {
  throw new TypeError('Custom registries cannot be created.');
};

if (iteratorSupport) {
  // 4.4.2
  Registry.prototype[Symbol.iterator] = function () {
    return this.entries()[Symbol.iterator]();
  };

  // 4.4.3
  Registry.prototype.entries = function () {
    var registry = this._registry;
    return arrayValues(Object.keys(registry).map(function (key) {
      return [key, registry[key]];
    }));
  };
}

// 4.4.4
Registry.prototype.keys = function () {
  return arrayValues(Object.keys(this._registry));
};
// 4.4.5
Registry.prototype.values = function () {
  var registry = this._registry;
  return arrayValues(Object.keys(registry).map(function (key) {
    return registry[key];
  }));
};
// 4.4.6
Registry.prototype.get = function (key) {
  return this._registry[key];
};
// 4.4.7
Registry.prototype.set = function (key, namespace) {
  if (!(namespace instanceof ModuleNamespace))
    throw new Error('Registry must be set with an instance of Module Namespace');
  this._registry[key] = namespace;
  return this;
};
// 4.4.8
Registry.prototype.has = function (key) {
  return !!this._registry[key];
};
// 4.4.9
Registry.prototype.delete = function (key) {
  if (this._registry[key]) {
    //delete this._registry[key];
    // much faster...
SystemJSLoader.prototype.registerDynamic 
    this._registry[key] = undefined;
    return true;
  }
  return false;
};

/*
 * Simple ModuleNamespace Exotic object based on a baseObject
 * We export this for allowing a fast-path for module namespace creation over Module descriptors
 */
// var EVALUATE = createSymbol('evaluate');
var BASE_OBJECT = createSymbol('baseObject');

// 8.3.1 Reflect.Module
/*
 * Best-effort simplified non-spec implementation based on
 * a baseObject referenced via getters.
 *
 * Allows:
 *
 *   loader.registry.set('x', new Module({ default: 'x' }));
 *
 * Optional evaluation function provides experimental Module.evaluate
 * support for non-executed modules in registry.
 */
function ModuleNamespace (baseObject/*, evaluate*/) {
  Object.defineProperty(this, BASE_OBJECT, {
    value: baseObject
  });

  // evaluate defers namespace population
  /* if (evaluate) {
    Object.defineProperty(this, EVALUATE, {
      value: evaluate,
      configurable: true,
      writable: true
    });
  }
  else { */
    Object.getOwnPropertyNames(baseObject).forEach(extendNamespace, this);
  //}
};
// 8.4.2
ModuleNamespace.prototype = Object.create(null);

if (typeof Symbol !== 'undefined' && Symbol.toStringTag)
  ModuleNamespace.prototype[Symbol.toStringTag] = 'Module';

// NB remove the toString fallback here in next major
else
  Object.defineProperty(ModuleNamespace.prototype, 'toString', {
    value: function () {
      return '[object Module]';
    }
  });

function extendNamespace (key) {
  Object.defineProperty(this, key, {
    enumerable: true,
    get: function () {
      return this[BASE_OBJECT][key];
    }
  });
}

/* function doEvaluate (evaluate, context) {
  try {
    evaluate.call(context);
  }
  catch (e) {
    return e;
  }
}

// 8.4.1 Module.evaluate... not documented or used because this is potentially unstable
Module.evaluate = function (ns) {
  var evaluate = ns[EVALUATE];
  if (evaluate) {
    ns[EVALUATE] = undefined;
    var err = doEvaluate(evaluate);
    if (err) {
      // cache the error
      ns[EVALUATE] = function () {
        throw err;
      };
      throw err;
    }
    Object.keys(ns[BASE_OBJECT]).forEach(extendNamespace, ns);
  }
  // make chainable
  return ns;
}; */

/*
 * Register Loader
 *
 * Builds directly on top of loader polyfill to provide:
 * - loader.register support
 * - hookable higher-level resolve with metadata argument
 * - instantiate hook with metadata arugment returning a ModuleNamespace or undefined for es module loading
 * - loader error behaviour as in HTML and loader specs, clearing failed modules from registration cache synchronously
 * - build tracing support by providing a .trace=true and .loads object format
 */

var REGISTER_REGISTRY = createSymbol('registerRegistry');
var REGISTERED_LAST_ANON = createSymbol('registeredLastAnon');

function RegisterLoader (baseKey) {
  Loader.apply(this, arguments);

  // last anonymous System.register call
  this[REGISTERED_LAST_ANON] = undefined;

  // in-flight es module load records
  this[REGISTER_REGISTRY] = {};

  // tracing
  this.trace = false;
  // trace load objects when tracing
  this.loads = {};
}

RegisterLoader.prototype = Object.create(Loader.prototype);
RegisterLoader.prototype.constructor = RegisterLoader;

// NB replace with createSymbol('normalize'), ... for next major
RegisterLoader.normalize = RegisterLoader.resolve = 'normalize';
RegisterLoader.instantiate = 'instantiate';
RegisterLoader.createMetadata = 'createMetadata';
RegisterLoader.processRegisterContext = 'processRegisterContext';

// default normalize is the WhatWG style normalizer
RegisterLoader.prototype.normalize = function (key, parentKey, metadata, parentMetadata) {
  // normalization shortpath for already in registry
  if (this[REGISTER_REGISTRY][key] || this.registry._registry[key])
    return key;
  return resolveUrlToParentIfNotPlain(key, parentKey);
};

RegisterLoader.prototype.instantiate = function (key, processRegister, metadata) {};

// this function is an optimization to allow loader extensions to
// implement it to set the metadata object shape upfront to ensure
// it can run as a single hidden class throughout the normalize
// and instantiate pipeline hooks in the js engine
RegisterLoader.prototype.createMetadata = function () {
  return {
    registered: false
  };
};

function ensureResolution (resolvedKey) {
  if (resolvedKey === undefined)
    throw new RangeError('No resolution found.');
  return resolvedKey;
}

function resolve (loader, key, parentKey, metadata, parentMetadata) {
  return Promise.resolve()
  .then(function () {
    return loader.normalize(key, parentKey, metadata, parentMetadata);
  })
  .then(ensureResolution)
  .catch(function (err) {
    throw addToError(err, 'Resolving dependency "' + key + '" to ' + parentKey);
  });
}

RegisterLoader.prototype[Loader.resolve] = function (key, parentKey) {
  var parentLoad = parentKey && this[REGISTER_REGISTRY][parentKey];
  return resolve(this, key, parentKey, this.createMetadata(), parentLoad && parentLoad.metadata);
};

// once evaluated, the linkRecord is set to undefined leaving just the other load record properties
// this allows tracking new binding listeners for es modules through importerSetters
// for dynamic modules, the load record is removed entirely.
function createLoadRecord (key, registration) {
  return this[REGISTER_REGISTRY][key] = {
    key: key,

    // defined System.register cache
    registration: registration,

    // load record metadata
    metadata: undefined,

    // module namespace object
    module: undefined,

    // es-only
    // this sticks around so new module loads can listen to binding changes
    // for already-loaded modules by adding themselves to their importerSetters
    importerSetters: undefined,

    // in-flight linking record
    linkRecord: {
      // promise for instantiated
      instantiatePromise: undefined,
      dependencies: undefined,
      execute: undefined,
      // underlying module object bindings
      moduleObj: undefined,

      // es only, also indicates if es or not
      setters: undefined,

      // promise for instantiated dependencies (dependencyInstantiations populated)
      depsInstantiatePromise: undefined,
      // will be the array of dependency load record or a module namespace
      dependencyInstantiations: undefined,

      // indicates if the load and all its dependencies are instantiated and linked
      // but not yet executed
      // mostly just a performance shortpath to avoid rechecking the promises above
      linked: false,

      error: undefined
      // NB optimization and way of ensuring module objects in setters
      // indicates setters which should run pre-execution of that dependency
      // setters is then just for completely executed module objects
      // alternatively we just pass the partially filled module objects as
      // arguments into the execute function
      // hoisted: undefined
    }
  };
}

RegisterLoader.prototype[Loader.resolveInstantiate] = function (key, parentKey) {
  var loader = this;
  var registry = loader.registry._registry;
  var registerRegistry = loader[REGISTER_REGISTRY];
  
  // #Lively4
  var normalizedLogKey = loader.normalizeSync(key, parentKey)   
  var resolveInstatiateStart = performance.now(); 
  
  return resolveInstantiate(loader, key, parentKey, registry, registerRegistry)
  .then(function (instantiated) {
    if (instantiated instanceof ModuleNamespace)
      return instantiated;

    // if already beaten to linked, return
    if (instantiated.module)
      return instantiated.module;
    
    
    
    // resolveInstantiate always returns a load record with a link record and no module value
    if (instantiated.linkRecord.linked)
      return ensureEvaluate(loader, instantiated, instantiated.linkRecord, registry, registerRegistry, undefined);

    livelyBootLog(normalizedLogKey, Date.now(),  "resolveInstantiateStart" )
    livelyGroupStart("resolveInstantiate", loader.normalizeSync(key), loader.normalizeSync(parentKey))

    
    return instantiateDeps(loader, instantiated, instantiated.linkRecord, registry, registerRegistry, [instantiated])
    .then(function () {
      return ensureEvaluate(loader, instantiated, instantiated.linkRecord, registry, registerRegistry, undefined);
    })
    .catch(function (err) {
      clearLoadErrors(loader, instantiated);
      throw err;
    })
    .then(result => {
      livelyGroupEnd("resolveInstantiate", loader.normalizeSync(key), loader.normalizeSync(parentKey))
      livelyBootLog(normalizedLogKey, Date.now(),  "resolveInstantiateEnd", performance.now() - resolveInstatiateStart)
      return result
    })
  })
  
};

function resolveInstantiate (loader, key, parentKey, registry, registerRegistry) {
  // normalization shortpath for already-normalized key
  // could add a plain name filter, but doesn't yet seem necessary for perf
  var module = registry[key];
  if (module)
    return Promise.resolve(module);

  var load = registerRegistry[key];

  // already linked but not in main registry is ignored
  if (load && !load.module)
    return instantiate(loader, load, load.linkRecord, registry, registerRegistry);

  var parentLoad = registerRegistry[parentKey];
  var metadata = loader.createMetadata();
  return resolve(loader, key, parentKey, metadata, parentLoad && parentLoad.metadata)
  .then(function (resolvedKey) {
    // main loader registry always takes preference
    module = registry[resolvedKey];
    if (module)
      return module;

    load = registerRegistry[resolvedKey];

    // already has a module value but not already in the registry (load.module)
    // means it was removed by registry.delete, so we should
    // disgard the current load record creating a new one over it
    // but keep any existing registration
    if (!load || load.module)
      load = createLoadRecord.call(loader, resolvedKey, load && load.registration);

    var link = load.linkRecord;
    if (!link)
      return load;

    if (!load.metadata) {
      load.metadata = metadata;
      if (load.registration)
        load.metadata.registered = true;
    }

    return instantiate(loader, load, link, registry, registerRegistry);
  });
}

function createProcessAnonRegister (loader, load) {
  return function () {
    var registeredLastAnon = loader[REGISTERED_LAST_ANON];

    if (!registeredLastAnon)
      return;

    loader[REGISTERED_LAST_ANON] = undefined;

    load.registration = registeredLastAnon;
    load.metadata.registered = true;
  };
}

function instantiate (loader, load, link, registry, registerRegistry) {
  return link.instantiatePromise || (link.instantiatePromise =
  // if there is already an existing registration, skip running instantiate
  (load.registration ? Promise.resolve() : Promise.resolve().then(function () {
    return loader.instantiate(load.key, load.metadata, loader.instantiate.length > 2 && createProcessAnonRegister(loader, load));
  }))
  .then(function (instantiation) {
    // direct module return from instantiate -> we're done
    if (instantiation !== undefined) {
      if (!(instantiation instanceof ModuleNamespace))
        throw new TypeError('Instantiate did not return a valid Module object.');

      registerRegistry[load.key] = undefined;
      if (loader.trace)
        traceLoad(loader, load, link);
      return registry[load.key] = instantiation;
    }

    // run the cached loader.register declaration if there is one
    var registration = load.registration;
    // clear to allow new registrations for future loads (combined with registry delete)
    load.registration = undefined;
    if (!registration)
      throw new TypeError('Module instantiation did not call an anonymous or correctly named System.register.');

    link.dependencies = registration[0];

    load.importerSetters = [];

    link.moduleObj = {};

    // process System.registerDynamic declaration
    if (registration[2]) {
      link.moduleObj.default = {};
      link.moduleObj.__useDefault = true;
      link.execute = registration[1];
    }

    // process System.register declaration
    else {
      registerDeclarative(loader, load, link, registration[1]);
    }

    // shortpath to instantiateDeps
    if (!link.dependencies.length) {
      link.linked = true;
      if (loader.trace)
        traceLoad(loader, load, link);
    }

    return load;
  })
  .catch(function (err) {
    throw link.error = addToError(err, 'Instantiating ' + load.key);
  }));
}

// like resolveInstantiate, but returning load records for linking
function resolveInstantiateDep (loader, key, parentKey, parentMetadata, registry, registerRegistry, traceDepMap) {

  var resolveInstatiateStart = performance.now();
  var resolveInstatiateLog; // lexical scope to cross promise boundaries
  livelyGroupStart("resolveInstantiateDep", loader.normalizeSync(key), loader.normalizeSync(parentKey))
  
  resolveInstatiateLog = true
  
  // #Lively4
  var normalizedLogKey = loader.normalizeSync(key, parentKey)   
  livelyBootLog(normalizedLogKey, Date.now(),  "resolveInstantiateDepStart", 0, parentKey)
  
  
  // normalization shortpaths for already-normalized key
  // DISABLED to prioritise consistent resolver calls
  // could add a plain name filter, but doesn't yet seem necessary for perf
  /* var load = registerRegistry[key];
  var module = registry[key];

  if (module) {
    if (traceDepMap)
      traceDepMap[key] = key;

    // registry authority check in case module was deleted or replaced in main registry
    if (load && load.module && load.module === module)
      return load;
    else
      return module;
  }

  // already linked but not in main registry is ignored
  if (load && !load.module) {
    if (traceDepMap)
      traceDepMap[key] = key;
    return instantiate(loader, load, load.linkRecord, registry, registerRegistry);
  } */
  var metadata = loader.createMetadata();
  return resolve(loader, key, parentKey, metadata, parentMetadata)
  .then(function (resolvedKey) {
    if (traceDepMap)
      traceDepMap[key] = key;

    // normalization shortpaths for already-normalized key
    var load = registerRegistry[resolvedKey];
    var module = registry[resolvedKey];

    // main loader registry always takes preference
    if (module && (!load || load.module && module !== load.module))
      return module;

    // do not log modules that are already loaded...
    
    
    
    // already has a module value but not already in the registry (load.module)
    // means it was removed by registry.delete, so we should
    // disgard the current load record creating a new one over it
    // but keep any existing registration
    if (!load || !module && load.module)
      load = createLoadRecord.call(loader, resolvedKey, load && load.registration);

    var link = load.linkRecord;
    if (!link)
      return load;

    load.metadata = load.metadata || metadata;
    if (load.registration)
      load.metadata.registered = true;

    return instantiate(loader, load, link, registry, registerRegistry);
  }).then(r => {
    // if (resolveInstatiateLog)
      livelyBootLog(normalizedLogKey, Date.now(),  "resolveInstantiateDepEnd", performance.now() - resolveInstatiateStart , parentKey)
    livelyGroupEnd("resolveInstantiateDep", normalizedLogKey, loader.normalizeSync(parentKey))
    return r
  })
}

function traceLoad (loader, load, link) {
  loader.loads[load.key] = {
    key: load.key,
    // we provide both deps and dependencies
    // NB dependencies will be deprecated
    dependencies: link.dependencies,
    deps: link.dependencies,
    depMap: link.depMap || {},
    metadata: load.metadata
  };
}

/*
 * Convert a CJS module.exports into a valid object for new Module:
 *
 *   new Module(getEsModule(module.exports))
 *
 * Sets the default value to the module, while also reading off named exports carefully.
 */

// NB re-evaluate if this will even exist, and if it should be restricted to valid identifiers only
function copyNamedExports (exports, moduleObj) {
  if ((typeof exports === 'object' || typeof exports === 'function') && exports !== global$1) {
    var props = Object.getOwnPropertyNames(exports);
    for (var i = 0; i < props.length; i++)
      defineOrCopyProperty(moduleObj, exports, props[i]);
  }
  moduleObj.default = exports;
}

function defineOrCopyProperty (targetObj, sourceObj, propName) {
  // don't trigger getters/setters in environments that support them
  try {
    var d;
    if (d = Object.getOwnPropertyDescriptor(sourceObj, propName)) {
      // only copy data descriptors
      if (d.value)
        targetObj[propName] = d.value;
    }
  }
  catch (e) {
    // Object.getOwnPropertyDescriptor threw an exception -> not own property
  }
}

function registerDeclarative (loader, load, link, declare) {
  var moduleObj = link.moduleObj;
  var importerSetters = load.importerSetters;

  var locked = false;

  // closure especially not based on link to allow link record disposal
  var declared = declare.call(global$1, function (name, value) {
    // export setter propogation with locking to avoid cycles
    if (locked)
      return;

    if (typeof name == 'object') {
      for (var p in name)
        if (p !== '__useDefault')
          moduleObj[p] = name[p];
    }
    else {
      moduleObj[name] = value;
    }

    locked = true;
    for (var i = 0; i < importerSetters.length; i++)
      importerSetters[i](moduleObj);
    locked = false;

    return value;
  }, new ContextualLoader(loader, load.key));

  if (typeof declared !== 'function') {
    link.setters = declared.setters;
    link.execute = declared.execute;
  }
  else {
    link.setters = [];
    link.execute = declared;
  }
}

function instantiateDeps (loader, load, link, registry, registerRegistry, seen) {
  return (link.depsInstantiatePromise || (link.depsInstantiatePromise = Promise.resolve()
  .then(function () {
    var depsInstantiatePromises = Array(link.dependencies.length);

    for (var i = 0; i < link.dependencies.length; i++)
      depsInstantiatePromises[i] = resolveInstantiateDep(loader, link.dependencies[i], load.key, load.metadata, registry, registerRegistry, loader.trace && (link.depMap = {}));

    return Promise.all(depsInstantiatePromises);
  })
  .then(function (dependencyInstantiations) {
    link.dependencyInstantiations = dependencyInstantiations;

    // run setters to set up bindings to instantiated dependencies
    if (link.setters) {
      for (var i = 0; i < dependencyInstantiations.length; i++) {
        var setter = link.setters[i];
        if (setter) {
          var instantiation = dependencyInstantiations[i];

          if (instantiation instanceof ModuleNamespace) {
            setter(instantiation);
          }
          else {
            setter(instantiation.module || instantiation.linkRecord.moduleObj);
            // this applies to both es and dynamic registrations
            if (instantiation.importerSetters)
              instantiation.importerSetters.push(setter);
          }
        }
      }
    }
  })))
  .then(function () {
    // now deeply instantiateDeps on each dependencyInstantiation that is a load record
    var deepDepsInstantiatePromises = [];

    for (var i = 0; i < link.dependencies.length; i++) {
      var depLoad = link.dependencyInstantiations[i];
      var depLink = depLoad.linkRecord;

      if (!depLink || depLink.linked)
        continue;

      if (seen.indexOf(depLoad) !== -1)
        continue;
      seen.push(depLoad);

      deepDepsInstantiatePromises.push(instantiateDeps(loader, depLoad, depLoad.linkRecord, registry, registerRegistry, seen));
    }

    return Promise.all(deepDepsInstantiatePromises);
  })
  .then(function () {
    // as soon as all dependencies instantiated, we are ready for evaluation so can add to the registry
    // this can run multiple times, but so what
    link.linked = true;
    if (loader.trace)
      traceLoad(loader, load, link);

    return load;
  })
  .catch(function (err) {
    err = addToError(err, 'Loading ' + load.key);

    // throw up the instantiateDeps stack
    // loads are then synchonously cleared at the top-level through the clearLoadErrors helper below
    // this then ensures avoiding partially unloaded tree states
    link.error = link.error || err;

    throw err;
  });
}

// clears an errored load and all its errored dependencies from the loads registry
function clearLoadErrors (loader, load) {
  // clear from loads
  if (loader[REGISTER_REGISTRY][load.key] === load)
    loader[REGISTER_REGISTRY][load.key] = undefined;

  var link = load.linkRecord;

  if (!link)
    return;

  if (link.dependencyInstantiations)
    link.dependencyInstantiations.forEach(function (depLoad, index) {
      if (!depLoad || depLoad instanceof ModuleNamespace)
        return;

      if (depLoad.linkRecord) {
        if (depLoad.linkRecord.error) {
          // provides a circular reference check
          if (loader[REGISTER_REGISTRY][depLoad.key] === depLoad)
            clearLoadErrors(loader, depLoad);
        }

        // unregister setters for es dependency load records that will remain
        if (link.setters && depLoad.importerSetters) {
          var setterIndex = depLoad.importerSetters.indexOf(link.setters[index]);
          depLoad.importerSetters.splice(setterIndex, 1);
        }
      }
    });
}

/*
 * System.register
 */
RegisterLoader.prototype.register = function (key, deps, declare) {
  // anonymous modules get stored as lastAnon
  if (declare === undefined) {
    this[REGISTERED_LAST_ANON] = [key, deps, false];
  }

  // everything else registers into the register cache
  else {
    var load = this[REGISTER_REGISTRY][key] || createLoadRecord.call(this, key, undefined);
    load.registration = [deps, declare, false];
    if (load.metadata)
      load.metadata.registered = true;
  }
};

/*
 * System.registerDyanmic
 */
RegisterLoader.prototype.registerDynamic = function (key, deps, execute) {
  // anonymous modules get stored as lastAnon
  if (typeof key !== 'string') {
    this[REGISTERED_LAST_ANON] = [key, typeof deps === 'boolean' ? dynamicExecuteCompat(key, deps, execute) : deps, true];
  }

  // everything else registers into the register cache
  else {
    var load = this[REGISTER_REGISTRY][key] || createLoadRecord.call(this, key, undefined);
    load.registration = [deps, typeof execute === 'boolean' ? dynamicExecuteCompat(deps, execute, arguments[3]) : execute, true];
    if (load.metadata)
      load.metadata.registered = true;
  }
};

function dynamicExecuteCompat (deps, executingRequire, execute) {
  return function (require, exports, module) {
    // evaluate deps first
    if (!executingRequire)
      for (var i = 0; i < deps.length; i++)
        require(deps[i]);

    // then run execution function
    // also provide backwards compat for no return value
    // previous 4 argument form of System.register had "this" as global value
    module.exports = execute.apply(global$1, arguments) || module.exports;
  };
}

// NB this is being deprecated
RegisterLoader.prototype.processRegisterContext = function (contextKey) {
  var registeredLastAnon = this[REGISTERED_LAST_ANON];

  if (!registeredLastAnon)
    return;

  this[REGISTERED_LAST_ANON] = undefined;

  // returning the defined value allows avoiding an extra lookup for custom instantiate
  var load = this[REGISTER_REGISTRY][contextKey] || createLoadRecord.call(this, contextKey, undefined);
  load.registration = registeredLastAnon;
  load.metadata.registered = true;
};

// ContextualLoader class
// backwards-compatible with previous System.register context argument by exposing .id
function ContextualLoader (loader, key) {
  this.loader = loader;
  this.key = this.id = key;
}
ContextualLoader.prototype.constructor = function () {
  throw new TypeError('Cannot subclass the contextual loader only Reflect.Loader.');
};
ContextualLoader.prototype.import = function (key) {
  return this.loader.import(key, this.key);
};
ContextualLoader.prototype.resolve = function (key) {
  return this.loader.resolve(key, this.key);
};
ContextualLoader.prototype.load = function (key) {
  return this.loader.load(key, this.key);
};

// this is the execution function bound to the Module namespace record
function ensureEvaluate (loader, load, link, registry, registerRegistry, seen) {
  if (load.module)
    return load.module;

  if (link.error)
    throw link.error;

  if (seen && seen.indexOf(load) !== -1)
    return load.linkRecord.moduleObj;

  // for ES loads we always run ensureEvaluate on top-level, so empty seen is passed regardless
  // for dynamic loads, we pass seen if also dynamic
  var err = doEvaluate(loader, load, link, registry, registerRegistry, load.setters ? [] : seen || []);
  if (err) {
    clearLoadErrors(loader, load);
    throw err;
  }

  return load.module;
}

function makeDynamicRequire (loader, key, dependencies, dependencyInstantiations, registry, registerRegistry, seen) {
  // we can only require from already-known dependencies
  return function (name) {
    for (var i = 0; i < dependencies.length; i++) {
      if (dependencies[i] === name) {
        var depLoad = dependencyInstantiations[i];
        var module;

        if (depLoad instanceof ModuleNamespace)
          module = depLoad;
        else
          module = ensureEvaluate(loader, depLoad, depLoad.linkRecord, registry, registerRegistry, seen);

        return module.__useDefault ? module.default : module;
      }
    }
    throw new Error('Module ' + name + ' not declared as a System.registerDynamic dependency of ' + key);
  };
}

// ensures the given es load is evaluated
// returns the error if any
function doEvaluate (loader, load, link, registry, registerRegistry, seen) {
  seen.push(load);

  var err;

  // es modules evaluate dependencies first
  // non es modules explicitly call moduleEvaluate through require
  if (link.setters) {
    var depLoad, depLink;
    for (var i = 0; i < link.dependencies.length; i++) {
      depLoad = link.dependencyInstantiations[i];

      // custom Module returned from instantiate
      // it is the responsibility of the executor to remove the module from the registry on failure
      if (depLoad instanceof ModuleNamespace) {
        err = nsEvaluate(depLoad);
      }

      // ES or dynamic execute
      else {
        depLink = depLoad.linkRecord;
        if (depLink && seen.indexOf(depLoad) === -1) {
          if (depLink.error)
            err = depLink.error;
          else
            // dynamic / declarative boundaries clear the "seen" list
            // we just let cross format circular throw as would happen in real implementations
            err = doEvaluate(loader, depLoad, depLink, registry, registerRegistry, depLink.setters ? seen : []);
        }
      }

      if (err)
        return link.error = addToError(err, 'Evaluating ' + load.key);
    }
  }

  // link.execute won't exist for Module returns from instantiate on top-level load
  if (link.execute) {
    // ES System.register execute
    // "this" is null in ES
    if (link.setters) {
      err = doExecute(link.execute, nullContext);
    }
    // System.registerDynamic execute
    // "this" is "exports" in CJS
    else {
      var module = { id: load.key };
      var moduleObj = link.moduleObj;
      Object.defineProperty(module, 'exports', {
        set: function (exports) {
          moduleObj.default = exports;
        },
        get: function () {
          return moduleObj.default;
        }
      });
      err = doExecute(link.execute, module.exports, [
        makeDynamicRequire(loader, load.key, link.dependencies, link.dependencyInstantiations, registry, registerRegistry, seen),
        module.exports,
        module
      ]);

      // copy module.exports onto the module object
      if (!err)
        copyNamedExports(module.exports, moduleObj);
    }
  }

  if (err)
    return link.error = addToError(err, 'Evaluating ' + load.key);

  registry[load.key] = load.module = new ModuleNamespace(link.moduleObj);

  // if not an esm module, run importer setters and clear them
  // this allows dynamic modules to update themselves into es modules
  // as soon as execution has completed
  if (!link.setters) {
    if (load.importerSetters)
      for (var i = 0; i < load.importerSetters.length; i++)
        load.importerSetters[i](load.module);
    load.importerSetters = undefined;
  }

  // dispose link record
  load.linkRecord = undefined;
}

// {} is the closest we can get to call(undefined)
var nullContext = {};
if (Object.freeze)
  Object.freeze(nullContext);
function doExecute (execute, context, args) {
  try {
    execute.apply(context, args);
  }
  catch (e) {
    return e;
  }
}

function nsEvaluate (ns) {
  try {
    ModuleNamespace.evaluate(ns);
  }
  catch (e) {
    return e;
  }
}

/*
 * Source loading
 */
async function fetchFetch (url, authorization, integrity, asBuffer) {
  livelyLog("SystemJS fetch " + url)
  // fetch doesn't support file:/// urls
  if (url.substr(0, 8) === 'file:///') {
    if (hasXhr)
      return xhrFetch(url, authorization);
    else
      throw new Error('Unable to fetch file URLs in this environment.');
  }

  // percent encode just "#" for HTTP requests
  url = url.replace(/#/g, '%23');

  var opts = {
    // NB deprecate
    headers: { Accept: 'application/x-es-module, */*' }
  };

  if (integrity)
    opts.integrity = integrity;

  if (authorization) {
    if (typeof authorization == 'string')
      opts.headers['Authorization'] = authorization;
    opts.credentials = 'include';
  }

  livelyLog("fetch " + url)
  try {
    var res = await fetch(url, opts)
    .then(function(res) {

      livelyLog("res " + res.statusText)

      if (res.ok)
        return asBuffer ? res.arrayBuffer() : res.text();
      else
        throw new Error('Fetch error: ' + res.status + ' ' + res.statusText);
    }).catch(e => {
      livelyLog("fetch error " + e)
    })    
  } catch(e) {
    console.log("fetch try catch " + e)
  }
  
  return res
}

function xhrFetch (url, authorization, integrity, asBuffer) {
  return new Promise(function (resolve, reject) {
    // percent encode just "#" for HTTP requests
    url = url.replace(/#/g, '%23');

    var xhr = new XMLHttpRequest();
    if (asBuffer)
      xhr.responseType = 'arraybuffer';
    function load() {
      resolve(asBuffer ? xhr.response : xhr.responseText);
    }
    function error() {
      reject(new Error('XHR error' + (xhr.status ? ' (' + xhr.status + (xhr.statusText ? ' ' + xhr.statusText  : '') + ')' : '') + ' loading ' + url));
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        // in Chrome on file:/// URLs, status is 0
        if (xhr.status == 0) {
          if (xhr.response) {
            load();
          }
          else {
            // when responseText is empty, wait for load or error event
            // to inform if it is a 404 or empty file
            xhr.addEventListener('error', error);
            xhr.addEventListener('load', load);
          }
        }
        else if (xhr.status === 200) {
          load();
        }
        else {
          error();
        }
      }
    };
    xhr.open("GET", url, true);

    if (xhr.setRequestHeader) {
      xhr.setRequestHeader('Accept', 'application/x-es-module, */*');
      // can set "authorization: true" to enable withCredentials only
      if (authorization) {
        if (typeof authorization == 'string')
          xhr.setRequestHeader('Authorization', authorization);
        xhr.withCredentials = true;
      }
    }

    xhr.send(null);
  });
}

var fs;
function nodeFetch (url, authorization, integrity, asBuffer) {
  if (url.substr(0, 8) != 'file:///')
    return Promise.reject(new Error('Unable to fetch "' + url + '". Only file URLs of the form file:/// supported running in Node.'));

  fs = fs || require('fs');
  if (isWindows)
    url = url.replace(/\//g, '\\').substr(8);
  else
    url = url.substr(7);

  return new Promise(function (resolve, reject) {
    fs.readFile(url, function(err, data) {
      if (err) {
        return reject(err);
      }
      else {
        if (asBuffer) {
          resolve(data);
        }
        else {
          // Strip Byte Order Mark out if it's the leading char
          var dataString = data + '';
          if (dataString[0] === '\ufeff')
            dataString = dataString.substr(1);

          resolve(dataString);
        }
      }
    });
  });
}

function noFetch () {
  throw new Error('No fetch method is defined for this environment.');
}

var fetchFunction;

var hasXhr = typeof XMLHttpRequest !== 'undefined';

if (typeof self !== 'undefined' && typeof self.fetch !== 'undefined')
 fetchFunction = fetchFetch;
else if (hasXhr)
  fetchFunction = xhrFetch;
else if (typeof require !== 'undefined' && typeof process !== 'undefined')
  fetchFunction = nodeFetch;
else
  fetchFunction = noFetch;

var fetch$1 = fetchFunction;

// separate out paths cache as a baseURL lock process
function applyPaths (paths, key) {
  // most specific (most number of slashes in path) match wins
  var pathMatch = '', wildcard;

  // check to see if we have a paths entry
  for (var p in paths) {
    if (!paths.hasOwnProperty(p))
      continue;

    // exact path match
    if (key === p)
      return paths[p];

    // support trailing / in paths rules
    else if ((key.length < p.length || key[p.length - 1] === p[p.length - 1]) && (paths[p][paths[p].length - 1] === '/' || paths[p] === '')
        && key.substr(0, p.length - 1) === p.substr(0, p.length - 1))
      return paths[p].substr(0, paths[p].length - 1) + (key.length > p.length ? (paths[p] && '/' || '') + key.substr(p.length) : '');
  }

  var outPath = paths[pathMatch];
  if (typeof wildcard === 'string')
    outPath = outPath.replace('*', wildcard);

  return outPath;
}

function getParentMetadata (loader, config, metadata, parentKey) {
  var parentMetadata = loader[CREATE_METADATA]();

  if (parentKey) {
    // detect parent plugin
    // we just need pluginKey to be truthy for package configurations
    // so we duplicate it as pluginArgument - although not correct its not used
    var parentPluginIndex;
    if (config.pluginFirst) {
      if ((parentPluginIndex = parentKey.lastIndexOf('!')) !== -1)
        parentMetadata.pluginArgument = parentMetadata.pluginKey = parentKey.substr(0, parentPluginIndex);
    }
    else {
      if ((parentPluginIndex = parentKey.indexOf('!')) !== -1)
        parentMetadata.pluginArgument = parentMetadata.pluginKey = parentKey.substr(parentPluginIndex + 1);
    }

    // detect parent package
    parentMetadata.packageKey = getPackage(config, parentKey);
    if (parentMetadata.packageKey)
      parentMetadata.packageConfig = config.packages[parentMetadata.packageKey];
  }

  return parentMetadata;
}

function normalize (key, parentKey, metadata, parentMetadata) {
  var config = this[CONFIG];

  // these are because users can still call System.normalize('a', 'b')
  // this will be fixed with deprecating normalize and even sooner with es-module-loader 2
  // which doesn't need to share the "normalize" prototype method
  metadata = metadata || this[CREATE_METADATA]();
  parentMetadata = parentMetadata || getParentMetadata(this, config, metadata, parentKey);

  var loader = this;
  return booleanConditional.call(loader, key, parentKey)
  .then(function (key) {
    // pluginResolve wraps packageResolve wraps coreResolve
    return pluginResolve.call(loader, config, key, parentKey, metadata, parentMetadata);
  })
  .then(function (normalized) {
    return interpolateConditional.call(loader, normalized, parentKey, parentMetadata);
  })
  .then(function (normalized) {
    setMeta.call(loader, config, normalized, metadata);

    if (metadata.pluginKey || !metadata.load.loader)
      return normalized;

    // loader by configuration
    // normalizes to parent to support package loaders
    return loader.normalize(metadata.load.loader, normalized, loader[CREATE_METADATA](), metadata)
    .then(function (pluginKey) {
      metadata.pluginKey = pluginKey;
      metadata.pluginArgument = normalized;
      return normalized;
    });
  });
}

// normalization function used for registry keys
// just does coreResolve without map + plugins
function decanonicalize (config, key) {
  var parsed = parsePlugin(config, key);

  // plugin
  if (parsed) {
    var pluginKey = decanonicalize.call(this, config, parsed.plugin);
    return combinePluginParts(config, coreResolve.call(this, config, parsed.argument, undefined, false), pluginKey);
  }

  return coreResolve.call(this, config, key, undefined, false);
}

function normalizeSync (key, parentKey) {
  livelyLog("normalizeSync " + key, parentKey)
  var config = this[CONFIG];

  // normalizeSync is metadataless, so create metadata
  var metadata = this[CREATE_METADATA]();
  var parentMetadata = parentMetadata || getParentMetadata(this, config, metadata, parentKey);

  var parsed = parsePlugin(config, key);

  // plugin
  if (parsed) {
    metadata.pluginKey = this.normalizeSync(parsed.plugin, parentKey);
    return combinePluginParts(config,
        packageResolveSync.call(this, config, parsed.argument, parentMetadata.pluginArgument || parentKey, metadata, parentMetadata, !!metadata.pluginKey),
        metadata.pluginKey);
  }

  return packageResolveSync.call(this, config, key, parentMetadata.pluginArgument || parentKey, metadata, parentMetadata, !!metadata.pluginKey);
}

function normalizePaths (config) {
  for (var p in config.paths) {
    if (!config.paths.hasOwnProperty(p))
      continue;
    // warn on wildcard path deprecations
    var path = config.paths[p];
    if (path.indexOf('*') !== -1)
      warn.call(config, 'Paths configuration "' + p + '" -> "' + path + '" uses wildcards which are no longer supported.', true);
    config.paths[p] = resolveUrlToParentIfNotPlain(path, baseURI) || resolveUrlToParentIfNotPlain('./' + path, config.baseURL);
  }
  config.pathsLocked = true;
}

function coreResolve (config, key, parentKey, doMap) {
  if (!config.pathsLocked)
    normalizePaths(config);

  var relativeResolved = resolveUrlToParentIfNotPlain(key, parentKey || baseURI);

  // standard URL resolution
  if (relativeResolved)
    return applyPaths(config.paths, relativeResolved) || relativeResolved;

  // plain keys not starting with './', 'x://' and '/' go through custom resolution
  if (doMap) {
    var mapMatch = getMapMatch(config.map, key);

    if (mapMatch) {
      key = config.map[mapMatch] + key.substr(mapMatch.length);

      relativeResolved = resolveUrlToParentIfNotPlain(key, baseURI);
      if (relativeResolved)
        return relativeResolved;
    }
  }

  if (this.registry.has(key))
    return key;

  if (key.substr(0, 6) === '@node/')
    return key;

  return applyPaths(config.paths, key) || config.baseURL + key;
}

function pluginResolve (config, key, parentKey, metadata, parentMetadata) {
  var parsed = parsePlugin(config, key);

  if (!parsed)
    return packageResolve.call(this, config, key, parentMetadata && parentMetadata.pluginArgument || parentKey, metadata, parentMetadata, false);

  metadata.pluginKey = parsed.plugin;

  return Promise.all([
    packageResolve.call(this, config, parsed.argument, parentMetadata && parentMetadata.pluginArgument || parentKey, metadata, parentMetadata, true),
    this.resolve(parsed.plugin, parentKey)
  ])
  .then(function (normalized) {
    metadata.pluginArgument = normalized[0];
    metadata.pluginKey = normalized[1];

    // don't allow a plugin to load itself
    if (metadata.pluginArgument === metadata.pluginKey)
      throw new Error('Plugin ' + metadata.pluginArgument + ' cannot load itself, make sure it is excluded from any wildcard meta configuration via a custom loader: false rule.');

    return combinePluginParts(config, normalized[0], normalized[1]);
  });
}

function packageResolveSync (config, key, parentKey, metadata, parentMetadata, skipExtensions) {
  // ignore . since internal maps handled by standard package resolution
  if (parentMetadata && parentMetadata.packageConfig && key[0] !== '.') {
    var parentMap = parentMetadata.packageConfig.map;
    var parentMapMatch = parentMap && getMapMatch(parentMap, key);

    if (parentMapMatch && typeof parentMap[parentMapMatch] === 'string') {
      var mapped = doMapSync(this, config, parentMetadata.packageConfig, parentMetadata.packageKey, parentMapMatch, key, metadata, skipExtensions);
      if (mapped)
        return mapped;
    }
  }

  var normalized = coreResolve.call(this, config, key, parentKey, true);

  var pkgConfigMatch = getPackageConfigMatch(config, normalized);
  metadata.packageKey = pkgConfigMatch && pkgConfigMatch.packageKey || getPackage(config, normalized);

  if (!metadata.packageKey)
    return normalized;

  if (config.packageConfigKeys.indexOf(normalized) !== -1) {
    metadata.packageKey = undefined;
    return normalized;
  }

  metadata.packageConfig = config.packages[metadata.packageKey] || (config.packages[metadata.packageKey] = createPackage());

  var subPath = normalized.substr(metadata.packageKey.length + 1);

  return applyPackageConfigSync(this, config, metadata.packageConfig, metadata.packageKey, subPath, metadata, skipExtensions);
}

function packageResolve (config, key, parentKey, metadata, parentMetadata, skipExtensions) {
  var loader = this;

  return Promise.resolve()
  .then(function () {
    // ignore . since internal maps handled by standard package resolution
    if (parentMetadata && parentMetadata.packageConfig && key.substr(0, 2) !== './') {
      var parentMap = parentMetadata.packageConfig.map;
      var parentMapMatch = parentMap && getMapMatch(parentMap, key);

      if (parentMapMatch)
        return doMap(loader, config, parentMetadata.packageConfig, parentMetadata.packageKey, parentMapMatch, key, metadata, skipExtensions);
    }

    return Promise.resolve();
  })
  .then(function (mapped) {
    if (mapped)
      return mapped;

    // apply map, core, paths, contextual package map
    var normalized = coreResolve.call(loader, config, key, parentKey, true);

    var pkgConfigMatch = getPackageConfigMatch(config, normalized);
    metadata.packageKey = pkgConfigMatch && pkgConfigMatch.packageKey || getPackage(config, normalized);

    if (!metadata.packageKey)
      return Promise.resolve(normalized);

    if (config.packageConfigKeys.indexOf(normalized) !== -1) {
      metadata.packageKey = undefined;
      metadata.load = createMeta();
      metadata.load.format = 'json';
      return Promise.resolve(normalized);
    }

    metadata.packageConfig = config.packages[metadata.packageKey] || (config.packages[metadata.packageKey] = createPackage());

    // load configuration when it matches packageConfigPaths, not already configured, and not the config itself
    var loadConfig = pkgConfigMatch && !metadata.packageConfig.configured;

    return (loadConfig ? loadPackageConfigPath(loader, config, pkgConfigMatch.configPath, metadata) : Promise.resolve())
    .then(function () {
      var subPath = normalized.substr(metadata.packageKey.length + 1);

      return applyPackageConfig(loader, config, metadata.packageConfig, metadata.packageKey, subPath, metadata, skipExtensions);
    });
  });
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
      var bestDepth = 0;

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

function parsePlugin (config, key) {
  var argumentKey;
  var pluginKey;

  var pluginIndex = key.lastIndexOf('!');

  if (pluginIndex === -1)
    return;

  if (config.pluginFirst) {
    argumentKey = key.substr(pluginIndex + 1);
    pluginKey = key.substr(0, pluginIndex);
  }
  else {
    argumentKey = key.substr(0, pluginIndex);
    pluginKey = key.substr(pluginIndex + 1) || argumentKey.substr(argumentKey.lastIndexOf('.') + 1);
  }

  return {
    argument: argumentKey,
    plugin: pluginKey
  };
}

// put key back together after parts have been normalized
function combinePluginParts (config, argumentKey, pluginKey) {
  if (config.pluginFirst)
    return pluginKey + '!' + argumentKey;
  else
    return argumentKey + '!' + pluginKey;
}

/*
 * Package Configuration Extension
 *
 * Example:
 *
 * SystemJS.packages = {
 *   jquery: {
 *     main: 'index.js', // when not set, package key is requested directly
 *     format: 'amd',
 *     defaultExtension: 'ts', // defaults to 'js', can be set to false
 *     modules: {
 *       '*.ts': {
 *         loader: 'typescript'
 *       },
 *       'vendor/sizzle.js': {
 *         format: 'global'
 *       }
 *     },
 *     map: {
 *        // map internal require('sizzle') to local require('./vendor/sizzle')
 *        sizzle: './vendor/sizzle.js',
 *        // map any internal or external require of 'jquery/vendor/another' to 'another/index.js'
 *        './vendor/another.js': './another/index.js',
 *        // test.js / test -> lib/test.js
 *        './test.js': './lib/test.js',
 *
 *        // environment-specific map configurations
 *        './index.js': {
 *          '~browser': './index-node.js',
 *          './custom-condition.js|~export': './index-custom.js'
 *        }
 *     },
 *     // allows for setting package-prefixed depCache
 *     // keys are normalized module keys relative to the package itself
 *     depCache: {
 *       // import 'package/index.js' loads in parallel package/lib/test.js,package/vendor/sizzle.js
 *       './index.js': ['./test'],
 *       './test.js': ['external-dep'],
 *       'external-dep/path.js': ['./another.js']
 *     }
 *   }
 * };
 *
 * Then:
 *   import 'jquery'                       -> jquery/index.js
 *   import 'jquery/submodule'             -> jquery/submodule.js
 *   import 'jquery/submodule.ts'          -> jquery/submodule.ts loaded as typescript
 *   import 'jquery/vendor/another'        -> another/index.js
 *
 * Detailed Behaviours
 * - main can have a leading "./" can be added optionally
 * - map and defaultExtension are applied to the main
 * - defaultExtension adds the extension only if the exact extension is not present

 * - if a meta value is available for a module, map and defaultExtension are skipped
 * - like global map, package map also applies to subpaths (sizzle/x, ./vendor/another/sub)
 * - condition module map is '@env' module in package or '@system-env' globally
 * - map targets support conditional interpolation ('./x': './x.#{|env}.js')
 * - internal package map targets cannot use boolean conditionals
 *
 * Package Configuration Loading
 *
 * Not all packages may already have their configuration present in the System config
 * For these cases, a list of packageConfigPaths can be provided, which when matched against
 * a request, will first request a ".json" file by the package key to derive the package
 * configuration from. This allows dynamic loading of non-predetermined code, a key use
 * case in SystemJS.
 *
 * Example:
 *
 *   SystemJS.packageConfigPaths = ['packages/test/package.json', 'packages/*.json'];
 *
 *   // will first request 'packages/new-package/package.json' for the package config
 *   // before completing the package request to 'packages/new-package/path'
 *   SystemJS.import('packages/new-package/path');
 *
 *   // will first request 'packages/test/package.json' before the main
 *   SystemJS.import('packages/test');
 *
 * When a package matches packageConfigPaths, it will always send a config request for
 * the package configuration.
 * The package key itself is taken to be the match up to and including the last wildcard
 * or trailing slash.
 * The most specific package config path will be used.
 * Any existing package configurations for the package will deeply merge with the
 * package config, with the existing package configurations taking preference.
 * To opt-out of the package configuration request for a package that matches
 * packageConfigPaths, use the { configured: true } package config option.
 *
 */
function getPackage (config, normalized) {
  // use most specific package
  var curPkg, curPkgLen = 0, pkgLen;
  for (var p in config.packages) {
    if (normalized.substr(0, p.length) === p && (normalized.length === p.length || normalized[p.length] === '/')) {
      pkgLen = p.split('/').length;
      if (pkgLen > curPkgLen) {
        curPkg = p;
        curPkgLen = pkgLen;
      }
    }
  }
  return curPkg;
}

function addDefaultExtension (config, pkg, pkgKey, subPath, skipExtensions) {
  // don't apply extensions to folders or if defaultExtension = false
  if (!subPath || !pkg.defaultExtension || subPath[subPath.length - 1] === '/' || skipExtensions)
    return subPath;

  var metaMatch = false;

  // exact meta or meta with any content after the last wildcard skips extension
  if (pkg.meta)
    getMetaMatches(pkg.meta, subPath, function (metaPattern, matchMeta, matchDepth) {
      if (matchDepth === 0 || metaPattern.lastIndexOf('*') !== metaPattern.length - 1)
        return metaMatch = true;
    });

  // exact global meta or meta with any content after the last wildcard skips extension
  if (!metaMatch && config.meta)
    getMetaMatches(config.meta, pkgKey + '/' + subPath, function (metaPattern, matchMeta, matchDepth) {
      if (matchDepth === 0 || metaPattern.lastIndexOf('*') !== metaPattern.length - 1)
        return metaMatch = true;
    });

  if (metaMatch)
    return subPath;

  // work out what the defaultExtension is and add if not there already
  var defaultExtension = '.' + pkg.defaultExtension;
  if (subPath.substr(subPath.length - defaultExtension.length) !== defaultExtension)
    return subPath + defaultExtension;
  else
    return subPath;
}

function applyPackageConfigSync (loader, config, pkg, pkgKey, subPath, metadata, skipExtensions) {
  // main
  if (!subPath) {
    if (pkg.main)
      subPath = pkg.main.substr(0, 2) === './' ? pkg.main.substr(2) : pkg.main;
    else
      // also no submap if key is package itself (import 'pkg' -> 'path/to/pkg.js')
      // NB can add a default package main convention here
      // if it becomes internal to the package then it would no longer be an exit path
      return pkgKey;
  }

  // map config checking without then with extensions
  if (pkg.map) {
    var mapPath = './' + subPath;

    var mapMatch = getMapMatch(pkg.map, mapPath);

    // we then check map with the default extension adding
    if (!mapMatch) {
      mapPath = './' + addDefaultExtension(loader, pkg, pkgKey, subPath, skipExtensions);
      if (mapPath !== './' + subPath)
        mapMatch = getMapMatch(pkg.map, mapPath);
    }
    if (mapMatch) {
      var mapped = doMapSync(loader, config, pkg, pkgKey, mapMatch, mapPath, metadata, skipExtensions);
      if (mapped)
        return mapped;
    }
  }

  // normal package resolution
  return pkgKey + '/' + addDefaultExtension(loader, pkg, pkgKey, subPath, skipExtensions);
}

function validMapping (mapMatch, mapped, path) {
  // allow internal ./x -> ./x/y or ./x/ -> ./x/y recursive maps
  // but only if the path is exactly ./x and not ./x/z
  if (mapped.substr(0, mapMatch.length) === mapMatch && path.length > mapMatch.length)
    return false;

  return true;
}

function doMapSync (loader, config, pkg, pkgKey, mapMatch, path, metadata, skipExtensions) {
  if (path[path.length - 1] === '/')
    path = path.substr(0, path.length - 1);
  var mapped = pkg.map[mapMatch];

  if (typeof mapped === 'object')
    throw new Error('Synchronous conditional normalization not supported sync normalizing ' + mapMatch + ' in ' + pkgKey);

  if (!validMapping(mapMatch, mapped, path) || typeof mapped !== 'string')
    return;

  return packageResolveSync.call(this, config, mapped + path.substr(mapMatch.length), pkgKey + '/', metadata, metadata, skipExtensions);
}

function applyPackageConfig (loader, config, pkg, pkgKey, subPath, metadata, skipExtensions) {
  // main
  if (!subPath) {
    if (pkg.main)
      subPath = pkg.main.substr(0, 2) === './' ? pkg.main.substr(2) : pkg.main;
    // also no submap if key is package itself (import 'pkg' -> 'path/to/pkg.js')
    else
      // NB can add a default package main convention here
      // if it becomes internal to the package then it would no longer be an exit path
      return Promise.resolve(pkgKey);
  }

  // map config checking without then with extensions
  var mapPath, mapMatch;

  if (pkg.map) {
    mapPath = './' + subPath;
    mapMatch = getMapMatch(pkg.map, mapPath);

    // we then check map with the default extension adding
    if (!mapMatch) {
      mapPath = './' + addDefaultExtension(loader, pkg, pkgKey, subPath, skipExtensions);
      if (mapPath !== './' + subPath)
        mapMatch = getMapMatch(pkg.map, mapPath);
    }
  }

  return (mapMatch ? doMap(loader, config, pkg, pkgKey, mapMatch, mapPath, metadata, skipExtensions) : Promise.resolve())
  .then(function (mapped) {
    if (mapped)
      return Promise.resolve(mapped);

    // normal package resolution / fallback resolution for no conditional match
    return Promise.resolve(pkgKey + '/' + addDefaultExtension(loader, pkg, pkgKey, subPath, skipExtensions));
  });
}

function doMap (loader, config, pkg, pkgKey, mapMatch, path, metadata, skipExtensions) {
  if (path[path.length - 1] === '/')
    path = path.substr(0, path.length - 1);

  var mapped = pkg.map[mapMatch];

  if (typeof mapped === 'string') {
    if (!validMapping(mapMatch, mapped, path))
      return Promise.resolve();
    return packageResolve.call(loader, config, mapped + path.substr(mapMatch.length), pkgKey + '/', metadata, metadata, skipExtensions)
    .then(function (normalized) {
      return interpolateConditional.call(loader, normalized, pkgKey + '/', metadata);
    });
  }

  // we use a special conditional syntax to allow the builder to handle conditional branch points further
  /*if (loader.builder)
    return Promise.resolve(pkgKey + '/#:' + path);*/

  // we load all conditions upfront
  var conditionPromises = [];
  var conditions = [];
  for (var e in mapped) {
    var c = parseCondition(e);
    conditions.push({
      condition: c,
      map: mapped[e]
    });
    conditionPromises.push(loader.import(c.module, pkgKey));
  }

  // map object -> conditional map
  return Promise.all(conditionPromises)
  .then(function (conditionValues) {
    // first map condition to match is used
    for (var i = 0; i < conditions.length; i++) {
      var c = conditions[i].condition;
      var value = readMemberExpression(c.prop, conditionValues[i].__useDefault ? conditionValues[i].default : conditionValues[i]);
      if (!c.negate && value || c.negate && !value)
        return conditions[i].map;
    }
  })
  .then(function (mapped) {
    if (mapped) {
      if (!validMapping(mapMatch, mapped, path))
        return Promise.resolve();
      return packageResolve.call(loader, config, mapped + path.substr(mapMatch.length), pkgKey + '/', metadata, metadata, skipExtensions)
      .then(function (normalized) {
        return interpolateConditional.call(loader, normalized, pkgKey + '/', metadata);
      });
    }

    // no environment match -> fallback to original subPath by returning undefined
  });
}

// check if the given normalized key matches a packageConfigPath
// if so, loads the config
var packageConfigPaths = {};

// data object for quick checks against package paths
function createPkgConfigPathObj (path) {
  var lastWildcard = path.lastIndexOf('*');
  var length = Math.max(lastWildcard + 1, path.lastIndexOf('/'));
  return {
    length: length,
    regEx: new RegExp('^(' + path.substr(0, length).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^\\/]+') + ')(\\/|$)'),
    wildcard: lastWildcard !== -1
  };
}

// most specific match wins
function getPackageConfigMatch (config, normalized) {
  var pkgKey, exactMatch = false, configPath;
  for (var i = 0; i < config.packageConfigPaths.length; i++) {
    var packageConfigPath = config.packageConfigPaths[i];
    var p = packageConfigPaths[packageConfigPath] || (packageConfigPaths[packageConfigPath] = createPkgConfigPathObj(packageConfigPath));
    if (normalized.length < p.length)
      continue;
    var match = normalized.match(p.regEx);
    if (match && (!pkgKey || (!(exactMatch && p.wildcard) && pkgKey.length < match[1].length))) {
      pkgKey = match[1];
      exactMatch = !p.wildcard;
      configPath = pkgKey + packageConfigPath.substr(p.length);
    }
  }

  if (!pkgKey)
    return;

  return {
    packageKey: pkgKey,
    configPath: configPath
  };
}

function loadPackageConfigPath (loader, config, pkgConfigPath, metadata, normalized) {
  var configLoader = loader.pluginLoader || loader;

  // ensure we note this is a package config file path
  // it will then be skipped from getting other normalizations itself to ensure idempotency
  if (config.packageConfigKeys.indexOf(pkgConfigPath) === -1)
    config.packageConfigKeys.push(pkgConfigPath);

  return configLoader.import(pkgConfigPath)
  .then(function (pkgConfig) {
    if (pkgConfig.__useDefault)
      pkgConfig = pkgConfig.default;
    setPkgConfig(metadata.packageConfig, pkgConfig, metadata.packageKey, true, config);
    metadata.packageConfig.configured = true;
  })
  .catch(function (err) {
    throw addToError(err, 'Unable to fetch package configuration file ' + pkgConfigPath);
  });
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


/*
 * Conditions Extension
 *
 *   Allows a condition module to alter the resolution of an import via syntax:
 *
 *     import $ from 'jquery/#{browser}';
 *
 *   Will first load the module 'browser' via `SystemJS.import('browser')` and
 *   take the default export of that module.
 *   If the default export is not a string, an error is thrown.
 *
 *   We then substitute the string into the require to get the conditional resolution
 *   enabling environment-specific variations like:
 *
 *     import $ from 'jquery/ie'
 *     import $ from 'jquery/firefox'
 *     import $ from 'jquery/chrome'
 *     import $ from 'jquery/safari'
 *
 *   It can be useful for a condition module to define multiple conditions.
 *   This can be done via the `|` modifier to specify an export member expression:
 *
 *     import 'jquery/#{./browser.js|grade.version}'
 *
 *   Where the `grade` export `version` member in the `browser.js` module  is substituted.
 *
 *
 * Boolean Conditionals
 *
 *   For polyfill modules, that are used as imports but have no module value,
 *   a binary conditional allows a module not to be loaded at all if not needed:
 *
 *     import 'es5-shim#?./conditions.js|needs-es5shim'
 *
 *   These conditions can also be negated via:
 *
 *     import 'es5-shim#?./conditions.js|~es6'
 *
 */

var sysConditions = ['browser', 'node', 'dev', 'build', 'production', 'default'];

function parseCondition (condition) {
  var conditionExport, conditionModule, negation;

  var negation;
  var conditionExportIndex = condition.lastIndexOf('|');
  if (conditionExportIndex !== -1) {
    conditionExport = condition.substr(conditionExportIndex + 1);
    conditionModule = condition.substr(0, conditionExportIndex);

    if (conditionExport[0] === '~') {
      negation = true;
      conditionExport = conditionExport.substr(1);
    }
  }
  else {
    negation = condition[0] === '~';
    conditionExport = 'default';
    conditionModule = condition.substr(negation);
    if (sysConditions.indexOf(conditionModule) != -1) {
      conditionExport = conditionModule;
      conditionModule = null;
    }
  }

  return {
    module: conditionModule || '@system-env',
    prop: conditionExport,
    negate: negation
  };
}

function serializeCondition (conditionObj) {
  return conditionObj.module + '|' + (conditionObj.negate ? '~' : '') + conditionObj.prop;
}

function resolveCondition (conditionObj, parentKey, bool) {
  return this.load(conditionObj.module, parentKey)
  .then(function (condition) {
    var m = readMemberExpression(conditionObj.prop, condition);

    if (bool && typeof m !== 'boolean')
      throw new TypeError('Condition ' + serializeCondition(conditionObj) + ' did not resolve to a boolean.');

    return conditionObj.negate ? !m : m;
  });
}

var interpolationRegEx = /#\{[^\}]+\}/;
function interpolateConditional (key, parentKey, parentMetadata) {
  // first we normalize the conditional
  var conditionalMatch = key.match(interpolationRegEx);

  if (!conditionalMatch)
    return Promise.resolve(key);

  var conditionObj = parseCondition.call(this, conditionalMatch[0].substr(2, conditionalMatch[0].length - 3));

  // in builds, return normalized conditional
  /*if (this.builder)
    return this.normalize(conditionObj.module, parentKey, this[CREATE_METADATA](), parentMetadata)
    .then(function (conditionModule) {
      conditionObj.module = conditionModule;
      return key.replace(interpolationRegEx, '#{' + serializeCondition(conditionObj) + '}');
    });*/

  return resolveCondition.call(this, conditionObj, parentKey, false)
  .then(function (conditionValue) {
    if (typeof conditionValue !== 'string')
      throw new TypeError('The condition value for ' + key + ' doesn\'t resolve to a string.');

    if (conditionValue.indexOf('/') !== -1)
      throw new TypeError('Unabled to interpolate conditional ' + key + (parentKey ? ' in ' + parentKey : '') + '\n\tThe condition value ' + conditionValue + ' cannot contain a "/" separator.');

    return key.replace(interpolationRegEx, conditionValue);
  });
}

function booleanConditional (key, parentKey) {
  // first we normalize the conditional
  var booleanIndex = key.lastIndexOf('#?');

  if (booleanIndex === -1)
    return Promise.resolve(key);

  var conditionObj = parseCondition.call(this, key.substr(booleanIndex + 2));

  // in builds, return normalized conditional
  /*if (this.builder)
    return this.resolve(conditionObj.module, parentKey)
    .then(function (conditionModule) {
      conditionObj.module = conditionModule;
      return key.substr(0, booleanIndex) + '#?' + serializeCondition(conditionObj);
    });*/

  return resolveCondition.call(this, conditionObj, parentKey, true)
  .then(function (conditionValue) {
    return conditionValue ? key.substr(0, booleanIndex) : '@empty';
  });
}

/*
 Extend config merging one deep only

  loader.config({
    some: 'random',
    config: 'here',
    deep: {
      config: { too: 'too' }
    }
  });

  <=>

  loader.some = 'random';
  loader.config = 'here'
  loader.deep = loader.deep || {};
  loader.deep.config = { too: 'too' };


  Normalizes meta and package configs allowing for:

  SystemJS.config({
    meta: {
      './index.js': {}
    }
  });

  To become

  SystemJS.meta['https://thissite.com/index.js'] = {};

  For easy normalization canonicalization with latest URL support.

*/
var envConfigNames = ['browserConfig', 'nodeConfig', 'devConfig', 'buildConfig', 'productionConfig'];
function envSet(loader, cfg, envCallback) {
  for (var i = 0; i < envConfigNames.length; i++) {
    var envConfig = envConfigNames[i];
    if (cfg[envConfig] && envModule[envConfig.substr(0, envConfig.length - 6)])
      envCallback(cfg[envConfig]);
  }
}

function cloneObj (obj, maxDepth) {
  var clone = {};
  for (var p in obj) {
    var prop = obj[p];
    if (maxDepth > 1) {
      if (typeof prop === 'object')
        clone[p] = cloneObj(prop, maxDepth - 1);
      else if (p !== 'packageConfig')
        clone[p] = prop;
    }
    else {
      clone[p] = prop;
    }
  }
  return clone;
}

function getConfigItem (config, p) {
  var cfgItem = config[p];

  // getConfig must return an unmodifiable clone of the configuration
  if (cfgItem instanceof Array)
    return config[p].concat([]);
  else if (typeof cfgItem === 'object')
    return cloneObj(cfgItem, 3)
  else
    return config[p];
}

function getConfig (configName) {
  if (configName) {
    if (configNames.indexOf(configName) !== -1)
      return getConfigItem(this[CONFIG], configName);
    throw new Error('"' + configName + '" is not a valid configuration name to get. Must be one of ' + configNames.join(', ') + '.');
  }

  var cfg = {};
  for (var i = 0; i < configNames.length; i++) {
    var p = configNames[i];
    var configItem = getConfigItem(this[CONFIG], p);
    if (configItem !== undefined)
      cfg[p] = configItem;
  }
  return cfg;
}

function setConfig (cfg, isEnvConfig) {
  var loader = this;
  var config = this[CONFIG];

  if ('warnings' in cfg)
    config.warnings = cfg.warnings;

  if ('wasm' in cfg)
    config.wasm = cfg.wasm;

  if ('production' in cfg || 'build' in cfg)
    setProduction.call(loader, !!cfg.production, !!(cfg.build || envModule && envModule.build));

  if (!isEnvConfig) {
    // if using nodeConfig / browserConfig / productionConfig, take baseURL from there
    // these exceptions will be unnecessary when we can properly implement config queuings
    var baseURL;
    envSet(loader, cfg, function(cfg) {
      baseURL = baseURL || cfg.baseURL;
    });
    baseURL = baseURL || cfg.baseURL;

    // always configure baseURL first
    if (baseURL) {
      if (config.pathsLocked)
        warn$1.call(config, 'baseURL should be set before other config to avoid conflicts.');
      config.baseURL = resolveUrlToParentIfNotPlain(baseURL, baseURI) || resolveUrlToParentIfNotPlain('./' + baseURL, baseURI);
      if (config.baseURL[config.baseURL.length - 1] !== '/')
        config.baseURL += '/';
    }

    var pathsExtended = false;

    if (cfg.paths) {
      extend(config.paths, cfg.paths);
      pathsExtended = true;
    }

    envSet(loader, cfg, function(cfg) {
      if (cfg.paths) {
        extend(config.paths, cfg.paths);
        pathsExtended = true;
      }
    });

    // last pathing additions
    if (config.pathsLocked && pathsExtended) {
      // warn.call(config, 'paths should be set before other config to avoid conflicts.')
      normalizePaths(config);
    }
  }

  if (cfg.defaultJSExtensions)
    warn$1.call(config, 'The defaultJSExtensions configuration option has been removed, use packages configuration defaultExtension instead.', true);

  if (typeof cfg.pluginFirst === 'boolean')
    config.pluginFirst = cfg.pluginFirst;

  if (cfg.map) {
    for (var p in cfg.map) {
      var v = cfg.map[p];

      if (typeof v === 'string') {
        config.map[p] = coreResolve.call(loader, config, v, undefined, false);
      }

      // object map
      else {
        var pkgName = coreResolve.call(loader, config, p, undefined, true);
        var pkg = config.packages[pkgName];
        if (!pkg) {
          pkg = config.packages[pkgName] = createPackage();
          // use '' instead of false to keep type consistent
          pkg.defaultExtension = '';
        }
        setPkgConfig(pkg, { map: v }, pkgName, false, config);
      }
    }
  }

  if (cfg.packageConfigPaths) {
    var packageConfigPaths = [];
    for (var i = 0; i < cfg.packageConfigPaths.length; i++) {
      var path = cfg.packageConfigPaths[i];
      var packageLength = Math.max(path.lastIndexOf('*') + 1, path.lastIndexOf('/'));
      var normalized = coreResolve.call(loader, config, path.substr(0, packageLength), undefined, false);
      packageConfigPaths[i] = normalized + path.substr(packageLength);
    }
    config.packageConfigPaths = packageConfigPaths;
  }

  if (cfg.bundles) {
    for (var p in cfg.bundles) {
      var bundle = [];
      for (var i = 0; i < cfg.bundles[p].length; i++)
        bundle.push(loader.normalizeSync(cfg.bundles[p][i]));
      config.bundles[p] = bundle;
    }
  }

  if (cfg.packages) {
    for (var p in cfg.packages) {
      if (p.match(/^([^\/]+:)?\/\/$/))
        throw new TypeError('"' + p + '" is not a valid package name.');

      var pkgName = coreResolve.call(loader, config, p, undefined, true);

      // allow trailing slash in packages
      if (pkgName[pkgName.length - 1] === '/')
        pkgName = pkgName.substr(0, pkgName.length - 1);

      setPkgConfig(config.packages[pkgName] = config.packages[pkgName] || createPackage(), cfg.packages[p], pkgName, false, config);
    }
  }

  if (cfg.depCache) {
    for (var p in cfg.depCache)
      config.depCache[loader.normalizeSync(p)] = [].concat(cfg.depCache[p]);
  }

  if (cfg.meta) {
    for (var p in cfg.meta) {
      // base wildcard stays base
      if (p[0] === '*') {
        extend(config.meta[p] = config.meta[p] || {}, cfg.meta[p]);
      }
      else {
        var resolved = coreResolve.call(loader, config, p, undefined, true);
        extend(config.meta[resolved] = config.meta[resolved] || {}, cfg.meta[p]);
      }
    }
  }

  if ('transpiler' in cfg)
    config.transpiler = cfg.transpiler;


  // copy any remaining non-standard configuration properties
  for (var c in cfg) {
    if (configNames.indexOf(c) !== -1)
      continue;
    if (envConfigNames.indexOf(c) !== -1)
      continue;
    // warn.call(config, 'Setting custom config option `System.config({ ' + c + ': ... })` is deprecated. Avoid custom config options or set SystemJS.' + c + ' = ... directly.');

    config[c] = cfg[c];
  }

  envSet(loader, cfg, function(cfg) {
    loader.config(cfg, true);
  });
}

function createPackage () {
  return {
    defaultExtension: undefined,
    main: undefined,
    format: undefined,
    meta: undefined,
    map: undefined,
    packageConfig: undefined,
    configured: false
  };
}

// deeply-merge (to first level) config with any existing package config
function setPkgConfig (pkg, cfg, pkgName, prependConfig, config) {
  for (var prop in cfg) {
    if (prop === 'main' || prop === 'format' || prop === 'defaultExtension' || prop === 'configured') {
      if (!prependConfig || pkg[prop] === undefined)
        pkg[prop] = cfg[prop];
    }
    else if (prop === 'map') {
      extend(pkg.map = pkg.map || {}, cfg.map, prependConfig);
    }
    else if (prop === 'meta') {
      extend(pkg.meta = pkg.meta || {}, cfg.meta, prependConfig);
    }
    else if (Object.hasOwnProperty.call(cfg, prop)) {
      warn$1.call(config, '"' + prop + '" is not a valid package configuration option in package ' + pkgName);
    }
  }

  // default defaultExtension for packages only
  if (pkg.defaultExtension === undefined)
    pkg.defaultExtension = 'js';

  if (pkg.main === undefined && pkg.map && pkg.map['.']) {
    pkg.main = pkg.map['.'];
    delete pkg.map['.'];
  }
  // main object becomes main map
  else if (typeof pkg.main === 'object') {
    pkg.map = pkg.map || {};
    pkg.map['./@main'] = pkg.main;
    pkg.main['default'] = pkg.main['default'] || './';
    pkg.main = '@main';
  }

  return pkg;
}

function formatHelpers (loader) {
  loader.set('@@cjs-helpers', loader.newModule({
    requireResolve: requireResolve.bind(loader),
    getPathVars: getPathVars
  }));

  loader.set('@@global-helpers', loader.newModule({
    prepareGlobal: prepareGlobal
  }));

  /*
    AMD-compatible require
    To copy RequireJS, set window.require = window.requirejs = loader.amdRequire
  */
  function require (names, callback, errback, referer) {
    // in amd, first arg can be a config object... we just ignore
    if (typeof names === 'object' && !(names instanceof Array))
      return require.apply(null, Array.prototype.splice.call(arguments, 1, arguments.length - 1));

    // amd require
    if (typeof names === 'string' && typeof callback === 'function')
      names = [names];
    if (names instanceof Array) {
      var dynamicRequires = [];
      for (var i = 0; i < names.length; i++)
        dynamicRequires.push(loader.import(names[i], referer));
      Promise.all(dynamicRequires).then(function (modules) {
        for (var i = 0; i < modules.length; i++)
          modules[i] = modules[i].__useDefault ? modules[i].default : modules[i];
        if (callback)
          callback.apply(null, modules);
      }, errback);
    }

    // commonjs require
    else if (typeof names === 'string') {
      var normalized = loader.decanonicalize(names, referer);
      var module = loader.get(normalized);
      if (!module)
        throw new Error('Module not already loaded loading "' + names + '" as ' + normalized + (referer ? ' from "' + referer + '".' : '.'));
      return module.__useDefault ? module.default : module;
    }

    else
      throw new TypeError('Invalid require');
  }

  function define (name, deps, factory) {
    if (typeof name !== 'string') {
      factory = deps;
      deps = name;
      name = null;

      if (curMetaDeps) {
        deps = deps.concat(curMetaDeps);
        curMetaDeps = undefined;
      }
    }

    if (!(deps instanceof Array)) {
      factory = deps;
      deps = ['require', 'exports', 'module'].splice(0, factory.length);
    }

    if (typeof factory !== 'function')
      factory = (function (factory) {
        return function() { return factory; }
      })(factory);

    // remove system dependencies
    var requireIndex, exportsIndex, moduleIndex;

    if ((requireIndex = deps.indexOf('require')) !== -1) {

      deps.splice(requireIndex, 1);

      // only trace cjs requires for non-named
      // named defines assume the trace has already been done
      if (!name)
        deps = deps.concat(amdGetCJSDeps(factory.toString(), requireIndex));
    }

    if ((exportsIndex = deps.indexOf('exports')) !== -1)
      deps.splice(exportsIndex, 1);

    if ((moduleIndex = deps.indexOf('module')) !== -1)
      deps.splice(moduleIndex, 1);

    function execute (req, exports, module) {
      var depValues = [];
      for (var i = 0; i < deps.length; i++)
        depValues.push(req(deps[i]));

      module.uri = module.id;

      module.config = function () {};

      // add back in system dependencies
      if (moduleIndex !== -1)
        depValues.splice(moduleIndex, 0, module);

      if (exportsIndex !== -1)
        depValues.splice(exportsIndex, 0, exports);

      if (requireIndex !== -1) {
        var contextualRequire = function (names, callback, errback) {
          if (typeof names === 'string' && typeof callback !== 'function')
            return req(names);
          return require.call(loader, names, callback, errback, module.id);
        };
        contextualRequire.toUrl = function (name) {
          return loader.normalizeSync(name, module.id);
        };
        depValues.splice(requireIndex, 0, contextualRequire);
      }

      // set global require to AMD require
      var curRequire = global$1.require;
      global$1.require = require;

      var output = factory.apply(exportsIndex === -1 ? global$1 : exports, depValues);

      global$1.require = curRequire;

      if (typeof output !== 'undefined')
        module.exports = output;
    }

    // anonymous define
    if (!name) {
      loader.registerDynamic(deps, execute);
    }
    else {
      loader.registerDynamic(name, deps, execute);

      // if we don't have any other defines,
      // then let this be an anonymous define
      // this is just to support single modules of the form:
      // define('jquery')
      // still loading anonymously
      // because it is done widely enough to be useful
      // as soon as there is more than one define, this gets removed though
      if (lastNamedDefine) {
        lastNamedDefine = undefined;
        multipleNamedDefines = true;
      }
      else if (!multipleNamedDefines) {
        lastNamedDefine = [deps, execute];
      }
    }
  }
  define.amd = {};

  loader.amdDefine = define;
  loader.amdRequire = require;
}

// CJS
if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.location)
  var windowOrigin = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');

function stripOrigin(path) {
  if (path.substr(0, 8) === 'file:///')
    return path.substr(7 + !!isWindows);

  if (windowOrigin && path.substr(0, windowOrigin.length) === windowOrigin)
    return path.substr(windowOrigin.length);

  return path;
}

function requireResolve (request, parentId) {
  return stripOrigin(this.normalizeSync(request, parentId));
}

function getPathVars (moduleId) {
  // remove any plugin syntax
  var pluginIndex = moduleId.lastIndexOf('!');
  var filename;
  if (pluginIndex !== -1)
    filename = moduleId.substr(0, pluginIndex);
  else
    filename = moduleId;

  var dirname = filename.split('/');
  dirname.pop();
  dirname = dirname.join('/');

  return {
    filename: stripOrigin(filename),
    dirname: stripOrigin(dirname)
  };
}

var commentRegEx$1 = /(^|[^\\])(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
var stringRegEx$1 = /("[^"\\\n\r]*(\\.[^"\\\n\r]*)*"|'[^'\\\n\r]*(\\.[^'\\\n\r]*)*')/g;

// extract CJS dependencies from source text via regex static analysis
// read require('x') statements not in comments or strings
function getCJSDeps (source) {
  cjsRequireRegEx.lastIndex = commentRegEx$1.lastIndex = stringRegEx$1.lastIndex = 0;

  var deps = [];

  var match;

  // track string and comment locations for unminified source
  var stringLocations = [], commentLocations = [];

  function inLocation (locations, match) {
    for (var i = 0; i < locations.length; i++)
      if (locations[i][0] < match.index && locations[i][1] > match.index)
        return true;
    return false;
  }

  if (source.length / source.split('\n').length < 200) {
    while (match = stringRegEx$1.exec(source))
      stringLocations.push([match.index, match.index + match[0].length]);

    // TODO: track template literals here before comments

    while (match = commentRegEx$1.exec(source)) {
      // only track comments not starting in strings
      if (!inLocation(stringLocations, match))
        commentLocations.push([match.index + match[1].length, match.index + match[0].length - 1]);
    }
  }

  while (match = cjsRequireRegEx.exec(source)) {
    // ensure we're not within a string or comment location
    if (!inLocation(stringLocations, match) && !inLocation(commentLocations, match)) {
      var dep = match[1].substr(1, match[1].length - 2);
      // skip cases like require('" + file + "')
      if (dep.match(/"|'/))
        continue;
      deps.push(dep);
    }
  }

  return deps;
}

// Global
// bare minimum ignores
var ignoredGlobalProps = ['_g', 'sessionStorage', 'localStorage', 'clipboardData', 'frames', 'frameElement', 'external',
  'mozAnimationStartTime', 'webkitStorageInfo', 'webkitIndexedDB', 'mozInnerScreenY', 'mozInnerScreenX'];

var globalSnapshot;
function globalIterator (globalName) {
  if (ignoredGlobalProps.indexOf(globalName) !== -1)
    return;
  try {
    var value = global$1[globalName];
  }
  catch (e) {
    ignoredGlobalProps.push(globalName);
  }
  this(globalName, value);
}

function getGlobalValue (exports) {
  if (typeof exports === 'string')
    return readMemberExpression(exports, global$1);

  if (!(exports instanceof Array))
    throw new Error('Global exports must be a string or array.');

  var globalValue = {};
  for (var i = 0; i < exports.length; i++)
    globalValue[exports[i].split('.').pop()] = readMemberExpression(exports[i], global$1);
  return globalValue;
}

function prepareGlobal (moduleName, exports, globals, encapsulate) {
  // disable module detection
  var curDefine = global$1.define;

  global$1.define = undefined;

  // set globals
  var oldGlobals;
  if (globals) {
    oldGlobals = {};
    for (var g in globals) {
      oldGlobals[g] = global$1[g];
      global$1[g] = globals[g];
    }
  }

  // store a complete copy of the global object in order to detect changes
  if (!exports) {
    globalSnapshot = {};

    Object.keys(global$1).forEach(globalIterator, function (name, value) {
      globalSnapshot[name] = value;
    });
  }

  // return function to retrieve global
  return function () {
    var globalValue = exports ? getGlobalValue(exports) : {};

    var singleGlobal;
    var multipleExports = !!exports;

    if (!exports || encapsulate)
      Object.keys(global$1).forEach(globalIterator, function (name, value) {
        if (globalSnapshot[name] === value)
          return;
        if (value === undefined)
          return;

        // allow global encapsulation where globals are removed
        if (encapsulate)
          global$1[name] = undefined;

        if (!exports) {
          globalValue[name] = value;

          if (singleGlobal !== undefined) {
            if (!multipleExports && singleGlobal !== value)
              multipleExports = true;
          }
          else {
            singleGlobal = value;
          }
        }
      });

    globalValue = multipleExports ? globalValue : singleGlobal;

    // revert globals
    if (oldGlobals) {
      for (var g in oldGlobals)
        global$1[g] = oldGlobals[g];
    }
    global$1.define = curDefine;

    return globalValue;
  };
}

// AMD
var cjsRequirePre = "(?:^|[^$_a-zA-Z\\xA0-\\uFFFF.])";
var cjsRequirePost = "\\s*\\(\\s*(\"([^\"]+)\"|'([^']+)')\\s*\\)";
var fnBracketRegEx = /\(([^\)]*)\)/;
var wsRegEx = /^\s+|\s+$/g;

var requireRegExs = {};

function amdGetCJSDeps(source, requireIndex) {

  // remove comments
  source = source.replace(commentRegEx$1, '');

  // determine the require alias
  var params = source.match(fnBracketRegEx);
  var requireAlias = (params[1].split(',')[requireIndex] || 'require').replace(wsRegEx, '');

  // find or generate the regex for this requireAlias
  var requireRegEx = requireRegExs[requireAlias] || (requireRegExs[requireAlias] = new RegExp(cjsRequirePre + requireAlias + cjsRequirePost, 'g'));

  requireRegEx.lastIndex = 0;

  var deps = [];

  var match;
  while (match = requireRegEx.exec(source))
    deps.push(match[2] || match[3]);

  return deps;
}

// generate anonymous define from singular named define
var multipleNamedDefines = false;
var lastNamedDefine;
var curMetaDeps;
function clearLastDefine (metaDeps) {
  curMetaDeps = metaDeps;
  lastNamedDefine = undefined;
  multipleNamedDefines = false;
}
function registerLastDefine (loader) {
  if (lastNamedDefine)
    loader.registerDynamic(curMetaDeps ? lastNamedDefine[0].concat(curMetaDeps) : lastNamedDefine[0], lastNamedDefine[1]);

  // bundles are an empty module
  else if (multipleNamedDefines)
    loader.registerDynamic([], function () {});
}

function instantiate$1 (key, metadata, processAnonRegister) {
  var loader = this;
  var config = this[CONFIG];
  // first do bundles and depCache
  return (loadBundlesAndDepCache(config, this, key) || Promise.resolve())
  .then(function () {
    if (metadata.registered)
      return;

    // node module loading
    if (key.substr(0, 6) === '@node/') {
      if (!loader._nodeRequire)
        throw new TypeError('Error loading ' + key + '. Can only load node core modules in Node.');
      loader.registerDynamic([], function (require, exports, module) {
        module.exports = loadNodeModule.call(loader, key.substr(6), loader.baseURL);
      });
      processAnonRegister();
      return;
    }

    if (metadata.load.scriptLoad ) {
      if (metadata.load.pluginKey || !supportsScriptLoad) {
        metadata.load.scriptLoad = false;
        warn$1.call(config, 'scriptLoad not supported for "' + key + '"');
      }
    }
    else if (metadata.load.scriptLoad !== false && supportsScriptLoad) {
      // auto script load AMD, global without deps
      if (!metadata.load.deps && !metadata.load.globals &&
          (metadata.load.format === 'system' || metadata.load.format === 'register' || metadata.load.format === 'global' && metadata.load.exports))
        metadata.load.scriptLoad = true;
    }

    // fetch / translate / instantiate pipeline
    if (!metadata.load.scriptLoad)
      return initializePlugin(loader, key, metadata)
      .then(function () {
        // modern plugin = load hook
        if (metadata.pluginModule && typeof metadata.pluginModule.default === 'function')
          return runPluginLoad(loader, metadata.pluginArgument, key, metadata, metadata.pluginKey, metadata.pluginModule);
        return runFetchPipeline(loader, key, metadata, processAnonRegister, config.wasm);
      })

    // just script loading
    return new Promise(function (resolve, reject) {
      if (metadata.load.format === 'amd' && global$1.define !== loader.amdDefine)
        throw new Error('Loading AMD with scriptLoad requires setting the global `' + globalName + '.define = SystemJS.amdDefine`');

      scriptLoad(key, metadata.load.crossOrigin, metadata.load.integrity, function () {
        processAnonRegister();

        if (!metadata.registered) {
          metadata.load.format = 'global';
          var globalValue = getGlobalValue(metadata.load.exports);
          loader.registerDynamic([], function (require, exports, module) {
            module.exports = globalValue;
          });
          processAnonRegister();
        }

        resolve();
      }, reject);
    });
  });
};

function initializePlugin (loader, key, metadata) {
  if (!metadata.pluginKey)
    return Promise.resolve();

  return loader.import(metadata.pluginKey).then(function (plugin) {
    metadata.pluginModule = plugin;
    metadata.pluginLoad = {
      name: key,
      address: metadata.pluginArgument,
      source: undefined,
      metadata: metadata.load
    };
    metadata.load.deps = metadata.load.deps || [];
  });
}

function protectedCreateNamespace (bindings) {
  if (bindings instanceof ModuleNamespace)
    return bindings;
  if (typeof bindings !== 'object')
    throw new TypeError('Cannot create a module namespace from an object of type "' + typeof bindings + '".');
  return new ModuleNamespace(bindings);
}

function runPluginLoad (loader, key, registerKey, metadata, pluginKey, pluginModule) {
  return Promise.resolve()
  .then(function () {
    return pluginModule.default.call(loader, key, registerKey);
  })
  .then(function (pluginResult) {
    if (pluginResult === undefined)
      return metadata.registered ? pluginResult : emptyModule;
    return protectedCreateNamespace(pluginResult);
  })
  .catch(function (err) {
    throw addToError(err, 'Error running instantiate plugin ' + pluginKey);
  });
}

function loadBundlesAndDepCache (config, loader, key) {
  // load direct deps, in turn will pick up their trace trees
  var deps = config.depCache[key];
  if (deps) {
    for (var i = 0; i < deps.length; i++)
      loader.load(deps[i], key);
  }
  else {
    var matched = false;
    for (var b in config.bundles) {
      for (var i = 0; i < config.bundles[b].length; i++) {
        var curModule = config.bundles[b][i];

        if (curModule == key) {
          matched = true;
          break;
        }

        // wildcard in bundles does not include / boundaries
        if (curModule.indexOf('*') != -1) {
          var parts = curModule.split('*');
          if (parts.length != 2) {
            config.bundles[b].splice(i--, 1);
            continue;
          }

          if (key.substring(0, parts[0].length) == parts[0] &&
              key.substr(key.length - parts[1].length, parts[1].length) == parts[1] &&
              key.substr(parts[0].length, key.length - parts[1].length - parts[0].length).indexOf('/') == -1) {
            matched = true;
            break;
          }
        }
      }

      if (matched)
        return loader.import(b);
    }
  }
}

function runFetchPipeline (loader, key, metadata, processAnonRegister, wasm) {
  livelyLog("runFetchPipeline " + key)
  var fetchStarted = performance.now() // #Lively4
  
  
  var normalizedLogKey = key // should already be normalized
  
  if (metadata.load.exports && !metadata.load.format)
    metadata.load.format = 'global';

  var cachedOutputCode
  var cachedSourceCode
  
  return Promise.resolve()

  // locate
  .then(function () {
    livelyLog("fetch locate")

    if (!metadata.pluginModule || !metadata.pluginModule.locate)
      return;

    return metadata.pluginModule.locate.call(loader, metadata.pluginLoad)
    .then(function (address) {
      if (address)
        metadata.pluginLoad.address = address;
    });
  })
  // fetch
  .then(function () {
    livelyLog("fetchy")
    
   // if (self.localStorage && self.lively4plugincache) {
   //    var load = metadata.load
   //    var cachekey = "pluginBabelTransfrom_" + load.name
   //    cachedOutputCode = self.localStorage[cachekey]
   //    cachedSourceCode = self.localStorage[cachekey +"_source"]
   //   if (cachedSourceCode) {
   //      console.log("return cached source code: " + key)
   //      return cachedSourceCode
   //   }
   //  }
    // console.log('default fetch ' + key)

    if (!metadata.pluginModule) {
      livelyLog("fetch$1.1")
      return fetch$1(key, metadata.load.authorization, metadata.load.integrity, wasm);
    } 

    if (!metadata.pluginModule.fetch) {
      livelyLog("fetch$1.2")

      return fetch$1(metadata.pluginArgument, metadata.load.authorization, metadata.load.integrity, wasm);
    }

    wasm = false;
    return metadata.pluginModule.fetch.call(loader, metadata.pluginLoad, function (load) {
      livelyLog("fetch$1.3")
      return fetch$1(load.address, metadata.load.authorization, metadata.load.integrity, false);
    });
  })

  .then(function (fetched) {
    livelyBootLog(normalizedLogKey, Date.now(),  "fetchEnd", performance.now() - fetchStarted)
    livelyLog("fetched")
    if (!fetched) {
      // debugger
    }
    
    // if (cachedOutputCode ) {
    //     console.log("no fetch " + key)
    //     return translateAndInstantiate(loader, key, fetched, metadata, processAnonRegister);
    // }
    
    // fetch is already a utf-8 string if not doing wasm detection
    if (!wasm)
      return translateAndInstantiate(loader, key, fetched, metadata, processAnonRegister);

    var bytes = new Uint8Array(fetched);

    // detect by leading bytes
    if (bytes[0] === 0 && bytes[1] === 97 && bytes[2] === 115) {
      return WebAssembly.compile(bytes).then(function (m) {
        /* TODO handle imports when `WebAssembly.Module.imports` is implemented
        if (WebAssembly.Module.imports) {
          var deps = [];
          var setters = [];
          var importObj = {};
          WebAssembly.Module.imports(m).forEach(function (i) {
            var key = i.module;
            setters.push(function (m) {
              importObj[key] = m;
            });
            if (deps.indexOf(key) === -1)
              deps.push(key);
          });
          loader.register(deps, function (_export) {
            return {
              setters: setters,
              execute: function () {
                _export(new WebAssembly.Instance(m, importObj).exports);
              }
            };
          });
        }*/
        // for now we just load WASM without dependencies
        var wasmModule = new WebAssembly.Instance(m, {});
        return loader.newModule(wasmModule.exports);
      });
    }

    // not wasm -> convert buffer into utf-8 string to execute as a module
    // TextDecoder compatibility matches WASM currently. Need to keep checking this.
    // The TextDecoder interface is documented at http://encoding.spec.whatwg.org/#interface-textdecoder
    var stringSource = new TextDecoder('utf-8').decode(bytes);
    return translateAndInstantiate(loader, key, stringSource, metadata, processAnonRegister);
  })
}

function translateAndInstantiate (loader, key, source, metadata, processAnonRegister) {
  livelyLog("translateAndInstantiate " + key)
  return Promise.resolve(source)
  // translate
  .then(function (source) {
    if (!source) throw new Error("SystemJS error: could not load " + key)
    
    
    if (metadata.load.format === 'detect')
      metadata.load.format = undefined;

    readMetaSyntax(source, metadata);

    if (!metadata.pluginModule || !metadata.pluginModule.translate)
      return source;

    metadata.pluginLoad.source = source;
    return Promise.resolve(metadata.pluginModule.translate.call(loader, metadata.pluginLoad, metadata.traceOpts))
    .then(function (translated) {

      if (metadata.load.sourceMap) {
        if (typeof metadata.load.sourceMap !== 'object')
          throw new Error('metadata.load.sourceMap must be set to an object.');
        sanitizeSourceMap(metadata.pluginLoad.address, metadata.load.sourceMap);
      }

      if (typeof translated === 'string')
        return translated;
      else
        return metadata.pluginLoad.source;
    });
    
  })
  .then(function (source) {
    if (metadata.load.format === 'register' || !metadata.load.format && detectRegisterFormat(source)) {
      metadata.load.format = 'register';
      return source;
    }

    if (metadata.load.format !== 'esm' && (metadata.load.format || !source.match(esmRegEx))) {
      return source;
    }

    metadata.load.format = 'esm';
    return transpile(loader, source, key, metadata);
  })

  // instantiate
  .then(function (translated) {
    if (typeof translated !== 'string' || !metadata.pluginModule || !metadata.pluginModule.instantiate)
      return translated;

    var calledInstantiate = false;
    metadata.pluginLoad.source = translated;
    return Promise.resolve(metadata.pluginModule.instantiate.call(loader, metadata.pluginLoad, function (load) {
      translated = load.source;
      metadata.load = load.metadata;
      if (calledInstantiate)
        throw new Error('Instantiate must only be called once.');
      calledInstantiate = true;
    }))
    .then(function (result) {
      if (calledInstantiate)
        return translated;
      return protectedCreateNamespace(result);
    });
  })
  .then(function (source) {
    // plugin instantiate result case
    if (typeof source !== 'string')
      return source;

    if (!metadata.load.format)
      metadata.load.format = detectLegacyFormat(source);

    switch (metadata.load.format) {
      case 'esm':
      case 'register':
      case 'system':
        var executionStart = performance.now() // #Lively4
        var err = evaluate(loader, source, metadata.load.sourceMap, key, metadata.load.integrity, metadata.load.nonce, false);
        livelyBootLog(key, Date.now(),  "evaluate",  performance.now() - executionStart) // #Lively4
        
        if (err)
          throw err;
        processAnonRegister();

        if (!metadata.registered)
          return emptyModule;
      break;

      case 'json':
        // warn.call(config, '"json" module format is deprecated.');
        return loader.newModule({ default: JSON.parse(source), __useDefault: true });

      case 'amd':
        var curDefine = global$1.define;
        global$1.define = loader.amdDefine;

        clearLastDefine(metadata.load.deps);

        var err = evaluate(loader, source, metadata.load.sourceMap, key, metadata.load.integrity, metadata.load.nonce, false);

        processAnonRegister();

        // if didn't register anonymously, use the last named define if only one
        if (!metadata.registered) {
          registerLastDefine(loader);
          processAnonRegister();
        }

        global$1.define = curDefine;

        if (err)
          throw err;
      break;

      case 'cjs':
        var metaDeps = metadata.load.deps;
        var deps = (metadata.load.deps || []).concat(metadata.load.cjsRequireDetection ? getCJSDeps(source) : []);

        for (var g in metadata.load.globals)
          if (metadata.load.globals[g])
            deps.push(metadata.load.globals[g]);

        loader.registerDynamic(deps, function (require, exports, module) {
          require.resolve = function (key) {
            return requireResolve.call(loader, key, module.id);
          };
          // support module.paths ish
          module.paths = [];
          module.require = require;

          // ensure meta deps execute first
          if (!metadata.load.cjsDeferDepsExecute && metaDeps)
            for (var i = 0; i < metaDeps.length; i++)
              require(metaDeps[i]);

          var pathVars = getPathVars(module.id);
          var __cjsWrapper = {
            exports: exports,
            args: [require, exports, module, pathVars.filename, pathVars.dirname, global$1, global$1]
          };

          var cjsWrapper = "(function (require, exports, module, __filename, __dirname, global, GLOBAL";

          // add metadata.globals to the wrapper arguments
          if (metadata.load.globals)
            for (var g in metadata.load.globals) {
              __cjsWrapper.args.push(require(metadata.load.globals[g]));
              cjsWrapper += ", " + g;
            }

          // disable AMD detection
          var define = global$1.define;
          global$1.define = undefined;
          global$1.__cjsWrapper = __cjsWrapper;

          source = cjsWrapper + ") {" + source.replace(hashBangRegEx, '') + "\n}).apply(__cjsWrapper.exports, __cjsWrapper.args);";

          var err = evaluate(loader, source, metadata.load.sourceMap, key, metadata.load.integrity, metadata.load.nonce, false);
          if (err)
            throw err;

          global$1.__cjsWrapper = undefined;
          global$1.define = define;
        });
        processAnonRegister();
      break;

      case 'global':
        var deps = metadata.load.deps || [];
        for (var g in metadata.load.globals) {
          var gl = metadata.load.globals[g];
          if (gl)
            deps.push(gl);
        }

        loader.registerDynamic(deps, function (require, exports, module) {
          for (var i = 0; i < deps.length; i++)
            require(deps[i]);

          var globals;
          if (metadata.load.globals) {
            globals = {};
            for (var g in metadata.load.globals)
              if (metadata.load.globals[g])
                globals[g] = require(metadata.load.globals[g]);
          }

          var exportName = metadata.load.exports;

          if (exportName)
            source += '\n' + globalName + '["' + exportName + '"] = ' + exportName + ';';

          var retrieveGlobal = prepareGlobal(module.id, exportName, globals, metadata.load.encapsulateGlobal);
          var err = evaluate(loader, source, metadata.load.sourceMap, key, metadata.load.integrity, metadata.load.nonce, true);

          if (err)
            throw err;

          module.exports = retrieveGlobal();
        });
        processAnonRegister();
      break;

      default:
        throw new TypeError('Unknown module format "' + metadata.load.format + '" for "' + key + '".' + (metadata.load.format === 'es6' ? ' Use "esm" instead here.' : ''));
    }

    if (!metadata.registered)
      throw new Error('Module ' + key + ' detected as ' + metadata.load.format + ' but didn\'t execute correctly.');
  }).then( r => {
     livelyLog("FINISHED translateAndInstantiate " + key)
    return r
  });
}

var globalName = typeof self != 'undefined' ? 'self' : 'global';

// good enough ES6 module detection regex - format detections not designed to be accurate, but to handle the 99% use case
var esmRegEx = /(^\s*|[}\);\n]\s*)(import\s*(['"]|(\*\s+as\s+)?[^"'\(\)\n;]+\s*from\s*['"]|\{)|export\s+\*\s+from\s+["']|export\s*(\{|default|function|class|var|const|let|async\s+function))/;

var leadingCommentAndMetaRegEx = /^(\s*\/\*[^\*]*(\*(?!\/)[^\*]*)*\*\/|\s*\/\/[^\n]*|\s*"[^"]+"\s*;?|\s*'[^']+'\s*;?)*\s*/;
function detectRegisterFormat(source) {
  var leadingCommentAndMeta = source.match(leadingCommentAndMetaRegEx);
  return leadingCommentAndMeta && source.substr(leadingCommentAndMeta[0].length, 15) === 'System.register';
}

// AMD Module Format Detection RegEx
// define([.., .., ..], ...)
// define(varName); || define(function(require, exports) {}); || define({})
var amdRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF.])define\s*\(\s*("[^"]+"\s*,\s*|'[^']+'\s*,\s*)?\s*(\[(\s*(("[^"]+"|'[^']+')\s*,|\/\/.*\r?\n|\/\*(.|\s)*?\*\/))*(\s*("[^"]+"|'[^']+')\s*,?)?(\s*(\/\/.*\r?\n|\/\*(.|\s)*?\*\/))*\s*\]|function\s*|{|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*\))/;

/// require('...') || exports[''] = ... || exports.asd = ... || module.exports = ...
var cjsExportsRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF.])(exports\s*(\[['"]|\.)|module(\.exports|\['exports'\]|\["exports"\])\s*(\[['"]|[=,\.]))/;
// used to support leading #!/usr/bin/env in scripts as supported in Node
var hashBangRegEx = /^\#\!.*/;

function detectLegacyFormat (source) {
  if (source.match(amdRegEx))
    return 'amd';

  cjsExportsRegEx.lastIndex = 0;
  cjsRequireRegEx.lastIndex = 0;
  if (cjsRequireRegEx.exec(source) || cjsExportsRegEx.exec(source))
    return 'cjs';

  // global is the fallback format
  return 'global';
}

function sanitizeSourceMap (address, sourceMap) {
  var originalName = address.split('!')[0];

  // force set the filename of the original file
  if (!sourceMap.file || sourceMap.file == address)
    sourceMap.file = originalName + '!transpiled';

  // force set the sources list if only one source
  if (!sourceMap.sources || sourceMap.sources.length <= 1 && (!sourceMap.sources[0] || sourceMap.sources[0] === address))
    sourceMap.sources = [originalName];
}

function transpile (loader, source, key, metadata) {
  if (!loader.transpiler)
    throw new TypeError('Unable to dynamically transpile ES module\n   A loader plugin needs to be configured via `SystemJS.config({ transpiler: \'transpiler-module\' })`.');

  // deps support for es transpile
  if (metadata.load.deps) {
    var depsPrefix = '';
    for (var i = 0; i < metadata.load.deps.length; i++)
      depsPrefix += 'import "' + metadata.load.deps[i] + '"; ';
    source = depsPrefix + source;
  }

  // do transpilation
  return loader.import.call(loader, loader.transpiler)
  .then(function (transpiler) {
    if (typeof transpiler.default === 'function')
      return runPluginLoad(loader, key, key, metadata, loader.transpiler, transpiler);

    if (transpiler.__useDefault)
      transpiler = transpiler.default;

    // translate hooks means this is a transpiler plugin instead of a raw implementation
    if (!transpiler.translate)
      throw new Error('Unable to load transpiler, ensure the SystemJS.transpiler is configured to a transpiler plugin.');

    // if transpiler is the same as the plugin loader, then don't run twice
    if (transpiler === metadata.pluginModule)
      return load.source;

    // convert the source map into an object for transpilation chaining
    if (typeof metadata.load.sourceMap === 'string')
      metadata.load.sourceMap = JSON.parse(metadata.load.sourceMap);

    metadata.pluginLoad = metadata.pluginLoad || {
      name: key,
      address: key,
      source: source,
      metadata: metadata.load
    };
    metadata.load.deps = metadata.load.deps || [];

    return Promise.resolve(transpiler.translate.call(loader, metadata.pluginLoad, metadata.traceOpts))
    .then(function (source) {
      // sanitize sourceMap if an object not a JSON string
      var sourceMap = metadata.load.sourceMap;
      if (sourceMap && typeof sourceMap === 'object')
        sanitizeSourceMap(key, sourceMap);

      if (metadata.load.format === 'esm' && detectRegisterFormat(source))
        metadata.load.format = 'register';
      livelyLog("transpiled " +key)
      return source;
    });
  }, function (err) {
    throw addToError(err, 'Unable to load transpiler to transpile ' + key);
  });
}

// detect any meta header syntax
// only set if not already set
var metaRegEx = /^(\s*\/\*[^\*]*(\*(?!\/)[^\*]*)*\*\/|\s*\/\/[^\n]*|\s*"[^"]+"\s*;?|\s*'[^']+'\s*;?)+/;
var metaPartRegEx = /\/\*[^\*]*(\*(?!\/)[^\*]*)*\*\/|\/\/[^\n]*|"[^"]+"\s*;?|'[^']+'\s*;?/g;

function setMetaProperty(target, p, value) {
  var pParts = p.split('.');
  var curPart;
  while (pParts.length > 1) {
    curPart = pParts.shift();
    target = target[curPart] = target[curPart] || {};
  }
  curPart = pParts.shift();
  if (target[curPart] === undefined)
    target[curPart] = value;
}

function readMetaSyntax (source, metadata) {
  var meta = source.match(metaRegEx);
  if (!meta)
    return;

  var metaParts = meta[0].match(metaPartRegEx);

  for (var i = 0; i < metaParts.length; i++) {
    var curPart = metaParts[i];
    var len = curPart.length;

    var firstChar = curPart.substr(0, 1);
    if (curPart.substr(len - 1, 1) == ';')
      len--;

    if (firstChar != '"' && firstChar != "'")
      continue;

    var metaString = curPart.substr(1, curPart.length - 3);
    var metaName = metaString.substr(0, metaString.indexOf(' '));

    if (metaName) {
      var metaValue = metaString.substr(metaName.length + 1, metaString.length - metaName.length - 1);

      if (metaName === 'deps')
        metaName = 'deps[]';

      if (metaName.substr(metaName.length - 2, 2) === '[]') {
        metaName = metaName.substr(0, metaName.length - 2);
        metadata.load[metaName] = metadata.load[metaName] || [];
        metadata.load[metaName].push(metaValue);
      }
      // "use strict" is not meta
      else if (metaName !== 'use') {
        setMetaProperty(metadata.load, metaName, metaValue);
      }
    }
    else {
      metadata.load[metaString] = true;
    }
  }
}

function SystemJSLoader (baseKey) {
  RegisterLoader.call(this, baseKey);

  // NB deprecate
  this._loader = {};

  // internal configuration
  this[CONFIG] = {
    // this means paths normalization has already happened
    pathsLocked: false,

    baseURL: baseURI,
    paths: {},

    packageConfigPaths: [],
    packageConfigKeys: [],
    map: {},
    packages: {},
    depCache: {},
    meta: {},
    bundles: {},

    production: false,

    transpiler: undefined,
    loadedBundles: {},

    // global behaviour flags
    warnings: false,
    pluginFirst: false,

    // enable wasm loading and detection when supported
    wasm: false
  };

  // make the location of the system.js script accessible (if any)
  this.scriptSrc = scriptSrc;

  this._nodeRequire = nodeRequire;

  // support the empty module, as a concept
  this.set('@empty', emptyModule = this.newModule({}));

  setProduction.call(this, false, false);

  // add module format helpers
  formatHelpers(this);
}

var emptyModule;

var envModule;
function setProduction (isProduction, isBuilder) {
  this[CONFIG].production = isProduction;
  this.set('@system-env', envModule = this.newModule({
    browser: isBrowser,
    node: !!this._nodeRequire,
    production: !isBuilder && isProduction,
    dev: isBuilder || !isProduction,
    build: isBuilder,
    'default': true
  }));
}

var CONFIG = createSymbol('loader-config');
var CREATE_METADATA = SystemJSLoader.createMetadata = RegisterLoader.createMetadata;
var RESOLVE = SystemJSLoader.resolve = RegisterLoader.resolve;
var INSTANTIATE = SystemJSLoader.instantiate = RegisterLoader.instantiate;

SystemJSLoader.prototype = Object.create(RegisterLoader.prototype);

SystemJSLoader.prototype.constructor = SystemJSLoader;

SystemJSLoader.prototype[CREATE_METADATA] = function () {
  return {
    registered: false,
    pluginKey: undefined,
    pluginArgument: undefined,
    pluginModule: undefined,
    packageKey: undefined,
    packageConfig: undefined,
    load: undefined
  };
};

SystemJSLoader.prototype[RESOLVE] = normalize;

// NB deprecate decanonicalize
SystemJSLoader.prototype.decanonicalize = SystemJSLoader.prototype.normalizeSync = normalizeSync;

SystemJSLoader.prototype[INSTANTIATE] = instantiate$1;

SystemJSLoader.prototype.config = setConfig;
SystemJSLoader.prototype.getConfig = getConfig;

SystemJSLoader.prototype.global = global$1;

var configNames = ['baseURL', 'map', 'paths', 'packages', 'packageConfigPaths', 'depCache', 'meta', 'bundles', 'transpiler', 'warnings', 'pluginFirst', 'production'];

var hasProxy = typeof Proxy !== 'undefined';
for (var i = 0; i < configNames.length; i++) (function (configName) {
  Object.defineProperty(SystemJSLoader.prototype, configName, {
    get: function () {
      var cfg = getConfigItem(this[CONFIG], configName);

      if (hasProxy && typeof cfg === 'object')
        cfg = new Proxy(cfg, {
          set: function (target, option) {
            throw new Error('Cannot set SystemJS.' + configName + '["' + option + '"] directly. Use SystemJS.config({ ' + configName + ': { "' + option + '": ... } }) rather.');
          }
        });

      //if (typeof cfg === 'object')
      //  warn.call(this[CONFIG], 'Referencing `SystemJS.' + configName + '` is deprecated. Use the config getter `SystemJS.getConfig(\'' + configName + '\')`');
      return cfg;
    },
    set: function (name) {
      throw new Error('Setting `SystemJS.' + configName + '` directly is no longer supported. Use `SystemJS.config({ ' + configName + ': ... })`.');
    }
  });
})(configNames[i]);

/*
 * Backwards-compatible registry API, to be deprecated
 */
/* function registryWarn(loader, method) {
  warn.call(loader, 'SystemJS.' + method + ' is deprecated for SystemJS.registry.' + method);
} */
SystemJSLoader.prototype.delete = function (key) {
  // registryWarn(this, 'delete');
  this.registry.delete(key);
};
SystemJSLoader.prototype.get = function (key) {
  // registryWarn(this, 'get');
  return this.registry.get(key);
};
SystemJSLoader.prototype.has = function (key) {
  // registryWarn(this, 'has');
  return this.registry.has(key);
};
SystemJSLoader.prototype.set = function (key, module) {
  // registryWarn(this, 'set');
  return this.registry.set(key, module);
};
SystemJSLoader.prototype.newModule = function (bindings) {
  return new ModuleNamespace(bindings);
};

// ensure System.register and System.registerDynamic decanonicalize
SystemJSLoader.prototype.register = function (key, deps, declare) {
  if (typeof key === 'string')
    key = decanonicalize.call(this, this[CONFIG], key);
  return RegisterLoader.prototype.register.call(this, key, deps, declare);
};

SystemJSLoader.prototype.registerDynamic = function (key, deps, executingRequire, execute) {
  if (typeof key === 'string')
    key = decanonicalize.call(this, this[CONFIG], key);
  return RegisterLoader.prototype.registerDynamic.call(this, key, deps, executingRequire, execute);
};

SystemJSLoader.prototype.version = "0.20.0-alpha.1";

var System = new SystemJSLoader();

global$1.System = global$1.SystemJS = System;

if (typeof module !== 'undefined' && module.exports)
  module.exports = System;

}());
