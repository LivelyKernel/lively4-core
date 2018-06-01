"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import aexpr from 'aexpr-source-transformation-propagation';
import * as frameBasedAExpr from "frame-based-aexpr";
import when from 'src/client/reactive/active-expressions/when.js';

import { wait } from 'utils';

describe("when utility", function() {
  it("is defined and a function", () => {
    expect(when).to.be.ok;
    expect(when).to.be.a('function');
  });
  it("returns a promise", () => {
    expect(when(() => {})).to.be.an.instanceOf(Promise);
  });
  it("resolves when condition becomes true", async () => {
    let spy = sinon.spy();
    let condition = false;
    
    when(() => condition).then(spy);
    await wait(50);
    expect(spy).not.to.be.called;

    condition = true;
    await wait(50);
    expect(spy).to.be.calledOnce;
  });
  it("resolves instantaneously", async () => {
    await when(() => true);
  });
  it("integrates with await", async () => {
    await when(() => true);
  });
  
  it("allows for other detection strategies", async () => {
    let spy = sinon.spy();
    let referenceTime = Date.now();

    // fires in 100 milliseconds
    when(() => Date.now() >= 100 + referenceTime, { strategy: frameBasedAExpr.aexpr})
      .then(spy);

    await wait(50);
    expect(spy).not.to.be.called;

    await wait(100);
    expect(spy).to.be.calledOnce;
  });
  // #TODO: waits for .(de)activate functionality
  xit("propagates configuration to the aexpr constructor function", async () => {
    let spy = sinon.spy();

    when(() => true, { active: false }) // the internal aexpr is not active
      .then(spy);

    await wait(50);
    expect(spy).not.to.be.called;
  });
});
