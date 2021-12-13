
import AENodeExtension from './ae-node-extension.js';
export default class ILANodeExtension extends AENodeExtension {
  
  constructor(graph, node, aexpr, layer) {
    super(graph, node, aexpr);
    this.layer = layer;
  }
  
  inspectionsObjects() {
    return [this.aexpr, this.layer];
  }
  
  getInfo() {
    const data = [];
    const {ae, event} = this.graph.getCurrentEvent();
    if(ae === this.aexpr && event.type === "changed value") {
      if(event.value.value) {
        data.push("Just activated");
      } else {
        data.push("Just deactivated");
      }
    } else {
      data.push(this.graph.getCurrentValueFor(this.aexpr) ? "Active" : "Inactive");
    }
    return data;
  }
}