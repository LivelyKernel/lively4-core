import Sync from '../../templates/classes/Sync.js'
import {expect} from '../../node_modules/chai/chai.js'
import {loadComponent} from './templates-fixture.js'

describe("Sync Tool",  function(){
  var that
 
    this.timeout(15000);

  
  before("load", function(done){
    loadComponent("lively-sync").then(c => {that = c; done()})
  })
  
  it("should load stored value", async () => {
    await that.storeValue("test_tmp_key", "hello");
    expect(await that.loadValue("test_tmp_key")).to.be.equal("hello");
  })
  
  
})


