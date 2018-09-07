"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select, { trackInstance } from 'roq';

describe("simple select", () => {
  class Value {
    constructor(val) {
      this.val = val;
      trackInstance.call(Value, this);
    }
  }
  
  it("should use aexprs to track changes", () => {
    let sel = select(Value).filter(v => v.val > 5);
    expect(sel.now()).to.have.length(0);
    let v = new Value(6);
    expect(sel.now()).to.have.length(1);
    v.val = 4;
    expect(sel.now()).to.have.length(0);
  });
});
