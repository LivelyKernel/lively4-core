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
});