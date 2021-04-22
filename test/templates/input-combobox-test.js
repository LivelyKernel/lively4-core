import {expect} from 'src/external/chai.js'
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js'
import {pt,rect} from 'src/client/graphics.js'

describe("InputComboboxTest",  function() {

  it("custom value", async function() {
    var combo = await (<input-combobox></input-combobox>)
    combo.value="custom fruit"
    combo.setOptions(["Apple", "Babanna", "Oranges"])
    
    expect(combo.get("#input").value).to.equal("custom fruit")
  })
  
  it("And it adapts to its own width...", async function() {
    var combo = await (<input-combobox></input-combobox>)
    combo.setOptions(["A", "B", "C"])
  })
  
  it("And a fixed width!", async function() {
    var combo = await (<input-combobox style="width:200px"></input-combobox>)
    combo.setOptions(["A", "B", "C"])
  })  
});
