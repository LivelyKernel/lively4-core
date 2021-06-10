
import ValueNode from './value-node.js';
export default class CallbackNode extends ValueNode {
  
  constructor(value, graph, originalSource) {
    super(value, graph);
    this.nodeOptions.fillcolor = "4"
    if(originalSource) {
      this.originalSource = originalSource;
      this.showValue = (originalSource + "").length < 100;
    }
    this.events = [];
  }
  
  resetEvents() {
    this.events.forEach(({identifierNode, event}) => {
      this.disconnectFrom(identifierNode);
      if(event.value.parentAE) {
        const parentAENode = this.graph.getAENode(event.value.parentAE);
        parentAENode.disconnectFrom(this);
        parentAENode.connectTo(this, { color: "gray50" }, true)
      }
    });
    this.events = [];
  }
  
  addEvent(identifierNode, event, isCurrent) {
    if(event.value.parentAE) {
      const parentAENode = this.graph.getAENode(event.value.parentAE);
      parentAENode.connectTo(this, {color: isCurrent ? "red" : "blue", penwidth: isCurrent ? 3 : 0.99});
      this.connectTo(identifierNode, {color: isCurrent ? "red" : "blue", penwidth: isCurrent ? 3 : 0.99})
      this.events.push({identifierNode, event, isCurrent});
    }
  }
  
    
  getInfo() {
    const data = [];
    const valueType = typeof this.value;
    if(valueType !== "function") {
      lively.warn("callback is not a function");
      return data;
    }
    data.push("function: " + (this.value.name || "anonymous") + "    " + (this.showValue ? "-" : "+"))
    if(this.showValue) {
      data.push(this.originalSource || this.value);
    }
    return data;
  }
}