import {expect} from 'src/external/chai.js'
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js'
import {pt,rect} from 'src/client/graphics.js'


/*MD 

 <open://lively-testrunner>

MD*/

describe("InputComboboxTest",  function() {

  it("can have custom value", async function() {
    var combo = await (<input-combobox></input-combobox>)
    combo.value="custom fruit"
    combo.setOptions(["Apple", "Babanna", "Oranges"])
    testWorld().appendChild(combo)
    expect(combo.get("#input").value).to.equal("custom fruit")
    expect(lively.getBounds(combo).width).to.be.gt(50)
  })
  
  it("adapts to its own width", async function() {
    var combo = await (<input-combobox ></input-combobox>)
    combo.setOptions(["A", "B", "C"])
    testWorld().appendChild(combo)
    expect(lively.getBounds(combo).width).to.be.gt(10)
  })
  
  it("can have a fixed width", async function() {
    var combo = await (<input-combobox style="width:200px"></input-combobox>)
    combo.setOptions(["A", "B", "C"])
    expect(lively.getBounds(combo).width).to.equal(200)
  })
  
  it("lets it's value be set as an attribute", async function() {
    var combo = await (<input-combobox value="custom fruit"></input-combobox>)
    testWorld().appendChild(combo)
    expect(combo.get("#input").value).to.equal("custom fruit")
  })
    
//   it("dispatched change event", async function() {
//     var combo = await (<input-combobox value="custom fruit"></input-combobox>)
//     testWorld().appendChild(combo)
//     awaitEvent
//     expect(combo.get("#input").value).to.equal("custom fruit")
//   })

  
  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});
