import * as pluginBabel7 from "src/external/babel/plugin-babel7.js"

var babel7 =  window.lively4babel
var babel =  babel7.babel


import {expect} from 'src/external/chai.js'


describe('Babel7', function() {
  xit('compute 3+4', async (done) => {
    var result = await pluginBabel7.transformSource({
        load: `3+4`,
      }, {
        livelyworkspace: true,
      }, {
        filename: "nofile.js"
      })
    console.log(result)
    expect(eval(result.code)).to.equal("x");
    done()
  });
  
});