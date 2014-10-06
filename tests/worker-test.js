/*global beforeEach, afterEach, describe, it, setInterval, clearInterval, setTimeout*/

var isNodejs = typeof module !== 'undefined' && module.require;
var expect = isNodejs ? module.require('expect.js') : this.expect;
var jsext = isNodejs ? module.require('../index') : this.jsext;

var fun = jsext.fun;
var worker = jsext.worker;
var messenger = jsext.messenger;

describe('worker', function() {

  var libURL = document.location.toString().split('/').slice(0, -1).join('/') + "/../";

  describe('basics', function() {

    it("creates worker", function(done) {
      var messageFromWorker = null,
          w = worker.create({libURL: libURL}, function() { self.customInitRun = true; }),
          workerCode = "this.onmessage = function(evt) {\n"
                     + "   self.postMessage('Worker custom init: ' + self.customInitRun + '. Worker got \"' + evt.data + '\"') }";
      setTimeout(function() {
        w.postMessage({command: "eval", source: workerCode, silent: true});
        w.onMessage = function(evt) { messageFromWorker = evt.data; }
        w.postMessage('message to worker');
        fun.waitFor(20, function() { return !!messageFromWorker }, function() {
          expect(messageFromWorker).to.equal('Worker custom init: true. Worker got "message to worker"');
          done();
        });
      }, 200);
    });

    it("loads other lib code", function(done) {
      var messageFromWorker = null,
          w = worker.create({libURL: libURL});
      fun.waitFor(100, function() { return worker.ready; }, function() {
        w.onMessage = function(evt) { messageFromWorker = evt.data; }
        // simply eval some code in the worker scope that requires the bootstrap
        // files to be loaded
        var src = "(function() { try {\n"
            + "  return jsext.string.format('foo %s', 'bar');\n"
            + "} catch(e) {\n"
            + "  return e + String(e.stack);\n"
            + "}"
            + "}).call()";
        w.postMessage({command: "eval", source: src});

        fun.waitFor(500, function() { return !!messageFromWorker; }, function(err) {
          expect(err).to.be(undefined);
          // this.assertEquals(false, worker.errors.length > 0 && worker.errors[0], 'worker got errors');
          expect(messageFromWorker.value).to.equal("foo bar");
          done();
        });
      });
    });

    it("runs", function(done) {
      var messageFromWorker = null,
          w = worker.create({libURL: libURL});
      w.onMessage = function(evt) { messageFromWorker = evt.data; }
      fun.waitFor(100, function() { return w.ready; }, function(err) {
        w.run(function(a, b) { postMessage(a+b); }, 1, 2);
        fun.waitFor(100, function() { return !!messageFromWorker }, function(err) {
          expect(messageFromWorker).to.equal(3);
          done();
        });
      });
    });

  });

  describe('forking functions', function() {

    var previousIdleTimeOfPoolWorker;
    var originalWorkerPool;

    beforeEach(function() {
      previousIdleTimeOfPoolWorker = worker.idleTimeOfPoolWorker;
      worker.idleTimeOfPoolWorker = 50;
      originalWorkerPool = worker.pool;
      worker.pool = [];
    });

    afterEach(function() {
      worker.pool = originalWorkerPool;
      worker.idleTimeOfPoolWorker = previousIdleTimeOfPoolWorker;
    });

    it("forks a function to run in a worker", function(done) {
      var whenDoneResult,
          w = worker.fork(
            {libURL: libURL, args: [1, 2], whenDone: function(err, result) { whenDoneResult = result; }},
            function(a, b, thenDo) { thenDo(null, '' + (a + b) + ' ' + self.isBusy); });

      fun.composeAsync(
        function(next) {
          var start = Date.now();
          fun.waitFor(1500,
            function() { return !!w.ready; },
            function(err) { next(err); });
          },
        function(next) { setTimeout(next, 0); },
        function(next) { expect(worker.pool).to.have.length(1); next(); },
        function(next) { setTimeout(next, 200); },
        function(next) {
          expect(whenDoneResult).to.equal('3 true');
          expect(worker.pool).to.have.length(0);
          next();
        }
      )(function(err) {
        expect(err).to.be(null);
        done();
      });      

    });

    it("fork works for long running function as well", function(done) {
      var whenDoneResult,
          w = worker.fork(
            {libURL: libURL, whenDone: function(err, result) { whenDoneResult = result; }},
            function(whenDone) { setTimeout(function() { whenDone(null, 'OK'); }, 300); });

      fun.composeAsync(
        function(next) {
          var start = Date.now();
          fun.waitFor(1500, function() { return !!w.ready; }, function(err) { next(err); }); },
        function(next) { setTimeout(next, 0); },
        function(next) {
          expect(whenDoneResult).to.be(undefined); // too early
          expect(worker.pool).to.have.length(1);
          next();
        },
        function(next) { setTimeout(next, 400); },
        function(next) {
          expect(whenDoneResult).to.be('OK');
          expect(worker.pool).to.have.length(0);
          next();
        }
      )(function(err) {
        expect(err).to.be(null);
        done();
      });
    });

  });

  describe("worker messenger", function() {

    it("sends and receives messages via messenger interface", function(done) {
      var workerMessenger = worker.createMessenger({libURL: libURL});
      fun.composeAsync(
        function(next) {
          fun.waitForAll([workerMessenger.whenOnline], next);
          workerMessenger.listen();
        },
        function(_, next) {
          workerMessenger.sendTo("test-worker", "remoteEval", {expr: "3 + 4"}, next);
        },
        function(answer, next) {
          expect(answer.data).to.eql({result: 7});
          next();
        }
      )(function(err) { expect(err).to.be(null); done(); })
    });

  });

});
