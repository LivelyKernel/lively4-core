import Morph from 'src/components/widgets/lively-morph.js';

export default class AstInspector extends Morph {
  async initialize() {
    this.windowTitle = "AST Inspector";
    this.registerButtons()

    lively.html.registerKeys(this);
  }
  
  inspect(obj) {
    // #TODO
  }
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    
  }
}