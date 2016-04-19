import Sync from '../../templates/classes/Sync.js'
import {expect} from '../../node_modules/chai/chai.js'

// window.chai = chai
debugger
describe("Sync Tool", () => {
  it("should load stored value", async () => {
    var that = document.createElement("lively-sync");

    await that.storeValue("_test_tmp_key", "hello");
  
    expect(await that.loadValue("_test_tmp_key")).to.be.equal("hello");

  })
})
