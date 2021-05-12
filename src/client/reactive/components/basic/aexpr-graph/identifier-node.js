
import GraphNode from './graph-node.js';
export default class IdentifierNode extends GraphNode {
  
  constructor(identifier, graph, nodeOptions = {}) {
    super(graph, nodeOptions);
    this.identifier = identifier;
    this.events = [];
    this.locations = [];
  }
  
  async setDependency(dependency) {
    this.dependency = dependency;    
    this.locations = (await Promise.all(this.dependency.getHooks().map(hook => hook.getLocations()))).flat();
  }
  
  addEvent(ae, event) {
    this.events.push([ae, event]);
  }
  
  // return an Array of form {file, start, end}[]
  getLocations() {
    return this.locations;
  }
  
  // returns an Array of form [name, timelineCallback][]
  getTimelineEvents() {
    const timelineEvents = this.events.map(aeAndEvent => {
      const [ae, event] = aeAndEvent;
      return [event.value.lastValue + "=>" + event.value.value, (timeline) => {
        timeline.showEvents([event], ae);
      }]
    })
    return timelineEvents;
  }
    
  async onClick(event, rerenderCallback) {
    this.constructContextMenu({dependency: this.dependency, hooks: this.dependency ? this.dependency.hooks : []}, [], event);
  }
  
  isPrimitive(object) {
    return object !== Object(object);
  }
  
  getInfo() {
    const info = [this.identifier + ""];
    if(this.dependency) {
      const value = this.dependency.context[this.dependency.identifier]
      if(this.isPrimitive(value)) {
        info.push(value + "");
      }
      info.push(this.dependency.type());
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