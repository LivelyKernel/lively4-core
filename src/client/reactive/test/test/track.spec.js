"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select, { trackInitializeAndDestroy } from 'roq';
import { getValueClass } from './class-factory.js';
const AValueClass = getValueClass();

describe('instance tracking', function() {

  it('track initialize and destroy utility', function() {
    this.timeout(10000);

    class ValueHolder {
      constructor(val) { this.initialize(val); }
      initialize(val) {
        this.val = val
      }
      destroy() {}
    }
    
    let neverTracked = new ValueHolder(10);
    let beforeTracking = select(ValueHolder).filter(v => v.val >= 5);
    new ValueHolder(10);
    
    trackInitializeAndDestroy(ValueHolder);
    
    let afterTracking = select(ValueHolder).filter(v => v.val >= 5);
    
    let spy = sinon.spy();

    var threshold = { min: 0 },
        initialValue = 3;
    select(AValueClass).filter(data => data.value > threshold.min)
      .reduce((acc, instance) => acc + instance.value, initialValue)
      .onChange(spy);
    expect(spy).to.not.have.been.called;

    var instance1 = new AValueClass(42);
    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWithMatch(
      initialValue + instance1.value
    );

    var instance2 = new AValueClass(5);
    expect(spy).to.have.been.calledTwice;
    expect(spy).to.have.been.calledWithMatch(
      initialValue + instance1.value + instance2.value
    );

    threshold.min = 50;
    expect(spy).to.have.callCount(4);
    expect(spy.lastCall.args[0]).to.equal(initialValue);
  });
});
