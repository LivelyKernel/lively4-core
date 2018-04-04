import utils from './utils.js';

var advice = {
  around(base, wrapped) {
    return function composedAround() {
      // unpacking arguments by hand benchmarked faster
      var i = 0, l = arguments.length, args = new Array(l + 1);
      args[0] = base.bind(this);
      for (; i < l; i++) {
        args[i + 1] = arguments[i];
      }
      return wrapped.apply(this, args);
    };
  },

  before(base, before) {
    var beforeFn = (typeof before == 'function') ? before : before.obj[before.fnName];
    return function composedBefore() {
      beforeFn.apply(this, arguments);
      return base.apply(this, arguments);
    };
  },

  after(base, after) {
    var afterFn = (typeof after == 'function') ? after : after.obj[after.fnName];
    return function composedAfter() {
      var res = (base.unbound || base).apply(this, arguments);
      afterFn.apply(this, arguments);
      return res;
    };
  }
};

export default advice;

// a mixin that allows other mixins to augment existing functions by adding additional
// code before, after or around.
export function withAdvice() {
  ['before', 'after', 'around'].forEach(function(m) {
    this[m] = function(method, fn) {
      var methods = method.trim().split(' ');

      methods.forEach(function(i) {
        utils.mutateProperty(this, i, function() {
          if (typeof this[i] == 'function') {
            this[i] = advice[m](this[i], fn);
          } else {
            this[i] = fn;
          }

          return this[i];
        });
      }, this);
    };
  }, this);
}
