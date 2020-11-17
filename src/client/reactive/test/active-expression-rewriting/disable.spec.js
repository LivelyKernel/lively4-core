"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('disable (Rewriting Active Expressions)', () => {

  it('setter while disabled', () => {
    var obj = { prop: 42 };
    const spy = sinon.spy();
    let ae = aexpr(() => obj.prop).onChange(spy)

    ae.disable();

    obj.prop = 17;

    expect(spy).not.to.be.called;
  });

  it('setter while enabled', () => {
    var obj = { prop: 42 };
    const spy = sinon.spy();
    let ae = aexpr(() => obj.prop, { disabled: true }).onChange(spy)

    ae.enable();

    obj.prop = 17;

    expect(spy).to.be.calledOnce;
  });

  it('check via .enable', () => {
    var x = 42;
    const spy = sinon.spy();
    let ae = aexpr(() => x, { disabled: true }).onChange(spy)

    x = 17;
    expect(spy).not.to.be.called;

    ae.enable();
    expect(spy).to.be.calledOnce;
  });

  it('not check via .enable', () => {
    var obj = { prop: 1 };
    const spy = sinon.spy();
    let ae = aexpr(() => obj.prop, { disabled: true }).onChange(spy)

    obj = { prop: 2 };
    ae.enable({ check: false });
    expect(spy).not.to.be.called;

    obj = { prop: 3 };
    expect(spy).to.be.calledOnce;
    expect(spy.firstCall.args[1].lastValue).to.equal(2)
  });

  it('.setExpression while disabled', () => {
    const spy = sinon.spy();
    let ae = aexpr(() => 1, { disabled: true }).onChange(spy)

    ae.setExpression(() => 2);
    expect(spy).not.to.be.called;

    ae.enable();
    expect(spy).to.be.calledOnce;
    expect(spy.firstCall.args[1].lastValue).to.equal(1)
  });

  it('.setExpression while disabled, then no check on re-enabling', () => {
    const spy = sinon.spy();
    var o1 = { p: 1 }
    var o2 = { p: 2 }
    let ae = aexpr(() => o1.p, { disabled: true }).onChange(spy)

    ae.setExpression(() => o2.p);
    expect(spy).not.to.be.called;

    ae.enable({ check: false });

    o2.p = 3
    expect(spy).to.be.calledOnce;
    expect(spy.firstCall.args[1].lastValue).to.equal(2)
  });

});
