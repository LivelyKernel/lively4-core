var expect = chai.expect;

describe('Async SW Test', function() {
  it('should transpile', function() {
    expect(8).to.equal(2 ** 3);
  });

  it('should fail to calculate the answer', function() {
    function failing() {
      expect(42).to.equal(9 * 6);
    }
    expect(failing).to.throw(Error, /expected 42 to equal 54/);
  })
});
