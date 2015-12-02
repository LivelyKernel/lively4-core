var expect = chai.expect;

describe('SIMPLE TEST', function() {
  it('SHOULD WORK', function() {
    expect(8).to.equal(2 ** 3);
  });

  it('SHOULD NOT WORK', function() {
    expect(42).to.equal(9 * 6)
  })
});
