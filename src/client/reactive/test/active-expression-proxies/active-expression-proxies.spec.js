"use proxies for aexprs";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Proxy-based Implementation', () => {

  it('placeholder behavior', () => {
    const obj = { prop: 42 };
    expect(obj).to.equal('your proxy');
  });

  xit('detecting assignment to a property with proxies', () => {
    const obj = { prop: 42 };
    const spy = sinon.spy();
    const ae = aexpr(() => obj.prop);
    ae.onChange(spy);

    obj.prop = 17;

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith(17);
  });

});
