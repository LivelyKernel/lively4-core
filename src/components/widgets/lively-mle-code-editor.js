"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { SocketSingleton } from 'src/components/mle/socket.js';

export default class LivelyMleCodeEditor extends Morph {
  async initialize() {
    this.windowTitle = "MLE Code Editor";
    this.registerButtons();
    if(!(this.getAttribute("initSocket") === "false")) this.socket = await SocketSingleton.get();
  }

  onDeployButton() {
    this.loading = true;
    const editor = this.shadowRoot.getElementById("code");
    this._socket.emit('save', {
      file: editor.value
    });
  }
  
  async onResetButton(){
    this.loading = true;
    this.socket = await SocketSingleton.reset();
    this.loading = false;
  }
  
  set socket(v){
    this._socket = v;
    this.loading = true;
    this._socket.emit('read');
    this._socket.on('failure', m => {
      this.loading = false;
      this.shadowRoot.getElementById("result").innerHTML = m;
      this.shadowRoot.getElementById("result").className = "notification is-danger";
    });
    this._socket.on('busy', m => {
      this.loading = false;
    });
    this._socket.on('result', (r, status) => {
      if(status === "read"){
        this.loading = false;
        this.shadowRoot.getElementById("code").value = r;
      }
      if (status === "saved") {
        this._socket.emit('deploy', {
          connectionString: '132.145.55.192:1521/MLEEDITOR',
          user: 'system',
          password: 'MY_PASSWORD_123'
        });
        this.shadowRoot.getElementById("result").innerHTML = "Saved the code";
      }
      if (status === "deployed") {
        this.loading=false;
        this.shadowRoot.getElementById("result").innerHTML = "Deployed the code";
        this.shadowRoot.getElementById("result").classNames = "notification is-success";
      }
    });
  }

  set loading(v) {
    this.shadowRoot.getElementById("code").disabled = v;
    this.shadowRoot.getElementById("deployButton").disabled = v;
    this.shadowRoot.getElementById("deployButton").className = `button is-link ${v ? "is-loading" : ""}`;
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
    this.someJavaScriptProperty = other.som
  }
}
