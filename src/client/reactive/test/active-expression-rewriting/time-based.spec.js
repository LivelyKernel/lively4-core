'enable aexpr';
'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { wait } from 'utils';

function check() {}
function clearDefaultActiveExpressions() {}

describe('Time-based Triggers for Active Expressions', () => {
    it("runs a basic aexpr", () => {
        let obj = {a: 2, b: 3},
            spy = sinon.spy();

        aexpr(() => obj.a).onChange(spy);

        expect(spy.called).to.be.false;

        obj.a = 42;

        expect(spy.calledOnce).to.be.true;
    });

    it("recognize changes to local variables", () => {
        let val = 17,
            spy = sinon.spy();

        aexpr(() => val).onChange(spy);

        val = 42;

        expect(spy.calledOnce).to.be.true;
    });

    it("provide the new value of the expression to the callback", () => {
        let val = 17,
            spy = sinon.spy();

        aexpr(() => val).onChange(spy);

        val = 42;

        expect(spy.withArgs(42).calledOnce).to.be.true;
    });

    it("provide additional information (e.g. the last value of the expression) to the callback", () => {
        let val = 17,
            spy = sinon.spy();

        aexpr(() => val).onChange(spy);

        val = 42;

        expect(spy).to.have.been.calledOnce;
        expect(spy.getCall(0).args[0]).to.equal(42);
        expect(spy.getCall(0).args[1]).to.have.property('lastValue', 17);
    });

    describe('check', () => {
        it("run multiple checks only invokes the callback once", () => {
            let val = 17,
                spy = sinon.spy();

            aexpr(() => val).onChange(spy);

            val = 42;

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

            expect(spy1.calledOnce).to.be.true;
            expect(spy2.calledOnce).to.be.true;
        });

        it("check all active expressions listening on a property", () => {
            let val = 17;
            const spy1 = sinon.spy();
            const spy2 = sinon.spy();
            const spy3 = sinon.spy();
            aexpr(() => val).onChange(spy1);
            aexpr(() => val).onChange(spy2);
            aexpr(() => val).onChange(spy3);

            val = 42;

            expect(spy1.calledOnce).to.be.true;
            expect(spy2.calledOnce).to.be.true;
            expect(spy3.calledOnce).to.be.true;
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

    describe('parametrizable aexprs', () => {
        it("handle aexprs with one single instance-bindong", () => {
            let obj = { val: 17 },
                spy = sinon.spy();

            aexpr(o => o.val, { params: [obj] }).onChange(spy);

            expect(spy).not.to.be.called;

            obj.val = 42;

            expect(spy).to.be.calledOnce;
        });

        it("handle aexprs with one instance-binding with multiple variables", () => {
            let obj1 = { val: 1 },
                obj2 = { val: 2 },
                obj3 = { val: 3 },
                spy = sinon.spy();

            aexpr((o1, o2, o3) => o1.val + o2.val + o3.val, { params: [obj1, obj2, obj3] }).onChange(spy);

            expect(spy).not.to.be.called;

            obj1.val = 10;
            expect(spy.withArgs(15)).to.be.calledOnce;

            obj2.val = 20;
            expect(spy.withArgs(33)).to.be.calledOnce;
        });

        it("handle aexprs with multiple instance-bindings", () => {
            let obj1 = { val: 1 },
                obj2 = { val: 2 },
                obj3 = { val: 3 },
                spy12 = sinon.spy(),
                spy23 = sinon.spy(),
                expr = (o1, o2) => o1.val + o2.val;

            aexpr(expr, { params: [obj1, obj2] }).onChange(spy12);
            aexpr(expr, { params: [obj2, obj3] }).onChange(spy23);

            expect(spy12).not.to.be.called;
            expect(spy23).not.to.be.called;

            obj1.val = 10;
            expect(spy12.withArgs(12)).to.be.calledOnce;
            expect(spy23).not.to.be.called;

            obj2.val = 20;
            expect(spy12.withArgs(30)).to.be.calledOnce;
            expect(spy23.withArgs(23)).to.be.calledOnce;

            obj3.val = 30;
            expect(spy12.withArgs(30)).to.be.calledOnce;
            expect(spy23.withArgs(50)).to.be.calledOnce;
        });
    });

        // TODO: is this useful?
    describe('Date.now()', () => {
      
        it("200 ms timer", async () => {
          let spy = sinon.spy();
          let referenceTime = Date.now();
          let timeMultiplier = 1;

          // fires in 300 milliseconds
          aexpr(() => Date.now() >= 300*timeMultiplier + referenceTime).onChange(spy);

          await wait(100*timeMultiplier);
          
          if (Date.now() < 300*timeMultiplier + referenceTime ) { 
            expect(spy).not.to.be.called;
          } else {
            // wait took to long!
          }

          await wait(500*timeMultiplier);
          expect(spy).to.be.calledOnce;
        });

        it("100 ms timer but aexpr disposed in between", async () => {
          let spy = sinon.spy();
          let referenceTime = Date.now();

          // fires in 100 milliseconds
          const ae = aexpr(() => Date.now() >= 100 + referenceTime).onChange(spy);

          await wait(50);
          expect(spy).not.to.be.called;

          ae.dispose();

          await wait(100);
          expect(spy).not.to.be.called;
        });

        it("new Date()/detects the global Date object, referenced as constructor", async () => {
          let spy = sinon.spy();
          let referenceTime = Date.now();

          // fires in 100 milliseconds
          aexpr(() => new Date().getTime() >= 100 + referenceTime).onChange(spy);
          
          await wait(50);
          expect(spy).not.to.be.called;

          await wait(100);
          expect(spy).to.be.calledOnce;
        });

        it("date.toFormattedString", async () => {
          let spy = sinon.spy();

          aexpr(() => new Date().toFormattedString('hh.mm.ss')).onChange(spy);
          
          await wait(1000);
          expect(spy).to.be.calledOnce;
        });

    });

});
