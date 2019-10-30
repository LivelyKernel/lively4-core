"use rp19-jsx";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('just a test', function() {
  it('currently changes the tag to a SPAN', () => {
    const span = <div>Hello</div>;
    expect(span).to.have.property('tagName', 'SPAN');
  });
});

