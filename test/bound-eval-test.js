import {expect} from 'src/external/chai.js'
import boundEval from 'src/client/bound-eval.js'

var targetModule = "workspace:foobar"


describe('BoundEval', function() {
  it('eval a string', async function() {
    var result = await boundEval("3 + 4", undefined, targetModule)
    expect(result.value).to.equal(7);
  });
  
  
  it('eval a string wiht context', async function() {
    var result = await boundEval("this.a + this.b", {a: 3, b: 4},targetModule)
    expect(result.value).to.equal(7);
  });

  it('parallel eval with two contexts', async function() {
    var toString = function() { return JSON.stringify()}
    var promisedResult1 = boundEval("this.a + this.b", {a: 3, b: 4, toString}, targetModule)
    var promisedResult2 = boundEval("this.a + this.b", {a: 7, b: 5, toString}, targetModule)

    var result1 = await promisedResult1
    var result2 = await promisedResult2

    expect(result1.value).to.equal(7);
    expect(result2.value).to.equal(12);

  });

  it('should handle transpilation errors properly', async function() {
    // Invalid syntax that should cause a transpilation error
    var invalidCode = "const x = { invalid syntax here @#$";
    var result = await boundEval(invalidCode, undefined, targetModule);

    // Should return an error with isError: true
    expect(result.isError).to.be.true;
    expect(result.value).to.exist;
    expect(result.value).to.be.an.instanceof(Error);
  });

  it('should handle runtime errors properly', async function() {
    // Valid syntax but runtime error
    var errorCode = "throw new Error('test runtime error')";
    var result = await boundEval(errorCode, undefined, targetModule);

    // Should return an error with isError: true
    expect(result.isError).to.be.true;
    expect(result.value).to.exist;
    expect(result.value).to.be.an.instanceof(Error);
    expect(result.value.message).to.include('test runtime error');
  });

});
