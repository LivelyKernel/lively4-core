'enable aexpr';
'use strict';

import chai, { expect } from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { BaseActiveExpression } from '../../active-expression/active-expression.js';
import { TickingActiveExpression, check } from '../../active-expression-convention/active-expression-ticking.js';
import { FrameBasedActiveExpression } from '../../active-expression-convention/active-expression-frame-based.js';

describe('.setExpression', () => {
  
  it('responds to setExpression', () => {
    expect(BaseActiveExpression).to.respondTo('setExpression');
  });

  it(".setExpression is chainable", () => {
    const bae = new BaseActiveExpression(() => {});
    const bae2 = bae.setExpression(() => {});
    expect(bae === bae2).to.be.true;
  });

  it(".setExpression throws if no function is given", () => {
    const bae = new BaseActiveExpression(() => {});

    expect(() => {
      bae.setExpression();
    }).to.throw(TypeError, 'no function given');

    expect(() => {
      bae.setExpression(17);
    }).to.throw(TypeError, 'no function given');

    expect(() => {
      bae.setExpression(() => {});
    }).not.to.throw();
  });

  it("can set new expression", () => {
    let spy = sinon.spy(),
        obj = { a: 1, b: 1 },
        bae = new BaseActiveExpression(() => obj.a).onChange(spy);

    bae.setExpression(() => obj.b);
    obj.b = 2;

    expect(bae.getCurrentValue()).to.equal(2);
  });

  it("calls callback immediately", () => {
    let spy = sinon.spy(),
        obj = { a: 1, b: 2 },
        bae = new BaseActiveExpression(() => obj.a).onChange(spy);

    bae.setExpression(() => obj.b);

    expect(spy).to.be.calledOnce;
  });

  it("does not call callback immediately (via option)", () => {
    let spy = sinon.spy(),
        obj = { a: 1, b: 2 },
        bae = new BaseActiveExpression(() => obj.a).onChange(spy);

    bae.setExpression(() => obj.b, { checkImmediately: false });

    expect(spy).not.to.be.called;
  });

  describe('Rewriting Active Expressions', () => {

    it("calls callback immediately", () => {
      let spy = sinon.spy(),
          obj = { a: 1, b: 2 };
      let ae = aexpr(() => obj.a).onChange(spy);

      ae.setExpression(() => obj.b);
      expect(spy).to.be.calledOnce;
    });

    it("monitors the new dependencies", () => {
      let spy = sinon.spy(),
          obj = { a: 1, b: 1 };
      let ae = aexpr(() => obj.a).onChange(spy);

      ae.setExpression(() => obj.b);
      expect(spy).not.to.be.called;

      obj.b = 2
      expect(spy).to.be.calledOnce;
    });

    // #TODO: checkImmediately: false feels weird
    // #TODO: either get rid of it entirely or find out, whether we want lastValue to be the last value of the old expression or the current value of the new expression
    it("checkImmediately: false", () => {
      let spy = sinon.spy(),
          obj = { a: 1, b: 2 };
      let ae = aexpr(() => obj.a).onChange(spy);

      ae.setExpression(() => obj.b, { checkImmediately: false });
      expect(spy).not.to.be.called;

      obj.b = 3
      // #UNCERTAIN: what is lastValue here?
      expect(spy).to.be.calledOnce;
    });

  });

  describe('Convention', () => {

    describe('Ticking Active Expressions', () => {

      it("does not call callback immediately (ticking)", () => {
        let spy = sinon.spy(),
            obj = { a: 1, b: 2 };
        let ae = new TickingActiveExpression(() => obj.a).onChange(spy);

        ae.setExpression(() => obj.b);
        expect(spy.called).to.be.false;
        expect(ae.getCurrentValue()).to.equal(2)

        check();
        expect(spy).to.be.calledOnce;
      });

      it("calls callback immediately ONLY IF EXPLICITLY WANTED", () => {
        let spy = sinon.spy(),
            obj = { a: 1, b: 2 };
        let ae = new TickingActiveExpression(() => obj.a).onChange(spy);

        ae.setExpression(() => obj.b, { checkImmediately: true });
        expect(spy).to.be.calledOnce;
      });

    });

    describe('Frame-Based Active Expressions', () => {

      it("does not call callback immediately (frame-based)", async () => {
        let spy = sinon.spy(),
            obj = { a: 1, b: 2 };
        let ae = new FrameBasedActiveExpression(() => obj.a);
        ae.onChange(spy);

        ae.setExpression(() => obj.b);
        expect(spy.called).to.be.false;
        expect(ae.getCurrentValue()).to.equal(2)

        await lively.sleep(50)
        expect(spy).to.be.calledOnce;
      });

      it("calls callback immediately ONLY IF EXPLICITLY WANTED", () => {
        let spy = sinon.spy(),
            obj = { a: 1, b: 2 };
        let ae = new FrameBasedActiveExpression(() => obj.a)
        ae.onChange(spy);

        ae.setExpression(() => obj.b, { checkImmediately: true });
        expect(spy).to.be.calledOnce;
      });

    });

  });

});