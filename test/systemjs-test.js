
import {expect} from 'src/external/chai.js';

describe('SystemJS', () => {

  describe('resolve', () => {
    it('resolves relative urls', () => {
      expect(System.resolve("src/foo.js")).to.equal(lively4url + "/src/foo.js")
    });
    it('keeps absolute urls', () => {
      expect(System.resolve(lively4url + "/src/foo.js")).to.equal(lively4url + "/src/foo.js")
    });
    it('normalizes // in urls', () => {
      expect(System.resolve(lively4url + "//src/foo.js")).to.equal(lively4url + "/src/foo.js")
    });
    
  })
  
});