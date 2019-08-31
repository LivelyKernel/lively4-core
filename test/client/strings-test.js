import {expect} from 'src/external/chai.js';
import Strings from 'src/client/strings.js';


describe('strings', () => {

  describe('toUpperCaseFirst', () => {
    it('convert first letter to uppercase', () => {
      expect(Strings.toUpperCaseFirst("topLeft")).to.equal("TopLeft");
    });
  })
  
  describe('toCamelCase', () => {
    it('convert string to camelcase', () => {
      expect(Strings.toCamelCase("lively-bla", "-")).to.equal("livelyBla");
    });
    it('convert string to camelcase with three words', () => {
      expect(Strings.toCamelCase("foo bar bla")).to.equal("fooBarBla");
    });
  })

  describe('prefixSelector', () => {
    it('prefix a selector', () => {
      expect(Strings.prefixSelector("with", "topLeft")).to.equal("withTopLeft");
    });
  })
  
  describe('matchAll', () => {
    it('match a regex', () => {
      expect(Strings.matchAll(/a[0-9]/, "a1 b1 a2 b2 c2 a")[0][0]).to.equal("a1");
    });
  })
  
  describe('matchAllDo', () => {
    it("matches", () => {
      var result = []
      Strings.matchAllDo(/(a.)/g, "babcacafae", (x) => {
        result.push(x)
      })
      expect(result).to.deep.equals(["ab","ac","af","ae"])
    })
  })
  
});