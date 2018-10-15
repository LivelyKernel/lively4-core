import {expect} from 'src/external/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt,rect} from 'src/client/graphics.js';
import components from 'src/client/morphic/component-loader.js'


describe("LivelyScriptTest",  function() {

  var that;
  before("load", async function() {
    this.timeout(35000);
    var templateName = "lively-script";
    await loadComponent(templateName)
  });

  it("should load", async function() {
    
  });

  it("should exec script", async function() {
    self.thisScriptWasHere = undefined
    var root = <div></div>
    testWorld().appendChild(root)
    var source = `<lively-script><script>
        self.thisScriptWasHere = this
      </script></lively-script>`
    root.innerHTML = source
    await components.loadUnresolved(root);
    await lively.sleep(10); // ok, there is aysnc behavior here... give it a chance to run
    expect(self.thisScriptWasHere, "script not run").not.be.undefined   
  });
  
  it("should exec two scripts after each other", async function() {
    self.thisScriptWasHere = undefined
    self.testScriptExecOrder = []
    var root = <div></div>
    testWorld().appendChild(root)
    var source = `<lively-script id="a">
        self.thisScriptWasHere = this;
        self.testScriptExecOrder.push(this.id)
      </lively-script>
      <lively-script id="b">
        self.secondScriptWasHere = this
        self.testScriptExecOrder.push(this.id)
      </lively-script>`
    root.innerHTML = source
    await components.loadUnresolved(root);
    await lively.sleep(50); // ok, there is aysnc behavior here... give it a chance to run
    expect(self.thisScriptWasHere, "script not run").not.be.undefined   
    expect(self.secondScriptWasHere, "second script not run").not.be.undefined   
    expect(self.secondScriptWasHere, "first is second?").not.equal(self.thisScriptWasHere)  
    expect(self.testScriptExecOrder, "script exec order").deep.equal(["a", "b"])  
  });
   
  it("should exec in order", async function() {
    this.timeout(35000);
    self.thisScriptWasHere = undefined
    self.testScriptExecOrder = []
    var root = <div></div>
    testWorld().appendChild(root)
    var source = `
      <lively-script id="a">
        self.testScriptExecOrder.push(this.id)
      </lively-script>
      <lively-script id="b">
        self.testScriptExecOrder.push(this.id)
      </lively-script>
      <lively-script id="c">
        self.testScriptExecOrder.push(this.id)
      </lively-script>
      <lively-script id="d">
        self.testScriptExecOrder.push(this.id)
      </lively-script>
      <lively-script id="e">
        self.testScriptExecOrder.push(this.id)
      </lively-script>`
    root.innerHTML = source
    await components.loadUnresolved(root);
    await lively.sleep(150); // ok, there is aysnc behavior here... give it a chance to run
    expect(self.testScriptExecOrder, "script exec order" + JSON.stringify(self.testScriptExecOrder)).deep.equal(
      ["a", "b", "c", "d", "e"])  
  });
  
  after("cleanup", function() {
    testWorld().innerHTML = "";
  });

});
