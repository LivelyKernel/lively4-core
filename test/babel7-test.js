import {babel, babel7} from "src/external/babel/plugin-babel7.js"
import * as pluginBabel7 from "src/external/babel/plugin-babel7.js"


import {expect} from 'src/external/chai.js'


describe('Babel7', function() {
  var bar = 3;
  
  it('babel to be exported', async (done) => {
    expect(babel).to.be.undefined;
    done()
  });
  
  it('compute 3+4', async (done) => {
    var result = await pluginBabel7.transformSource({
        load: `3+4`,
      }, {
        livelyworkspace: true,
      }, {
        filename: "nofile.js"
      })
    console.log(result)
    // expect(eval(result.code)).to.equal("x");
    done()
  });
  
});