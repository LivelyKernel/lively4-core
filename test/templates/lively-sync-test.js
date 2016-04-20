import Sync from '../../templates/classes/Sync.js'
import {expect} from '../../node_modules/chai/chai.js'

describe("Sync Tool",  () => {
  var that
  
  before("load", async function(){
    // this.timeout(15000);
    that = lively.components.createComponent("lively-sync");
    lively.components.loadByName("lively-sync")
    await new Promise(resolve => {
      that.addEventListener("created", function (evt) {
          evt.stopPropagation();
          resolve(evt);
      });
    })
  })
  
  it("should load stored value", async () => {
    await that.storeValue("test_tmp_key", "hello");
    expect(await that.loadValue("test_tmp_key")).to.be.equal("hello");
  })
  
  
})
