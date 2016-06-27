'use strict';

//import * as acorn from './../src/babelsberg/jsinterpreter/acorn.js'
import Interpreter from './../src/babelsberg/jsinterpreter/interpreter.js'
import { aexpr } from '../src/active-expressions.js';


describe('Active Expressions', function() {
    it("should interpret", () => {
        var predicate = function () {
            return 23;
        };
        var i = new Interpreter(`var returnValue = (${predicate.toString()})();`);
        i.run();
        assert.equal(23, i.stateStack[0].scope.properties.returnValue);
        expect(i.stateStack[0].scope.properties.returnValue.data).to.equal(23);
    });

    xit("should allow constrained access to important globals", function() {
        var predicate = function () {
            return [jQuery, $, _, lively];
        };
        var r = ConstraintInterpreter.runAndReturn(predicate.toString())
        assert.equal([jQuery, $, _, lively], r)
    });

    it("runs a basic aexpr", () => {
        var obj = {a: 2, b: 3};
        let spy = sinon.spy();

        aexpr(function() {
            return obj.a;
        }, {obj}).onChange(spy);

        expect(spy.called).to.be.false;

        obj.a = 42;

        expect(spy.calledOnce).to.be.true;
    });

    it("should handle simple a calculation", () => {
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

    });

    it("handles assignments of complex objects", () => {
        let spy = sinon.spy(),
            complexObject = {
                foo: {
                    bar: 17
                }
            };

        aexpr(() => complexObject.foo.bar, {complexObject}).onChange(spy);

        complexObject.foo.bar = 33;
        expect(spy.calledOnce).to.be.true;

        let newBar = { bar: 42 };
        complexObject.foo = newBar;
        expect(spy.calledTwice).to.be.true;

        // changing th new bar property should trigger the callback
        newBar.bar = 0;
        expect(spy.calledThrice).to.be.true;
    });

    it("can do function calls", () => {
        function double(x) {
            return 2 * x;
        }

        let obj = { a: 17 },
            spy = sinon.spy();

        aexpr(() => double(obj.a), {obj, double}).onChange(spy);

        obj.a = 21;
        expect(spy.calledOnce).to.be.true;
    });

    it("traces simple function calls on objects", () => {
        let spy = sinon.spy(),
            rect = {
                width: 10,
                height: 20,
                area() {
                    return this.width * this.height;
                }
            };

        aexpr(() => rect.area(), {rect}).onChange(spy);

        rect.height = 33;
        expect(spy.calledOnce).to.be.true;
        //expect(spy.withArgs(330).calledOnce).to.be.true;
    });

    // TODO: cuurently leads to an error, as the property rect.area is overwritten, yet only the prototype has the .area function
    xit("traces function calls to the protopyte of an object", () => {
        class Rectangle {
            constructor(width, height) {
                this.width = width;
                this.height = height;
            }

            area() {
                return this.width * this.height;
            }
        }

        let rect = new Rectangle(10, 20),
            spy = sinon.spy();

        aexpr(() => rect.area(3), {rect}).onChange(spy);

        rect.height = 33;
        expect(spy.calledOnce).to.be.true;
    });
});
