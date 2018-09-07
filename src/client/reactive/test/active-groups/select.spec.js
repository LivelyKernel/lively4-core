"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select, { trackInstance, untrackInstance } from 'roq';
import { getValueClass } from './class-factory.js';
const AValueClass = getValueClass();

describe("select(Class)", () => {
  class Value {
    constructor(val) {
      this.val = val;
      trackInstance.call(Value, this);
    }
    destroy() {
      untrackInstance.call(Value, this);
    }
  }
  
  it("should update the base view", () => {
    let sel = select(Value);
    expect(sel.now()).to.have.length(0);
    let v = new Value(6);
    expect(sel.now()).to.have.length(1);
    new Value(6);
    expect(sel.now()).to.have.length(2);
    v.destroy();
    expect(sel.now()).to.have.length(1);
  });
});
