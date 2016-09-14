'use strict';

import { aexpr, check, clearDefaultActiveExpressions } from './../../src/ticking/ticking-active-expressions.js';

describe('Ticking Active Expressions', () => {
    it("runs a basic aexpr", () => {
        let obj = {a: 2, b: 3},
            spy = sinon.spy();

        aexpr(() => obj.a).onChange(spy);

        check();
        expect(spy.called).to.be.false;

        obj.a = 42;

        check();
        expect(spy.calledOnce).to.be.true;
    });

    it("recognize changes to local variables", () => {
        let val = 17,
            spy = sinon.spy();

        aexpr(() => val).onChange(spy);

        val = 42;

        check();
        expect(spy.calledOnce).to.be.true;
    });

    it("provide the new value of the expression to the callback", () => {
        let val = 17,
            spy = sinon.spy();

        aexpr(() => val).onChange(spy);

        val = 42;

        check();
        expect(spy.withArgs(42).calledOnce).to.be.true;
    });

    it("provide additional information (e.g. the last value of the expression) to the callback", () => {
        let val = 17,
            spy = sinon.spy();

        aexpr(() => val).onChange(spy);

        val = 42;

        check();
        expect(spy.withArgs(42, {lastValue: 17}).calledOnce).to.be.true;
    });

    it("provide additional information (e.g. the last value of the expression) to the callback", () => {
        let val = 17,
            spy = sinon.spy();

        aexpr(() => val).onChange(spy);

        val = 42;

        check();
        expect(spy.withArgs(42, {lastValue: 17}).calledOnce).to.be.true;
    });

    describe('check', () => {
        it("run multiple checks only invokes the callback once", () => {
            let val = 17,
                spy = sinon.spy();

            aexpr(() => val).onChange(spy);

            val = 42;

            check();
            check();

            expect(spy.calledOnce).to.be.true;
        });

        it("check all active expressions if not specified further", () => {
            let val1 = 17,
                val2 = 33,
                spy1 = sinon.spy(),
                spy2 = sinon.spy();

            aexpr(() => val1).onChange(spy1);
            aexpr(() => val2).onChange(spy2);

            val1 = 42;
            val2 = 51;

            check();

            expect(spy1.calledOnce).to.be.true;
            expect(spy2.calledOnce).to.be.true;
        });

        it("check all active expressions provided by an iterator", () => {
            let val = 17,
                spy1 = sinon.spy(),
                spy2 = sinon.spy(),
                spy3 = sinon.spy(),
                aexpr1 = aexpr(() => val).onChange(spy1),
                aexpr2 = aexpr(() => val).onChange(spy2),
                aexpr3 = aexpr(() => val).onChange(spy3);

            val = 42;

            check([aexpr1, aexpr2]);

            expect(spy1.calledOnce).to.be.true;
            expect(spy2.calledOnce).to.be.true;
            expect(spy3.called).to.be.false;
        });

        // TODO: should this really be part of the API?
        it("check a single active expressions", () => {
            let val = 17,
                spy = sinon.spy(),
                expr = aexpr(() => val).onChange(spy);

            val = 42;
            expr.checkAndNotify();

            expect(spy.calledOnce).to.be.true;
        });
    });

    // TODO: is this useful?
    describe('disable and re-enable', () => {
        it("disabled aexprs do not fire notify the callback", () => {
            let val = 17,
                spy = sinon.spy();

            aexpr(() => val)
                .onChange(spy)
                .disable();

            val = 33;
            check();

            expect(spy.called).to.be.false;
        });

        it("disabled aexprs do nothing when explicitly listed to be checked", () => {
            let val = 17,
                spy = sinon.spy(),
                expr = aexpr(() => val)
                    .onChange(spy)
                    .disable();

            val = 33;
            check([expr]);

            expect(spy.called).to.be.false;
        });

        it("disabled aexprs do nothing when explicitly listed to be checked", () => {
            let val = 17,
                spy = sinon.spy(),
                expr = aexpr(() => val)
                    .onChange(spy)
                    .disable();

            val = 33;
            check();

            expect(spy.called).to.be.false;

            expr.enable();

            val = 33;
            check();

            expect(spy.calledOnce).to.be.true;

        });
    });

    describe('clearDefaultActiveExpressions', () => {
        it("clear global fallback set of active expressions", () => {
            let val = 17,
                spy = sinon.spy();

            let expr = aexpr(() => val)
                .onChange(spy);

            val = 33;

            clearDefaultActiveExpressions();

            check();

            expect(spy.called).to.be.false;

            check([expr]);

            expect(spy.called).to.be.true;
        });
    });
});
