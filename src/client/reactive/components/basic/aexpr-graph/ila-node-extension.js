
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
    let currentEvent = this.graph.getCurrentEvent()
    if (!currentEvent) return data
    const {ae, event} = currentEvent;
    if(ae === this.aexpr && event.type === "changed value") {
      if(event.value && event.value.value) {
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