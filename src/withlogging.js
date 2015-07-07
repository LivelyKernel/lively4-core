define(function module(require) { "use strict"

  var withAdvice = require('./../lib/flight/advice').withAdvice;
  var BaseSet = require('./baseset');

  function withLogging() {
    withAdvice.call(this.prototype);
    var Class = this;
    Class.__livingSet__ = new BaseSet();

    this.prototype.after('initialize', function() {
      console.log('Created', this);
      Class.__livingSet__.add(this);
    });
    this.prototype.before('destroy', function() {
      console.log('Destroy', this);
      Class.__livingSet__.delete(this);
    });
  }
  return withLogging;
});
