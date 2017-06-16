import {expect} from '../node_modules/chai/chai.js';
import Strings from 'src/client/strings.js';


describe('strings', () => {

  describe('toUpperCaseFirst', () => {
    it('convert first letter to uppercase', () => {
      expect(Strings.toUpperCaseFirst("topLeft")).to.equal("TopLeft");
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
});