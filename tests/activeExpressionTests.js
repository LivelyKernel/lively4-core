'use strict';

//import * as acorn from './../src/babelsberg/jsinterpreter/acorn.js'
import Interpreter from './../src/babelsberg/jsinterpreter/interpreter.js'
import { ConstraintInterpreter } from '../src/active-expressions.js';


describe('Scope', function() {
    it("should interpret", function() {
        var predicate = function () {
            return 23;
        }
        var i = new Interpreter(`var returnValue = (${predicate.toString()})();`);
        i.run();
        assert.equal(23, i.stateStack[0].scope.properties.returnValue)
    })

    it("should interpret constrained", function() {
        var predicate = function () {
            return 23;
        }
        var r = ConstraintInterpreter.runAndReturn(predicate.toString())
        assert.equal(23, r)
    })

    it("should interpret constrained a unary expression", function() {
        var predicate = function () {
            return -23;
        }
        var r = ConstraintInterpreter.runAndReturn(predicate.toString())
        assert.equal(-23, r)
    })

    it("should interpret constrained a binary expression", function() {
        var predicate = function () {
            return 2-23;
        }
        var r = ConstraintInterpreter.runAndReturn(predicate.toString())
        assert.equal(-21, r)
    })

    it("should interpret constrained a logical expression", function() {
        var predicate = function () {
            return true && false;
        }
        var r = ConstraintInterpreter.runAndReturn(predicate.toString())
        assert.equal(false, r)
    })

    it("should interpret constrained two logical expressions", function() {
        var predicate = function () {
            return true && false || true;
        }
        var r = ConstraintInterpreter.runAndReturn(predicate.toString())
        assert.equal(true, r)
    })

    xit("should interpret constrained a property access", function() {
        var predicate = function () {
            return window.nonexistingthing;
        }
        var r = ConstraintInterpreter.runAndReturn(predicate.toString())
        assert.equal(undefined, r)
    })

    xit("should interpret constrained a property access", function() {
        var foo = {x: 23};
        var predicate = function () {
            return foo.x;
        }
        var r = ConstraintInterpreter.runAndReturn(predicate.toString(), {foo: foo})
        assert.equal(foo.x, r)
        console.log(foo)
    })

    xit("should allow constrained access to important globals", function() {
        var predicate = function () {
            return [jQuery, $, _, lively];
        }
        var r = ConstraintInterpreter.runAndReturn(predicate.toString())
        assert.equal([jQuery, $, _, lively], r)
    })

    xit("should do simple things in constrainted mode", function() {
        var obj = {a: 2, b: 3};
        var predicate = function () {
            return obj.a + obj.b;
        }
        var r = ConstraintInterpreter.runAndReturn(predicate.toString(), {obj: obj})
        assert.equal(obj.a + obj.b, r)
    })


    xit("should solve a simple constraint", function() {
        var obj = {a: 2, b: 3};
        bbb.always({
            solver: new Relax(),
            ctx: {
                obj: obj
            }
        }, function() {
            return obj.a + obj.b == 3;
        });
        assert(obj.a + obj.b == 3, "Solver failed: " + obj.a + ", " + obj.b)
    })
});
