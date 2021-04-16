"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

    
describe('side effects', () => {
  
  // Caution: If this test fails, it may freeze the system because it can create an infinite loop
  it('invoking DataStructureHook during AE execurion should not result in infinite loop', () => {
    const items = [2, 4];
    
    const spy = sinon.spy();
    const expr = aexpr(() => items.map(i => i * 2)).dataflow(spy);

    expect(spy).to.be.calledOnce;
    expect(spy.getCall(0).args[0]).to.eql([4, 8]);
  });
  
  // Caution: If this test fails, it may freeze the system because it can create an infinite loop
  it('invoking SourceCodeHook during AE execurion should not result in infinite loop', () => {
    let x;
    
    const spy = sinon.spy();
    const expr = aexpr(() => {
      x = x || 4;
      return x;
    }).dataflow(spy);

    x = 5;
    
    expect(spy).to.be.calledTwice;
    expect(spy.getCall(0).args[0]).to.equal(4);
    expect(spy.getCall(1).args[0]).to.equal(5);
  });
  
  
});
