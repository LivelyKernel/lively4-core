"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { BaseActiveExpression } from 'src/client/reactive/active-expressions/active-expressions/src/base/base-active-expressions.js';
import * as frameBasedAExpr from "frame-based-aexpr";

import { wait } from 'utils';

describe("life-cycle management", function() {
  describe("(de)activate", function() {
    xit("aexprs define activate and deactivate", () => {
      let axp = aexpr(() => {});
      expect(axp).to.respondTo('activate');
      expect(axp).to.respondTo('deactivate');
    });
    
    xit("temporarily deactivate an aexpr", function() {
      let value = 0;
      let spy = sinon.spy();
      let axp = aexpr(() => value);
      axp.onChange(spy);

      value = 1;
      expect(spy).to.be.calledOnce;
      expect(spy).to.be.calledWithMatch(1);
      spy.reset();

      axp.deactivate();

      value = 2;
      expect(spy).not.to.be.called;

      value = 3;
      expect(spy).not.to.be.called;

      axp.activate();
      expect(spy).to.be.calledOnce;
      expect(spy).to.be.calledWithMatch(3);
      spy.reset();

      axp.deactivate();

      value = 4;
      expect(spy).not.to.be.called;

      value = 5;
      expect(spy).not.to.be.called;

      axp.activate();
      expect(spy).to.be.calledOnce;
      expect(spy).to.be.calledWithMatch(5);
    });
  });

  describe("dispose", function() {
    it("aexprs define dispose", () => {
      expect(aexpr(() => {})).to.respondTo('dispose');
    });

    it("dispose frame-based aexprs", async done => {
      try {
        let value = 0;
        let spy = sinon.spy();
        let axp = frameBasedAExpr.aexpr(() => value);
        axp.onChange(spy);

        expect(spy).not.to.be.called;

        value = 1;
        await wait(200);
        expect(spy).to.be.calledOnce;
        expect(spy).to.be.calledWithMatch(1);
        spy.reset();

        axp.dispose();

        value = 2;
        await wait(200);
        expect(spy).not.to.be.called;

        let spy2 = sinon.spy();
        axp.onChange(spy2);
        value = 3;
        await wait(200);
        expect(spy2).not.to.be.called;

        done();
      } catch(error) {
        done(error);
      }
    }).timeout(3000);

    it("dispose rewriting aexprs", () => {
      let value = 0;
      let spy = sinon.spy();
      let axp = aexpr(() => value);
      axp.onChange(spy);

      expect(spy).not.to.be.called;

      value = 1;
      expect(spy).to.be.calledOnce;
      expect(spy).to.be.calledWithMatch(1);
      spy.reset();

      axp.dispose();

      value = 2;
      expect(spy).not.to.be.called;
    });

    it("dispose rewriting aexprs in callback", () => {
      let value = 0;
      let axp = aexpr(() => value);
      let spy = sinon.spy(() => axp.dispose());
      axp.onChange(spy);

      value = 1;
      expect(spy).to.be.calledOnce;
      expect(spy).to.be.calledWithMatch(1);
      spy.reset();

      value = 2;
      expect(spy).not.to.be.called;
    });
    
  });

  describe("isDisposed", function() {
    it('is defined', () => {
      expect(BaseActiveExpression).to.respondTo('isDisposed');
    });
    it('outputs disposing status', () => {
      let axp = aexpr(() => true);
      expect(axp.isDisposed()).not.to.be.ok;
      axp.dispose();
      expect(axp.isDisposed()).to.be.ok;
    });
  });

  describe('disposeOnLastCallbackDetached', function() {
    it('is defined', () => {
      let exp = aexpr(() => {});
      expect(exp).to.respondTo('disposeOnLastCallbackDetached');
    });

    it('is chainable', () => {
      let exp = aexpr(() => {})
      let exp2 = exp.disposeOnLastCallbackDetached();
      expect(exp2).to.equal(exp);
    });

    // #TODO: proper test first
    it('works', () => {
      let spy = sinon.spy();
      let bool = false
      const expr = aexpr(() => bool)
        .onChange(spy);
      
      expr.disposeOnLastCallbackDetached();
      
      bool = true;
      expect(spy).to.be.calledOnce;
      
      expr.offChange(spy);
      // bool = false;
      // expect(spy).to.be.calledOnce;
      // #TODO: use `aexpr.isDisposed()` instead
      expect(expr._isDisposed).to.be.ok;
    });

    it('works instantaneously', () => {
      let spy = sinon.spy();
      let bool = false
      const expr = aexpr(() => bool)
        .disposeOnLastCallbackDetached()
        .onChange(spy)
        .offChange(spy);
      
      bool = true;
      // #TODO: use `aexpr.isDisposed()` instead
      expect(expr._isDisposed).to.be.ok;
    });
});
});
