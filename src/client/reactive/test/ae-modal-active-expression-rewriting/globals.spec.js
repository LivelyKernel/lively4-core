"ae";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

let moduleScopedVariable = 1;

describe('globals', function() {

  let temp;

  beforeEach(() => {
    temp = self.DataView;
  });

  it('detects changes to a global', () => {
    const spy = sinon.spy();
    aexpr(() => DataView).onChange(spy);

    DataView = 42;

    expect(spy).to.be.calledOnce;
    expect(spy.getCall(0).args[0]).to.equal(42);
  });

  afterEach(() => {
    self.DataView = temp;
  });

});
