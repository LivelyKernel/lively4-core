
import GraphNode from './graph-node.js';
export default class ValueNode extends GraphNode {
  
  constructor(value, graph, isScope = false) {
    super(graph);
    this.rounded = true;
    this.value = value;
    this.showValue = (this.value + "").length < 100;
    this.isScope = isScope;
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
    if(this.isScope) {
      typeNameString = "Scope";
    } else if(valueType === "object") {
      typeNameString = this.value.constructor.name;
    } else if(valueType === "function") {
      typeNameString = "function: " + this.value.name || "anonymous";
    } else {
      typeNameString = valueType;      
    }
    data.push(typeNameString + "    " + (this.showValue ? "-" : "+"))
    if(this.showValue && !this.isScope) {
      data.push(this.value);
    }
    return data;
  }
}