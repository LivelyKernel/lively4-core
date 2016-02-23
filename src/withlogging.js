define(function module(require) { "use strict";

  var withAdvice = require('./../lib/flight/advice').withAdvice;
  var View = require('./view');

  function withLogging() {
    withAdvice.call(this.prototype);
    var Class = this;
    Class.__livingSet__ = new View();

    this.prototype.after('initialize', function() {
      console.log('Created', this);
      Class.__livingSet__.safeAdd(this);
    });
    this.prototype.before('destroy', function() {
      console.log('Destroy', this);
      Class.__livingSet__.safeRemove(this);
    });
  }
  return withLogging;
});
