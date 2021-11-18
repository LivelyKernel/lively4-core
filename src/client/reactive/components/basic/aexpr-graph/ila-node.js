
import ValueNode from './value-node.js';
import ILANodeExtension from './ila-node-extension.js'

export default class ILANode extends ValueNode {
  
  constructor(value, graph, ilaAE, layer) {
    super(value, graph);
    this.layer = layer;
    this.nodeOptions.fillcolor = 6;
    this.extensions.push(new ILANodeExtension(this.graph, this, ilaAE, layer));
    this.value = value;
    this.showValue = (this.value + "").length < 100;
  }    
  
  isVisible() {
    return this.visible;
  }
      
  getInfo() {
    const data = [];
    data.push("Layer " + this.layer.name);
    if(this.layer._context) {
      data.push(this.layer._context);
    }
    return data;
  }
}