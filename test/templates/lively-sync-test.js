import Sync from '../../templates/classes/Sync.js'
import * as chai from '../../node_modules/chai/chai.js'

window.chai = chai


describe("Sync Tool", () => {
  it("should succeed", () => {
    chai.expect(true).to.be.equal(true)
  })
  
  it("should fail", () => {
    chai.expect(true).to.be.equal(false)
  })
  
  it("should succeed again", () => {
    chai.expect(true).to.be.equal(true)
  })
  
  
  
  // it("should store value", () => {
  //   var sut = new Sync()
  //   sut.storeValue("hello", "world")
  // })
})
console.log("I really did this!!!!!")
