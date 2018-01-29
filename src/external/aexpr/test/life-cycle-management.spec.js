"enable aexpr";
import chai, {expect} from 'node_modules/chai/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'node_modules/sinon-chai/lib/sinon-chai.js';
chai.use(sinonChai);

import * as frameBasedAExpr from "frame-based-aexpr";

describe("life-cycle management", function() {
  describe("(de)activate", function() {
    it("aexprs define activate and deactivate", () => {
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
    function wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

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

  describe('disposeOnLastCallbackDetached', function() {
    it('is defined', () => {
      let exp = aexpr(() => {});
      expect(exp).to.respondTo('disposeOnLastCallbackDetached');
    });

    xit('is chainable', () => {
      let exp = aexpr(() => {})
      let exp2 = exp.disposeOnLastCallbackDetached();
      expect(exp2).to.equal(exp);
    });

    xit('works', () => {
      // #TODO: proper test first
    });
  });
});
