import Sync from '../../templates/classes/Sync.js'
import {expect} from '../../node_modules/chai/chai.js'
import {loadComponent} from './templates-fixture.js'

// System.import(lively4url + '/node_modules/chai/chai.js').then( m => window.expect = m.expect)

describe("Container Tool",  () => {
  var that
  before("load", (done) => {
    loadComponent("lively-container").then(c => {that = c; done()})
  })

  it("should setPath an url", async () => {
    var url = "https://lively4/sys/mounts"
    await that.setPath(url);
    
    expect("" +await that.getURL()).to.be.equal(url);

    expect(that.shadowRoot.querySelector("#container-content").textContent).match(/\"path\": \"\/\"/) 
  })
})
