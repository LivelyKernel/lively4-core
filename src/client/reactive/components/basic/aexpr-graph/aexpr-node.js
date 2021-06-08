
import GraphNode from './graph-node.js';
export default class AExprNode extends GraphNode {
  
  constructor(aexpr, graph, nodeOptions = {}) {
    super(graph, nodeOptions);
    this.nodeOptions.style = "filled";
    this.nodeOptions.colorscheme = "pastel19" 
    this.nodeOptions.fillcolor = "2"
    this.aexpr = aexpr;
    this.dependencies = new Set();
  }
  
  // return an Array of form {file, start, end}[]
  getLocations() {
    return [this.aexpr.meta().get("location")];
  }
  
  // returns an Array of form [name, timelineCallback][]
  getTimelineEvents() {
    const timelineEvents = this.aexpr.meta().get("events")
      .filter((event) => event.value && event.value.dependency && event.type === "changed value")
      .map(event => [event.value.lastValue + "=>" + event.value.value, (timeline) => {
        timeline.showEvents([event], this.aexpr);
      }])
    return timelineEvents;
  }
    
  onClick(clickEvent, rerenderCallback) {
    this.constructContextMenu(this.aexpr, [], clickEvent);
    return false;
  }
  
  resetDependencies() {
    this.dependencies = new Set();
  }
  
  addDependency(identifierNode) {
    if(this.dependencies.has(identifierNode)) return;
    this.dependencies.add(identifierNode);
    this.connectTo(identifierNode, { color: "orangered4", penwidth: 0.99});
  }
  
  removeHighlight(identifierNode) {
    this.disconnectFrom(identifierNode);
    this.dependencies.delete(identifierNode);
    this.addDependency(identifierNode);
  }
  
  highlightDependency(identifierNode) {
    this.disconnectFrom(identifierNode);
    this.connectTo(identifierNode, {color: "red", penwidth: 3});
  }
  
  isVisible() {
    return this.visible;
  }
  
  getInfo() {
    const data = [];
    const location = this.aexpr.meta().get("location");
    if (location) {
      const locationText = location.file.substring(location.file.lastIndexOf("/") + 1) + " line " + location.start.line;
      data.push(locationText);
    } else {
      data.push(this.aexpr.id);
    }

    data.push(this.aexpr.meta().get("sourceCode") + "\n");
    return data;
  }
}