"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Connection from "src/components/halo/Connection.js";

export default class LivelyConnectionEditor extends Morph {
  async initialize() {
    this.windowTitle = "LivelyConnectionEditor";
    this.registerButtons()
    
    // #Note 1
    // ``lively.addEventListener`` automatically registers the listener
    // so that the the handler can be deactivated using:
    // ``lively.removeEventListener("template", this)``
    // #Note 1
    // registering a closure instead of the function allows the class to make 
    // use of a dispatch at runtime. That means the ``onDblClick`` method can be
    // replaced during development
    
    this.get("#textField").value = this.getAttribute("data-mydata") || 0
  }
  
  setConnection(connection){
    this.connection = connection
    this.get("#connectionLabel").innerHTML = this.connection.connectionString()
    this.get("#sourceLabel").innerHTML = 'Source' + this.connection.getSource().toString()
    this.get("#targetLabel").innerHTML = 'Target' + this.connection.getTarget().toString()
  }
  
  onRemoveButton() {
    this.connection.removeAexpr()
  }
  
  onSaveButton() {
    this.connection.removeAexpr()
    lively.openInspector(this.get("#textField").value)
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value)
    //How to do that with connection?
  }
  
  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    this.setConnection(other.connection)
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    //this.style.backgroundColor = "lightgray"
    //this.someJavaScriptProperty = 42
    //this.appendChild(<div>This is my content</div>)
    this.setConnection(new Connection(1, 'width', 2, 'value', false))
  }
  
  
}