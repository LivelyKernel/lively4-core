// #Clipboard #Test

import {expect} from 'src/external/chai.js';
import {parseQuery} from 'src/client/domain-code.js';

describe('Domain Code', () => {

  describe('query', () => {
    it('parses an empty query', () => {
      expect(parseQuery('()')).to.eql({parensType: '(', children: []})
    });
    
    it('parses a number', () => {
      expect(parseQuery('43')).to.eql({content: '43'})
    });
    
    it('parses a number in a form', () => {
      expect(parseQuery('(43)')).to.eql({parensType: '(', children: [{content: '43'}]})
    });
    
    it('parses two children in a form', () => {
      expect(parseQuery('(43 42)')).to.eql({parensType: '(', children: [{content: '43'}, {content: '42'}]})
    });
    
    it('parses a nested form', () => {
      expect(parseQuery('(32 (43) @ab)')).to.eql({
        parensType: '(', children: [
          {content: '32'},
          {parensType: '(', children: [{content: '43'}]},
          {content: '@ab'},
        ]})
    });
    
    xit('parses let query', () => {
      expect(parseQuery('(lexical_declaration ["let" "const"] @myKind) @root')).to.eql({
        parensType: '(', children: [
          {content: '32'},
          {parensType: '(', children: [{content: '43'}]},
          {content: '@ab'},
        ]})
    });
  });
  
});