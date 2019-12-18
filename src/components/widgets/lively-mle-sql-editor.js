"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import SocketIO from 'src/external/socketio.js';

export default class LivelyMleSqlEditor extends Morph {
  async initialize() {
    this.initialized = false;
    this.windowTitle = "Lively MLE SQL Editor";
    this.registerButtons()
    this.innerHTML = '';
    this.socket = SocketIO("http://132.145.55.192:8080");
    this.socket.emit('options',  {
      connectString: 'localhost:1521/MLE',
      user: 'system',
      password: 'MY_PASSWORD_123'
    });
    lively.notify('Connected');
    this.socket.on('busy', () => lively.warn('Resource currently busy'));
    this.socket.on('failure', err => lively.error('Resource failed processing', err));
    this.socket.on('success', () => {
      if(!this.initialized){
        this.initialized = true;
        lively.notify('Connected');
      }
      lively.success('Resource successfully processed');
    });
    this.socket.on('result', r => {result.innerHTML = r.rows ? JSON.stringify(r.rows): r.rowsAffected});
    const sql = <lively-code-mirror></lively-code-mirror>;
    const exec = <button id='execute' click={() => {
      lively.success('Resource successfully processed');
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