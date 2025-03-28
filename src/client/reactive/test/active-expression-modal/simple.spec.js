import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import aexpr from 'src/client/reactive/active-expression-modal/active-expression-modal.js';

describe('side effects', () => {
  
  // Caution: If this test fails, it may freeze the system because it can create an infinite loop
  it('invoking DataStructureHook during AE execurion should not result in infinite loop', () => {
    const items = [2, 4];
    
    const spy = sinon.spy();
    const result = aexpr()

    expect(result).to.eql(42);
  });
  
  
  
});
