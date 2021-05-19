"ae";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('expression analysis mode-related stuff', () => {

  it("set local while in expression analysis", () => {
    let x = 3;
    const decrease = y => {
      y = y - 1;
      return y;
    }

    debugger
    const ae = aexpr(() => {
      let y = x;
      decrease(y);
      return y > 3;
    });

    let spy = sinon.spy();
    ae.onChange(spy);

    x = 33;

    expect(spy).to.be.calledOnce;
  });

  it("get local in variable declaration", () => {
    let x = 3;
    const ae = aexpr(() => {
      let y = x;
      return y > 3;
    });

    let spy = sinon.spy();
    ae.onChange(spy);

    x = 33;

    expect(spy).to.be.calledOnce;
  });

});
