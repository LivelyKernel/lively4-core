"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Proxy-based Implementation', () => {

  it('set and read a property', () => {
    const expr = aexpr(() => {});

    expect(expr.meta().get('info')).to.be.undefined;

    const expectedName = 'my test AExpr';
    expr.meta({ info: expectedName });

    expect(expr.meta().get('info')).to.equal(expectedName);
  });

  it('detecting assignment to a property', () => {
    const obj = { prop2: 42 };
    const spy = sinon.spy();
    const ae = aexpr(() => obj.prop2);
    ae.onChange(spy);

    obj.prop2 = 17;

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith(17);
  });

});
