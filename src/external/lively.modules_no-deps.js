(function() {
  var GLOBAL = typeof window !== "undefined" ? window :
      typeof global!=="undefined" ? global :
        typeof self!=="undefined" ? self : this;
  (function() {
    (function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = (xhr.getAllResponseHeaders() || '').trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

  }).call(GLOBAL);
  this.lively = this.lively || {};
(function (exports,lively_lang,ast,evaluator) {
  'use strict';

  function scheduleModuleExportsChange(System, moduleId, name, value, addNewExport) {
    var pendingExportChanges = System["__lively.modules__"].pendingExportChanges,
        rec = moduleRecordFor$1(System, moduleId);
    if (rec && (name in rec.exports || addNewExport)) {
      var pending = pendingExportChanges[moduleId] || (pendingExportChanges[moduleId] = {});
      pending[name] = value;
    }
  }

  function runScheduledExportChanges(System, moduleId) {
    var pendingExportChanges = System["__lively.modules__"].pendingExportChanges,
        keysAndValues = pendingExportChanges[moduleId];
    if (!keysAndValues) return;
    clearPendingModuleExportChanges(System, moduleId);
    updateModuleExports(System, moduleId, keysAndValues);
  }

  function clearPendingModuleExportChanges(System, moduleId) {
    var pendingExportChanges = System["__lively.modules__"].pendingExportChanges;
    delete pendingExportChanges[moduleId];
  }

  function updateModuleExports(System, moduleId, keysAndValues) {
    var debug = System["__lively.modules__"].debug;
    updateModuleRecordOf(System, moduleId, (record) => {

      var newExports = [], existingExports = [];

      Object.keys(keysAndValues).forEach(name => {
        var value = keysAndValues[name];
        debug && console.log("[lively.vm es6 updateModuleExports] %s export %s = %s", moduleId, name, String(value).slice(0,30).replace(/\n/g, "") + "...");

        var isNewExport = !(name in record.exports);
        if (isNewExport) record.__lively_modules__.evalOnlyExport[name] = true;
        // var isEvalOnlyExport = record.__lively_vm__.evalOnlyExport[name];
        record.exports[name] = value;

        if (isNewExport) newExports.push(name);
        else existingExports.push(name);
      });


      // if it's a new export we don't need to update dependencies, just the
      // module itself since no depends know about the export...
      // HMM... what about *-imports?
      newExports.forEach(name => {
        var oldM = System._loader.modules[moduleId].module,
            m = System._loader.modules[moduleId].module = new oldM.constructor(),
            pNames = Object.getOwnPropertyNames(record.exports);
        for (var i = 0; i < pNames.length; i++) (function(key) {
          Object.defineProperty(m, key, {
            configurable: false, enumerable: true,
            get() { return record.exports[key]; }
          });
        })(pNames[i]);
        // Object.defineProperty(System._loader.modules[fullname].module, name, {
        //   configurable: false, enumerable: true,
        //   get() { return record.exports[name]; }
        // });
      });

      // For exising exports we find the execution func of each dependent module and run that
      // FIXME this means we run the entire modules again, side effects and all!!!
      if (existingExports.length) {
        debug && console.log("[lively.vm es6 updateModuleExports] updating %s dependents of %s", record.importers.length, moduleId);
        for (var i = 0, l = record.importers.length; i < l; i++) {
          var importerModule = record.importers[i];
          if (!importerModule.locked) {
            var importerIndex = importerModule.dependencies.indexOf(record);
            importerModule.setters[importerIndex](record.exports);
            importerModule.execute();
          }
        }
      }

    });
  }


  function importsAndExportsOf$1(System, moduleName, parent) {
    return System.normalize(moduleName, parent)
    .then(id =>
      Promise.resolve(sourceOf$1(System, id))
        .then(source => {
          var parsed = ast.parse(source),
              scope = ast.query.scopes(parsed);

          // compute imports
          var imports = scope.importDecls.reduce((imports, node) => {
            var nodes = ast.query.nodesAtIndex(parsed, node.start);
            var importStmt = lively_lang.arr.without(nodes, scope.node)[0];
            if (!importStmt) return imports;

            var from = importStmt.source ? importStmt.source.value : "unknown module";
            if (!importStmt.specifiers.length) // no imported vars
              return imports.concat([{
                localModule:     id,
                local:           null,
                imported:        null,
                fromModule:      from,
                importStatement: importStmt
              }]);

            return imports.concat(importStmt.specifiers.map(importSpec => {
              var imported;
              if (importSpec.type === "ImportNamespaceSpecifier") imported = "*";
              else if (importSpec.type === "ImportDefaultSpecifier") imported = "default";
              else if (importStmt.source) imported = importStmt.source.name;
              else imported = null;
              return {
                localModule:     id,
                local:           importSpec.local ? importSpec.local.name : null,
                imported:        imported,
                fromModule:      from,
                importStatement: importStmt
              }
            }))
          }, []);

          var exports = scope.exportDecls.reduce((exports, node) => {
            var nodes = ast.query.nodesAtIndex(parsed, node.start);
            var exportsStmt = lively_lang.arr.without(nodes, scope.node)[0];
            if (!exportsStmt) return exports;

            if (exportsStmt.type === "ExportAllDeclaration") {
              var from = exportsStmt.source ? exportsStmt.source.value : null;
              return exports.concat([{
                localModule:     id,
                local:           null,
                exported:        "*",
                fromModule:      from,
                exportStatement: exportsStmt
              }])
            }

            return exports.concat(exportsStmt.specifiers.map(exportSpec => {
              return {
                localModule:     id,
                local:           exportSpec.local ? exportSpec.local.name : null,
                exported:        exportSpec.exported ? exportSpec.exported.name : null,
                fromModule:      id,
                exportStatement: exportsStmt
              }
            }))
          }, []);

          return {
            imports: lively_lang.arr.uniqBy(imports, (a, b) => a.local == b.local && a.imported == b.imported && a.fromModule == b.fromModule),
            exports: lively_lang.arr.uniqBy(exports, (a, b) => a.local == b.local && a.exported == b.exported && a.fromModule == b.fromModule)
          }
        }))
  }

  function installHook$1(System, hookName, hook) {
    System[hookName] = lively_lang.fun.wrap(System[hookName], hook);
    System[hookName].hookFunc = hook;
  }

  function removeHook$1(System, methodName, hookOrName) {
    var chain = [], f = System[methodName];
    while (f) {
      chain.push(f);
      f = f.originalFunction;
    }

    var found = typeof hookOrName === "string" ?
      chain.find(wrapper => wrapper.hookFunc && wrapper.hookFunc.name === hookOrName) :
      chain.find(wrapper => wrapper.hookFunc === hookOrName);
    
    if (!found) return false;
    
    lively_lang.arr.remove(chain, found);
    
    System[methodName] = chain.reduceRight((method, wrapper) =>
      lively_lang.fun.wrap(method, wrapper.hookFunc || wrapper));

    return true;
  }

  function isHookInstalled$1(System, methodName, hookOrName) {
    var f = System[methodName];
    while (f) {
      if (f.hookFunc) {
        if (typeof hookOrName === "string" && f.hookFunc.name === hookOrName) return true;
        else if (f.hookFunc === hookOrName) return true;
      }
      f = f.originalFunction;
    }
    return false;
  }

  var isNode$1 = System.get("@system-env").node;

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // code instrumentation
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  var node_modulesDir = System.normalizeSync("lively.modules/node_modules/");

  var exceptions = [
        // id => id.indexOf(resolve("node_modules/")) > -1,
        // id => canonicalURL(id).indexOf(node_modulesDir) > -1,
        id => lively_lang.string.include(id, "acorn/src"),
        id => lively_lang.string.include(id, "babel-core/browser.js") || lively_lang.string.include(id, "system.src.js"),
        // id => lang.string.include(id, "lively.ast.es6.bundle.js"),
        id => id.slice(-3) !== ".js"
      ];
  var esmFormatCommentRegExp = /['"]format (esm|es6)['"];/;
  var cjsFormatCommentRegExp = /['"]format cjs['"];/;
  var esmRegEx = /(^\s*|[}\);\n]\s*)(import\s+(['"]|(\*\s+as\s+)?[^"'\(\)\n;]+\s+from\s+['"]|\{)|export\s+\*\s+from\s+["']|export\s+(\{|default|function|class|var|const|let|async\s+function))/;
  function prepareCodeForCustomCompile(source, fullname, env, debug) {
    source = String(source);
    var tfmOptions = {
          topLevelVarRecorder: env.recorder,
          varRecorderName: env.recorderName,
          dontTransform: env.dontTransform,
          recordGlobals: true
        },
        isGlobal = env.recorderName === "System.global",
        header = (debug ? `console.log("[lively.modules] executing module ${fullname}");\n` : ""),
        footer = "";

    // FIXME how to update exports in that case?
    if (!isGlobal) {
      header += `var __lively_modules__ = System["__lively.modules__"],\n    ${env.recorderName} = __lively_modules__.moduleEnv("${fullname}").recorder;`;
      footer += `\n__lively_modules__.evaluationDone("${fullname}");`
    }

    try {
      var rewrittenSource = header + evaluator.evalCodeTransform(source, tfmOptions) + footer;
      if (debug && typeof $morph !== "undefined" && $morph("log")) $morph("log").textString = rewrittenSource;
      return rewrittenSource;
    } catch (e) {
      console.error("Error in prepareCodeForCustomCompile", e.stack);
      return source;
    }
  }

  function getCachedNodejsModule(System, load) {
    // On nodejs we might run alongside normal node modules. To not load those
    // twice we have this little hack...
    try {
      var Module = System._nodeRequire("module").Module,
          id = Module._resolveFilename(load.name.replace(/^file:\/\//, "")),
          nodeModule = Module._cache[id];
      return nodeModule;
    } catch (e) {
      System.debug && console.log("[lively.modules getCachedNodejsModule] %s unknown to nodejs", load.name);
    }
    return null;
  }

  function addNodejsWrapperSource(System, load) {
    // On nodejs we might run alongside normal node modules. To not load those
    // twice we have this little hack...
    var m = getCachedNodejsModule(System, load);
    if (m) {
      load.source = `export default System._nodeRequire('${m.id}');\n`;
      load.source += lively_lang.properties.allOwnPropertiesOrFunctions(m.exports).map(k =>
        lively_lang.classHelper.isValidIdentifier(k) ?
          `export var ${k} = System._nodeRequire('${m.id}')['${k}'];` :
          `/*ignoring export "${k}" b/c it is not a valid identifier*/`).join("\n")
      System.debug && console.log("[lively.modules customTranslate] loading %s from nodejs module cache", load.name);
      return true;
    }
    System.debug && console.log("[lively.modules customTranslate] %s not yet in nodejs module cache", load.name);
    return false;
  }

  function customTranslate(proceed, load) {
    // load like
    // {
    //   address: "file:///Users/robert/Lively/lively-dev/lively.vm/tests/test-resources/some-es6-module.js",
    //   name: "file:///Users/robert/Lively/lively-dev/lively.vm/tests/test-resources/some-es6-module.js",
    //   metadata: { deps: [/*...*/], entry: {/*...*/}, format: "esm", sourceMap: ... },
    //   source: "..."
    // }

    var System = this, debug = System.debug;

    if (exceptions.some(exc => exc(load.name))) {
      debug && console.log("[lively.modules customTranslate ignoring] %s", load.name);
      return proceed(load);
    }
    if (isNode$1 && addNodejsWrapperSource(System, load)) {
      debug && console.log("[lively.modules] loaded %s from nodejs cache", load.name)
      return proceed(load);
    }

    var start = Date.now();

    var isEsm = load.metadata.format == 'esm' || load.metadata.format == 'es6'
             || (!load.metadata.format && esmFormatCommentRegExp.test(load.source.slice(0,5000)))
             || (!load.metadata.format && !cjsFormatCommentRegExp.test(load.source.slice(0,5000)) && esmRegEx.test(load.source)),
        isCjs = load.metadata.format == 'cjs',
        isGlobal = load.metadata.format == 'global' || !load.metadata.format,
        env = moduleEnv$1(System, load.name),
        instrumented = false;

    if (isEsm) {
      load.metadata.format = "esm";
      load.source = prepareCodeForCustomCompile(load.source, load.name, env, debug);
      load.metadata["lively.modules instrumented"] = true;
      instrumented = true;
      debug && console.log("[lively.modules] loaded %s as es6 module", load.name)
      // debug && console.log(load.source)

    } else if (isCjs && isNode$1) {
      load.metadata.format = "cjs";
      var id = cjs.resolve(load.address.replace(/^file:\/\//, ""));
      load.source = cjs._prepareCodeForCustomCompile(load.source, id, cjs.envFor(id), debug);
      load.metadata["lively.modules instrumented"] = true;
      instrumented = true;
      debug && console.log("[lively.modules] loaded %s as instrumented cjs module", load.name)
      // console.log("[lively.modules] no rewrite for cjs module", load.name)

    } else if (load.metadata.format === "global") {
      env.recorderName = "System.global";
      env.recorder = System.global;
      load.metadata.format = "global";
      load.source = prepareCodeForCustomCompile(load.source, load.name, env, debug);
      load.metadata["lively.modules instrumented"] = true;
      instrumented = true;
      debug && console.log("[lively.modules] loaded %s as instrumented global module", load.name)
    }

    if (!instrumented) {
      debug && console.log("[lively.modules] customTranslate ignoring %s b/c don't know how to handle format %s", load.name, load.metadata.format);
    }

    debug && console.log("[lively.modules customTranslate] done %s after %sms", load.name, Date.now()-start);
    return proceed(load);
  }


  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // Functions below are for re-loading modules from change.js. We typically
  // start with a load object that skips the normalize / fetch step. Since we need
  // to jumo in the "middle" of the load process and SystemJS does not provide an
  // interface to this, we need to invoke the translate / instantiate / execute
  // manually
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function instrumentSourceOfEsmModuleLoad(System, load) {
    // brittle!
    // The result of System.translate is source code for a call to
    // System.register that can't be run standalone. We parse the necessary
    // details from it that we will use to re-define the module
    // (dependencies, setters, execute)
    // Note: this only works for esm modules!

    return System.translate(load).then(translated => {
      // translated looks like
      // (function(__moduleName){System.register(["./some-es6-module.js", ...], function (_export) {
      //   "use strict";
      //   var x, z, y;
      //   return {
      //     setters: [function (_someEs6ModuleJs) { ... }],
      //     execute: function () {...}
      //   };
      // });

      var parsed            = ast.parse(translated),
          call              = parsed.body[0].expression,
          moduleName        = call.arguments[0].value,
          registerCall      = call.callee.body.body[0].expression,
          depNames          = lively_lang.arr.pluck(registerCall["arguments"][0].elements, "value"),
          declareFuncNode   = call.callee.body.body[0].expression["arguments"][1],
          declareFuncSource = translated.slice(declareFuncNode.start, declareFuncNode.end),
          declare           = eval(`var __moduleName = "${moduleName}";(${declareFuncSource});\n//@ sourceURL=${moduleName}\n`);

      if (System.debug && typeof $morph !== "undefined" && $morph("log"))
        $morph("log").textString = declare;

      return {localDeps: depNames, declare: declare};
    });
  }

  function instrumentSourceOfGlobalModuleLoad(System, load) {

    return System.translate(load).then(translated => {
      // return {localDeps: depNames, declare: declare};
      return {translated: translated};
    });
  }

  function wrapModuleLoad$1(System) {
    if (isHookInstalled$1(System, "translate", "lively_modules_translate_hook")) return;
    installHook$1(
      System, "translate",
      function lively_modules_translate_hook(proceed, load) { return customTranslate.call(System, proceed, load); });
  }

  function unwrapModuleLoad$1(System) {
    removeHook$1(System, "translate", "lively_modules_translate_hook");
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  var GLOBAL$1 = typeof window !== "undefined" ? window : (typeof Global !== "undefined" ? Global : global);
  var isNode = System.get("@system-env").node;


  var SystemClass = System.constructor;
  if (!SystemClass.systems) SystemClass.systems = {};

  SystemClass.prototype.__defineGetter__("__lively.modules__", function() {
    var System = this;
    return {
      moduleEnv: function(id) { return moduleEnv$1(System, id); },
      // TODO this is just a test, won't work in all cases...
      get itself() { return System.get(System.normalizeSync("lively.modules/index.js")); },
      evaluationDone: function(moduleId) {
        addGetterSettersForNewVars(System, moduleId);
        runScheduledExportChanges(System, moduleId);
      },
      dumpConfig: function() {
        return JSON.stringify({
          baseURL: System.baseURL,
          transpiler: System.transpiler,
          defaultJSExtensions: System.defaultJSExtensions,
          map: System.map,
          meta: System.meta,
          packages: System.packages,
          paths: System.paths,
          packageConfigPaths: System.packageConfigPaths
        }, null, 2);
      },
      loadedModules: System["__lively.modules__loadedModules"] || (System["__lively.modules__loadedModules"] = {}),
      pendingExportChanges: System["__lively.modules__pendingExportChanges"] || (System["__lively.modules__pendingExportChanges"] = {})
    }
  })

  function systems() { return SystemClass.systems }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // System creation + access interface
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function nameOfSystem(System) {
    return Object.keys(systems()).detect(name => systems()[name] === System);
  }

  function getSystem(nameOrSystem, config) {
    return nameOrSystem && typeof nameOrSystem !== "string" ?
      nameOrSystem : systems()[nameOrSystem] || (systems()[nameOrSystem] = makeSystem(config));
  }

  function removeSystem(nameOrSystem) {
    // FIXME "unload" code...???
    var name = nameOrSystem && typeof nameOrSystem !== "string" ?
      nameOfSystem(nameOrSystem) : nameOrSystem;
    delete systems()[name];
  }

  function makeSystem(cfg) {
    return prepareSystem(new SystemClass(), cfg);
  }

  function prepareSystem(System, config) {
    System.trace = true;

    wrapModuleLoad$1(System);

    if (!isHookInstalled$1(System, "normalizeHook"))
      installHook$1(System, "normalize", normalizeHook);

    if (!isHookInstalled$1(System, "normalizeSync", "normalizeSyncHook"))
      installHook$1(System, "normalizeSync", normalizeSyncHook);

    config = lively_lang.obj.merge({transpiler: 'babel', babelOptions: {}}, config);

    if (isNode) {
      var nodejsCoreModules = ["addons", "assert", "buffer", "child_process",
          "cluster", "console", "crypto", "dgram", "dns", "domain", "events", "fs",
          "http", "https", "module", "net", "os", "path", "punycode", "querystring",
          "readline", "repl", "stream", "stringdecoder", "timers", "tls",
          "tty", "url", "util", "v8", "vm", "zlib"],
          map = nodejsCoreModules.reduce((map, ea) => { map[ea] = "@node/" + ea; return map; }, {});
      config.map = lively_lang.obj.merge(map, config.map);
      // for sth l ike map: {"lively.lang": "node_modules:lively.lang"}
      // cfg.paths = obj.merge({"node_modules:*": "./node_modules/*"}, cfg.paths);
    }

    config.packageConfigPaths = config.packageConfigPaths || ['./node_modules/*/package.json'];
    // if (!cfg.hasOwnProperty("defaultJSExtensions")) cfg.defaultJSExtensions = true;

    System.config(config);

    return System;
  }

  function normalizeHook(proceed, name, parent, parentAddress) {
    var System = this;
    if (name === "..") name = '../index.js'; // Fix ".."

    return proceed(name, parent, parentAddress)
      .then(result => {

        // lookup package main
        var base = result.replace(/\.js$/, "");
        if (base in System.packages) {
          var main = System.packages[base].main;
          if (main) return base.replace(/\/$/, "") + "/" + main.replace(/^\.?\//, "");
        }

        // Fix issue with accidentally adding .js
        var m = result.match(/(.*json)\.js/i);
        if (m) return m[1];

        return result;
      })
  }

  function normalizeSyncHook(proceed, name, parent, isPlugin) {
    var System = this;
    if (name === "..") name = '../index.js'; // Fix ".."

    // systemjs' normalizeSync has by default not the fancy
    // '{node: "events", "~node": "@mepty"}' mapping but we need it
    var pkg = parent && normalize_packageOfURL(parent, System);
    if (pkg) {
      var mappedObject = pkg.map[name] || System.map[name];
      if (typeof mappedObject === "object") {
        name = normalize_doMapWithObject(mappedObject, pkg, System) || name;
      }
    }

    var result =  proceed(name, parent, isPlugin)

    // lookup package main
    var base = result.replace(/\.js$/, "");
    if (base in System.packages) {
      var main = System.packages[base].main;
      if (main) return base.replace(/\/$/, "") + "/" + main.replace(/^\.?\//, "");
    }

    // Fix issue with accidentally adding .js
    var m = result.match(/(.*json)\.js/i);
    if (m) return m[1];

    return result;

  }

  function normalize_doMapWithObject(mappedObject, pkg, loader) {
    // SystemJS allows stuff like {events: {"node": "@node/events", "~node": "@empty"}}
    // for conditional name lookups based on the environment. The resolution
    // process in SystemJS is asynchronous, this one here synch. to support
    // normalizeSync and a one-step-load
    var env = loader.get(pkg.map['@env'] || '@system-env');
    // first map condition to match is used
    var resolved;
    for (var e in mappedObject) {
      var negate = e[0] == '~';
      var value = normalize_readMemberExpression(negate ? e.substr(1) : e, env);
      if (!negate && value || negate && !value) {
        resolved = mappedObject[e];
        break;
      }
    }

    if (resolved) {
      if (typeof resolved != 'string')
        throw new Error('Unable to map a package conditional to a package conditional.');
    }
    return resolved;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function normalize_readMemberExpression(p, value) {
      var pParts = p.split('.');
      while (pParts.length)
        value = value[pParts.shift()];
      return value;
    }
  }

  function normalize_packageOfURL(url, System) {
    // given a url like "http://localhost:9001/lively.lang/lib/base.js" finds the
    // corresponding package name in loader.packages, like "http://localhost:9001/lively.lang"
    // ... actually it returns the package
    var packageNames = Object.keys(System.packages || {}),
        matchingPackages = packageNames
          .map(pkgName =>
            url.indexOf(pkgName) === 0 ?
              {url: pkgName, penalty: url.slice(pkgName.length).length} : null)
          .filter(ea => !!ea),
        pName = matchingPackages.length ?
          matchingPackages.reduce((matchingPkg, ea) => matchingPkg.penalty > ea.penalty ? ea: matchingPkg).url :
          null;
    return pName ? System.packages[pName] : null;
  }


  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // debugging
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function printSystemConfig$1(System) {
    System = getSystem(System);
    var json = {
      baseURL:             System.baseURL,
      transpiler:          System.transpiler,
      defaultJSExtensions: System.defaultJSExtensions,
      defaultExtension:    System.defaultExtension,
      map:                 System.map,
      meta:                System.meta,
      packages:            System.packages,
      paths:               System.paths,
      packageConfigPaths:  System.packageConfigPaths,
      bundles:             System.bundles
    }
    return JSON.stringify(json, null, 2);
  }


  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // module state
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function loadedModules$1(System) { return System["__lively.modules__"].loadedModules; }

  function moduleEnv$1(System, moduleId) {
    var ext = System["__lively.modules__"];

    if (ext.loadedModules[moduleId]) return ext.loadedModules[moduleId];

    var env = {
      loadError: undefined,
      recorderName: "__lvVarRecorder",
      dontTransform: ["__rec__", "__lvVarRecorder", "global", "self", "_moduleExport", "_moduleImport"].concat(ast.query.knownGlobals),
      recorder: Object.create(GLOBAL$1, {
        _moduleExport: {
          get() { return (name, val) => scheduleModuleExportsChange(System, moduleId, name, val, true/*add export*/); }
        },
        _moduleImport: {
          get: function() {
            return (imported, name) => {
              var id = System.normalizeSync(imported, moduleId),
                  imported = System._loader.modules[id];
              if (!imported) throw new Error(`import of ${name} failed: ${imported} (tried as ${id}) is not loaded!`);
              if (name == undefined) return imported.module;
              if (!imported.module.hasOwnProperty(name))
                console.warn(`import from ${imported}: Has no export ${name}!`);
              return imported.module[name];
            }
          }
        }
      })
    }

    env.recorder.System = System;

    return ext.loadedModules[moduleId] = env;
  }

  function addGetterSettersForNewVars(System, moduleId) {
    // after eval we modify the env so that all captures vars are wrapped in
    // getter/setter to be notified of changes
    // FIXME: better to not capture via assignments but use func calls...!
    var rec = moduleEnv$1(System, moduleId).recorder,
        prefix = "__lively.modules__";

    if (rec === System.global) {
      console.warn(`[lively.modules] addGetterSettersForNewVars: recorder === global, refraining from installing setters!`)
      return;
    }

    lively_lang.properties.own(rec).forEach(key => {
      if (key.indexOf(prefix) === 0 || rec.__lookupGetter__(key)) return;
      Object.defineProperty(rec, prefix + key, {
        enumerable: false,
        writable: true,
        value: rec[key]
      });
      Object.defineProperty(rec, key, {
        enumerable: true,
        get: () => rec[prefix + key],
        set: (v) => {
          scheduleModuleExportsChange(System, moduleId, key, v, false/*add export*/);
          return rec[prefix + key] = v;
        }
      });
    });
  }

  function sourceOf$1(System, moduleName, parent) {
    return System.normalize(moduleName, parent)
      .then(id => {
        var load = (System.loads && System.loads[id]) || {
          status: 'loading', address: id, name: id,
          linkSets: [], dependencies: [], metadata: {}};
        return System.fetch(load);
      });
  }

  function metadata(System, moduleId) {
    var load = System.loads ? System.loads[moduleId] : null;
    return load ? load.metadata : null;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // module records
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function moduleRecordFor$1(System, fullname) {
    var record = System._loader.moduleRecords[fullname];
    if (!record) return null;
    if (!record.hasOwnProperty("__lively_modules__"))
      record.__lively_modules__ = {evalOnlyExport: {}};
    return record;
  }

  function updateModuleRecordOf(System, fullname, doFunc) {
    var record = moduleRecordFor$1(System, fullname);
    if (!record) throw new Error(`es6 environment global of ${fullname}: module not loaded, cannot get export object!`);
    record.locked = true;
    try {
      return doFunc(record);
    } finally { record.locked = false; }
  }

  var join = lively_lang.string.joinPath;

  function isURL(string) { return /^[^:\\]+:\/\//.test(string); }

  function urlResolve(url) {
    var urlMatch = url.match(/^([^:]+:\/\/)(.*)/);
    if (!urlMatch) return url;
    
    var protocol = urlMatch[1],
        path = urlMatch[2],
        result = path;
    // /foo/../bar --> /bar
    do {
        path = result;
        result = path.replace(/\/[^\/]+\/\.\./, '');
    } while (result != path);
    // foo//bar --> foo/bar
    result = result.replace(/(^|[^:])[\/]+/g, '$1/');
    // foo/./bar --> foo/bar
    result = result.replace(/\/\.\//g, '/');
    return protocol + result;
  }

  function normalizeInsidePackage(System, urlOrName, packageURL) {
    return isURL(urlOrName) ?
      urlOrName : // absolute
      urlResolve(join(urlOrName[0] === "." ? packageURL : System.baseURL, urlOrName)); // relative to either the package or the system:
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // packages
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function importPackage$1(System, packageURL) {
    return System.normalize(packageURL)
      .then(resolvedURL => // ensure it's a directory
        resolvedURL.match(/\.js/) ?
          resolvedURL.split("/").slice(0,-1).join("/") :
          resolvedURL)
      .then(url => registerPackage$1(System, url))
      .then(() => System.normalize(packageURL))
      .then(entry => System.import(entry));
  }

  function registerPackage$1(System, packageURL) {
    if (!isURL(packageURL)) {
      return Promise.reject(new Error(`Error registering package: ${packageURL} is not a valid URL`));
    }

    if (packageURL.match(/\.js$/)) {
      return Promise.reject(new Error("[registerPackage] packageURL is expected to point to a directory but seems to be a .js file: " + packageURL));
    }

    packageURL = String(packageURL).replace(/\/$/, "");

    System.debug && console.log("[lively.modules package register] %s", packageURL);

    var packageInSystem = System.packages[packageURL] || (System.packages[packageURL] = {});

    return tryToLoadPackageConfig(System, packageURL)
      .then(cfg =>
        Promise.resolve(applyConfig(System, cfg, packageURL))
          .then(packageConfigResult =>
            Promise.all(packageConfigResult.subPackages.map(subp =>
              registerPackage$1(System, subp.address))))
          .then(() => cfg.name));
  }

  function tryToLoadPackageConfig(System, packageURL) {
    var packageConfigURL = packageURL + "/package.json";

    System.config({
      meta: {[packageConfigURL]: {format: "json"}},
      packages: {[packageURL]: {meta: {"package.json": {format: "json"}}}}
    });

    System.debug && console.log("[lively.modules package reading config] %s", packageConfigURL)

    return Promise.resolve(System.get(packageConfigURL) || System.import(packageConfigURL))
      .then(config => {
        lively_lang.arr.pushIfNotIncluded(System.packageConfigPaths, packageConfigURL)
        return config;
      })
      .catch((err) => {
        console.log("[lively.modules package] Unable loading package config %s for package: ", packageConfigURL, err);
        delete System.meta[packageConfigURL];
        var name = packageURL.split("/").slice(-1)[0];
        return {name: name}; // "pseudo-config"
      });
  }

  function applyConfig(System, packageConfig, packageURL) {
    // takes a config json object (typically read from a package.json file but
    // can be used standalone) and changes the System configuration to what it finds
    // in it.
    // In particular uses the "systemjs" section as described in https://github.com/systemjs/systemjs/blob/master/docs/config-api.md
    // and uses the "lively" section as described in `applyLivelyConfig`

    var name            = packageConfig.name || packageURL.split("/").slice(-1)[0],
        packageInSystem = System.packages[packageURL] || (System.packages[packageURL] = {}),
        sysConfig       = packageConfig.systemjs,
        livelyConfig    = packageConfig.lively,
        main            = packageConfig.main || "index.js";
    System.config({map: {[name]: packageURL}});

    if (!packageInSystem.map) packageInSystem.map = {};

    if (sysConfig) {
      if (sysConfig.packageConfigPaths)
        System.packageConfigPaths = lively_lang.arr.uniq(System.packageConfigPaths.concat(sysConfig.packageConfigPaths))
      if (sysConfig.main) main = sysConfig.main;
      applySystemJSConfig(System, packageConfig, packageURL)
    }

    var packageApplyResult = livelyConfig ?
      applyLivelyConfig(System, livelyConfig, packageURL) :
      {subPackages: []};

    packageInSystem.names = packageInSystem.names || [];
    lively_lang.arr.pushIfNotIncluded(packageInSystem.names, name);
    if (!main.match(/\.[^\/\.]+/)) main += ".js";
    packageInSystem.main = main;

    return packageApplyResult;
  }

  function applySystemJSConfig(System, systemjsConfig, packageURL) {}

  function applyLivelyConfig(System, livelyConfig, packageURL) {
    // configures System object from lively config JSON object.
    // - adds System.package entry for packageURL
    // - adds name to System.package[packageURL].names
    // - installs hook from {hooks: [{name, source}]}
    // - merges livelyConfig.packageMap into System.package[packageURL].map
    //   entries in packageMap are specifically meant to be sub-packages!
    // Will return a {subPackages: [{name, address},...]} object
    applyLivelyConfigMeta(System, livelyConfig, packageURL);
    applyLivelyConfigHooks(System, livelyConfig, packageURL);
    applyLivelyConfigBundles(System, livelyConfig, packageURL);
    return applyLivelyConfigPackageMap(System, livelyConfig, packageURL);
  }

  function applyLivelyConfigHooks(System, livelyConfig, packageURL) {
    (livelyConfig.hooks || []).forEach(h => {
      try {
        var f = eval("(" + h.source + ")");
        if (!f.name || !isHookInstalled$1(System, h.target, f.name))
          installHook$1(System, h.target, f);
      } catch (e) {
        console.error("Error installing hook for %s: %s", packageURL, e, h);
      }
    });
  }

  function applyLivelyConfigBundles(System, livelyConfig, packageURL) {
    if (!livelyConfig.bundles) return Promise.resolve();
    var normalized = Object.keys(livelyConfig.bundles).reduce((bundles, name) => {
      var absName = packageURL.replace(/\/$/, "") + "/" + name;
      var files = livelyConfig.bundles[name].map(f => System.normalizeSync(f, packageURL + "/"));
      bundles[absName] = files;
      return bundles;
    }, {});
    System.config({bundles: normalized});
    return Promise.resolve();
  }

  function applyLivelyConfigMeta(System, livelyConfig, packageURL) {
    if (!livelyConfig.meta) return;
    var pConf = System.packages[packageURL];
    Object.keys(livelyConfig.meta).forEach(key => {
      var val = livelyConfig.meta[key];
      if (isURL(key)) {
        System.meta[key] = val;
      } else {
        if (!pConf.meta) pConf.meta = {};
        pConf.meta[key] = val;
      }
    });
  }

  function applyLivelyConfigPackageMap(System, livelyConfig, packageURL) {
    var subPackages = livelyConfig.packageMap ?
      Object.keys(livelyConfig.packageMap).map(name =>
        subpackageNameAndAddress(System, livelyConfig, name, packageURL)) : [];
    return {subPackages: subPackages};
  }

  function subpackageNameAndAddress(System, livelyConfig, subPackageName, packageURL) {
    var pConf = System.packages[packageURL],
        preferLoadedPackages = livelyConfig.hasOwnProperty("preferLoadedPackages") ?
          livelyConfig.preferLoadedPackages : true;

    var normalized = System.normalizeSync(subPackageName, packageURL + "/");
    if (preferLoadedPackages && (pConf.map[subPackageName] || System.map[subPackageName] || System.get(normalized))) {
      var subpackageURL;
      if (pConf.map[subPackageName]) subpackageURL = normalizeInsidePackage(System, pConf.map[subPackageName], packageURL);
      else if (System.map[subPackageName]) subpackageURL = normalizeInsidePackage(System, System.map[subPackageName], packageURL);
      else subpackageURL = normalized;
      System.debug && console.log("[lively.module package] Package %s required by %s already in system as %s", subPackageName, packageURL, subpackageURL);
      return {name: subPackageName, address: subpackageURL};
    }

    pConf.map[subPackageName] = livelyConfig.packageMap[subPackageName];

    // lookup
    var subpackageURL = normalizeInsidePackage(System, livelyConfig.packageMap[subPackageName], packageURL);
    System.debug && console.log("[lively.module package] Package %s required by %s NOT in system, will be loaded as %s", subPackageName, packageURL, subpackageURL);
    return {name: subPackageName, address: subpackageURL};
  }

  function groupIntoPackages$1(System, moduleNames, packageNames) {

    return lively_lang.arr.groupBy(moduleNames, groupFor);

    function groupFor(moduleName) {
      var fullname = System.normalizeSync(moduleName),
          matching = packageNames.filter(p => fullname.indexOf(p) === 0);
      return matching.length ?
        matching.reduce((specific, ea) => ea.length > specific.length ? ea : specific) :
        "no group";
    }
  }

  function ensureImportsAreLoaded(System, code, parentModule) {
    var body = ast.parse(code).body,
        imports = body.filter(node => node.type === "ImportDeclaration");
    return Promise.all(imports.map(node =>
            System.normalize(node.source.value, parentModule)
              .then(fullName => moduleRecordFor$1(System, fullName) ? undefined : System.import(fullName))))
          .catch(err => { console.error("Error ensuring imports: " + err.message); throw err; });
  }


  function runEval$1(System, code, options) {
    options = lively_lang.obj.merge({
      targetModule: null, parentModule: null,
      parentAddress: null
    }, options);

    return Promise.resolve()
      .then(() => {
        var targetModule = options.targetModule || "*scratch*";
        return System.normalize(targetModule, options.parentModule, options.parentAddress);
      })
      .then((targetModule) => {
        var fullname = options.targetModule = targetModule;
    
        // throw new Error(`Cannot load module ${options.targetModule} (tried as ${fullName})\noriginal load error: ${e.stack}`)
    
        return System.import(fullname)
          .then(() => ensureImportsAreLoaded(System, code, fullname))
          .then(() => {
            var env = moduleEnv$1(System, fullname),
                rec = env.recorder,
                recName = env.recorderName,
                header = `var _moduleExport = ${recName}._moduleExport,\n`
                       + `    _moduleImport = ${recName}._moduleImport;\n`;

            code = header + code;

            options = lively_lang.obj.merge(
              {waitForPromise: true},
              options, {
                recordGlobals: true,
                dontTransform: env.dontTransform,
                varRecorderName: recName,
                topLevelVarRecorder: rec,
                sourceURL: options.sourceURL || options.targetModule,
                context: rec,
                es6ExportFuncId: "_moduleExport",
                es6ImportFuncId: "_moduleImport",
                // header: header
              });
    
            // clearPendingModuleExportChanges(fullname);
    
            return evaluator.runEval(code, options).then(result => {
              System["__lively.modules__"].evaluationDone(fullname); return result; })
          })
          // .catch(err => console.error(err) || err)
      });
  }

  function moduleSourceChange$1(System, moduleName, newSource, options) {
    return System.normalize(moduleName)
      .then(moduleId => {
        var meta = metadata(System, moduleId);
        switch (meta ? meta.format : undefined) {
          case 'es6': case 'esm': case undefined:
            return moduleSourceChangeEsm(System, moduleId, newSource, options);

          case 'global':
            return moduleSourceChangeGlobal(System, moduleId, newSource, options);

          default:
            throw new Error(`moduleSourceChange is not supported for module ${moduleId} with format `)
        }
      });
  }

  function moduleSourceChangeEsm(System, moduleId, newSource, options) {
    var debug = System["__lively.modules__"].debug,
        load = {
          status: 'loading',
          source: newSource,
          name: moduleId,
          address: moduleId,
          linkSets: [],
          dependencies: [],
          metadata: {format: "esm"}
        };

    return (System.get(moduleId) ? Promise.resolve() : System.import(moduleId))

      // translate the source and produce a {declare: FUNCTION, localDeps:
      // [STRING]} object
      .then((_) => instrumentSourceOfEsmModuleLoad(System, load))

      .then(updateData => {
        // evaluate the module source
        var _exports = (name, val) => scheduleModuleExportsChange(System, load.name, name, val),
            declared = updateData.declare(_exports);
        System["__lively.modules__"].evaluationDone(load.name);

        debug && console.log("[lively.vm es6] sourceChange of %s with deps", load.name, updateData.localDeps);

        // ensure dependencies are loaded
        return Promise.all(
          // gather the data we need for the update, this includes looking up the
          // imported modules and getting the module record and module object as
          // a fallback (module records only exist for esm modules)
          updateData.localDeps.map(depName =>
            System.normalize(depName, load.name)
              .then(depFullname => {
                  var depModule = System.get(depFullname),
                      record = moduleRecordFor$1(System, depFullname);
                  return depModule && record ?
                    {name: depName, fullname: depFullname, module: depModule, record: record} :
                    System.import(depFullname).then((module) => ({
                      name: depName,
                      fullname: depFullname,
                      module: System.get(depFullname) || module,
                      record: moduleRecordFor$1(System, depFullname)
                    }));
              })))

        .then(deps => {
          // 1. update dependencies
          var record = moduleRecordFor$1(System, load.name);
          if (record) record.dependencies = deps.map(ea => ea.record);

          // hmm... for house keeping... not really needed right now, though
          var prevLoad = System.loads && System.loads[load.name];
          if (prevLoad) {
            prevLoad.deps = deps.map(ea => ea.name);
            prevLoad.depMap = deps.reduce((map, dep) => { map[dep.name] = dep.fullname; return map; }, {});
            if (prevLoad.metadata && prevLoad.metadata.entry) {
              prevLoad.metadata.entry.deps = prevLoad.deps;
              prevLoad.metadata.entry.normalizedDeps = deps.map(ea => ea.fullname);
              prevLoad.metadata.entry.declare = updateData.declare;
            }
          }
          // 2. run setters to populate imports
          deps.forEach((d,i) => declared.setters[i](d.module));
          // 3. execute module body
          return declared.execute();
        });
      });
  }

  function moduleSourceChangeGlobal(System, moduleId, newSource, options) {
    var load = {
      status: 'loading',
      source: newSource,
      name: moduleId,
      address: moduleId,
      linkSets: [],
      dependencies: [],
      metadata: {format: "global"}
    };

    return (System.get(moduleId) ? Promise.resolve() : System.import(moduleId))

      // translate the source and produce a {declare: FUNCTION, localDeps:
      // [STRING]} object
      .then((_) => instrumentSourceOfGlobalModuleLoad(System, load))

      .then(updateData => {
        load.source = updateData.translated;
        var entry = doInstantiateGlobalModule(System, load);
        System.delete(moduleId);
        System.set(entry.name, entry.esModule)
        return entry.module;
      });
  }

  function doInstantiateGlobalModule(System, load) {

    var entry = __createEntry();
    entry.name = load.name;
    entry.esmExports = true;
    load.metadata.entry = entry;

    entry.deps = [];

    for (var g in load.metadata.globals) {
      var gl = load.metadata.globals[g];
      if (gl)
        entry.deps.push(gl);
    }

    entry.execute = function executeGlobalModule(require, exports, module) {

      // SystemJS exports detection for global modules is based in new props
      // added to the global. In order to allow re-load we remove previously
      // "exported" values
      var prevMeta = metadata(System, module.id),
          exports = prevMeta && prevMeta.entry
                 && prevMeta.entry.module && prevMeta.entry.module.exports;
      if (exports)
        Object.keys(exports).forEach(name => {
          try { delete System.global[name]; } catch (e) {
            console.warn(`[lively.modules] executeGlobalModule: Cannot delete global["${name}"]`)
          }
        });

      var globals;
      if (load.metadata.globals) {
        globals = {};
        for (var g in load.metadata.globals)
          if (load.metadata.globals[g])
            globals[g] = require(load.metadata.globals[g]);
      }

      var exportName = load.metadata.exports;

      if (exportName)
        load.source += `\nSystem.global["${exportName}"] = ${exportName};`

      var retrieveGlobal = System.get('@@global-helpers').prepareGlobal(module.id, exportName, globals);

      __evaluateGlobalLoadSource(System, load);

      return retrieveGlobal();
    }

    return runExecuteOfGlobalModule(System, entry);
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function __createEntry() {
    return {
      name: null,
      deps: null,
      originalIndices: null,
      declare: null,
      execute: null,
      executingRequire: false,
      declarative: false,
      normalizedDeps: null,
      groupIndex: null,
      evaluated: false,
      module: null,
      esModule: null,
      esmExports: false
    };
  }

  function __evaluateGlobalLoadSource(System, load) {
    // System clobbering protection (mostly for Traceur)
    var curLoad, curSystem, callCounter = 0, __global = System.global;
    return __exec.call(System, load);

    function preExec(loader, load) {
      if (callCounter++ == 0)
        curSystem = __global.System;
      __global.System = __global.SystemJS = loader;
    }

    function postExec() {
      if (--callCounter == 0)
        __global.System = __global.SystemJS = curSystem;
      curLoad = undefined;
    }

    function __exec(load) {
      // if ((load.metadata.integrity || load.metadata.nonce) && supportsScriptExec)
      //   return scriptExec.call(this, load);
      try {
        preExec(this, load);
        curLoad = load;
        (0, eval)(load.source);
        postExec();
      }
      catch (e) {
        postExec();
        throw new Error(`Error evaluating ${load.address}:\n${e.stack}`);
      }
    };
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function runExecuteOfGlobalModule(System, entry) {
    // if (entry.module) return;

    var exports = {},
        module = entry.module = {exports: exports, id: entry.name};

    // // AMD requires execute the tree first
    // if (!entry.executingRequire) {
    //   for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
    //     var depName = entry.normalizedDeps[i];
    //     var depEntry = loader.defined[depName];
    //     if (depEntry)
    //       linkDynamicModule(depEntry, loader);
    //   }
    // }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(System.global, function(name) {
      var dep = entry.deps.find(dep => dep === name),
          loadedDep = (dep && System.get(entry.normalizedDeps[entry.deps.indexOf(dep)]))
                   || System.get(System.normalizeSync(name, entry.name));
      if (loadedDep) return loadedDep;
      throw new Error('Module ' + name + ' not declared as a dependency of ' + entry.name);
    }, exports, module);

    if (output)
      module.exports = output;

    // create the esModule object, which allows ES6 named imports of dynamics
    exports = module.exports;

    // __esModule flag treats as already-named
    var Module = System.get("@system-env").constructor;
    if (exports && (exports.__esModule || exports instanceof Module))
      entry.esModule = exports;
    // set module as 'default' export, then fake named exports by iterating properties
    else if (entry.esmExports && exports !== System.global)
      entry.esModule = System.newModule(exports);
    // just use the 'default' export
    else
      entry.esModule = { 'default': exports };

    return entry;
  }

  function forgetEnvOf(System, fullname) {
    delete System["__lively.modules__"].loadedModules[fullname];
  }

  function forgetModuleDeps(System, moduleName, opts) {
    opts = lively_lang.obj.merge({forgetDeps: true, forgetEnv: true}, opts);
    var id = System.normalizeSync(moduleName),
        deps = findDependentsOf$1(System, id);
    deps.forEach(ea => {
      System.delete(ea);
      if (System.loads) delete System.loads[ea];
      opts.forgetEnv && forgetEnvOf(System, ea);
    });
    return id;
  }

  function forgetModule$1(System, moduleName, opts) {
    opts = lively_lang.obj.merge({forgetDeps: true, forgetEnv: true}, opts);
    var id = opts.forgetDeps ?
      forgetModuleDeps(System, moduleName, opts) :
      System.normalizeSync(moduleName);
    System.delete(moduleName);
    System.delete(id);
    if (System.loads) {
      delete System.loads[moduleName];
      delete System.loads[id];
    }
    if (opts.forgetEnv) {
      forgetEnvOf(System, id);
      forgetEnvOf(System, moduleName);
    }
  }

  function reloadModule$1(System, moduleName, opts) {
    opts = lively_lang.obj.merge({reloadDeps: true, resetEnv: true}, opts);
    var id = System.normalizeSync(moduleName),
        toBeReloaded = [id];
    if (opts.reloadDeps) toBeReloaded = findDependentsOf$1(System, id).concat(toBeReloaded);
    forgetModule$1(System, id, {forgetDeps: opts.reloadDeps, forgetEnv: opts.resetEnv});
    return Promise.all(toBeReloaded.map(ea => ea !== id && System.import(ea)))
            .then(() => System.import(id));
  }

  // function computeRequireMap() {
  //   return Object.keys(_currentSystem.loads).reduce((requireMap, k) => {
  //     requireMap[k] = lang.obj.values(_currentSystem.loads[k].depMap);
  //     return requireMap;
  //   }, {});
  // }

  function computeRequireMap(System) {
    if (System.loads) {
      var store = System.loads,
          modNames = lively_lang.arr.uniq(Object.keys(loadedModules$1(System)).concat(Object.keys(store)));
      return modNames.reduce((requireMap, k) => {
        var depMap = store[k] ? store[k].depMap : {};
        requireMap[k] = Object.keys(depMap).map(localName => {
          var resolvedName = depMap[localName];
          if (resolvedName === "@empty") return `${resolvedName}/${localName}`;
          return resolvedName;
        })
        return requireMap;
      }, {});
    }

    return Object.keys(System._loader.moduleRecords).reduce((requireMap, k) => {
      requireMap[k] = System._loader.moduleRecords[k].dependencies.filter(Boolean).map(ea => ea.name);
      return requireMap;
    }, {});
  }

  function findDependentsOf$1(System, name) {
    // which modules (module ids) are (in)directly import module with id
    // Let's say you have
    // module1: export var x = 23;
    // module2: import {x} from "module1.js"; export var y = x + 1;
    // module3: import {y} from "module2.js"; export var z = y + 1;
    // `findDependentsOf` gives you an answer what modules are "stale" when you
    // change module1 = module2 + module3
    var id = System.normalizeSync(name);
    return lively_lang.graph.hull(lively_lang.graph.invert(computeRequireMap(System)), id);
  }

  function findRequirementsOf$1(System, name) {
    // which modules (module ids) are (in)directly required by module with id
    // Let's say you have
    // module1: export var x = 23;
    // module2: import {x} from "module1.js"; export var y = x + 1;
    // module3: import {y} from "module2.js"; export var z = y + 1;
    // `findRequirementsOf("./module3")` will report ./module2 and ./module1
    var id = System.normalizeSync(name);
    return lively_lang.graph.hull(computeRequireMap(System), id);
  }

  var GLOBAL = typeof window !== "undefined" ? window :
                (typeof global !== "undefined" ? global :
                  (typeof self !== "undefined" ? self : this));

  exports.System = exports.System || prepareSystem(GLOBAL.System);
  function changeSystem(newSystem, makeGlobal) {
    exports.System = newSystem;
    if (makeGlobal) GLOBAL.System = newSystem;
    return newSystem;
  }
  function loadedModules() { return Object.keys(lively.modules.requireMap()); }
  function sourceOf(id) { return sourceOf$1(exports.System, id); }
  function moduleEnv(id) { return moduleEnv$1(exports.System, id); }
  function moduleRecordFor(id) { return moduleRecordFor$1(exports.System, id); }
  function printSystemConfig() { return printSystemConfig$1(exports.System); }
  function importPackage(packageURL) { return importPackage$1(exports.System, packageURL); }
  function registerPackage(packageURL) { return registerPackage$1(exports.System, packageURL); }
  function groupIntoPackages(moduleNames, packageNames) { return groupIntoPackages$1(exports.System, moduleNames, packageNames); }
  function moduleSourceChange(moduleName, newSource, options) { return moduleSourceChange$1(exports.System, moduleName, newSource, options); }
  function findDependentsOf(module) { return findDependentsOf$1(exports.System, module); }
  function findRequirementsOf(module) { return findRequirementsOf$1(exports.System, module); }
  function forgetModule(module, opts) { return forgetModule$1(exports.System, module, opts); }
  function reloadModule(module, opts) { return reloadModule$1(exports.System, module, opts); }
  function requireMap() { return computeRequireMap(exports.System); }
  function importsAndExportsOf(moduleName) { return importsAndExportsOf$1(exports.System, moduleName); }
  function isHookInstalled(methodName, hookOrName) { return isHookInstalled$1(exports.System, methodName, hookOrName); }
  function installHook(hookName, hook) { return installHook$1(exports.System, hookName, hook); }
  function removeHook(methodName, hookOrName) { return removeHook$1(exports.System, methodName, hookOrName); }
  function wrapModuleLoad() { wrapModuleLoad$1(exports.System); }
  function unwrapModuleLoad() { unwrapModuleLoad$1(exports.System); }
  function runEval(code, options) { return runEval$1(exports.System, code, options); }

  exports.getSystem = getSystem;
  exports.removeSystem = removeSystem;
  exports.loadedModules = loadedModules;
  exports.printSystemConfig = printSystemConfig;
  exports.changeSystem = changeSystem;
  exports.sourceOf = sourceOf;
  exports.moduleEnv = moduleEnv;
  exports.moduleRecordFor = moduleRecordFor;
  exports.importPackage = importPackage;
  exports.registerPackage = registerPackage;
  exports.groupIntoPackages = groupIntoPackages;
  exports.moduleSourceChange = moduleSourceChange;
  exports.findDependentsOf = findDependentsOf;
  exports.findRequirementsOf = findRequirementsOf;
  exports.forgetModule = forgetModule;
  exports.reloadModule = reloadModule;
  exports.requireMap = requireMap;
  exports.importsAndExportsOf = importsAndExportsOf;
  exports.isHookInstalled = isHookInstalled;
  exports.installHook = installHook;
  exports.removeHook = removeHook;
  exports.wrapModuleLoad = wrapModuleLoad;
  exports.unwrapModuleLoad = unwrapModuleLoad;
  exports.runEval = runEval;

}((this.lively.modules = this.lively.modules || {}),lively.lang,lively.ast,lively.vm));
  if (typeof module !== "undefined" && module.exports) module.exports = GLOBAL.lively.modules;
})();