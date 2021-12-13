"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import {RewritingActiveExpression} from 'active-expression-rewriting';

describe('signal', function() {

  it('basic signal syntax', () => {
    let z = 3;
    signal: let x = z * z;
    expect(x).to.equal(9);
    z++;
    expect(x).to.equal(16);
  });

  it('is glitch free - DFS Counterexample', () => {
    let a = 0;  
    always: let b = a + 1;
    always: let c = a + 1;
    always: let d = b + c;
    
    const spy = sinon.spy();
    aexpr(() => d).onChange(spy);
    a = 42;
    
    expect(spy).to.be.calledOnce;
  });

  it('is glitch free - BFS Counterexample', () => {
    let a = 0;  
    always: let b1 = a + 1;
    always: let b2 = b1 + 1;
    always: let b3 = b2 + 1;
    always: let c = a + 1;
    always: let d = b3 + c;
    
    const spy = sinon.spy();
    aexpr(() => d).onChange(spy);
    a = 42;
    
    expect(spy).to.be.calledOnce;
  });

});
