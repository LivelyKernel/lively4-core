"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {SocketSingleton} from 'src/components/mle/socket.js';

function paintResult(r){
  if(r.rows){
    return <lively-mle-table-viewer />.then(t => {
      t.inputVisible = false;
      t.data = r;
      return t;
    })
  }
  return Promise.resolve(<div class="notification is-success">Your query affected {r.rowsAffected} rows.</div>);
}

export default class LivelyMleSqlEditor extends Morph {
  async initialize() {
    this.initialized = false;
    this.windowTitle = "MLE SQL Editor";
    this.registerButtons();
    this.err = !(this.getAttribute("showError") === "false");
    if(!(this.getAttribute("initSocket") === "false")) this.socket = await SocketSingleton.get();
  }
  
  onExecuteButton(){
    this.loading = true;
    this.socket.emit('executeSQL', {
      sql: this.shadowRoot.getElementById("sql").value
    });
  }
  
  async onResetButton(){
    this.loading = true;
    this.socket = await SocketSingleton.reset();
    this.loading = false;
  }
  
  set socket(v){
    this.socket = v;
    const result = this.shadowRoot.getElementById("result");
    this.socket.on('failure', m => {
      this.loading = false;
      if(this.err){
        result.innerHTML = m;
        result.className = "notification is-danger";
      }
    })
    this.socket.on('busy', m => {
      this.loading = false;
    });
    this.socket.on('result', (r, status) => {
      if(status=== "executed"){
        result.innerHTML = ""
        this.loading = false;
        paintResult(r).then(e => result.appendChild(e));
      }
    });
  }
  
  set showError(v){
    this.err =v;
  }
  
  set loading(v){
    this.shadowRoot.getElementById("sql").disabled = v;
    this.shadowRoot.getElementById("executeButton").disabled = v;
    this.shadowRoot.getElementById("result").className = ""
    this.shadowRoot.getElementById("executeButton").className = `button is-link ${v ? "is-loading" : ""}`;
    this.shadowRoot.getElementById("resetButton").disabled = v;
    this.shadowRoot.getElementById("resetButton").className = `button is-warning ${v ? "is-loading" : ""}`;
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