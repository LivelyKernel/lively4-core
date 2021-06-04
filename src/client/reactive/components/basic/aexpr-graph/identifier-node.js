
import GraphNode from './graph-node.js';
export default class IdentifierNode extends GraphNode {
  
  constructor(dependencyKey, graph, nodeOptions = {}) {
    super(graph, nodeOptions);
    this.dependencyKey = dependencyKey;
    this.events = [];
    this.locations = [];
    this.outdated = false;
  }
  
  getDependency() {
    return this.dependencyKey.getDependency();
  }
  
  async loadLocations() {
    const dependency = this.getDependency();
    if(dependency) {
      this.locations = (await Promise.all(dependency.getHooks().map(hook => hook.getLocations()))).flat();
    }
  }
  
  setDeleted(deleted) {
    if(deleted) this.visible = true;
    this.nodeOptions.penwidth = deleted ? 3 : 0.99; // Setting directly to one is disregareded by dot for some reason
    this.nodeOptions.color = deleted ? "gray" : "black";
    this.nodeOptions.fontcolor = deleted ? "gray" : "black";
  }
  
  setOutdated(outdated) {
    this.nodeOptions.style = outdated ? "dashed" : "solid";
    this.outdated = outdated;
  }
  
  resetEvents() {
    this.events.forEach(({aeNode}) => this.disconnectFrom(aeNode));
    this.events = [];
  }
  
  addEvent(ae, aeNode, event, isCurrent) {
    this.events.push({ae, aeNode, event, isCurrent});
    this.connectTo(aeNode, {color: isCurrent ? "red" : "blue", penwidth: isCurrent ? 3 : 0.99})
  }
  
  // return an Array of form {file, start, end}[]
  getLocations() {
    return this.locations;
  }
  
  // returns an Array of form [name, timelineCallback][]
  getTimelineEvents() {
    const timelineEvents = this.events.map(aeAndEvent => {
      const {ae, event} = aeAndEvent;
      return [event.value.lastValue + "=>" + event.value.value, (timeline) => {
        timeline.showEvents([event], ae);
      }]
    })
    return timelineEvents;
  }
    
  async onClick(event, rerenderCallback) {
    const dependency = this.getDependency();
    this.constructContextMenu({dependencyKey: this.dependencyKey, hooks: dependency ? dependency.hooks : []}, [], event);
  }
  
  isPrimitive(object) {
    return object !== Object(object);
  }
  
  getInfo() {
    const info = [this.dependencyKey.identifier + ""];
    const value = this.dependencyKey.getValue();
    if(this.isPrimitive(value) && !((this.dependencyKey.context instanceof Map) || (this.dependencyKey.context instanceof Set))) {
      info.push(value + "");
    }
    const dependency = this.getDependency();
    if(dependency) {
      info.push(dependency.type());
    }
    if(this.outdated) {
      info.push("outdated");
    }
    return info;
  }
  
  extractData(ae) {
    const data = [];

    data.push(ae.meta().get("id"));
    data.push(ae.meta().get("sourceCode"));
    const location = ae.meta().get("location");
    if (location) {
      const locationText = location.file.substring(location.file.lastIndexOf("/") + 1) + " line " + location.start.line;
      data.push(locationText);
    }
    return data;
  }
}