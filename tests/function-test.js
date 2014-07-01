/*global jsext, beforeEach, afterEach, describe, it, expect, setInterval, clearInterval, setTimeout*/

var fun = jsext.fun;

describe('function', function() {

  describe('async', function() {
    describe('debounce', function() {
      
      it('looks up debounce function by name', function(done) {

        var called = 0, result;
        [1,2,3,4,5,6,7,8,9,10].reduceRight(function(next, i) {
          return function() {
            fun.debounceNamed('testDebouncedCommand', 10,
              function(i) { result = i; called++;console.log(called); }, false)(i);
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
    })
    
  });


//     testQueue: function() {
//         var test = this,
//             drainRun = false, finishedTasks = [],
//             q = Functions.createQueue('testQueue-queue', function(task, callback) {
//                 finishedTasks.push(task); callback.delay(0); }),
//             q2 =  Functions.createQueue('testQueue-queue', function(task, callback) {
//                 test.assert(false, "redefining worker should not work"); });
//         this.assertIdentity(q,q2, 'id queues not identical');
//         q.pushAll([1,2,3,4]);
//         this.assertEquals(1, finishedTasks.length, "tasks prematurely finished?");
//         q.drain = function() { drainRun = true }
//         this.waitFor(function() { return !!drainRun; }, 10, function() {
//             this.assertEquals([1,2,3,4], finishedTasks, "tasks not ok");
//             this.assert(!Functions._queues.hasOwnProperty('testQueue-queue'), 'queue store not cleaned up');
//             this.done();
//         });
//     },

//     testWorkerWithCallbackQueue: function() {
//         var calls = [];
//         function worker(thenDo) {
//             var workerState = 22;
//             calls.push("workerCalled");
//             setTimeout(function() {
//                 thenDo(null, ++workerState);
//             }, 200);
//         }

//         function thenDo1(err, arg) { calls.push("thenDo1Called:"+arg); }
//         function thenDo2(err, arg) { calls.push("thenDo2Called:"+arg); }
//         function thenDo3(err, arg) { calls.push("thenDo3Called:"+arg); }
//         function thenDo4(err, arg) { calls.push("thenDo4Called:"+arg); }

//         var proc = Functions.workerWithCallbackQueue('testWorkerWithCallbackQueue', worker).whenDone(thenDo1);
//         this.assertIdentity(proc, Functions.workerWithCallbackQueue('testWorkerWithCallbackQueue', worker), 'not identical process');
//         proc.whenDone(thenDo2);

//         setTimeout(function() { proc.whenDone(thenDo3); }, 100);

//         this.waitFor(function() { return calls.length > 1; }, 10, function() {
//             var expected = ["workerCalled", "thenDo1Called:23", "thenDo2Called:23", "thenDo3Called:23"];
//             this.assertEquals(expected, calls);

//             calls = [];
//             var proc2 = Functions.workerWithCallbackQueue('testWorkerWithCallbackQueue', worker).whenDone(thenDo4);
//             this.assert(proc2 !== proc, 'new process equals old?');
//             this.waitFor(function() { return calls.length > 1; }, 10, function() {
//                 var expected = ["workerCalled", "thenDo4Called:23"];
//                 this.assertEquals(expected, calls);
//                 this.done();
//             });
//         });
//     },

//     testWorkerWithCallbackQueueWithTimout: function() {
//         var calls = [];
//         function worker(thenDo) {
//             setTimeout(function() {
//                 calls.push("workerCalled");
//                 thenDo(null); }, 200);
//         }

//         function thenDo1(err, arg) { calls.push("thenDo1Called:" + (err ? err.message : null)); }
//         function thenDo2(err, arg) { calls.push("thenDo2Called:" + (err ? err.message : null)); }

//         var proc = Functions.workerWithCallbackQueue('testWorkerWithCallbackQueueWithTimout', worker, 100).whenDone(thenDo1);
//         setTimeout(function() { proc.whenDone(thenDo2); }, 50);

//         this.waitFor(function() { return calls.length > 1; }, 10, function() {
//             var expected = ["thenDo1Called:timeout", "thenDo2Called:timeout"];
//             this.assertEquals(expected, calls);
//             this.done();
//         });
//     },

//     testWorkerWithCallbackQueueWithError: function() {
//         var calls = [];
//         function worker(thenDo) {
//             var workerState = 22;
//             calls.push("workerCalled");
//             throw new Error('foo');
//         }

//         function thenDo1(err, arg) { calls.push(err.message); }
//         function thenDo2(err, arg) { calls.push(err.message); }

//         Functions.workerWithCallbackQueue('testWorkerWithCallbackQueueWithError', worker).whenDone(thenDo1);
//         Functions.workerWithCallbackQueue('testWorkerWithCallbackQueueWithError', worker).whenDone(thenDo2);

//         this.waitFor(function() { return calls.length > 1; }, 10, function() {
//             var expected = ["workerCalled", "foo", "foo"];
//             this.assertEquals(expected, calls);
//             this.done();
//         });
//     },

//     testWorkerWithCallbackQueueCancel: function() {
//         var calls = [];
//         function worker(thenDo) {
//             calls.push("workerCalled");
//             setTimeout(function() { thenDo(null); }, 40);
//         }

//         function thenDo1(err, arg) { calls.push("thenDo1Called"); }
//         function thenDo2(err, arg) { calls.push("thenDo2Called"); }

//         var proc = Functions.workerWithCallbackQueue('testWorkerWithCallbackQueue', worker).whenDone(thenDo1);
//         proc.cancel();
//         setTimeout(function() { Functions.workerWithCallbackQueue('testWorkerWithCallbackQueue', worker).whenDone(thenDo2); }, 20);

//         this.delay(function() {
//             var expected = ['workerCalled', 'thenDo2Called'];
//             this.assertEquals(expected, calls);
//             this.done();
//         }, 120);
//     },

//     testThrottleCommand: function() {
//         var called = 0, result = [];
//         Array.range(1,4).forEach(function(i) {
//             Functions.throttleNamed('testThrottleCommand', 20, function(i) { result.push(i); called++; })(i);
//         });
//         this.delay(function() {
//             Functions.throttleNamed('testThrottleCommand', 20, function(i) { result.push(i); called++; })(5);
//         }, 80);
//         this.delay(function() {
//             // call 1 immediatelly in the loop,
//             // call 2 after waiting for timeout with arg from last (fourth) invocation
//             // call 3 invocation after first throttle
//             this.assertEquals(3, called, 'throttle call count');
//             this.assertEquals([1,4,5], result, 'throttle result');
//             this.done();
//         }, 120);
//     },

//     testCompose: function() {
//         function mult(a,b) { return a * b; }
//         function add1(a) { return a + 1; }
//         var composed = Functions.compose(mult, add1, String),
//             result = composed(11, 2);
//         this.assert("23" === result, 'compose not OK: ' + Strings.print(result));
//         this.done();
//     },

//     testComposeAsync: function() {
//         var result, err, test1;
//         function mult(a,b, thenDo) { thenDo(null, a * b); }
//         function add1(a, thenDo) { thenDo(null, a + 1); }
//         var composed = Functions.composeAsync(mult, add1);
//         composed(11, 2, function(err, _result) { result = _result; });
//         this.waitFor(function() { return !!result; }, 10, function() {
//             this.assertEquals(23, result, 'composeAsync not OK: ' + Strings.print(result));
//             result = null;
//             test1 = true;
//         });

//         this.waitFor(function() { return !!test1; }, 10, function() {
//             function a(a,b, thenDo) { thenDo(new Error('ha ha'), a * b); }
//             function b(a, thenDo) { thenDo(null, a); }
//             var composed = Functions.composeAsync(a, b);
//             composed(11, 2, function(_err, _result) { err = _err; result = _result; });
//             this.waitFor(function() { return !!err || !!result; }, 10, function() {
//                 this.assert(!result, 'composeAsync result when error expected?: ' + Strings.print(result));
//                 this.assert(err, 'no error? ' + Strings.print(err));
//                 this.done();
//             });
//         });
//     },

//     testComposeAsyncWithError: function() {
//         var test = this, aRun = 0, bRun = 0, cRun = 0;
//         Functions.composeAsync(
//             function a(a,b, thenDo) { aRun++; thenDo(null, (a*b).barrr()); },
//             function b(a, thenDo) { bRun++; thenDo(null, a + 1); }
//         )(3,4, function(err, result) {
//             cRun++;
//             test.assertEquals(1, aRun, 'aRun');
//             test.assertEquals(0, bRun, 'bRun');
//             test.assertEquals(1, cRun, 'cRun');
//             test.assert(!result, 'result? ' + result);
//             test.assert(err instanceof TypeError, 'error? ' + err);
//         });
//         this.waitFor(function() { return !!cRun; }, 10, function() { this.done(); });
//     },

//     testComposeAsyncWithErrorDontActivateTwice: function() {
//         var test = this, aRun = 0, bRun = 0, cRun = 0;
//         Functions.composeAsync(
//             function a(a,b, thenDo) { aRun++; thenDo(null, a * b);
//                 throw new Error('afterthought'); /*throwing this error should not invoke the end handler*/},
//             function b(a, thenDo) { bRun++; thenDo(null, a + 1); }
//         )(4,5, function(err, result) {
//             cRun++;
//             test.assertEquals(1, aRun, 'aRun');
//             test.assertEquals(1, bRun, 'bRun');
//             test.assertEquals(1, cRun, 'cRun');
//             test.assertEquals(21, result, 'result? ' + result);
//             test.assert(!err, 'err? ' + err);
//         });
//         this.waitFor(function() { return !!cRun; }, 30, function() { this.done(); });
//     },

//     testFlip: function() {
//         function foo(a,b,c) { return '' + a + b + c; }
//         this.assertEquals('213', Functions.flip(foo)(1,2,3));
//         this.done();
//     },

//     testWaitFor: function() {
//         var x = 0, wasCalled, startTime = Date.now(), endTime, timeout;
//         Functions.waitFor(200, function() { return x === 1; }, function(_timeout) {
//             wasCalled = true; timeout = _timeout; endTime = Date.now();
//         });
//         this.delay(function() { x = 1; }, 100);
//         this.waitFor(function() { return !!wasCalled; }, 20,
//             function() {
//                 this.assert(!timeout, 'timout param not OK: ' + timeout);
//                 var duration = endTime - startTime;
//                 this.assert(duration >= 100, 'wait duration not OK: ' + duration);
//                 this.done();
//             });
//     },

//     testWaitForTimeout: function() {
//         var x = 0, wasCalled, startTime = Date.now(), endTime, timeout;
//         Functions.waitFor(200, function() { return x === 1; /*will never be true*/ },
//         function(_timeout) {
//             wasCalled = true; timeout = _timeout; endTime = Date.now();
//         });
//         this.waitFor(function() { return !!wasCalled; }, 20,
//             function() {
//                 this.assert(timeout, 'timeout param not OK: ' + timeout);
//                 var duration = endTime - startTime;
//                 this.assert(duration >= 200, 'wait duration not OK: ' + duration);
//                 this.done();
//             });
//     },

//     testAsScriptOf: function() {
//         var obj = {};
//         (function foo() { return 23; }).asScriptOf(obj);
//         this.assertEquals(23, obj.foo());
//         this.done();
//     },

//     testAsScriptOfWithSuper: function() {
//         var klass = function() {};
//         klass.prototype.foo = function() { return 3; };
//         var obj = new klass();
//         (function foo() { return $super() + 23; }).asScriptOf(obj);
//         this.assertEquals(26, obj.foo());
//         this.done();
//     }

});

// AsyncTestCase.subclass('lively.lang.tests.ExtensionTests.Function',
// "running", {
//     setUp: function()  {
//         this._queues = Functions._queues;
//         Functions._queues = {};
//         this._debouncedByName = Functions._debouncedByName;
//         Functions._debouncedByName = {};
//     },
//     tearDown: function()  {
//         Functions._queues = this._queues;
//         Functions._debouncedByName = this._debouncedByName;
//     }
// },

