'use strict';

import chai, { expect } from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { BaseActiveExpression, aexpr } from '../../active-expression/active-expression.js';

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

  describe('Parameters', () => {
    it("single parameter", () => {
      let spy = sinon.spy(),
          obj = { a: 1 },
          aexpr = new BaseActiveExpression(o => o.a, { params: [obj] }).onChange(spy);

      expect(spy).not.to.be.called;

      obj.a = 2;
      aexpr.checkAndNotify();

      expect(spy).to.be.calledOnce;
    });

    it("multiple parameters", () => {
      let spy = sinon.spy(),
          obj1 = { val: 1 },
          obj2 = { val: 2 },
          obj3 = { val: 3 },
          aexpr = new BaseActiveExpression((o1, o2, o3) => o1.val + o2.val + o3.val, { params: [obj1, obj2, obj3] }).onChange(spy);

      expect(spy).not.to.be.called;

      obj1.val = 10;
      aexpr.checkAndNotify();

      expect(spy).to.be.calledWith(15);

      obj2.val = 20;
      aexpr.checkAndNotify();

      expect(spy).to.be.calledWith(33);
    });
  });
  describe('meta', () => {
    it('responds to meta', () => {
      // expect(BaseActiveExpression).to.respondTo('activate');
    });
    it('meta is chainable', () => {
      let aexpr = new BaseActiveExpression(() => {});

      let actual = aexpr.meta({ value: 'expect' });
      expect(actual).to.equal(aexpr);
    });
    it('stores values conveniently', () => {
      let aexpr = new BaseActiveExpression(() => {});

      aexpr.meta({ value: 'expected' });
      expect(aexpr.meta().get('value')).to.equal('expected');
    });
  });
  describe('callback parameters', () => {
    it('params include new value', () => {
      let spy = sinon.spy(),
          val = 17,
          aexpr = new BaseActiveExpression(() => val).onChange(spy);

      val = 42;
      aexpr.checkAndNotify();

      expect(spy).to.be.calledOnce;
      expect(spy).to.be.calledWith(42);
    });
    it('params include analysed function', () => {
      let val = 17,
          expr = () => val,
          spy = sinon.spy(),
          aexpr = new BaseActiveExpression(expr).onChange(spy);

      val = 42;
      aexpr.checkAndNotify();

      expect(spy).to.have.been.calledOnce;
      expect(spy.getCall(0).args[0]).to.equal(42);
      expect(spy.getCall(0).args[1]).to.have.property('expr', expr);
      expect(spy.getCall(0).args[1]).to.have.property('lastValue', 17);
      expect(spy.getCall(0).args[1]).to.have.property('aexpr', aexpr);
    });
  });
});