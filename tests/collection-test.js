beforeEach(function(done) {
    done();
});

afterEach(function(done) {
  done();
});

describe('collections', function() {

  it('has forEach', function() {
    var result = '';
    arr.forEach([4,5,6], function(ea, i) {
      result += '[' + ea + ',' + i + ']'; })
    expect(result).to.equal('[4,0][5,1][6,2]')
  });

});
