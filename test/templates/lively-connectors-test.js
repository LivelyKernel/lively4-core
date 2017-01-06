import Sync from '../../templates/lively-sync.js';
import {expect} from '../../node_modules/chai/chai.js';
import {testWorld, loadComponent} from './templates-fixture.js';

import {pt} from "src/client/graphics.js"

describe("Lively Connectors Component",  function() {

  var that;
  before("load", (done) => {
    this.timeout(35000);
    var templateName = "lively-connectors";
    loadComponent(templateName).then(c => {that = c; done()}).catch(e => done(e));

    testWorld().style.display = "block";
    testWorld().style.width = "600px"
    testWorld().style.height = "800px"
    testWorld().style.backgroundColor = "gray"
    
    lively.setPosition(testWorld(), {x: 1000, y: 350});
  });

  createNode = (name, p) => {
    var node = document.createElement("div")
    node.textContent = name
    node.id = name
    node.style = "background-color: blue; position: absolute; width: 50px; height: 50px"
    lively.setPosition(node, p)
    return node
  }
  
  it("should connect a and b", (done) => {
    var a = createNode("a", pt(100,100));
    var b = createNode("b", pt(100,200));
    var c = createNode("c", pt(200,200));
    
    that.connect(a,b)
    
    done()
  })
  
  it("should load", (done) => {
    done();
  });

  after("cleanup", () => {
    // testWorld().innerHTML = "";
  });

});
