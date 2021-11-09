
import ValueNode from './value-node.js';
import EventEdge from './event-edge.js'
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
  
  additionalVisibilities() {
    return this.outs.filter(e => e instanceof EventEdge).map(e => e.to);
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