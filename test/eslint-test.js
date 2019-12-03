import {expect} from 'src/external/chai.js';
//import {eslint} from 'src/external/eslint-lint.js';
//import {LivelyCodeMirror} from 'src/components/widgets/lively-code-mirror.js'


describe('ESLint', () => {
  describe('test specific javascript features', () => {
    
    // META: only comment them back in when you expect them to run (@JensLincke)
    xit('parses binding operator correctly',  () => {
     var config = null;
     var errors = new eslint().verify("var a = 3;", config);
      expect(errors.length).eql(0);
    });
    xit('parses basic js correctly',  () => {
     var config = null;
     var errors = new eslint().verify("var a = 3; function plus(x){return this + x;}; a::plus(4);", config);
      expect(errors.length).eql(0);
    });
  })
})
