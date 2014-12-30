/*global beforeEach, afterEach, describe, it, setInterval, clearInterval, setTimeout*/

var expect = this.expect || module.require('expect.js');
var lively = this.lively || {}; lively.lang = lively.lang || module.require('../index');

var fun = lively.lang.fun;
var Closure = lively.lang.Closure;

describe('fun', function() {

  describe('accessing methods -- own and all', function() {

    var obj1 = {
      foo: 23,
      method1: function() { return 23; },
      get method2() { return function() { return 42; }; }
    }, obj2 = {
      bar: 99,
      method3: function() { return 66; },
      get method4() { return function() { return 44; }; }
    }

    obj1.__proto__ = obj2;

    it("finds own functions", function() {
      // note getters are currently ignored:
      // expect(fun.own(obj1)).to.eql(['method1', 'method2']);
      expect(fun.own(obj1)).to.eql(['method1']);
    });

    it("finds inherited functions", function() {
      // note getters are currently ignored
      expect(fun.all(obj1)).to.eql(['method1', 'method3']);
    });

  });

  describe('inspection', function() {

    it("can tell its args", function() {
      var f = function(arg1, arg2, arg4) { return arg2 + arg4; };
      expect(fun.argumentNames(f)).to.eql(["arg1", "arg2", "arg4"]);
    });

    it("can extract a function body a string", function() {
      var f = function(arg1, arg2, arg4) {
        var x = {
          n: 33
        };

        return x.n + arg2 + arg4;
      };
      expect(fun.extractBody(f)).to.equal('var x = {\n  n: 33\n};\n\nreturn x.n + arg2 + arg4;');
    });

  });

  describe('async', function() {

    describe('rate limiting', function() {

      beforeEach(function()  {
        this._queues = fun._queues;
        fun._queues = {};
        this._debouncedByName = fun._debouncedByName;
        fun._debouncedByName = {};
      });

      afterEach(function()  {
        fun._queues = this._queues;
        fun._debouncedByName = this._debouncedByName;
      });

      it('debounce function is looked up by name', function(done) {
        var called = 0, result;
        [1,2,3,4,5,6,7,8,9,10].reduceRight(function(next, i) {
          return function() {
            fun.debounceNamed('testDebouncedCommand', 20,
              function(i) { result = i; called++; }, false)(i);
            setTimeout(next, 0);
          }
        }, function() {})();

        var i = setInterval(function() {
          if (typeof result === 'undefined') return;
          clearInterval(i);
          expect(called).to.equal(1, 'debounce call cound');
          expect(result).to.equal(10, 'debounce result');
          done();
        }, 0);
      });

      it("throttles calls", function(done) {
        debugger
        var called = 0, result = [];

        [1,2,3,4].forEach(function(i) {
            fun.throttleNamed('testThrottleCommand', 20, function(i) { result.push(i); called++; })(i);
        });

        setTimeout(function() {
            fun.throttleNamed('testThrottleCommand', 20, function(i) { result.push(i); called++; })(5);
        }, 80);

        setTimeout(function() {
            // call 1 immediatelly in the loop,
            // call 2 after waiting for timeout with arg from last (fourth) invocation
            // call 3 invocation after first throttle
            expect(3).to.equal(called, 'throttle call count');
            expect([1,4,5]).to.eql(result, 'throttle result');
            done();
        }, 120);
      });

    });

    describe("queue", function() {

      it("queues stuff", function(done) {
        var drainRun = false,
            finishedTasks = [],
            q = fun.createQueue('testQueue-queue', function(task, callback) {
                finishedTasks.push(task); setTimeout(callback, 0); }),
            q2 =  fun.createQueue('testQueue-queue', function(task, callback) {
                expect.fail("redefining worker should not work"); });

        expect(q).to.be(q2, 'id queues not identical');
        q.pushAll([1,2,3,4]);

        expect(1).to.equal(finishedTasks.length,"tasks prematurely finished?");
        q.drain = function() { drainRun = true }
        waitForDrain();

        function waitForDrain() {
          if (!drainRun) { setTimeout(waitForDrain, 10); return; }
          expect([1,2,3,4]).to.eql(finishedTasks,"tasks not ok");
          expect(!fun._queues.hasOwnProperty('testQueue-queue')).to.be.ok('queue store not cleaned up');
          done();
        }
      });

      it("associates workers with callbacks", function(done) {
        var calls = [];
        function worker(thenDo) {
          var workerState = 22;
          calls.push("workerCalled");
          setTimeout(function() {
              thenDo(null, ++workerState);
          }, 200);
        }

        function thenDo1(err, arg) { calls.push("thenDo1Called:"+arg); }
        function thenDo2(err, arg) { calls.push("thenDo2Called:"+arg); }
        function thenDo3(err, arg) { calls.push("thenDo3Called:"+arg); }
        function thenDo4(err, arg) { calls.push("thenDo4Called:"+arg); }

        var proc = fun.workerWithCallbackQueue('testWorkerWithCallbackQueue', worker).whenDone(thenDo1);
        expect(proc).to.be(fun.workerWithCallbackQueue('testWorkerWithCallbackQueue', worker),'not identical process');
        proc.whenDone(thenDo2);

        setTimeout(function() { proc.whenDone(thenDo3); }, 100);

        waitForFinish1();

        function waitForFinish1() {
          if (calls.length <= 1) { setTimeout(waitForFinish1, 10); return; }

          var expected = ["workerCalled", "thenDo1Called:23", "thenDo2Called:23", "thenDo3Called:23"];
          expect(expected).to.eql(calls);

          calls = [];
          var proc2 = fun.workerWithCallbackQueue('testWorkerWithCallbackQueue', worker).whenDone(thenDo4);
          expect(proc2 !== proc).to.be.ok('new process equals old?');

          waitForFinish2();
        }

        function waitForFinish2() {
          if (calls.length <= 1) { setTimeout(waitForFinish2, 10); return; }
          var expected = ["workerCalled", "thenDo4Called:23"];
          expect(expected).to.eql(calls);
          done();
        }
      });

      it("associates workers with callbacks and timesout", function(done) {
        var calls = [];
        function worker(thenDo) {
          setTimeout(function() {
            calls.push("workerCalled");
            thenDo(null); }, 200);
        }

        function thenDo1(err, arg) { calls.push("thenDo1Called:" + (err ? err.message : null)); }
        function thenDo2(err, arg) { calls.push("thenDo2Called:" + (err ? err.message : null)); }

        var proc = fun.workerWithCallbackQueue(
          'testWorkerWithCallbackQueueWithTimout',
          worker, 100).whenDone(thenDo1);

        setTimeout(function() { proc.whenDone(thenDo2); }, 50);

        waitForTimeout();

        function waitForTimeout() {
          if (calls.length <= 1) { setTimeout(waitForTimeout, 10); return; }
          var expected = ["thenDo1Called:timeout", "thenDo2Called:timeout"];
          expect(expected).to.eql(calls);
          done();
        };
      });

      it("associates workers with callbacks and handles errors", function(done) {
        var calls = [];
        function worker(thenDo) {
            var workerState = 22;
            calls.push("workerCalled");
            throw new Error('foo');
        }

        function thenDo1(err, arg) { calls.push(err.message); }
        function thenDo2(err, arg) { calls.push(err.message); }

        fun.workerWithCallbackQueue('testWorkerWithCallbackQueueWithError', worker).whenDone(thenDo1);
        fun.workerWithCallbackQueue('testWorkerWithCallbackQueueWithError', worker).whenDone(thenDo2);

        waitForError();

        function waitForError() {
          if (calls.length <= 1) { setTimeout(waitForError, 10); return; }
          var expected = ["workerCalled", "foo", "foo"];
          expect(expected).to.eql(calls);
          done();
        };
      });


      it("associates workers with callbacks and can be canceled", function(done) {
        var calls = [];
        function worker(thenDo) {
            calls.push("workerCalled");
            setTimeout(function() { thenDo(null); }, 40);
        }

        function thenDo1(err, arg) { calls.push("thenDo1Called"); }
        function thenDo2(err, arg) { calls.push("thenDo2Called"); }

        var proc = fun.workerWithCallbackQueue('testWorkerWithCallbackQueue', worker).whenDone(thenDo1);
        proc.cancel();
        setTimeout(function() { fun.workerWithCallbackQueue('testWorkerWithCallbackQueue', worker).whenDone(thenDo2); }, 20);

        setTimeout(function() {
            var expected = ['workerCalled', 'thenDo2Called'];
            expect(expected).to.eql(calls);
            done();
        }, 120);
      });

    });

    describe("wait for", function() {

      it("waits", function(done) {
        var x = 0, wasCalled, startTime = Date.now(), endTime, timeout;

        fun.waitFor(200, function() { return x === 1; }, function (_timeout) {
          wasCalled = true; timeout = _timeout; endTime = Date.now();
        });

        waitForWaitFor();

        setTimeout(function() { x = 1; }, 100);

        function waitForWaitFor() {
          if (!wasCalled) { setTimeout(waitForWaitFor, 20); return; }
          expect(timeout).to.be(undefined, 'timout param not OK: ' + timeout);
          var duration = endTime - startTime;
          expect(duration).to.be.greaterThan(99,'wait duration not OK: ' + duration);
          done();
        };

      });

      it("times out", function(done) {
        var x = 0, wasCalled, startTime = Date.now(), endTime, timeout;

        fun.waitFor(200, function() { return x === 1; /*will never be true*/ }, function (_timeout) {
          wasCalled = true; timeout = _timeout; endTime = Date.now();
        });

        waitForWaitFor();

        function waitForWaitFor() {
          if (!wasCalled) { setTimeout(waitForWaitFor, 20); return; }
          expect(timeout).to.be.an(Error, 'timeout param not OK: ' + timeout);
          var duration = endTime - startTime;
          expect(duration).to.be.greaterThan(199, 'wait duration not OK: ' + duration);
          done();
        };
      });

      it("waits without timeout", function(done) {
        var x = 0, wasCalled, startTime = Date.now(), endTime, timeout;

        fun.waitFor(
          function() { return x === 1; },
          function (_timeout) {
            wasCalled = true; timeout = _timeout; endTime = Date.now(); });

        setTimeout(function() { x = 1; }, 400);
        waitForWaitFor();

        function waitForWaitFor() {
          if (!wasCalled) { setTimeout(waitForWaitFor, 20); return; }
          expect(timeout).to.be(undefined);
          var duration = endTime - startTime;
          expect(duration).to.be.greaterThan(399, 'wait duration not OK: ' + duration);
          done();
        }
      });

    });

    describe("timing", function() {

      it("delays", function(done) {
        var run = false;
        fun.delay(function() { run = true; }, .8);
        setTimeout(function() { expect(run).to.be(false); }, 500);
        setTimeout(function() { expect(run).to.be(true); done(); }, 820);
      });

    });
  });


  describe("function composition", function() {

    it("composes functions", function() {
      function mult(a,b) { return a * b; }
      function add1(a) { return a + 1; }
      var composed = fun.compose(mult, add1, String),
          result = composed(11, 2);
      expect("23" === result).to.be.ok('compose not OK: ' + result);
    });

    it("composes async functions", function(done) {
      var result, err, test1, test2;
      function mult(a,b, thenDo) { thenDo(null, a * b); }
      function add1(a, thenDo) { thenDo(null, a + 1); }
      var composed = fun.composeAsync(mult, add1);
      composed(11, 2, function(err, _result) { result = _result; });
      waitFor1();
      waitFor2();
      waitFor3();

      function waitFor1() {
        if (!result) { setTimeout(waitFor1, 10); return; }
        expect(23).to.equal(result, 'composeAsync not OK: ' + result);
        result = null;
        test1 = true;
      };

      function waitFor2() {
        if (!test1) { setTimeout(waitFor2, 10); return; }
        function a(a,b, thenDo) { thenDo(new Error('ha ha'), a * b); }
        function b(a, thenDo) { thenDo(null, a); }
        var composed = fun.composeAsync(a, b);
        debugger;
        composed(11, 2, function(_err, _result) {
          debugger;
          test2 = true;
          err = _err;
          result = _result;
        });
      };

      function waitFor3() {
        if (!test2) { setTimeout(waitFor3, 10); return; }
        expect(!result).to.be.ok('composeAsync result when error expected?: ' + result);
        expect(err).to.be.ok('no error? ' + err);
        done();
      };

    });

    it("composes async functions with Error", function(done) {
      var aRun = 0, bRun = 0, cRun = 0;

      console.log("Dear test runner: an error like \"Object XXX has no method 'barrr'\" is expected!");

      fun.composeAsync(
        function a(a,b, thenDo) { aRun++; thenDo(null, (a*b).barrr()); },
        function b(a, thenDo) { bRun++; thenDo(null, a + 1); }
      )(3,4, function(err, result) {
        cRun++;
        expect(1).to.equal(aRun,'aRun');
        expect(0).to.equal(bRun,'bRun');
        expect(1).to.equal(cRun,'cRun');
        expect(!result).to.be.ok('result? ' + result);
        expect(err instanceof TypeError).to.be.ok('error? ' + err);
      });

      waitFor();

      function waitFor() {
        if (!cRun) { setTimeout(waitFor, 10); return; }
        done();
      };
    });

    it("composes async functions with errors don't activate callbacks twice", function(done) {
      var aRun = 0, bRun = 0, cRun = 0;
      fun.composeAsync(
        function a(a,b, thenDo) { aRun++; thenDo(null, a * b);
            throw new Error('afterthought'); /*throwing this error should not invoke the end handler*/},
        function b(a, thenDo) { bRun++; thenDo(null, a + 1); }
      )(4,5, function(err, result) {
        cRun++;
        expect(1).to.equal(aRun,'aRun');
        expect(1).to.equal(bRun,'bRun');
        expect(1).to.equal(cRun,'cRun');
        expect(21).to.equal(result,'result? ' + result);
        expect(!err).to.be.ok('err? ' + err);
      });
      waitFor();

      function waitFor() {
        if (!cRun) { setTimeout(waitFor, 30); return; }
        done();
      };
    });

    it("compose async does not need end callback", function(done) {
      var aNext;
      fun.composeAsync(
        function a(next) { aNext = next; next(); }
      )(undefined);
      expect(aNext).to.be.a("function");
      done();
    });

  });

  describe("waitForAll", function() {

    it("waits for all functions to be done", function(done) {
      fun.waitForAll([
        function(next) { setTimeout(function() { next(null, "test", "bar")}, 10); },
        function(next) { setTimeout(next, 4); }
      ], function(err, results) {
        expect(err).to.be(null);
        expect(results).to.eql([["test", "bar"], []]);
        done();
      });
    });

    it("deals with sync errors", function(done) {
      fun.waitForAll([
        function(next) { next(null, "test", "bar"); },
        function(next) { throw new Error("Foo"); }
      ], function(err, results) {
        expect(String(err)).to.match(/Error: in waitForAll at 1: \nError: Foo/i);
        expect(results).to.eql([["test", "bar"], null]);
        done();
      });
    });

    it("deals with async errors", function(done) {
      fun.waitForAll([
        function(next) { next(null, "test", "bar"); },
        function(next) { setTimeout(function() { next(new Error("Foo")); }, 10); }
      ], function(err, results) {
        expect(String(err)).to.match(/Error: in waitForAll at 1: \nError: Foo/i);
        expect(results).to.eql([["test", "bar"], null]);
        done();
      });
    });

    it("times out", function(done) {
      fun.waitForAll({timeout: 200}, [
        function(next) { setTimeout(function() { next(null); }, 300); },
        function(next) { next(null, "test", "bar"); },
        function(next) { setTimeout(function() { next(null); }, 400); }
      ], function(err, results) {
        expect(String(err)).to.match(/waitForAll timed out, functions at 0, 2 not done/i);
        expect(results).to.eql([null, ["test", "bar"], null]);
        done();
      });
    });

    it("without functions it continues immediately", function(done) {
      fun.waitForAll([], function(err, results) {
        expect(err).to.be(null);
        expect(results).to.be.empty();
        done();
      });
    });

  });

  describe("function wrapping", function() {

    it("can flip arguments", function() {
      function func(a,b,c) { return '' + a + b + c; }
      expect('213').to.equal(fun.flip(func)(1,2,3));
    });

    it("wraps to augment behavior", function() {
      var wrapped = fun.wrap(
        function(arg1, arg2) { return arg1 + arg2; },
        function(proceed, arg1, arg2) {
          return proceed(arg1, arg2 + 1) + 1;
        });
      expect(wrapped(3,4)).to.be(9);
      expect(wrapped.originalFunction(3,4)).to.be(7);
    });

    it("wrap binds this", function() {
      // correctly bind this
      var o = {
        x: 3, y: 4,
        f: fun.wrap(
          function() { return this.x; },
          function(proceed) { return proceed() + this.y; })};
      expect(o.f()).to.be(7);
    });

    it("curries arguments", function() {
      function orig(arg1, arg2) { return arg1 + arg2; }
      expect(fun.curry(orig, 2)(3)).to.be(5);
    });

    it("curry binds this", function() {
      // correctly bind this
      var o = {x: 3, f: fun.curry(function(a) { return this.x + a; }, 2)};
      expect(o.f()).to.be(5);
    });

    it("can restrict a function to run only once", function() {
      var c = 0;
      function counter(arg1) { c++; return arg1 + c; }
      var once = fun.once(counter);
      once(22); once();
      expect(1).to.be(c);
      expect(23).to.be(once());
    });

    it("can restrict that only one of multiple a function is run", function(done) {
      var log = "";
      var either = fun.either(
        function() { log += "aRun"; },
        function() { log += "bRun"; },
        function() { log += "cRun"; });
      setTimeout(either[0], 100);
      setTimeout(either[1], 40);
      setTimeout(either[2], 80);
      setTimeout(function() { expect(log).to.be("bRun"); done(); }, 150)
    });

    it("can restrict that only one of multiple a function is run via names", function(done) {
      var log = "", name = "either-test-" + Date.now();
      function a() { log += "aRun"; };
      function b() { log += "bRun"; };
      function c() { log += "cRun"; };
      setTimeout(fun.eitherNamed(name, a), 100);
      setTimeout(fun.eitherNamed(name, b), 40);
      setTimeout(fun.eitherNamed(name, c), 80);
      setTimeout(function() {
        expect(log).to.be("bRun");
        expect(fun).to.have.property("_eitherNameRegistry");
        expect(fun._eitherNameRegistry).to.not.have.property(name);
        done();
      }, 150)
    });

    it("can replace a function for one call", function() {
      var log = [],
          orig = function() { log.push("orig"); },
          replacement = function() { log.push("replacement"); },
          obj = {m: orig};
      fun.replaceMethodForOneCall(obj, "m", replacement);
      obj.m();
      obj.m();
      obj.m();
      expect(log).to.eql(["replacement", "orig", "orig"]);
      expect(obj.m).to.equal(orig);
    });

  });

  describe("function creation", function() {

    it("creates function from string", function() {
      expect(fun.fromString("function(x) { return x + 2; }")(1)).to.be(3);
    });

    it("can create scripts for objects", function() {
      var obj = {};
      fun.asScriptOf(function foo() { return 23; }, obj);
      expect(23).to.be(obj.foo());
    });

    it("scripts can call $super", function() {
      var klass = function() {};
      klass.prototype.foo = function() { return 3; };
      var obj = new klass();
      fun.asScriptOf(function foo() { return $super() + 23; }, obj);
      expect(26).to.be(obj.foo());
    });

  });

  describe("class realted method access", function() {

    var Klass1 = function() {}
    Klass1.prototype.foo = function(a, b) { return a + b; };
    Klass1.prototype.bar = function(a) { return this.foo(a, 3); };
    Klass1.prototype.baz = 23
    var Klass2 = function() {}
    Klass2.prototype = Object.create(Klass1.prototype);
    Klass2.prototype.zork = function() { return 23; };
    Klass2.prototype.bar = function(a) { return this.foo(a, 4); };

    it("finds method names of class", function() {
      expect(fun.functionNames(Klass2)).to.eql(["foo", "bar", "zork"].reverse());
    });

    it("finds local method names of class", function() {
      expect(fun.localFunctionNames(Klass2)).to.eql(["zork", "bar"]);
    });

  });
});

describe("closure", function() {

  it("captures values", function() {
    var f = Closure.fromFunction(function() { return y + 3 }, {y: 2})
                   .recreateFunc()
    expect(f()).to.be(5);
  });

});
