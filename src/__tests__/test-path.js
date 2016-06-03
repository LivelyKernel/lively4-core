jest.autoMockOff();
jest.unmock('../path.js');

const path = require('../path.js');

describe('join', () => {
  it('joins "d" and "s" to equal "d/s"', () => {
    expect(path.join("d", "s")).toBe("d/s");
  });
  it('joins "d" and "/s" to equal "d/s"', () => {
    expect(path.join("d", "/s")).toBe("/s");
  });
  it('joins "d" and "/s" to equal "d/s"', () => {
    expect(path.join("/d", "s")).toBe("/d/s");
  });
});


describe('normalize', () => {
	it('normalizes "/a/../b/" to equal "/b"', () => {
    	expect(path.normalize("/a/../b/")).toBe("/b");
	});
	it('normalizes "/a//./b" to equal "/a/b"', () => {
    	expect(path.normalize("/a//./b")).toBe("/a/b");
	});
	it('normalizes "/a/../b/c/d/../f/../../g" to equal "/b/g"', () => {
    	expect(path.normalize("/a/../b/c/d/../f/../../g")).toBe("/b/g");
	});
});