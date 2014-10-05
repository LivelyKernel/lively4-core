/*global window, process, global*/

;(function() {
"use strict";
  var jsext = {};
  var isNode = typeof process !== 'undefined'
            && process.versions && process.versions.node;
  if (isNode) module.exports.jsext = jsext;
  else window.jsext = jsext;
})();
