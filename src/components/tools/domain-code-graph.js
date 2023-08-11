import { Panning } from "src/client/html.js"
import Graph from "src/client/graphviz/graph.js"



/*MD
# DomainCodeGraph


<browse://src/client/graphviz/domain-code-graph.md>

MD*/

export default class DomainCodeGraph extends Graph {

  
  onSecondClick(evt, node) {
    lively.openInspector(this.getObject(node.key))
  } 
  
  async getForwardKeys(node) {
    var obj = this.getObject(node.key)
    var refs = obj.children
    if (obj.target) refs = refs.concat([obj.target])
    return refs.map(ea => this.getKey(ea))
  }

  async getBackwardKeys(node) {
    return [this.getKey(this.getObject(node.key).parent)]
  }
  
  getLabel(node) {
    if (!node.key) return "no_key"
    var obj = this.getObject(node.key)
    if (obj.constructor.name === "TreeSitterDomainObject") return obj.type
    return obj.constructor.name + "(" + obj.type + ")"
  }

  getKey(object) {
    if (!object) return "no_key"
    var key = this.keys.get(object)
    if (!key) {
      key = this.counter++ + "_" + object.type
      this.keys.set(object, key)
      this.objects.set(key, object)
    }
    return key
  }
  
  getObject(key) {
    return this.objects.get(key)
  }
  
  initialize(parameters) {
    super.initialize(parameters)
    this.keys = new Map()
    this.objects = new Map()
    this.counter = 0
    this.domainObject = parameters.domainObject
    this.key = this.getKey(parameters.domainObject)
  }

}
