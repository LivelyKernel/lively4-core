/*
 * Copyright (c) 2008-2016 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

import * as cop from 'Layers.js';

class MethodManipulator {
  constructor () {
    this.parameterRegex = /function\s*\(([^\)]*)\)/;
  }
  
  // String manipulation
  removeSurroundingWhitespaces (str) {
    return Strings.removeSurroundingWhitespaces(str);
  }
  removeSpacesAfterFunctionKeyword (methodString) {
    return methodString.replace(/(function)\s*(\(.*)/, '$1$2');
  }
  
  // Method accessing
  methodBody (methodString) {
    var result = methodString;
    result = result.substring(result.indexOf('{') + 1, result.length);
    result = result.substring(0, result.lastIndexOf('}'));
    result = this.removeSurroundingWhitespaces(result);
    return result;
  }
  parameterNames (methodString) {
    var regexResult = this.parameterRegex.exec(methodString);
    if (!regexResult || !regexResult[1]) {
      return [];
    }
    var parameterString = regexResult[1];
    if (parameterString.length == 0) {
      return [];
    }
    var parameters = parameterString.split(',').collect(function(str) {
      return this.removeSurroundingWhitespaces(str)
    }, this);
    return parameters;
  }
  firstParameter (methodString) {
    return this.parameterNames(methodString)[0] || null;
  }
  
  // Method manipulation
  removeFirstParameter (methodString) {
    var params = this.parameterNames(methodString);
    params.shift(); // remove first
    return methodString.replace(this.parameterRegex, 'function(' + params.join(', ') + ')');
  }
  removeOuterFunction (src) {
    var front = /^\s*(function[^\(]*\([^\)]*\)\s+\{\s*)/;
    var back = /\s*},?\s*$/;
    return src.replace(front, '').replace(back, '');
  }
  addFirstParameter (methodString, param) {
    var params = this.parameterNames(methodString);
    params.unshift(param); // remove first
    return methodString.replace(this.parameterRegex, 'function(' + params.join(', ') + ')');
  }
  addFirstLine (src, line) {
    var regexp = /(function[^\(]*\([^\)]*\)\s+\{)/;
    if (line[line.length-1] !== ';') {
      line += ';';
    }
    return src.replace(regexp, '$1' + line);
  }
  inlineProceed (layerSrc, originalSrc, proceedVarName) {
    // if layerSrc has a proceed call then replace the call with originalSrc
    layerSrc = this.removeSpacesAfterFunctionKeyword(layerSrc);
    originalSrc = this.removeSpacesAfterFunctionKeyword(originalSrc);
  
    // remove proceed parameter
    if (this.firstParameter(layerSrc) == proceedVarName) {
      layerSrc = this.removeFirstParameter(layerSrc);
    }
  
    // super check
    var superVarName = '$super';
    var hasSuper = this.firstParameter(originalSrc) == superVarName;
    if (hasSuper) {
      originalSrc = this.removeFirstParameter(originalSrc);
      layerSrc = this.addFirstParameter(layerSrc, superVarName);
    }
  
    // remove trailing ,
    originalSrc = this.removeSurroundingWhitespaces(originalSrc);
    if (originalSrc.endsWith(',')) {
      originalSrc = originalSrc.substring(0, originalSrc.length-1);
    }
  
    // is there a procced call?
    if (!proceedVarName || !layerSrc.include(proceedVarName)) {
      return layerSrc;
    }
  
    // fix indentation (each line of original source but the first gets a tab
    var lines = originalSrc.split('\n');
    var tab = lively.morphic.Text.prototype.tab;
    for (var i = 1; i< lines.length; i++) {
      lines[i] = tab + lines[i];
    }
    originalSrc = lines.join('\n');
  
    originalSrc = '(' + originalSrc + ')';
    // proceedVarName = proceedVarName.replace('$', '\\$')
  
    if (!this.regexpCache) {
      this.regexpCache = {};
    }
    if (!this.regexpCache[proceedVarName]) {
      this.regexpCache[proceedVarName] = {
        argRegExp: new RegExp('([^\\/]*(\\/\\/)?.*)' + proceedVarName + '\\(([^\\)]*)\\)', 'g'),
        simpleRegexp: new RegExp('([^\\/]*(\\/\\/)?.*)' + proceedVarName, 'g')
      }
    }
  
    var regexps = this.regexpCache[proceedVarName];
    
    // replace the calls with + w/o args, this means something like "cop.proceed(args)"
    layerSrc = layerSrc.replace(regexps.argRegExp,
      function(match, beforeComment, comment, args) {
        if (comment) {
          return match;
        }
        var rewritten = beforeComment.replace(/(\))\s*$/, '$1;\n');
        // var rewritten = beforeComment.replace(/\n[\s]*$/, ';\n')
        return  rewritten + originalSrc + '.call(this' + (args ? ', ' + args : '') + ')';
    });
  
    // replace the proceeds that are not normally activated
    layerSrc = layerSrc.replace(regexps.simpleRegexp,
      function(match, beforeComment, comment) {
        return comment ? match : (beforeComment + originalSrc);
    });
  
    return layerSrc;
  }
}

Object.assign(cop.Layer.prototype, {
  // Flattening
  layerDefOfObject (object) {
    var result = this[object._layer_object_id];
    if (!result)  {
      return {};
      // throw new Error('Cannot access layer def for ' + object.type ? object.type : object + ' in ' + this);
    }
    return result;
  },
  layerDefOfProperty (object, name, type) {
    return cop.lookupLayeredFunctionForObject(object, this, name, type);
  },
  namesOfLayeredMethods (obj) {
    var layerDef = this.layerDefOfObject(obj);
    return Functions.all(layerDef).reject(function(ea) {
      return lively.Class.isClass(layerDef[ea]);
    });
  },
  namesOfLayeredProperties (obj) {
    var layerDef = this.layerDefOfObject(obj), result = [];
    for (var name in layerDef) {
      if (!layerDef.hasOwnProperty(name)) {
        continue;
      }
      var value = layerDef[name];
      if (value === obj) {
        continue; /*discard _layered_object*/
      }
      if (Object.isFunction(value) && !obj.__lookupGetter__(name)) {
        continue;
      }
      result.push(name);
    }
    return result
  },
  generateMethodReplacement (object, methodName) {
    var proceedReplacement = object[methodName].getOriginal().toString();
    return Strings.format('%s: %s,',
                          methodName, this.generateMethodBody(object, methodName, proceedReplacement));
  },
  generateMethodBody (object, methodName, proceedReplacement, type, varMapping, partialMethod) {
    var method = partialMethod || cop.lookupLayeredFunctionForObject(object, this, methodName, type);
    if (!method) {
      throw new Error('method ' + object.type ? object.type : object +
                      '>>' + methodName + ' not layered in ' + this);
    }
    if (varMapping) { // add bound variables of method to varMapping, overwrite existing
      var partialVarMapping = partialMethod.getVarMapping();
      for (var name in partialVarMapping) {
        varMapping[name] = partialVarMapping[name];
      }
    }
    var source = String(partialMethod), proceedName = 'cop.proceed';
    return cop.methodManipulator.inlineProceed(source, proceedReplacement, proceedName);
  },
  generatePropertyReplacement (object, propName, type) {
    var def = this.layerDefOfProperty(object, propName, type);
    if (!def) {
      return null;
    }
    var result = String(def);
    if (result.startsWith('function')) {
      result = result.replace(/^function/, 'get');
    }
    if (!result.endsWith(',')) {
      result += ',';
    }
    return result;
  },
  layeredObjects () {
    // retrieve all the defs objects stored inside me with counter numbers
    var result = [];
    for (var name in this) {
      if (!this.hasOwnProperty(name)) {
        continue;
      }
      var prop = this[name];
      if (prop._layered_object && !result.includes(prop._layered_object)) {
        result.push(prop._layered_object);
      }
    }
    return result;
  },
  flattened (blacklist = []) {
    var objects = this.layeredObjects();
    var objectDefs = [];
    var tab = lively.morphic.Text.prototype.tab;
    for (var i = 0; i < objects.length; i++) {
      var object = objects[i];
      if (!this.objectName(object)) {
        continue;
      }
      var def = '\n\n';
      var props = this.namesOfLayeredProperties(object).reject(function(prop) {
        return blacklist.any(function(spec) {
          return spec.object == object && spec.name == prop;
        });
      });
      for (var j = 0; j < props.length; j++) {
        var getter = this.generatePropertyReplacement(object, props[j], 'getter');
        if (getter) {
          def += tab + getter + '\n\n';
        }
        var setter = this.generatePropertyReplacement(object, props[j], 'setter');
        if (setter) {
          def += tab + setter + '\n\n';
        }
      }
      var methods = this.namesOfLayeredMethods(object).reject(function(method) {
        return blacklist.any(function(spec) {
          return spec.object == object && spec.name == method;
        });
      });
      def += methods.collect(function(method) {
        return tab + this.generateMethodReplacement(object, method);
      }, this). join('\n\n');
      if (methods.length > 0) {
        def += '\n\n';
      }
      objectDefs.push(this.objectDef(object, def));
    }
  
    return objectDefs.join('\n\n');
  },
  writeFlattened (moduleName, blacklist, requirements) {
    blacklist = blacklist || [];
    var blacklistDescr = blacklist.collect(function(spec) {
      return '{object: ' + this.objectName(spec.object) + ', name: ' + spec.name + '}';
    }, this);
    require('lively.ide').toRun(function() {
      var flattened = this.flattened(blacklist);
      var note = Strings.format(
          '/*\n * Generated file\n * %s\n * %s.writeFlattened(\'%s\', [%s], [%s])\n */',
          new Date(), this.name, moduleName, blacklistDescr.join(','), JSON.stringify(requirements));
      var src = Strings.format(
          '%s\nmodule(\'%s\').requires(%s).toRun(function() {\n\n%s\n\n}); // end of module',
          note, moduleName, JSON.stringify(requirements), flattened);
      var w = new lively.ide.ModuleWrapper(moduleName, 'js');
      w.setSource(src);
    }.bind(this));
  },
  objectName (obj) {
    if (lively.Class.isClass(obj)) {
      return obj.type;
    }
    if (obj.namespaceIdentifier) {
      obj.namespaceIdentifier;
    }
    if (lively.Class.isClass(obj.constructor)) {
      return obj.constructor.type + '.prototype';
    }
    return null;
  },
  objectDef (obj, bodyString) {
    if (lively.Class.isClass(obj)) {
      return 'Object.extend(' + obj.type + ', {' + bodyString + '});';
    }
    if (obj.namespaceIdentifier) {
      return 'Object.extend(' + obj.namespaceIdentifier + ', {' + bodyString + '});';
    }
    if (lively.Class.isClass(obj.constructor)) {
      return obj.constructor.type + '.addMethods({' + bodyString + '});';
    }
    return null;
  },
  
  // Installation
  recompile () {
    return;  // wtf?
  },
  ensureHash () {
    if (!this.hash) {
      this.generateHash();
      return this.hash;
    }
  },
  generateHash () {
    return this.hash = this.fullName() + ':' + Date.now();
    // return this.hash = Date.now()
  }
});

Object.assign(cop,  {
  layerObject (layer, object, defs) {
    // log("cop.layerObject");
    Object.keys(defs).forEach(function(function_name) {
      // log(" layer property: " + function_name);
      cop.layerProperty(layer, object, function_name, defs);
    });
    layer.generateHash && layer.generateHash();
    cop.invalidateLayerComposition();
  },
  recompileLayers (layers) {
    var layeredObjects = layers.invoke('layeredObjects').flatten();
    layeredObjects.forEach(function(obj) {
      var defs = layers.invoke('layerDefOfObject', obj);
      cop.uninstallLayersInObject(obj);
      layers.forEach(function(layer, i) {
        layer.refineObject(obj, defs[i])
      })
    }, this)
  },
  computeHashForLayers (layers) {
    if (false) {
      var hash = 0;
      for (var i = 0; i < layers.length; i++) {
        hash += layers[i].ensureHash();
      }
      return hash;
    }
    var hashes = new Array(layers.length);
    for (var i = 0; i < layers.length; i++) {
      hashes[i] = layers[i].ensureHash();
    }
    return hashes.join('');
  },
  hashForCurrentComposition (object) {
    if (object.activeLayers) {
      return cop.computeHashForLayers(cop.computeLayersFor(object));
    }
    function hashFromStack() {
      var composition = cop.LayerStack[cop.LayerStack.length - 1].composition;
      return composition && composition.hash;
    }
    return hashFromStack() || cop.currentLayers().hash;
  },
  
  methodManipulator: new MethodManipulator(),
  
  installMethod (method, obj, name,type) {
    if (type == "getter") {
      Object.defineProperty(obj, name, {get: method});
    } else if (type == "setter") {
      Object.defineProperty(obj, name, {set: method});
    } else {
      obj[name] = method;
    }
  },
  getSlotValue (obj, name, type) {
    if (type == "getter") {
      return obj.__lookupGetter__(name);
    } else if (type == "setter") {
      return obj.__lookupSetter__(name);
    } else {
      return obj[name];
    }
  },
  findPartialMethodsForObject (layers, obj, slotName, type) {
    var result = [];
    for (var i = 0; i < layers.length; i++) {
      var partialMethod = cop.lookupLayeredFunctionForObject(obj, layers[i], slotName, type);
      if (partialMethod) {
        result.push(partialMethod);
      }
    }
    return result;
  }
});
