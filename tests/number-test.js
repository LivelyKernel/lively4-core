/*global module, beforeEach, afterEach, describe, it*/

var Global = typeof window !== 'undefined' ? window : global;
var expect = Global.expect || require('expect.js');
var lively = Global.lively || {}; lively.lang = lively.lang || require('../index');

var num = lively.lang.num;

describe('number', function() {

  it('random', function() {
    expect(num.random(10, 20)).to.be.within(10, 20);
  });

  it('averages', function() {
    expect(num.average([1,2,3,4,20])).to.equal(6);
  });

  it('median', function() {
    expect(num.median([1,2,3,4,20])).to.equal(3);
  });

  it('sorts', function() {
    expect(num.sort([5,2,-3,20,4])).to.eql([-3,2,4,5,20]);
  });

  it('betweens', function() {
    expect(num.between(0.12, 0.1, 0.13)).to.be(true);
    expect(num.between(0.1, 0.1, 0.13)).to.be(true);
    expect(num.between(0.999, 0.1, 0.13)).to.be(false);
  });

  it('roundTo', function() {
    expect(num.roundTo(0.1111111, 0.01)).to.equal(0.11);
  });

  describe('conversion', function() {

    it('humanReadableByteSize', function() {
      expect(num.humanReadableByteSize(Math.pow(2, 10))).to.equal("1KB");
      expect(num.humanReadableByteSize(1000)).to.equal("0.98KB");
      expect(num.humanReadableByteSize(10)).to.equal("10B");
      expect(num.humanReadableByteSize(Math.pow(2, 21))).to.equal("2MB");
    });

    it('parseLength', function() {
      var eps = 0.01;
      expect(num.parseLength('2cm')).to.be.within(75.59-eps, 75.59+eps);
      expect(num.parseLength('20px', 'pt')).to.be.within(15-eps, 15+eps);
    });

    it('convertLength', function() {
      var eps = 0.01;
      expect(num.convertLength(2, 'cm', 'px')).to.be.within(75.59-eps, 75.59+eps);
      expect(num.convertLength(75.59, 'px', 'cm')).to.be.within(2-eps, 2+eps);
    });

  });

  describe('detent', function() {

    it('linearly distributes values between grid points', function() {
      expect(num.detent(0,    0.1, 0.5)).to.equal(0);
      expect(num.detent(0.08, 0.2, 0.5)).to.equal(0);
      expect(num.detent(0.1,  0.2, 0.5)).to.equal(0);
      expect(num.detent(0.11, 0.2, 0.5)).to.be.above(0);
      expect(num.detent(0.39, 0.2, 0.5)).to.be.within(0.391, 0.49);
      expect(num.detent(0.4,  0.2, 0.5)).to.equal(0.5);
      expect(num.detent(0.5,  0.2, 0.5)).to.equal(0.5);
      expect(num.detent(0.6,  0.2, 0.5)).to.equal(0.5);
      expect(num.detent(0.9,  0.2, 0.5)).to.equal(1);
    });

    it('snaps', function() {
      expect(num.detent(0,    0.1, 0.5, true)).to.equal(0);
      expect(num.detent(0.08, 0.2, 0.5, true)).to.equal(0);
      expect(num.detent(0.1,  0.2, 0.5, true)).to.equal(0.1);
      expect(num.detent(0.11, 0.2, 0.5, true)).to.equal(0.11);
      expect(num.detent(0.39, 0.2, 0.5, true)).to.equal(0.39);
    });

  });

  it('degrees -> radians', function() {
    expect(num.toRadians(180)).to.equal(Math.PI);
  });

  it('radians -> degrees', function() {
    expect(num.toDegrees(Math.PI / 2)).to.equal(90);
  });

});
