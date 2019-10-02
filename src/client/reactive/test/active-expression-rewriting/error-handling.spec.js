'enable aexpr';
'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Error in Expression analysis', () => {

  it('throwing an error does not update ', () => {
    let value = 17;
    let throwError = false;

    const spy = sinon.spy();
    const ae = aexpr(() => {
      if (throwError) {
        throw new Error('wups');
      } else {
        return value;
      }
    }).onChange(spy);

    throwError = true;

    expect(spy).not.to.have.been.called;
  });

  it('initial error does not propagate', () => {
    aexpr(() => {
      throw new Error('wups');
    });
  });

  xit('silent is default mode ', () => {
  });

  // #TODO: maybe by generic .on function
  xit('onError callback', () => {
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
