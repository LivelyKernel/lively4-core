import Morph from './Morph.js';
import jsPlumb from "src/external/jsPlumb.js" 


export default class Connectors extends Morph {

  initialize() {
    this.addEventListener("ready", (evt) => {
      this.onReady(evt)
    })    
    jsPlumb.ready(() => {
      this.plumb = jsPlumb.getInstance()

      this.dispatchEvent(new Event("ready"));
    })
  }
  
  onReady(evt) {
    // do nothing
  }

  ready(cb) {
    this.addEventListener("ready", cb)
  }

  connect(source, target) {
    return this.plumb.connect({
      source: source,
      target: target
    })
  }

}