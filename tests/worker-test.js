/*global beforeEach, afterEach, describe, it, setInterval, clearInterval, setTimeout*/

var expect = typeof module !== 'undefined' && module.require ?
  module.require('expect.js') : this.expect;

var jsext = typeof module !== 'undefined' && module.require ?
  module.require('../index') : this.jsext;

var fun = jsext.fun;
var worker = jsext.worker;

describe('worker', function() {

  describe('basics', function() {

    var libURL = document.location.toString().split('/').slice(0, -1).join('/') + "/../";

    it("CreateAndRunWorker", function(done) {
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
    
    it("LoadBootstrapFiles", function(done) {
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

    xit("WorkerRun", function(done) {
      var messageFromWorker = null,
          w = worker.create();
      worker.onMessage = function(evt) { messageFromWorker = evt.data; }
      fun.waitFor(100, function() { return worker.ready; }, function(err) {
        worker.run(function(a, b) { postMessage(a+b); }, 1, 2);
        fun.waitFor(100, function() { return !!messageFromWorker }, function(err) {
          expect(messageFromWorker).to.equal(3);
          done();
        });
      });
    });

  });

  describe('Function interface', function() {

    var previousIdleTimeOfPoolWorker;
    var originalWorkerPool;

    beforeEach(function() {
      previousIdleTimeOfPoolWorker = Config.get('worker.idleTimeOfPoolWorker');
      Config.set('worker.idleTimeOfPoolWorker', 50);
      originalWorkerPool = worker.pool;
      worker.pool = [];
    });
  
    afterEach(function() {
      worker.pool = originalWorkerPool;
      Config.set('worker.idleTimeOfPoolWorker', previousIdleTimeOfPoolWorker);
    });

    it("ForkFunction", function(done) {
      var test = this, whenDoneResult,
        w = Functions.forkInWorker(
          function(whenDone, a, b) { whenDone(null, '' + (a + b) + ' ' + self.isBusy); },
          {args: [1, 2], whenDone: function(err, result) { whenDoneResult = result; }});
      fun.waitFor(10, function() { return !!worker.ready}, function() {
        setTimeout(function() {
          expect(whenDoneResult).to.equal('3 true');
          expect(worker.pool.length).to.equal(1, 'worker pool size with worker running.');
          setTimeout(function() {
            expect(worker.pool.length).to.equal(0, 'worker pool size with worker stopped.');
            done();
          }, 200);
        }, 15);
      });
    });
    
    it("ForkLongRunningFunctionKeepsWorkerAlive", function(done) {
      var test = this, whenDoneResult,
          w = worker.fork(
            function(whenDone) { setTimeout(whenDone.bind(null, null, 'OK'), 300); },
            {whenDone: function(err, result) { whenDoneResult = result; }});

      fun.composeAsync(
        function(next) { fun.waitFor(function() { return !!w.ready; }, 500, function(err) { next(err); }); },
        function(next) { setTimeout(next, 200); },
        function(next) {
          expect(whenDoneResult).to.be(undefined, 'result came to early');
          expect(worker.pool).to.have.length(1, 'worker pool size with worker running.');
          next();
        },
        function(next) { setTimeout(next, 200); },
        function(next) {
          expect(whenDoneResult).to.be('OK');
          expect(worker.pool).to.have.length(0, 'worker pool size with worker stopped.');
          next();
        }
      )(function(err) {
        expect(err).to.be('undefined');
        done();
      });
    });

  });

});
