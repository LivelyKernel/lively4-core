"enable aexpr";

import chai, {expect} from 'node_modules/chai/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'node_modules/sinon-chai/lib/sinon-chai.js';
chai.use(sinonChai);

import withLogging from '../src/withlogging.js';
import select from '../src/select.js';

describe("Enter, Exit", () => {
  class Value {
    constructor(val) {
      this.initialize(val);
    }
    initialize(val) {
      this.val = val;
    }
  }
  
  it("fine-graned events", () => {
    withLogging.call(Value);
    const enterSpy = sinon.spy();
    const exitSpy = sinon.spy();
    
    select(Value, v => v.val > 5)
      .enter(enterSpy)
      .exit(exitSpy);

    let v = new Value(6);
    expect(enterSpy).to.have.been.calledOnce;
    expect(enterSpy).to.have.been.calledWithMatch(v);
    enterSpy.reset();
    expect(exitSpy).to.not.have.been.called;

    v.val = 4;
    expect(enterSpy).to.not.have.been.called;
    expect(exitSpy).to.have.been.calledOnce;
    expect(exitSpy).to.have.been.calledWithMatch(v);
    exitSpy.reset();

    let v2 = new Value(0);
    expect(enterSpy).to.not.have.been.called;
    expect(exitSpy).to.not.have.been.called;
    
    v2.val = 100;
    expect(enterSpy).to.have.been.calledOnce;
    expect(enterSpy).to.have.been.calledWithMatch(v2);
    expect(exitSpy).to.not.have.been.called;
  });
});
