"ae";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Active Expressions as Event Targets', () => {

  it("supported", () => {
    const ae = aexpr(() => {});

    expect(ae).to.respondTo('on');
    expect(ae).to.respondTo('off');
    expect(ae).to.respondTo('emit');
    expect(ae).to.respondTo('getEventListeners');
  });

  it('dispose event', () => {
    const spy = sinon.spy();
    const ae = aexpr(() => {}).on('dispose', spy);

    ae.dispose();
    expect(spy).to.be.calledOnce;
    expect(spy).to.be.calledWith();
    spy.reset();

    ae.dispose();
    expect(spy).not.to.be.called;
  });

  it('remove listeners', () => {
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    const spy3 = sinon.spy();
    const ae = aexpr(() => {})
      .on('dispose', spy1)
      .off('dispose', spy1)
      .on('dispose', spy2)
      .on('dispose', spy3)
      .off('dispose', spy3)
      .on('dispose', spy3)

    ae.dispose();

    expect(spy1).not.to.be.called;
    expect(spy2).to.be.calledOnce;
    expect(spy3).to.be.calledOnce;
  });

  it('get listeners', () => {
    const callback1 = () => {};
    const callback2 = () => {};
    const ae = aexpr(() => {})
      .on('dispose', callback1)

    const listeners = ae.getEventListeners('dispose');

    expect(listeners).to.include(callback1);
    expect(listeners).not.to.include(callback2);

    ae.on('dispose', callback2);
    const listeners2 = ae.getEventListeners('dispose');

    expect(listeners2).to.include(callback1);
    expect(listeners2).to.include(callback2);

  });

});
