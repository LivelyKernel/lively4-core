"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {SocketSingleton} from 'src/components/mle/socket.js';

export default class LivelyMleTableViewer extends Morph {
  async initialize() {
    this.windowTitle = "MLE Table Inspector";
    this.err = !(this.getAttribute("showError") === "false");
    this.registerButtons();
    this.socket = await SocketSingleton.get();
    this.socket.on('failure', m => {
      this.loading = false;
      if(this.err){
        this.shadowRoot.getElementById("result").innerHTML = m;
        this.shadowRoot.getElementById("result").className = "notification is-danger";
      }
    });
    this.socket.on('busy', m => {
      this.loading = false;
    });
    this.socket.on('result', (r,status) => {
      if(status === "gotTable"){
        this.data = r;
      }
      if(status === "executed"){
        this.onViewButton();
      }
    });
  }
  
  onViewButton(){
    this.loading = true;
    this.socket.emit('getTable', {
        table: this.shadowRoot.getElementById("table").value          
      });
  }
  
  set showError(v){
    this.err =v;
  }
  
  set data(r){
    this.loading = false;
    const result = this.shadowRoot.getElementById("result");
    result.innerHTML = "";
    result.className = "";
    result.appendChild(<table class="table is-hoverable is-fullwidth">
      <thead>
        <tr id="header">
        </tr>
      </thead>
      <tbody id="body"></tbody>

      <tfoot>
        <tr id="footer">
        </tr>
      </tfoot>
    </table>);
    const header = this.shadowRoot.getElementById("header");
    const footer = this.shadowRoot.getElementById("footer");
    const body = this.shadowRoot.getElementById("body");
    header.innerHTML = "";
    footer.innerHTML = "";
    body.innerHTML = "";
    r.metaData.forEach(k => {
      header.appendChild(<th>{k.name}</th>);
      footer.appendChild(<th>{k.name}</th>);
    });
    r.rows.forEach(r => {
      const row = <tr></tr>;
      r.forEach(v => row.appendChild(<td>{v}</td>));
      body.appendChild(row);
    });    
  }
  
  set loading(v){
    this.shadowRoot.getElementById("table").disabled = v;
    this.shadowRoot.getElementById("viewButton").disabled = v;
    this.shadowRoot.getElementById("viewButton").className = `button is-primary ${v ? "is-loading": ""}`;
  }
  
  set inputVisible(v){
    this.shadowRoot.getElementById("input").style.display = v ? "flex" :"none";
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
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
  }
  
  
}