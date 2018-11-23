import Morph from "src/components/widgets/lively-morph.js"
import d3 from "src/external/d3.v5.js"

import { debounce } from "utils";


export function walkTreeData(d, before, after) {
  if (before) before(d);
  if (d.children) {
    d.children.forEach(ea => {
      walkTreeData(ea, before, after)
    })
  } 
  if (after) after(d);
}

/* Abstract component */

export default class Component extends Morph {

  initialize() {
    this.d3 = d3 // for scripting...
    this.updateViz()
    this.options = {}
    this.addEventListener('extent-changed', ((evt) => {
      this.onExtentChanged(evt);
    })::debounce(500));
  }
  
  walkTreeData(d, before, after) {
    return walkTreeData(d, before, after)
  }
  
  getData() {
    return this.data
  }

  setData(data) {
    this.data = data;
    this.updateViz()
  }  
  
  dataColor(node) {
    if (this.options.color !== undefined) return this.options.color(node)
    return "gray"
  }

  dataWidth(node) {
    if (this.options.width !== undefined) return this.options.width(node)
    return 20
  }

  dataHeight(node) {
    if (this.options.height !== undefined) return this.options.height(node)
    return 40
  }
  
  dataFontsize(node) {
    if (this.options.fontsize !== undefined) return this.options.fontsize(node)
    return 10
  }
  
  onNodeClick(node, evt, element) {
    if (this.options.onclick) return this.options.onclick(node, evt, element)
    lively.notify("clicked on " + node.id)
  }
  
  updateViz() {
    throw new Error("subclass responsibility")
  }
  
  config(config) {
    Object.keys(config).forEach(key => {
      // lively.notify("key " + key) 
      this.options[key] = config[key] // we could check them here...      
    })
  }

  livelyInspect(contentNode, inspector) {
    if (this.data) {
      contentNode.appendChild(inspector.display(this.data, false, "#data", this));
    }
  }

  onExtentChanged() {
    // lively.notify("extent changed")
    this.updateViz()
  }

  livelyMigrate(other) {
    this.treeData = other.treeData
    this.options = other.options
  }

}
