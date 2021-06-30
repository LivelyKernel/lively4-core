
import GraphNode from './graph-node.js';
export default class CombinedNode extends GraphNode {
  
  constructor(graph, nodes) {
    super(graph, Object.assign({}, ...nodes.map(node => node.nodeOptions)));
    this.nodes = nodes;
  }
  
  // return an Array of form {file, start, end}[]
  getLocations() {
    return this.nodes.flatMap(node => node.getLocations());
  }
  
  // returns an Array of form [name, timelineCallback][]
  getTimelineEvents() {
    return this.nodes.flatMap(node => node.getTimelineEvents());
  }
    
  onClick(clickEvent, rerenderCallback) {
    this.constructContextMenu(this.nodes, [], clickEvent);
    return false;
  }
  
  isVisible() {
    return this.nodes.some(node => node.isVisible());
  }
  
  getInfo() {
    return this.nodes.flatMap(node => node.getInfo());
  }
}