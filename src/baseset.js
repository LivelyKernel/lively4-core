define(function module(require) { "use strict"

  var withAdvice = require('./../lib/flight/advice').withAdvice;

  var BaseSet = Object.subclass('BaseSet', {
    initialize: function() {
      this.set = new Set();
      this.downstream = [];
    },
    addToBaseSet: function(item) {
      this.downstream.forEach(function(ea) { ea.newItemFromUpstream(item); });
      return this.set.add(item);
    },
    removeFromBaseSet: function(item) {
      this.downstream.forEach(function(ea) { ea.destroyItemFromUpstream(item); });
      return this.set.delete(item);
    }
  });

  return BaseSet;
});
