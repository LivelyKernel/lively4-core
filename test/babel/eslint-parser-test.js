import * as eslintParser from "src/external/eslint/eslint-parser.js"

var babel7 =  window.lively4babel
var babel =  babel7.babel

import {expect} from 'src/external/chai.js'

describe('ESLint', function() {
  it('produces AST', async () => {
    var result = await eslintParser.parseForESLint(`3 + 4`)      
    expect(result.ast).to.not.be.undefined;
  });
  
});