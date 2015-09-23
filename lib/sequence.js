
/*
 * Generator-based sequences
 */
;(function(exports) {
"use strict";


var seq = exports.seq = {
  
  take: function(gen, n) {
    var it = gen(), vals = [];
    for (var i = 0; i < n; i++) {
      var step = it.next();
      if (step.done) break;
      vals.push(step.value);
    }
    return vals;
  }

}

})(typeof module !== "undefined" && module.require && typeof process !== "undefined" ?
  require('./base') :
  (typeof lively !== "undefined" && lively.lang ?
     lively.lang : {}));
