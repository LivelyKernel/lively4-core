'cc';
'pi'
"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { PIScheme } from 'polymorphic-identifiers';

describe("PI", function() {
  
  it("detects accesses", () => {
    class fourtyTwo extends PIScheme {
      read() {
        return 42;
      }
    }

    expect(fourtyTwo``).to.equal(42)
    
  });

});
