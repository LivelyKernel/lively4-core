"ae";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Trigger for Active Expressions', () => {
  it("chainable", () => {
    let obj = {a: 2},
        spy = sinon.spy();

    aexpr(() => obj.a > 5)
      .onBecomeFalse(spy)
      .onBecomeTrue(spy)
      .onBecomeFalse(spy)
      .onBecomeTrue(spy);

    expect(spy).to.be.calledTwice;
  });

  it("flank up", () => {
    let obj = {a: 2},
        spy = sinon.spy();

    let axp = aexpr(() => obj.a > 5);
    axp.onBecomeTrue(spy);
    expect(spy).not.to.be.called;

    obj.a = 10;
    expect(spy).to.be.calledOnce;

    obj.a = 0;
    expect(spy).to.be.calledOnce;

    obj.a = 10;
    expect(spy).to.be.calledTwice;
  });

  it("immediately triggers onBecomeTrue", () => {
    let obj = {a: 7},
        spy = sinon.spy();

    let axp = aexpr(() => obj.a > 5);
    axp.onBecomeTrue(spy);
    expect(spy).to.be.calledOnce;

    obj.a = 0;
    expect(spy).to.be.calledOnce;

    obj.a = 10;
    expect(spy).to.be.calledTwice;
  });

  it("flank down", () => {
    let obj = {a: 2},
        spy = sinon.spy();

    let axp = aexpr(() => obj.a > 0);
    axp.onBecomeFalse(spy);
    expect(spy).not.to.be.called;

    obj.a = -2;
    expect(spy).to.be.calledOnce;

    obj.a = 2;
    expect(spy).to.be.calledOnce;

    obj.a = -2;
    expect(spy).to.be.calledTwice;
  });

  it("immediately triggers onBecomeFalse", () => {
    let obj = {a: -2},
        spy = sinon.spy();

    let axp = aexpr(() => obj.a > 0);
    axp.onBecomeFalse(spy);
    expect(spy).to.be.calledOnce;

    obj.a = 2;
    expect(spy).to.be.calledOnce;

    obj.a = -2;
    expect(spy).to.be.calledTwice;
  });

  describe('dataflow', () => {
    it("aexprs define dataflow", () => {
      expect(aexpr(() => {})).to.respondTo('dataflow');
    });

    it("dataflow is chainable", () => {
      let expectedAxp = aexpr(() => {});
      let actualAxp = expectedAxp.dataflow(() => {});
      expect(actualAxp).to.equal(expectedAxp);
    });

    it("dataflow invokes callback immediately", () => {
    let obj = {a: -2},
        spy = sinon.spy();

      let axp = aexpr(() => obj.a)
        .dataflow(spy);

      expect(spy).to.be.calledOnce;
      expect(spy).to.be.calledWithMatch(-2);

      obj.a = 42;
      expect(spy).to.be.calledTwice;
      expect(spy).to.be.calledWithMatch(42);
    });
  });
});
