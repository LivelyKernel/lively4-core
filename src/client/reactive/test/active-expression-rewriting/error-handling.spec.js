'enable aexpr';
'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Error in Expression analysis', () => {

  xit('throwing an error does not update ', () => {
    let value = 17
    const spy = sinon.spy();
    const ae = aexpr(() => {
      return value;
    }).onChange(spy)

    value = 42;

    expect(spy).to.have.been.calledOnce;
  });

  xit('silent is default mode ', () => {
  });

  xit('explicit error handlers are called', () => {
  });

});
describe('Error in storage routine', () => {

  it('read 0', () => {
    expect(0).to.equal(0);
  });

});
describe('Error in callbacks', () => {

  it('read 0', () => {
    expect(0).to.equal(0);
  });

});
