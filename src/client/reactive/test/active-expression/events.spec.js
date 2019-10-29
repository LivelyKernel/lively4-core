"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Active Expressions as Event Targets', () => {
  it("supported", () => {
    const ae = aexpr(() => {});

    expect(ae).to.respondTo('addEventListener');
    expect(ae).to.respondTo('removeEventListener');
    expect(ae).to.respondTo('dispatchEvent');
    expect(ae).to.respondTo('getEventListener');
  });

  xit("flank up", () => {
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

  xit("immediately triggers onBecomeTrue", () => {
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

  xit("flank down", () => {
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

  xit("immediately triggers onBecomeFalse", () => {
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
    xit("dataflow is chainable", () => {
      let expectedAxp = aexpr(() => {});
      let actualAxp = expectedAxp.dataflow(() => {});
      expect(actualAxp).to.equal(expectedAxp);
    });

    xit("dataflow invokes callback immediately", () => {
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
