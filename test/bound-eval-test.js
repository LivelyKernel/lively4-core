import {expect} from 'src/external/chai.js'
import boundEval from 'src/client/bound-eval.js'


describe('BoundEval', function() {
  it('eval a string', async function() {
    var result = await boundEval("3 + 4")
    expect(result.value).to.equal(7);
  });
  
  
  it('eval a string wiht context', async function() {
    var result = await boundEval("this.a + this.b", {a: 3, b: 4})
    expect(result.value).to.equal(7);
  });

  it('parallel eval with two contexts', async function() {
    var promisedResult1 = boundEval("this.a + this.b", {a: 3, b: 4})
    var promisedResult2 = boundEval("this.a + this.b", {a: 7, b: 5})
    
    var result1 = await promisedResult1
    var result2 = await promisedResult2
    
    expect(result1.value).to.equal(7);
    expect(result2.value).to.equal(12);

  });

});
