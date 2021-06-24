
import GraphNode from './graph-node.js';
import { isString } from 'utils'
export default class ValueNode extends GraphNode {
  
  constructor(value, graph) {
    super(graph);
    this.nodeOptions.style = "filled";
    this.nodeOptions.colorscheme = "pastel19" 
    this.nodeOptions.fillcolor = "3"
    this.rounded = true;
    this.value = value;
    this.showValue = (this.value + "").length < 100;
  }
    
  
  onClick(clickEvent, rerenderCallback) {    
    this.constructContextMenu(this.value, [{name: (this.showValue ? "Show less" : "Show more"), callback: () => {
      this.showValue = !this.showValue;
      rerenderCallback()
    }}], clickEvent);
    
    return true;
  }
  
  getInfo() {
    const data = [];
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
    data.push(typeNameString + "    " + (this.showValue ? "-" : "+"))
    if(this.showValue) {
      data.push("value: " + this.toValueString(this.value));
    }
    return data;
  }
}