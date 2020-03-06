"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {SocketSingleton} from 'src/components/mle/socket.js';

export default class LivelyMleTestCase extends Morph {
  async initialize() {
    this.windowTitle = "MLE Test Case Editor";
    this.socket = await SocketSingleton.get();
    this.shadowRoot.getElementById("tests").innerHTML = "";
    this.registerButtons();
    this.socket.on('failure', () => {
      this.loading = false;
    });
    this.socket.on('busy', m => {
      this.loading = false;
    });
    this.socket.on("result", (r, status) => {
      if(status === "multipleTests"){
        this.loading = false;
        const tests = this.shadowRoot.getElementById("tests").childNodes;
        for(const test of tests){
          test.result = r.find(res => res.id == test.id).result
        }
      }
      if(status === "gotTypes"){
        this.loading = false;
      }
      if(status==="deployed"){
        this.onExecuteButton()
      }
    });
  }
  
  deleteTest(id){
    const tests = this.shadowRoot.getElementById("tests");
    for(const test of tests.childNodes){
      if (test.id == id){
        tests.removeChild(test)
      }
    }
  }
  
  onAddButton(){
    this.loading = true;
    const tests = this.shadowRoot.getElementById("tests");
    const id = tests.childElementCount;
    <lively-mle-function-executor id={id} />.then(test => {
      test.onDeleteButton = () => this.deleteTest(id);
      tests.appendChild(test)
    });
  }
  
  onExecuteButton(){
    this.loading = true;
    const tests = this.shadowRoot.getElementById("tests").childNodes;
    let cases = [];
    for(const test of tests){
      cases.push({
        id: test.id,
        func: test.func,
        params: test.params
      })
    }
    this.socket.emit("multipleTests", cases);    
  }
  
  set loading(v) {
    const add = this.shadowRoot.getElementById("addButton");
    add.disabled = v;
    add.className= `button is-link ${v ? "is-loading" : ""}`;
    const exec = this.shadowRoot.getElementById("executeButton");
    exec.disabled = v;
    exec.className= `button is-pulled-right is-primary ${v ? "is-loading" : ""}`;
    const tests = this.shadowRoot.getElementById("tests").childNodes;
    for(const test of tests){
      test.loading = v;
    }
  }
  
  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
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