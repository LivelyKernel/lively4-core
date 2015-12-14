var expect = chai.expect;

describe('Async SW Test', function() {
  it('should support async', function(done) {
    setTimeout(done, 1000);
  });
});
