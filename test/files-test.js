
import {expect} from 'src/external/chai.js';

describe('Files', () => {

  describe('isURL', () => {
    it('match absolute urls', () => {
      expect(lively.files.isURL("http://foo/bar.html")).to.be.true()
    });
    it('should not match relative urls', () => {
      expect(lively.files.isURL("bar.html")).to.be.false()
      expect(lively.files.isURL("./bar.html")).to.be.false()
      expect(lively.files.isURL("../bar.html")).to.be.false()
    });

    it('should not match absolute paths', () => {
      expect(lively.files.isURL("/bar.html")).to.be.false()
    });

  })

  describe('resolve', () => {
    it('resolve absolute url', () => {
      var url = "http://foo/bar.html"
      expect(lively.files.resolve(url)).to.be.equal(url)
    });
    it('resolve relative url', () => {
      expect(lively.files.resolve("bar.html")).to.match(lively.location.host)
    });    
  })
  
});