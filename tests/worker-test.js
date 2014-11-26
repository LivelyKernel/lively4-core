/*global require, beforeEach, afterEach, describe, it, setInterval, clearInterval, setTimeout*/

var isNodejs = typeof module !== 'undefined' && module.require;
var expect = this.expect || module.require('expect.js');
var lively = this.lively || {}; lively.lang = lively.lang || module.require('../index');

var fun = lively.lang.fun;
var worker = lively.lang.worker;
var messenger = lively.lang.messenger;

describe('worker', function() {

  var libLocation = isNodejs ? (function() {
    var path = require('path');
    return path.dirname(require.resolve(path.join("..", 'index')));
  })() : document.location.toString().split('/').slice(0, -1).join('/') + "/../lib/";

  describe('basics', function() {

    it("creates worker and evals code in worker context", function(done) {
      var messageFromWorker = null,
          w = worker.create({libLocation: libLocation});
      fun.composeAsync(
        function(next) { w.eval("this.rememberThis = 'foo was here';", next); },
        function(_, next) { w.eval("this.rememberThis", next) },
        function(result, next) { expect(result).to.be('foo was here'); next(); }
      )(function(err) { expect(err).to.be(null); done(); });
    });

    it("loads other lib code in worker context", function(done) {
      var messageFromWorker = null,
          w = worker.create({libLocation: libLocation});
      fun.composeAsync(
        function(next) { w.eval("lively.lang.string.format('foo %s', 'bar');", next) },
        function(result, next) { expect(result).to.be('foo bar'); next(); }
      )(function(err) { expect(err).to.be(null); done(); });
    });

    it("calls passed functions in worker context", function(done) {
      var workerMessenger = worker.create({libLocation: libLocation});
      fun.composeAsync(
        function(next) {
          workerMessenger.run(function(a, b, whenDone) {
            setTimeout(function() { whenDone(null, a+b); }, 60);
          }, 1, 2, next);
        },
        function(result, next) { expect(result).to.be(3); next(); }
      )(function(err) { expect(err).to.be(null); done(); });
    });

  });

  describe('forking functions', function() {
    it("forks a function to run in a worker", function(done) {
      var whenDoneResult,
          w = worker.fork(
            {libLocation: libLocation, args: [1, 2]},
            function(a, b, thenDo) { thenDo(null, '' + (a + b) + ' ' + remoteWorker.isBusy); },
            function(err, result) {
              expect(err).to.be(null);
              expect(result).to.equal('3 true');
              done();
            });
    });
  });

});
