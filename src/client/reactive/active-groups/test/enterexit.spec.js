"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select, { trackInstance } from 'roq';

describe("Enter, Exit", () => {
  class Value {
    constructor(val) {
      this.val = val;
      trackInstance.call(Value, this);
    }
  }
  
  it("fine-graned events", () => {
    const enterSpy = sinon.spy();
    const exitSpy = sinon.spy();
    
    select(Value).filter(v => v.val > 5)
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
