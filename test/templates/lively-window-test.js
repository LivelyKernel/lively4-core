import { expect } from 'src/external/chai.js'
import { testWorld, loadComponent } from './templates-fixture.js'

describe("Window Component", function() {

  var that
  beforeEach(async () => {
    this.timeout(35000)
    that = await loadComponent("lively-window")
  })

  it("should load", async () => {
    
  })

  describe("fixed", async () => {

    describe("set isFixed", () => {
      it("property is boolean", () => {
        that.isFixed = true
        expect(that.isFixed).to.equal(true)
        expect(that.style.position, "style position").to.equal("fixed")
      })
    })
    
    describe("toggleFixed", () => {
      it("toggles", () => {
        expect(that.isFixed).to.equal(false)
        that.toggleFixed()
        expect(that.isFixed).to.equal(true)
        that.toggleFixed()
        expect(that.isFixed).to.equal(false)
      })
    })
  })

  after("cleanup", () => {
    testWorld().innerHTML = ""
  })

})
