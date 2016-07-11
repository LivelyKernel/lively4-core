import Sync from '../../templates/classes/Sync.js'
import {expect} from '../../node_modules/chai/chai.js'
import {loadComponent} from './templates-fixture.js'

// System.import(lively4url + '/node_modules/chai/chai.js').then( m => window.expect = m.expect)

describe("Container Tool",  function() {

  var that
  before("load", function(done){
    this.timeout(35000);
    loadComponent("lively-container").then(c => {that = c; done()})
  })

  xit("should setPath an url", function(done) {
    var expectedUrl = "https://lively4/sys/mounts"

    that.setPath(expectedUrl)
      .then(() => that.getURL())
      .then(url => {
        expect("" + url).to.be.equal(expectedUrl);
        expect(that.shadowRoot.querySelector("#container-content").textContent).match(/\"path\": \"\/\"/)
      })
      .then(done)
  })
})
