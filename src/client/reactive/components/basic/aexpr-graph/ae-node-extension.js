
import NodeExtension from './node-extension.js';
import { toValueString } from '../aexpr-debugging-utils.js';
export default class AENodeExtension extends NodeExtension {
  
  constructor(graph, node, aexpr) {
    super(graph, node);
    this.aexpr = aexpr;
  }
  
  // return an Array of form {file, start, end}[]
  getLocations() {
    return [this.aexpr.meta().get("location")];
  }
  
  getOwnEvents() {
    return this.aexpr.meta().get("events")
      .filter((event) => event.value && event.type === "changed value")
      .map(event => {return {event}});    
  }
    
  inspectionsObjects() {
    return [this.aexpr];
  }
  
  getInfo() {
    const data = [];
    const {ae, event} = this.graph.getCurrentEvent();
    if(ae === this.aexpr && event.type === "changed value") {
      data.push("value: " + toValueString(event.value.lastValue) + " -> " + toValueString(event.value.value));
    } else {
      data.push("value: " + toValueString(this.graph.getCurrentValueFor(this.aexpr)));
    }
    return data;
  }
}