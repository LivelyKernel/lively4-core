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

  it('starts disabled', () => {
    const ae = new BaseActiveExpression(() => {}, { disabled: true });
    assertDisabled(ae);
  });

  describe('enable/disable events', () => {
    
    let ae, enableSpy, disableSpy;
    
    const fixture = ((options) => {
      enableSpy = sinon.spy();
      disableSpy = sinon.spy();
      ae = new BaseActiveExpression(() => {}, options)
        .on('enable', enableSpy)
        .on('disable', disableSpy);
    });

    it('no events fired initially', () => {
      fixture();
      expect(enableSpy).not.to.be.called;
      expect(disableSpy).not.to.be.called;
    });

    it('disable once', () => {
      fixture();
      ae.disable();
      expect(enableSpy).not.to.be.called;
      expect(disableSpy).to.be.calledOnce;     
    });

    it('disable twice', () => {
      fixture();
      ae.disable();
      disableSpy.reset();

      ae.disable();
      expect(enableSpy).not.to.be.called;
      expect(disableSpy).not.to.be.called;     
    });

    it('enable once after disable', () => {
      fixture();
      ae.disable();
      disableSpy.reset();

      ae.enable();
      expect(enableSpy).to.be.calledOnce;
      expect(disableSpy).not.to.be.called;
    });

    it('enable twice after disable', () => {
      fixture();
      ae.disable();
      disableSpy.reset();

      ae.enable();
      enableSpy.reset();

      ae.enable();
      expect(enableSpy).not.to.be.called;
      expect(disableSpy).not.to.be.called;
    });

    it('(start disabled) no events fired initially', () => {
      fixture({ disabled: true });
      expect(enableSpy).not.to.be.called;
      expect(disableSpy).not.to.be.called;
    });

    it('(start disabled) disable once', () => {
      fixture({ disabled: true });
      ae.disable();
      expect(enableSpy).not.to.be.called;
      expect(disableSpy).not.to.be.called;     
    });

    it('(start disabled) enable once', () => {
      fixture({ disabled: true });

      ae.enable();
      expect(enableSpy).to.be.calledOnce;
      expect(disableSpy).not.to.be.called;
    });

    it('(start disabled) enable twice after disable', () => {
      fixture({ disabled: true });

      ae.enable();
      enableSpy.reset();

      ae.enable();
      expect(enableSpy).not.to.be.called;
      expect(disableSpy).not.to.be.called;
    });

  });

  describe('obey _isEnabled', () => {
    
    let ae, enableSpy, disableSpy;
    
    const fixture = ((options) => {
      enableSpy = sinon.spy();
      disableSpy = sinon.spy();
      ae = new BaseActiveExpression(() => {}, options)
        .on('enable', enableSpy)
        .on('disable', disableSpy);
    });

    it('.checkAndNotify while disabled', () => {
      var x = 42;
      const spy = sinon.spy();
      let ae = new BaseActiveExpression(() => x).onChange(spy)
      
      ae.disable();
      
      x = 17;
      ae.checkAndNotify();

      expect(spy).not.to.be.called;
    });

    it('.checkAndNotify while enabled', () => {
      var x = 42;
      const spy = sinon.spy();
      let ae = new BaseActiveExpression(() => x, { disabled: true }).onChange(spy)
      
      ae.enable();
      
      x = 17;
      ae.checkAndNotify();

      expect(spy).to.be.calledOnce;
    });

    it('check via .enable', () => {
      var x = 42;
      const spy = sinon.spy();
      let ae = new BaseActiveExpression(() => x, { disabled: true }).onChange(spy)
      
      x = 17;
      ae.enable();

      expect(spy).to.be.calledOnce;
    });

    it('not check via .enable', () => {
      var x = 1;
      const spy = sinon.spy();
      let ae = new BaseActiveExpression(() => x, { disabled: true }).onChange(spy)
      
      x = 2;
      ae.enable({ check: false });
      expect(spy).not.to.be.called;

      x = 3;
      ae.checkAndNotify();
      expect(spy).to.be.calledOnce;
      // #TODO: x = 2; should be the last value
      expect(spy.firstCall.args[1].lastValue).to.equal(2)
    });

    xit('.dataflow while disabled', () => {
      const ae = new BaseActiveExpression(() => 17, { disabled: true });
      
      const spy = sinon.spy();
      ae.dataflow(spy);

      // #TODO: what is the intended semantics here
      expect(spy).not.to.be.called;
    });

    it('.setExpression while disabled', () => {
      const spy = sinon.spy();
      let ae = new BaseActiveExpression(() => 1, { disabled: true }).onChange(spy)

      ae.setExpression(() => 2);
      expect(spy).not.to.be.called;

      ae.enable();
      expect(spy).to.be.calledOnce;
      expect(spy.firstCall.args[1].lastValue).to.equal(1)
    });

  });

});
