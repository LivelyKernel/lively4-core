
import GraphNode from './graph-node.js';
export default class ObjectNode extends GraphNode {
  
  constructor(object, identifier, onClickMap) {
    super(onClickMap);
    this.object = object;
    this.identifier = identifier;
  }
  
  setDependency(dependency) {
    this.dependency = dependency;
  }
    
  async onClick(event) {
    const locations = this.dependency ? await Promise.all(this.dependency.getHooks().map(hook => hook.getLocations())) : [];
    this.constructContextMenu({object: this.object, dependency: this.dependency}, locations.flat(), event);
  }
  
  getInfo() {
    const info = [this.identifier];
    if(this.dependency) {
      info.push(this.dependency.contextIdentifierValue()[2] + "");
      info.push(this.dependency.type());
      info.push(this.dependency.hooks.length + " Hook" + (this.dependency.hooks.length > 1 ? "s" : ""));
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