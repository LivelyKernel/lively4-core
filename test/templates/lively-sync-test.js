import Sync from '../../templates/classes/Sync.js'
import * as chai from '../../node_modules/chai/chai.js'
import mocha from '../../node_modules/mocha/mocha.js'


describe("Sync Tool", () => {
  it("should nothing", () => {
    chai.expect(true).to.be(true)
  })

  it("should store value", () => {
    var sut = new Sync()
    sut.storeValue("hello", "world")
  })
})




console.log("chai: " + chai)