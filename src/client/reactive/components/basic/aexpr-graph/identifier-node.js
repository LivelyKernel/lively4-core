
import GraphNode from './graph-node.js';
import ParentEdge from './parent-edge.js';
import AENodeExtension from './ae-node-extension.js'
import { toValueString } from '../aexpr-debugging-utils.js';

export default class IdentifierNode extends GraphNode {
  
  constructor(dependencyKey, graph, nodeOptions = {}) {
    super(graph, nodeOptions);
    this.nodeOptions.style = "filled";
    this.nodeOptions.colorscheme = "pastel19" 
    this.nodeOptions.fillcolor = "5"
    this.dependencyKey = dependencyKey;
    this.events = [];
    this.locations = [];
    this.outdated = false;
    this.deleted = false;
    this.databindings = new Set();
  }
  
  additionalVisibilities() {
    return this.outs.filter(e => e instanceof ParentEdge).map(e => e.to);
  }
  
  setDatabinding(databinding) {
    if(!this.databindings.has(databinding)) {
      this.databindings.add(databinding);
      this.extensions.push(new AENodeExtension(this.graph, this, databinding));
    }
  }
  
  resetDatabinding() {
    this.databindings = new Set();
    this.extensions = [];
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
    this.deleted = deleted;
    this.updateStyle();
  }
  
  setOutdated(outdated) {
    this.outdated = outdated;
    this.updateStyle();
  }
  
  hasDatabinding() {
    return this.databindings.size > 0;
  }
  
  isOutdated() {
    return this.outdated && !this.hasDatabinding();
  }
  
  updateStyle() {
    this.nodeOptions.penwidth = this.deleted ? 3 : 0.99; // Setting directly to one is disregareded by dot for some reason
    this.nodeOptions.color = (this.isOutdated() && !this.deleted) ? "9" : "black";
    this.nodeOptions.fillcolor = this.deleted ? "9" : "5";    
  }
  
  // return an Array of form {file, start, end}[]
  getLocations() {
    return this.locations;
  }
    
  async onClick(event, rerenderCallback) {
    const dependency = this.getDependency();
    this.constructContextMenu({dependencyKey: this.dependencyKey, hooks: dependency ? dependency.hooks : []}, [], event);
  }
  
  isPrimitive(object) {
    return object !== Object(object);
  }
  
  getInfo() {
    const info = [(this.hasDatabinding() ? ([...this.databindings].map(db => db.getSymbol()).join(" ") + " Signal ") : "") + this.dependencyKey.identifier];
    const dependency = this.getDependency();
    if(dependency) {
      info.push(dependency.type());
    }
    if(this.isOutdated()) {
      info.push("outdated");
    }
    if(!this.hasDatabinding()) {
      const value = this.dependencyKey.getValue();
      if(this.isPrimitive(value) && !((this.dependencyKey.context instanceof Map) || (this.dependencyKey.context instanceof Set))) {
        info.push("value: " + toValueString(value));
      }      
    } else {
      this.databindings.forEach(databinding => {
        info.push("always: " + databinding.getSourceCode());        
      })
    }
    return info;
  }
}