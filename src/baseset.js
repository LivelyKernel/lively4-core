define(function module(require) { "use strict"

  var withAdvice = require('./../lib/flight/advice').withAdvice;

  var BaseSet = function() { this.initialize.apply(this, arguments); };

  BaseSet.prototype.initialize = function(val) {
    this.set = new Set();
    this.downstream = [];
  };
  BaseSet.prototype.add = function(item) {
    this.downstream.forEach(function(ea) { ea.newItem(item); });
    return this.set.add(item);
  };
  BaseSet.prototype.delete = function(item) {
    this.downstream.forEach(function(ea) { ea.destroyItem(item); });
    return this.set.delete(item);
  };

  return BaseSet;
});
