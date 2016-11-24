import Morph from './Morph.js';
import jsPlumb from "src/external/jsPlumb.js" 


// #TODO implement connections
export default class Connectors extends Morph {

  initialize() {
    jsPlumb.ready(() => {
      this.plumb = jsPlumb.getInstance()
      
      lively.notify("set blumb")
      // #TODO delay the "created" event... somehow
    })
  }

  connect(source, target) {
    return this.plumb.connect({
      source: source,
      target: target
    })
  }

}