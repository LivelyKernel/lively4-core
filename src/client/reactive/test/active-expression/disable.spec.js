"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { BaseActiveExpression } from '../../active-expression/active-expression.js';

describe('disable (Active Expressions)', () => {

  it("supported", () => {
    const ae = new BaseActiveExpression(() => {});

    expect(ae).to.respondTo('enable');
    expect(ae).to.respondTo('disable');
    expect(ae).to.respondTo('isEnabled');
    expect(ae).to.respondTo('isDisabled');
  });

  function assertEnabled(ae) {
    expect(ae.isEnabled()).to.be.true;
    expect(ae.isDisabled()).to.be.false;
  }
  function assertDisabled(ae) {
    expect(ae.isEnabled()).to.be.false;
    expect(ae.isDisabled()).to.be.true;
  }
  it('basic state management', () => {
    const ae = new BaseActiveExpression(() => {})
    assertEnabled(ae);
    
    ae.enable();
    assertEnabled(ae);

    ae.disable();
    assertDisabled(ae);

    ae.disable();
    assertDisabled(ae);

    ae.enable();
    assertEnabled(ae);

    ae.enable();
    assertEnabled(ae);
  });

  xit('starts disabled', () => {
    const ae = new BaseActiveExpression(() => {}, { disabled: true });
    assertDisabled(ae);
  });

  describe('enable/disable events', () => {
    
    let ae, enableSpy, disableSpy;
    
    beforeEach(() => {
      enableSpy = sinon.spy();
      disableSpy = sinon.spy();
      ae = new BaseActiveExpression(() => {})
        .on('enable', enableSpy)
        .on('disable', disableSpy);
    });

    it('no events fired initially', () => {
      expect(enableSpy).not.to.be.called;
      expect(disableSpy).not.to.be.called;
    });

    it('disable once', () => {
      ae.disable();
      expect(enableSpy).not.to.be.called;
      expect(disableSpy).to.be.calledOnce;     
    });

    it('disable twice', () => {
      ae.disable();
      disableSpy.reset();

      ae.disable();
      expect(enableSpy).not.to.be.called;
      expect(disableSpy).not.to.be.called;     
    });

    it('enable once after disable', () => {
      ae.disable();
      disableSpy.reset();

      ae.enable();
      expect(enableSpy).to.be.calledOnce;
      expect(disableSpy).not.to.be.called;
    });

    it('enable twice after disable', () => {
      ae.disable();
      disableSpy.reset();

      ae.enable();
      enableSpy.reset();

      ae.enable();
      expect(enableSpy).not.to.be.called;
      expect(disableSpy).not.to.be.called;
    });

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
