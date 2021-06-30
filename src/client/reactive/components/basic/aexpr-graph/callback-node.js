
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
  
  /*addEvent(event, ae, other = undefined) {
    if(!this.events) this.events = [];
    this.events.push({ae, other, event});
    
    if(other) {
      this.addEdge(new EventEdge(this, other, this.graph));
      if(event.value.parentAE) {
        const parentAENode = this.graph.getAENode(event.value.parentAE);
        if(parentAENode) {
          parentAENode.addEdge(new EventEdge(parentAENode, this, this.graph, () => {return this.getEvents(other)}));
        }        
      }
    }
  }  */
    
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