"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';



export default class LivelyPetrinet extends Morph {

  async initialize() {
    this.windowTitle = "LivelyPetrinet";
    this.registerButtons();
    this.testVariable = 1;
    this.nodes = [];

    lively.html.registerKeys(this); // automatically installs handler for some methods

    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt))
    // #Note 1
    // ``lively.addEventListener`` automatically registers the listener
    // so that the the handler can be deactivated using:
    // ``lively.removeEventListener("template", this)``
    // #Note 1
    // registering a closure instead of the function allows the class to make 
    // use of a dispatch at runtime. That means the ``onDblClick`` method can be
    // replaced during development

    // this.get("#textField").value = this.testVariable;
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);

  }
  
    async livelyExample() {
      var a = await (<lively-petrinet-node></lively-petrinet-node>)
      lively.setExtent(a, pt(100,100))
      lively.setPosition(a, pt(100,100))

      var b = document.createElement("div")
      b.style.backgroundColor = "blue"
      b.textContent = "b"
      lively.setExtent(b, pt(100,100))
      lively.setPosition(b, pt(300,100))

      const connector = await (<lively-connector></lively-connector>);

      //this.appendChild(a)
      //this.appendChild(connector)
      //this.appendChild(b)

      //connector.connect(a, b) 
  }


  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }

  // this method is automatically registered as handler through ``registerButtons``
  onPlusButton() {
    this.testVariable += 1;
    this.get("#textField").value =  this.testVariable
  }

  onMinusButton() {
    this.testVariable -= 1;
    this.get("#textField").value =  this.testVariable
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value)
  }

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();

        var menu = new ContextMenu(this, [
              ["add node", () => this.addNode()],
              ["add pane", () => this.addPane()],
              ["add connector", () => this.addConnector()]
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }
  }
  
  
  async addNode() {
      var node = await (<lively-petrinet-node></lively-petrinet-node>);
      lively.setExtent(node, pt(100, 100));
      lively.setPosition(node, pt(100, 100));
      this.nodes.push(node);
      this.appendChild(node);
  }
  
  async addPane() {
    var pane = await (<lively-petrinet-pane></lively-petrinet-pane>);
    this.appendChild(pane);
  }
  
  async addConnector() {
    var connector = await(<lively-connector></lively-connector>);
    connector.connect(this.nodes[0], this.nodes[1]);
    this.appendChild(connector);
    
  }
  
  
//  onDblClick() {
//    this.animate([
//     {backgroundColor: "lightgray"},
//     {backgroundColor: "red"},
//      {backgroundColor: "lightgray"},
//    ], {
//      duration: 1000
//    })
//  }


}