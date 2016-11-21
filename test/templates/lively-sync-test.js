import Sync from '../../templates/lively-sync.js'
import {expect} from '../../node_modules/chai/chai.js'
import {testWorld, loadComponent} from './templates-fixture.js'

describe("Sync Tool",  function(){
  var that
 
  before("load", function(done){
    this.timeout(25000);

    loadComponent("lively-sync")
      .then(c => {that = c; done()})
      .catch(e => console.error(e))
  })
  
  it("should load stored value", async () => {
    await that.storeValue("test_tmp_key", "hello");
    expect(await that.loadValue("test_tmp_key")).to.be.equal("hello");
  })
  
  
  after("cleanup", function() {
    testWorld().innerHTML = "";
  });
})


