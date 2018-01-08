import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideInspector extends Morph {
  async initialize() {
  }
  
  inspect(widget) {
    this.get("#model-inspector").inspect(widget.raw_model);
  }
  
  livelyExample() {
    this.inspect(this)
  }
}