"enable aexpr";

import chai, {expect} from 'node_modules/chai/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'node_modules/sinon-chai/lib/sinon-chai.js';
chai.use(sinonChai);

import withLogging from '../src/withlogging.js';
import select from '../src/select.js';

describe("simple select", () => {
  class Value {
    constructor(val) {
      this.initialize(val);
    }
    initialize(val) {
      this.val = val;
    }
  }
  
  it("should use aexprs to track changes", () => {
    withLogging.call(Value);
    
    let sel = select(Value, v => v.val > 5);
    expect(sel.now()).to.have.length(0);
    let v = new Value(6);
    expect(sel.now()).to.have.length(1);
    v.val = 4;
    expect(sel.now()).to.have.length(0);
  });
});
