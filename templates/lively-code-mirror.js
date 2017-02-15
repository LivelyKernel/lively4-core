import generateUUID from './../src/client/uuid.js';
import boundEval from './../src/client/code-evaluation/bound-eval.js';

import Morph from "./Morph.js"

export default class LivelyCodeMirror extends Morph {

  initialize() {
   }
  
  attachedCallback() {
   var text = this.childNodes[0];
    var container = this.container;
    var element = this;

    var value = (text && text.textContent) || this.value;

    this.editor = CodeMirror(this.get("#code-mirror-container"), {
      value: "function myScript(){return 100;}\n",
      mode:  "javascript"
    });  
  };

  detachedCallback() {
    this._attached = false;
  };

  attributeChangedCallback(attr, oldVal, newVal) {
    if(!this._attached){
        return false;
    }
  }
  
  get value() {
    return this.editor && this.editor.getValue()  
  }

  set value(text) {
    return this.editor && this.editor.setValue(text) 
  }

  livelyMigrate(other) {
    
    this.value = other.value
  }
  
}
