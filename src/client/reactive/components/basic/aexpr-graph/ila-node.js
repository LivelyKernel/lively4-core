
import ValueNode from './value-node.js';
import ILANodeExtension from './ila-node-extension.js'

export default class ILANode extends ValueNode {
  
  constructor(value, graph, layer) {
    super(value, graph);
    this.layer = layer;
    this.nodeOptions.fillcolor = 6;
    this.value = value;
    this.showValue = (this.value + "").length < 100;
  }    
  
  setAE(ilaAE) {
    if(!this.ilaAE) {      
      this.ilaAE = ilaAE;
      this.extensions.push(new ILANodeExtension(this.graph, this, ilaAE, this.layer));
    }    
  }
  
  isVisible() {
    return this.visible;
  }
      
  getInfo() {
    const data = [];
    data.push((this.ilaAE ? this.ilaAE.getSymbol() : "") + " Layer " + this.layer.name);
    if(this.layer._context) {
      data.push(this.layer._context);
    }
    return data;
  }
}