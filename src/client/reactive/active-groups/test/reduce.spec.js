"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select from 'roq';
import { getValueClass } from './class-factory.js';
const AValueClass = getValueClass();

describe('.reduce operator', function() {

  it('Example for aexpr', function() {
    this.timeout(10000);
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
