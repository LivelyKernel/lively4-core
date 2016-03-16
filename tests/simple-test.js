define(function module(require) { "use strict";

  var errorIfFalse = function(check) {
    if(!check) {
      throw new Error('OH NO!');
    }
  };

  var withLogging = require('../src/withlogging');
  var select = require('../src/select');

});
