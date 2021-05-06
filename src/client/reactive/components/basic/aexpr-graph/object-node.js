
import GraphNode from './graph-node.js';
export default class ObjectNode extends GraphNode {
  
  constructor(object, identifier, onClickMap) {
    super(onClickMap);
    this.object = object;
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
    
  async onClick(event) {
    const timelineEvents = this.events.map(aeAndEvent => {
      const [ae, event] = aeAndEvent;
      return [event.value.lastValue + "=>" + event.value.value, (timeline) => {
        timeline.showEvents([event], ae);
      }]
    })
    this.constructContextMenu({object: this.object, dependency: this.dependency, events: this.events, hooks: this.dependency ? this.dependency.hooks : []}, this.locations, timelineEvents, event);
  }
  
  getInfo() {
    const info = [this.identifier];
    if(this.dependency) {
      info.push(this.dependency.contextIdentifierValue()[2] + "");
      info.push(this.dependency.type());
      info.push(this.pluralize(this.locations.length, "Location"));
    }
    if(this.events.length > 0) {
      info.push(this.pluralize(this.events.length, "Event"));
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
  
  pluralize(count, name) {
    return count + " " + name + (count > 1 ? "s" : "");
  }
}