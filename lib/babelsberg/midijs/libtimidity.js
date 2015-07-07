module('users.timfelgentreff.midijs.libtimidity').requires().toRun(function() {
// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = {};
users.timfelgentreff.midijs.libtimidity.Module = Module;

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module.exports = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function(x) {
      console.log(x);
    };
    Module['printErr'] = function(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 67108864;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_toFloat32 = Math.toFloat32;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 8448;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([0,0,0,0,0,0,144,63,75,191,53,65,90,136,144,63,241,46,189,130,62,21,145,63,249,198,51,115,211,166,145,63,194,109,221,10,65,61,146,63,61,194,157,150,176,216,146,63,232,234,78,195,76,121,147,63,204,6,121,169,65,31,148,63,172,119,109,217,188,202,148,63,136,88,201,103,237,123,149,63,154,143,98,250,3,51,150,63,89,8,163,213,50,240,150,63,69,192,85,234,173,179,151,63,98,112,233,227,170,125,152,63,242,189,44,55,97,78,153,63,189,253,135,49,10,38,154,63,84,184,184,8,225,4,155,63,232,64,19,235,34,235,155,63,101,213,78,16,15,217,156,63,82,228,224,202,230,206,157,63,110,60,236,153,237,204,158,63,149,18,201,59,105,211,159,63,39,122,149,224,80,113,160,63,129,244,116,208,112,253,160,63,39,24,58,230,58,142,161,63,74,29,119,226,214,35,162,63,50,84,131,216,109,190,162,63,137,39,194,57,42,94,163,63,195,57,74,225,55,3,164,63,225,208,239,31,196,173,164,63,141,222,181,200,253,93,165,63,62,15,169,61,21,20,166,63,223,103,40,125,60,208,166,63,155,23,159,47,167,146,167,63,148,66,179,181,138,91,168,63,80,170,237,54,30,43,169,63,237,57,222,176,154,1,170,63,104,158,193,6,59,223,170,63,182,54,172,17,60,196,171,63,248,203,62,177,220,176,172,63,49,168,233,220,93,165,173,63,115,200,194,181,2,162,174,63,108,16,244,152,16,167,175,63,78,71,99,153,103,90,176,63,213,5,40,73,196,229,176,63,17,38,228,158,196,117,177,63,185,204,197,35,144,10,178,63,128,43,232,177,79,164,178,63,152,204,138,127,45,67,179,63,121,115,168,42,85,231,179,63,129,193,240,196,243,144,180,63,19,232,39,224,55,64,181,63,242,205,239,154,81,245,181,63,121,42,254,173,114,176,182,63,62,55,195,121,206,113,183,63,150,183,132,20,154,57,184,63,124,53,241,88,12,8,185,63,40,116,47,245,93,221,185,63,234,58,110,122,201,185,186,63,0,190,248,108,139,157,187,63,185,15,212,84,226,136,188,63,119,41,234,206,14,124,189,63,90,67,199,158,83,119,190,63,113,89,238,192,245,122,191,63,90,243,228,62,158,67,192,63,134,4,159,190,56,206,192,63,250,182,112,109,112,93,193,63,134,74,113,157,108,241,193,63,158,146,207,239,85,138,194,63,241,160,249,95,86,40,195,63,53,128,35,79,153,203,195,63,8,41,48,144,75,116,196,63,52,246,255,115,155,34,197,63,60,249,39,214,184,214,197,63,231,172,21,42,213,144,198,63,103,161,162,136,35,81,199,63,64,220,27,190,216,23,200,63,253,197,192,88,43,229,200,63,169,160,189,183,83,185,201,63,151,163,165,26,140,148,202,63,112,252,112,177,16,119,203,63,132,25,3,173,31,97,204,63,196,198,61,80,249,82,205,63,129,205,165,1,224,76,206,63,12,239,157,93,24,79,207,63,179,157,158,164,244,44,208,63,24,248,226,2,206,182,208,63,221,27,97,34,62,69,209,63,241,38,102,30,108,216,209,63,184,223,131,95,128,112,210,63,143,212,168,166,164,13,211,63,246,6,151,24,4,176,211,63,25,72,188,73,203,87,212,63,38,135,111,74,40,5,213,63,234,109,150,179,74,184,213,63,94,196,182,179,99,113,214,63,191,49,119,28,166,48,215,63,64,16,147,112,70,246,215,63,245,39,69,242,122,194,216,63,68,70,45,178,123,149,217,63,234,200,180,158,130,111,218,63,100,86,246,147,203,80,219,63,204,33,45,108,148,57,220,63,17,61,176,16,29,42,221,63,59,163,126,139,167,34,222,63,13,204,96,25,120,35,223,63,161,97,82,158,106,22,224,63,42,244,60,232,131,159,224,63,162,211,120,142,45,45,225,63,38,84,213,117,142,191,225,63,187,17,150,206,206,86,226,63,84,154,123,31,24,243,226,63,218,31,42,81,149,148,227,63,89,83,241,185,114,59,228,63,111,165,248,41,222,231,228,63,145,67,211,247,6,154,229,63,32,70,127,13,30,82,230,63,216,160,211,245,85,16,231,63,137,133,96,234,226,212,231,63,76,8,198,225,250,159,232,63,27,245,132,158,213,113,233,63,9,232,77,190,172,74,234,63,44,220,210,201,187,42,235,63,254,136,31,69,64,18,236,63,11,11,125,192,121,1,237,63,244,122,229,233,169,248,237,63,130,61,12,159,20,248,238,63,0,0,0,0,0,0,240,63,0,0,128,63,0,0,0,0,0,0,220,67,0,0,0,0,168,25,0,0,0,0,0,0,240,31,0,0,214,33,0,0,217,35,0,0,251,37,0,0,61,40,0,0,161,42,0,0,42,45,0,0,218,47,0,0,178,50,0,0,182,53,0,0,232,56,0,0,74,60,0,0,224,63,0,0,172,67,0,0,178,71,0,0,245,75,0,0,122,80,0,0,67,85,0,0,85,90,0,0,180,95,0,0,101,101,0,0,108,107,0,0,207,113,0,0,148,120,0,0,191,127,0,0,88,135,0,0,100,143,0,0,235,151,0,0,243,160,0,0,134,170,0,0,169,180,0,0,103,191,0,0,201,202,0,0,216,214,0,0,158,227,0,0,39,241,0,0,126,255,0,0,176,14,1,0,200,30,1,0,214,47,1,0,231,65,1,0,11,85,1,0,83,105,1,0,207,126,1,0,146,149,1,0,176,173,1,0,61,199,1,0,79,226,1,0,253,254,1,0,95,29,2,0,144,61,2,0,171,95,2,0,206,131,2,0,22,170,2,0,165,210,2,0,158,253,2,0,36,43,3,0,96,91,3,0,122,142,3,0,158,196,3,0,250,253,3,0,191,58,4,0,33,123,4,0,87,191,4,0,156,7,5,0,44,84,5,0,74,165,5,0,59,251,5,0,73,86,6,0,192,182,6,0,244,28,7,0,59,137,7,0,243,251,7,0,125,117,8,0,66,246,8,0,174,126,9,0,55,15,10,0,88,168,10,0,149,74,11,0,119,246,11,0,145,172,12,0,128,109,13,0,232,57,14,0,119,18,15,0,230,247,15,0,251,234,16,0,131,236,17,0,92,253,18,0,110,30,20,0,177,80,21,0,42,149,22,0,238,236,23,0,35,89,25,0,0,219,26,0,207,115,28,0,237,36,30,0,205,239,31,0,245,213,33,0,6,217,35,0,184,250,37,0,220,60,40,0,98,161,42,0,83,42,45,0,219,217,47,0,70,178,50,0,0,182,53,0,158,231,56,0,218,73,60,0,153,223,63,0,234,171,67,0,12,178,71,0,112,245,75,0,185,121,80,0,196,66,85,0,167,84,90,0,183,179,95,0,139,100,101,0,0,108,107,0,60,207,113,0,181,147,120,0,50,191,127,0,212,87,135,0,25,100,143,0,223,234,151,0,114,243,160,0,135,133,170,0,78,169,180,0,110,103,191,0,32,161,7,0,0,0,0,0,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,240,63,113,93,245,158,236,0,240,63,84,18,150,75,217,1,240,63,207,232,226,5,198,2,240,63,21,171,220,205,178,3,240,63,102,35,132,163,159,4,240,63,10,28,218,134,140,5,240,63,88,95,223,119,121,6,240,63,177,183,148,118,102,7,240,63,131,239,250,130,83,8,240,63,70,209,18,157,64,9,240,63,127,39,221,196,45,10,240,63,191,188,90,250,26,11,240,63,160,91,140,61,8,12,240,63,204,206,114,142,245,12,240,63,245,224,14,237,226,13,240,63,218,92,97,89,208,14,240,63,71,13,107,211,189,15,240,63,17,189,44,91,171,16,240,63,28,55,167,240,152,17,240,63,85,70,219,147,134,18,240,63,181,181,201,68,116,19,240,63,66,80,115,3,98,20,240,63,14,225,216,207,79,21,240,63,53,51,251,169,61,22,240,63,224,17,219,145,43,23,240,63,68,72,121,135,25,24,240,63,159,161,214,138,7,25,240,63,63,233,243,155,245,25,240,63,122,234,209,186,227,26,240,63,180,112,113,231,209,27,240,63,93,71,211,33,192,28,240,63,238,57,248,105,174,29,240,63,239,19,225,191,156,30,240,63,242,160,142,35,139,31,240,63,148,172,1,149,121,32,240,63,129,2,59,20,104,33,240,63,109,110,59,161,86,34,240,63,26,188,3,60,69,35,240,63,85,183,148,228,51,36,240,63,247,43,239,154,34,37,240,63,228,229,19,95,17,38,240,63,14,177,3,49,0,39,240,63,112,89,191,16,239,39,240,63,19,171,71,254,221,40,240,63,10,114,157,249,204,41,240,63,117,122,193,2,188,42,240,63,128,144,180,25,171,43,240,63,97,128,119,62,154,44,240,63,92,22,11,113,137,45,240,63,191,30,112,177,120,46,240,63,230,101,167,255,103,47,240,63,54,184,177,91,87,48,240,63,34,226,143,197,70,49,240,63,39,176,66,61,54,50,240,63,209,238,202,194,37,51,240,63,180,106,41,86,21,52,240,63,113,240,94,247,4,53,240,63,183,76,108,166,244,53,240,63,63,76,82,99,228,54,240,63,204,187,17,46,212,55,240,63,49,104,171,6,196,56,240,63,73,30,32,237,179,57,240,63,254,170,112,225,163,58,240,63,67,219,157,227,147,59,240,63,24,124,168,243,131,60,240,63,138,90,145,17,116,61,240,63,177,67,89,61,100,62,240,63,176,4,1,119,84,63,240,63,182,106,137,190,68,64,240,63,0,67,243,19,53,65,240,63,212,90,63,119,37,66,240,63,133,127,110,232,21,67,240,63,114,126,129,103,6,68,240,63,7,37,121,244,246,68,240,63,185,64,86,143,231,69,240,63,12,159,25,56,216,70,240,63,141,13,196,238,200,71,240,63,216,89,86,179,185,72,240,63,146,81,209,133,170,73,240,63,109,194,53,102,155,74,240,63,40,122,132,84,140,75,240,63,140,70,190,80,125,76,240,63,110,245,227,90,110,77,240,63,177,84,246,114,95,78,240,63,66,50,246,152,80,79,240,63,26,92,228,204,65,80,240,63,63,160,193,14,51,81,240,63,194,204,142,94,36,82,240,63,192,175,76,188,21,83,240,63,98,23,252,39,7,84,240,63,220,209,157,161,248,84,240,63,112,173,50,41,234,85,240,63,107,120,187,190,219,86,240,63,37,1,57,98,205,87,240,63,2,22,172,19,191,88,240,63,116,133,21,211,176,89,240,63,247,29,118,160,162,90,240,63,18,174,206,123,148,91,240,63,91,4,32,101,134,92,240,63,113,239,106,92,120,93,240,63,1,62,176,97,106,94,240,63,194,190,240,116,92,95,240,63,122,64,45,150,78,96,240,63,247,145,102,197,64,97,240,63,22,130,157,2,51,98,240,63,191,223,210,77,37,99,240,63,229,121,7,167,23,100,240,63,137,31,60,14,10,101,240,63,181,159,113,131,252,101,240,63,130,201,168,6,239,102,240,63,20,108,226,151,225,103,240,63,154,86,31,55,212,104,240,63,79,88,96,228,198,105,240,63,124,64,166,159,185,106,240,63,115,222,241,104,172,107,240,63,149,1,68,64,159,108,240,63,77,121,157,37,146,109,240,63,18,21,255,24,133,110,240,63,104,164,105,26,120,111,240,63,222,246,221,41,107,112,240,63,16,220,92,71,94,113,240,63,165,35,231,114,81,114,240,63,81,157,125,172,68,115,240,63,211,24,33,244,55,116,240,63,246,101,210,73,43,117,240,63,147,84,146,173,30,118,240,63,140,180,97,31,18,119,240,63,209,85,65,159,5,120,240,63,93,8,50,45,249,120,240,63,57,156,52,201,236,121,240,63,118,225,73,115,224,122,240,63,54,168,114,43,212,123,240,63,163,192,175,241,199,124,240,63,246,250,1,198,187,125,240,63,113,39,106,168,175,126,240,63,101,22,233,152,163,127,240,63,44,152,127,151,151,128,240,63,48,125,46,164,139,129,240,63,226,149,246,190,127,130,240,63,197,178,216,231,115,131,240,63,98,164,213,30,104,132,240,63,82,59,238,99,92,133,240,63,58,72,35,183,80,134,240,63,200,155,117,24,69,135,240,63,185,6,230,135,57,136,240,63,214,89,117,5,46,137,240,63,242,101,36,145,34,138,240,63,237,251,243,42,23,139,240,63,180,236,228,210,11,140,240,63,63,9,248,136,0,141,240,63,147,34,46,77,245,141,240,63,192,9,136,31,234,142,240,63,226,143,6,0,223,143,240,63,35,134,170,238,211,144,240,63,184,189,116,235,200,145,240,63,224,7,102,246,189,146,240,63,233,53,127,15,179,147,240,63,44,25,193,54,168,148,240,63,13,131,44,108,157,149,240,63,0,69,194,175,146,150,240,63,127,48,131,1,136,151,240,63,22,23,112,97,125,152,240,63,89,202,137,207,114,153,240,63,234,27,209,75,104,154,240,63,119,221,70,214,93,155,240,63,185,224,235,110,83,156,240,63,119,247,192,21,73,157,240,63,131,243,198,202,62,158,240,63,187,166,254,141,52,159,240,63,9,227,104,95,42,160,240,63,99,122,6,63,32,161,240,63,205,62,216,44,22,162,240,63,85,2,223,40,12,163,240,63,21,151,27,51,2,164,240,63,53,207,142,75,248,164,240,63,233,124,57,114,238,165,240,63,110,114,28,167,228,166,240,63,17,130,56,234,218,167,240,63,40,126,142,59,209,168,240,63,25,57,31,155,199,169,240,63,83,133,235,8,190,170,240,63,81,53,244,132,180,171,240,63,156,27,58,15,171,172,240,63,200,10,190,167,161,173,240,63,118,213,128,78,152,174,240,63,82,78,131,3,143,175,240,63,22,72,198,198,133,176,240,63,134,149,74,152,124,177,240,63,116,9,17,120,115,178,240,63,188,118,26,102,106,179,240,63,73,176,103,98,97,180,240,63,15,137,249,108,88,181,240,63,18,212,208,133,79,182,240,63,95,100,238,172,70,183,240,63,17,13,83,226,61,184,240,63,78,161,255,37,53,185,240,63,72,244,244,119,44,186,240,63,63,217,51,216,35,187,240,63,125,35,189,70,27,188,240,63,91,166,145,195,18,189,240,63,59,53,178,78,10,190,240,63,142,163,31,232,1,191,240,63,206,196,218,143,249,191,240,63,133,108,228,69,241,192,240,63,71,110,61,10,233,193,240,63,180,157,230,220,224,194,240,63,122,206,224,189,216,195,240,63,80,212,44,173,208,196,240,63,253,130,203,170,200,197,240,63,83,174,189,182,192,198,240,63,46,42,4,209,184,199,240,63,121,202,159,249,176,200,240,63,42,99,145,48,169,201,240,63,67,200,217,117,161,202,240,63,212,205,121,201,153,203,240,63,247,71,114,43,146,204,240,63,212,10,196,155,138,205,240,63,158,234,111,26,131,206,240,63,148,187,118,167,123,207,240,63,3,82,217,66,116,208,240,63,68,130,152,236,108,209,240,63,186,32,181,164,101,210,240,63,214,1,48,107,94,211,240,63,22,250,9,64,87,212,240,63,2,222,67,35,80,213,240,63,50,130,222,20,73,214,240,63,69,187,218,20,66,215,240,63,236,93,57,35,59,216,240,63,223,62,251,63,52,217,240,63,230,50,33,107,45,218,240,63,213,14,172,164,38,219,240,63,137,167,156,236,31,220,240,63,240,209,243,66,25,221,240,63,0,99,178,167,18,222,240,63,191,47,217,26,12,223,240,63,61,13,105,156,5,224,240,63,150,208,98,44,255,224,240,63,245,78,199,202,248,225,240,63,141,93,151,119,242,226,240,63,162,209,211,50,236,227,240,63,129,128,125,252,229,228,240,63,133,63,149,212,223,229,240,63,21,228,27,187,217,230,240,63,163,67,18,176,211,231,240,63,176,51,121,179,205,232,240,63,198,137,81,197,199,233,240,63,127,27,156,229,193,234,240,63,126,190,89,20,188,235,240,63,116,72,139,81,182,236,240,63,31,143,49,157,176,237,240,63,72,104,77,247,170,238,240,63,197,169,223,95,165,239,240,63,119,41,233,214,159,240,240,63,79,189,106,92,154,241,240,63,69,59,101,240,148,242,240,63,0,0,0,0,0,0,240,63,99,121,217,146,143,243,240,63,192,214,199,195,154,245,241,63,21,183,49,10,254,6,243,63,139,114,141,249,162,40,244,63,94,236,240,8,129,91,245,63,205,59,127,102,158,160,246,63,176,207,104,215,16,249,247,63,60,110,61,165,254,101,249,63,173,211,90,153,159,232,250,63,41,193,78,7,62,130,252,63,67,19,16,231,55,52,254,63,0,0,0,0,0,0,0,64,99,121,217,146,143,243,0,64,192,214,199,195,154,245,1,64,21,183,49,10,254,6,3,64,139,114,141,249,162,40,4,64,94,236,240,8,129,91,5,64,205,59,127,102,158,160,6,64,176,207,104,215,16,249,7,64,61,110,61,165,254,101,9,64,173,211,90,153,159,232,10,64,41,193,78,7,62,130,12,64,68,19,16,231,55,52,14,64,0,0,0,0,0,0,16,64,99,121,217,146,143,243,16,64,191,214,199,195,154,245,17,64,21,183,49,10,254,6,19,64,139,114,141,249,162,40,20,64,93,236,240,8,129,91,21,64,205,59,127,102,158,160,22,64,177,207,104,215,16,249,23,64,60,110,61,165,254,101,25,64,173,211,90,153,159,232,26,64,42,193,78,7,62,130,28,64,67,19,16,231,55,52,30,64,0,0,0,0,0,0,32,64,99,121,217,146,143,243,32,64,191,214,199,195,154,245,33,64,21,183,49,10,254,6,35,64,139,114,141,249,162,40,36,64,93,236,240,8,129,91,37,64,205,59,127,102,158,160,38,64,177,207,104,215,16,249,39,64,60,110,61,165,254,101,41,64,173,211,90,153,159,232,42,64,42,193,78,7,62,130,44,64,67,19,16,231,55,52,46,64,0,0,0,0,0,0,48,64,98,121,217,146,143,243,48,64,193,214,199,195,154,245,49,64,21,183,49,10,254,6,51,64,138,114,141,249,162,40,52,64,95,236,240,8,129,91,53,64,205,59,127,102,158,160,54,64,175,207,104,215,16,249,55,64,62,110,61,165,254,101,57,64,173,211,90,153,159,232,58,64,40,193,78,7,62,130,60,64,69,19,16,231,55,52,62,64,0,0,0,0,0,0,64,64,98,121,217,146,143,243,64,64,193,214,199,195,154,245,65,64,21,183,49,10,254,6,67,64,138,114,141,249,162,40,68,64,95,236,240,8,129,91,69,64,205,59,127,102,158,160,70,64,175,207,104,215,16,249,71,64,62,110,61,165,254,101,73,64,173,211,90,153,159,232,74,64,40,193,78,7,62,130,76,64,69,19,16,231,55,52,78,64,0,0,0,0,0,0,80,64,98,121,217,146,143,243,80,64,193,214,199,195,154,245,81,64,21,183,49,10,254,6,83,64,138,114,141,249,162,40,84,64,95,236,240,8,129,91,85,64,205,59,127,102,158,160,86,64,175,207,104,215,16,249,87,64,62,110,61,165,254,101,89,64,173,211,90,153,159,232,90,64,40,193,78,7,62,130,92,64,69,19,16,231,55,52,94,64,0,0,0,0,0,0,96,64,98,121,217,146,143,243,96,64,193,214,199,195,154,245,97,64,21,183,49,10,254,6,99,64,138,114,141,249,162,40,100,64,95,236,240,8,129,91,101,64,205,59,127,102,158,160,102,64,175,207,104,215,16,249,103,64,62,110,61,165,254,101,105,64,173,211,90,153,159,232,106,64,40,193,78,7,62,130,108,64,69,19,16,231,55,52,110,64,0,0,0,0,0,0,112,64,101,121,217,146,143,243,112,64,190,214,199,195,154,245,113,64,21,183,49,10,254,6,115,64,141,114,141,249,162,40,116,64,92,236,240,8,129,91,117,64,205,59,127,102,158,160,118,64,179,207,104,215,16,249,119,64,58,110,61,165,254,101,121,64,173,211,90,153,159,232,122,64,45,193,78,7,62,130,124,64,64,19,16,231,55,52,126,64,0,0,0,0,0,0,128,64,101,121,217,146,143,243,128,64,190,214,199,195,154,245,129,64,21,183,49,10,254,6,131,64,141,114,141,249,162,40,132,64,92,236,240,8,129,91,133,64,205,59,127,102,158,160,134,64,179,207,104,215,16,249,135,64,58,110,61,165,254,101,137,64,173,211,90,153,159,232,138,64,45,193,78,7,62,130,140,64,64,19,16,231,55,52,142,64,0,0,0,0,0,0,144,64,101,121,217,146,143,243,144,64,190,214,199,195,154,245,145,64,21,183,49,10,254,6,147,64,141,114,141,249,162,40,148,64,92,236,240,8,129,91,149,64,205,59,127,102,158,160,150,64,179,207,104,215,16,249,151,64,77,84,104,100,0,0,0,0,86,101,108,111,99,105,116,121,32,37,100,32,37,100,10,0,70,84,80,112,114,111,120,121,0,0,0,0,0,0,0,0,72,84,84,80,112,114,111,120,121,0,0,0,0,0,0,0,99,111,109,109,0,0,0,0,35,101,120,116,101,110,115,105,111,110,0,0,0,0,0,0,78,117,109,32,77,105,115,115,105,110,103,32,112,97,116,99,104,101,115,58,32,37,100,10,0,0,0,0,0,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,115,116,114,105,112,32,109,117,115,116,32,98,101,32,101,110,118,44,32,108,111,111,112,44,32,111,114,32,116,97,105,108,10,0,0,116,97,105,108,0,0,0,0,115,116,114,105,112,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,107,101,101,112,32,109,117,115,116,32,98,101,32,101,110,118,32,111,114,32,108,111,111,112,10,0,0,108,111,111,112,0,0,0,0,101,110,118,0,0,0,0,0,107,101,101,112,0,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,112,97,110,110,105,110,103,32,109,117,115,116,32,98,101,32,108,101,102,116,44,32,114,105,103,104,116,44,32,99,101,110,116,101,114,44,32,111,114,32,98,101,116,119,101,101,110,32,45,49,48,48,32,97,110,100,32,49,48,48,10,0,0,0,0,0,0,32,9,160,0,0,0,0,0,114,105,103,104,116,0,0,0,108,101,102,116,0,0,0,0,77,105,115,115,105,110,103,32,112,97,116,99,104,58,32,37,115,10,0,0,0,0,0,0,99,101,110,116,101,114,0,0,112,97,110,0,0,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,110,111,116,101,32,109,117,115,116,32,98,101,32,98,101,116,119,101,101,110,32,48,32,97,110,100,32,49,50,55,10,0,0,0,0,110,111,116,101,0,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,97,109,112,108,105,102,105,99,97,116,105,111,110,32,109,117,115,116,32,98,101,32,98,101,116,119,101,101,110,32,48,32,97,110,100,32,37,100,10,0,0,0,0,97,109,112,0,0,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,98,97,100,32,112,97,116,99,104,32,111,112,116,105,111,110,32,37,115,10,0,0,0,0,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,77,117,115,116,32,115,112,101,99,105,102,121,32,116,111,110,101,32,98,97,110,107,32,111,114,32,100,114,117,109,32,115,101,116,32,98,101,102,111,114,101,32,97,115,115,105,103,110,109,101,110,116,10,0,0,0,0,0,0,67,111,110,102,105,103,117,114,97,116,105,111,110,32,102,105,108,101,32,37,115,32,110,111,116,32,102,111,117,110,100,10,0,0,0,0,0,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,80,114,111,103,114,97,109,32,109,117,115,116,32,98,101,32,98,101,116,119,101,101,110,32,48,32,97,110,100,32,49,50,55,10,0,37,115,58,32,108,105,110,101,32,37,100,58,32,115,121,110,116,97,120,32,101,114,114,111,114,10,0,0,0,0,0,0,63,63,63,63,63,63,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,84,111,110,101,32,98,97,110,107,32,109,117,115,116,32,98,101,32,98,101,116,119,101,101,110,32,48,32,97,110,100,32,49,50,55,10,0,0,0,0,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,78,111,32,98,97,110,107,32,110,117,109,98,101,114,32,103,105,118,101,110,10,0,0,0,0,0,0,98,97,110,107,0,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,68,114,117,109,32,115,101,116,32,109,117,115,116,32,98,101,32,98,101,116,119,101,101,110,32,48,32,97,110,100,32,49,50,55,10,0,0,0,0,0,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,78,111,32,100,114,117,109,32,115,101,116,32,110,117,109,98,101,114,32,103,105,118,101,110,10,0,0,100,114,117,109,115,101,116,0,37,115,58,32,108,105,110,101,32,37,100,58,32,77,117,115,116,32,115,112,101,99,105,102,121,32,101,120,97,99,116,108,121,32,111,110,101,32,112,97,116,99,104,32,110,97,109,101,10,0,0,0,0,0,0,0,100,101,102,97,117,108,116,0,80,114,111,98,97,98,108,101,32,115,111,117,114,99,101,32,108,111,111,112,32,105,110,32,99,111,110,102,105,103,117,114,97,116,105,111,110,32,102,105,108,101,115,10,0,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,78,111,32,102,105,108,101,32,110,97,109,101,32,103,105,118,101,110,10,0,0,0,0,0,0,0,0,115,111,117,114,99,101,0,0,71,70,49,80,65,84,67,72,49,48,48,0,73,68,35,48,48,48,48,48,50,0,0,0,37,115,58,32,108,105,110,101,32,37,100,58,32,78,111,32,100,105,114,101,99,116,111,114,121,32,103,105,118,101,110,10,0,0,0,0,0,0,0,0,100,105,114,0,0,0,0,0,70,73,88,77,69,58,32,73,109,112,108,101,109,101,110,116,32,34,109,97,112,34,32,105,110,32,84,105,77,105,100,105,116,121,32,99,111,110,102,105,103,46,10,0,0,0,0,0,109,97,112,0,0,0,0,0,70,73,88,77,69,58,32,73,109,112,108,101,109,101,110,116,32,34,112,114,111,103,98,97,115,101,34,32,105,110,32,84,105,77,105,100,105,116,121,32,99,111,110,102,105,103,46,10,0,0,0,0,0,0,0,0,112,114,111,103,98,97,115,101,0,0,0,0,0,0,0,0,70,73,88,77,69,58,32,73,109,112,108,109,101,109,101,110,116,32,34,37,115,34,32,105,110,32,84,105,77,105,100,105,116,121,32,99,111,110,102,105,103,46,10,0,0,0,0,0,102,111,110,116,0,0,0,0,85,110,115,117,112,112,111,114,116,101,100,32,97,117,100,105,111,32,102,111,114,109,97,116,10,0,0,0,0,0,0,0,115,111,117,110,100,102,111,110,116,0,0,0,0,0,0,0,70,73,88,77,69,58,32,73,109,112,108,101,109,101,110,116,32,34,97,108,116,97,115,115,105,103,110,34,32,105,110,32,84,105,77,105,100,105,116,121,32,99,111,110,102,105,103,46,10,0,0,0,0,0,0,0,71,70,49,80,65,84,67,72,49,49,48,0,73,68,35,48,48,48,48,48,50,0,0,0,77,84,114,107,0,0,0,0,97,108,116,97,115,115,105,103,110,0,0,0,0,0,0,0,70,73,88,77,69,58,32,73,109,112,108,101,109,101,110,116,32,34,117,110,100,101,102,34,32,105,110,32,84,105,77,105,100,105,116,121,32,99,111,110,102,105,103,46,10,0,0,0,117,110,100,101,102,0,0,0,70,73,88,77,69,58,32,73,109,112,108,101,109,101,110,116,32,34,37,115,34,32,105,110,32,84,105,77,105,100,105,116,121,32,99,111,110,102,105,103,46,10,0,0,0,0,0,0,99,111,112,121,98,97,110,107,0,0,0,0,0,0,0,0,99,111,112,121,100,114,117,109,115,101,116,0,0,0,0,0,70,73,88,77,69,58,32,73,109,112,108,101,109,101,110,116,32,34,116,105,109,101,111,117,116,34,32,105,110,32,84,105,77,105,100,105,116,121,32,99,111,110,102,105,103,46,10,0,97,100,100,32,116,111,32,112,97,116,104,108,105,115,116,58,32,37,115,10,0,0,0,0,116,105,109,101,111,117,116,0,46,0,0,0,0,0,0,0,116,105,109,105,100,105,116,121,46,99,102,103,0,0,0,0,111,112,116,0,0,0,0,0,114,98,0,0,0,0,0,0,109,97,105,108,97,100,100,114,0,0,0,0,0,0,0,0,46,112,97,116,0,0,0,0,114,98,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var VFS=undefined;
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
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
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
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
      },basename:function (path, ext) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var f = PATH.splitPath(path)[2];
        if (ext && f.substr(-1 * ext.length) === ext) {
          f = f.substr(0, f.length - ext.length);
        }
        return f;
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.filter(function(p, index) {
          if (typeof p !== 'string') {
            throw new TypeError('Arguments to path.join must be strings');
          }
          return p;
        }).join('/'));
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
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
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
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
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek
          };
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap
          };
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink
          };
          node.stream_ops = {};
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = FS.chrdev_stream_ops;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            assert(buffer.length);
            if (canOwn && buffer.buffer === HEAP8.buffer && offset === 0) {
              node.contents = buffer; // this is a subarray of the heap, and we can own it
              node.contentMode = MEMFS.CONTENT_OWNING;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        var done = function(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function() { done(null); };
            req.onerror = function() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function() { done(null); };
            req.onerror = function() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        var isRealDir = function(p) {
          return p !== '.' && p !== '..';
        };
        var toAbsolute = function(root) {
          return function(p) {
            return PATH.join(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, stream.flags);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode)) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        },handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + new Error().stack;
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            return path ? PATH.join(node.mount.mountpoint, path) : node.mount.mountpoint;
          }
          path = path ? PATH.join(node.name, path) : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        var node = {
          id: FS.nextInode++,
          name: name,
          mode: mode,
          node_ops: {},
          stream_ops: {},
          rdev: rdev,
          parent: null,
          mount: null
        };
        if (!parent) {
          parent = node;  // root node sets parent to itself
        }
        node.parent = parent;
        node.mount = parent.mount;
        // compatibility
        var readMode = 292 | 73;
        var writeMode = 146;
        // NOTE we must use Object.defineProperties instead of individual calls to
        // Object.defineProperty in order to make closure compiler happy
        Object.defineProperties(node, {
          read: {
            get: function() { return (node.mode & readMode) === readMode; },
            set: function(val) { val ? node.mode |= readMode : node.mode &= ~readMode; }
          },
          write: {
            get: function() { return (node.mode & writeMode) === writeMode; },
            set: function(val) { val ? node.mode |= writeMode : node.mode &= ~writeMode; }
          },
          isFolder: {
            get: function() { return FS.isDir(node.mode); },
          },
          isDevice: {
            get: function() { return FS.isChrdev(node.mode); },
          },
        });
        FS.hashAddNode(node);
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        // compatibility
        Object.defineProperties(stream, {
          object: {
            get: function() { return stream.node; },
            set: function(val) { stream.node = val; }
          },
          isRead: {
            get: function() { return (stream.flags & 2097155) !== 1; }
          },
          isWrite: {
            get: function() { return (stream.flags & 2097155) !== 0; }
          },
          isAppend: {
            get: function() { return (stream.flags & 1024); }
          }
        });
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        var done = function(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        path = PATH.normalize(path);
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        try {
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 131072)
          });
          node = lookup.node;
        } catch (e) {
          // ignore
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },staticInit:function () {
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(path, mode | 146);
          var stream = FS.open(path, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(path, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  Module["_strlen"] = _strlen;
  Module["_strcpy"] = _strcpy;
  Module["_strcat"] = _strcat;
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {} : ['binary'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          var handleMessage = function(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }
  Module["_memcmp"] = _memcmp;
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStream(stream);
      stream.eof = false;
      return 0;
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }
  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var _llvm_pow_f64=Math_pow;
  var _sin=Math_sin;
  function _strrchr(ptr, chr) {
      var ptr2 = ptr + _strlen(ptr);
      do {
        if (HEAP8[(ptr2)] == chr) return ptr2;
        ptr2--;
      } while (ptr2 >= ptr);
      return 0;
    }
  var ___strtok_state=0;
  function _strtok_r(s, delim, lasts) {
      var skip_leading_delim = 1;
      var spanp;
      var c, sc;
      var tok;
      if (s == 0 && (s = getValue(lasts, 'i8*')) == 0) {
        return 0;
      }
      cont: while (1) {
        c = getValue(s++, 'i8');
        for (spanp = delim; (sc = getValue(spanp++, 'i8')) != 0;) {
          if (c == sc) {
            if (skip_leading_delim) {
              continue cont;
            } else {
              setValue(lasts, s, 'i8*');
              setValue(s - 1, 0, 'i8');
              return s - 1;
            }
          }
        }
        break;
      }
      if (c == 0) {
        setValue(lasts, 0, 'i8*');
        return 0;
      }
      tok = s - 1;
      for (;;) {
        c = getValue(s++, 'i8');
        spanp = delim;
        do {
          if ((sc = getValue(spanp++, 'i8')) == c) {
            if (c == 0) {
              s = 0;
            } else {
              setValue(s - 1, 0, 'i8');
            }
            setValue(lasts, s, 'i8*');
            return tok;
          }
        } while (sc != 0);
      }
      abort('strtok_r error!');
    }function _strtok(s, delim) {
      return _strtok_r(s, delim, ___strtok_state);
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  Module["_strncpy"] = _strncpy;
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }function __parseInt(str, endptr, base, min, max, bits, unsign) {
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      var multiplier = 1;
      if (HEAP8[(str)] == 45) {
        multiplier = -1;
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      // Get digits.
      var chr;
      var ret = 0;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          ret = ret * finalBase + digit;
          str++;
        }
      }
      // Apply sign.
      ret *= multiplier;
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      // Unsign if needed.
      if (unsign) {
        if (Math.abs(ret) > max) {
          ret = max;
          ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          ret = unSign(ret, bits);
        }
      }
      // Validate range.
      if (ret > max || ret < min) {
        ret = ret > max ? max : min;
        ___setErrNo(ERRNO_CODES.ERANGE);
      }
      if (bits == 64) {
        return ((asm["setTempRet0"]((tempDouble=ret,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)),ret>>>0)|0);
      }
      return ret;
    }function _strtol(str, endptr, base) {
      return __parseInt(str, endptr, base, -2147483648, 2147483647, 32);  // LONG_MIN, LONG_MAX.
    }function _atoi(ptr) {
      return _strtol(ptr, null, 10);
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  function _abort() {
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
___strtok_state = Runtime.staticAlloc(4);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env._stderr|0;var n=+env.NaN;var o=+env.Infinity;var p=0;var q=0;var r=0;var s=0;var t=0,u=0,v=0,w=0,x=0.0,y=0,z=0,A=0,B=0.0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=global.Math.floor;var N=global.Math.abs;var O=global.Math.sqrt;var P=global.Math.pow;var Q=global.Math.cos;var R=global.Math.sin;var S=global.Math.tan;var T=global.Math.acos;var U=global.Math.asin;var V=global.Math.atan;var W=global.Math.atan2;var X=global.Math.exp;var Y=global.Math.log;var Z=global.Math.ceil;var _=global.Math.imul;var $=env.abort;var aa=env.assert;var ab=env.asmPrintInt;var ac=env.asmPrintFloat;var ad=env.min;var ae=env.invoke_ii;var af=env.invoke_vi;var ag=env.invoke_iiiii;var ah=env.invoke_viii;var ai=env.invoke_v;var aj=env.invoke_iii;var ak=env._strncmp;var al=env._lseek;var am=env._sysconf;var an=env._fread;var ao=env._fclose;var ap=env._strtok_r;var aq=env._abort;var ar=env._fprintf;var as=env._close;var at=env._pread;var au=env._fflush;var av=env._fopen;var aw=env._open;var ax=env._strtol;var ay=env._strtok;var az=env.___setErrNo;var aA=env.__reallyNegative;var aB=env._fseek;var aC=env._send;var aD=env._write;var aE=env._strrchr;var aF=env._sin;var aG=env._printf;var aH=env._strchr;var aI=env._read;var aJ=env._time;var aK=env.__formatString;var aL=env._atoi;var aM=env._recv;var aN=env._pwrite;var aO=env._llvm_pow_f64;var aP=env._fsync;var aQ=env.___errno_location;var aR=env._isspace;var aS=env._sbrk;var aT=env.__parseInt;var aU=env._fwrite;var aV=env._strcmp;
// EMSCRIPTEN_START_FUNCS
function a0(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function a1(){return i|0}function a2(a){a=a|0;i=a}function a3(a,b){a=a|0;b=b|0;if((p|0)==0){p=a;q=b}}function a4(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function a5(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function a6(a){a=a|0;C=a}function a7(a){a=a|0;D=a}function a8(a){a=a|0;E=a}function a9(a){a=a|0;F=a}function ba(a){a=a|0;G=a}function bb(a){a=a|0;H=a}function bc(a){a=a|0;I=a}function bd(a){a=a|0;J=a}function be(a){a=a|0;K=a}function bf(a){a=a|0;L=a}function bg(){}function bh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;i=i+1024|0;e=d|0;f=b;do{if((f|0)!=0){if((a[f]|0)==0){break}b=av(f|0,6576)|0;g=b;if((b|0)!=0){h=g;j=h;i=d;return j|0}do{if((a[f|0]|0)!=47){b=c[1664]|0;while(1){if((b|0)==0){k=16;break}a[e|0]=0;l=c1(c[b>>2]|0)|0;if((l|0)!=0){m=e|0;n=c[b>>2]|0;c2(m|0,n|0)|0;if((a[e+(l-1)|0]|0)!=47){a[e+l|0]=47;a[e+(l+1)|0]=0}}c3(e|0,f|0)|0;l=av(e|0,6576)|0;g=l;if((l|0)!=0){break}b=c[b+4>>2]|0}if((k|0)==16){break}h=g;j=h;i=d;return j|0}}while(0);h=0;j=h;i=d;return j|0}}while(0);h=0;j=h;i=d;return j|0}function bi(a){a=a|0;var b=0;b=c$(a)|0;return b|0}function bj(a){a=a|0;var b=0,d=0,e=0;b=a;a=bi(8)|0;if((a|0)==0){return}c[a>>2]=bi((c1(b|0)|0)+1|0)|0;if((c[a>>2]|0)==0){c0(a);return}else{d=c[a>>2]|0;e=b;c2(d|0,e|0)|0;c[a+4>>2]=c[1664];c[1664]=a;return}}function bk(){var a=0,b=0;a=c[1664]|0;while(1){if((a|0)==0){break}b=c[a+4>>2]|0;c0(c[a>>2]|0);c0(a);a=b}c[1664]=0;return}function bl(f,h,j,k,l,n,o,p,q){f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;j=i;i=i+1056|0;r=j|0;s=j+1024|0;t=j+1032|0;u=j+1040|0;v=j+1048|0;w=f;f=h;h=k;k=l;l=n;n=o;o=p;p=q;q=0;if((f|0)==0){x=0;y=x;i=j;return y|0}z=bh(f)|0;A=z;if((z|0)==0){z=c[m>>2]|0;ar(z|0,6512,(z=i,i=i+1|0,i=i+7&-8,c[z>>2]=0,z)|0)|0;i=z;q=1;B=0;while(1){if((c[1048+(B<<2)>>2]|0)==0){break}z=c1(f|0)|0;if((z+(c1(c[1048+(B<<2)>>2]|0)|0)|0)>>>0<1024){z=r|0;C=f;c2(z|0,C|0)|0;C=r|0;z=c[1048+(B<<2)>>2]|0;c3(C|0,z|0)|0;z=bh(r|0)|0;A=z;if((z|0)!=0){D=46;break}}B=B+1|0}if((D|0)==46){q=0;f=r|0}}if((q|0)!=0){x=0;y=x;i=j;return y|0}do{if(239==(an(r|0,1,239,A|0)|0)){if((c4(r|0,6248,22)|0)!=0){if((c4(r|0,5888,22)|0)!=0){break}}do{if((a[r+82|0]|0)!=1){if((a[r+82|0]|0)==0){break}x=0;y=x;i=j;return y|0}}while(0);do{if((a[r+151|0]|0)!=1){if((a[r+151|0]|0)==0){break}x=0;y=x;i=j;return y|0}}while(0);q=bi(8)|0;c[q>>2]=a[r+198|0]|0;c[q+4>>2]=bi((c[q>>2]|0)*116|0)|0;B=0;while(1){if((B|0)>=(c[q>>2]|0)){D=162;break}aB(A|0,7,1)|0;if(1!=(an(s|0,1,1,A|0)|0)){D=66;break}f=(c[q+4>>2]|0)+(B*116|0)|0;if(1!=(an(t|0,4,1,A|0)|0)){D=73;break}c[f+8>>2]=c[t>>2];if(1!=(an(t|0,4,1,A|0)|0)){D=75;break}c[f>>2]=c[t>>2];if(1!=(an(t|0,4,1,A|0)|0)){D=77;break}c[f+4>>2]=c[t>>2];if(1!=(an(u|0,2,1,A|0)|0)){D=79;break}c[f+12>>2]=e[u>>1]|0;if(1!=(an(t|0,4,1,A|0)|0)){D=81;break}c[f+24>>2]=c[t>>2];if(1!=(an(t|0,4,1,A|0)|0)){D=83;break}c[f+28>>2]=c[t>>2];if(1!=(an(t|0,4,1,A|0)|0)){D=85;break}c[f+32>>2]=c[t>>2];c[f+16>>2]=0;c[f+20>>2]=127;aB(A|0,2,1)|0;if(1!=(an(v|0,1,1,A|0)|0)){D=87;break}a[r|0]=a[v]|0;if((h|0)==-1){a[f+111|0]=(a[r|0]<<3)+4&127}else{a[f+111|0]=h&127}if(18!=(an(r|0,1,18,A|0)|0)){D=92;break}do{if((a[r+13|0]|0)!=0){if((a[r+14|0]|0)==0){D=95;break}c[f+92>>2]=bm(w,a[r+12|0]|0)|0;c[f+96>>2]=bn(w,a[r+13|0]|0)|0;a[f+108|0]=a[r+14|0]|0}else{D=95}}while(0);if((D|0)==95){D=0;a[f+108|0]=0;c[f+96>>2]=0;c[f+92>>2]=0}do{if((a[r+16|0]|0)!=0){if((a[r+17|0]|0)==0){D=99;break}c[f+104>>2]=bo(w,a[r+16|0]|0)|0;c[f+100>>2]=bp(w,a[r+15|0]|0,c[f+104>>2]|0)|0;a[f+109|0]=a[r+17|0]|0}else{D=99}}while(0);if((D|0)==99){D=0;a[f+109|0]=0;c[f+104>>2]=0;c[f+100>>2]=0}if(1!=(an(v|0,1,1,A|0)|0)){D=102;break}a[f+110|0]=a[v]|0;aB(A|0,40,1)|0;if((l|0)!=-1){a[f+112|0]=l&255}else{a[f+112|0]=0}if((a[f+110|0]&4|0)!=0){z=f+110|0;a[z]=(d[z]|32)&255}do{if((n|0)==1){if((a[f+110|0]&60|0)==0){break}z=f+110|0;a[z]=d[z]&-61&255}}while(0);if((o|0)==1){(a[f+110|0]&64|0)!=0;z=f+110|0;a[z]=d[z]&-65&255}else{if((o|0)!=0){if((a[f+110|0]&28|0)!=0){do{if((c4(r|0,5512,6)|0)!=0){if((a[r+11|0]|0)>=100){D=120;break}if((a[f+110|0]&32|0)==0){z=f+110|0;a[z]=d[z]&-65&255}}else{D=120}}while(0);if((D|0)==120){D=0;z=f+110|0;a[z]=d[z]&-65&255}}else{z=f+110|0;a[z]=d[z]&-97&255}}}E=0;while(1){if((E|0)>=6){break}c[f+36+(E<<2)>>2]=bq(w,a[r+E|0]|0)|0;c[f+60+(E<<2)>>2]=br(a[r+(E+6)|0]|0)|0;E=E+1|0}c[f+88>>2]=bi(c[f+8>>2]|0)|0;if(1!=(an(c[f+88>>2]|0,c[f+8>>2]|0,1,A|0)|0)){D=132;break}if((a[f+110|0]&1|0)==0){z=c[f+8>>2]|0;C=c[f+88>>2]|0;F=bi(c[f+8>>2]<<1)|0;G=F;H=F;while(1){F=z;z=F-1|0;if((F|0)==0){break}F=C;C=F+1|0;I=H;H=I+2|0;b[I>>1]=(a[F]&255)<<8&65535}C=c[f+88>>2]|0;c[f+88>>2]=G;c0(C);H=f+8|0;c[H>>2]=c[H>>2]<<1;H=f|0;c[H>>2]=c[H>>2]<<1;H=f+4|0;c[H>>2]=c[H>>2]<<1}if((a[f+110|0]&2|0)!=0){H=(c[f+8>>2]|0)/2|0;z=c[f+88>>2]|0;while(1){F=H;H=F-1|0;if((F|0)==0){break}F=z;z=F+2|0;b[F>>1]=(b[F>>1]^32768)&65535}}if((a[f+110|0]&16|0)!=0){bs(c[f+88>>2]|0,0,(c[f+8>>2]|0)/2|0);z=c[f>>2]|0;c[f>>2]=(c[f+8>>2]|0)-(c[f+4>>2]|0);c[f+4>>2]=(c[f+8>>2]|0)-z;z=f+110|0;a[z]=d[z]&-17&255;z=f+110|0;a[z]=(d[z]|4)&255}if((k|0)!=-1){g[f+84>>2]=+(k|0)/100.0}else{z=(c[f+8>>2]|0)/2|0;H=0;C=c[f+88>>2]|0;while(1){G=z;z=G-1|0;if((G|0)==0){break}G=C;C=G+2|0;F=b[G>>1]|0;if((F<<16>>16|0)<0){F=-(F<<16>>16)&65535}if((F<<16>>16|0)>(H<<16>>16|0)){H=F}}g[f+84>>2]=32768.0/+(H<<16>>16|0)}C=f+8|0;c[C>>2]=(c[C>>2]|0)/2|0;C=f|0;c[C>>2]=(c[C>>2]|0)/2|0;C=f+4|0;c[C>>2]=(c[C>>2]|0)/2|0;C=f+8|0;c[C>>2]=c[C>>2]<<12;C=f|0;c[C>>2]=c[C>>2]<<12;C=f+4|0;c[C>>2]=c[C>>2]<<12;C=f|0;c[C>>2]=c[C>>2]|(a[s]&15)<<8;C=f+4|0;c[C>>2]=c[C>>2]|(d[s]>>4&15)<<8;do{if((a[f+112|0]|0)!=0){if((a[f+110|0]&4|0)!=0){break}cF(w,f)}}while(0);if((p|0)==1){c[f+8>>2]=c[f+4>>2]}B=B+1|0}if((D|0)!=66)if((D|0)!=73)if((D|0)!=75)if((D|0)!=77)if((D|0)!=79)if((D|0)!=81)if((D|0)!=83)if((D|0)!=85)if((D|0)!=87)if((D|0)!=92)if((D|0)!=102)if((D|0)!=132)if((D|0)==162){ao(A|0)|0;x=q;y=x;i=j;return y|0}E=0;while(1){if((E|0)>=(B|0)){break}c0(c[(c[q+4>>2]|0)+(E*116|0)+88>>2]|0);E=E+1|0}c0(c[q+4>>2]|0);c0(q);x=0;y=x;i=j;return y|0}}while(0);x=0;y=x;i=j;return y|0}function bm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;if(a<<24>>24!=0){b=((c[d+13060>>2]|0)*38|0)<<16;e=(b|0)/(_(c[d+4>>2]|0,a&255)|0)|0;f=e;return f|0}else{e=0;f=e;return f|0}return 0}function bn(a,b){a=a|0;b=b|0;var d=0;d=a;a=(_(c[d+13060>>2]<<10,b&255)|0)<<5;return(a|0)/((c[d+4>>2]|0)*38|0|0)|0|0}function bo(a,b){a=a|0;b=b|0;return((c[a+4>>2]|0)*38|0|0)/((b&255)<<1<<5|0)|0|0}function bp(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=b;if(e<<24>>24!=0){f=~~(+(d|0)*38.0*65536.0/+(_(c[a+4>>2]|0,e&255)|0));g=f;return g|0}else{f=0;g=f;return g|0}return 0}function bq(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;b=3-((a&255)>>6&3)|0;b=b*3|0;b=(a&63)<<b;b=_((b*44100|0|0)/(c[d+4>>2]|0)|0,c[d+13060>>2]|0)|0;return b<<10|0}function br(a){a=a|0;return(a&255)<<22|0}function bs(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=d;d=e+(c<<1)|0;e=e+(a<<1)|0;c=c-a|0;c=(c|0)/2|0;while(1){a=c;c=a-1|0;if((a|0)==0){break}a=b[e>>1]|0;f=e;e=f+2|0;b[f>>1]=b[d>>1]|0;f=d;d=f-2|0;b[f>>1]=a}return}function bt(a){a=a|0;return c[a+13136>>2]|0}function bu(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;do{if((a|0)>=0){if((a|0)>=(c[d+13136>>2]|0)){break}e=c[d+13140+(a<<2)>>2]|0;f=e;return f|0}}while(0);e=0;f=e;return f|0}function bv(a){a=a|0;var b=0,d=0,e=0;b=a;a=128;d=0;c[b+13136>>2]=0;while(1){e=a;a=e-1|0;if((e|0)==0){break}if((c[b+28+(a<<2)>>2]|0)!=0){d=d+(bw(b,0,a)|0)|0}if((c[b+540+(a<<2)>>2]|0)!=0){d=d+(bw(b,1,a)|0)|0}}return d|0}function bw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;f=a;a=b;b=d;d=0;if((a|0)!=0){g=c[f+540+(b<<2)>>2]|0}else{g=c[f+28+(b<<2)>>2]|0}h=g;if((h|0)==0){j=0;k=j;i=e;return k|0}g=0;while(1){if((g|0)>=128){break}do{if((c[h+4+(g<<2)>>2]|0)==-1){c[h+4+(g<<2)>>2]=bB(f,a,b,g)|0;if((c[h+4+(g<<2)>>2]|0)!=0){break}if((c[(c[h>>2]|0)+(g*28|0)>>2]|0)!=0){l=f;n=c[(c[h>>2]|0)+(g*28|0)>>2]|0;o=(a|0)!=0?1:0;p=c[(c[h>>2]|0)+(g*28|0)+12>>2]|0;q=c[(c[h>>2]|0)+(g*28|0)+8>>2]|0;if((c[(c[h>>2]|0)+(g*28|0)+4>>2]|0)!=-1){r=c[(c[h>>2]|0)+(g*28|0)+4>>2]|0}else{if((a|0)!=0){s=g}else{s=-1}r=s}if((c[(c[h>>2]|0)+(g*28|0)+16>>2]|0)!=-1){t=c[(c[h>>2]|0)+(g*28|0)+16>>2]|0}else{t=(a|0)!=0?1:-1}if((c[(c[h>>2]|0)+(g*28|0)+20>>2]|0)!=-1){u=c[(c[h>>2]|0)+(g*28|0)+20>>2]|0}else{u=(a|0)!=0?1:-1}v=bl(l,n,o,p,q,r,t,u,c[(c[h>>2]|0)+(g*28|0)+24>>2]|0)|0;c[h+4+(g<<2)>>2]=v;if((v|0)==0){v=c[m>>2]|0;q=c[(c[h>>2]|0)+(g*28|0)>>2]|0;ar(v|0,5120,(v=i,i=i+8|0,c[v>>2]=q,v)|0)|0;i=v;if((c[f+13136>>2]|0)<256){q=c[m>>2]|0;p=c[f+13136>>2]|0;ar(q|0,4856,(v=i,i=i+8|0,c[v>>2]=p,v)|0)|0;i=v;c[f+13140+(c[f+13136>>2]<<2)>>2]=c[(c[h>>2]|0)+(g*28|0)>>2];v=f+13136|0;c[v>>2]=(c[v>>2]|0)+1}d=d+1|0}}else{if((b|0)!=0){if((a|0)!=0){if((c[(c[f+540>>2]|0)+4+(g<<2)>>2]|0)==0){c[(c[f+540>>2]|0)+4+(g<<2)>>2]=-1}}else{if((c[(c[f+28>>2]|0)+4+(g<<2)>>2]|0)==0){c[(c[f+28>>2]|0)+4+(g<<2)>>2]=-1}}}c[h+4+(g<<2)>>2]=0;d=d+1|0}w=246}else{w=246}}while(0);if((w|0)==246){w=0}g=g+1|0}j=d;k=j;i=e;return k|0}function bx(a){a=a|0;var b=0,d=0;b=a;a=128;while(1){d=a;a=d-1|0;if((d|0)==0){break}if((c[b+28+(a<<2)>>2]|0)!=0){by(b,0,a)}if((c[b+540+(a<<2)>>2]|0)!=0){by(b,1,a)}}return}function by(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=d;if((b|0)!=0){f=c[e+540+(a<<2)>>2]|0}else{f=c[e+28+(a<<2)>>2]|0}a=f;f=0;while(1){if((f|0)>=128){break}if((c[a+4+(f<<2)>>2]|0)!=0){if((c[a+4+(f<<2)>>2]|0)!=-1){bA(c[a+4+(f<<2)>>2]|0)}c[a+4+(f<<2)>>2]=0}f=f+1|0}return}function bz(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=bl(d,b,0,-1,-1,-1,0,0,0)|0;if((a|0)!=0){c[d+1052>>2]=a;c[d+1056>>2]=-1;e=0;f=e;return f|0}else{e=-1;f=e;return f|0}return 0}function bA(a){a=a|0;var b=0;b=a;if((b|0)==0){return}a=0;while(1){if((a|0)>=(c[b>>2]|0)){break}c0(c[(c[b+4>>2]|0)+(a*116|0)+88>>2]|0);a=a+1|0}c0(c[b+4>>2]|0);c0(b);return}function bB(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=a;a=b;b=d;d=e;if((c[f+24>>2]|0)==0){g=0;h=g;return h|0}a=(a|0)!=0?-2147483648:0;e=0;L368:while(1){if(e>>>0>=(c[(c[f+24>>2]|0)+4>>2]|0)>>>0){break}i=(c[(c[f+24>>2]|0)+8>>2]|0)+(e*20|0)|0;do{if((c[(c[i+4>>2]|0)+4>>2]&-2147483648|0)==(a|0)){if(((c[(c[i+4>>2]|0)+4>>2]|0)>>>8&255|0)!=(b|0)){break}if((c[(c[i+4>>2]|0)+8>>2]|0)==(d|0)){j=295;break L368}}}while(0);e=e+1|0}do{if((e|0)==(c[(c[f+24>>2]|0)+4>>2]|0)){if((b|0)!=0){break}e=0;while(1){if(e>>>0>=(c[(c[f+24>>2]|0)+4>>2]|0)>>>0){break}i=(c[(c[f+24>>2]|0)+8>>2]|0)+(e*20|0)|0;if((c[(c[i+4>>2]|0)+4>>2]&-2147483648|0)==(a|0)){if((c[(c[i+4>>2]|0)+8>>2]|0)==(d|0)){j=304;break}}e=e+1|0}}}while(0);if((e|0)==(c[(c[f+24>>2]|0)+4>>2]|0)){g=0;h=g;return h|0}j=bi(8)|0;c[j>>2]=c[c[i+4>>2]>>2];c[j+4>>2]=bi((c[j>>2]|0)*116|0)|0;c5(c[j+4>>2]|0,0,(c[j>>2]|0)*116|0|0);e=0;while(1){if(e>>>0>=(c[c[i+4>>2]>>2]|0)>>>0){break}bC(f,(c[j+4>>2]|0)+(e*116|0)|0,i,e);e=e+1|0}g=j;h=g;return h|0}function bC(b,f,h,i){b=b|0;f=f|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0.0,B=0.0,C=0.0,D=0.0;j=b;b=f;f=h;h=(c[f+8>>2]|0)+(i*24|0)|0;i=(c[(c[j+24>>2]|0)+20>>2]|0)+((c[(c[h+4>>2]|0)+8>>2]|0)*20|0)|0;k=1056+((e[c[h>>2]>>1]|0)<<2)|0;c[b+24>>2]=d[k]|d[k+1|0]<<8|d[k+2|0]<<16|d[k+3|0]<<24;k=1056+((e[(c[h>>2]|0)+2>>1]|0)<<2)|0;c[b+28>>2]=d[k]|d[k+1|0]<<8|d[k+2|0]<<16|d[k+3|0]<<24;k=1056+((e[(c[h+8>>2]|0)+4>>1]|0)<<2)|0;c[b+32>>2]=d[k]|d[k+1|0]<<8|d[k+2|0]<<16|d[k+3|0]<<24;c[b+16>>2]=e[(c[h>>2]|0)+4>>1]|0;c[b+20>>2]=e[(c[h>>2]|0)+6>>1]|0;a[b+110|0]=1;c[b+12>>2]=c[(c[i>>2]|0)+4>>2];c[b+8>>2]=((c[i+8>>2]|0)>>>0)/2|0;c[b+88>>2]=bi(c[i+8>>2]|0)|0;k=c[b+88>>2]|0;l=c[i+4>>2]|0;m=c[i+8>>2]|0;c6(k|0,l|0,m)|0;if((c[(c[h+8>>2]|0)+16>>2]|0)!=0){m=b+110|0;a[m]=(d[m]|0|36)&255;c[b>>2]=((c[(c[h+12>>2]|0)+8>>2]|0)>>>0)/2|0;c[b+4>>2]=(c[b>>2]|0)+(((c[(c[h+12>>2]|0)+12>>2]|0)>>>0)/2|0)}g[b+84>>2]=1.0;if((a[b+110|0]&32|0)==0){n=b;o=n+8|0;p=c[o>>2]|0;q=p<<12;c[o>>2]=q;r=b;s=r|0;t=c[s>>2]|0;u=t<<12;c[s>>2]=u;v=b;w=v+4|0;x=c[w>>2]|0;y=x<<12;c[w>>2]=y;return}m=0;l=0;do{if((c[f+12>>2]|0)!=0){if((c[(c[f+12>>2]|0)+4>>2]|0)>>>0<=0){z=326;break}if((c[f+16>>2]|0)==0){z=326;break}m=c[f+12>>2]|0;l=c[f+16>>2]|0}else{z=326}}while(0);if((z|0)==326){m=c[h+16>>2]|0;l=c[h+20>>2]|0}h=bD(c[m+4>>2]|0,l,518)|0;A=+bE(h);h=bD(c[m+4>>2]|0,l,524)|0;B=+bE(h);h=bD(c[m+4>>2]|0,l,519)|0;C=+bE(h);h=bD(c[m+4>>2]|0,l,521)|0;D=+bE(h);h=bD(c[m+4>>2]|0,l,522)|0;z=~~((1.0- +bF(h))*250.0);h=bD(c[m+4>>2]|0,l,4)|0;a[b+111|0]=~~((+bF(h)+.5)*127.0)&255;c[b+60>>2]=bG(255)|0;c[b+36>>2]=bH(j,255,c[b+12>>2]|0,A)|0;c[b+64>>2]=bG(250)|0;c[b+40>>2]=bH(j,5,c[b+12>>2]|0,B)|0;c[b+68>>2]=bG(z)|0;c[b+44>>2]=bH(j,255-z|0,c[b+12>>2]|0,C)|0;c[b+72>>2]=bG(0)|0;c[b+48>>2]=bH(j,z+5|0,c[b+12>>2]|0,D)|0;c[b+76>>2]=bG(0)|0;c[b+52>>2]=bG(1)|0;c[b+80>>2]=bG(0)|0;c[b+56>>2]=bG(1)|0;z=b+110|0;a[z]=(d[z]|0|64)&255;n=b;o=n+8|0;p=c[o>>2]|0;q=p<<12;c[o>>2]=q;r=b;s=r|0;t=c[s>>2]|0;u=t<<12;c[s>>2]=u;v=b;w=v+4|0;x=c[w>>2]|0;y=x<<12;c[w>>2]=y;return}function bD(a,b,d){a=a|0;b=b|0;d=d|0;var f=0,g=0,h=0;f=a;a=b;b=d;d=0;g=0;while(1){if(g>>>0>=f>>>0){break}h=a+(g*12|0)|0;if((e[h+4>>1]|0|0)==(b&65535|0)){do{if((e[h>>1]|0|0)==0){if((e[h+2>>1]|0|0)!=0){break}if((e[h+6>>1]|0|0)!=0){break}d=d+(c[h+8>>2]|0)|0}}while(0)}g=g+1|0}return d|0}function bE(a){a=a|0;var b=0,c=0.0,d=0.0;b=a;do{if((b|0)!=-2147483648){if((b|0)==0){break}c=+P(2.0,+(+((b|0)/65536|0|0)/1200.0))*1.0e3;d=c;return+d}}while(0);c=0.0;d=c;return+d}function bF(a){a=a|0;return+(+((a|0)/65536|0|0)/1.0e3)}function bG(a){a=a|0;return a<<22|0}function bH(a,b,d,e){a=a|0;b=b|0;d=d|0;e=+e;var f=0.0;d=a;a=b;f=e;if(f<6.0){f=6.0}if((a|0)==0){a=255}a=a<<22;return~~(+(a|0)/+(c[d+4>>2]|0)*+(c[d+13060>>2]|0)*1.0e3/f)|0}function bI(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0;f=b;b=e;e=c[f+1724+(b*236|0)+220>>2]|0;if((e|0)>5){a[f+1724+(b*236|0)|0]=0;g=1;h=g;return h|0}if((a[(c[f+1724+(b*236|0)+4>>2]|0)+110|0]&64|0)!=0){if((d[f+1724+(b*236|0)|0]|0|0)==1){i=361}else{if((d[f+1724+(b*236|0)|0]|0|0)==2){i=361}}do{if((i|0)==361){if((e|0)<=2){break}c[f+1724+(b*236|0)+32>>2]=0;g=0;h=g;return h|0}}while(0)}c[f+1724+(b*236|0)+220>>2]=e+1;if((c[f+1724+(b*236|0)+24>>2]|0)==(c[(c[f+1724+(b*236|0)+4>>2]|0)+60+(e<<2)>>2]|0)){g=bI(f,b)|0;h=g;return h|0}c[f+1724+(b*236|0)+28>>2]=c[(c[f+1724+(b*236|0)+4>>2]|0)+60+(e<<2)>>2];c[f+1724+(b*236|0)+32>>2]=c[(c[f+1724+(b*236|0)+4>>2]|0)+36+(e<<2)>>2];if((c[f+1724+(b*236|0)+28>>2]|0)<(c[f+1724+(b*236|0)+24>>2]|0)){c[f+1724+(b*236|0)+32>>2]=-(c[f+1724+(b*236|0)+32>>2]|0)}g=0;h=g;return h|0}function bJ(b,e){b=b|0;e=e|0;var f=0,i=0.0,j=0,l=0.0;f=b;b=e;i=+g[f+1724+(b*236|0)+68>>2];if((c[f+1724+(b*236|0)+232>>2]|0)!=0){if((c[f+1724+(b*236|0)+48>>2]|0)!=0){i=i*+g[f+1724+(b*236|0)+76>>2]}if((a[(c[f+1724+(b*236|0)+4>>2]|0)+110|0]&64|0)!=0){e=8+(c[f+1724+(b*236|0)+24>>2]>>23<<3)|0;i=i*(c[k>>2]=d[e]|d[e+1|0]<<8|d[e+2|0]<<16|d[e+3|0]<<24,c[k+4>>2]=d[e+4|0]|d[e+5|0]<<8|d[e+6|0]<<16|d[e+7|0]<<24,+h[k>>3])}j=~~(i*4096.0);if((j|0)>8191){j=8191}c[f+1724+(b*236|0)+60>>2]=j;return}l=+g[f+1724+(b*236|0)+72>>2];if((c[f+1724+(b*236|0)+48>>2]|0)!=0){i=i*+g[f+1724+(b*236|0)+76>>2];l=l*+g[f+1724+(b*236|0)+76>>2]}if((a[(c[f+1724+(b*236|0)+4>>2]|0)+110|0]&64|0)!=0){e=8+(c[f+1724+(b*236|0)+24>>2]>>23<<3)|0;i=i*(c[k>>2]=d[e]|d[e+1|0]<<8|d[e+2|0]<<16|d[e+3|0]<<24,c[k+4>>2]=d[e+4|0]|d[e+5|0]<<8|d[e+6|0]<<16|d[e+7|0]<<24,+h[k>>3]);e=8+(c[f+1724+(b*236|0)+24>>2]>>23<<3)|0;l=l*(c[k>>2]=d[e]|d[e+1|0]<<8|d[e+2|0]<<16|d[e+3|0]<<24,c[k+4>>2]=d[e+4|0]|d[e+5|0]<<8|d[e+6|0]<<16|d[e+7|0]<<24,+h[k>>3])}j=~~(i*4096.0);if((j|0)>8191){j=8191}e=~~(l*4096.0);if((e|0)>8191){e=8191}c[f+1724+(b*236|0)+60>>2]=j;c[f+1724+(b*236|0)+64>>2]=e;return}function bK(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;h=i;i=i+8|0;j=h|0;k=b;b=e;e=f;c[j>>2]=g;g=k+1724+(e*236|0)|0;if((d[g|0]|0|0)==4){if((c[j>>2]|0)>=20){c[j>>2]=20}l=cy(k,e,j)|0;bL(k,l,b,e,c[j>>2]|0);a[g|0]=0;i=h;return}l=cy(k,e,j)|0;if((c[k+8>>2]&1|0)!=0){do{if((c[g+32>>2]|0)!=0){m=402}else{if((c[g+48>>2]|0)!=0){m=402;break}bN(k,l,b,e,c[j>>2]|0)}}while(0);if((m|0)==402){bM(k,l,b,e,c[j>>2]|0)}}else{if((c[g+232>>2]|0)==0){do{if((c[g+32>>2]|0)!=0){m=408}else{if((c[g+48>>2]|0)!=0){m=408;break}bP(k,l,b,e,c[j>>2]|0)}}while(0);if((m|0)==408){bO(k,l,b,e,c[j>>2]|0)}}else{if((c[g+232>>2]|0)==3){do{if((c[g+32>>2]|0)!=0){m=414}else{if((c[g+48>>2]|0)!=0){m=414;break}bR(k,l,b,e,c[j>>2]|0)}}while(0);if((m|0)==414){bQ(k,l,b,e,c[j>>2]|0)}}else{if((c[g+232>>2]|0)==2){b=b+4|0}do{if((c[g+32>>2]|0)!=0){m=421}else{if((c[g+48>>2]|0)!=0){m=421;break}bT(k,l,b,e,c[j>>2]|0)}}while(0);if((m|0)==421){bS(k,l,b,e,c[j>>2]|0)}}}}i=h;return}function bL(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;h=a;a=d;d=e;e=f;f=g;g=0;if((f|0)==0){f=1}i=c[h+1724+(e*236|0)+60>>2]|0;j=-((i|0)/(f|0)|0)|0;if((j|0)==0){j=-1}if((c[h+8>>2]&1|0)!=0){while(1){k=f;f=k-1|0;if((k|0)==0){l=474;break}i=i+j|0;if((i|0)<0){l=472;break}k=a;a=k+2|0;g=b[k>>1]|0;k=_(i,g<<16>>16)|0;m=d;d=m+4|0;c[m>>2]=(c[m>>2]|0)+k}if((l|0)==472){return}else if((l|0)==474){return}}if((c[h+1724+(e*236|0)+232>>2]|0)==0){k=c[h+1724+(e*236|0)+64>>2]|0;m=-((k|0)/(f|0)|0)|0;while(1){n=f;f=n-1|0;if((n|0)==0){break}i=i+j|0;if((i|0)<0){i=0}k=k+m|0;if((k|0)<0){k=0}n=a;a=n+2|0;g=b[n>>1]|0;n=_(i,g<<16>>16)|0;o=d;d=o+4|0;c[o>>2]=(c[o>>2]|0)+n;n=_(k,g<<16>>16)|0;o=d;d=o+4|0;c[o>>2]=(c[o>>2]|0)+n}}else{do{if((c[h+1724+(e*236|0)+232>>2]|0)==3){while(1){k=f;f=k-1|0;if((k|0)==0){l=450;break}i=i+j|0;if((i|0)<0){break}k=a;a=k+2|0;g=b[k>>1]|0;k=_(i,g<<16>>16)|0;m=d;d=m+4|0;c[m>>2]=(c[m>>2]|0)+k;k=_(i,g<<16>>16)|0;m=d;d=m+4|0;c[m>>2]=(c[m>>2]|0)+k}if((l|0)==450){break}return}else{do{if((c[h+1724+(e*236|0)+232>>2]|0)==1){while(1){k=f;f=k-1|0;if((k|0)==0){l=457;break}i=i+j|0;if((i|0)<0){break}k=a;a=k+2|0;g=b[k>>1]|0;k=_(i,g<<16>>16)|0;m=d;d=m+4|0;c[m>>2]=(c[m>>2]|0)+k;d=d+4|0}if((l|0)==457){break}return}else{do{if((c[h+1724+(e*236|0)+232>>2]|0)==2){while(1){k=f;f=k-1|0;if((k|0)==0){l=464;break}i=i+j|0;if((i|0)<0){break}k=a;a=k+2|0;g=b[k>>1]|0;d=d+4|0;k=_(i,g<<16>>16)|0;m=d;d=m+4|0;c[m>>2]=(c[m>>2]|0)+k}if((l|0)==464){break}return}}while(0)}}while(0)}}while(0)}return}function bM(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=a;a=d;d=e;e=f;f=g;g=h+1724+(e*236|0)|0;i=c[g+60>>2]|0;j=c[g+224>>2]|0;k=j;do{if((j|0)==0){k=c[h+13060>>2]|0;if((bU(h,e)|0)==0){i=c[g+60>>2]|0;break}return}}while(0);while(1){if((f|0)==0){l=502;break}if((k|0)>=(f|0)){l=495;break}f=f-k|0;while(1){j=k;k=j-1|0;if((j|0)==0){break}j=a;a=j+2|0;m=b[j>>1]|0;j=_(i,m<<16>>16)|0;n=d;d=n+4|0;c[n>>2]=(c[n>>2]|0)+j}k=c[h+13060>>2]|0;if((bU(h,e)|0)!=0){l=493;break}i=c[g+60>>2]|0}if((l|0)==502){return}else if((l|0)==493){return}else if((l|0)==495){c[g+224>>2]=k-f;while(1){k=f;f=k-1|0;if((k|0)==0){break}k=a;a=k+2|0;m=b[k>>1]|0;k=_(i,m<<16>>16)|0;g=d;d=g+4|0;c[g>>2]=(c[g>>2]|0)+k}return}}function bN(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=d;d=e;e=g;g=c[a+1724+(f*236|0)+60>>2]|0;while(1){f=e;e=f-1|0;if((f|0)==0){break}f=h;h=f+2|0;a=_(g,b[f>>1]|0)|0;f=d;d=f+4|0;c[f>>2]=(c[f>>2]|0)+a}return}function bO(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;h=a;a=d;d=e;e=f;f=g;g=h+1724+(e*236|0)|0;i=c[g+60>>2]|0;j=c[g+64>>2]|0;k=c[g+224>>2]|0;l=k;do{if((k|0)==0){l=c[h+13060>>2]|0;if((bU(h,e)|0)==0){i=c[g+60>>2]|0;j=c[g+64>>2]|0;break}return}}while(0);while(1){if((f|0)==0){m=530;break}if((l|0)>=(f|0)){m=522;break}f=f-l|0;while(1){k=l;l=k-1|0;if((k|0)==0){break}k=a;a=k+2|0;n=b[k>>1]|0;k=_(i,n<<16>>16)|0;o=d;d=o+4|0;c[o>>2]=(c[o>>2]|0)+k;k=_(j,n<<16>>16)|0;o=d;d=o+4|0;c[o>>2]=(c[o>>2]|0)+k}l=c[h+13060>>2]|0;if((bU(h,e)|0)!=0){m=520;break}i=c[g+60>>2]|0;j=c[g+64>>2]|0}if((m|0)==522){c[g+224>>2]=l-f;while(1){l=f;f=l-1|0;if((l|0)==0){break}l=a;a=l+2|0;n=b[l>>1]|0;l=_(i,n<<16>>16)|0;g=d;d=g+4|0;c[g>>2]=(c[g>>2]|0)+l;l=_(j,n<<16>>16)|0;g=d;d=g+4|0;c[g>>2]=(c[g>>2]|0)+l}return}else if((m|0)==520){return}else if((m|0)==530){return}}function bP(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=a;a=d;d=e;e=f;f=g;g=c[h+1724+(e*236|0)+60>>2]|0;i=c[h+1724+(e*236|0)+64>>2]|0;while(1){e=f;f=e-1|0;if((e|0)==0){break}e=a;a=e+2|0;h=b[e>>1]|0;e=_(g,h<<16>>16)|0;j=d;d=j+4|0;c[j>>2]=(c[j>>2]|0)+e;e=_(i,h<<16>>16)|0;h=d;d=h+4|0;c[h>>2]=(c[h>>2]|0)+e}return}function bQ(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=a;a=d;d=e;e=f;f=g;g=h+1724+(e*236|0)|0;i=c[g+60>>2]|0;j=c[g+224>>2]|0;k=j;do{if((j|0)==0){k=c[h+13060>>2]|0;if((bU(h,e)|0)==0){i=c[g+60>>2]|0;break}return}}while(0);while(1){if((f|0)==0){l=556;break}if((k|0)>=(f|0)){l=549;break}f=f-k|0;while(1){j=k;k=j-1|0;if((j|0)==0){break}j=a;a=j+2|0;m=b[j>>1]|0;j=_(i,m<<16>>16)|0;n=d;d=n+4|0;c[n>>2]=(c[n>>2]|0)+j;j=_(i,m<<16>>16)|0;n=d;d=n+4|0;c[n>>2]=(c[n>>2]|0)+j}k=c[h+13060>>2]|0;if((bU(h,e)|0)!=0){l=547;break}i=c[g+60>>2]|0}if((l|0)==549){c[g+224>>2]=k-f;while(1){k=f;f=k-1|0;if((k|0)==0){break}k=a;a=k+2|0;m=b[k>>1]|0;k=_(i,m<<16>>16)|0;g=d;d=g+4|0;c[g>>2]=(c[g>>2]|0)+k;k=_(i,m<<16>>16)|0;g=d;d=g+4|0;c[g>>2]=(c[g>>2]|0)+k}return}else if((l|0)==556){return}else if((l|0)==547){return}}function bR(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0;h=d;d=e;e=g;g=c[a+1724+(f*236|0)+60>>2]|0;while(1){f=e;e=f-1|0;if((f|0)==0){break}f=h;h=f+2|0;a=b[f>>1]|0;f=_(g,a<<16>>16)|0;i=d;d=i+4|0;c[i>>2]=(c[i>>2]|0)+f;f=_(g,a<<16>>16)|0;a=d;d=a+4|0;c[a>>2]=(c[a>>2]|0)+f}return}function bS(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=a;a=d;d=e;e=f;f=g;g=h+1724+(e*236|0)|0;i=c[g+60>>2]|0;j=c[g+224>>2]|0;k=j;do{if((j|0)==0){k=c[h+13060>>2]|0;if((bU(h,e)|0)==0){i=c[g+60>>2]|0;break}return}}while(0);while(1){if((f|0)==0){l=582;break}if((k|0)>=(f|0)){l=576;break}f=f-k|0;while(1){j=k;k=j-1|0;if((j|0)==0){break}j=a;a=j+2|0;m=b[j>>1]|0;j=_(i,m<<16>>16)|0;n=d;d=n+4|0;c[n>>2]=(c[n>>2]|0)+j;d=d+4|0}k=c[h+13060>>2]|0;if((bU(h,e)|0)!=0){l=574;break}i=c[g+60>>2]|0}if((l|0)==582){return}else if((l|0)==576){c[g+224>>2]=k-f;while(1){k=f;f=k-1|0;if((k|0)==0){break}k=a;a=k+2|0;m=b[k>>1]|0;k=_(i,m<<16>>16)|0;g=d;d=g+4|0;c[g>>2]=(c[g>>2]|0)+k;d=d+4|0}return}else if((l|0)==574){return}}function bT(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=d;d=e;e=g;g=c[a+1724+(f*236|0)+60>>2]|0;while(1){f=e;e=f-1|0;if((f|0)==0){break}f=h;h=f+2|0;a=_(g,b[f>>1]|0)|0;f=d;d=f+4|0;c[f>>2]=(c[f>>2]|0)+a;d=d+4|0}return}function bU(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;do{if((c[d+1724+(a*236|0)+32>>2]|0)!=0){if((bV(d,a)|0)==0){break}e=1;f=e;return f|0}}while(0);if((c[d+1724+(a*236|0)+48>>2]|0)!=0){bW(d,a)}bJ(d,a);e=0;f=e;return f|0}function bV(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;b=d+1724+(a*236|0)+24|0;c[b>>2]=(c[b>>2]|0)+(c[d+1724+(a*236|0)+32>>2]|0);if((c[d+1724+(a*236|0)+32>>2]|0)<0){if((c[d+1724+(a*236|0)+24>>2]|0)<=(c[d+1724+(a*236|0)+28>>2]|0)){e=603}else{e=601}}else{e=601}do{if((e|0)==601){if((c[d+1724+(a*236|0)+32>>2]|0)<=0){break}if((c[d+1724+(a*236|0)+24>>2]|0)>=(c[d+1724+(a*236|0)+28>>2]|0)){e=603}}}while(0);do{if((e|0)==603){c[d+1724+(a*236|0)+24>>2]=c[d+1724+(a*236|0)+28>>2];if((bI(d,a)|0)==0){break}f=1;g=f;return g|0}}while(0);f=0;g=f;return g|0}function bW(a,b){a=a|0;b=b|0;var e=0,f=0;e=a;a=b;b=(d[(c[e+1724+(a*236|0)+4>>2]|0)+108|0]|0)<<7;if((c[e+1724+(a*236|0)+36>>2]|0)!=0){f=e+1724+(a*236|0)+40|0;c[f>>2]=(c[f>>2]|0)+(c[e+1724+(a*236|0)+36>>2]|0);if((c[e+1724+(a*236|0)+40>>2]|0)>=65536){c[e+1724+(a*236|0)+36>>2]=0}else{b=_(b,c[e+1724+(a*236|0)+40>>2]|0)|0;b=b>>16}}f=e+1724+(a*236|0)+44|0;c[f>>2]=(c[f>>2]|0)+(c[e+1724+(a*236|0)+48>>2]|0);g[e+1724+(a*236|0)+76>>2]=1.0-(+R(+(+(c[e+1724+(a*236|0)+44>>2]>>5|0)*.006135923151542565))+1.0)*+(b|0)*1.0*762939453125.0e-17;return}function bX(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;f=d;d=e;e=b;while(1){b=d;d=b-1|0;if((b|0)==0){break}b=f;f=b+4|0;g=c[b>>2]>>21;if((g|0)>127){g=127}else{if((g|0)<-128){g=-128}}b=e;e=b+1|0;a[b]=g&255}return}function bY(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;f=d;d=e;e=b;while(1){b=d;d=b-1|0;if((b|0)==0){break}b=f;f=b+4|0;g=c[b>>2]>>21;if((g|0)>127){g=127}else{if((g|0)<-128){g=-128}}b=e;e=b+1|0;a[b]=(128^g&255)&255}return}function bZ(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0;f=d;d=e;e=a;while(1){a=d;d=a-1|0;if((a|0)==0){break}a=f;f=a+4|0;g=c[a>>2]>>13;if((g|0)>32767){g=32767}else{if((g|0)<-32768){g=-32768}}a=e;e=a+2|0;b[a>>1]=g&65535}return}function b_(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0;f=d;d=e;e=a;while(1){a=d;d=a-1|0;if((a|0)==0){break}a=f;f=a+4|0;g=c[a>>2]>>13;if((g|0)>32767){g=32767}else{if((g|0)<-32768){g=-32768}}a=e;e=a+2|0;b[a>>1]=(32768^g&65535)&65535}return}function b$(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0;f=d;d=e;e=a;while(1){a=d;d=a-1|0;if((a|0)==0){break}a=f;f=a+4|0;g=c[a>>2]>>13;if((g|0)>32767){g=32767}else{if((g|0)<-32768){g=-32768}}a=e;e=a+2|0;b[a>>1]=(((g&65535)<<16>>16&255)<<8|(g&65535)<<16>>16>>8&255)&65535}return}function b0(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;i=i+8|0;h=g|0;c[h>>2]=0;a[h+5|0]=1;a[h+4|0]=d&255;a[h+6|0]=e&255;a[h+7|0]=f&255;b1(b,h);i=g;return}function b1(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0;f=b;b=e;e=c[f+13052>>2]|0;g=-1;h=2147483647;if(0==(b|0)){i=c[f+13080>>2]|0}else{i=b}while(1){b=e;e=b-1|0;if((b|0)==0){break}if((d[f+1724+(e*236|0)|0]|0|0)==0){g=e}else{do{if((d[f+1724+(e*236|0)+1|0]|0|0)==(d[i+4|0]|0|0)){if((d[f+1724+(e*236|0)+2|0]|0|0)!=(d[i+6|0]|0|0)){if((c[f+1084+((d[f+1724+(e*236|0)+1|0]|0)*40|0)+28>>2]|0)==0){break}}ch(f,e)}}while(0)}}if((g|0)!=-1){cn(f,i,g);return}e=c[f+13052>>2]|0;while(1){b=e;e=b-1|0;if((b|0)==0){break}do{if((d[f+1724+(e*236|0)|0]|0|0)!=1){if((d[f+1724+(e*236|0)|0]|0|0)==4){break}b=c[f+1724+(e*236|0)+60>>2]|0;do{if((c[f+1724+(e*236|0)+232>>2]|0)==0){if((c[f+1724+(e*236|0)+64>>2]|0)<=(b|0)){break}b=c[f+1724+(e*236|0)+64>>2]|0}}while(0);if((b|0)<(h|0)){h=b;g=e}}}while(0)}if((g|0)!=-1){e=f+13068|0;c[e>>2]=(c[e>>2]|0)+1;a[f+1724+(g*236|0)|0]=0;cn(f,i,g);return}else{g=f+13064|0;c[g>>2]=(c[g>>2]|0)+1;return}}function b2(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=b;b=e;e=c[f+13052>>2]|0;if(0==(b|0)){g=c[f+13080>>2]|0}else{g=b}L890:while(1){b=e;e=b-1|0;if((b|0)==0){h=709;break}do{if((d[f+1724+(e*236|0)|0]|0|0)==1){if((d[f+1724+(e*236|0)+1|0]|0|0)!=(d[g+4|0]|0|0)){break}if((d[f+1724+(e*236|0)+2|0]|0|0)==(d[g+6|0]|0|0)){break L890}}}while(0)}if((h|0)==709){return}if((c[f+1084+((d[g+4|0]|0)*40|0)+12>>2]|0)!=0){a[f+1724+(e*236|0)|0]=2}else{ci(f,e)}return}function b3(a){a=a|0;var b=0;b=a;c[b>>2]=1;b4(b);b5(b,0);return}function b4(a){a=a|0;var b=0;b=a;g[b+16>>2]=+(c[b+20>>2]|0)/100.0;return}function b5(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;if((c[d+13088>>2]|0)>(a|0)){c[d+13088>>2]=0}ck(d);c[d+13080>>2]=c[d+13076>>2];c[392]=5e5;if((a|0)==0){return}cl(d,a);return}function b6(b,e,f,h){b=b|0;e=e|0;f=f|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0;j=i;i=i+8|0;k=j|0;l=b;c[k>>2]=e;e=h;if((c[l>>2]|0)==0){m=0;n=m;i=j;return n|0}h=(f>>>0)/((c[l+12>>2]|0)>>>0)|0;f=c[l+13088>>2]|0;b=(c[l+13088>>2]|0)+h|0;L920:while(1){if((c[l+13088>>2]|0)>=(b|0)){o=758;break}while(1){if(~~(+(c[c[l+13080>>2]>>2]|0)/+g[258])>>>0>(c[l+13088>>2]|0)>>>0){break}switch(d[(c[l+13080>>2]|0)+5|0]|0){case 99:{if(0==(e|0)){o=752;break L920}break};case 6:{c[l+1084+((d[(c[l+13080>>2]|0)+4|0]|0)*40|0)+12>>2]=d[(c[l+13080>>2]|0)+6|0]|0;if((a[(c[l+13080>>2]|0)+6|0]|0)==0){ca(l)}break};case 3:{b7(l);break};case 11:{c[l+1084+((d[(c[l+13080>>2]|0)+4|0]|0)*40|0)+32>>2]=d[(c[l+13080>>2]|0)+6|0]|0;g[l+1084+((d[(c[l+13080>>2]|0)+4|0]|0)*40|0)+36>>2]=0.0;break};case 14:{cc(l);break};case 12:{cd(l);break};case 13:{cb(l,d[(c[l+13080>>2]|0)+4|0]|0);break};case 9:{if((c[l+13056>>2]&1<<d[(c[l+13080>>2]|0)+4|0]|0)!=0){c[l+1084+((d[(c[l+13080>>2]|0)+4|0]|0)*40|0)>>2]=d[(c[l+13080>>2]|0)+6|0]|0}else{c[l+1084+((d[(c[l+13080>>2]|0)+4|0]|0)*40|0)+4>>2]=d[(c[l+13080>>2]|0)+6|0]|0}break};case 5:{c[l+1084+((d[(c[l+13080>>2]|0)+4|0]|0)*40|0)+16>>2]=d[(c[l+13080>>2]|0)+6|0]|0;break};case 7:{c[l+1084+((d[(c[l+13080>>2]|0)+4|0]|0)*40|0)+24>>2]=d[(c[l+13080>>2]|0)+6|0]|0;b9(l);break};case 1:{if((a[(c[l+13080>>2]|0)+7|0]|0)!=0){b1(l,0)}else{b2(l,0)}break};case 15:{c[l+1084+((d[(c[l+13080>>2]|0)+4|0]|0)*40|0)>>2]=d[(c[l+13080>>2]|0)+6|0]|0;break};case 10:{c[392]=(d[(c[l+13080>>2]|0)+4|0]|0)+(d[(c[l+13080>>2]|0)+7|0]<<8)+(d[(c[l+13080>>2]|0)+6|0]<<16);break};case 8:{c[l+1084+((d[(c[l+13080>>2]|0)+4|0]|0)*40|0)+20>>2]=(d[(c[l+13080>>2]|0)+6|0]|0)+(d[(c[l+13080>>2]|0)+7|0]<<7);g[l+1084+((d[(c[l+13080>>2]|0)+4|0]|0)*40|0)+36>>2]=0.0;b8(l);break};case 4:{c[l+1084+((d[(c[l+13080>>2]|0)+4|0]|0)*40|0)+8>>2]=d[(c[l+13080>>2]|0)+6|0]|0;b9(l);break};case 2:{b2(l,0);break};default:{}}p=l+13080|0;c[p>>2]=(c[p>>2]|0)+8}if(~~(+(c[c[l+13080>>2]>>2]|0)/+g[258])>>>0>b>>>0){ce(l,k,b-(c[l+13088>>2]|0)|0)}else{ce(l,k,~~(+(c[c[l+13080>>2]>>2]|0)/+g[258])-(c[l+13088>>2]|0)|0)}}if((o|0)==752){c[l>>2]=0;m=_((c[l+13088>>2]|0)-f|0,c[l+12>>2]|0)|0;n=m;i=j;return n|0}else if((o|0)==758){m=_(h,c[l+12>>2]|0)|0;n=m;i=j;return n|0}return 0}function b7(b){b=b|0;var e=0,f=0,g=0,h=0;e=b;b=c[e+13080>>2]|0;f=c[e+13052>>2]|0;L967:while(1){g=f;f=g-1|0;if((g|0)==0){h=772;break}do{if((d[e+1724+(f*236|0)|0]|0|0)==1){if((d[e+1724+(f*236|0)+1|0]|0|0)!=(d[b+4|0]|0|0)){break}if((d[e+1724+(f*236|0)+2|0]|0|0)==(d[b+6|0]|0|0)){break L967}}}while(0)}if((h|0)==772){return}a[e+1724+(f*236|0)+3|0]=a[b+7|0]|0;cf(e,f);bJ(e,f);return}function b8(a){a=a|0;var b=0,e=0,f=0;b=a;a=d[(c[b+13080>>2]|0)+4|0]|0;e=c[b+13052>>2]|0;while(1){f=e;e=f-1|0;if((f|0)==0){break}do{if((d[b+1724+(e*236|0)|0]|0|0)!=0){if((d[b+1724+(e*236|0)+1|0]|0|0)!=(a|0)){break}cj(b,e)}}while(0)}return}function b9(a){a=a|0;var b=0,e=0,f=0;b=a;a=d[(c[b+13080>>2]|0)+4|0]|0;e=c[b+13052>>2]|0;while(1){f=e;e=f-1|0;if((f|0)==0){break}do{if((d[b+1724+(e*236|0)+1|0]|0|0)==(a|0)){if((d[b+1724+(e*236|0)|0]|0|0)!=1){if((d[b+1724+(e*236|0)|0]|0|0)!=2){break}}cf(b,e);bJ(b,e)}}while(0)}return}function ca(a){a=a|0;var b=0,e=0,f=0;b=a;a=c[b+13052>>2]|0;e=d[(c[b+13080>>2]|0)+4|0]|0;while(1){f=a;a=f-1|0;if((f|0)==0){break}do{if((d[b+1724+(a*236|0)|0]|0|0)==2){if((d[b+1724+(a*236|0)+1|0]|0|0)!=(e|0)){break}ci(b,a)}}while(0)}return}function cb(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d+1084+(a*40|0)+8>>2]=90;c[d+1084+(a*40|0)+24>>2]=127;c[d+1084+(a*40|0)+12>>2]=0;c[d+1084+(a*40|0)+20>>2]=8192;g[d+1084+(a*40|0)+36>>2]=0.0;return}function cc(b){b=b|0;var e=0,f=0,g=0;e=b;b=c[e+13052>>2]|0;f=d[(c[e+13080>>2]|0)+4|0]|0;while(1){g=b;b=g-1|0;if((g|0)==0){break}do{if((d[e+1724+(b*236|0)|0]|0|0)==1){if((d[e+1724+(b*236|0)+1|0]|0|0)!=(f|0)){break}if((c[e+1084+(f*40|0)+12>>2]|0)!=0){a[e+1724+(b*236|0)|0]=2}else{ci(e,b)}}}while(0)}return}function cd(a){a=a|0;var b=0,e=0,f=0;b=a;a=c[b+13052>>2]|0;e=d[(c[b+13080>>2]|0)+4|0]|0;while(1){f=a;a=f-1|0;if((f|0)==0){break}do{if((d[b+1724+(a*236|0)+1|0]|0|0)==(e|0)){if((d[b+1724+(a*236|0)|0]|0|0)==0){break}if((d[b+1724+(a*236|0)|0]|0|0)==4){break}ch(b,a)}}while(0)}return}function ce(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=a;a=b;b=d;if((c[e+8>>2]&1|0)!=0){f=1}else{f=2}while(1){if((b|0)==0){break}d=b;if((d|0)>(c[e+1064>>2]|0)){d=c[e+1064>>2]|0}cg(e,d);g=c[e+1060>>2]|0;h=c[a>>2]|0;i=c[e+1072>>2]|0;j=_(f,d)|0;aZ[g&15](h,i,j);j=_(c[e+12>>2]|0,d)|0;i=a;c[i>>2]=(c[i>>2]|0)+j;b=b-d|0}return}function cf(a,b){a=a|0;b=b|0;var e=0,f=0,h=0;e=a;a=b;b=_(d[e+1724+(a*236|0)+3|0]|0,c[e+1084+((d[e+1724+(a*236|0)+1|0]|0)*40|0)+8>>2]|0)|0;f=_(b,c[e+1084+((d[e+1724+(a*236|0)+1|0]|0)*40|0)+24>>2]|0)|0;if((c[e+8>>2]&1|0)!=0){c[e+1724+(a*236|0)+232>>2]=3;g[e+1724+(a*236|0)+68>>2]=+(f|0)*+g[(c[e+1724+(a*236|0)+4>>2]|0)+84>>2]*+g[e+16>>2]*4.76837158203125e-7;return}do{if((c[e+1724+(a*236|0)+228>>2]|0)>60){if((c[e+1724+(a*236|0)+228>>2]|0)>=68){h=827;break}c[e+1724+(a*236|0)+232>>2]=3;g[e+1724+(a*236|0)+68>>2]=+(f|0)*+g[(c[e+1724+(a*236|0)+4>>2]|0)+84>>2]*+g[e+16>>2]*4.76837158203125e-7}else{h=827}}while(0);if((h|0)==827){if((c[e+1724+(a*236|0)+228>>2]|0)<5){c[e+1724+(a*236|0)+232>>2]=1;g[e+1724+(a*236|0)+68>>2]=+(f|0)*+g[(c[e+1724+(a*236|0)+4>>2]|0)+84>>2]*+g[e+16>>2]*9.5367431640625e-7}else{if((c[e+1724+(a*236|0)+228>>2]|0)>123){c[e+1724+(a*236|0)+232>>2]=2;g[e+1724+(a*236|0)+68>>2]=+(f|0)*+g[(c[e+1724+(a*236|0)+4>>2]|0)+84>>2]*+g[e+16>>2]*9.5367431640625e-7}else{c[e+1724+(a*236|0)+232>>2]=0;g[e+1724+(a*236|0)+68>>2]=+(f|0)*+g[(c[e+1724+(a*236|0)+4>>2]|0)+84>>2]*+g[e+16>>2]*7.450580596923828e-9;g[e+1724+(a*236|0)+72>>2]=+g[e+1724+(a*236|0)+68>>2]*+(c[e+1724+(a*236|0)+228>>2]|0);f=e+1724+(a*236|0)+68|0;g[f>>2]=+g[f>>2]*+(127-(c[e+1724+(a*236|0)+228>>2]|0)|0)}}}return}function cg(a,b){a=a|0;b=b|0;var e=0,f=0;e=a;a=b;if((c[e+8>>2]&1|0)!=0){f=a<<2}else{f=a<<3}c5(c[e+1072>>2]|0,0,f|0);f=0;while(1){if((f|0)>=(c[e+13052>>2]|0)){break}if((d[e+1724+(f*236|0)|0]|0|0)!=0){bK(e,c[e+1072>>2]|0,f,a)}f=f+1|0}f=e+13088|0;c[f>>2]=(c[f>>2]|0)+a;return}function ch(b,c){b=b|0;c=c|0;a[b+1724+(c*236|0)|0]=4;return}function ci(b,d){b=b|0;d=d|0;var e=0,f=0;e=b;b=d;if((a[(c[e+1724+(b*236|0)+4>>2]|0)+110|0]&64|0)!=0){c[e+1724+(b*236|0)+220>>2]=3;a[e+1724+(b*236|0)|0]=3;d=e;f=b;bI(d,f)|0;bJ(e,b);return}else{a[e+1724+(b*236|0)|0]=3;return}}function cj(a,b){a=a|0;b=b|0;var e=0,f=0,i=0,j=0,l=0,m=0.0;e=a;a=b;b=(c[e+1724+(a*236|0)+20>>2]|0)<0|0;f=c[e+1084+((d[e+1724+(a*236|0)+1|0]|0)*40|0)+20>>2]|0;if((c[(c[e+1724+(a*236|0)+4>>2]|0)+12>>2]|0)==0){return}if((c[e+1724+(a*236|0)+212>>2]|0)!=0){i=32;while(1){j=i;i=j-1|0;if((j|0)==0){break}c[e+1724+(a*236|0)+80+(i<<2)>>2]=0}}do{if((f|0)==8192){l=866}else{if((f|0)<0){l=866;break}if((f|0)>16383){l=866;break}f=f-8192|0;if(+g[e+1084+((d[e+1724+(a*236|0)+1|0]|0)*40|0)+36>>2]==0.0){i=_(f,c[e+1084+((d[e+1724+(a*236|0)+1|0]|0)*40|0)+32>>2]|0)|0;if((f|0)<0){i=-i|0}j=1704+((i>>5&255)<<3)|0;m=(c[k>>2]=d[j]|d[j+1|0]<<8|d[j+2|0]<<16|d[j+3|0]<<24,c[k+4>>2]=d[j+4|0]|d[j+5|0]<<8|d[j+6|0]<<16|d[j+7|0]<<24,+h[k>>3]);j=3752+(i>>13<<3)|0;g[e+1084+((d[e+1724+(a*236|0)+1|0]|0)*40|0)+36>>2]=m*(c[k>>2]=d[j]|d[j+1|0]<<8|d[j+2|0]<<16|d[j+3|0]<<24,c[k+4>>2]=d[j+4|0]|d[j+5|0]<<8|d[j+6|0]<<16|d[j+7|0]<<24,+h[k>>3])}if((f|0)>0){c[e+1724+(a*236|0)+12>>2]=~~(+g[e+1084+((d[e+1724+(a*236|0)+1|0]|0)*40|0)+36>>2]*+(c[e+1724+(a*236|0)+8>>2]|0))}else{c[e+1724+(a*236|0)+12>>2]=~~(+(c[e+1724+(a*236|0)+8>>2]|0)/+g[e+1084+((d[e+1724+(a*236|0)+1|0]|0)*40|0)+36>>2])}}}while(0);if((l|0)==866){c[e+1724+(a*236|0)+12>>2]=c[e+1724+(a*236|0)+8>>2]}m=+(c[(c[e+1724+(a*236|0)+4>>2]|0)+12>>2]|0)*+(c[e+1724+(a*236|0)+12>>2]|0)/(+(c[(c[e+1724+(a*236|0)+4>>2]|0)+32>>2]|0)*+(c[e+4>>2]|0))*4096.0;if((b|0)!=0){m=-0.0-m}c[e+1724+(a*236|0)+20>>2]=~~m;return}function ck(a){a=a|0;var b=0;b=a;a=0;while(1){if((a|0)>=16){break}cb(b,a);c[b+1084+(a*40|0)+4>>2]=c[b+1056>>2];c[b+1084+(a*40|0)+16>>2]=-1;c[b+1084+(a*40|0)+32>>2]=2;c[b+1084+(a*40|0)>>2]=0;a=a+1|0}cm(b);return}function cl(a,b){a=a|0;b=b|0;var e=0,f=0;e=a;a=b;cm(e);L1123:while(1){if(+(c[c[e+13080>>2]>>2]|0)/+g[258]>=+(a|0)){break}switch(d[(c[e+13080>>2]|0)+5|0]|0|0){case 7:{c[e+1084+((d[(c[e+13080>>2]|0)+4|0]|0)*40|0)+24>>2]=d[(c[e+13080>>2]|0)+6|0]|0;break};case 13:{cb(e,d[(c[e+13080>>2]|0)+4|0]|0);break};case 4:{c[e+1084+((d[(c[e+13080>>2]|0)+4|0]|0)*40|0)+8>>2]=d[(c[e+13080>>2]|0)+6|0]|0;break};case 11:{c[e+1084+((d[(c[e+13080>>2]|0)+4|0]|0)*40|0)+32>>2]=d[(c[e+13080>>2]|0)+6|0]|0;g[e+1084+((d[(c[e+13080>>2]|0)+4|0]|0)*40|0)+36>>2]=0.0;break};case 99:{f=902;break L1123;break};case 9:{if((c[e+13056>>2]&1<<(d[(c[e+13080>>2]|0)+4|0]|0)|0)!=0){c[e+1084+((d[(c[e+13080>>2]|0)+4|0]|0)*40|0)>>2]=d[(c[e+13080>>2]|0)+6|0]|0}else{c[e+1084+((d[(c[e+13080>>2]|0)+4|0]|0)*40|0)+4>>2]=d[(c[e+13080>>2]|0)+6|0]|0}break};case 8:{c[e+1084+((d[(c[e+13080>>2]|0)+4|0]|0)*40|0)+20>>2]=(d[(c[e+13080>>2]|0)+6|0]|0)+((d[(c[e+13080>>2]|0)+7|0]|0)<<7);g[e+1084+((d[(c[e+13080>>2]|0)+4|0]|0)*40|0)+36>>2]=0.0;break};case 15:{c[e+1084+((d[(c[e+13080>>2]|0)+4|0]|0)*40|0)>>2]=d[(c[e+13080>>2]|0)+6|0]|0;break};case 10:{c[392]=(d[(c[e+13080>>2]|0)+4|0]|0)+((d[(c[e+13080>>2]|0)+7|0]|0)<<8)+((d[(c[e+13080>>2]|0)+6|0]|0)<<16);break};case 5:{c[e+1084+((d[(c[e+13080>>2]|0)+4|0]|0)*40|0)+16>>2]=d[(c[e+13080>>2]|0)+6|0]|0;break};case 6:{c[e+1084+((d[(c[e+13080>>2]|0)+4|0]|0)*40|0)+12>>2]=d[(c[e+13080>>2]|0)+6|0]|0;break};default:{}}b=e+13080|0;c[b>>2]=(c[b>>2]|0)+8}if((f|0)==902){c[e+13088>>2]=~~(+(c[c[e+13080>>2]>>2]|0)/+g[258]);return}if((c[e+13080>>2]|0)!=(c[e+13076>>2]|0)){f=e+13080|0;c[f>>2]=(c[f>>2]|0)-8}c[e+13088>>2]=a;return}function cm(b){b=b|0;var c=0;c=b;b=0;while(1){if((b|0)>=48){break}a[c+1724+(b*236|0)|0]=0;b=b+1|0}return}function cn(b,e,f){b=b|0;e=e|0;f=f|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;h=b;b=e;e=f;if((c[h+13056>>2]&1<<d[b+4|0]|0)!=0){f=c[(c[h+540+(c[h+1084+((d[b+4|0]|0)*40|0)>>2]<<2)>>2]|0)+4+(d[b+6|0]<<2)>>2]|0;i=f;do{if((f|0)==0){j=c[(c[h+540>>2]|0)+4+(d[b+6|0]<<2)>>2]|0;i=j;if((j|0)!=0){break}return}}while(0);(c[i>>2]|0)!=1;if((a[(c[i+4>>2]|0)+112|0]|0)!=0){f=1056+(a[(c[i+4>>2]|0)+112|0]<<2)|0;c[h+1724+(e*236|0)+8>>2]=d[f]|d[f+1|0]<<8|d[f+2|0]<<16|d[f+3|0]<<24}else{f=1056+((a[b+6|0]&127)<<2)|0;c[h+1724+(e*236|0)+8>>2]=d[f]|d[f+1|0]<<8|d[f+2|0]<<16|d[f+3|0]<<24}c[h+1724+(e*236|0)+4>>2]=c[i+4>>2]}else{if(-1!=(c[1640+(d[b+4|0]<<2)>>2]|0)){f=c[h+28+(c[h+1084+((d[b+4|0]|0)*40|0)>>2]<<2)>>2]|0;j=c[1640+(d[b+4|0]<<2)>>2]|0;if(0==(c[f+4+(j<<2)>>2]|0)){k=0;l=h;m=c[(c[f>>2]|0)+(j*28|0)>>2]|0;n=(k|0)!=0?1:0;o=c[(c[f>>2]|0)+(j*28|0)+12>>2]|0;p=c[(c[f>>2]|0)+(j*28|0)+8>>2]|0;if((c[(c[f>>2]|0)+(j*28|0)+4>>2]|0)!=-1){q=c[(c[f>>2]|0)+(j*28|0)+4>>2]|0}else{if((k|0)!=0){r=j}else{r=-1}q=r}if((c[(c[f>>2]|0)+(j*28|0)+16>>2]|0)!=-1){s=c[(c[f>>2]|0)+(j*28|0)+16>>2]|0}else{s=(k|0)!=0?1:-1}if((c[(c[f>>2]|0)+(j*28|0)+20>>2]|0)!=-1){t=c[(c[f>>2]|0)+(j*28|0)+20>>2]|0}else{t=(k|0)!=0?1:-1}c[f+4+(j<<2)>>2]=bl(l,m,n,o,p,q,s,t,c[(c[f>>2]|0)+(j*28|0)+24>>2]|0)|0}i=c[f+4+(j<<2)>>2]|0}else{if((c[h+1084+((d[b+4|0]|0)*40|0)+4>>2]|0)==-1){i=c[h+1052>>2]|0}else{j=c[(c[h+28+(c[h+1084+((d[b+4|0]|0)*40|0)>>2]<<2)>>2]|0)+4+(c[h+1084+((d[b+4|0]|0)*40|0)+4>>2]<<2)>>2]|0;i=j;do{if((j|0)==0){f=c[(c[h+28>>2]|0)+4+(c[h+1084+((d[b+4|0]|0)*40|0)+4>>2]<<2)>>2]|0;i=f;if((f|0)!=0){break}return}}while(0)}}if((a[(c[i+4>>2]|0)+112|0]|0)!=0){j=1056+(a[(c[i+4>>2]|0)+112|0]<<2)|0;c[h+1724+(e*236|0)+8>>2]=d[j]|d[j+1|0]<<8|d[j+2|0]<<16|d[j+3|0]<<24}else{j=1056+(((d[b+6|0]|0)+(c[1662]|0)&127)<<2)|0;c[h+1724+(e*236|0)+8>>2]=d[j]|d[j+1|0]<<8|d[j+2|0]<<16|d[j+3|0]<<24}c[h+1724+(e*236|0)+8>>2]=~~(+(c[h+1724+(e*236|0)+8>>2]|0)*+g[260]/440.0);co(h,e,i,d[b+7|0]|0)}a[h+1724+(e*236|0)|0]=1;a[h+1724+(e*236|0)+1|0]=a[b+4|0]|0;a[h+1724+(e*236|0)+2|0]=a[b+6|0]|0;a[h+1724+(e*236|0)+3|0]=cp(a[b+7|0]|0,+g[1576+(d[b+4|0]<<2)>>2])|0;c[h+1724+(e*236|0)+16>>2]=0;c[h+1724+(e*236|0)+20>>2]=0;c[h+1724+(e*236|0)+44>>2]=0;c[h+1724+(e*236|0)+48>>2]=c[(c[h+1724+(e*236|0)+4>>2]|0)+96>>2];c[h+1724+(e*236|0)+36>>2]=c[(c[h+1724+(e*236|0)+4>>2]|0)+92>>2];c[h+1724+(e*236|0)+40>>2]=0;c[h+1724+(e*236|0)+52>>2]=c[(c[h+1724+(e*236|0)+4>>2]|0)+100>>2];c[h+1724+(e*236|0)+56>>2]=0;c[h+1724+(e*236|0)+212>>2]=c[(c[h+1724+(e*236|0)+4>>2]|0)+104>>2];c[h+1724+(e*236|0)+208>>2]=0;c[h+1724+(e*236|0)+216>>2]=0;i=0;while(1){if((i|0)>=32){break}c[h+1724+(e*236|0)+80+(i<<2)>>2]=0;i=i+1|0}if((c[h+1084+((d[b+4|0]|0)*40|0)+16>>2]|0)!=-1){c[h+1724+(e*236|0)+228>>2]=c[h+1084+((d[b+4|0]|0)*40|0)+16>>2]}else{c[h+1724+(e*236|0)+228>>2]=a[(c[h+1724+(e*236|0)+4>>2]|0)+111|0]|0}cj(h,e);cf(h,e);if((a[(c[h+1724+(e*236|0)+4>>2]|0)+110|0]&64|0)!=0){c[h+1724+(e*236|0)+220>>2]=0;c[h+1724+(e*236|0)+24>>2]=0;c[h+1724+(e*236|0)+224>>2]=0;b=h;i=e;bI(b,i)|0;bJ(h,e);return}else{c[h+1724+(e*236|0)+32>>2]=0;bJ(h,e);return}}function co(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=a;a=b;b=d;d=e;e=c[b>>2]|0;g=c[b+4>>2]|0;if((e|0)==1){c[f+1724+(a*236|0)+4>>2]=g;return}h=c[f+1724+(a*236|0)+8>>2]|0;i=0;L1232:while(1){if((i|0)>=(e|0)){break}do{if((c[g+16>>2]|0)<=(d|0)){if((c[g+20>>2]|0)<(d|0)){break}if((c[g+24>>2]|0)>(h|0)){break}if((c[g+28>>2]|0)>=(h|0)){j=977;break L1232}}}while(0);g=g+116|0;i=i+1|0}if((j|0)==977){c[f+1724+(a*236|0)+4>>2]=g;return}j=2147483647;d=c[b+4>>2]|0;g=d;b=d;i=0;while(1){if((i|0)>=(e|0)){break}d=(c[g+32>>2]|0)-h|0;if((d|0)<0){d=-d|0}if((d|0)<(j|0)){j=d;b=g}g=g+116|0;i=i+1|0}c[f+1724+(a*236|0)+4>>2]=b;return}function cp(a,b){a=a|0;b=+b;var d=0,e=0,f=0.0,g=0,h=0,j=0,k=0;d=i;e=a;f=b;if(f<=1.0){g=~~(+(e&255|0)*f);h=g;i=d;return h|0}else{a=(e&255)+(~~(+(127-(e&255)|0)*(f-1.0))&255)&255;j=e&255;e=a&255;aG(4784,(k=i,i=i+16|0,c[k>>2]=j,c[k+8>>2]=e,k)|0)|0;i=k;g=a;h=g;i=d;return h|0}return 0}function cq(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=i;i=i+40|0;j=h|0;k=h+8|0;l=h+16|0;m=h+24|0;n=h+32|0;o=d;d=e;e=f;f=g;c[d+13092>>2]=0;c[d+13096>>2]=0;c[d+13084>>2]=0;do{if((cP(o,n|0,1,4)|0)==4){if((cP(o,j,4,1)|0)!=1){break}c[j>>2]=(c[j>>2]&255)<<24|(c[j>>2]&65280)<<8|(c[j>>2]&16711680)>>8|c[j>>2]>>24&255;do{if((c4(n|0,4776,4)|0)==0){if((c[j>>2]|0)<6){break}g=o;p=k;cP(g,p,2,1)|0;p=o;g=l;cP(p,g,2,1)|0;g=o;p=m;cP(g,p,2,1)|0;b[k>>1]=((b[k>>1]&255)<<8|b[k>>1]>>8&255)&65535;b[l>>1]=((b[l>>1]&255)<<8|b[l>>1]>>8&255)&65535;b[m>>1]=((b[m>>1]&255)<<8|b[m>>1]>>8&255)&65535;if((b[m>>1]|0)<0){q=_(-((b[m>>1]|0)/256|0)|0,b[m>>1]&255)|0}else{q=b[m>>1]|0}if((c[j>>2]|0)>6){cQ(o,(c[j>>2]|0)-6|0)}do{if((b[k>>1]|0)>=0){if((b[k>>1]|0)>2){break}c[d+13084>>2]=bi(12)|0;c[c[d+13084>>2]>>2]=0;a[(c[d+13084>>2]|0)+5|0]=0;c[(c[d+13084>>2]|0)+8>>2]=0;p=d+13092|0;c[p>>2]=(c[p>>2]|0)+1;p=b[k>>1]|0;do{if((p|0)==1){r=0;while(1){if((r|0)>=(b[l>>1]|0)){s=1023;break}if((cr(o,d,0)|0)!=0){break}r=r+1|0}if((s|0)==1023){break}cs(d);t=0;u=t;i=h;return u|0}else if((p|0)==2){r=0;while(1){if((r|0)>=(b[l>>1]|0)){s=1030;break}if((cr(o,d,1)|0)!=0){break}r=r+1|0}if((s|0)==1030){break}cs(d);t=0;u=t;i=h;return u|0}else if((p|0)==0){if((cr(o,d,0)|0)==0){break}cs(d);t=0;u=t;i=h;return u|0}}while(0);t=ct(d,q,e,f)|0;u=t;i=h;return u|0}}while(0);t=0;u=t;i=h;return u|0}}while(0);t=0;u=t;i=h;return u|0}}while(0);t=0;u=t;i=h;return u|0}function cr(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+16|0;f=e|0;g=e+8|0;h=a;a=b;b=c[a+13084>>2]|0;do{if((d|0)!=0){if((b|0)==0){j=1047;break}while(1){if((c[b+8>>2]|0)==0){break}b=c[b+8>>2]|0}c[a+13096>>2]=c[b>>2]}else{j=1047}}while(0);if((j|0)==1047){c[a+13096>>2]=0}do{if((cP(h,g|0,1,4)|0)==4){if((cP(h,f,4,1)|0)!=1){break}c[f>>2]=(c[f>>2]&255)<<24|(c[f>>2]&65280)<<8|(c[f>>2]&16711680)>>8|c[f>>2]>>24&255;if((c4(g|0,6272,4)|0)!=0){k=-2;l=k;i=e;return l|0}while(1){d=cv(h,a)|0;m=d;if((d|0)==0){j=1055;break}if((m|0)==-1){j=1057;break}d=c[b+8>>2]|0;while(1){if((d|0)!=0){n=(c[d>>2]|0)<(c[m>>2]|0)}else{n=0}if(!n){break}b=d;d=c[b+8>>2]|0}c[m+8>>2]=d;c[b+8>>2]=m;o=a+13092|0;c[o>>2]=(c[o>>2]|0)+1;b=m}if((j|0)==1055){k=-2;l=k;i=e;return l|0}else if((j|0)==1057){k=0;l=k;i=e;return l|0}}}while(0);k=-1;l=k;i=e;return l|0}function cs(a){a=a|0;var b=0,d=0;b=a;a=c[b+13084>>2]|0;d=a;if((a|0)==0){return}while(1){if((d|0)==0){break}a=c[d+8>>2]|0;c0(d);d=a}c[b+13084>>2]=0;return}function ct(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;h=i;i=i+192|0;j=h|0;k=h+64|0;l=h+128|0;m=b;b=e;e=f;f=g;g=0;while(1){if((g|0)>=16){break}c[j+(g<<2)>>2]=0;c[k+(g<<2)>>2]=0;c[l+(g<<2)>>2]=c[m+1056>>2];g=g+1|0}n=5e5;cu(m,n,b);o=bi((c[m+13092>>2]|0)+1<<3)|0;p=o;q=o;o=c[m+13084>>2]|0;r=0;s=0;t=0;u=0;v=0;g=0;while(1){if((g|0)>=(c[m+13092>>2]|0)){break}w=0;x=d[o+5|0]|0;do{if((x|0)==9){if((c[m+13056>>2]&1<<(d[o+4|0]|0)|0)!=0){if((c[m+540+((d[o+6|0]|0)<<2)>>2]|0)!=0){y=d[o+6|0]|0}else{a[o+6|0]=0;y=0}if((c[k+((d[o+4|0]|0)<<2)>>2]|0)!=(y|0)){c[k+((d[o+4|0]|0)<<2)>>2]=y}else{w=1}}else{y=d[o+6|0]|0;do{if((c[l+((d[o+4|0]|0)<<2)>>2]|0)!=-1){if((c[l+((d[o+4|0]|0)<<2)>>2]|0)==(y|0)){z=1096;break}c[l+((d[o+4|0]|0)<<2)>>2]=y}else{z=1096}}while(0);if((z|0)==1096){z=0;w=1}}}else if((x|0)==15){if((c[m+13056>>2]&1<<(d[o+4|0]|0)|0)!=0){w=1;break}if((c[m+28+((d[o+6|0]|0)<<2)>>2]|0)!=0){y=d[o+6|0]|0}else{a[o+6|0]=0;y=0}if((c[j+((d[o+4|0]|0)<<2)>>2]|0)!=(y|0)){c[j+((d[o+4|0]|0)<<2)>>2]=y}else{w=1}}else if((x|0)==1){if((v|0)!=0){v=1}if((c[m+13056>>2]&1<<(d[o+4|0]|0)|0)!=0){if((c[(c[m+540+(c[k+((d[o+4|0]|0)<<2)>>2]<<2)>>2]|0)+4+((d[o+6|0]|0)<<2)>>2]|0)==0){c[(c[m+540+(c[k+((d[o+4|0]|0)<<2)>>2]<<2)>>2]|0)+4+((d[o+6|0]|0)<<2)>>2]=-1}}else{if((c[l+((d[o+4|0]|0)<<2)>>2]|0)==-1){break}if((c[(c[m+28+(c[j+((d[o+4|0]|0)<<2)>>2]<<2)>>2]|0)+4+(c[l+((d[o+4|0]|0)<<2)>>2]<<2)>>2]|0)==0){c[(c[m+28+(c[j+((d[o+4|0]|0)<<2)>>2]<<2)>>2]|0)+4+(c[l+((d[o+4|0]|0)<<2)>>2]<<2)>>2]=-1}}}}while(0);x=(c[o>>2]|0)-t|0;A=x;do{if((x|0)!=0){if((v|0)!=0){z=1125;break}B=_(c[m+1076>>2]|0,A)|0;s=s+(_(c[m+1080>>2]|0,A)|0)|0;if((s&-65536|0)!=0){B=B+(s>>16&65535)|0;s=s&65535}u=u+B|0}else{z=1125}}while(0);if((z|0)==1125){z=0;if((v|0)==1){v=0}}if((d[o+5|0]|0|0)==10){n=(d[o+4|0]|0)+((d[o+7|0]|0)<<8)+((d[o+6|0]|0)<<16)|0;cu(m,n,b)}if((w|0)==0){A=p;x=o|0;c[A>>2]=c[x>>2];c[A+4>>2]=c[x+4>>2];c[p>>2]=u;p=p+8|0;r=r+1|0}t=c[o>>2]|0;o=c[o+8>>2]|0;g=g+1|0}c[p>>2]=u;a[p+5|0]=99;r=r+1|0;cs(m);c[e>>2]=r;c[f>>2]=u;i=h;return q|0}function cu(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0.0;e=a;f=+(b|0)*+(c[e+4>>2]|0)*.065536/+(d|0);c[e+1080>>2]=~~f&65535;c[e+1076>>2]=~~f>>16;return}function cv(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+40|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=f+32|0;m=b;b=e;L1442:while(1){e=cw(m)|0;n=b+13096|0;c[n>>2]=(c[n>>2]|0)+e;if((cP(m,g,1,1)|0)!=1){o=1138;break}do{if((d[g]|0)==240){o=1141}else{if((d[g]|0)==247){o=1141;break}if((d[g]|0)==255){e=m;cP(e,h,1,1)|0;p=cw(m)|0;do{if((d[h]|0)>0){if((d[h]|0)>=16){o=1146;break}e=m;n=p;q=a[h]|0;r=b;cx(e,n,q,r)|0}else{o=1146}}while(0);if((o|0)==1146){o=0;r=d[h]|0;if((r|0)==47){o=1147;break L1442}else if((r|0)==81){o=1148;break L1442}cQ(m,p)}}else{a[j]=a[g]|0;if((a[j]&128|0)!=0){a[6632]=d[j]&15;a[6624]=d[j]>>4&7;r=m;cP(r,j,1,1)|0;a[j]=d[j]&127}switch(d[6624]|0){case 1:{o=1156;break L1442;break};case 6:{o=1188;break L1442;break};case 4:{o=1186;break L1442;break};case 5:{break};case 0:{o=1155;break L1442;break};case 2:{o=1157;break L1442;break};case 3:{cP(m,k,1,1)|0;a[k]=d[k]&127;s=255;L1466:do{switch(d[j]|0){case 98:{a[6616]=1;a[6600+(d[6632]|0)|0]=a[k]|0;break};case 6:{if((a[6616]|0)!=0){break L1466}r=d[6584+(d[6632]|0)|0]<<8|d[6600+(d[6632]|0)|0];if((r|0)==0){s=11}else if((r|0)==32639){o=1179;break L1442}break};case 7:{s=4;break};case 10:{s=5;break};case 11:{s=7;break};case 64:{s=6;break};case 120:{s=12;break};case 121:{s=13;break};case 123:{s=14;break};case 0:{s=15;break};case 32:{if((d[k]|0)==0){s=15}break};case 100:{a[6616]=0;a[6584+(d[6632]|0)|0]=a[k]|0;break};case 101:{a[6616]=0;a[6600+(d[6632]|0)|0]=a[k]|0;break};case 99:{a[6616]=1;a[6584+(d[6632]|0)|0]=a[k]|0;break};default:{}}}while(0);if((s|0)!=255){o=1184;break L1442}break};default:{}}}}}while(0);if((o|0)==1141){o=0;p=cw(m)|0;cQ(m,p)}}if((o|0)==1184){t=bi(12)|0;c[t>>2]=c[b+13096>>2];a[t+5|0]=s&255;a[t+4|0]=a[6632]|0;a[t+6|0]=a[k]|0;a[t+7|0]=0;c[t+8>>2]=0;u=t;v=u;i=f;return v|0}else if((o|0)==1156){cP(m,k,1,1)|0;a[k]=d[k]&127;t=bi(12)|0;c[t>>2]=c[b+13096>>2];a[t+5|0]=1;a[t+4|0]=a[6632]|0;a[t+6|0]=a[j]|0;a[t+7|0]=a[k]|0;c[t+8>>2]=0;u=t;v=u;i=f;return v|0}else if((o|0)==1179){t=bi(12)|0;c[t>>2]=c[b+13096>>2];a[t+5|0]=11;a[t+4|0]=a[6632]|0;a[t+6|0]=2;a[t+7|0]=0;c[t+8>>2]=0;u=t;v=u;i=f;return v|0}else if((o|0)==1138){u=0;v=u;i=f;return v|0}else if((o|0)==1188){cP(m,k,1,1)|0;a[k]=d[k]&127;t=bi(12)|0;c[t>>2]=c[b+13096>>2];a[t+5|0]=8;a[t+4|0]=a[6632]|0;a[t+6|0]=a[j]|0;a[t+7|0]=a[k]|0;c[t+8>>2]=0;u=t;v=u;i=f;return v|0}else if((o|0)==1186){a[j]=d[j]&127;t=bi(12)|0;c[t>>2]=c[b+13096>>2];a[t+5|0]=9;a[t+4|0]=a[6632]|0;a[t+6|0]=a[j]|0;a[t+7|0]=0;c[t+8>>2]=0;u=t;v=u;i=f;return v|0}else if((o|0)==1147){u=-1;v=u;i=f;return v|0}else if((o|0)==1148){cP(m,j,1,1)|0;cP(m,k,1,1)|0;cP(m,l,1,1)|0;t=bi(12)|0;c[t>>2]=c[b+13096>>2];a[t+5|0]=10;a[t+4|0]=a[l]|0;a[t+6|0]=a[j]|0;a[t+7|0]=a[k]|0;c[t+8>>2]=0;u=t;v=u;i=f;return v|0}else if((o|0)==1155){cP(m,k,1,1)|0;a[k]=d[k]&127;t=bi(12)|0;c[t>>2]=c[b+13096>>2];a[t+5|0]=2;a[t+4|0]=a[6632]|0;a[t+6|0]=a[j]|0;a[t+7|0]=a[k]|0;c[t+8>>2]=0;u=t;v=u;i=f;return v|0}else if((o|0)==1157){cP(m,k,1,1)|0;a[k]=d[k]&127;t=bi(12)|0;c[t>>2]=c[b+13096>>2];a[t+5|0]=3;a[t+4|0]=a[6632]|0;a[t+6|0]=a[j]|0;a[t+7|0]=a[k]|0;c[t+8>>2]=0;u=t;v=u;i=f;return v|0}return 0}function cw(b){b=b|0;var c=0,d=0,e=0;c=i;i=i+8|0;d=c|0;e=b;b=0;while(1){cP(e,d,1,1)|0;b=b+(a[d]&127)|0;if((a[d]&128|0)==0){break}b=b<<7}i=c;return b|0}function cx(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0;h=e;e=f;f=g;g=bi(h+1|0)|0;if((h|0)!=(cP(b,g,1,h)|0)){c0(g);i=-1;j=i;return j|0}a[g+h|0]=0;while(1){b=h;h=b-1|0;if((b|0)==0){break}if((d[g+h|0]|0|0)<32){a[g+h|0]=46}}h=e&255;if((h|0)==1){k=0}else if((h|0)==2){k=1}else{c0(g);g=0}if((g|0)!=0){if((c[f+13104+(k<<2)>>2]|0)!=0){c0(c[f+13104+(k<<2)>>2]|0)}c[f+13104+(k<<2)>>2]=g}i=0;j=i;return j|0}function cy(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=b;b=e;e=f;f=g+1724+(b*236|0)|0;if((c[(c[f+4>>2]|0)+12>>2]|0)==0){h=c[f+16>>2]>>12;if((c[e>>2]|0)>=((c[(c[f+4>>2]|0)+8>>2]>>12)-h|0)){a[f|0]=0;c[e>>2]=(c[(c[f+4>>2]|0)+8>>2]>>12)-h}else{i=f+16|0;c[i>>2]=(c[i>>2]|0)+(c[e>>2]<<12)}j=(c[(c[f+4>>2]|0)+88>>2]|0)+(h<<1)|0;k=j;return k|0}h=a[(c[f+4>>2]|0)+110|0]|0;if((c[f+212>>2]|0)!=0){L1575:do{if((h&4|0)!=0){do{if((h&64|0)==0){if((d[f|0]|0|0)==1){break}if((d[f|0]|0|0)!=2){break L1575}}}while(0);if((h&8|0)!=0){j=cz(g,f,c[e>>2]|0)|0;k=j;return k|0}else{j=cA(g,f,c[e>>2]|0)|0;k=j;return k|0}}}while(0);j=cB(g,b,e)|0;k=j;return k|0}else{L1561:do{if((h&4|0)!=0){do{if((h&64|0)==0){if((d[f|0]|0|0)==1){break}if((d[f|0]|0|0)!=2){break L1561}}}while(0);if((h&8|0)!=0){j=cC(g,f,c[e>>2]|0)|0;k=j;return k|0}else{j=cD(g,f,c[e>>2]|0)|0;k=j;return k|0}}}while(0);j=cE(g,b,e)|0;k=j;return k|0}return 0}function cz(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=a;a=d;d=e;e=c[a+16>>2]|0;g=c[a+20>>2]|0;h=c[(c[a+4>>2]|0)+4>>2]|0;i=c[c[a+4>>2]>>2]|0;j=c[f+1068>>2]|0;k=c[(c[a+4>>2]|0)+88>>2]|0;l=c[a+216>>2]|0;m=h<<1;n=i<<1;o=0;while(1){if((d|0)!=0){p=(e|0)<=(i|0)}else{p=0}if(!p){break}q=((i-e|0)/(g|0)|0)+1|0;if((q|0)>(d|0)){q=d}if((q|0)>(l|0)){q=l;o=1}else{l=l-q|0}d=d-q|0;while(1){r=q;q=r-1|0;if((r|0)==0){break}s=b[k+(e>>12<<1)>>1]|0;t=b[k+((e>>12)+1<<1)>>1]|0;r=j;j=r+2|0;b[r>>1]=(s<<16>>16)+((_((t<<16>>16)-(s<<16>>16)|0,e&4095)|0)>>>12)&65535;e=e+g|0}if((o|0)!=0){l=c[a+212>>2]|0;g=cG(f,a,0)|0;o=0}}while(1){if((d|0)==0){break}if((g|0)>0){u=h}else{u=i}q=((u-e|0)/(g|0)|0)+1|0;if((q|0)>(d|0)){q=d}if((q|0)>(l|0)){q=l;o=1}else{l=l-q|0}d=d-q|0;while(1){p=q;q=p-1|0;if((p|0)==0){break}s=b[k+(e>>12<<1)>>1]|0;t=b[k+((e>>12)+1<<1)>>1]|0;p=j;j=p+2|0;b[p>>1]=(s<<16>>16)+((_((t<<16>>16)-(s<<16>>16)|0,e&4095)|0)>>>12)&65535;e=e+g|0}if((o|0)!=0){l=c[a+212>>2]|0;g=cG(f,a,(g|0)<0|0)|0;o=0}if((e|0)>=(h|0)){e=m-e|0;g=g*-1|0}else{if((e|0)<=(i|0)){e=n-e|0;g=g*-1|0}}}c[a+216>>2]=l;c[a+20>>2]=g;c[a+16>>2]=e;return c[f+1068>>2]|0}function cA(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=a;a=d;d=e;e=c[a+16>>2]|0;g=c[a+20>>2]|0;h=c[(c[a+4>>2]|0)+4>>2]|0;i=h-(c[c[a+4>>2]>>2]|0)|0;j=c[f+1068>>2]|0;k=c[(c[a+4>>2]|0)+88>>2]|0;l=c[a+216>>2]|0;m=0;while(1){if((d|0)==0){break}if((e|0)>=(h|0)){e=e-i|0}n=((h-e|0)/(g|0)|0)+1|0;if((n|0)>(d|0)){n=d}if((n|0)>(l|0)){n=l;m=1}else{l=l-n|0}d=d-n|0;while(1){o=n;n=o-1|0;if((o|0)==0){break}o=b[k+(e>>12<<1)>>1]|0;p=j;j=p+2|0;b[p>>1]=(o<<16>>16)+((_((b[k+((e>>12)+1<<1)>>1]|0)-(o<<16>>16)|0,e&4095)|0)>>>12)&65535;e=e+g|0}if((m|0)!=0){l=c[a+212>>2]|0;g=cG(f,a,0)|0;m=0}}c[a+216>>2]=l;c[a+20>>2]=g;c[a+16>>2]=e;return c[f+1068>>2]|0}function cB(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;g=d;d=f;f=g+1724+(e*236|0)|0;e=c[g+1068>>2]|0;h=c[(c[f+4>>2]|0)+88>>2]|0;i=c[(c[f+4>>2]|0)+8>>2]|0;j=c[f+16>>2]|0;k=c[f+20>>2]|0;l=c[d>>2]|0;m=c[f+216>>2]|0;if((k|0)<0){k=-k|0}do{n=l;l=n-1|0;if((n|0)==0){o=1322;break}n=m;m=n-1|0;if((n|0)==0){m=c[f+212>>2]|0;k=cG(g,f,0)|0}n=b[h+(j>>12<<1)>>1]|0;p=e;e=p+2|0;b[p>>1]=(n<<16>>16)+((_((b[h+((j>>12)+1<<1)>>1]|0)-(n<<16>>16)|0,j&4095)|0)>>>12)&65535;j=j+k|0;}while((j|0)<(i|0));if((o|0)==1322){q=m;r=f;s=r+216|0;c[s>>2]=q;t=k;u=f;v=u+20|0;c[v>>2]=t;w=j;x=f;y=x+16|0;c[y>>2]=w;z=g;A=z+1068|0;B=c[A>>2]|0;return B|0}if((j|0)==(i|0)){i=e;e=i+2|0;b[i>>1]=b[h+(j>>12<<1)>>1]|0}a[f|0]=0;h=d;c[h>>2]=(c[h>>2]|0)-(l+1);q=m;r=f;s=r+216|0;c[s>>2]=q;t=k;u=f;v=u+20|0;c[v>>2]=t;w=j;x=f;y=x+16|0;c[y>>2]=w;z=g;A=z+1068|0;B=c[A>>2]|0;return B|0}function cC(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=a;a=d;d=e;e=c[a+16>>2]|0;g=c[a+20>>2]|0;h=c[(c[a+4>>2]|0)+4>>2]|0;i=c[c[a+4>>2]>>2]|0;j=c[f+1068>>2]|0;k=c[(c[a+4>>2]|0)+88>>2]|0;l=h<<1;m=i<<1;if((e|0)<=(i|0)){n=((i-e|0)/(g|0)|0)+1|0;if((n|0)>(d|0)){n=d;d=0}else{d=d-n|0}while(1){o=n;n=o-1|0;if((o|0)==0){break}p=b[k+(e>>12<<1)>>1]|0;q=b[k+((e>>12)+1<<1)>>1]|0;o=j;j=o+2|0;b[o>>1]=(p<<16>>16)+((_((q<<16>>16)-(p<<16>>16)|0,e&4095)|0)>>>12)&65535;e=e+g|0}}while(1){if((d|0)==0){break}if((g|0)>0){r=h}else{r=i}n=((r-e|0)/(g|0)|0)+1|0;if((n|0)>(d|0)){n=d;d=0}else{d=d-n|0}while(1){o=n;n=o-1|0;if((o|0)==0){break}p=b[k+(e>>12<<1)>>1]|0;q=b[k+((e>>12)+1<<1)>>1]|0;o=j;j=o+2|0;b[o>>1]=(p<<16>>16)+((_((q<<16>>16)-(p<<16>>16)|0,e&4095)|0)>>>12)&65535;e=e+g|0}if((e|0)>=(h|0)){e=l-e|0;g=g*-1|0}else{if((e|0)<=(i|0)){e=m-e|0;g=g*-1|0}}}c[a+20>>2]=g;c[a+16>>2]=e;return c[f+1068>>2]|0}function cD(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=a;a=d;d=e;e=c[a+16>>2]|0;g=c[a+20>>2]|0;h=c[(c[a+4>>2]|0)+4>>2]|0;i=h-(c[c[a+4>>2]>>2]|0)|0;j=c[f+1068>>2]|0;k=c[(c[a+4>>2]|0)+88>>2]|0;while(1){if((d|0)==0){break}if((e|0)>=(h|0)){e=e-i|0}l=((h-e|0)/(g|0)|0)+1|0;if((l|0)>(d|0)){l=d;d=0}else{d=d-l|0}while(1){m=l;l=m-1|0;if((m|0)==0){break}m=b[k+(e>>12<<1)>>1]|0;n=j;j=n+2|0;b[n>>1]=(m<<16>>16)+((_((b[k+((e>>12)+1<<1)>>1]|0)-(m<<16>>16)|0,e&4095)|0)>>>12)&65535;e=e+g|0}}c[a+16>>2]=e;return c[f+1068>>2]|0}function cE(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=d;d=f;f=g+1724+(e*236|0)|0;e=c[g+1068>>2]|0;h=c[(c[f+4>>2]|0)+88>>2]|0;i=c[f+16>>2]|0;j=c[f+20>>2]|0;k=c[(c[f+4>>2]|0)+8>>2]|0;l=c[d>>2]|0;if((j|0)<0){j=-j|0}m=((k-i|0)/(j|0)|0)+1|0;if((m|0)>(l|0)){m=l;l=0}else{l=l-m|0}while(1){n=m;m=n-1|0;if((n|0)==0){break}n=b[h+(i>>12<<1)>>1]|0;o=e;e=o+2|0;b[o>>1]=(n<<16>>16)+((_((b[h+((i>>12)+1<<1)>>1]|0)-(n<<16>>16)|0,i&4095)|0)>>>12)&65535;i=i+j|0}if((i|0)<(k|0)){p=i;q=f;r=q+16|0;c[r>>2]=p;s=g;t=s+1068|0;u=c[t>>2]|0;return u|0}if((i|0)==(k|0)){k=e;e=k+2|0;b[k>>1]=b[h+(i>>12<<1)>>1]|0}a[f|0]=0;h=d;c[h>>2]=(c[h>>2]|0)-(l+1);p=i;q=f;r=q+16|0;c[r>>2]=p;s=g;t=s+1068|0;u=c[t>>2]|0;return u|0}function cF(e,f){e=e|0;f=f|0;var g=0,h=0,i=0.0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0.0,u=0,v=0,w=0,x=0,y=0,z=0,A=0.0,B=0.0,C=0.0,D=0,E=0,F=0,G=0,H=0,I=0,J=0.0,K=0.0,L=0.0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;g=f;f=c[g+88>>2]|0;h=1056+(a[g+112|0]<<2)|0;i=+(c[g+12>>2]|0)*+(d[h]|d[h+1|0]<<8|d[h+2|0]<<16|d[h+3|0]<<24|0)/(+(c[g+32>>2]|0)*+(c[e+4>>2]|0));e=~~(+(c[g+8>>2]|0)/i);h=bi(e>>11)|0;j=h;k=h;h=(e>>12)-1|0;l=((c[g+8>>2]|0)-4096|0)/(h|0)|0;m=l;n=l;l=h-1|0;h=l;if((l|0)!=0){l=k;k=l+2|0;b[l>>1]=b[f>>1]|0}while(1){l=h-1|0;h=l;if((l|0)==0){break}l=f+(n>>12<<1)|0;if(l>>>0>f>>>0){o=b[l-2>>1]|0}else{o=0}p=o&65535;q=b[l>>1]|0;r=b[l+2>>1]|0;s=b[l+4>>1]|0;t=+((n&4095)>>>0>>>0)*.000244140625;l=k;k=l+2|0;b[l>>1]=~~(+(q<<16>>16|0)+t/6.0*(+(((p<<16>>16)*-2|0)-((q<<16>>16)*3|0)+((r<<16>>16)*6|0)-(s<<16>>16)|0)+t*(+(((p<<16>>16)-(q<<16>>16<<1)+(r<<16>>16)|0)*3|0|0)+t*+((-(p<<16>>16)|0)+(((q<<16>>16)-(r<<16>>16)|0)*3|0)+(s<<16>>16)|0))));n=n+m|0}if((n&4095|0)!=0){p=b[f+(n>>12<<1)>>1]|0;q=b[f+((n>>12)+1<<1)>>1]|0;m=k;k=m+2|0;b[m>>1]=(p<<16>>16)+((_((q<<16>>16)-(p<<16>>16)|0,n&4095)|0)>>>12)&65535;u=e;v=g;w=v+8|0;c[w>>2]=u;x=g;y=x|0;z=c[y>>2]|0;A=+(z|0);B=i;C=A/B;D=~~C;E=g;F=E|0;c[F>>2]=D;G=g;H=G+4|0;I=c[H>>2]|0;J=+(I|0);K=i;L=J/K;M=~~L;N=g;O=N+4|0;c[O>>2]=M;P=g;Q=P+88|0;R=c[Q>>2]|0;S=R;c0(S);T=j;U=g;V=U+88|0;c[V>>2]=T;W=g;X=W+12|0;c[X>>2]=0;return}else{p=k;k=p+2|0;b[p>>1]=b[f+(n>>12<<1)>>1]|0;u=e;v=g;w=v+8|0;c[w>>2]=u;x=g;y=x|0;z=c[y>>2]|0;A=+(z|0);B=i;C=A/B;D=~~C;E=g;F=E|0;c[F>>2]=D;G=g;H=G+4|0;I=c[H>>2]|0;J=+(I|0);K=i;L=J/K;M=~~L;N=g;O=N+4|0;c[O>>2]=M;P=g;Q=P+88|0;R=c[Q>>2]|0;S=R;c0(S);T=j;U=g;V=U+88|0;c[V>>2]=T;W=g;X=W+12|0;c[X>>2]=0;return}}function cG(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,i=0,j=0,l=0,m=0.0,n=0.0;f=a;a=b;b=e;e=a+208|0;g=c[e>>2]|0;c[e>>2]=g+1;if((g|0)>=63){c[a+208>>2]=0}g=cH(c[a+208>>2]|0)|0;if((c[a+80+(g<<2)>>2]|0)!=0){if((b|0)!=0){i=-(c[a+80+(g<<2)>>2]|0)|0;j=i;return j|0}else{i=c[a+80+(g<<2)>>2]|0;j=i;return j|0}}e=(d[(c[a+4>>2]|0)+109|0]|0)<<7;if((c[a+52>>2]|0)!=0){l=a+56|0;c[l>>2]=(c[l>>2]|0)+(c[a+52>>2]|0);if((c[a+56>>2]|0)>=65536){c[a+52>>2]=0}else{e=_(e,c[a+56>>2]|0)|0;e=e>>16}}m=+(c[(c[a+4>>2]|0)+12>>2]|0)*+(c[a+12>>2]|0)/(+(c[(c[a+4>>2]|0)+32>>2]|0)*+(c[f+4>>2]|0))*4096.0;f=~~(+R(+(+(c[a+208>>2]<<4|0)*.006135923151542565))*+(e|0)*1.0);if((f|0)<0){f=-f|0;e=1704+((f>>5&255)<<3)|0;n=(c[k>>2]=d[e]|d[e+1|0]<<8|d[e+2|0]<<16|d[e+3|0]<<24,c[k+4>>2]=d[e+4|0]|d[e+5|0]<<8|d[e+6|0]<<16|d[e+7|0]<<24,+h[k>>3]);e=3752+(f>>13<<3)|0;m=m/(n*(c[k>>2]=d[e]|d[e+1|0]<<8|d[e+2|0]<<16|d[e+3|0]<<24,c[k+4>>2]=d[e+4|0]|d[e+5|0]<<8|d[e+6|0]<<16|d[e+7|0]<<24,+h[k>>3]))}else{e=1704+((f>>5&255)<<3)|0;n=(c[k>>2]=d[e]|d[e+1|0]<<8|d[e+2|0]<<16|d[e+3|0]<<24,c[k+4>>2]=d[e+4|0]|d[e+5|0]<<8|d[e+6|0]<<16|d[e+7|0]<<24,+h[k>>3]);e=3752+(f>>13<<3)|0;m=m*n*(c[k>>2]=d[e]|d[e+1|0]<<8|d[e+2|0]<<16|d[e+3|0]<<24,c[k+4>>2]=d[e+4|0]|d[e+5|0]<<8|d[e+6|0]<<16|d[e+7|0]<<24,+h[k>>3])}if((c[a+52>>2]|0)==0){c[a+80+(g<<2)>>2]=~~m}if((b|0)!=0){m=-0.0-m}i=~~m;j=i;return j|0}function cH(a){a=a|0;var b=0,c=0;b=a;do{if((b|0)<16){c=15-b|0}else{if((b|0)>=48){c=79-b|0;break}else{c=b-16|0;break}}}while(0);return c|0}function cI(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;return an(b|0,d|0,e|0,c[a>>2]|0)|0}function cJ(a){a=a|0;var b=0,d=0,e=0;b=a;a=0;if((c[b+4>>2]|0)==0){d=b;c0(d);e=a;return e|0}a=ao(c[b>>2]|0)|0;d=b;c0(d);e=a;return e|0}function cK(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=d;d=a;a=e;e=c[d+4>>2]|0;g=e+(_(a,f)|0)|0;if(g>>>0>(c[d+8>>2]|0)>>>0){a=(((c[d+8>>2]|0)-(c[d+4>>2]|0)|0)>>>0)/(f>>>0)|0}g=b;b=c[d+4>>2]|0;e=_(a,f)|0;c6(g|0,b|0,e)|0;e=_(a,f)|0;f=d+4|0;c[f>>2]=(c[f>>2]|0)+e;return a|0}function cL(a){a=a|0;var b=0,d=0;b=a;if((c[b+12>>2]|0)==0){d=b;c0(d);return 0}c0(c[b>>2]|0);d=b;c0(d);return 0}function cM(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=bi(12)|0;if((d|0)==0){e=0;f=e;return f|0}g=bi(8)|0;if((g|0)==0){c0(d);e=0;f=e;return f|0}else{c[g>>2]=a;c[g+4>>2]=b;c[d+8>>2]=g;c[d>>2]=2;c[d+4>>2]=4;e=d;f=e;return f|0}return 0}function cN(a){a=a|0;var b=0,c=0,d=0;b=av(a|0,6544)|0;if((b|0)==0){c=0;d=c;return d|0}else{c=cM(b,1)|0;d=c;return d|0}return 0}function cO(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=a;a=bi(12)|0;if((a|0)==0){f=0;g=f;return g|0}h=bi(16)|0;if((h|0)==0){c0(a);f=0;g=f;return g|0}else{c[h>>2]=e;c[h+4>>2]=e;c[h+8>>2]=e+b;c[h+12>>2]=d;c[a+8>>2]=h;c[a>>2]=4;c[a+4>>2]=2;f=a;g=f;return g|0}return 0}function cP(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=a;return aY[c[f>>2]&7](c[f+8>>2]|0,b,d,e)|0}function cQ(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=i;i=i+1024|0;d=c|0;e=a;a=b;while(1){if(a>>>0<=0){break}b=a;if(b>>>0>1024){b=1024}a=a-b|0;(b|0)!=(cP(e,d|0,1,b)|0)}i=c;return}function cR(a){a=a|0;var b=0;b=a;a=aW[c[b+4>>2]&7](c[b+8>>2]|0)|0;c0(b);return a|0}function cS(){var a=0;c[1676]=bi(516)|0;c5(c[1676]|0,0,516);a=bi(3584)|0;c[c[1676]>>2]=a;c5(c[c[1676]>>2]|0,0,3584);c[1804]=bi(516)|0;c5(c[1804]|0,0,516);a=bi(3584)|0;c[c[1804]>>2]=a;c5(c[c[1804]>>2]|0,0,3584);return 0}function cT(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+1024|0;e=d|0;f=b;do{if((f|0)!=0){if((c1(f|0)|0)>>>0>=1024){break}b=e|0;g=f;c2(b|0,g|0)|0;g=aE(f|0,47)|0;if((g|0)!=0){a[e+(g-f)|0]=0;g=c[m>>2]|0;b=e|0;ar(g|0,6480,(g=i,i=i+8|0,c[g>>2]=b,g)|0)|0;i=g;bj(e|0)}}}while(0);cS()|0;do{if((f|0)!=0){if((a[f]|0)==0){break}h=f;j=cU(h)|0;i=d;return j|0}}while(0);f=6520;h=f;j=cU(h)|0;i=d;return j|0}function cU(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;d=i;i=i+1064|0;e=d|0;f=d+1024|0;g=b;b=0;h=0;if((c[1660]|0)>50){j=c[m>>2]|0;ar(j|0,5792,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k;l=-1;n=l;i=d;return n|0}j=bh(g)|0;o=j;if((j|0)==0){j=c[m>>2]|0;p=g;ar(j|0,5392,(k=i,i=i+8|0,c[k>>2]=p,k)|0)|0;i=k;l=-1;n=l;i=d;return n|0}L1881:while(1){if((c_(e|0,1024,o)|0)==0){q=1646;break}h=h+1|0;p=0;c[f>>2]=ay(e|0,5096)|0;if((c[f>>2]|0)==0){continue}do{if((aV(c[f>>2]|0,4840)|0)==0){p=-1}else{if((a[c[f>>2]|0]|0)==35){continue L1881}else{break}}}while(0);while(1){do{if((c[f+(p<<2)>>2]|0)!=0){if((a[c[f+(p<<2)>>2]|0]|0)==35){r=0;break}r=(p|0)<10}else{r=0}}while(0);if(!r){break}j=p+1|0;p=j;c[f+(j<<2)>>2]=ay(0,5096)|0}do{if((aV(c[f>>2]|0,4832)|0)!=0){if((aV(c[f>>2]|0,4816)|0)==0){q=1504;break}if((aV(c[f>>2]|0,4800)|0)==0){q=1504;break}if((aV(c[f>>2]|0,6552)|0)==0){q=1504;break}if((aV(c[f>>2]|0,6536)|0)==0){q=1504;break}if((aV(c[f>>2]|0,6504)|0)!=0){do{if((aV(c[f>>2]|0,6416)|0)!=0){if((aV(c[f>>2]|0,6400)|0)==0){q=1509;break}if((aV(c[f>>2]|0,6344)|0)!=0){if((aV(c[f>>2]|0,6280)|0)!=0){do{if((aV(c[f>>2]|0,6176)|0)!=0){if((aV(c[f>>2]|0,6136)|0)==0){q=1516;break}if((aV(c[f>>2]|0,6072)|0)!=0){if((aV(c[f>>2]|0,6008)|0)!=0){if((aV(c[f>>2]|0,5952)|0)!=0){if((aV(c[f>>2]|0,5880)|0)!=0){if((aV(c[f>>2]|0,5784)|0)!=0){if((aV(c[f>>2]|0,5720)|0)!=0){if((aV(c[f>>2]|0,5616)|0)!=0){if((p|0)<2){q=1562;break L1881}if((a[c[f>>2]|0]|0)<48){q=1562;break L1881}if((a[c[f>>2]|0]|0)>57){q=1562;break L1881}s=aL(c[f>>2]|0)|0;if((s|0)<0){q=1565;break L1881}if((s|0)>127){q=1565;break L1881}if((b|0)==0){q=1567;break L1881}if((c[(c[b>>2]|0)+(s*28|0)>>2]|0)!=0){c0(c[(c[b>>2]|0)+(s*28|0)>>2]|0)}j=bi((c1(c[f+4>>2]|0)|0)+1|0)|0;c[(c[b>>2]|0)+(s*28|0)>>2]=j;t=c[f+4>>2]|0;c2(j|0,t|0)|0;c[(c[b>>2]|0)+(s*28|0)+24>>2]=-1;c[(c[b>>2]|0)+(s*28|0)+20>>2]=-1;c[(c[b>>2]|0)+(s*28|0)+16>>2]=-1;c[(c[b>>2]|0)+(s*28|0)+12>>2]=-1;c[(c[b>>2]|0)+(s*28|0)+8>>2]=-1;c[(c[b>>2]|0)+(s*28|0)+4>>2]=-1;u=2;while(1){if((u|0)>=(p|0)){break}t=aH(c[f+(u<<2)>>2]|0,61)|0;j=t;if((t|0)==0){q=1573;break L1881}t=j;j=t+1|0;a[t]=0;if((aV(c[f+(u<<2)>>2]|0,5272)|0)!=0){if((aV(c[f+(u<<2)>>2]|0,5208)|0)!=0){if((aV(c[f+(u<<2)>>2]|0,5152)|0)!=0){if((aV(c[f+(u<<2)>>2]|0,5008)|0)!=0){if((aV(c[f+(u<<2)>>2]|0,4944)|0)!=0){q=1625;break L1881}if((aV(j|0,5e3)|0)!=0){if((aV(j|0,4992)|0)!=0){if((aV(j|0,4936)|0)!=0){q=1621;break L1881}c[(c[b>>2]|0)+(s*28|0)+24>>2]=1}else{c[(c[b>>2]|0)+(s*28|0)+16>>2]=1}}else{c[(c[b>>2]|0)+(s*28|0)+20>>2]=1}}else{if((aV(j|0,5e3)|0)!=0){if((aV(j|0,4992)|0)!=0){q=1611;break L1881}c[(c[b>>2]|0)+(s*28|0)+16>>2]=0}else{c[(c[b>>2]|0)+(s*28|0)+20>>2]=0}}}else{if((aV(j|0,5144)|0)!=0){if((aV(j|0,5112)|0)!=0){if((aV(j|0,5104)|0)!=0){v=(((aL(j|0)|0)+100|0)*100|0|0)/157|0}else{v=127}}else{v=0}}else{v=64}if((v|0)<0){q=1604;break L1881}if((v|0)>127){q=1604;break L1881}do{if((v|0)==0){if((a[j]|0)==45){break}if((a[j]|0)<48){q=1604;break L1881}if((a[j]|0)>57){q=1604;break L1881}}}while(0);c[(c[b>>2]|0)+(s*28|0)+12>>2]=v}}else{v=aL(j|0)|0;if((v|0)<0){q=1586;break L1881}if((v|0)>127){q=1586;break L1881}if((a[j]|0)<48){q=1586;break L1881}if((a[j]|0)>57){q=1586;break L1881}c[(c[b>>2]|0)+(s*28|0)+4>>2]=v}}else{v=aL(j|0)|0;if((v|0)<0){q=1579;break L1881}if((v|0)>800){q=1579;break L1881}if((a[j]|0)<48){q=1579;break L1881}if((a[j]|0)>57){q=1579;break L1881}c[(c[b>>2]|0)+(s*28|0)+8>>2]=v}u=u+1|0}}else{if((p|0)<2){q=1552;break L1881}s=aL(c[f+4>>2]|0)|0;if((s|0)<0){q=1555;break L1881}if((s|0)>127){q=1555;break L1881}if((c[6704+(s<<2)>>2]|0)==0){c[6704+(s<<2)>>2]=bi(516)|0;c5(c[6704+(s<<2)>>2]|0,0,516);t=bi(3584)|0;c[c[6704+(s<<2)>>2]>>2]=t;c5(c[c[6704+(s<<2)>>2]>>2]|0,0,3584)}b=c[6704+(s<<2)>>2]|0}}else{if((p|0)<2){q=1543;break L1881}s=aL(c[f+4>>2]|0)|0;if((s|0)<0){q=1546;break L1881}if((s|0)>127){q=1546;break L1881}if((c[7216+(s<<2)>>2]|0)==0){c[7216+(s<<2)>>2]=bi(516)|0;c5(c[7216+(s<<2)>>2]|0,0,516);t=bi(3584)|0;c[c[7216+(s<<2)>>2]>>2]=t;c5(c[c[7216+(s<<2)>>2]>>2]|0,0,3584)}b=c[7216+(s<<2)>>2]|0}}else{if((p|0)!=2){q=1539;break L1881}t=c[f+4>>2]|0;c7(7728,t|0,255)|0;a[7983]=0}}else{if((p|0)<2){q=1531;break L1881}s=1;while(1){if((s|0)>=(p|0)){break}c[1660]=(c[1660]|0)+1;cU(c[f+(s<<2)>>2]|0)|0;c[1660]=(c[1660]|0)-1;s=s+1|0}}}else{if((p|0)<2){q=1523;break L1881}s=1;while(1){if((s|0)>=(p|0)){break}bj(c[f+(s<<2)>>2]|0);s=s+1|0}}}else{t=c[m>>2]|0;ar(t|0,5960,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}}else{t=c[m>>2]|0;ar(t|0,6016,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}}else{q=1516}}while(0);if((q|0)==1516){q=0;t=c[m>>2]|0;w=c[f>>2]|0;ar(t|0,6088,(k=i,i=i+8|0,c[k>>2]=w,k)|0)|0;i=k}}else{w=c[m>>2]|0;ar(w|0,6192,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}}else{w=c[m>>2]|0;ar(w|0,6296,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}}else{q=1509}}while(0);if((q|0)==1509){q=0;w=c[m>>2]|0;t=c[f>>2]|0;ar(w|0,6352,(k=i,i=i+8|0,c[k>>2]=t,k)|0)|0;i=k}}else{t=c[m>>2]|0;ar(t|0,6432,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}}else{q=1504}}while(0);if((q|0)==1504){q=0}}if((q|0)==1523){s=c[m>>2]|0;b=g;v=h;ar(s|0,5912,(k=i,i=i+16|0,c[k>>2]=b,c[k+8>>2]=v,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1555){ar(c[m>>2]|0,5520,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1562){ar(c[m>>2]|0,5480,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1565){ar(c[m>>2]|0,5432,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1567){ar(c[m>>2]|0,5320,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1539){ar(c[m>>2]|0,5728,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1531){ar(c[m>>2]|0,5840,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1552){ar(c[m>>2]|0,5576,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1579){ar(c[m>>2]|0,5216,(k=i,i=i+24|0,c[k>>2]=g,c[k+8>>2]=h,c[k+16>>2]=800,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1586){ar(c[m>>2]|0,5160,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1611){ar(c[m>>2]|0,4952,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1621){ar(c[m>>2]|0,4888,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1625){v=c[f+(u<<2)>>2]|0;ar(c[m>>2]|0,5280,(k=i,i=i+24|0,c[k>>2]=g,c[k+8>>2]=h,c[k+16>>2]=v,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1546){ar(c[m>>2]|0,5624,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1543){ar(c[m>>2]|0,5680,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1604){ar(c[m>>2]|0,5016,(k=i,i=i+16|0,c[k>>2]=g,c[k+8>>2]=h,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1573){v=c[f+(u<<2)>>2]|0;ar(c[m>>2]|0,5280,(k=i,i=i+24|0,c[k>>2]=g,c[k+8>>2]=h,c[k+16>>2]=v,k)|0)|0;i=k;l=-2;n=l;i=d;return n|0}else if((q|0)==1646){ao(o|0)|0;l=0;n=l;i=d;return n|0}return 0}function cV(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;c[1672]=d;b[3346]=e;a[6694]=f;b[3348]=g;return 6688}function cW(f,g,h){f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,n=0;j=i;k=f;f=h;if((k|0)==0){l=0;n=l;i=j;return n|0}h=bi(14164)|0;c5(h|0,0,14164);c[h+24>>2]=g;g=0;while(1){if((g|0)>=128){break}if((c[6704+(g<<2)>>2]|0)!=0){c[h+28+(g<<2)>>2]=bi(516)|0;c5(c[h+28+(g<<2)>>2]|0,0,516);c[c[h+28+(g<<2)>>2]>>2]=c[c[6704+(g<<2)>>2]>>2]}if((c[7216+(g<<2)>>2]|0)!=0){c[h+540+(g<<2)>>2]=bi(516)|0;c5(c[h+540+(g<<2)>>2]|0,0,516);c[c[h+540+(g<<2)>>2]>>2]=c[c[7216+(g<<2)>>2]>>2]}g=g+1|0}c[h+20>>2]=70;c[h+13052>>2]=32;c[h+13056>>2]=33280;c[h+4>>2]=c[f>>2];c[h+8>>2]=0;if((b[f+4>>1]&255|0)==16){g=h+8|0;c[g>>2]=c[g>>2]|4}if((b[f+4>>1]&32768|0)!=0){g=h+8|0;c[g>>2]=c[g>>2]|2}if((d[f+6|0]|0)==1){g=h+8|0;c[g>>2]=c[g>>2]|1}g=e[f+4>>1]|0;if((g|0)==36880){c[h+1060>>2]=4}else if((g|0)==16){c[h+1060>>2]=6}else if((g|0)==32776){c[h+1060>>2]=10}else if((g|0)==8){c[h+1060>>2]=8}else if((g|0)==32784){c[h+1060>>2]=2}else{ar(c[m>>2]|0,6144,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;c[h+1060>>2]=6}c[h+1064>>2]=e[f+8>>1]|0;c[h+1068>>2]=bi(e[f+8>>1]<<1)|0;c[h+1072>>2]=bi(e[f+8>>1]<<1<<2)|0;c[h+12>>2]=_((c[h+8>>2]&1|0)!=0?1:2,(c[h+8>>2]&4|0)!=0?2:1)|0;c[h+13060>>2]=(c[f>>2]|0)/1e3|0;if((c[h+13060>>2]|0)<1){c[h+13060>>2]=1}else{if((c[h+13060>>2]|0)>255){c[h+13060>>2]=255}}c[h+13064>>2]=0;c[h+13068>>2]=0;c[h+13076>>2]=cq(k,h,h+13100|0,h+13072|0)|0;if((c[h+13076>>2]|0)==0){c0(h);l=0;n=l;i=j;return n|0}c[h+1052>>2]=0;c[h+1056>>2]=0;if((a[7728]|0)!=0){k=h;bz(k,7728)|0}bv(h)|0;l=h;n=l;i=j;return n|0}function cX(a,b){a=a|0;b=b|0;return cW(a,0,b)|0}function cY(a){a=a|0;var b=0;b=a;bx(b);a=0;while(1){if((a|0)>=128){break}if((c[b+28+(a<<2)>>2]|0)!=0){c0(c[b+28+(a<<2)>>2]|0)}if((c[b+540+(a<<2)>>2]|0)!=0){c0(c[b+540+(a<<2)>>2]|0)}a=a+1|0}c0(c[b+1072>>2]|0);c0(c[b+1068>>2]|0);c0(c[b+13076>>2]|0);a=0;while(1){if(a>>>0>=8){break}if((c[b+13104+(a<<2)>>2]|0)!=0){c0(c[b+13104+(a<<2)>>2]|0)}a=a+1|0}c0(b);return}function cZ(){var a=0,b=0,d=0,e=0;a=0;while(1){if((a|0)>=128){break}if((c[6704+(a<<2)>>2]|0)!=0){b=c[c[6704+(a<<2)>>2]>>2]|0;if((b|0)!=0){d=0;while(1){if((d|0)>=128){break}if((c[b+(d*28|0)>>2]|0)!=0){c0(c[b+(d*28|0)>>2]|0)}d=d+1|0}c0(b)}c0(c[6704+(a<<2)>>2]|0)}if((c[7216+(a<<2)>>2]|0)!=0){e=c[c[7216+(a<<2)>>2]>>2]|0;if((e|0)!=0){d=0;while(1){if((d|0)>=128){break}if((c[e+(d*28|0)>>2]|0)!=0){c0(c[e+(d*28|0)>>2]|0)}d=d+1|0}c0(e)}c0(c[7216+(a<<2)>>2]|0)}a=a+1|0}bk();return}function c_(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b;b=c;c=d;d=0;f=0;while(1){if((d|0)<(b|0)){g=(f|0)!=0^1}else{g=0}if(!g){break}if((an(e+d|0,1,1,c|0)|0)!=1){h=1752;break}if((a[e+d|0]|0)==10){h=1755}else{if((a[e+d|0]|0)==13){h=1755}}if((h|0)==1755){h=0;a[e+d|0]=0;f=1}d=d+1|0}a[e+d|0]=0;if((d|0)!=0){i=e;return i|0}else{i=0;return i|0}return 0}function c$(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,an=0,ao=0,ap=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[1996]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=8024+(h<<2)|0;j=8024+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[1996]=e&~(1<<g)}else{if(l>>>0<(c[2e3]|0)>>>0){aq();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{aq();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[1998]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=8024+(p<<2)|0;m=8024+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[1996]=e&~(1<<r)}else{if(l>>>0<(c[2e3]|0)>>>0){aq();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{aq();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[1998]|0;if((l|0)!=0){q=c[2001]|0;d=l>>>3;l=d<<1;f=8024+(l<<2)|0;k=c[1996]|0;h=1<<d;do{if((k&h|0)==0){c[1996]=k|h;s=f;t=8024+(l+2<<2)|0}else{d=8024+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[2e3]|0)>>>0){s=g;t=d;break}aq();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[1998]=m;c[2001]=e;n=i;return n|0}l=c[1997]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[8288+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[2e3]|0;if(r>>>0<i>>>0){aq();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){aq();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){aq();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){aq();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){aq();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{aq();return 0}}}while(0);L2304:do{if((e|0)!=0){f=d+28|0;i=8288+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[1997]=c[1997]&~(1<<c[f>>2]);break L2304}else{if(e>>>0<(c[2e3]|0)>>>0){aq();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L2304}}}while(0);if(v>>>0<(c[2e3]|0)>>>0){aq();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[2e3]|0)>>>0){aq();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[2e3]|0)>>>0){aq();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[1998]|0;if((f|0)!=0){e=c[2001]|0;i=f>>>3;f=i<<1;q=8024+(f<<2)|0;k=c[1996]|0;g=1<<i;do{if((k&g|0)==0){c[1996]=k|g;y=q;z=8024+(f+2<<2)|0}else{i=8024+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[2e3]|0)>>>0){y=l;z=i;break}aq();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[1998]=p;c[2001]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[1997]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[8288+(A<<2)>>2]|0;L2352:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L2352}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[8288+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[1998]|0)-g|0)>>>0){o=g;break}q=K;m=c[2e3]|0;if(q>>>0<m>>>0){aq();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){aq();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){aq();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){aq();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){aq();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{aq();return 0}}}while(0);L2402:do{if((e|0)!=0){i=K+28|0;m=8288+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[1997]=c[1997]&~(1<<c[i>>2]);break L2402}else{if(e>>>0<(c[2e3]|0)>>>0){aq();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L2402}}}while(0);if(L>>>0<(c[2e3]|0)>>>0){aq();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[2e3]|0)>>>0){aq();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[2e3]|0)>>>0){aq();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;m=8024+(e<<2)|0;r=c[1996]|0;j=1<<i;do{if((r&j|0)==0){c[1996]=r|j;O=m;P=8024+(e+2<<2)|0}else{i=8024+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[2e3]|0)>>>0){O=d;P=i;break}aq();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=8288+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[1997]|0;l=1<<Q;if((m&l|0)==0){c[1997]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=1913;break}else{l=l<<1;m=j}}if((T|0)==1913){if(S>>>0<(c[2e3]|0)>>>0){aq();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[2e3]|0;if(m>>>0<i>>>0){aq();return 0}if(j>>>0<i>>>0){aq();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[1998]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[2001]|0;if(S>>>0>15){R=J;c[2001]=R+o;c[1998]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[1998]=0;c[2001]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[1999]|0;if(o>>>0<J>>>0){S=J-o|0;c[1999]=S;J=c[2002]|0;K=J;c[2002]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1666]|0)==0){J=am(30)|0;if((J-1&J|0)==0){c[1668]=J;c[1667]=J;c[1669]=-1;c[1670]=-1;c[1671]=0;c[2107]=0;c[1666]=(aJ(0)|0)&-16^1431655768;break}else{aq();return 0}}}while(0);J=o+48|0;S=c[1668]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[2106]|0;do{if((O|0)!=0){P=c[2104]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L2494:do{if((c[2107]&4|0)==0){O=c[2002]|0;L2496:do{if((O|0)==0){T=1943}else{L=O;P=8432;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=1943;break L2496}else{P=M}}if((P|0)==0){T=1943;break}L=R-(c[1999]|0)&Q;if(L>>>0>=2147483647){W=0;break}m=aS(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=1952}}while(0);do{if((T|0)==1943){O=aS(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1667]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[2104]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}m=c[2106]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=aS($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=1952}}while(0);L2516:do{if((T|0)==1952){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=1963;break L2494}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[1668]|0;O=K-_+g&-g;if(O>>>0>=2147483647){ac=_;break}if((aS(O|0)|0)==-1){aS(m|0)|0;W=Y;break L2516}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=1963;break L2494}}}while(0);c[2107]=c[2107]|4;ad=W;T=1960}else{ad=0;T=1960}}while(0);do{if((T|0)==1960){if(S>>>0>=2147483647){break}W=aS(S|0)|0;Z=aS(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=1963}}}while(0);do{if((T|0)==1963){ad=(c[2104]|0)+aa|0;c[2104]=ad;if(ad>>>0>(c[2105]|0)>>>0){c[2105]=ad}ad=c[2002]|0;L2536:do{if((ad|0)==0){S=c[2e3]|0;if((S|0)==0|ab>>>0<S>>>0){c[2e3]=ab}c[2108]=ab;c[2109]=aa;c[2111]=0;c[2005]=c[1666];c[2004]=-1;S=0;do{Y=S<<1;ac=8024+(Y<<2)|0;c[8024+(Y+3<<2)>>2]=ac;c[8024+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[2002]=ab+ae;c[1999]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[2003]=c[1670]}else{S=8432;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=1975;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==1975){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[2002]|0;Y=(c[1999]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[2002]=Z+ai;c[1999]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[2003]=c[1670];break L2536}}while(0);if(ab>>>0<(c[2e3]|0)>>>0){c[2e3]=ab}S=ab+aa|0;Y=8432;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=1985;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==1985){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[2002]|0)){J=(c[1999]|0)+K|0;c[1999]=J;c[2002]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[2001]|0)){J=(c[1998]|0)+K|0;c[1998]=J;c[2001]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L2571:do{if(X>>>0<256){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=8024+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[2e3]|0)>>>0){aq();return 0}if((c[U+12>>2]|0)==(Z|0)){break}aq();return 0}}while(0);if((Q|0)==(U|0)){c[1996]=c[1996]&~(1<<V);break}do{if((Q|0)==(R|0)){an=Q+8|0}else{if(Q>>>0<(c[2e3]|0)>>>0){aq();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){an=m;break}aq();return 0}}while(0);c[U+12>>2]=Q;c[an>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){ao=0;break}else{ap=O;ar=e}}else{ap=L;ar=g}while(1){g=ap+20|0;L=c[g>>2]|0;if((L|0)!=0){ap=L;ar=g;continue}g=ap+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ap=L;ar=g}}if(ar>>>0<(c[2e3]|0)>>>0){aq();return 0}else{c[ar>>2]=0;ao=ap;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[2e3]|0)>>>0){aq();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){aq();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;ao=P;break}else{aq();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=8288+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=ao;if((ao|0)!=0){break}c[1997]=c[1997]&~(1<<c[P>>2]);break L2571}else{if(m>>>0<(c[2e3]|0)>>>0){aq();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=ao}else{c[m+20>>2]=ao}if((ao|0)==0){break L2571}}}while(0);if(ao>>>0<(c[2e3]|0)>>>0){aq();return 0}c[ao+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[2e3]|0)>>>0){aq();return 0}else{c[ao+16>>2]=P;c[P+24>>2]=ao;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[2e3]|0)>>>0){aq();return 0}else{c[ao+20>>2]=P;c[P+24>>2]=ao;break}}}while(0);as=ab+(($|al)+aa)|0;at=$+K|0}else{as=Z;at=K}J=as+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=at|1;c[ab+(at+W)>>2]=at;J=at>>>3;if(at>>>0<256){V=J<<1;X=8024+(V<<2)|0;P=c[1996]|0;m=1<<J;do{if((P&m|0)==0){c[1996]=P|m;au=X;av=8024+(V+2<<2)|0}else{J=8024+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[2e3]|0)>>>0){au=U;av=J;break}aq();return 0}}while(0);c[av>>2]=_;c[au+12>>2]=_;c[ab+(W+8)>>2]=au;c[ab+(W+12)>>2]=X;break}V=ac;m=at>>>8;do{if((m|0)==0){aw=0}else{if(at>>>0>16777215){aw=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;aw=at>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=8288+(aw<<2)|0;c[ab+(W+28)>>2]=aw;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[1997]|0;Q=1<<aw;if((X&Q|0)==0){c[1997]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((aw|0)==31){ax=0}else{ax=25-(aw>>>1)|0}Q=at<<ax;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(at|0)){break}ay=X+16+(Q>>>31<<2)|0;m=c[ay>>2]|0;if((m|0)==0){T=2058;break}else{Q=Q<<1;X=m}}if((T|0)==2058){if(ay>>>0<(c[2e3]|0)>>>0){aq();return 0}else{c[ay>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[2e3]|0;if(X>>>0<$>>>0){aq();return 0}if(m>>>0<$>>>0){aq();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=8432;while(1){az=c[W>>2]|0;if(az>>>0<=Y>>>0){aA=c[W+4>>2]|0;aB=az+aA|0;if(aB>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=az+(aA-39)|0;if((W&7|0)==0){aC=0}else{aC=-W&7}W=az+(aA-47+aC)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aD=0}else{aD=-_&7}_=aa-40-aD|0;c[2002]=ab+aD;c[1999]=_;c[ab+(aD+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[2003]=c[1670];c[ac+4>>2]=27;c[W>>2]=c[2108];c[W+4>>2]=c[2109];c[W+8>>2]=c[2110];c[W+12>>2]=c[2111];c[2108]=ab;c[2109]=aa;c[2111]=0;c[2110]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<aB>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<aB>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256){K=W<<1;Z=8024+(K<<2)|0;S=c[1996]|0;m=1<<W;do{if((S&m|0)==0){c[1996]=S|m;aE=Z;aF=8024+(K+2<<2)|0}else{W=8024+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[2e3]|0)>>>0){aE=Q;aF=W;break}aq();return 0}}while(0);c[aF>>2]=ad;c[aE+12>>2]=ad;c[ad+8>>2]=aE;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aG=0}else{if(_>>>0>16777215){aG=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aG=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=8288+(aG<<2)|0;c[ad+28>>2]=aG;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[1997]|0;Q=1<<aG;if((Z&Q|0)==0){c[1997]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aG|0)==31){aH=0}else{aH=25-(aG>>>1)|0}Q=_<<aH;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aI=Z+16+(Q>>>31<<2)|0;m=c[aI>>2]|0;if((m|0)==0){T=2093;break}else{Q=Q<<1;Z=m}}if((T|0)==2093){if(aI>>>0<(c[2e3]|0)>>>0){aq();return 0}else{c[aI>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[2e3]|0;if(Z>>>0<m>>>0){aq();return 0}if(_>>>0<m>>>0){aq();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[1999]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[1999]=_;ad=c[2002]|0;Q=ad;c[2002]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(aQ()|0)>>2]=12;n=0;return n|0}function c0(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[2e3]|0;if(b>>>0<e>>>0){aq()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){aq()}h=f&-8;i=a+(h-8)|0;j=i;L2753:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){aq()}if((n|0)==(c[2001]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[1998]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=8024+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){aq()}if((c[k+12>>2]|0)==(n|0)){break}aq()}}while(0);if((s|0)==(k|0)){c[1996]=c[1996]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){aq()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}aq()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){aq()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){aq()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){aq()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{aq()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=8288+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[1997]=c[1997]&~(1<<c[v>>2]);q=n;r=o;break L2753}else{if(p>>>0<(c[2e3]|0)>>>0){aq()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L2753}}}while(0);if(A>>>0<(c[2e3]|0)>>>0){aq()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[2e3]|0)>>>0){aq()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[2e3]|0)>>>0){aq()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){aq()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){aq()}do{if((e&2|0)==0){if((j|0)==(c[2002]|0)){B=(c[1999]|0)+r|0;c[1999]=B;c[2002]=q;c[q+4>>2]=B|1;if((q|0)!=(c[2001]|0)){return}c[2001]=0;c[1998]=0;return}if((j|0)==(c[2001]|0)){B=(c[1998]|0)+r|0;c[1998]=B;c[2001]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L2856:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=8024+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[2e3]|0)>>>0){aq()}if((c[u+12>>2]|0)==(j|0)){break}aq()}}while(0);if((g|0)==(u|0)){c[1996]=c[1996]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[2e3]|0)>>>0){aq()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}aq()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[2e3]|0)>>>0){aq()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[2e3]|0)>>>0){aq()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){aq()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{aq()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=8288+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[1997]=c[1997]&~(1<<c[t>>2]);break L2856}else{if(f>>>0<(c[2e3]|0)>>>0){aq()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L2856}}}while(0);if(E>>>0<(c[2e3]|0)>>>0){aq()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[2e3]|0)>>>0){aq()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[2e3]|0)>>>0){aq()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[2001]|0)){H=B;break}c[1998]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=8024+(d<<2)|0;A=c[1996]|0;E=1<<r;do{if((A&E|0)==0){c[1996]=A|E;I=e;J=8024+(d+2<<2)|0}else{r=8024+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[2e3]|0)>>>0){I=h;J=r;break}aq()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=8288+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[1997]|0;d=1<<K;do{if((r&d|0)==0){c[1997]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=2270;break}else{A=A<<1;J=E}}if((N|0)==2270){if(M>>>0<(c[2e3]|0)>>>0){aq()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[2e3]|0;if(J>>>0<E>>>0){aq()}if(B>>>0<E>>>0){aq()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[2004]|0)-1|0;c[2004]=q;if((q|0)==0){O=8440}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[2004]=-1;return}function c1(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function c2(b,c){b=b|0;c=c|0;var d=0;do{a[b+d|0]=a[c+d|0];d=d+1|0}while(a[c+(d-1)|0]|0);return b|0}function c3(b,c){b=b|0;c=c|0;var d=0,e=0;d=b+(c1(b)|0)|0;do{a[d+e|0]=a[c+e|0];e=e+1|0}while(a[c+(e-1)|0]|0);return b|0}function c4(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0;while((e|0)<(c|0)){f=d[a+e|0]|0;g=d[b+e|0]|0;if((f|0)!=(g|0))return((f|0)>(g|0)?1:-1)|0;e=e+1|0}return 0}function c5(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function c6(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function c7(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;while((e|0)<(d|0)){a[b+e|0]=f?0:a[c+e|0]|0;f=f?1:(a[c+e|0]|0)==0;e=e+1|0}return b|0}function c8(a,b){a=a|0;b=b|0;return aW[a&7](b|0)|0}function c9(a,b){a=a|0;b=b|0;aX[a&1](b|0)}function da(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return aY[a&7](b|0,c|0,d|0,e|0)|0}function db(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aZ[a&15](b|0,c|0,d|0)}function dc(a){a=a|0;a_[a&1]()}function dd(a,b,c){a=a|0;b=b|0;c=c|0;return a$[a&1](b|0,c|0)|0}function de(a){a=a|0;$(0);return 0}function df(a){a=a|0;$(1)}function dg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;$(2);return 0}function dh(a,b,c){a=a|0;b=b|0;c=c|0;$(3)}function di(){$(4)}function dj(a,b){a=a|0;b=b|0;$(5);return 0}
// EMSCRIPTEN_END_FUNCS
var aW=[de,de,cL,de,cJ,de,de,de];var aX=[df,df];var aY=[dg,dg,cI,dg,cK,dg,dg,dg];var aZ=[dh,dh,bZ,dh,b$,dh,b_,dh,bY,dh,bX,dh,dh,dh,dh,dh];var a_=[di,di];var a$=[dj,dj];return{_strlen:c1,_strcat:c3,_mid_create_options:cV,_mid_istream_open_mem:cO,_mid_istream_open_file:cN,_mid_song_read_wave:b6,_mid_exit:cZ,_mid_song_note_on:b0,_strncpy:c7,_memset:c5,_memcpy:c6,_mid_song_get_missing_instrument:bu,_mid_istream_close:cR,_mid_song_free:cY,_mid_init:cT,_mid_song_load:cX,_mid_song_start:b3,_mid_song_get_num_missing_instruments:bt,_memcmp:c4,_free:c0,_malloc:c$,_strcpy:c2,runPostSets:bg,stackAlloc:a0,stackSave:a1,stackRestore:a2,setThrew:a3,setTempRet0:a6,setTempRet1:a7,setTempRet2:a8,setTempRet3:a9,setTempRet4:ba,setTempRet5:bb,setTempRet6:bc,setTempRet7:bd,setTempRet8:be,setTempRet9:bf,dynCall_ii:c8,dynCall_vi:c9,dynCall_iiiii:da,dynCall_viii:db,dynCall_v:dc,dynCall_iii:dd}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_vi": invoke_vi, "invoke_iiiii": invoke_iiiii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "_strncmp": _strncmp, "_lseek": _lseek, "_sysconf": _sysconf, "_fread": _fread, "_fclose": _fclose, "_strtok_r": _strtok_r, "_abort": _abort, "_fprintf": _fprintf, "_close": _close, "_pread": _pread, "_fflush": _fflush, "_fopen": _fopen, "_open": _open, "_strtol": _strtol, "_strtok": _strtok, "___setErrNo": ___setErrNo, "__reallyNegative": __reallyNegative, "_fseek": _fseek, "_send": _send, "_write": _write, "_strrchr": _strrchr, "_sin": _sin, "_printf": _printf, "_strchr": _strchr, "_read": _read, "_time": _time, "__formatString": __formatString, "_atoi": _atoi, "_recv": _recv, "_pwrite": _pwrite, "_llvm_pow_f64": _llvm_pow_f64, "_fsync": _fsync, "___errno_location": ___errno_location, "_isspace": _isspace, "_sbrk": _sbrk, "__parseInt": __parseInt, "_fwrite": _fwrite, "_strcmp": _strcmp, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity, "_stderr": _stderr }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _strcat = Module["_strcat"] = asm["_strcat"];
var _mid_create_options = Module["_mid_create_options"] = asm["_mid_create_options"];
var _mid_istream_open_mem = Module["_mid_istream_open_mem"] = asm["_mid_istream_open_mem"];
var _mid_istream_open_file = Module["_mid_istream_open_file"] = asm["_mid_istream_open_file"];
var _mid_song_read_wave = Module["_mid_song_read_wave"] = asm["_mid_song_read_wave"];
var _mid_exit = Module["_mid_exit"] = asm["_mid_exit"];
var _mid_song_note_on = Module["_mid_song_note_on"] = asm["_mid_song_note_on"];
var _strncpy = Module["_strncpy"] = asm["_strncpy"];
var _memset = Module["_memset"] = asm["_memset"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _mid_song_get_missing_instrument = Module["_mid_song_get_missing_instrument"] = asm["_mid_song_get_missing_instrument"];
var _mid_istream_close = Module["_mid_istream_close"] = asm["_mid_istream_close"];
var _mid_song_free = Module["_mid_song_free"] = asm["_mid_song_free"];
var _mid_init = Module["_mid_init"] = asm["_mid_init"];
var _mid_song_load = Module["_mid_song_load"] = asm["_mid_song_load"];
var _mid_song_start = Module["_mid_song_start"] = asm["_mid_song_start"];
var _mid_song_get_num_missing_instruments = Module["_mid_song_get_num_missing_instruments"] = asm["_mid_song_get_num_missing_instruments"];
var _memcmp = Module["_memcmp"] = asm["_memcmp"];
var _free = Module["_free"] = asm["_free"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _strcpy = Module["_strcpy"] = asm["_strcpy"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
var calledRun = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun && shouldRunNow) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + (new Error().stack);
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
(function() {
function assert(check, msg) {
  if (!check) throw msg + new Error().stack;
}
Module['FS_createPath']('/', 'pat', true, true);
Module['FS_createPath']('/pat', 'MT32Drums', true, true);
Module['FS_createDataFile']('/', 'timidity.cfg', [100, 105, 114, 32, 46, 47, 112, 97, 116, 10, 10, 100, 114, 117, 109, 115, 101, 116, 32, 48, 10, 10, 32, 51, 53, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 48, 46, 112, 97, 116, 10, 32, 51, 54, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 49, 46, 112, 97, 116, 10, 32, 51, 55, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 50, 46, 112, 97, 116, 10, 32, 51, 56, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 51, 46, 112, 97, 116, 10, 32, 51, 57, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 52, 46, 112, 97, 116, 10, 32, 52, 48, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 53, 46, 112, 97, 116, 10, 32, 52, 49, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 54, 46, 112, 97, 116, 10, 32, 52, 50, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 55, 46, 112, 97, 116, 10, 32, 52, 51, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 56, 46, 112, 97, 116, 10, 32, 52, 52, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 57, 46, 112, 97, 116, 10, 32, 52, 53, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 49, 48, 46, 112, 97, 116, 10, 32, 52, 54, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 49, 49, 46, 112, 97, 116, 10, 32, 52, 55, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 49, 50, 46, 112, 97, 116, 10, 32, 52, 56, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 49, 51, 46, 112, 97, 116, 10, 32, 52, 57, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 49, 52, 46, 112, 97, 116, 10, 32, 53, 48, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 49, 53, 46, 112, 97, 116, 10, 32, 53, 49, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 49, 54, 46, 112, 97, 116, 10, 32, 53, 50, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 49, 55, 46, 112, 97, 116, 10, 32, 53, 51, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 49, 56, 46, 112, 97, 116, 10, 32, 53, 52, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 49, 57, 46, 112, 97, 116, 10, 32, 53, 53, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 50, 48, 46, 112, 97, 116, 10, 32, 53, 54, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 50, 49, 46, 112, 97, 116, 10, 32, 53, 55, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 50, 50, 46, 112, 97, 116, 10, 32, 53, 56, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 50, 51, 46, 112, 97, 116, 10, 32, 53, 57, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 50, 52, 46, 112, 97, 116, 10, 32, 54, 48, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 50, 53, 46, 112, 97, 116, 10, 32, 54, 49, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 50, 54, 46, 112, 97, 116, 10, 32, 54, 50, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 50, 55, 46, 112, 97, 116, 10, 32, 54, 51, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 50, 56, 46, 112, 97, 116, 10, 32, 54, 52, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 50, 57, 46, 112, 97, 116, 10, 32, 54, 53, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 51, 48, 46, 112, 97, 116, 10, 32, 54, 54, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 51, 49, 46, 112, 97, 116, 10, 32, 54, 55, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 51, 50, 46, 112, 97, 116, 10, 32, 54, 56, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 51, 51, 46, 112, 97, 116, 10, 32, 54, 57, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 51, 52, 46, 112, 97, 116, 10, 32, 55, 48, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 51, 53, 46, 112, 97, 116, 10, 32, 55, 49, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 51, 54, 46, 112, 97, 116, 10, 32, 55, 50, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 51, 55, 46, 112, 97, 116, 10, 32, 55, 51, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 51, 56, 46, 112, 97, 116, 10, 32, 55, 52, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 51, 57, 46, 112, 97, 116, 10, 32, 55, 53, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 52, 48, 46, 112, 97, 116, 10, 32, 55, 54, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 52, 49, 46, 112, 97, 116, 10, 32, 55, 55, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 52, 50, 46, 112, 97, 116, 10, 32, 55, 56, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 52, 51, 46, 112, 97, 116, 10, 32, 55, 57, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 52, 52, 46, 112, 97, 116, 10, 32, 56, 48, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 52, 53, 46, 112, 97, 116, 10, 32, 56, 49, 9, 32, 77, 84, 51, 50, 68, 114, 117, 109, 115, 47, 109, 116, 51, 50, 100, 114, 117, 109, 45, 52, 54, 46, 112, 97, 116, 10, 10, 98, 97, 110, 107, 32, 48, 10, 10, 32, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 50, 55, 46, 112, 97, 116, 10, 32, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 50, 54, 46, 112, 97, 116, 10, 32, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 50, 53, 46, 112, 97, 116, 10, 32, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 50, 52, 46, 112, 97, 116, 10, 32, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 50, 51, 46, 112, 97, 116, 10, 32, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 50, 50, 46, 112, 97, 116, 10, 32, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 50, 49, 46, 112, 97, 116, 10, 32, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 50, 48, 46, 112, 97, 116, 10, 32, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 49, 57, 46, 112, 97, 116, 10, 32, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 49, 56, 46, 112, 97, 116, 10, 32, 49, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 49, 55, 46, 112, 97, 116, 10, 32, 49, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 49, 54, 46, 112, 97, 116, 10, 32, 49, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 49, 53, 46, 112, 97, 116, 10, 32, 49, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 49, 52, 46, 112, 97, 116, 10, 32, 49, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 49, 51, 46, 112, 97, 116, 10, 32, 49, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 49, 50, 46, 112, 97, 116, 10, 32, 49, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 49, 49, 46, 112, 97, 116, 10, 32, 49, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 49, 48, 46, 112, 97, 116, 10, 32, 49, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 48, 57, 46, 112, 97, 116, 10, 32, 49, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 48, 56, 46, 112, 97, 116, 10, 32, 50, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 48, 55, 46, 112, 97, 116, 10, 32, 50, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 48, 54, 46, 112, 97, 116, 10, 32, 50, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 48, 53, 46, 112, 97, 116, 10, 32, 50, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 48, 52, 46, 112, 97, 116, 10, 32, 50, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 48, 51, 46, 112, 97, 116, 10, 32, 50, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 48, 50, 46, 112, 97, 116, 10, 32, 50, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 48, 49, 46, 112, 97, 116, 10, 32, 50, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 48, 48, 46, 112, 97, 116, 10, 32, 50, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 57, 57, 46, 112, 97, 116, 10, 32, 50, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 57, 56, 46, 112, 97, 116, 10, 32, 51, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 57, 55, 46, 112, 97, 116, 10, 32, 51, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 57, 54, 46, 112, 97, 116, 10, 32, 51, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 57, 53, 46, 112, 97, 116, 10, 32, 51, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 57, 52, 46, 112, 97, 116, 10, 32, 51, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 57, 51, 46, 112, 97, 116, 10, 32, 51, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 57, 50, 46, 112, 97, 116, 10, 32, 51, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 57, 49, 46, 112, 97, 116, 10, 32, 51, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 57, 48, 46, 112, 97, 116, 10, 32, 51, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 56, 57, 46, 112, 97, 116, 10, 32, 51, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 56, 56, 46, 112, 97, 116, 10, 32, 52, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 56, 55, 46, 112, 97, 116, 10, 32, 52, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 56, 54, 46, 112, 97, 116, 10, 32, 52, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 56, 53, 46, 112, 97, 116, 10, 32, 52, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 56, 52, 46, 112, 97, 116, 10, 32, 52, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 56, 51, 46, 112, 97, 116, 10, 32, 52, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 56, 50, 46, 112, 97, 116, 10, 32, 52, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 56, 49, 46, 112, 97, 116, 10, 32, 52, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 56, 48, 46, 112, 97, 116, 10, 32, 52, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 55, 57, 46, 112, 97, 116, 10, 32, 52, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 55, 56, 46, 112, 97, 116, 10, 32, 53, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 55, 55, 46, 112, 97, 116, 10, 32, 53, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 55, 54, 46, 112, 97, 116, 10, 32, 53, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 55, 53, 46, 112, 97, 116, 10, 32, 53, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 55, 52, 46, 112, 97, 116, 10, 32, 53, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 55, 51, 46, 112, 97, 116, 10, 32, 53, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 55, 50, 46, 112, 97, 116, 10, 32, 53, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 55, 49, 46, 112, 97, 116, 10, 32, 53, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 55, 48, 46, 112, 97, 116, 10, 32, 53, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 54, 57, 46, 112, 97, 116, 10, 32, 53, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 54, 56, 46, 112, 97, 116, 10, 32, 54, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 54, 55, 46, 112, 97, 116, 10, 32, 54, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 54, 54, 46, 112, 97, 116, 10, 32, 54, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 54, 53, 46, 112, 97, 116, 10, 32, 54, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 54, 52, 46, 112, 97, 116, 10, 32, 54, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 54, 51, 46, 112, 97, 116, 10, 32, 54, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 54, 50, 46, 112, 97, 116, 10, 32, 54, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 54, 49, 46, 112, 97, 116, 10, 32, 54, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 54, 48, 46, 112, 97, 116, 10, 32, 54, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 53, 57, 46, 112, 97, 116, 10, 32, 54, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 53, 56, 46, 112, 97, 116, 10, 32, 55, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 53, 55, 46, 112, 97, 116, 10, 32, 55, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 53, 54, 46, 112, 97, 116, 10, 32, 55, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 53, 53, 46, 112, 97, 116, 10, 32, 55, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 53, 52, 46, 112, 97, 116, 10, 32, 55, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 53, 51, 46, 112, 97, 116, 10, 32, 55, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 53, 50, 46, 112, 97, 116, 10, 32, 55, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 53, 49, 46, 112, 97, 116, 10, 32, 55, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 53, 48, 46, 112, 97, 116, 10, 32, 55, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 52, 57, 46, 112, 97, 116, 10, 32, 55, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 52, 56, 46, 112, 97, 116, 10, 32, 56, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 52, 55, 46, 112, 97, 116, 10, 32, 56, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 52, 54, 46, 112, 97, 116, 10, 32, 56, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 52, 53, 46, 112, 97, 116, 10, 32, 56, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 52, 52, 46, 112, 97, 116, 10, 32, 56, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 52, 51, 46, 112, 97, 116, 10, 32, 56, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 52, 50, 46, 112, 97, 116, 10, 32, 56, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 52, 49, 46, 112, 97, 116, 10, 32, 56, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 52, 48, 46, 112, 97, 116, 10, 32, 56, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 51, 57, 46, 112, 97, 116, 10, 32, 56, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 51, 56, 46, 112, 97, 116, 10, 32, 57, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 51, 55, 46, 112, 97, 116, 10, 32, 57, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 51, 54, 46, 112, 97, 116, 10, 32, 57, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 51, 53, 46, 112, 97, 116, 10, 32, 57, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 51, 52, 46, 112, 97, 116, 10, 32, 57, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 51, 51, 46, 112, 97, 116, 10, 32, 57, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 51, 50, 46, 112, 97, 116, 10, 32, 57, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 51, 49, 46, 112, 97, 116, 10, 32, 57, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 51, 48, 46, 112, 97, 116, 10, 32, 57, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 50, 57, 46, 112, 97, 116, 10, 32, 57, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 50, 56, 46, 112, 97, 116, 10, 32, 49, 48, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 50, 55, 46, 112, 97, 116, 10, 32, 49, 48, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 50, 54, 46, 112, 97, 116, 10, 32, 49, 48, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 50, 53, 46, 112, 97, 116, 10, 32, 49, 48, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 50, 52, 46, 112, 97, 116, 10, 32, 49, 48, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 50, 51, 46, 112, 97, 116, 10, 32, 49, 48, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 50, 50, 46, 112, 97, 116, 10, 32, 49, 48, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 50, 49, 46, 112, 97, 116, 10, 32, 49, 48, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 50, 48, 46, 112, 97, 116, 10, 32, 49, 48, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 57, 46, 112, 97, 116, 10, 32, 49, 48, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 56, 46, 112, 97, 116, 10, 32, 49, 49, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 55, 46, 112, 97, 116, 10, 32, 49, 49, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 54, 46, 112, 97, 116, 10, 32, 49, 49, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 53, 46, 112, 97, 116, 10, 32, 49, 49, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 52, 46, 112, 97, 116, 10, 32, 49, 49, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 51, 46, 112, 97, 116, 10, 32, 49, 49, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 50, 46, 112, 97, 116, 10, 32, 49, 49, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 49, 46, 112, 97, 116, 10, 32, 49, 49, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 48, 46, 112, 97, 116, 10, 32, 49, 49, 56, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 57, 46, 112, 97, 116, 10, 32, 49, 49, 57, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 56, 46, 112, 97, 116, 10, 32, 49, 50, 48, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 55, 46, 112, 97, 116, 10, 32, 49, 50, 49, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 54, 46, 112, 97, 116, 10, 32, 49, 50, 50, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 53, 46, 112, 97, 116, 10, 32, 49, 50, 51, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 52, 46, 112, 97, 116, 10, 32, 49, 50, 52, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 51, 46, 112, 97, 116, 10, 32, 49, 50, 53, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 50, 46, 112, 97, 116, 10, 32, 49, 50, 54, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 49, 46, 112, 97, 116, 10, 32, 49, 50, 55, 9, 32, 97, 114, 97, 99, 104, 110, 111, 45, 48, 46, 112, 97, 116, 10], true, true);
Module['FS_createDataFile']('/pat', 'dummy.txt', [100, 117, 109, 109, 121, 10], true, true);
Module['FS_createDataFile']('/pat/MT32Drums', 'dummy.txt', [100, 117, 109, 109, 121, 10], true, true);
})();
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
});
