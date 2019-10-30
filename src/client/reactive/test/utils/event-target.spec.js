
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import EventTarget from '../../utils/event-target.js';

describe('EventTarget', () => {

    it('support the EventTarget interface', () => {
      const target = new EventTarget();
      expect(target).to.respondTo('addEventListener');
      expect(target).to.respondTo('removeEventListener');
      expect(target).to.respondTo('dispatchEvent'); // #TODO: we do not fully conform with the EventTarget interface, but thats okay
      expect(target).to.respondTo('getEventListeners');
    });

    it('calls registered listeners', () => {
      const target = new EventTarget();
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();

      target.addEventListener('key', spy1);
      target.dispatchEvent('key');
      expect(spy1).to.have.been.calledOnce;
      expect(spy2).not.to.be.called;
      spy1.reset();

      target.addEventListener('key', spy2);
      target.dispatchEvent('key');
      expect(spy1).to.have.been.calledOnce;
      expect(spy2).to.have.been.calledOnce;
      expect(spy1).to.be.calledBefore(spy2);
      spy1.reset();
      spy2.reset();

      target.removeEventListener('key', spy1);
      target.dispatchEvent('key');
      expect(spy1).not.to.be.called;
      expect(spy2).to.have.been.calledOnce;
      spy1.reset();
      spy2.reset();
    });

    it('applies the given parameters', () => {
      const target = new EventTarget();
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();

      target.addEventListener('key', spy1);
      target.addEventListener('key', spy2);
      const param1 = 42;
      const param2 = 17;
      target.dispatchEvent('key', param1, param2);
      expect(spy1).to.have.been.calledOnce;
      expect(spy1).to.have.been.calledWith(param1, param2);
      expect(spy2).to.have.been.calledOnce;
      expect(spy2).to.have.been.calledWith(param1, param2);
    });

    it('get all listeners', () => {
      const target = new EventTarget();
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();
      const spy3 = sinon.spy();

      target.addEventListener('key', spy1);
      target.addEventListener('key', spy2);
      
      const listeners = target.getEventListeners('key');
      expect(listeners).to.include(spy1)
      expect(listeners).to.include(spy2)
      expect(listeners).not.to.include(spy3);
    });

});


