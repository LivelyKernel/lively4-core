'ae';
'use strict';

import chai, { expect } from 'src/external/chai.js';
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

  xit('silent is default mode ', () => {});

  // #TODO: maybe by generic .on function
  xit('onError callback', () => {});

  xit('explicit error handlers are called', () => {});
});

describe('Error in comparison and storage', () => {

  xit('read 0', () => {
    expect(0).to.equal(0);
  });
});

describe('Error in Callbacks', () => {

  it('errors bubble to callee', () => {
    let value = 1;
    const ae = aexpr(() => value).onChange(v => {
      throw new Error('expected');
    });

    expect(() => value++).to.throw('expected');
    expect(value).to.equal(2);

    expect(() => value++).to.throw('expected');
    expect(value).to.equal(3);
  });

  it('callbacks called until the first callback throws an error', () => {
    let value = 1;
    let beforeSpy = sinon.spy();
    let afterSpy = sinon.spy();
    const ae = aexpr(() => value).onChange(beforeSpy).onChange(() => {
      throw new Error('expected');
    }).onChange(afterSpy);

    expect(() => value++).to.throw('expected');
    expect(beforeSpy).to.have.been.calledOnce;
    expect(afterSpy).to.not.have.been.called;
    expect(value).to.equal(2);
    beforeSpy.reset();
    afterSpy.reset();

    expect(() => value++).to.throw('expected');
    expect(beforeSpy).to.have.been.calledOnce;
    expect(afterSpy).to.not.have.been.called;
    expect(value).to.equal(3);
    beforeSpy.reset();
    afterSpy.reset();
  });

  xit('callbacks called until the first callback throws an error', () => {
    let value = 1;
    const ae = aexpr(() => value).onChange(() => {
      throw new Error('expected');
    }, { error: 'silent' });
  });

  xit('callbacks called until the first callback throws an error', () => {
    let value = 1;
    let spy = sinon.spy();
    const ae = aexpr(() => value).onChange(() => {
      throw new Error('expected');
    }, { error: spy });
  });

});

describe('has callbacks', () => {

  it('no callbacks at the start, add one', () => {
    const ae = aexpr(() => {});

    expect(ae.hasCallbacks()).to.be.false;
    ae.onChange(() => {});
    expect(ae.hasCallbacks()).to.be.true;
  });

  it('one callback in the start, remove that one', () => {
    const callback = () => {};
    const ae = aexpr(() => {}).onChange(callback);

    expect(ae.hasCallbacks()).to.be.true;
    ae.offChange(callback);
    expect(ae.hasCallbacks()).to.be.false;
  });

});

describe('Errors in Non-onChange Callbacks', () => {

  // #TODO: should this be visible?
  xit('error in on("dispose")', () => {
    const ae = aexpr(() => {}).on('dispose', () => {
      throw new Error('expected');
    });
  });

});
