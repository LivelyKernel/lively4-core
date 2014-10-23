/*global window, process, global*/

;(function() {
"use strict";
  var jsext = createLivelyLangObject();
  var isNode = typeof process !== 'undefined'
            && process.versions && process.versions.node;
  if (isNode) module.exports.jsext = jsext;
  else window.jsext = jsext;

  function createLivelyLangObject() {
    return {chain: chain};
  }

  function chain(object) {
    if (!object) return object;

    var chained;
    if (Array.isArray(object)) return createChain(jsext.arr, object);
    if (object.constructor.name === "Date") return createChain(jsext.date, object);
    switch (typeof object) {
      case 'string': return createChain(jsext.string, object);
      case 'object': return createChain(jsext.obj, object);
      case 'function': return createChain(jsext.fun, object);
      case 'number': return createChain(jsext.num, object);
    }
    throw new Error("Chain for object " + object + " (" + object.constructor.name + ") no supported");
  }

  function createChain(interfaceObj, obj) {
    return Object.keys(interfaceObj).reduce(function(chained, methodName) {
      chained[methodName] = function(/*args*/) {
        var args = Array.prototype.slice.call(arguments),
            result = interfaceObj[methodName].apply(null, [obj].concat(args));
        return chain(result);
      }
      return chained;
    }, {value: function() { return obj; }});
  }
})();
