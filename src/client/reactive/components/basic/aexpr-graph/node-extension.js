
export default class NodeExtension {
  
  constructor(graph, node) {
    this.graph = graph;
    this.node = node;
  }
  
  getLocations() {
    return [];
  }
  
  getOwnEvents() {
    return [];  
  }
  
  getCausedEvents() {
    return [];  
  }
    
  inspectionsObjects() {
    return [];
  }
  
  getInfo() {
    return [];
  }
}