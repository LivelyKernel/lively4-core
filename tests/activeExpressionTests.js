'use strict';

//import * as acorn from './../src/babelsberg/jsinterpreter/acorn.js'
import Interpreter from './../src/babelsberg/jsinterpreter/interpreter.js'
import { ConstraintInterpreter, aexpr } from '../src/active-expressions.js';


describe('Active Expressions', function() {
    it("should interpret", function() {
        var predicate = function () {
            return 23;
        };
        var i = new Interpreter(`var returnValue = (${predicate.toString()})();`);
        i.run();
        assert.equal(23, i.stateStack[0].scope.properties.returnValue);
        expect(i.stateStack[0].scope.properties.returnValue.data).to.equal(23);
    });

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
    });


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
    });

    it("runs a basic aexpr", () => {
        var obj = {a: 2, b: 3};
        let spy = sinon.spy();

        aexpr(function() {
            return obj.a;
        }, {obj}).onChange(spy);

        obj.a = 42;

        expect(spy.calledOnce).to.be.true;
    });

    it("should handle simple a calculation", function() {
        var obj = {a: 2, b: 3};
        let spy = sinon.spy();
        function predicate() {
            return obj.a + obj.b;
        }

        aexpr(predicate, {obj})
            .onChange(spy);

        obj.a = 42;

        expect(spy.calledOnce).to.be.true;

        obj.b = 17;

        expect(spy.calledTwice).to.be.true;
    });

    it("should not invoke the callback if assigning the same value", () => {
        var obj = {a: 0, b: 3};
        let spy = sinon.spy();
        function predicate() {
            return obj.a * obj.b;
        }

        aexpr(predicate, {obj})
            .onChange(spy);

        obj.b = 5;

        expect(spy.called).to.be.false;

        obj.a = 17;

        expect(spy.calledOnce).to.be.true;
    });

    it("invokes multiple callbacks", () => {
        var obj = {a: 1};
        let spy1 = sinon.spy(),
            spy2 = sinon.spy(),
            spy3 = sinon.spy();

        aexpr(() => obj.a, {obj})
            .onChange(spy1)
            .onChange(spy2)
            .onChange(spy3);

        obj.a = 2;

        expect(spy1.calledOnce).to.be.true;
        expect(spy2.calledOnce).to.be.true;
        expect(spy3.calledOnce).to.be.true;
    });

    it("use multiple aexprs", () => {
        var obj = {a: 1};
        let spy = sinon.spy();

        aexpr(() => obj.a, {obj}).onChange(spy);
        aexpr(() => obj.a, {obj}).onChange(spy);

        obj.a = 2;

        expect(spy.calledTwice).to.be.true;
    });

    it("uninstalls an aexpr (and reinstalls it afterwards)", () => {
        var obj = {a: 2, b: 3};
        let spy = sinon.spy();

        let expr = aexpr(function() {
            return obj.a;
        }, {obj}).onChange(spy);

        expr.revoke();

        obj.a = 42;

        expect(spy.called).to.be.false;

        expr.installListeners();

        obj.a = 3;

        expect(spy.calledOnce).to.be.true;
    });

    it("deals with the prototype chain", () => {
        var superObj = {a: 'superA', b: 'superB'},
            subObj = Object.create(superObj, {
                b: {
                    value: 'subB',
                    configurable: true,
                    enumerable: true,
                    writable: true
                },
                c: {value: 'subC', configurable: true}
            });

        debugger;


    });
});
