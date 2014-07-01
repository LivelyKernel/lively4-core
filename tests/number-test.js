/*global jsext, beforeEach, afterEach, describe, it, expect*/

var num = jsext.num;
var eps = 0.01;

describe('number', function() {

  it('convertLength', function() {
    expect(num.convertLength(2, 'cm', 'px')).to.be.within(75.59-eps, 75.59+eps);
    expect(num.convertLength(75.59, 'px', 'cm')).to.be.within(2-eps, 2+eps);
  });

  it('parseLength', function() {
    expect(num.parseLength('2cm')).to.be.within(75.59-eps, 75.59+eps);
    expect(num.parseLength('20px', 'pt')).to.be.within(15-eps, 15+eps);
  });

});
