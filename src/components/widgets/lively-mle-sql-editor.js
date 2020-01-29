"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {SocketSingleton} from 'src/components/mle/socket.js';

export default class LivelyMleSqlEditor extends Morph {
  async initialize() {
    this.initialized = false;
    this.windowTitle = "Lively MLE SQL Editor";
    this.registerButtons()
    this.innerHTML = '';
    this.socket = await SocketSingleton.get();
    this.socket.on('result', (r, status) => {
      if(status=== "executed"){
        result.innerHTML = r.rows ? JSON.stringify(r.rows): r.rowsAffected;
        lively.success('Resource successfully processed');
      }
    });
    const sql = <lively-code-mirror></lively-code-mirror>;
    const exec = <button id='execute'  class="button" click={() => {
      sql.then(e => {
        this.socket.emit('executeSQL', {
          sql: e.editor.getValue()
        });
    })}}>Execute</button>;
    const result = <textarea disabled></textarea>;
    const surrounding = <div>{sql}{exec}{result}</div>;
    this.appendChild(surrounding);
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
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.style.backgroundColor = "lightgray"
    this.someJavaScriptProperty = 42
  }
  
  
}