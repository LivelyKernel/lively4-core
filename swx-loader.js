/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }
	
	var _asyncToGenerator = _interopDefault(__webpack_require__(2));
	var path = __webpack_require__(71);
	
	if (false) {
	  const babel = require('babel-core').default;
	
	  const BABEL_REQ_PLUGINS = [require("babel-plugin-syntax-async-functions"), require("babel-plugin-syntax-async-generators"), require("babel-plugin-syntax-do-expressions"), require("babel-plugin-syntax-exponentiation-operator"), require("babel-plugin-syntax-export-extensions"), require("babel-plugin-syntax-function-bind"), require("babel-plugin-syntax-object-rest-spread"), require("babel-plugin-syntax-trailing-function-commas"), require("babel-plugin-syntax-jsx"), require("babel-plugin-transform-async-to-generator"), require("babel-plugin-transform-async-to-module-method"), require("babel-plugin-transform-do-expressions"), require("babel-plugin-transform-es2015-destructuring"), require("babel-plugin-transform-es2015-modules-systemjs"), require("babel-plugin-transform-exponentiation-operator"), require("babel-plugin-transform-export-extensions"), require("babel-plugin-transform-function-bind"), require("babel-plugin-transform-object-rest-spread"), require("babel-plugin-transform-jsx").default];
	}
	
	let Loader = class Loader {
	  constructor(options = {}) {
	    this._registry = new Map();
	    this.plugins = [];
	
	    if (options.base) {
	      this._base = new URL(options.base);
	    }
	  }
	
	  get(name) {
	    let mod = this._registry.get(name);
	
	    if (mod && !mod.executed) {
	      mod.execute();
	    }
	
	    return mod && mod.proxy;
	  }
	
	  set(name, module) {
	    if (this._registry.has(name)) {
	      this._registry.get(name).values = module;
	
	      let dependants = this._registry.get(name).dependants;
	
	      for (let dep in dependants) {
	        this._registry.get(dep).update(name, module);
	      }
	    } else {
	      this._registry.set(name, {
	        executed: true,
	        values: module,
	        proxy: module,
	        dependants: []
	      });
	    }
	  }
	
	  register(name, dependencies, wrapper) {
	    if (Array.isArray(name)) {
	      this._anonymousEntry = [];
	      this._anonymousEntry.push.apply(this._anonymousEntry, arguments);
	      return;
	    }
	
	    let proxy = Object.create(null);
	    let values = Object.create(null);
	    let mod, meta;
	
	    this._registry.set(name, mod = {
	      proxy: proxy,
	
	      values: values,
	
	      executed: false,
	
	      dependencies: dependencies.map(dep => dep.indexOf('/') < 0 && dep.indexOf('.') < 0 ? dep : path.normalize(path.resolve(name, '..', dep))),
	
	      dependants: [],
	
	      update: (moduleName, moduleObj) => {
	        meta.setters[mod.dependencies.indexOf(moduleName)](moduleObj);
	      },
	
	      execute: () => {
	        mod.executed = true;
	
	        mod.dependencies.map(dep => {
	          let imports = this.get(dep) && this._registry.get(dep).values;
	
	          if (imports) {
	            this._registry.get(dep).dependants.push(name);
	
	            mod.update(dep, imports);
	          }
	        });
	
	        meta.execute();
	      }
	    });
	
	    let _export = (identifier, value) => {
	      if (typeof identifier === 'object') {
	        for (let prop in Object.getOwnPropertyNames(identifier)) {
	          _export(prop, identifier[prop]);
	        }
	
	        return identifier;
	      }
	
	      values[identifier] = value;
	
	      mod.lock = true;
	
	      mod.dependants.forEach(function (moduleName) {
	        let module = this._registry.get(moduleName);
	
	        if (module && !module.lock) {
	          module.update(name, values);
	        }
	      });
	
	      mod.lock = false;
	
	      if (!Object.getOwnPropertyDescriptor(proxy, identifier)) {
	        Object.defineProperty(proxy, identifier, {
	          enumerable: true,
	          get: () => {
	            return values[identifier];
	          }
	        });
	      }
	
	      return value;
	    };
	
	    meta = wrapper(_export);
	  }
	
	  import(modName, options = {}) {
	    var _this = this;
	
	    return _asyncToGenerator(function* () {
	      let name = path.normalize(modName);
	      let mod = _this.get(name);
	
	      if (mod) {
	        return mod;
	      }
	
	      yield _this.load(name, options);
	
	      return _this.get(name);
	    })();
	  }
	
	  transpile(blob, { filename, uri }) {
	    var _this2 = this;
	
	    return _asyncToGenerator(function* () {
	      if (false) {
	        let sourceURL = uri.toString();
	
	        let source = babel.transform(blob, {
	          plugins: [..._this2.plugins, ...BABEL_REQ_PLUGINS],
	          sourceMaps: 'inline',
	          filename: filename,
	          sourceFileName: sourceURL,
	          compact: 'auto'
	        });
	
	        source.code += '\n//# sourceURL=' + sourceURL + '!transpiled';
	
	        return source;
	      } else {
	        return blob;
	      }
	    })();
	  }
	
	  resolve(name) {
	    return this._base ? new URL(path.join(this._base.pathname, path.resolve(name)), this._base) : name;
	  }
	
	  fetch(uri) {
	    return _asyncToGenerator(function* () {
	      let response = yield self.fetch(uri);
	
	      if (response.status != 200) {
	        throw new Error('Could not fetch: ' + uri);
	      }
	
	      let blob = yield response.text();
	
	      return blob;
	    })();
	  }
	
	  load(name, options = {}) {
	    var _this3 = this;
	
	    return _asyncToGenerator(function* () {
	      let uri = yield _this3.resolve(name, options);
	      let blob = yield _this3.fetch(uri, options);
	
	      let source = yield _this3.transpile(blob, {
	        moduleId: name,
	        filename: name,
	        uri: uri
	      });
	
	      new Function('System', source.code)(_this3);
	
	      if (_this3._anonymousEntry) {
	        _this3.register(name, _this3._anonymousEntry[0], _this3._anonymousEntry[1]);
	        _this3._anonymousEntry = undefined;
	      }
	
	      let mod = _this3._registry.get(name);
	
	      if (!mod) {
	        throw new Error('Error loading module ' + name);
	      }
	
	      return Promise.all(mod.dependencies.map(function (dependency) {
	        if (_this3._registry.has(dependency)) {
	          return Promise.resolve();
	        } else {
	          return _this3.load(dependency);
	        }
	      }));
	    })();
	  }
	};
	
	var _Array$prototype = Array.prototype;
	const filter = _Array$prototype.filter;
	const shift = _Array$prototype.shift;
	
	
	var client = _asyncToGenerator(function* () {
	  var _context;
	
	  const script = (_context = (_context = document.querySelectorAll('script'), filter).call(_context, function (el) {
	    return typeof el.dataset.livelyKernel !== 'undefined';
	  }), shift).call(_context);
	
	  if (typeof script === 'undefined') {
	    throw new Error('Cannot find lively kernel script tag. You must add the `data-lively-kernel` attribute!');
	  }
	
	  let src = new URL(script.src);
	
	  if (false) {
	    let base = new URL(KERNEL_CONFIG_BASE, src);
	  } else {
	    let base = new URL('../', src);
	  }
	
	  if (!('serviceWorker' in navigator)) {
	    console.error('[KERNEL] ServiceWorker API not available');
	    console.error('[KERNEL] Your browser is total wrong for this. I refuse to continue any further...');
	    return undefined;
	  }
	
	  try {
	    let scope = new URL('./', src);
	    let registration = yield navigator.serviceWorker.register(src, { scope: scope });
	
	    let serviceWorker = registration.installing || registration.waiting || registration.active;
	
	    if (serviceWorker.state !== 'activated' && serviceWorker.state !== 'activated') {
	      let swState = new Promise(function (resolve, reject) {
	        const fn = function (event) {
	          serviceWorker.removeEventListener('statechange', fn);
	
	          if (event.target.state === 'redundant') {
	            reject(new Error('State changed to redundant'));
	          } else {
	            resolve(event.target);
	          }
	        };
	
	        serviceWorker.addEventListener('statechange', fn);
	      });
	
	      yield swState;
	    }
	
	    console.log('[KERNEL] ServiceWorker registered and ready');
	  } catch (e) {
	    console.error('[KERNEL] ServiceWorker install failed:', e);
	    console.log('[KERNEL] Continue with client-only boot...');
	  }
	
	  let loader = new Loader({
	    base: base
	  });
	
	  loader.set('kernel', {
	    resolve: function (name) {
	      return loader.resolve(name).toString();
	    },
	    realpath: function (name) {
	      return path.resolve(name);
	    }
	  });
	
	  let init = 'livelyKernelInit' in script.dataset ? script.dataset.livelyKernelInit : KERNEL_CONFIG_INIT ? path.resolve(KERNEL_CONFIG_INIT) : false;
	
	  if (init) {
	    return loader.import(init);
	  } else {
	    return true;
	  }
	});
	
	var loader;
	
	const system = () => {
	  if (typeof loader === 'undefined') {
	    let scope = new URL(self.registration.scope);
	    let base = scope;
	
	    if (false) {
	      let base = new URL(path.join(scope.pathname, path.resolve(KERNEL_CONFIG_BASE)), scope);
	    }
	
	    loader = new Loader({
	      base: base
	    });
	
	    if (true) {
	      loader.set(("/home/jan/workspace/lively4/lively4-serviceworker/src/swx.js"), __webpack_require__(73));
	    }
	  }
	
	  return loader;
	};
	
	const init = (() => {
	  var _ref = _asyncToGenerator(function* (fn) {
	    return system().import(path.resolve(("/home/jan/workspace/lively4/lively4-serviceworker/src/swx.js"))).then(fn);
	  });
	
	  return function init(_x) {
	    return _ref.apply(this, arguments);
	  };
	})();
	
	function worker () {
	  this.addEventListener('install', event => {
	    event.waitUntil(init(worker => worker.install(event)));
	  });
	
	  this.addEventListener('activate', event => {
	    event.waitUntil(init(worker => worker.activate(event)));
	  });
	
	  this.addEventListener('fetch', event => {
	    event.waitUntil(init(worker => worker.fetch(event)));
	  });
	
	  this.addEventListener('message', event => {
	    if (event.data === 'kernel:sw-force-reload') {
	      loader = undefined;
	    }
	
	    event.waitUntil(init(worker => worker.message(event)));
	  });
	}
	
	if (typeof window !== 'undefined') {
	
	  if (false) client.call(window);
	} else if (typeof self !== 'undefined') {
	
	  if (true) worker.call(self);
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _promise = __webpack_require__(3);
	
	var _promise2 = _interopRequireDefault(_promise);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function (fn) {
	  return function () {
	    var gen = fn.apply(this, arguments);
	    return new _promise2.default(function (resolve, reject) {
	      function step(key, arg) {
	        try {
	          var info = gen[key](arg);
	          var value = info.value;
	        } catch (error) {
	          reject(error);
	          return;
	        }
	
	        if (info.done) {
	          resolve(value);
	        } else {
	          return _promise2.default.resolve(value).then(function (value) {
	            return step("next", value);
	          }, function (err) {
	            return step("throw", err);
	          });
	        }
	      }
	
	      return step("next");
	    });
	  };
	};

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(4), __esModule: true };

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(5);
	__webpack_require__(6);
	__webpack_require__(50);
	__webpack_require__(54);
	module.exports = __webpack_require__(14).Promise;

/***/ },
/* 5 */
/***/ function(module, exports) {



/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $at  = __webpack_require__(7)(true);
	
	// 21.1.3.27 String.prototype[@@iterator]()
	__webpack_require__(10)(String, 'String', function(iterated){
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , index = this._i
	    , point;
	  if(index >= O.length)return {value: undefined, done: true};
	  point = $at(O, index);
	  this._i += point.length;
	  return {value: point, done: false};
	});

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(8)
	  , defined   = __webpack_require__(9);
	// true  -> String#at
	// false -> String#codePointAt
	module.exports = function(TO_STRING){
	  return function(that, pos){
	    var s = String(defined(that))
	      , i = toInteger(pos)
	      , l = s.length
	      , a, b;
	    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	      ? TO_STRING ? s.charAt(i) : a
	      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

/***/ },
/* 8 */
/***/ function(module, exports) {

	// 7.1.4 ToInteger
	var ceil  = Math.ceil
	  , floor = Math.floor;
	module.exports = function(it){
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

/***/ },
/* 9 */
/***/ function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY        = __webpack_require__(11)
	  , $export        = __webpack_require__(12)
	  , redefine       = __webpack_require__(27)
	  , hide           = __webpack_require__(17)
	  , has            = __webpack_require__(28)
	  , Iterators      = __webpack_require__(29)
	  , $iterCreate    = __webpack_require__(30)
	  , setToStringTag = __webpack_require__(46)
	  , getPrototypeOf = __webpack_require__(48)
	  , ITERATOR       = __webpack_require__(47)('iterator')
	  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
	  , FF_ITERATOR    = '@@iterator'
	  , KEYS           = 'keys'
	  , VALUES         = 'values';
	
	var returnThis = function(){ return this; };
	
	module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
	  $iterCreate(Constructor, NAME, next);
	  var getMethod = function(kind){
	    if(!BUGGY && kind in proto)return proto[kind];
	    switch(kind){
	      case KEYS: return function keys(){ return new Constructor(this, kind); };
	      case VALUES: return function values(){ return new Constructor(this, kind); };
	    } return function entries(){ return new Constructor(this, kind); };
	  };
	  var TAG        = NAME + ' Iterator'
	    , DEF_VALUES = DEFAULT == VALUES
	    , VALUES_BUG = false
	    , proto      = Base.prototype
	    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
	    , $default   = $native || getMethod(DEFAULT)
	    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
	    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
	    , methods, key, IteratorPrototype;
	  // Fix native
	  if($anyNative){
	    IteratorPrototype = getPrototypeOf($anyNative.call(new Base));
	    if(IteratorPrototype !== Object.prototype){
	      // Set @@toStringTag to native iterators
	      setToStringTag(IteratorPrototype, TAG, true);
	      // fix for some old engines
	      if(!LIBRARY && !has(IteratorPrototype, ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
	    }
	  }
	  // fix Array#{values, @@iterator}.name in V8 / FF
	  if(DEF_VALUES && $native && $native.name !== VALUES){
	    VALUES_BUG = true;
	    $default = function values(){ return $native.call(this); };
	  }
	  // Define iterator
	  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
	    hide(proto, ITERATOR, $default);
	  }
	  // Plug for library
	  Iterators[NAME] = $default;
	  Iterators[TAG]  = returnThis;
	  if(DEFAULT){
	    methods = {
	      values:  DEF_VALUES ? $default : getMethod(VALUES),
	      keys:    IS_SET     ? $default : getMethod(KEYS),
	      entries: $entries
	    };
	    if(FORCED)for(key in methods){
	      if(!(key in proto))redefine(proto, key, methods[key]);
	    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
	  }
	  return methods;
	};

/***/ },
/* 11 */
/***/ function(module, exports) {

	module.exports = true;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(13)
	  , core      = __webpack_require__(14)
	  , ctx       = __webpack_require__(15)
	  , hide      = __webpack_require__(17)
	  , PROTOTYPE = 'prototype';
	
	var $export = function(type, name, source){
	  var IS_FORCED = type & $export.F
	    , IS_GLOBAL = type & $export.G
	    , IS_STATIC = type & $export.S
	    , IS_PROTO  = type & $export.P
	    , IS_BIND   = type & $export.B
	    , IS_WRAP   = type & $export.W
	    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
	    , expProto  = exports[PROTOTYPE]
	    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
	    , key, own, out;
	  if(IS_GLOBAL)source = name;
	  for(key in source){
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    if(own && key in exports)continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
	    // bind timers to global for call from export context
	    : IS_BIND && own ? ctx(out, global)
	    // wrap global constructors for prevent change them in library
	    : IS_WRAP && target[key] == out ? (function(C){
	      var F = function(a, b, c){
	        if(this instanceof C){
	          switch(arguments.length){
	            case 0: return new C;
	            case 1: return new C(a);
	            case 2: return new C(a, b);
	          } return new C(a, b, c);
	        } return C.apply(this, arguments);
	      };
	      F[PROTOTYPE] = C[PROTOTYPE];
	      return F;
	    // make static versions for prototype methods
	    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
	    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
	    if(IS_PROTO){
	      (exports.virtual || (exports.virtual = {}))[key] = out;
	      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
	      if(type & $export.R && expProto && !expProto[key])hide(expProto, key, out);
	    }
	  }
	};
	// type bitmap
	$export.F = 1;   // forced
	$export.G = 2;   // global
	$export.S = 4;   // static
	$export.P = 8;   // proto
	$export.B = 16;  // bind
	$export.W = 32;  // wrap
	$export.U = 64;  // safe
	$export.R = 128; // real proto method for `library` 
	module.exports = $export;

/***/ },
/* 13 */
/***/ function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
	if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ },
/* 14 */
/***/ function(module, exports) {

	var core = module.exports = {version: '2.4.0'};
	if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(16);
	module.exports = function(fn, that, length){
	  aFunction(fn);
	  if(that === undefined)return fn;
	  switch(length){
	    case 1: return function(a){
	      return fn.call(that, a);
	    };
	    case 2: return function(a, b){
	      return fn.call(that, a, b);
	    };
	    case 3: return function(a, b, c){
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function(/* ...args */){
	    return fn.apply(that, arguments);
	  };
	};

/***/ },
/* 16 */
/***/ function(module, exports) {

	module.exports = function(it){
	  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var dP         = __webpack_require__(18)
	  , createDesc = __webpack_require__(26);
	module.exports = __webpack_require__(22) ? function(object, key, value){
	  return dP.f(object, key, createDesc(1, value));
	} : function(object, key, value){
	  object[key] = value;
	  return object;
	};

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var anObject       = __webpack_require__(19)
	  , IE8_DOM_DEFINE = __webpack_require__(21)
	  , toPrimitive    = __webpack_require__(25)
	  , dP             = Object.defineProperty;
	
	exports.f = __webpack_require__(22) ? Object.defineProperty : function defineProperty(O, P, Attributes){
	  anObject(O);
	  P = toPrimitive(P, true);
	  anObject(Attributes);
	  if(IE8_DOM_DEFINE)try {
	    return dP(O, P, Attributes);
	  } catch(e){ /* empty */ }
	  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
	  if('value' in Attributes)O[P] = Attributes.value;
	  return O;
	};

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(20);
	module.exports = function(it){
	  if(!isObject(it))throw TypeError(it + ' is not an object!');
	  return it;
	};

/***/ },
/* 20 */
/***/ function(module, exports) {

	module.exports = function(it){
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = !__webpack_require__(22) && !__webpack_require__(23)(function(){
	  return Object.defineProperty(__webpack_require__(24)('div'), 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(23)(function(){
	  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 23 */
/***/ function(module, exports) {

	module.exports = function(exec){
	  try {
	    return !!exec();
	  } catch(e){
	    return true;
	  }
	};

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(20)
	  , document = __webpack_require__(13).document
	  // in old IE typeof document.createElement is 'object'
	  , is = isObject(document) && isObject(document.createElement);
	module.exports = function(it){
	  return is ? document.createElement(it) : {};
	};

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.1 ToPrimitive(input [, PreferredType])
	var isObject = __webpack_require__(20);
	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	module.exports = function(it, S){
	  if(!isObject(it))return it;
	  var fn, val;
	  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
	  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
	  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
	  throw TypeError("Can't convert object to primitive value");
	};

/***/ },
/* 26 */
/***/ function(module, exports) {

	module.exports = function(bitmap, value){
	  return {
	    enumerable  : !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable    : !(bitmap & 4),
	    value       : value
	  };
	};

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(17);

/***/ },
/* 28 */
/***/ function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function(it, key){
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 29 */
/***/ function(module, exports) {

	module.exports = {};

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var create         = __webpack_require__(31)
	  , descriptor     = __webpack_require__(26)
	  , setToStringTag = __webpack_require__(46)
	  , IteratorPrototype = {};
	
	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	__webpack_require__(17)(IteratorPrototype, __webpack_require__(47)('iterator'), function(){ return this; });
	
	module.exports = function(Constructor, NAME, next){
	  Constructor.prototype = create(IteratorPrototype, {next: descriptor(1, next)});
	  setToStringTag(Constructor, NAME + ' Iterator');
	};

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
	var anObject    = __webpack_require__(19)
	  , dPs         = __webpack_require__(32)
	  , enumBugKeys = __webpack_require__(44)
	  , IE_PROTO    = __webpack_require__(41)('IE_PROTO')
	  , Empty       = function(){ /* empty */ }
	  , PROTOTYPE   = 'prototype';
	
	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var createDict = function(){
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = __webpack_require__(24)('iframe')
	    , i      = enumBugKeys.length
	    , gt     = '>'
	    , iframeDocument;
	  iframe.style.display = 'none';
	  __webpack_require__(45).appendChild(iframe);
	  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
	  // createDict = iframe.contentWindow.Object;
	  // html.removeChild(iframe);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write('<script>document.F=Object</script' + gt);
	  iframeDocument.close();
	  createDict = iframeDocument.F;
	  while(i--)delete createDict[PROTOTYPE][enumBugKeys[i]];
	  return createDict();
	};
	
	module.exports = Object.create || function create(O, Properties){
	  var result;
	  if(O !== null){
	    Empty[PROTOTYPE] = anObject(O);
	    result = new Empty;
	    Empty[PROTOTYPE] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO] = O;
	  } else result = createDict();
	  return Properties === undefined ? result : dPs(result, Properties);
	};

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var dP       = __webpack_require__(18)
	  , anObject = __webpack_require__(19)
	  , getKeys  = __webpack_require__(33);
	
	module.exports = __webpack_require__(22) ? Object.defineProperties : function defineProperties(O, Properties){
	  anObject(O);
	  var keys   = getKeys(Properties)
	    , length = keys.length
	    , i = 0
	    , P;
	  while(length > i)dP.f(O, P = keys[i++], Properties[P]);
	  return O;
	};

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 / 15.2.3.14 Object.keys(O)
	var $keys       = __webpack_require__(34)
	  , enumBugKeys = __webpack_require__(44);
	
	module.exports = Object.keys || function keys(O){
	  return $keys(O, enumBugKeys);
	};

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var has          = __webpack_require__(28)
	  , toIObject    = __webpack_require__(35)
	  , arrayIndexOf = __webpack_require__(38)(false)
	  , IE_PROTO     = __webpack_require__(41)('IE_PROTO');
	
	module.exports = function(object, names){
	  var O      = toIObject(object)
	    , i      = 0
	    , result = []
	    , key;
	  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
	  // Don't enum bug & hidden keys
	  while(names.length > i)if(has(O, key = names[i++])){
	    ~arrayIndexOf(result, key) || result.push(key);
	  }
	  return result;
	};

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(36)
	  , defined = __webpack_require__(9);
	module.exports = function(it){
	  return IObject(defined(it));
	};

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var cof = __webpack_require__(37);
	module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};

/***/ },
/* 37 */
/***/ function(module, exports) {

	var toString = {}.toString;
	
	module.exports = function(it){
	  return toString.call(it).slice(8, -1);
	};

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	// false -> Array#indexOf
	// true  -> Array#includes
	var toIObject = __webpack_require__(35)
	  , toLength  = __webpack_require__(39)
	  , toIndex   = __webpack_require__(40);
	module.exports = function(IS_INCLUDES){
	  return function($this, el, fromIndex){
	    var O      = toIObject($this)
	      , length = toLength(O.length)
	      , index  = toIndex(fromIndex, length)
	      , value;
	    // Array#includes uses SameValueZero equality algorithm
	    if(IS_INCLUDES && el != el)while(length > index){
	      value = O[index++];
	      if(value != value)return true;
	    // Array#toIndex ignores holes, Array#includes - not
	    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
	      if(O[index] === el)return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(8)
	  , min       = Math.min;
	module.exports = function(it){
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(8)
	  , max       = Math.max
	  , min       = Math.min;
	module.exports = function(index, length){
	  index = toInteger(index);
	  return index < 0 ? max(index + length, 0) : min(index, length);
	};

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var shared = __webpack_require__(42)('keys')
	  , uid    = __webpack_require__(43);
	module.exports = function(key){
	  return shared[key] || (shared[key] = uid(key));
	};

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(13)
	  , SHARED = '__core-js_shared__'
	  , store  = global[SHARED] || (global[SHARED] = {});
	module.exports = function(key){
	  return store[key] || (store[key] = {});
	};

/***/ },
/* 43 */
/***/ function(module, exports) {

	var id = 0
	  , px = Math.random();
	module.exports = function(key){
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

/***/ },
/* 44 */
/***/ function(module, exports) {

	// IE 8- don't enum bug keys
	module.exports = (
	  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
	).split(',');

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(13).document && document.documentElement;

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var def = __webpack_require__(18).f
	  , has = __webpack_require__(28)
	  , TAG = __webpack_require__(47)('toStringTag');
	
	module.exports = function(it, tag, stat){
	  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
	};

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	var store      = __webpack_require__(42)('wks')
	  , uid        = __webpack_require__(43)
	  , Symbol     = __webpack_require__(13).Symbol
	  , USE_SYMBOL = typeof Symbol == 'function';
	
	var $exports = module.exports = function(name){
	  return store[name] || (store[name] =
	    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
	};
	
	$exports.store = store;

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
	var has         = __webpack_require__(28)
	  , toObject    = __webpack_require__(49)
	  , IE_PROTO    = __webpack_require__(41)('IE_PROTO')
	  , ObjectProto = Object.prototype;
	
	module.exports = Object.getPrototypeOf || function(O){
	  O = toObject(O);
	  if(has(O, IE_PROTO))return O[IE_PROTO];
	  if(typeof O.constructor == 'function' && O instanceof O.constructor){
	    return O.constructor.prototype;
	  } return O instanceof Object ? ObjectProto : null;
	};

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(9);
	module.exports = function(it){
	  return Object(defined(it));
	};

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(51);
	var global        = __webpack_require__(13)
	  , hide          = __webpack_require__(17)
	  , Iterators     = __webpack_require__(29)
	  , TO_STRING_TAG = __webpack_require__(47)('toStringTag');
	
	for(var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++){
	  var NAME       = collections[i]
	    , Collection = global[NAME]
	    , proto      = Collection && Collection.prototype;
	  if(proto && !proto[TO_STRING_TAG])hide(proto, TO_STRING_TAG, NAME);
	  Iterators[NAME] = Iterators.Array;
	}

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var addToUnscopables = __webpack_require__(52)
	  , step             = __webpack_require__(53)
	  , Iterators        = __webpack_require__(29)
	  , toIObject        = __webpack_require__(35);
	
	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	module.exports = __webpack_require__(10)(Array, 'Array', function(iterated, kind){
	  this._t = toIObject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , kind  = this._k
	    , index = this._i++;
	  if(!O || index >= O.length){
	    this._t = undefined;
	    return step(1);
	  }
	  if(kind == 'keys'  )return step(0, index);
	  if(kind == 'values')return step(0, O[index]);
	  return step(0, [index, O[index]]);
	}, 'values');
	
	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	Iterators.Arguments = Iterators.Array;
	
	addToUnscopables('keys');
	addToUnscopables('values');
	addToUnscopables('entries');

/***/ },
/* 52 */
/***/ function(module, exports) {

	module.exports = function(){ /* empty */ };

/***/ },
/* 53 */
/***/ function(module, exports) {

	module.exports = function(done, value){
	  return {value: value, done: !!done};
	};

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY            = __webpack_require__(11)
	  , global             = __webpack_require__(13)
	  , ctx                = __webpack_require__(15)
	  , classof            = __webpack_require__(55)
	  , $export            = __webpack_require__(12)
	  , isObject           = __webpack_require__(20)
	  , anObject           = __webpack_require__(19)
	  , aFunction          = __webpack_require__(16)
	  , anInstance         = __webpack_require__(56)
	  , forOf              = __webpack_require__(57)
	  , setProto           = __webpack_require__(61).set
	  , speciesConstructor = __webpack_require__(64)
	  , task               = __webpack_require__(65).set
	  , microtask          = __webpack_require__(67)()
	  , PROMISE            = 'Promise'
	  , TypeError          = global.TypeError
	  , process            = global.process
	  , $Promise           = global[PROMISE]
	  , process            = global.process
	  , isNode             = classof(process) == 'process'
	  , empty              = function(){ /* empty */ }
	  , Internal, GenericPromiseCapability, Wrapper;
	
	var USE_NATIVE = !!function(){
	  try {
	    // correct subclassing with @@species support
	    var promise     = $Promise.resolve(1)
	      , FakePromise = (promise.constructor = {})[__webpack_require__(47)('species')] = function(exec){ exec(empty, empty); };
	    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
	    return (isNode || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;
	  } catch(e){ /* empty */ }
	}();
	
	// helpers
	var sameConstructor = function(a, b){
	  // with library wrapper special case
	  return a === b || a === $Promise && b === Wrapper;
	};
	var isThenable = function(it){
	  var then;
	  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
	};
	var newPromiseCapability = function(C){
	  return sameConstructor($Promise, C)
	    ? new PromiseCapability(C)
	    : new GenericPromiseCapability(C);
	};
	var PromiseCapability = GenericPromiseCapability = function(C){
	  var resolve, reject;
	  this.promise = new C(function($$resolve, $$reject){
	    if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');
	    resolve = $$resolve;
	    reject  = $$reject;
	  });
	  this.resolve = aFunction(resolve);
	  this.reject  = aFunction(reject);
	};
	var perform = function(exec){
	  try {
	    exec();
	  } catch(e){
	    return {error: e};
	  }
	};
	var notify = function(promise, isReject){
	  if(promise._n)return;
	  promise._n = true;
	  var chain = promise._c;
	  microtask(function(){
	    var value = promise._v
	      , ok    = promise._s == 1
	      , i     = 0;
	    var run = function(reaction){
	      var handler = ok ? reaction.ok : reaction.fail
	        , resolve = reaction.resolve
	        , reject  = reaction.reject
	        , domain  = reaction.domain
	        , result, then;
	      try {
	        if(handler){
	          if(!ok){
	            if(promise._h == 2)onHandleUnhandled(promise);
	            promise._h = 1;
	          }
	          if(handler === true)result = value;
	          else {
	            if(domain)domain.enter();
	            result = handler(value);
	            if(domain)domain.exit();
	          }
	          if(result === reaction.promise){
	            reject(TypeError('Promise-chain cycle'));
	          } else if(then = isThenable(result)){
	            then.call(result, resolve, reject);
	          } else resolve(result);
	        } else reject(value);
	      } catch(e){
	        reject(e);
	      }
	    };
	    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
	    promise._c = [];
	    promise._n = false;
	    if(isReject && !promise._h)onUnhandled(promise);
	  });
	};
	var onUnhandled = function(promise){
	  task.call(global, function(){
	    var value = promise._v
	      , abrupt, handler, console;
	    if(isUnhandled(promise)){
	      abrupt = perform(function(){
	        if(isNode){
	          process.emit('unhandledRejection', value, promise);
	        } else if(handler = global.onunhandledrejection){
	          handler({promise: promise, reason: value});
	        } else if((console = global.console) && console.error){
	          console.error('Unhandled promise rejection', value);
	        }
	      });
	      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
	      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
	    } promise._a = undefined;
	    if(abrupt)throw abrupt.error;
	  });
	};
	var isUnhandled = function(promise){
	  if(promise._h == 1)return false;
	  var chain = promise._a || promise._c
	    , i     = 0
	    , reaction;
	  while(chain.length > i){
	    reaction = chain[i++];
	    if(reaction.fail || !isUnhandled(reaction.promise))return false;
	  } return true;
	};
	var onHandleUnhandled = function(promise){
	  task.call(global, function(){
	    var handler;
	    if(isNode){
	      process.emit('rejectionHandled', promise);
	    } else if(handler = global.onrejectionhandled){
	      handler({promise: promise, reason: promise._v});
	    }
	  });
	};
	var $reject = function(value){
	  var promise = this;
	  if(promise._d)return;
	  promise._d = true;
	  promise = promise._w || promise; // unwrap
	  promise._v = value;
	  promise._s = 2;
	  if(!promise._a)promise._a = promise._c.slice();
	  notify(promise, true);
	};
	var $resolve = function(value){
	  var promise = this
	    , then;
	  if(promise._d)return;
	  promise._d = true;
	  promise = promise._w || promise; // unwrap
	  try {
	    if(promise === value)throw TypeError("Promise can't be resolved itself");
	    if(then = isThenable(value)){
	      microtask(function(){
	        var wrapper = {_w: promise, _d: false}; // wrap
	        try {
	          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
	        } catch(e){
	          $reject.call(wrapper, e);
	        }
	      });
	    } else {
	      promise._v = value;
	      promise._s = 1;
	      notify(promise, false);
	    }
	  } catch(e){
	    $reject.call({_w: promise, _d: false}, e); // wrap
	  }
	};
	
	// constructor polyfill
	if(!USE_NATIVE){
	  // 25.4.3.1 Promise(executor)
	  $Promise = function Promise(executor){
	    anInstance(this, $Promise, PROMISE, '_h');
	    aFunction(executor);
	    Internal.call(this);
	    try {
	      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
	    } catch(err){
	      $reject.call(this, err);
	    }
	  };
	  Internal = function Promise(executor){
	    this._c = [];             // <- awaiting reactions
	    this._a = undefined;      // <- checked in isUnhandled reactions
	    this._s = 0;              // <- state
	    this._d = false;          // <- done
	    this._v = undefined;      // <- value
	    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
	    this._n = false;          // <- notify
	  };
	  Internal.prototype = __webpack_require__(68)($Promise.prototype, {
	    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
	    then: function then(onFulfilled, onRejected){
	      var reaction    = newPromiseCapability(speciesConstructor(this, $Promise));
	      reaction.ok     = typeof onFulfilled == 'function' ? onFulfilled : true;
	      reaction.fail   = typeof onRejected == 'function' && onRejected;
	      reaction.domain = isNode ? process.domain : undefined;
	      this._c.push(reaction);
	      if(this._a)this._a.push(reaction);
	      if(this._s)notify(this, false);
	      return reaction.promise;
	    },
	    // 25.4.5.1 Promise.prototype.catch(onRejected)
	    'catch': function(onRejected){
	      return this.then(undefined, onRejected);
	    }
	  });
	  PromiseCapability = function(){
	    var promise  = new Internal;
	    this.promise = promise;
	    this.resolve = ctx($resolve, promise, 1);
	    this.reject  = ctx($reject, promise, 1);
	  };
	}
	
	$export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: $Promise});
	__webpack_require__(46)($Promise, PROMISE);
	__webpack_require__(69)(PROMISE);
	Wrapper = __webpack_require__(14)[PROMISE];
	
	// statics
	$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
	  // 25.4.4.5 Promise.reject(r)
	  reject: function reject(r){
	    var capability = newPromiseCapability(this)
	      , $$reject   = capability.reject;
	    $$reject(r);
	    return capability.promise;
	  }
	});
	$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
	  // 25.4.4.6 Promise.resolve(x)
	  resolve: function resolve(x){
	    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
	    if(x instanceof $Promise && sameConstructor(x.constructor, this))return x;
	    var capability = newPromiseCapability(this)
	      , $$resolve  = capability.resolve;
	    $$resolve(x);
	    return capability.promise;
	  }
	});
	$export($export.S + $export.F * !(USE_NATIVE && __webpack_require__(70)(function(iter){
	  $Promise.all(iter)['catch'](empty);
	})), PROMISE, {
	  // 25.4.4.1 Promise.all(iterable)
	  all: function all(iterable){
	    var C          = this
	      , capability = newPromiseCapability(C)
	      , resolve    = capability.resolve
	      , reject     = capability.reject;
	    var abrupt = perform(function(){
	      var values    = []
	        , index     = 0
	        , remaining = 1;
	      forOf(iterable, false, function(promise){
	        var $index        = index++
	          , alreadyCalled = false;
	        values.push(undefined);
	        remaining++;
	        C.resolve(promise).then(function(value){
	          if(alreadyCalled)return;
	          alreadyCalled  = true;
	          values[$index] = value;
	          --remaining || resolve(values);
	        }, reject);
	      });
	      --remaining || resolve(values);
	    });
	    if(abrupt)reject(abrupt.error);
	    return capability.promise;
	  },
	  // 25.4.4.4 Promise.race(iterable)
	  race: function race(iterable){
	    var C          = this
	      , capability = newPromiseCapability(C)
	      , reject     = capability.reject;
	    var abrupt = perform(function(){
	      forOf(iterable, false, function(promise){
	        C.resolve(promise).then(capability.resolve, reject);
	      });
	    });
	    if(abrupt)reject(abrupt.error);
	    return capability.promise;
	  }
	});

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	// getting tag from 19.1.3.6 Object.prototype.toString()
	var cof = __webpack_require__(37)
	  , TAG = __webpack_require__(47)('toStringTag')
	  // ES3 wrong here
	  , ARG = cof(function(){ return arguments; }()) == 'Arguments';
	
	// fallback for IE11 Script Access Denied error
	var tryGet = function(it, key){
	  try {
	    return it[key];
	  } catch(e){ /* empty */ }
	};
	
	module.exports = function(it){
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
	    // builtinTag case
	    : ARG ? cof(O)
	    // ES3 arguments fallback
	    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

/***/ },
/* 56 */
/***/ function(module, exports) {

	module.exports = function(it, Constructor, name, forbiddenField){
	  if(!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)){
	    throw TypeError(name + ': incorrect invocation!');
	  } return it;
	};

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	var ctx         = __webpack_require__(15)
	  , call        = __webpack_require__(58)
	  , isArrayIter = __webpack_require__(59)
	  , anObject    = __webpack_require__(19)
	  , toLength    = __webpack_require__(39)
	  , getIterFn   = __webpack_require__(60)
	  , BREAK       = {}
	  , RETURN      = {};
	var exports = module.exports = function(iterable, entries, fn, that, ITERATOR){
	  var iterFn = ITERATOR ? function(){ return iterable; } : getIterFn(iterable)
	    , f      = ctx(fn, that, entries ? 2 : 1)
	    , index  = 0
	    , length, step, iterator, result;
	  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
	  // fast case for arrays with default iterator
	  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
	    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
	    if(result === BREAK || result === RETURN)return result;
	  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
	    result = call(iterator, f, step.value, entries);
	    if(result === BREAK || result === RETURN)return result;
	  }
	};
	exports.BREAK  = BREAK;
	exports.RETURN = RETURN;

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	// call something on iterator step with safe closing on error
	var anObject = __webpack_require__(19);
	module.exports = function(iterator, fn, value, entries){
	  try {
	    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
	  // 7.4.6 IteratorClose(iterator, completion)
	  } catch(e){
	    var ret = iterator['return'];
	    if(ret !== undefined)anObject(ret.call(iterator));
	    throw e;
	  }
	};

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	// check on default Array iterator
	var Iterators  = __webpack_require__(29)
	  , ITERATOR   = __webpack_require__(47)('iterator')
	  , ArrayProto = Array.prototype;
	
	module.exports = function(it){
	  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
	};

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(55)
	  , ITERATOR  = __webpack_require__(47)('iterator')
	  , Iterators = __webpack_require__(29);
	module.exports = __webpack_require__(14).getIteratorMethod = function(it){
	  if(it != undefined)return it[ITERATOR]
	    || it['@@iterator']
	    || Iterators[classof(it)];
	};

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	// Works with __proto__ only. Old v8 can't work with null proto objects.
	/* eslint-disable no-proto */
	var isObject = __webpack_require__(20)
	  , anObject = __webpack_require__(19);
	var check = function(O, proto){
	  anObject(O);
	  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
	};
	module.exports = {
	  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
	    function(test, buggy, set){
	      try {
	        set = __webpack_require__(15)(Function.call, __webpack_require__(62).f(Object.prototype, '__proto__').set, 2);
	        set(test, []);
	        buggy = !(test instanceof Array);
	      } catch(e){ buggy = true; }
	      return function setPrototypeOf(O, proto){
	        check(O, proto);
	        if(buggy)O.__proto__ = proto;
	        else set(O, proto);
	        return O;
	      };
	    }({}, false) : undefined),
	  check: check
	};

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	var pIE            = __webpack_require__(63)
	  , createDesc     = __webpack_require__(26)
	  , toIObject      = __webpack_require__(35)
	  , toPrimitive    = __webpack_require__(25)
	  , has            = __webpack_require__(28)
	  , IE8_DOM_DEFINE = __webpack_require__(21)
	  , gOPD           = Object.getOwnPropertyDescriptor;
	
	exports.f = __webpack_require__(22) ? gOPD : function getOwnPropertyDescriptor(O, P){
	  O = toIObject(O);
	  P = toPrimitive(P, true);
	  if(IE8_DOM_DEFINE)try {
	    return gOPD(O, P);
	  } catch(e){ /* empty */ }
	  if(has(O, P))return createDesc(!pIE.f.call(O, P), O[P]);
	};

/***/ },
/* 63 */
/***/ function(module, exports) {

	exports.f = {}.propertyIsEnumerable;

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	// 7.3.20 SpeciesConstructor(O, defaultConstructor)
	var anObject  = __webpack_require__(19)
	  , aFunction = __webpack_require__(16)
	  , SPECIES   = __webpack_require__(47)('species');
	module.exports = function(O, D){
	  var C = anObject(O).constructor, S;
	  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
	};

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	var ctx                = __webpack_require__(15)
	  , invoke             = __webpack_require__(66)
	  , html               = __webpack_require__(45)
	  , cel                = __webpack_require__(24)
	  , global             = __webpack_require__(13)
	  , process            = global.process
	  , setTask            = global.setImmediate
	  , clearTask          = global.clearImmediate
	  , MessageChannel     = global.MessageChannel
	  , counter            = 0
	  , queue              = {}
	  , ONREADYSTATECHANGE = 'onreadystatechange'
	  , defer, channel, port;
	var run = function(){
	  var id = +this;
	  if(queue.hasOwnProperty(id)){
	    var fn = queue[id];
	    delete queue[id];
	    fn();
	  }
	};
	var listener = function(event){
	  run.call(event.data);
	};
	// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
	if(!setTask || !clearTask){
	  setTask = function setImmediate(fn){
	    var args = [], i = 1;
	    while(arguments.length > i)args.push(arguments[i++]);
	    queue[++counter] = function(){
	      invoke(typeof fn == 'function' ? fn : Function(fn), args);
	    };
	    defer(counter);
	    return counter;
	  };
	  clearTask = function clearImmediate(id){
	    delete queue[id];
	  };
	  // Node.js 0.8-
	  if(__webpack_require__(37)(process) == 'process'){
	    defer = function(id){
	      process.nextTick(ctx(run, id, 1));
	    };
	  // Browsers with MessageChannel, includes WebWorkers
	  } else if(MessageChannel){
	    channel = new MessageChannel;
	    port    = channel.port2;
	    channel.port1.onmessage = listener;
	    defer = ctx(port.postMessage, port, 1);
	  // Browsers with postMessage, skip WebWorkers
	  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
	  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
	    defer = function(id){
	      global.postMessage(id + '', '*');
	    };
	    global.addEventListener('message', listener, false);
	  // IE8-
	  } else if(ONREADYSTATECHANGE in cel('script')){
	    defer = function(id){
	      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
	        html.removeChild(this);
	        run.call(id);
	      };
	    };
	  // Rest old browsers
	  } else {
	    defer = function(id){
	      setTimeout(ctx(run, id, 1), 0);
	    };
	  }
	}
	module.exports = {
	  set:   setTask,
	  clear: clearTask
	};

/***/ },
/* 66 */
/***/ function(module, exports) {

	// fast apply, http://jsperf.lnkit.com/fast-apply/5
	module.exports = function(fn, args, that){
	  var un = that === undefined;
	  switch(args.length){
	    case 0: return un ? fn()
	                      : fn.call(that);
	    case 1: return un ? fn(args[0])
	                      : fn.call(that, args[0]);
	    case 2: return un ? fn(args[0], args[1])
	                      : fn.call(that, args[0], args[1]);
	    case 3: return un ? fn(args[0], args[1], args[2])
	                      : fn.call(that, args[0], args[1], args[2]);
	    case 4: return un ? fn(args[0], args[1], args[2], args[3])
	                      : fn.call(that, args[0], args[1], args[2], args[3]);
	  } return              fn.apply(that, args);
	};

/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(13)
	  , macrotask = __webpack_require__(65).set
	  , Observer  = global.MutationObserver || global.WebKitMutationObserver
	  , process   = global.process
	  , Promise   = global.Promise
	  , isNode    = __webpack_require__(37)(process) == 'process';
	
	module.exports = function(){
	  var head, last, notify;
	
	  var flush = function(){
	    var parent, fn;
	    if(isNode && (parent = process.domain))parent.exit();
	    while(head){
	      fn   = head.fn;
	      head = head.next;
	      try {
	        fn();
	      } catch(e){
	        if(head)notify();
	        else last = undefined;
	        throw e;
	      }
	    } last = undefined;
	    if(parent)parent.enter();
	  };
	
	  // Node.js
	  if(isNode){
	    notify = function(){
	      process.nextTick(flush);
	    };
	  // browsers with MutationObserver
	  } else if(Observer){
	    var toggle = true
	      , node   = document.createTextNode('');
	    new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
	    notify = function(){
	      node.data = toggle = !toggle;
	    };
	  // environments with maybe non-completely correct, but existent Promise
	  } else if(Promise && Promise.resolve){
	    var promise = Promise.resolve();
	    notify = function(){
	      promise.then(flush);
	    };
	  // for other environments - macrotask based on:
	  // - setImmediate
	  // - MessageChannel
	  // - window.postMessag
	  // - onreadystatechange
	  // - setTimeout
	  } else {
	    notify = function(){
	      // strange IE + webpack dev server bug - use .call(global)
	      macrotask.call(global, flush);
	    };
	  }
	
	  return function(fn){
	    var task = {fn: fn, next: undefined};
	    if(last)last.next = task;
	    if(!head){
	      head = task;
	      notify();
	    } last = task;
	  };
	};

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var hide = __webpack_require__(17);
	module.exports = function(target, src, safe){
	  for(var key in src){
	    if(safe && target[key])target[key] = src[key];
	    else hide(target, key, src[key]);
	  } return target;
	};

/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var global      = __webpack_require__(13)
	  , core        = __webpack_require__(14)
	  , dP          = __webpack_require__(18)
	  , DESCRIPTORS = __webpack_require__(22)
	  , SPECIES     = __webpack_require__(47)('species');
	
	module.exports = function(KEY){
	  var C = typeof core[KEY] == 'function' ? core[KEY] : global[KEY];
	  if(DESCRIPTORS && C && !C[SPECIES])dP.f(C, SPECIES, {
	    configurable: true,
	    get: function(){ return this; }
	  });
	};

/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	var ITERATOR     = __webpack_require__(47)('iterator')
	  , SAFE_CLOSING = false;
	
	try {
	  var riter = [7][ITERATOR]();
	  riter['return'] = function(){ SAFE_CLOSING = true; };
	  Array.from(riter, function(){ throw 2; });
	} catch(e){ /* empty */ }
	
	module.exports = function(exec, skipClosing){
	  if(!skipClosing && !SAFE_CLOSING)return false;
	  var safe = false;
	  try {
	    var arr  = [7]
	      , iter = arr[ITERATOR]();
	    iter.next = function(){ return {done: safe = true}; };
	    arr[ITERATOR] = function(){ return iter; };
	    exec(arr);
	  } catch(e){ /* empty */ }
	  return safe;
	};

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	// resolves . and .. elements in a path array with directory names there
	// must be no slashes, empty elements, or device names (c:\) in the array
	// (so also no leading and trailing slashes - it does not distinguish
	// relative and absolute paths)
	function normalizeArray(parts, allowAboveRoot) {
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = parts.length - 1; i >= 0; i--) {
	    var last = parts[i];
	    if (last === '.') {
	      parts.splice(i, 1);
	    } else if (last === '..') {
	      parts.splice(i, 1);
	      up++;
	    } else if (up) {
	      parts.splice(i, 1);
	      up--;
	    }
	  }
	
	  // if the path is allowed to go above the root, restore leading ..s
	  if (allowAboveRoot) {
	    for (; up--; up) {
	      parts.unshift('..');
	    }
	  }
	
	  return parts;
	}
	
	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	var splitPath = function(filename) {
	  return splitPathRe.exec(filename).slice(1);
	};
	
	// path.resolve([from ...], to)
	// posix version
	exports.resolve = function() {
	  var resolvedPath = '',
	      resolvedAbsolute = false;
	
	  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	    var path = (i >= 0) ? arguments[i] : process.cwd();
	
	    // Skip empty and invalid entries
	    if (typeof path !== 'string') {
	      throw new TypeError('Arguments to path.resolve must be strings');
	    } else if (!path) {
	      continue;
	    }
	
	    resolvedPath = path + '/' + resolvedPath;
	    resolvedAbsolute = path.charAt(0) === '/';
	  }
	
	  // At this point the path should be resolved to a full absolute path, but
	  // handle relative paths to be safe (might happen when process.cwd() fails)
	
	  // Normalize the path
	  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
	    return !!p;
	  }), !resolvedAbsolute).join('/');
	
	  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	};
	
	// path.normalize(path)
	// posix version
	exports.normalize = function(path) {
	  var isAbsolute = exports.isAbsolute(path),
	      trailingSlash = substr(path, -1) === '/';
	
	  // Normalize the path
	  path = normalizeArray(filter(path.split('/'), function(p) {
	    return !!p;
	  }), !isAbsolute).join('/');
	
	  if (!path && !isAbsolute) {
	    path = '.';
	  }
	  if (path && trailingSlash) {
	    path += '/';
	  }
	
	  return (isAbsolute ? '/' : '') + path;
	};
	
	// posix version
	exports.isAbsolute = function(path) {
	  return path.charAt(0) === '/';
	};
	
	// posix version
	exports.join = function() {
	  var paths = Array.prototype.slice.call(arguments, 0);
	  return exports.normalize(filter(paths, function(p, index) {
	    if (typeof p !== 'string') {
	      throw new TypeError('Arguments to path.join must be strings');
	    }
	    return p;
	  }).join('/'));
	};
	
	
	// path.relative(from, to)
	// posix version
	exports.relative = function(from, to) {
	  from = exports.resolve(from).substr(1);
	  to = exports.resolve(to).substr(1);
	
	  function trim(arr) {
	    var start = 0;
	    for (; start < arr.length; start++) {
	      if (arr[start] !== '') break;
	    }
	
	    var end = arr.length - 1;
	    for (; end >= 0; end--) {
	      if (arr[end] !== '') break;
	    }
	
	    if (start > end) return [];
	    return arr.slice(start, end - start + 1);
	  }
	
	  var fromParts = trim(from.split('/'));
	  var toParts = trim(to.split('/'));
	
	  var length = Math.min(fromParts.length, toParts.length);
	  var samePartsLength = length;
	  for (var i = 0; i < length; i++) {
	    if (fromParts[i] !== toParts[i]) {
	      samePartsLength = i;
	      break;
	    }
	  }
	
	  var outputParts = [];
	  for (var i = samePartsLength; i < fromParts.length; i++) {
	    outputParts.push('..');
	  }
	
	  outputParts = outputParts.concat(toParts.slice(samePartsLength));
	
	  return outputParts.join('/');
	};
	
	exports.sep = '/';
	exports.delimiter = ':';
	
	exports.dirname = function(path) {
	  var result = splitPath(path),
	      root = result[0],
	      dir = result[1];
	
	  if (!root && !dir) {
	    // No dirname whatsoever
	    return '.';
	  }
	
	  if (dir) {
	    // It has a dirname, strip trailing slash
	    dir = dir.substr(0, dir.length - 1);
	  }
	
	  return root + dir;
	};
	
	
	exports.basename = function(path, ext) {
	  var f = splitPath(path)[2];
	  // TODO: make this comparison case-insensitive on windows?
	  if (ext && f.substr(-1 * ext.length) === ext) {
	    f = f.substr(0, f.length - ext.length);
	  }
	  return f;
	};
	
	
	exports.extname = function(path) {
	  return splitPath(path)[3];
	};
	
	function filter (xs, f) {
	    if (xs.filter) return xs.filter(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        if (f(xs[i], i, xs)) res.push(xs[i]);
	    }
	    return res;
	}
	
	// String.prototype.substr - negative index don't work in IE8
	var substr = 'ab'.substr(-1) === 'b'
	    ? function (str, start, len) { return str.substr(start, len) }
	    : function (str, start, len) {
	        if (start < 0) start = str.length + start;
	        return str.substr(start, len);
	    }
	;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(72)))

/***/ },
/* 72 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	(function () {
	  try {
	    cachedSetTimeout = setTimeout;
	  } catch (e) {
	    cachedSetTimeout = function () {
	      throw new Error('setTimeout is not defined');
	    }
	  }
	  try {
	    cachedClearTimeout = clearTimeout;
	  } catch (e) {
	    cachedClearTimeout = function () {
	      throw new Error('clearTimeout is not defined');
	    }
	  }
	} ())
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = cachedSetTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    cachedClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        cachedSetTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', { value: true });
	
	function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }
	
	var _slicedToArray = _interopDefault(__webpack_require__(74));
	var _asyncToGenerator = _interopDefault(__webpack_require__(2));
	var _toArray = _interopDefault(__webpack_require__(81));
	
	function normalize(path) {
	  let source = path.split(/\/+/);
	  let target = [];
	
	  for (let token of source) {
	    if (token === '..') {
	      target.pop();
	    } else if (token !== '' && token !== '.') {
	      target.push(token);
	    }
	  }
	
	  if (path.charAt(0) === '/') return '/' + target.join('/');else return target.join('/');
	}
	
	var db = null;
	
	function openDatabase() {
	  return new Promise(function (resolve, reject) {
	    if (db) {
	      resolve(db);
	      return;
	    }
	
	    var openreq = indexedDB.open(focalStorage.settings.name, focalStorage.settings.version);
	
	    openreq.onsuccess = function () {
	      db = openreq.result;
	      resolve(db);
	    };
	
	    openreq.onupgradeneeded = function () {
	      openreq.result.createObjectStore(focalStorage.settings.storeName);
	    };
	
	    openreq.onerror = function () {
	      reject(openreq.error);
	    };
	  });
	}
	
	function openStore(type) {
	  return openDatabase().then(function () {
	    var transaction = db.transaction(focalStorage.settings.storeName, type);
	
	    return transaction.objectStore(focalStorage.settings.storeName);
	  });
	}
	
	function openTransaction(type) {
	  return openDatabase().then(function () {
	    return db.transaction(focalStorage.settings.storeName, type);
	  });
	}
	
	function getItem(key) {
	  return new Promise(function (resolve, reject) {
	    return openStore('readonly').then(function (store) {
	      var req = store.get(key);
	
	      req.onsuccess = function () {
	        var value = req.result;
	        if (value === undefined) {
	          value = null;
	        }
	
	        resolve(value);
	      };
	
	      req.onerror = function () {
	        reject(req.error);
	      };
	    }).catch(reject);
	  });
	}
	
	function setItem(key, value) {
	  return new Promise(function (resolve, reject) {
	    return openTransaction('readwrite').then(function (transaction) {
	
	      var store = transaction.objectStore(focalStorage.settings.storeName);
	
	      if (typeof key !== 'string') {
	        console.warn(key + ' used as a key, but it is not a string');
	        key = String(key);
	      }
	
	      if (value === null) {
	        value = undefined;
	      }
	
	      var req = store.put(value, key);
	
	      transaction.oncomplete = function () {
	        if (value === undefined) {
	          value = null;
	        }
	
	        resolve(value);
	      };
	
	      transaction.onabort = transaction.onerror = function () {
	        reject(req.error ? req.error : req.transaction.error);
	      };
	    }).catch(reject);
	  });
	}
	
	function removeItem(key) {
	  return new Promise(function (resolve, reject) {
	    return openTransaction('readwrite').then(function (transaction) {
	      var store = transaction.objectStore(focalStorage.settings.storeName);
	
	      if (typeof key !== 'string') {
	        console.warn(key + ' used as a key, but it is not a string');
	        key = String(key);
	      }
	
	      var req = store.delete(key);
	
	      transaction.oncomplete = function () {
	        resolve();
	      };
	
	      transaction.onerror = function () {
	        reject(req.error);
	      };
	
	      transaction.onabort = function () {
	        reject(req.error ? req.error : req.transaction.error);
	      };
	    }).catch(reject);
	  });
	}
	
	function clear() {
	  return new Promise(function (resolve, reject) {
	    return openTransaction('readwrite').then(function (transaction) {
	      var store = transaction.objectStore(focalStorage.settings.storeName);
	
	      var req = store.clear();
	
	      transaction.oncomplete = function () {
	        resolve();
	      };
	
	      transaction.onabort = transaction.onerror = function () {
	        reject(req.error ? req.error : req.transaction.error);
	      };
	    }).catch(reject);
	  });
	}
	
	function length(callback) {
	  return new Promise(function (resolve, reject) {
	    openStore('readonly').then(function (store) {
	      var req = store.count();
	
	      req.onsuccess = function () {
	        resolve(req.result);
	      };
	
	      req.onerror = function () {
	        reject(req.error);
	      };
	    }).catch(reject);
	  });
	}
	
	function key(n) {
	  return new Promise(function (resolve, reject) {
	    if (n < 0) {
	      resolve(null);
	      return;
	    }
	
	    return openStore('readonly').then(function (store) {
	      var advanced = false;
	      var req = store.openCursor();
	
	      req.onsuccess = function () {
	        var cursor = req.result;
	
	        if (!cursor) {
	          resolve(null);
	          return;
	        }
	
	        if (n === 0) {
	          resolve(cursor.key);
	        } else {
	          if (!advanced) {
	            advanced = true;
	            cursor.advance(n);
	          } else {
	            resolve(cursor.key);
	          }
	        }
	      };
	
	      req.onerror = function () {
	        reject(req.error);
	      };
	    }).catch(reject);
	  });
	}
	
	function keys() {
	  return new Promise(function (resolve, reject) {
	    return openStore('readonly').then(function (store) {
	      var req = store.openCursor();
	      var keys = [];
	
	      req.onsuccess = function () {
	        var cursor = req.result;
	
	        if (!cursor) {
	          resolve(keys);
	          return;
	        }
	
	        keys.push(cursor.key);
	        cursor.continue();
	      };
	
	      req.onerror = function () {
	        reject(req.error);
	      };
	    }).catch(reject);
	  });
	}
	
	var focalStorage = {
	  INDEXEDDB: 0,
	  LOCALSTORAGE: 1,
	  getItem: getItem,
	  setItem: setItem,
	  removeItem: removeItem,
	  clear: clear,
	  length: length,
	  key: key,
	  keys: keys
	};
	
	var DEFAULT_SETTINGS = {
	  driver: focalStorage.indexedDB,
	  name: 'focalStorage',
	  version: 1,
	  storeName: 'keyvaluepairs'
	};
	
	focalStorage.settings = DEFAULT_SETTINGS;
	
	let Base = class Base {
	  constructor(name, path, options) {
	    this.path = path;
	    this.name = name;
	    this.options = options;
	  }
	
	  stat(path) {
	    throw new StatNotFoundError();
	  }
	
	  read(path) {
	    throw new FileNotFoundError$1();
	  }
	
	  write(path, content) {
	    return Promise.resolve(new Response(null, { status: 405 }));
	  }
	};
	
	let Stat = class Stat {
	  constructor(isDirectory, contents, allowed) {
	    this.isDirectory = isDirectory;
	    this.contents = contents;
	    this.allowed = allowed;
	  }
	
	  toResponse() {
	    return new Response(this.contentToJson(), {
	      status: 200,
	      headers: { 'Allow': this.allowedToHeader() }
	    });
	  }
	
	  allowedToHeader() {
	    return this.allowed.toString();
	  }
	
	  contentToJson() {
	    if (this.isDirectory) {
	      return JSON.stringify({
	        type: 'directory',
	        contents: this.contents
	      }, null, '\t');
	    }
	    return JSON.stringify(this.contents, null, '\t');
	  }
	};
	
	let StatNotFoundError = class StatNotFoundError extends Error {
	  constructor(message = 'No stat available for given path.') {
	    super(message);
	    this.name = 'StatNotFoundError';
	  }
	};
	
	let File$1 = class File {
	  constructor(blob) {
	    this.blob = blob;
	  }
	
	  toResponse() {
	    return new Response(this.blob, {
	      status: 200 });
	  }
	};
	
	let FileNotFoundError$1 = class FileNotFoundError extends Error {
	  constructor(message = 'No file available for given path.') {
	    super(message);
	    this.name = 'FileNotFoundError';
	  }
	};
	
	let IsDirectoryError = class IsDirectoryError extends Error {
	  constructor(message = 'The requested file is a directory.') {
	    super(message);
	    this.name = 'IsDirectoryError';
	  }
	};
	
	let Filesystem = class Filesystem {
	  constructor() {
	    this.mounts = new Map();
	    this.reqcount = 0;
	  }
	
	  mount(path, type, ...args) {
	    path = normalize(path);
	    this.mounts.set(path, new type(path, ...args));
	  }
	
	  umount(path) {
	    path = normalize(path);
	    this.mounts.delete(path);
	  }
	
	  handle(request, url) {
	    var _this = this;
	
	    return _asyncToGenerator(function* () {
	      let path = normalize(url.pathname),
	          base = undefined,
	          fs = undefined;
	
	      for (let _ref of _this.mounts) {
	        var _ref2 = _slicedToArray(_ref, 2);
	
	        let mount = _ref2[0];
	        let fsys = _ref2[1];
	
	        if (path.startsWith(mount) && (typeof base === 'undefined' || mount.length > base.length)) {
	          fs = fsys;
	          base = mount;
	        }
	      }
	
	      if (typeof base === 'undefined') {
	        return new Response(null, { status: 400 });
	      }
	
	      path = path.substring(base.length);
	
	      _this.reqcount++;
	
	      if (request.method === 'GET') {
	        try {
	          let read_resp = yield fs.read(path, request);
	          if (read_resp instanceof File$1) return read_resp.toResponse();
	          return read_resp;
	        } catch (e) {
	          if (e.name === 'IsDirectoryError') {
	            return new Response(null, {
	              status: 405,
	              statusText: 'EISDIR',
	              headers: { 'Allow': 'OPTIONS' }
	            });
	          }
	
	          return new Response(null, { status: 405 });
	        }
	      }
	
	      if (request.method === 'PUT') return fs.write(path, request.text(), request);
	
	      if (request.method === 'OPTIONS') {
	        try {
	          let stat_resp = yield fs.stat(path, request);
	          if (stat_resp instanceof Stat) return stat_resp.toResponse();
	          return stat_resp;
	        } catch (e) {
	          return new Response(null, { status: 405 });
	        }
	      }
	
	      return new Response(null, { status: 400 });
	    })();
	  }
	
	  mountsAsJso() {
	    let jso = [];
	    for (let _ref3 of this.mounts) {
	      var _ref4 = _slicedToArray(_ref3, 2);
	
	      let path = _ref4[0];
	      let mount = _ref4[1];
	
	      jso.push({
	        path: path,
	        name: mount.name,
	        options: mount.options
	      });
	    }
	    return jso;
	  }
	
	  persistMounts() {
	    var mounts = this.mountsAsJso();
	    console.log("persist mounts: " + mounts);
	    focalStorage.setItem("lively4mounts", mounts);
	  }
	
	  loadMounts() {
	    var _this2 = this;
	
	    return _asyncToGenerator(function* () {
	      let mounts = yield focalStorage.getItem("lively4mounts");
	      try {
	        for (let mount of mounts) {
	          let fs = yield System.import('src/swx/fs/' + mount.name + '.js');
	          _this2.mount(mount.path, fs.default, mount.options);
	        }
	      } catch (e) {
	        console.error(e);
	      }
	    })();
	  }
	};
	
	var tasks = [];
	
	function process(event) {
	  return tasks.some(task => task.match(event) && task.fn(event));
	}
	
	let Filesystem$1 = class Filesystem extends Base {
	  constructor(path, options) {
	    super('sys', path, options);
	
	    let name = path.split(/\/+/);
	    name = name[name.length - 1];
	
	    this.tree = new SysDir(name, [new SysFile('mounts', function () {
	      return instance().filesystem.mountsAsJso();
	    }), new SysDir('swx', [new SysFile('reqcount', function () {
	      return instance().filesystem.reqcount;
	    }), new SysFile('reload', null, function () {
	      self.__reload__({ force: true });
	      return "";
	    })]), new SysDir('fs', [new SysFile('mount', null, this._sysFsMount.bind(this)), new SysFile('umount', null, this._sysFsUmount.bind(this))])]);
	  }
	
	  _sysFsMount(content) {
	    return _asyncToGenerator(function* () {
	      let json = JSON.parse((yield content));
	
	      let path = json['path'];
	      let name = json['name'];
	      let opts = json['options'] || {};
	
	      if (!path) throw new Error('<path> is missing');
	
	      if (!name) throw new Error('<name> is missing');
	
	      let fs = yield System.import('src/swx/fs/' + name + '.js');
	
	      instance().filesystem.mount(path, fs.default, opts);
	
	      instance().filesystem.persistMounts();
	
	      return json;
	    })();
	  }
	
	  _sysFsUmount(content) {
	    return _asyncToGenerator(function* () {
	      let json = JSON.parse((yield content));
	      let path = json['path'];
	
	      if (!path) throw new Error('<path> is missing');
	
	      instance().filesystem.umount(path);
	
	      return json;
	    })();
	  }
	
	  resolve(path) {
	    return this.tree.resolve(path.substring(1));
	  }
	
	  stat(path) {
	    var _this = this;
	
	    return _asyncToGenerator(function* () {
	      let node = yield _this.resolve(path);
	      return node.stat();
	    })();
	  }
	
	  read(path) {
	    var _this2 = this;
	
	    return _asyncToGenerator(function* () {
	      let node = yield _this2.resolve(path);
	      return node.read();
	    })();
	  }
	
	  write(path, content) {
	    var _this3 = this;
	
	    return _asyncToGenerator(function* () {
	      let node = yield _this3.resolve(path);
	      return node.write(content);
	    })();
	  }
	};
	let Inode = class Inode {
	  constructor(name) {
	    this.name = name;
	  }
	
	  read() {
	    var _this4 = this;
	
	    return _asyncToGenerator(function* () {
	      return _this4._notImplemented();
	    })();
	  }
	
	  write() {
	    var _this5 = this;
	
	    return _asyncToGenerator(function* () {
	      return _this5._notImplemented();
	    })();
	  }
	
	  statinfo() {
	    return _asyncToGenerator(function* () {
	      throw Error("Not implemented but required");
	    })();
	  }
	
	  stat(...args) {
	    var _this6 = this;
	
	    return _asyncToGenerator(function* () {
	      let info = yield _this6.statinfo();
	
	      let headers = new Headers();
	      headers.append('Allow', 'OPTIONS');
	
	      if (_this6.access().read) headers.append('Allow', 'GET');
	      if (_this6.access().write) headers.append('Allow', 'PUT');
	
	      let body = JSON.stringify(info, null, '\t');
	      return new Response(body);
	    })();
	  }
	
	  access() {
	    return _asyncToGenerator(function* () {
	      return { read: false, write: false };
	    })();
	  }
	
	  _notImplemented() {
	    let headers = new Headers();
	    headers.append('Allow', 'OPTIONS');
	
	    if (this.access().read) headers.append('Allow', 'GET');
	    if (this.access().write) headers.append('Allow', 'PUT');
	
	    let response = new Response(null, {
	      status: 405,
	      headers: headers
	    });
	
	    return response;
	  }
	};
	let Directory = class Directory extends Inode {
	  statinfo({ contents = true } = {}) {
	    var _this7 = this;
	
	    return _asyncToGenerator(function* () {
	      let info = {
	        type: 'directory',
	        name: _this7.name
	      };
	
	      if (contents) {
	        let children = yield _this7.children();
	        let contents = yield Promise.all(Array.from(children, function (_) {
	          return _.statinfo({ contents: false });
	        }));
	
	        Object.assign(info, { contents: contents });
	      }
	
	      return info;
	    })();
	  }
	};
	let File$2 = class File extends Inode {
	  statinfo() {
	    var _this8 = this;
	
	    return _asyncToGenerator(function* () {
	      return {
	        type: 'file',
	        name: _this8.name
	      };
	    })();
	  }
	};
	let SysDir = class SysDir extends Directory {
	  constructor(name, children) {
	    super(name);
	    this._children = children;
	  }
	
	  children() {
	    var _this9 = this;
	
	    return _asyncToGenerator(function* () {
	      if (typeof _this9._children === 'function') {
	        return _this9._children();
	      } else {
	        return _this9._children;
	      }
	    })();
	  }
	
	  resolve(path) {
	    var _this10 = this;
	
	    return _asyncToGenerator(function* () {
	      if (path.length == 0) return _this10;
	
	      var _ref = typeof path === 'string' ? path.split(/\/+/) : path;
	
	      var _ref2 = _toArray(_ref);
	
	      let name = _ref2[0];
	
	      let rest = _ref2.slice(1);
	
	      if (name === '') return _this10;
	
	      let children = yield _this10.children();
	      let node = children.find(function (child) {
	        return child.name === name;
	      });
	
	      if (rest.length > 0) {
	        if (node instanceof SysDir) {
	          return node.resolve(rest);
	        } else {
	          throw new Error('ENOTDIR');
	        }
	      } else if (node) {
	        return node;
	      } else {
	        throw new Error('ENOTFOUND');
	      }
	    })();
	  }
	};
	let SysFile = class SysFile extends File$2 {
	  constructor(name, rfn, wfn) {
	    super(name);
	
	    this.rfn = rfn;
	    this.wfn = wfn;
	  }
	
	  access() {
	    return {
	      read: typeof this.rfn === 'function',
	      write: typeof this.wfn === 'function'
	    };
	  }
	
	  read() {
	    var _this11 = this;
	
	    return _asyncToGenerator(function* () {
	      if (typeof _this11.rfn === 'function') {
	        let json = yield _this11.rfn();
	        let content = JSON.stringify(json, null, '\t');
	        let response = new Response(content);
	
	        return response;
	      } else {
	        return File$2.prototype.read.call(_this11);
	      }
	    })();
	  }
	
	  write(blob) {
	    var _this12 = this;
	
	    return _asyncToGenerator(function* () {
	      if (typeof _this12.wfn === 'function') {
	        try {
	          let json = yield _this12.wfn(blob);
	          let content = JSON.stringify(json, null, '\t');
	          let response = new Response(content);
	
	          return response;
	        } catch (err) {
	          let message = err.toString();
	          let content = JSON.stringify(message, null, '\t');
	          let response = new Response(content, { status: 400, statusText: message });
	
	          console.error(err);
	
	          return response;
	        }
	      } else {
	        return File$2.prototype.write.call(_this12, blob);
	      }
	    })();
	  }
	};
	
	let Filesystem$2 = class Filesystem extends Base {
	  constructor(path, options) {
	    super('http', path, options);
	
	    if (!options.base) throw new Error('Option `base` required.');
	
	    this.base = options.base;
	  }
	
	  read(path, request, no_cache = false) {
	    var _this = this;
	
	    return _asyncToGenerator(function* () {
	      let f_request = yield _this.createProxyRequest(path, request);
	
	      let response = undefined;
	
	      if (!no_cache) {
	        if (navigator.onLine) {
	          response = yield cache.match(f_request, 5 * 60 * 1000);
	        } else {
	          response = yield cache.match(f_request);
	        }
	      } else {
	        cache.purge(f_request);
	      }
	
	      if (response === undefined) {
	        response = yield self.fetch(f_request);
	        cache.put(f_request, response);
	        response = response.clone();
	      }
	
	      return response;
	    })();
	  }
	
	  write(path, content, request) {
	    var _this2 = this;
	
	    return _asyncToGenerator(function* () {
	      return fetch((yield _this2.createProxyRequest(path, request, content)));
	    })();
	  }
	
	  stat(path, request, no_cache = false) {
	    var _this3 = this;
	
	    return _asyncToGenerator(function* () {
	      let f_request = yield _this3.createProxyRequest(path, request);
	
	      let response = undefined;
	
	      if (!no_cache) {
	        if (navigator.onLine) {
	          response = yield cache.match(f_request, 5 * 60 * 1000);
	        } else {
	          response = yield cache.match(f_request);
	        }
	      } else {
	        cache.purge(f_request);
	      }
	
	      if (response === undefined) {
	        response = yield self.fetch(f_request);
	        cache.put(f_request, response);
	        response = response.clone();
	      }
	
	      return response;
	    })();
	  }
	
	  createProxyRequest(path, request, content) {
	    var _this4 = this;
	
	    return _asyncToGenerator(function* () {
	      let init = {
	        mode: request.mode,
	        cache: request.cache,
	        method: request.method,
	        headers: request.headers,
	        redirect: request.redirect,
	        referrer: request.referrer,
	        credentials: request.credentials
	      };
	
	      if (request.method !== 'HEAD' && request.method !== 'GET' && typeof content !== 'undefined') {
	        init.body = yield content;
	      }
	
	      return new Request(_this4.base + '/' + path, init);
	    })();
	  }
	};
	
	let Filesystem$3 = class Filesystem extends Base {
	  constructor(path, options) {
	    super('html5', path, options);
	  }
	
	  read(file) {
	    return this._rpc({ name: 'swx:readFile', file: file }).then(event => event.data.content);
	  }
	
	  write(file, content) {
	    return content.then((actualContent => {
	      return this._rpc({
	        name: 'swx:writeFile',
	        file: file,
	        content: actualContent
	      }).then(event => event.data.content);
	    }).bind(this));
	  }
	
	  _rpc(data) {
	    return new Promise((resolve, reject) => {
	      console.log('RPC request:', data);
	      self.clients.matchAll().then(clients => {
	        let channel = new MessageChannel();
	        let client = clients[0];
	
	        channel.port1.onmessage = resolve;
	        client.postMessage(data, [channel.port2]);
	      });
	    }).then(event => {
	      console.log('RPC response:', event.data);
	      return event;
	    }).then(event => {
	      if (event.data.error) {
	        throw new Error(event.data.error);
	      } else {
	        return event;
	      }
	    });
	  }
	};
	
	function responseOk(response, throwError = Error) {
	  if (response.status >= 200 && response.status < 300) {
	    return response;
	  } else {
	    throw new throwError(response.statusText);
	  }
	}
	
	function open(cache_name) {
	  return caches.open(cache_name);
	}
	
	function put(request, response) {
	  let blob_text = [Date.now().toString()];
	  let blob_type = { type: 'text/html' };
	  let blob = new Blob(blob_text, blob_type);
	  let resp = new Response(blob);
	  open('lively4-cache-line-ages').then(cache => cache.put(request, resp));
	  return open('lively4').then(cache => cache.put(request, response));
	}
	
	function purge(request) {
	  open('lively4-cache-line-ages').then(cache => cache.delete(request));
	  return open('lively4').then(cache => cache.delete(request));
	}
	
	let match = (() => {
	  var _ref = _asyncToGenerator(function* (request, timeout = -1) {
	    if (timeout != -1) {
	      let age = yield getAgeOf(request);
	      console.log(age);
	      let age_v = yield age.text();
	      if (age && Date.now() - parseInt(age_v) >= timeout) {
	        purge(request);
	        return Promise.resolve(undefined);
	      }
	    }
	    return open('lively4').then(function (cache) {
	      return cache.match(request);
	    });
	  });
	
	  return function match(_x, _x2) {
	    return _ref.apply(this, arguments);
	  };
	})();
	
	function getAgeOf(request) {
	  return open('lively4-cache-line-ages').then(cache => cache.match(request));
	}
	
	let Filesystem$4 = class Filesystem extends Base {
	  constructor(path, options) {
	    super('github', path, options);
	
	    if (!options.repo && options.base) options.repo = options.base;
	
	    if (options.repo) {
	      this.repo = options.repo;
	    } else {
	      throw new Error("[github] repo option required");
	    }
	
	    if (options.token) {
	      this.token = options.token;
	    }
	
	    if (options.branch) {
	      this.branch = options.branch;
	    }
	  }
	
	  statinfo(json) {
	    return _asyncToGenerator(function* () {
	      delete json['content'];
	      delete json['encoding'];
	
	      let type = 'file';
	
	      if (json['type'] === 'dir') type = 'directory';
	
	      return {
	        type: type,
	        name: json['name'],
	        size: json['size']
	      };
	    })();
	  }
	
	  stat(path, unused_request, no_cache = false) {
	    var _this = this;
	
	    return _asyncToGenerator(function* () {
	      let githubHeaders = new Headers();
	      if (_this.token) {
	        githubHeaders.append('Authorization', 'token ' + _this.token);
	      }
	
	      let branchParam = '';
	      if (_this.branch) {
	        branchParam = '?ref=' + _this.branch;
	      }
	
	      let request = new Request('https://api.github.com/repos/' + _this.repo + '/contents/' + path + branchParam, { headers: githubHeaders });
	
	      let response = undefined;
	
	      if (!no_cache) {
	        if (navigator.onLine) {
	          response = yield match(request, 5 * 60 * 1000);
	        } else {
	          response = yield match(request);
	        }
	      } else {
	        purge(request);
	      }
	
	      if (response === undefined) {
	        response = yield self.fetch(request);
	        put(request, response);
	        response = response.clone();
	      }
	
	      responseOk(response, StatNotFoundError);
	
	      let json = yield response.json();
	      let dir = false;
	      let contents = Array.isArray(json) ? (dir = true, yield Promise.all(Array.from(json, function (item) {
	        return _this.statinfo(item);
	      }))) : yield _this.statinfo(json);
	
	      return new Stat(dir, contents, ['GET', 'OPTIONS']);
	    })();
	  }
	
	  read(path, unused_request, no_cache = false) {
	    var _this2 = this;
	
	    return _asyncToGenerator(function* () {
	      let githubHeaders = new Headers();
	      if (_this2.token) {
	        githubHeaders.append('Authorization', 'token ' + _this2.token);
	      }
	
	      let branchParam = '';
	      if (_this2.branch) {
	        branchParam = '?ref=' + _this2.branch;
	      }
	
	      let request = new Request('https://api.github.com/repos/' + _this2.repo + '/contents/' + path + branchParam, { headers: githubHeaders });
	
	      let response = undefined;
	
	      if (!no_cache) {
	        if (navigator.onLine) {
	          response = yield match(request, 5 * 60 * 1000);
	        } else {
	          response = yield match(request);
	        }
	      } else {
	        purge(request);
	      }
	
	      if (response === undefined) {
	        response = yield self.fetch(request);
	        put(request, response);
	        response = response.clone();
	      }
	
	      responseOk(response, FileNotFoundError$1);
	
	      let json = yield response.json();
	
	      if (Array.isArray(json)) {
	        throw new IsDirectoryError();
	      } else {
	        return new File$1(atob(json['content']));
	      }
	    })();
	  }
	
	  write(path, unused_request, fileContent) {
	    var _this3 = this;
	
	    return _asyncToGenerator(function* () {
	      if (!_this3.token) {
	        return new Response(null, {
	          status: 401,
	          statusMessage: 'TOKEN REQUIRED',
	          headers: { 'Allow': 'GET,OPTIONS' }
	        });
	      }
	      let githubHeaders = new Headers();
	      githubHeaders.append('Authorization', 'token ' + _this3.token);
	
	      let getResponse = yield self.fetch('https://api.github.com/repos/' + _this3.repo + '/contents' + path, { headers: githubHeaders });
	
	      if (getResponse.status != 200) {
	        throw new Error(getResponse.statusText);
	      }
	
	      let getJson = yield getResponse.json();
	
	      if (Array.isArray(getJson)) {
	        throw new Error('What you are trying to overwrite is not a file. It\'s a directory.');
	      }
	
	      if (getJson['type'] != 'file') {
	        throw new Error('What you are trying to overwrite is not a file. It\'s a ' + getJson['type'] + '.');
	      }
	
	      let request = {
	        message: 'Update file ' + path + ' with webclient file backend',
	        sha: getJson['sha'],
	        content: btoa((yield fileContent))
	      };
	
	      if (_this3.branch) {
	        request['branch'] = _this3.branch;
	      }
	
	      let response = yield self.fetch('https://api.github.com/repos/' + _this3.repo + '/contents/' + path, {
	        headers: githubHeaders,
	        body: JSON.stringify(request),
	        method: 'PUT' });
	
	      if (response.status < 200 || response.status >= 300) {
	        throw new Error(response.statusText);
	      }
	
	      return fileContent;
	    })();
	  }
	};
	
	let Filesystem$5 = class Filesystem extends Base {
	  constructor(path, options) {
	    super('dropbox', path, options);
	
	    if (options.token) {
	      this.token = options.token;
	    } else {
	      throw new Error("[dropbox] bearer auth token required");
	    }
	
	    if (options.subfolder) {
	      this.subfolder = options.subfolder;
	      if (this.subfolder[0] != '/') {
	        this.subfolder = '/' + this.subfolder;
	      }
	    } else {
	      this.subfolder = '';
	    }
	  }
	
	  statinfo(json) {
	    return _asyncToGenerator(function* () {
	      let type = 'file';
	      let name = json['path'].split('/').pop();
	
	      if (json['is_dir'] === true) type = 'directory';
	
	      return {
	        type: type,
	        name: name,
	        size: json['size']
	      };
	    })();
	  }
	
	  stat(path, unused_request, no_cache = false) {
	    var _this = this;
	
	    return _asyncToGenerator(function* () {
	      let dropboxHeaders = new Headers();
	      dropboxHeaders.append('Authorization', 'Bearer ' + _this.token);
	
	      let request = new Request('https://api.dropboxapi.com/1/metadata/auto' + _this.subfolder + path, { headers: dropboxHeaders });
	
	      let response = undefined;
	
	      if (!no_cache) {
	        if (navigator.onLine) {
	          response = yield cache.match(request, 5 * 60 * 1000);
	        } else {
	          response = yield cache.match(request);
	        }
	      } else {
	        cache.purge(request);
	      }
	
	      if (response === undefined) {
	        response = yield self.fetch(request);
	        cache.put(request, response);
	        response = response.clone();
	      }
	
	      responseOk(response, StatNotFoundError);
	
	      let json = yield response.json();
	      let dir = false;
	      let contents = json['contents'] ? (dir = true, yield Promise.all(Array.from(json['contents'], function (item) {
	        return _this.statinfo(item);
	      }))) : yield _this.statinfo(json);
	
	      return new Stat(dir, contents, ['GET', 'OPTIONS']);
	    })();
	  }
	
	  read(path, unused_request, no_cache = false) {
	    var _this2 = this;
	
	    return _asyncToGenerator(function* () {
	      let dropboxHeaders = new Headers();
	      dropboxHeaders.append('Authorization', 'Bearer ' + _this2.token);
	
	      let request = new Request('https://content.dropboxapi.com/1/files/auto' + _this2.subfolder + path, { headers: dropboxHeaders });
	
	      let response = undefined;
	
	      if (!no_cache) {
	        if (navigator.onLine) {
	          response = yield cache.match(request, 5 * 60 * 1000);
	        } else {
	          response = yield cache.match(request);
	        }
	      } else {
	        cache.purge(request);
	      }
	
	      if (response === undefined) {
	        response = yield self.fetch(request);
	        cache.put(request, response);
	        response = response.clone();
	      }
	
	      responseOk(response, FileNotFoundError);
	
	      let blob = yield response.blob();
	
	      return new File(blob);
	    })();
	  }
	
	  write(path, fileContent, unused_request) {
	    var _this3 = this;
	
	    return _asyncToGenerator(function* () {
	      let fileContentFinal = yield fileContent;
	      let dropboxHeaders = new Headers();
	
	      dropboxHeaders.append('Authorization', 'Bearer ' + _this3.token);
	      dropboxHeaders.append("Content-Length", fileContentFinal.length.toString());
	      let response = yield self.fetch('https://content.dropboxapi.com/1/files_put/auto' + _this3.subfolder + path, { method: 'PUT', headers: dropboxHeaders, body: fileContentFinal });
	
	      if (response.status < 200 && response.status >= 300) {
	        throw new Error(response.statusText);
	      }
	
	      return fileContent;
	    })();
	  }
	};
	
	let ServiceWorker = class ServiceWorker {
	  constructor() {
	    this.filesystem = new Filesystem();
	
	    this.filesystem.mount('/', Filesystem$4, { repo: 'LivelyKernel/lively4-core', branch: 'gh-pages' });
	    this.filesystem.mount('/sys', Filesystem$1);
	    this.filesystem.mount('/local', Filesystem$3);
	
	    this.filesystem.loadMounts();
	  }
	
	  fetch(event) {
	    let request = event.request;
	    if (!request) return;
	    let url = new URL(request.url),
	        promise = undefined;
	
	    if (url.hostname !== 'lively4') {
	      if (url.pathname.match(/_git\/clone/)) {
	        console.log("fetch: irgnore " + url);
	
	        return;
	      }
	      return fetch$1(request);
	    } else {
	      let response = this.filesystem.handle(request, url);
	
	      response = response.then(result => {
	        if (result instanceof Response) {
	          return result;
	        } else {
	          return new Response(result);
	        }
	      }).catch(err => {
	        console.error('Error while processing fetch event:', err);
	
	        let message = err.toString();
	        let content = JSON.stringify({ message: message });
	
	        return new Response(content, { status: 500, statusText: message });
	      });
	
	      event.respondWith(response);
	    }
	  }
	
	  message(event) {
	    return process(event);
	  }
	};
	
	
	var __instance__;
	function instance() {
	  if (typeof __instance__ === 'undefined') {
	    __instance__ = new ServiceWorker();
	  }
	
	  return __instance__;
	}
	
	function install() {
	  return self.skipWaiting();
	}
	
	function activate() {
	  return self.clients.claim();
	}
	
	function fetch$1(event) {
	  return instance().fetch(event);
	}
	
	function message(event) {
	  return instance().message(event);
	}
	
	exports.instance = instance;
	exports.install = install;
	exports.activate = activate;
	exports.fetch = fetch$1;
	exports.message = message;
	exports.focalStorage = focalStorage;

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _isIterable2 = __webpack_require__(75);
	
	var _isIterable3 = _interopRequireDefault(_isIterable2);
	
	var _getIterator2 = __webpack_require__(78);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;
	
	    try {
	      for (var _i = (0, _getIterator3.default)(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);
	
	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }
	
	    return _arr;
	  }
	
	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if ((0, _isIterable3.default)(Object(arr))) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	}();

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(76), __esModule: true };

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(50);
	__webpack_require__(6);
	module.exports = __webpack_require__(77);

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(55)
	  , ITERATOR  = __webpack_require__(47)('iterator')
	  , Iterators = __webpack_require__(29);
	module.exports = __webpack_require__(14).isIterable = function(it){
	  var O = Object(it);
	  return O[ITERATOR] !== undefined
	    || '@@iterator' in O
	    || Iterators.hasOwnProperty(classof(O));
	};

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(79), __esModule: true };

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(50);
	__webpack_require__(6);
	module.exports = __webpack_require__(80);

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var anObject = __webpack_require__(19)
	  , get      = __webpack_require__(60);
	module.exports = __webpack_require__(14).getIterator = function(it){
	  var iterFn = get(it);
	  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
	  return anObject(iterFn.call(it));
	};

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _from = __webpack_require__(82);
	
	var _from2 = _interopRequireDefault(_from);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function (arr) {
	  return Array.isArray(arr) ? arr : (0, _from2.default)(arr);
	};

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(83), __esModule: true };

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(6);
	__webpack_require__(84);
	module.exports = __webpack_require__(14).Array.from;

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx            = __webpack_require__(15)
	  , $export        = __webpack_require__(12)
	  , toObject       = __webpack_require__(49)
	  , call           = __webpack_require__(58)
	  , isArrayIter    = __webpack_require__(59)
	  , toLength       = __webpack_require__(39)
	  , createProperty = __webpack_require__(85)
	  , getIterFn      = __webpack_require__(60);
	
	$export($export.S + $export.F * !__webpack_require__(70)(function(iter){ Array.from(iter); }), 'Array', {
	  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
	  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
	    var O       = toObject(arrayLike)
	      , C       = typeof this == 'function' ? this : Array
	      , aLen    = arguments.length
	      , mapfn   = aLen > 1 ? arguments[1] : undefined
	      , mapping = mapfn !== undefined
	      , index   = 0
	      , iterFn  = getIterFn(O)
	      , length, result, step, iterator;
	    if(mapping)mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
	    // if object isn't iterable or it's array with default iterator - use simple case
	    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
	      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
	        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
	      }
	    } else {
	      length = toLength(O.length);
	      for(result = new C(length); length > index; index++){
	        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
	      }
	    }
	    result.length = index;
	    return result;
	  }
	});


/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $defineProperty = __webpack_require__(18)
	  , createDesc      = __webpack_require__(26);
	
	module.exports = function(object, index, value){
	  if(index in object)$defineProperty.f(object, index, createDesc(0, value));
	  else object[index] = value;
	};

/***/ }
/******/ ]);
//# sourceMappingURL=swx-loader.js.map