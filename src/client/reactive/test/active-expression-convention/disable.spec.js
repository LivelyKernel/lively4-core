"enable aexpr";

import chai, { expect } from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { TickingActiveExpression, check } from '../../active-expression-convention/active-expression-ticking.js';

import { FrameBasedActiveExpression } from '../../active-expression-convention/active-expression-frame-based.js';

describe('disable (Ticking Active Expressions)', () => {

  it('setter while disabled', () => {
    var obj = { prop: 42 };
    const spy = sinon.spy();
    let ae = new TickingActiveExpression(() => obj.prop).onChange(spy);

    ae.disable();

    obj.prop = 17;
    check([ae]);

    expect(spy).not.to.be.called;
  });

  it('setter while enabled', () => {
    var obj = { prop: 42 };
    const spy = sinon.spy();
    let ae = new TickingActiveExpression(() => obj.prop, { disabled: true }).onChange(spy);

    ae.enable();

    obj.prop = 17;
    check([ae]);

    expect(spy).to.be.calledOnce;
  });

  it('check via .enable', () => {
    var x = 42;
    const spy = sinon.spy();
    let ae = new TickingActiveExpression(() => x, { disabled: true }).onChange(spy);

    x = 17;
    check([ae]);
    expect(spy).not.to.be.called;

    ae.enable();
    expect(spy).to.be.calledOnce;
  });

  it('not check via .enable', () => {
    var x = 1;
    const spy = sinon.spy();
    let ae = new TickingActiveExpression(() => x, { disabled: true }).onChange(spy);

    x = 2;
    check([ae]);

    ae.enable({ check: false });
    expect(spy).not.to.be.called;

    x = 3;
    check([ae]);

    expect(spy).to.be.calledOnce;
    expect(spy.firstCall.args[1].lastValue).to.equal(2);
  });

  it('.setExpression while disabled', () => {
    const spy = sinon.spy();
    let ae = new TickingActiveExpression(() => 1, { disabled: true }).onChange(spy);

    ae.setExpression(() => 2);
    check([ae]);
    expect(spy).not.to.be.called;

    ae.enable();
    expect(spy).to.be.calledOnce;
    expect(spy.firstCall.args[1].lastValue).to.equal(1);
  });

  it('.setExpression while disabled, then no check on re-enabling', () => {
    const spy = sinon.spy();
    var o1 = { p: 1 };
    var o2 = { p: 2 };
    let ae = new TickingActiveExpression(() => o1.p, { disabled: true }).onChange(spy);

    ae.setExpression(() => o2.p);
    check([ae]);
    expect(spy).not.to.be.called;

    ae.enable({ check: false });

    o2.p = 3;
    check([ae]);
    expect(spy).to.be.calledOnce;
    expect(spy.firstCall.args[1].lastValue).to.equal(2);
  });

});

describe('disable (Frame-based Active Expressions)', () => {

  it('setter while disabled', async () => {
    var obj = { prop: 42 };
    const spy = sinon.spy();
    let ae = new FrameBasedActiveExpression(() => obj.prop).onChange(spy);

    ae.disable();

    obj.prop = 17;
    await lively.sleep(50);

    expect(spy).not.to.be.called;
  });

  it('setter while enabled', async () => {
    var obj = { prop: 42 };
    const spy = sinon.spy();
    let ae = new FrameBasedActiveExpression(() => obj.prop, { disabled: true }).onChange(spy);

    ae.enable();
    await lively.sleep(50);
    expect(spy).not.to.be.called;

    obj.prop = 17;
    await lively.sleep(50);

    expect(spy).to.be.calledOnce;
  });

  it('check via .enable', async () => {
    var x = 42;
    const spy = sinon.spy();
    let ae = new FrameBasedActiveExpression(() => x, { disabled: true }).onChange(spy);

    x = 17;
    await lively.sleep(50);
    expect(spy).not.to.be.called;

    ae.enable();
    await lively.sleep(50);
    expect(spy).to.be.calledOnce;
  });

  it('not check via .enable', async () => {
    var obj = { prop: 1 };
    const spy = sinon.spy();
    let ae = new FrameBasedActiveExpression(() => obj.prop, { disabled: true }).onChange(spy);

    obj = { prop: 2 };
    ae.enable({ check: false });
    await lively.sleep(50);
    expect(spy).not.to.be.called;

    obj = { prop: 3 };
    await lively.sleep(50);
    expect(spy).to.be.calledOnce;
    expect(spy.firstCall.args[1].lastValue).to.equal(2);
  });

  it('.setExpression while disabled', async () => {
    const spy = sinon.spy();
    let ae = new FrameBasedActiveExpression(() => 1, { disabled: true }).onChange(spy);

    ae.setExpression(() => 2);
    await lively.sleep(50);
    expect(spy).not.to.be.called;

    ae.enable();
    await lively.sleep(50);
    expect(spy).to.be.calledOnce;
    expect(spy.firstCall.args[1].lastValue).to.equal(1);
  });

  it('.setExpression while disabled, then no check on re-enabling', async () => {
    const spy = sinon.spy();
    var o1 = { p: 1 };
    var o2 = { p: 2 };
    let ae = new FrameBasedActiveExpression(() => o1.p, { disabled: true }).onChange(spy);

    ae.setExpression(() => o2.p);
    await lively.sleep(50);
    expect(spy).not.to.be.called;

    ae.enable({ check: false });

    o2.p = 3;
    await lively.sleep(50);
    expect(spy).to.be.calledOnce;
    expect(spy.firstCall.args[1].lastValue).to.equal(2);
  });

});