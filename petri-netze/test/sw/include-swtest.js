import { getAnswer } from './../../src/sw/test-include.js';

var expect = chai.expect;

describe('Import SW Test', function() {
  it('should import the answer', function() {
    expect(getAnswer()).to.equal(42);
  });
});
