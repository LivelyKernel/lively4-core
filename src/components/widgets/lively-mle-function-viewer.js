"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {SocketSingleton} from 'src/components/mle/socket.js';

export default class LivelyMleFunctionViewer extends Morph {
  async initialize() {
    this.windowTitle = "LivelyMleFunctionViewer";
    this.socket = SocketSingleton.get();
    this.socket.on("result", (r, status) => {
      if(status === "gotTypes") this.paintResult(r);
    });
    this.socket.emit("getTypes");
  }
  
  paintResult(result){
    function parseType(type) {
      switch(type){
        case 0: return "String";
        case 1: return "Number";
        default: return "";
      }
    }
    this.get("#content").innerHTML = result.map(o => `<div>
<p><b>${o.name}</b>: ${parseType(o.returnType)}</p>
${o.parameters.map(p => `<p>&emsp;${p.name}: ${parseType(p.type)}</p>`).join("")}</div>`);
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
  
  async livelyExample() {
  }
  
  
}