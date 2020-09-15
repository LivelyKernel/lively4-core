"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('location meta info', function() {

  it('exists for simple aexprs', () => {
    const ae = aexpr(()=>5);
    expect(ae.meta().has('location')).to.equal(true);
  });
  
  it('works with already given object expression', () => {
    const expectedParams = [2];
    const ae = aexpr(x => x, {params : expectedParams});
    expect(ae.getCurrentValue()).to.equal(expectedParams[0]);
    expect(ae.meta().has('location')).to.equal(true);
    expect(ae.params).to.equal(expectedParams);
  });
  
  it('works with already given other expressions', () => {
    const expectedParams = [2];
    function getExpectedParams() {
      return {params : expectedParams};
    }
    const ae = aexpr(x => x, getExpectedParams());
    expect(ae.getCurrentValue()).to.equal(expectedParams[0]);
    expect(ae.meta().has('location')).to.equal(true);
    expect(ae.params).to.equal(expectedParams);
  });
  
  it('does not break aexprs with spread elements as additional params', () => {
    const expectedParams = [2];
    const arr = [{params : expectedParams}];
    const ae = aexpr(x => x, ...arr);
    expect(ae.params).to.equal(expectedParams);
  });
  
  it('does not break aexprs with spread elements', () => {
    const expectedParams = [2];
    const arr = [x => x, {params : expectedParams}];
    const ae = aexpr(...arr);
    expect(ae.params).to.equal(expectedParams);
  });
  
});
