define(function module(require) { "use strict"

  var withAdvice = require('./../lib/flight/advice').withAdvice;

  var BaseSet = Object.subclass('BaseSet', {
    initialize: function() {
      this.set = new Set();
      this.downstream = [];
    },
    add: function(item) {
      this.downstream.forEach(function(ea) { ea.newItem(item); });
      return this.set.add(item);
    },
    delete: function(item) {
      this.downstream.forEach(function(ea) { ea.destroyItem(item); });
      return this.set.delete(item);
    }
  });

  return BaseSet;
});
