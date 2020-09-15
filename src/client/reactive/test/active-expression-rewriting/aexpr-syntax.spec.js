"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import {RewritingActiveExpression} from 'active-expression-rewriting';

aexpr(()=>{});

let moduleScopedVariable = 1;

describe('expression only (simple case)', function() {
  it('rewriting exports its AExpr class', () => {
    expect(RewritingActiveExpression).to.be.ok;
  });
  it('transforms into an aexpr', () => {
    const expr = ~[42];
    expect(expr).to.be.an.instanceof(RewritingActiveExpression);
  });
});

describe('ae(expr) shorthand', function() {
  xit('transforms into an aexpr', () => {
    const e = ae(42);
    expect(e).to.be.an.instanceof(RewritingActiveExpression);
  });
});
