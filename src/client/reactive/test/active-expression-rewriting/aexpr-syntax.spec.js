"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import {RewritingActiveExpression} from 'active-expression-rewriting';

describe('ae(expr) shorthand', function() {

  it('rewriting exports its AExpr class', () => {
    expect(RewritingActiveExpression).to.be.ok;
  });

  it('transforms into an aexpr', () => {
    const e = ae(42);
    expect(e).to.be.an.instanceof(RewritingActiveExpression);
  });

  it('returns a constant', () => {
    const e = ae(42);
    expect(e.getCurrentValue()).to.equal(42);
  });

  it('returns a constant', () => {
    let x = 1;
    const spy = sinon.spy();
    
    ae(x).onChange(spy);
    expect(spy).not.to.be.called;
    
    x++;
    expect(spy).to.be.calledOnce;
  });

});
