
import GraphNode from './graph-node.js';
import ILANodeExtension from './ila-node-extension.js'
import { isString } from 'utils'
import { toValueString } from '../aexpr-debugging-utils.js';
export default class ValueNode extends GraphNode {
  
  constructor(value, graph) {
    super(graph);
    this.nodeOptions.style = "filled";
    this.nodeOptions.colorscheme = "pastel19" 
    this.nodeOptions.fillcolor = "3"
    this.rounded = true;
    this.value = value;
    // this.showContent = (this.value + "").length < 100;
  }
  
  getInfo() {
    const data = [];
    if(this.layer) {
      data.push("Layer " + this.layer.name);
      if(this.layer._context) {
        data.push(this.layer._context);
      }
      return data;
    }
    const valueType = typeof this.value;
    let typeNameString = "";
    if(this.value.isScope) {
      return ["Scope"];
    } else if(valueType === "object") {
      typeNameString = this.value.constructor.name;
    } else if(valueType === "function") {
      typeNameString = "function: " + this.value.name || "anonymous";
    } else {
      typeNameString = valueType;      
    }
    data.push(typeNameString);
    data.push("value: " + toValueString(this.value));
    return data;
  }
}